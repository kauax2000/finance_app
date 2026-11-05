"use client"

import {
    EmptyState,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { MembersSectionSkeleton } from "@/components/members/members-section-skeleton"
import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { UserPlusIcon } from "@heroicons/react/16/solid"
import {
    EnvelopeIcon as EnvelopeOutlineIcon,
    UserGroupIcon,
    WalletIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, WorkspaceInvite, WorkspaceMember } from "@/lib/supabase"
import { describeSupabaseErrorForLog, formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { isPostgrestTransientNetworkError } from "@/lib/transient-network-retry"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { ConvitesPendentesSecao } from "@/components/members/convites-pendentes-secao"
import { LimitesSecao } from "@/components/members/limites-secao"
import { memberDisplayName, PessoasSecao, type MemberWithProfile } from "@/components/members/pessoas-secao"
import { WorkspaceInviteDialog } from "@/components/members/workspace-invite-dialog"
import { rotuloDoPapel } from "@/lib/papeis/papeis"
import {
    dismissPageFetchError,
    toastError,
    toastPageFetchError,
    toastSuccess,
} from "@/lib/toast"
import { Card, CardContent, CardNote } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader, PageHeaderActions, PageHeaderTitle, PageHeaderTitleRow } from "@/components/ui/page-header"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    dispatchFinanceMembersMutated,
    FINANCE_MEMBERS_MUTATED_EVENT,
} from "@/lib/workspace-data-events"

/**
 * Fallback when `workspace_member_directory` RPC is unavailable. Fills profile only for the current user (RLS on `profiles`).
 */
