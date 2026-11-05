import type { User } from "@supabase/supabase-js"
import type { MemberWithProfile } from "@/components/members/pessoas-secao"
import {
    lerLancamentosDoMes,
    lerLimites,
    type LancamentoDaPessoa,
    type LimiteDaPessoa,
} from "@/lib/limites/limites"
import { supabase, type WorkspaceInvite, type WorkspaceMember } from "@/lib/supabase"
import { describeSupabaseErrorForLog, formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { localYmdFromDate } from "@/lib/transaction-date"
import { isPostgrestTransientNetworkError } from "@/lib/transient-network-retry"

type MemberRow = Pick<WorkspaceMember, "workspace_id" | "user_id" | "role" | "joined_at">

type DirRow = {
    user_id: string
    email: string
    full_name: string | null
    avatar_url?: string | null
    avatar_color?: string | null
}

export type MembersPageBundle = {
    members: MemberWithProfile[]
    invites: WorkspaceInvite[]
    /** O mês (`YYYY-MM`) dos lançamentos lidos. */
    ym: string
    limites: LimiteDaPessoa[]
    lancamentos: LancamentoDaPessoa[]
    /** A leitura dos limites falhou (a tabela ainda não existe no banco). */
    limitesIndisponivel: boolean
    avisos: {
        /** O toast `members`: `null` some com ele. */
        carga: string | null
        /** O toast `members-directory`: `null` some com ele; `undefined` não mexe (membros não vieram). */
        diretorio?: string | null
    }
}

/**
 * Fallback when `workspace_member_directory` RPC is unavailable. Fills profile only for the current user (RLS on `profiles`).
 */
export function mergeMemberRowsForDisplay(rows: MemberRow[], currentUser: User | null): MemberWithProfile[] {
    return rows.map((m) => {
        if (currentUser?.id === m.user_id) {
            const meta = currentUser.user_metadata as Record<string, unknown> | undefined
            const fullName =
                (typeof meta?.full_name === "string" && meta.full_name) ||
                (typeof meta?.name === "string" && meta.name) ||
                null
            const avatarUrl = (typeof meta?.avatar_url === "string" && meta.avatar_url) || null
            return {
                ...m,
                profile: {
                    id: currentUser.id,
                    email: currentUser.email ?? "",
                    full_name: fullName,
                    avatar_url: avatarUrl,
                },
            }
        }
        return { ...m, profile: null }
    })
}

function membrosComDiretorio(rows: MemberRow[], dir: DirRow[], user: User | null): MemberWithProfile[] {
    const byUser = new Map(dir.map((row) => [row.user_id, row]))
    return rows.map((m) => {
        const row = byUser.get(m.user_id)
        if (!row) return mergeMemberRowsForDisplay([m], user)[0]
        return {
            ...m,
            profile: {
                id: m.user_id,
                email: row.email ?? "",
                full_name: row.full_name || null,
                avatar_url: row.avatar_url ?? null,
                avatar_color: row.avatar_color ?? null,
            },
        }
    })
}

/**
 * Tudo o que Membros mostra, numa rodada paralela só: membros, convites
 * pendentes, o diretório (nome/e-mail), os limites e os lançamentos do mês.
 * A tela aparece inteira quando isto resolve, e não aos pedaços.
 */
export async function fetchMembersPageBundle(workspaceId: string, user: User | null): Promise<MembersPageBundle> {
    const ym = localYmdFromDate(new Date()).slice(0, 7)

    const loadPair = () =>
        Promise.all([
            supabase
                .from("workspace_members")
                .select("workspace_id,user_id,role,joined_at")
                .eq("workspace_id", workspaceId),
            supabase
                .from("workspace_invites")
                .select("accepted_at, created_at, created_by, expires_at, id, invited_email, max_uses, role, status, usage_count, workspace_id")
                .eq("workspace_id", workspaceId)
                .eq("status", "pending")
                .order("created_at", { ascending: false }),
        ])

    // O builder do Supabase só dispara no `then`, por isso o `.then` já aqui.
    const dirPromise = supabase
        .rpc("workspace_member_directory", { p_workspace_id: workspaceId })
        .then((res) => res)
    const limitesPromise = Promise.all([lerLimites(workspaceId), lerLancamentosDoMes(workspaceId, ym)]).then(
        ([limites, lancamentos]) => ({ limites, lancamentos, indisponivel: false }),
        () => ({ limites: [] as LimiteDaPessoa[], lancamentos: [] as LancamentoDaPessoa[], indisponivel: true }),
    )

    let [membersRes, invitesRes] = await loadPair()
    const transient =
        (membersRes.error && isPostgrestTransientNetworkError(membersRes.error)) ||
        (invitesRes.error && isPostgrestTransientNetworkError(invitesRes.error))
    if (transient) {
        ;[membersRes, invitesRes] = await loadPair()
    }

    if (membersRes.error) {
        console.error("Members fetch error:", describeSupabaseErrorForLog(membersRes.error))
    }
    if (invitesRes.error) {
        console.error("Invites fetch error:", describeSupabaseErrorForLog(invitesRes.error))
    }

    const errParts: string[] = []
    if (membersRes.error) {
        errParts.push(`Membros: ${formatSupabasePostgrestError(membersRes.error) ?? "não foi possível carregar"}`)
    }
    if (invitesRes.error) {
        errParts.push(`Convites: ${formatSupabasePostgrestError(invitesRes.error) ?? "não foi possível carregar"}`)
    }

    const [dirRes, limites] = await Promise.all([dirPromise, limitesPromise])

    let members: MemberWithProfile[] = []
    let diretorio: string | null | undefined
    if (membersRes.data) {
        if (dirRes.error) {
            diretorio =
                "Não foi possível carregar nome/e-mail dos membros. Aplique `supabase/workspace-member-directory.sql` (e `profiles-avatar-color.sql`) no Supabase e recarregue o schema."
            // Show at least the current user (metadata) so the screen isn't empty.
            members = mergeMemberRowsForDisplay(membersRes.data, user)
        } else if (!Array.isArray(dirRes.data) || dirRes.data.length === 0) {
            diretorio =
                "Diretório de membros retornou vazio. Verifique se você executou `workspace-member-directory.sql` e se as políticas/RPC estão ativas."
            members = mergeMemberRowsForDisplay(membersRes.data, user)
        } else {
            diretorio = null
            members = membrosComDiretorio(membersRes.data, dirRes.data as DirRow[], user)
        }
    }

    return {
        members,
        invites: (invitesRes.data ?? []) as WorkspaceInvite[],
        ym,
        limites: limites.limites,
        lancamentos: limites.lancamentos,
        limitesIndisponivel: limites.indisponivel,
        avisos: { carga: errParts.length > 0 ? errParts.join(" · ") : null, diretorio },
    }
}
