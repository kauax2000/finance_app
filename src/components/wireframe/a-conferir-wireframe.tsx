"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { desfazerImportacao } from "@/lib/import/importar"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { supabase, type Transaction } from "@/lib/supabase"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/**
 * O selo do lançamento importado ou a revisar, no detalhe (Decisão 2): "Confirmar"
 * tira o `needs_review`; "Desfazer importação do lote" apaga o lote inteiro.
 * O Apple Pay que não casou o cartão guarda o nome da Wallet; com um cartão
 * escolhido, "Lembrar" o grava como `wallet_alias` e a próxima captura casa.
 */
export function AConferirWireframe({
    transaction,
    onChanged,
}: {
    transaction: Pick<
        Transaction,
        "id" | "workspace_id" | "needs_review" | "import_batch_id" | "source" | "capture_meta" | "payment_credit_card_id"
    >
    /** "desfeito": o lançamento não existe mais, e quem mostra o detalhe o fecha. */
    onChanged?: (o: "confirmado" | "desfeito") => void
}) {
    const queryClient = useQueryClient()
    const [confirmado, setConfirmado] = useState(!transaction.needs_review)
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const workspaceId = transaction.workspace_id
    const [lembrado, setLembrado] = useState(false)
    const walletCard = transaction.source === "apple_pay" ? transaction.capture_meta?.walletCard?.trim() : undefined
    const cartaoId = transaction.payment_credit_card_id
    // `credit_cards_wallet_alias_check`: de 1 a 60 caracteres.
    const podeLembrar = Boolean(walletCard && walletCard.length <= 60 && cartaoId)

    async function atualizarListas() {
        if (workspaceId) {
            await invalidateWorkspaceData(queryClient, workspaceId, {
                domains: ["transactions", "credit_card_expense_rows"],
            })
        }
    }

    async function confirmar() {
        setPendente(true)
        setErro(null)
        const { error } = await supabase.from("transactions").update({ needs_review: false }).eq("id", transaction.id)
        setPendente(false)
        if (error) {
            setErro(`Não foi possível confirmar: ${error.message}`)
            return
        }
        setConfirmado(true)
        await atualizarListas()
        onChanged?.("confirmado")
    }

    async function lembrarCartao() {
        if (!walletCard || !cartaoId) return
        setPendente(true)
        setErro(null)
        const { error } = await supabase.from("credit_cards").update({ wallet_alias: walletCard }).eq("id", cartaoId)
        setPendente(false)
        if (error) {
            setErro(`Não foi possível lembrar o cartão: ${error.message}`)
            return
        }
        setLembrado(true)
        if (workspaceId) await invalidateWorkspaceData(queryClient, workspaceId, { domains: ["credit_cards"] })
    }

    async function desfazerLote() {
        if (!transaction.import_batch_id) return
        if (!workspaceId) {
            setErro("Não foi possível desfazer: o lançamento não tem carteira.")
            return
        }
        if (!window.confirm("Desfazer a importação inteira deste lote?")) return
        setPendente(true)
        setErro(null)
        const r = await desfazerImportacao(supabase, workspaceId, transaction.import_batch_id)
        setPendente(false)
        if (!r.ok) {
            setErro(r.erro ?? "Não foi possível desfazer a importação.")
            return
        }
        await atualizarListas()
        onChanged?.("desfeito")
    }

    return (
        <WireframeBox bloco={2} titulo="A conferir">
            <p className="text-foreground">{confirmado ? "Importado · conferido" : "Importado · a conferir"}</p>
            <div className="flex flex-wrap gap-2">
                {confirmado ? null : (
                    <button type="button" className={botao} disabled={pendente} onClick={() => void confirmar()}>
                        Confirmar
                    </button>
                )}
                {podeLembrar && !lembrado ? (
                    <button type="button" className={botao} disabled={pendente} onClick={() => void lembrarCartao()}>
                        {`Lembrar '${walletCard}' como este cartão`}
                    </button>
                ) : null}
                {transaction.import_batch_id ? (
                    <button type="button" className={botao} disabled={pendente} onClick={() => void desfazerLote()}>
                        Desfazer importação do lote
                    </button>
                ) : null}
            </div>
            {lembrado ? <p role="status">Cartão lembrado: {`a próxima compra com '${walletCard}' já casa.`}</p> : null}
            {erro ? (
                <p role="alert" className="text-destructive">
                    {erro}
                </p>
            ) : null}
        </WireframeBox>
    )
}
