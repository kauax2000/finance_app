"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useSyncExternalStore } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { useWorkspaceNotificationPrefs } from "@/hooks/use-workspace-notification-prefs"
import { canaisPara, concluirJornada, plataformaDe, proximosAvisos, type Plataforma } from "@/lib/jornada/jornada"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const link = "text-foreground underline"

const PASSOS = ["O que eu lanço por você", "Como eu decido", "O que eu aviso", "Quem vê o quê"] as const

/** O que o papel de hoje pode, das linhas do §12 que já valem (dono e membro). */
const PAPEIS: Array<[string, string, string]> = [
    ["Lançar despesa", "sim", "sim"],
    ["Ver transações", "todas", "todas"],
    ["Editar e excluir", "tudo", "tudo"],
    ["Categorias e cartões", "gerencia", "gerencia"],
    ["Convites e membros", "gerencia", "não"],
]

const semAssinatura = () => () => {}
function usePlataforma(): Plataforma {
    return useSyncExternalStore(
        semAssinatura,
        () => plataformaDe(navigator.userAgent),
        () => "computador",
    )
}

/** Os cartões e a próxima conta em aberto da carteira, para a tabela de avisos. */
function useDadosDosAvisos(workspaceId: string | null) {
    return useQuery({
        queryKey: ["jornada", "avisos", workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const ws = workspaceId as string
            const [cartoes, contas] = await Promise.all([
                supabase.from("credit_cards").select("name, closing_day, due_day").eq("workspace_id", ws),
                supabase
                    .from("bill_instances")
                    .select("due_date, bills(name)")
                    .eq("workspace_id", ws)
                    .eq("status", "pending")
                    .order("due_date", { ascending: true })
                    .limit(1),
            ])
            if (cartoes.error) throw cartoes.error
            if (contas.error) throw contas.error
            const conta = contas.data?.[0] as { due_date: string; bills: { name: string } | { name: string }[] | null } | undefined
            const nomeDaConta = Array.isArray(conta?.bills) ? conta?.bills[0]?.name : conta?.bills?.name
            return {
                cartoes: (cartoes.data ?? []).map((c) => ({ nome: c.name, closingDay: c.closing_day, dueDay: c.due_day })),
                proximaConta: conta ? { nome: nomeDaConta ?? "Conta", data: conta.due_date } : null,
            }
        },
    })
}

/**
 * A jornada de 4 passos (Bloco 4): o que o app faz sozinho. "Concluir" e "Pular"
 * gravam `jornada_concluida_em` e levam ao Painel.
 */
export function JornadaWireframe() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const plataforma = usePlataforma()
    const { prefs } = useWorkspaceNotificationPrefs()
    const dados = useDadosDosAvisos(currentWorkspaceId)
    const [passo, setPasso] = useState(0)
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function sair() {
        setPendente(true)
        setErro(null)
        try {
            await concluirJornada()
            await queryClient.invalidateQueries({ queryKey: ["jornada", "concluida", user?.id] })
            router.push(ROUTES.DASHBOARD)
        } catch (e) {
            setErro(formatSupabasePostgrestError(e) ?? (e instanceof Error ? e.message : "Não foi possível concluir."))
            setPendente(false)
        }
    }

    const avisos = proximosAvisos({
        prefs: (prefs ?? {}) as unknown as Record<string, boolean>,
        cartoes: dados.data?.cartoes ?? [],
        proximaConta: dados.data?.proximaConta ?? null,
        hoje: new Date(),
    })
    const ultimo = passo === PASSOS.length - 1

    return (
        <WireframeBox bloco={4} titulo="Jornada">
            <p>
                Passo {passo + 1} de {PASSOS.length}
            </p>
            <h2 className="font-bold text-foreground">{PASSOS[passo]}</h2>

            {passo === 0 ? (
                <ul className="space-y-2">
                    {canaisPara(plataforma).map((c) => (
                        <li key={c.titulo}>
                            <Link href={c.href} className={link}>
                                {c.titulo}
                            </Link>
                            <p>{c.texto}</p>
                        </li>
                    ))}
                </ul>
            ) : null}

            {passo === 1 ? (
                <div className="space-y-2">
                    <p>A categoria vem do histórico: se você já lançou uma descrição parecida, repito a categoria dela.</p>
                    <p>Na dúvida, não chuto: o item vai para a lista de itens a conferir, e você confirma com um toque.</p>
                    <Link href="/transactions?conferir=1" className={link}>
                        Ver a lista &quot;A conferir&quot;
                    </Link>
                </div>
            ) : null}

            {passo === 2 ? (
                <div className="space-y-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="pr-3">Aviso</th>
                                <th className="pr-3">Ligado</th>
                                <th>Próximo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {avisos.map((a) => (
                                <tr key={a.aviso}>
                                    <td className="pr-3 text-foreground">{a.aviso}</td>
                                    <td className="pr-3">{a.ligado ? "sim" : "não"}</td>
                                    <td>{a.proximo ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Link href={ROUTES.SETTINGS} className={link}>
                        Ajustar as preferências de aviso
                    </Link>
                </div>
            ) : null}

            {passo === 3 ? (
                <div className="space-y-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="pr-3" />
                                <th className="pr-3">Dono</th>
                                <th>Membro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PAPEIS.map(([linha, dono, membro]) => (
                                <tr key={linha}>
                                    <td className="pr-3 text-foreground">{linha}</td>
                                    <td className="pr-3">{dono}</td>
                                    <td>{membro}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Link href={ROUTES.MEMBERS} className={link}>
                        Convidar
                    </Link>
                </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={botao} disabled={passo === 0 || pendente} onClick={() => setPasso(passo - 1)}>
                    Anterior
                </button>
                {ultimo ? (
                    <button type="button" className={botao} disabled={pendente} onClick={() => void sair()}>
                        Concluir
                    </button>
                ) : (
                    <button type="button" className={botao} disabled={pendente} onClick={() => setPasso(passo + 1)}>
                        Próximo
                    </button>
                )}
                <button type="button" className={botao} disabled={pendente} onClick={() => void sair()}>
                    Pular
                </button>
            </div>

            {erro ? (
                <p role="alert" className="text-destructive">
                    {erro}
                </p>
            ) : null}
        </WireframeBox>
    )
}
