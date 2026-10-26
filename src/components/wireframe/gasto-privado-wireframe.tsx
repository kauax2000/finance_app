"use client"

import { useQuery } from "@tanstack/react-query"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { useMemberDirectoryQuery, type MemberDirectoryRow } from "@/lib/queries/use-member-directory"
import { supabase } from "@/lib/supabase"

const campo = "border border-muted-foreground/60 bg-transparent px-1 text-foreground"

/** O nome do adulto, como o Painel o escreve: nome, o começo do e-mail, ou "Membro". */
function nomeDoMembro(m: Pick<MemberDirectoryRow, "full_name" | "email"> | undefined): string {
    const nome = m?.full_name?.trim()
    if (nome) return nome
    return m?.email?.trim().split("@")[0] || "Membro"
}

/**
 * O titular do cartão, no formulário do cartão. Só o dono da carteira o vê
 * (Ruling 4), e a lista é dos adultos dela. Nulo é o "cartão da casa".
 */
export function TitularDoCartaoWireframe({
    valor,
    onChange,
    disabled,
}: {
    valor: string | null
    onChange: (v: string | null) => void
    disabled?: boolean
}) {
    const { currentWorkspaceId, papel } = useWorkspace()
    const dono = papel === "owner"
    const diretorio = useMemberDirectoryQuery(dono ? currentWorkspaceId : null)
    const adultos = useQuery({
        queryKey: ["titulares-do-cartao", currentWorkspaceId],
        enabled: dono && Boolean(currentWorkspaceId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("workspace_members")
                .select("user_id")
                .eq("workspace_id", currentWorkspaceId!)
                .in("role", ["owner", "member"])
            if (error) throw error
            return (data ?? []).map((m) => m.user_id as string)
        },
    })
    if (!dono) return null

    const nome = (id: string) => nomeDoMembro(diretorio.data?.find((m) => m.user_id === id))
    const ids = adultos.data ?? []

    return (
        <WireframeBox bloco={7} titulo="Titular do cartão">
            <label className="flex flex-wrap items-center gap-2 text-foreground">
                Titular
                <select
                    className={campo}
                    value={valor ?? ""}
                    disabled={disabled || adultos.isPending}
                    onChange={(e) => onChange(e.target.value || null)}
                >
                    <option value="">Cartão da casa (sem titular)</option>
                    {ids.map((id) => (
                        <option key={id} value={id}>
                            {nome(id)}
                        </option>
                    ))}
                    {valor && !adultos.isPending && !ids.includes(valor) ? (
                        <option value={valor}>{nome(valor)} (fora da carteira)</option>
                    ) : null}
                </select>
            </label>
            {adultos.isError ? <p role="alert">Não foi possível carregar os adultos da carteira.</p> : null}
            <p>
                Com titular, a fatura do banco e a conferência ficam só com o titular e o dono.
            </p>
        </WireframeBox>
    )
}