function mergeMemberRowsForDisplay(
    rows: Pick<WorkspaceMember, "workspace_id" | "user_id" | "role" | "joined_at">[],
    currentUser: User | null
): MemberWithProfile[] {
    return rows.map((m) => {
        if (currentUser?.id === m.user_id) {
            const meta = currentUser.user_metadata as Record<string, unknown> | undefined
            const fullName =
                (typeof meta?.full_name === "string" && meta.full_name) ||
                (typeof meta?.name === "string" && meta.name) ||
                null
            const avatarUrl =
                (typeof meta?.avatar_url === "string" && meta.avatar_url) || null
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

const membersPageSkeleton = (
    <div className="min-w-0 max-w-full space-y-5" role="status" aria-busy="true" aria-label="Carregando membros">
        <MembersSectionSkeleton />
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-end justify-between gap-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24 shrink-0" />
            </div>
            <Card padding="none">
                <CardContent className="flex flex-col">
                    <ul className="divide-y divide-border" role="list">
                        {[1, 2].map((i) => (
                            <li key={i} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                    <Skeleton className="size-9 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48 max-w-full" />
                                        <Skeleton className="h-3 w-36 max-w-full" />
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <Skeleton className="h-8 w-28 rounded-full" />
                                    <Skeleton className="h-8 w-32 rounded-full" />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <CardNote className="items-center gap-1.5 py-2.5">
                        <Skeleton className="size-3 shrink-0 rounded" />
                        <Skeleton className="h-3 w-36" />
                    </CardNote>
                </CardContent>
            </Card>
        </div>
    </div>
)

export default function MembersPage() {
    const { user, loading: authLoading } = useAuth()
    const {
        currentWorkspaceId,
        isWorkspaceOwner,
        isAdulto,
        loading: workspaceLoading,
    } = useWorkspace()
    const isMobile = useIsMobile()
    const [members, setMembers] = useState<MemberWithProfile[]>([])
    const [invites, setInvites] = useState<WorkspaceInvite[]>([])
    const [loading, setLoading] = useState(true)
    const [convidarAberto, setConvidarAberto] = useState(false)
    const [busyInviteId, setBusyInviteId] = useState<string | null>(null)
    const [busyResendInviteId, setBusyResendInviteId] = useState<string | null>(
        null,
    )
    const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<{
        userId: string
        name: string
        email: string
    } | null>(null)

    const canManageMembers = Boolean(currentWorkspaceId && isWorkspaceOwner(currentWorkspaceId))

    const fetchMembersAndInvites = useCallback(async () => {
        if (!currentWorkspaceId) return

        const loadPair = () =>
            Promise.all([
                supabase
                    .from("workspace_members")
                    .select("workspace_id,user_id,role,joined_at")
                    .eq("workspace_id", currentWorkspaceId),
                supabase
                    .from("workspace_invites")
                    .select("accepted_at, created_at, created_by, expires_at, id, invited_email, max_uses, role, status, usage_count, workspace_id")
                    .eq("workspace_id", currentWorkspaceId)
                    .eq("status", "pending")
                    .order("created_at", { ascending: false }),
            ])

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
        const membersMsg = membersRes.error
            ? (formatSupabasePostgrestError(membersRes.error) ?? "não foi possível carregar")
            : null
        const invitesMsg = invitesRes.error
            ? (formatSupabasePostgrestError(invitesRes.error) ?? "não foi possível carregar")
            : null
        if (membersMsg) errParts.push(`Membros: ${membersMsg}`)
        if (invitesMsg) errParts.push(`Convites: ${invitesMsg}`)
        if (errParts.length > 0) {
            toastPageFetchError("members", errParts.join(" · "))
        } else {
            dismissPageFetchError("members")
        }

        if (membersRes.data) {
            const dirRes = await supabase.rpc("workspace_member_directory", {
                p_workspace_id: currentWorkspaceId,
            })

            if (dirRes.error) {
                toastPageFetchError(
                    "members-directory",
                    "Não foi possível carregar nome/e-mail dos membros. Aplique `supabase/workspace-member-directory.sql` (e `profiles-avatar-color.sql`) no Supabase e recarregue o schema.",
                )
                // Show at least the current user (metadata) so the screen isn't empty.
                setMembers(mergeMemberRowsForDisplay(membersRes.data, user))
            } else if (!Array.isArray(dirRes.data) || dirRes.data.length === 0) {
                toastPageFetchError(
                    "members-directory",
                    "Diretório de membros retornou vazio. Verifique se você executou `workspace-member-directory.sql` e se as políticas/RPC estão ativas.",
                )
                setMembers(mergeMemberRowsForDisplay(membersRes.data, user))
            } else {
                dismissPageFetchError("members-directory")
                type DirRow = {
                    user_id: string
                    email: string
                    full_name: string | null
                    avatar_url?: string | null
                    avatar_color?: string | null
                }
                const rows = dirRes.data as DirRow[]
                const byUser = new Map(rows.map((row) => [row.user_id, row]))
                const merged = membersRes.data.map((m) => {
                    const row = byUser.get(m.user_id)
                    if (row) {
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
                    }
                    return mergeMemberRowsForDisplay([m], user)[0]
                })
                setMembers(merged)
            }
        }
        if (invitesRes.data) {
            setInvites(invitesRes.data as WorkspaceInvite[])
        }

        setLoading(false)
    }, [currentWorkspaceId, user])

    useEffect(() => {
        if (authLoading || workspaceLoading) return
        if (!currentWorkspaceId) {
            setLoading(false)
            return
        }
        void fetchMembersAndInvites()
    }, [authLoading, workspaceLoading, currentWorkspaceId, fetchMembersAndInvites])

    useEffect(() => {
        const onMutated = () => {
            void fetchMembersAndInvites()
        }
        window.addEventListener(FINANCE_MEMBERS_MUTATED_EVENT, onMutated)
        return () =>
            window.removeEventListener(FINANCE_MEMBERS_MUTATED_EVENT, onMutated)
    }, [fetchMembersAndInvites])

    const handleTrocarPapel = async (pessoa: MemberWithProfile, papel: "member" | "guest") => {
        if (!currentWorkspaceId || !canManageMembers) return
        const userId = pessoa.user_id
        const id = `trocar-papel:${userId}`
        setBusyMemberId(userId)
        const { error } = await supabase.rpc("trocar_papel", {
            p_workspace_id: currentWorkspaceId,
            p_user_id: userId,
            p_role: papel,
        })
        if (error) {
            toastError(formatSupabasePostgrestError(error) ?? "Não foi possível trocar o papel.", { id })
        } else {
            toastSuccess(`${memberDisplayName(pessoa)} agora é ${rotuloDoPapel(papel).toLowerCase()}.`, { id })
            dispatchFinanceMembersMutated()
        }
        await fetchMembersAndInvites()
        setBusyMemberId(null)
    }

    const handleResendInvite = async (inviteId: string) => {
        if (!currentWorkspaceId || !canManageMembers) return
        setBusyResendInviteId(inviteId)
        try {
            await invokeEdgeJson("workspace-invites-resend", {
                body: {
                    workspace_id: currentWorkspaceId,
                    invite_id: inviteId,
                },
            })
            toastSuccess("Convite reenviado por e-mail", { id: `reenviar-convite:${inviteId}` })
        } catch (error) {
            console.error("Error resending invite:", error)
            toastError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível reenviar o convite",
                { id: `reenviar-convite:${inviteId}` },
            )
        } finally {
            setBusyResendInviteId(null)
        }
    }

    const { confirm: confirmRevoke, dialog: revokeConfirmDialog } = useConfirmDialog()
    const handleRevokeInvite = async (inviteId: string) => {
        if (!canManageMembers) {
            toastError("Só o owner pode revogar convites")
            return
        }
        const ok = await confirmRevoke({
            title: "Revogar o convite?",
            description: "O link ou o e-mail enviado deixa de funcionar.",
            actionLabel: "Revogar",
        })
        if (!ok) return
        setBusyInviteId(inviteId)
        const { error } = await supabase
            .from("workspace_invites")
            .update({ status: "revoked" })
            .eq("id", inviteId)

        if (error) {
            toastError("Não foi possível revogar o convite", { id: `revogar-convite:${inviteId}` })
        } else {
            toastSuccess("Convite revogado", { id: `revogar-convite:${inviteId}` })
            dispatchFinanceMembersMutated()
        }
        await fetchMembersAndInvites()
        setBusyInviteId(null)
    }

    const handleRemoveMember = async (memberUserId: string) => {
        if (!currentWorkspaceId) return
        if (!canManageMembers) {
            toastError("Só o owner pode remover membros")
            return
        }

        setBusyMemberId(memberUserId)
        const { error } = await supabase
            .from("workspace_members")
            .delete()
            .eq("workspace_id", currentWorkspaceId)
            .eq("user_id", memberUserId)

        if (error) {
            toastError("Não foi possível remover o membro", { id: `remover-membro:${memberUserId}` })
        } else {
            toastSuccess("Membro removido", { id: `remover-membro:${memberUserId}` })
        }
        await fetchMembersAndInvites()
        setBusyMemberId(null)
    }

    const openRemoveMemberDialog = (args: {
        userId: string
        name: string
        email: string
    }) => {
        setRemoveTarget(args)
        setRemoveDialogOpen(true)
    }

    if (authLoading || workspaceLoading) {
        return membersPageSkeleton
    }

    if (!user) {
        return null
    }

    if (!currentWorkspaceId) {
        return (
            <Card padding="none">
                <CardContent
                    className="px-4 py-12 md:py-14"
                    role="status"
                    aria-live="polite"
                >
                    <EmptyState variant="plain" size="lg">
                        <EmptyStateIcon variant="stack">
                            <WalletIcon aria-hidden />
                            <UserGroupIcon aria-hidden />
                            <EnvelopeOutlineIcon aria-hidden />
                        </EmptyStateIcon>
                        <EmptyStateTitle>Nenhuma carteira selecionada</EmptyStateTitle>
                        <EmptyStateDescription>
                            Selecione uma carteira no menu lateral para gerenciar membros e convites.
                        </EmptyStateDescription>
                    </EmptyState>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return membersPageSkeleton
    }

    // Convidar é só do dono.
    const botaoConvidar = (className?: string) =>
        canManageMembers ? (
            <Button type="button" variant="primary" className={className} onClick={() => setConvidarAberto(true)}>
                <UserPlusIcon aria-hidden />
                Convidar pessoa
            </Button>
        ) : null

    return (
        <div className="min-w-0 max-w-full space-y-5">
            {revokeConfirmDialog}
            <AlertDialog
                pending={Boolean(removeTarget && busyMemberId === removeTarget.userId)}
                open={removeDialogOpen}
                onOpenChange={(open) => {
                    setRemoveDialogOpen(open)
                    if (!open) setRemoveTarget(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover membro</AlertDialogTitle>
                        <AlertDialogDescription>
                            {removeTarget ? (
                                <>
                                    Tem certeza que deseja remover{" "}
                                    <span className="font-medium">
                                        {removeTarget.name}
                                    </span>{" "}
                                    ({removeTarget.email || "e-mail indisponível"}) desta
                                    carteira?
                                </>
                            ) : (
                                "Tem certeza que deseja remover este membro?"
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Removendo…"
                            onClick={(e) => {
                                // Fica aberto enquanto remove; fecha quando termina.
                                e.preventDefault()
                                if (!removeTarget) return
                                void handleRemoveMember(removeTarget.userId).then(() => {
                                    setRemoveDialogOpen(false)
                                })
                            }}
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isMobile ? (
                // No telefone o título é o da casca (`TituloDaTela`); o convite vem logo abaixo.
                botaoConvidar("w-full")
            ) : (
                <PageHeader collapse>
                    <PageHeaderTitleRow>
                        <PageHeaderTitle asChild>
                            {/* O `<h1>` da página é o da barra do topo. */}
                            <p aria-hidden="true">Membros e convidados</p>
                        </PageHeaderTitle>
                    </PageHeaderTitleRow>
                    {canManageMembers ? <PageHeaderActions>{botaoConvidar()}</PageHeaderActions> : null}
                </PageHeader>
            )}

            <WorkspaceInviteDialog
                open={convidarAberto}
                onOpenChange={(aberto) => {
                    setConvidarAberto(aberto)
                    if (!aberto) void fetchMembersAndInvites()
                }}
                user={user}
                workspaceId={currentWorkspaceId}
                canManageMembers={canManageMembers}
            />

            <PessoasSecao
                pessoas={members}
                meuUserId={user.id}
                podeGerenciar={canManageMembers}
                onTrocarPapel={(pessoa, papel) => void handleTrocarPapel(pessoa, papel)}
                onRemover={(pessoa) =>
                    openRemoveMemberDialog({
                        userId: pessoa.user_id,
                        name: memberDisplayName(pessoa),
                        email: pessoa.profile?.email || "",
                    })
                }
                ocupadoId={busyMemberId}
            />

            <div
                id="workspace-invites"
                className="min-w-0 scroll-mt-[calc(var(--mobile-header-offset)+0.5rem)] md:scroll-mt-6"
            >
                <ConvitesPendentesSecao
                    convites={invites}
                    podeGerenciar={canManageMembers}
                    onReenviar={(convite) => void handleResendInvite(convite.id)}
                    onCancelar={(convite) => void handleRevokeInvite(convite.id)}
                    // O link não fica salvo (só o hash do token): copiar é gerar outro, no diálogo.
                    onCopiarLink={() => setConvidarAberto(true)}
                    ocupadoId={busyInviteId ?? busyResendInviteId}
                />
            </div>

            {isAdulto ? (
                <div
                    id="limites"
                    className="min-w-0 scroll-mt-[calc(var(--mobile-header-offset)+0.5rem)] md:scroll-mt-6"
                >
                    <LimitesSecao
                        workspaceId={currentWorkspaceId}
                        pessoas={members.map((m) => ({ user_id: m.user_id, nome: memberDisplayName(m) }))}
                        podeEditar={canManageMembers}
                    />
                </div>
            ) : null}
        </div>
    )
}
