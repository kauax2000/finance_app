"use client"

import { useQuery } from "@tanstack/react-query"
import { useId } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { MASCARA_PRIVADA } from "@/lib/privado/detalhes"
import type { PodeSerPrivado } from "@/lib/privado/pode-ser-privado"
import { nomeDoMembro } from "@/lib/privado/use-rotulo-da-transacao"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { supabase } from "@/lib/supabase"

const campo = "border border-muted-foreground/60 bg-transparent px-1 text-foreground"

/**
 * A chave "Privado" do lançamento (Bloco 7B). Quando não vale, fica
 * desabilitada com o motivo embaixo: a mesma regra do gatilho
 * (`podeSerPrivado`), dita antes de salvar. Na privada cuja regra deixou de
 * valer (Ruling 10), o salvar fica preso até a autora corrigir o método ou
 * tocar em "Deixar de ser privado": nada é desmarcado por ela.
 */
export function PrivadoWireframe({
    marcado,
    onChange,
    regra,
    eraPrivada = false,
}: {
    marcado: boolean
    onChange: (v: boolean) => void
    regra: PodeSerPrivado
    eraPrivada?: boolean
}) {
    const motivoId = useId()
    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const diretorio = useMemberDirectoryQuery(currentWorkspaceId)
    const meuNome = nomeDoMembro(diretorio.data?.find((m) => m.user_id === user?.id))
    const presa = eraPrivada && marcado && !regra.pode
    const desmarcadaAqui = eraPrivada && !marcado && !regra.pode
    return (
        <WireframeBox bloco={7} titulo="Gasto privado">
            <label className="flex items-center gap-2 text-foreground">
                <input
                    type="checkbox"
                    checked={marcado && (regra.pode || presa)}
                    disabled={!regra.pode}
                    aria-describedby={motivoId}
                    onChange={(e) => onChange(e.target.checked)}
                />
                Privado
            </label>
            <p id={motivoId} role={presa ? "alert" : undefined}>
                {regra.pode
                    ? `Os outros adultos veem só "${MASCARA_PRIVADA} de ${meuNome}" e o valor; o valor entra em todos os totais.`
                    : presa
                      ? `Este gasto não pode mais ser privado: ${regra.motivo} Corrija a forma de pagamento ou deixe de ser privado para salvar.`
                      : desmarcadaAqui
                        ? "Ao salvar, deixa de ser privado: a descrição e a categoria voltam a aparecer para os outros adultos."
                        : regra.motivo}
            </p>
            {presa ? (
                <button
                    type="button"
                    className="border border-muted-foreground/60 px-2 text-foreground"
                    onClick={() => onChange(false)}
                >
                    Deixar de ser privado
                </button>
            ) : null}
        </WireframeBox>
    )
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
                Com titular, a fatura do banco e a conferência ficam só com o titular e o dono, e o titular pode marcar
                compras do cartão como privadas.
            </p>
        </WireframeBox>
    )
}
