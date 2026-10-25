"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { signedCurrencyBRL } from "@/lib/formatters"
import { aConferirKeys } from "@/lib/queries/keys"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { supabase, type Transaction, type TransactionSource } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"
import { useRotuloDaTransacao } from "@/lib/privado/use-rotulo-da-transacao"

const LIMITE = 50

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/** A origem do lançamento, em português. */
const ROTULO_DA_ORIGEM: Record<TransactionSource, string> = {
    app: "App",
    quick_text: "Frase",
    shortcut: "Atalho",
    apple_pay: "Apple Pay",
    whatsapp: "WhatsApp",
    share: "Compartilhado",
    import_pdf: "Importado",
    import_sheet: "Importado",
    import_statement: "Importado",
    recurring: "Recorrente",
}

type Item = Pick<Transaction, "id" | "date" | "description" | "amount" | "type" | "source" | "user_id" | "is_private">

/**
 * "A conferir" (Bloco 3A, Decisão 5): os lançamentos `needs_review` da carteira,
 * acima da lista de sempre, com `?conferir=1` na URL. "Confirmar" tira a marca;
 * "Abrir" leva ao detalhe (`?txn=`), mantendo a lista aberta.
 */
export function AConferirListaWireframe({ workspaceId }: { workspaceId: string }) {
    const queryClient = useQueryClient()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [pendente, setPendente] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const rotulo = useRotuloDaTransacao()

    const lista = useQuery({
        queryKey: aConferirKeys.list(workspaceId),
        queryFn: async () => {
            const { data, error, count } = await supabase
                .from("transactions")
                .select("id, date, description, amount, type, source, user_id, is_private", { count: "exact" })
                .eq("workspace_id", workspaceId)
                .eq("needs_review", true)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(LIMITE)
            if (error) throw error
            return { itens: (data ?? []) as Item[], total: count ?? data?.length ?? 0 }
        },
    })

    function hrefCom(mudar: (p: URLSearchParams) => void) {
        const p = new URLSearchParams(searchParams?.toString())
        mudar(p)
        const qs = p.toString()
        return qs ? `${pathname}?${qs}` : pathname
    }

    async function confirmar(id: string) {
        setPendente(id)
        setErro(null)
        // Sem linha de volta (apagado ou fora da RLS), nada foi gravado.
        const { data, error } = await supabase
            .from("transactions")
            .update({ needs_review: false })
            .eq("id", id)
            .select("id")
        setPendente(null)
        if (error || data?.length !== 1) {
            setErro("Não foi possível confirmar.")
            return
        }
        await invalidateWorkspaceData(queryClient, workspaceId, { domains: ["transactions"] })
    }

    const itens = lista.data?.itens ?? []
    const total = lista.data?.total ?? 0

    return (
        <WireframeBox bloco={3} titulo="A conferir">
            <Link href={hrefCom((p) => p.delete("conferir"))} className="underline">
                Fechar
            </Link>
            {lista.isPending ? (
                <p>Carregando…</p>
            ) : lista.isError ? (
                <p role="alert" className="text-destructive">
                    Não foi possível carregar os itens a conferir.
                </p>
            ) : itens.length === 0 ? (
                <p>Nada a conferir.</p>
            ) : (
                <>
                    {total > itens.length ? <p>{`Mostrando ${itens.length} de ${total}`}</p> : null}
                    <ul className="space-y-2">
                        {itens.map((t) => (
                            <li key={t.id} className="flex flex-wrap items-center gap-2 border-b border-dashed border-muted-foreground/60 pb-2">
                                <span>{formatDatePtBr(t.date)}</span>
                                <span className="text-foreground">{rotulo(t) || "(sem descrição)"}</span>
                                <span className="nums text-foreground">
                                    {signedCurrencyBRL(t.type === "expense" ? -Number(t.amount) : Number(t.amount))}
                                </span>
                                <span>[{ROTULO_DA_ORIGEM[t.source] ?? t.source}]</span>
                                <button
                                    type="button"
                                    className={botao}
                                    disabled={pendente != null}
                                    onClick={() => void confirmar(t.id)}
                                >
                                    Confirmar
                                </button>
                                <Link href={hrefCom((p) => p.set("txn", t.id))} className={botao}>
                                    Abrir
                                </Link>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {erro ? (
                <p role="alert" className="text-destructive">
                    {erro}
                </p>
            ) : null}
        </WireframeBox>
    )
}
