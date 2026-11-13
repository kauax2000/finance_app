"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogError,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { DescriptionDetails, DescriptionList, DescriptionListItem, DescriptionTerm } from "@/components/ui/description-list"
import { Caption, Muted } from "@/components/ui/typography"
import {
    ALIAS_MAX,
    confirmarLancamento,
    contarLote,
    desfazerLote,
    jaLembrado,
    lembrarCartaoDaWallet,
    lerAliasDoCartao,
} from "@/lib/captura/a-conferir-acoes"
import { invalidateWorkspaceData, type WorkspaceDataDomain } from "@/lib/queries/invalidate-workspace-data"
import { supabase, type Transaction } from "@/lib/supabase"
import { formatWeekdayDayMonthShortPtBr } from "@/lib/transaction-date"

type Props = {
    transaction: Pick<
        Transaction,
        | "id"
        | "workspace_id"
        | "needs_review"
        | "import_batch_id"
        | "source"
        | "capture_meta"
        | "payment_credit_card_id"
        | "payment_method"
        | "description"
        | "date"
        | "category"
    >
    /** O pagamento como o topo do detalhe o escreve ("Nubank •• 1111", "Pix"). */
    pagamento?: string
    /** Abre o modo de edição do próprio detalhe. */
    onEditar?: () => void
    /** "desfeito": o lançamento não existe mais, e quem mostra o detalhe o fecha. */
    onFeito?: (o: "confirmado" | "desfeito") => void
}

/** O bloco cabe: a conferir, importado, ou Apple Pay com o nome da Wallet. */
export function temAConferir(t: Props["transaction"]): boolean {
    return Boolean(t.needs_review || t.import_batch_id || (t.source === "apple_pay" && t.capture_meta?.walletCard))
}

/** Quem leu o que chegou: a IA, a importação, o Apple Pay, uma IA conectada ou o Atalho. */
function quemLeu(t: Props["transaction"]): string {
    if (t.capture_meta?.ia) return "lido pela IA"
    if (t.import_batch_id) return "importação"
    if (t.source === "apple_pay") return "Apple Pay"
    if (t.capture_meta?.via === "mcp") return "IA conectada"
    return "Atalho"
}

const mensagem = (e: unknown, padrao: string) => (e instanceof Error && e.message ? e.message : padrao)

/** O título da pergunta do desfazer, com a contagem quando ela chegou. */
function tituloDoDesfazer(n: number | undefined): string {
    if (n == null) return "Apagar os lançamentos desta importação?"
    if (n === 1) return "Apagar o lançamento desta importação?"
    return `Apagar os ${n} lançamentos desta importação?`
}

/**
 * "A conferir" no detalhe (spec §8.3; versão K2c, 13/11/2026): o card "Como
 * chegou" com o original entre aspas, os campos que o app preencheu e
 * Confirmar + Editar. Confirmar tira o `needs_review`;
 * Lembrar grava o nome da Wallet como `wallet_alias` do cartão escolhido, e a
 * próxima captura casa; Desfazer importação apaga o lote inteiro.
 */
export function AConferirNoDetalhe({ transaction: t, pagamento, onEditar, onFeito }: Props) {
    const queryClient = useQueryClient()
    const [confirmado, setConfirmado] = React.useState(!t.needs_review)
    const [lembrado, setLembrado] = React.useState(false)
    const [pendente, setPendente] = React.useState(false)
    const [erro, setErro] = React.useState<string | null>(null)
    const [perguntando, setPerguntando] = React.useState(false)
    const [erroDoDesfazer, setErroDoDesfazer] = React.useState<string | null>(null)

    const workspaceId = t.workspace_id ?? null
    const walletCard = t.source === "apple_pay" ? t.capture_meta?.walletCard?.trim() || undefined : undefined
    const cartaoId = t.payment_credit_card_id ?? null
    const longoDemais = walletCard != null && walletCard.length > ALIAS_MAX
    const podeLembrar = Boolean(walletCard && !longoDemais && cartaoId)
    /** Conferido e fora de lote: o bloco existe só para o Apple Pay aprender o cartão. */
    const soLembrar = !t.needs_review && !t.import_batch_id
    const chaveDoAlias = ["credit_card_wallet_alias", cartaoId]

    const aliasAtual = useQuery({
        queryKey: chaveDoAlias,
        enabled: podeLembrar,
        queryFn: () => lerAliasDoCartao(supabase, cartaoId as string),
    })
    const lote = useQuery({
        queryKey: ["import_batch_count", workspaceId, t.import_batch_id],
        enabled: perguntando && Boolean(workspaceId && t.import_batch_id),
        queryFn: () => contarLote(supabase, workspaceId as string, t.import_batch_id as string),
    })
    const jaNoBanco = walletCard != null && jaLembrado(aliasAtual.data, walletCard)

    // A gravação já deu certo: uma falha ao recarregar as listas não vira erro da ação.
    const atualizarListas = async (domains: WorkspaceDataDomain[]) => {
        if (!workspaceId) return
        try {
            await invalidateWorkspaceData(queryClient, workspaceId, { domains })
        } catch {
            // As listas se atualizam na próxima leitura.
        }
    }

    const rodar = async (acao: () => Promise<void>, padrao: string) => {
        setPendente(true)
        setErro(null)
        try {
            await acao()
        } catch (e) {
            setErro(mensagem(e, padrao))
        } finally {
            setPendente(false)
        }
    }

    const confirmar = () =>
        rodar(async () => {
            await confirmarLancamento(supabase, t.id)
            setConfirmado(true)
            await atualizarListas(["transactions", "credit_card_expense_rows"])
            onFeito?.("confirmado")
        }, "Não foi possível confirmar o lançamento.")

    const lembrar = () =>
        rodar(async () => {
            if (!walletCard || !cartaoId) return
            const gravado = await lembrarCartaoDaWallet(supabase, cartaoId, walletCard)
            setLembrado(true)
            queryClient.setQueryData(chaveDoAlias, gravado)
            await atualizarListas(["credit_cards"])
        }, "Não foi possível lembrar o cartão.")

    const desfazer = async () => {
        if (!t.import_batch_id) return
        if (!workspaceId) {
            setErroDoDesfazer("Não foi possível desfazer: o lançamento não tem carteira.")
            return
        }
        setPendente(true)
        setErroDoDesfazer(null)
        try {
            await desfazerLote(supabase, workspaceId, t.import_batch_id)
            setPerguntando(false)
            await atualizarListas(["transactions", "credit_card_expense_rows"])
            onFeito?.("desfeito")
        } catch (e) {
            setErroDoDesfazer(mensagem(e, "Não foi possível desfazer a importação."))
        } finally {
            setPendente(false)
        }
    }

    // Só o lembrar, e a leitura do apelido ainda a caminho: nada a mostrar.
    if (soLembrar && podeLembrar && aliasAtual.isPending) return null

    const conferido = confirmado || soLembrar
    const mostraConfirmar = !conferido
    const mostraLembrar = podeLembrar && !lembrado && !jaNoBanco && !aliasAtual.isPending
    const mostraDesfazer = Boolean(t.import_batch_id)

    // Conferido e sem nada a fazer (nem lembrar, nem desfazer, nem o recado do que acabou de ser feito): o card sai.
    if (conferido && !mostraLembrar && !mostraDesfazer && !lembrado && !erro) return null

    const avisos: string[] = []
    if (mostraConfirmar || mostraLembrar) {
        if (longoDemais) avisos.push("Nome da Wallet longo demais para lembrar.")
        if (walletCard && !longoDemais && !cartaoId) avisos.push(`Escolha o cartão do lançamento para lembrar "${walletCard}".`)
        if (!lembrado && jaNoBanco) avisos.push("Cartão já lembrado.")
    }

    const descricao = t.description?.trim()
    const textoOriginal = t.capture_meta?.texto?.trim()
    // O original, como chegou: a frase digitada; no Apple Pay, a notificação; na importação, a linha do extrato.
    const original = textoOriginal
        ? `“${textoOriginal}”`
        : t.source === "apple_pay" && descricao
          ? `“${[descricao, walletCard].filter(Boolean).join(" · ")}”`
          : t.import_batch_id && descricao
            ? `“${descricao}” · extrato`
            : null

    return (
        // shrink-0: na coluna flex do corpo, o overflow-hidden do Card o deixava encolher até a tira.
        <Card padding="none" data-slot="a-conferir" className="shrink-0">
            <CardToolbar>
                <span className="min-w-0 truncate">Como chegou</span>
                <span className="shrink-0">{quemLeu(t)}</span>
            </CardToolbar>
            <CardContent className="grid gap-3 px-(--card-strip-px) pb-(--card-strip-py)">
                {original ? (
                    <Muted asChild className="border-s-2 border-border ps-3 italic">
                        <blockquote>{original}</blockquote>
                    </Muted>
                ) : null}
                {mostraConfirmar ? (
                    <DescriptionList layout="inline" size="sm" divided>
                        <DescriptionListItem>
                            <DescriptionTerm>Categoria</DescriptionTerm>
                            <DescriptionDetails>{t.category?.name ?? "sem categoria"}</DescriptionDetails>
                        </DescriptionListItem>
                        {pagamento ? (
                            <DescriptionListItem>
                                <DescriptionTerm>{t.payment_method?.endsWith("_card") ? "Cartão" : "Pagamento"}</DescriptionTerm>
                                <DescriptionDetails>{pagamento}</DescriptionDetails>
                            </DescriptionListItem>
                        ) : null}
                        <DescriptionListItem>
                            <DescriptionTerm>Data</DescriptionTerm>
                            <DescriptionDetails>{formatWeekdayDayMonthShortPtBr(t.date)}</DescriptionDetails>
                        </DescriptionListItem>
                    </DescriptionList>
                ) : null}
                {avisos.map((a) => (
                    <Caption key={a}>{a}</Caption>
                ))}
                {lembrado ? (
                    <Caption role="status">{`Cartão lembrado: a próxima compra com "${walletCard}" já casa.`}</Caption>
                ) : null}
                {erro ? (
                    <Caption role="alert" className="text-destructive">
                        {erro}
                    </Caption>
                ) : null}
                {mostraConfirmar ? (
                    <div className="flex gap-2 pointer-coarse:flex-col pointer-coarse:items-stretch">
                        <Button type="button" variant="primary" size="md" className="grow" disabled={pendente} onClick={() => void confirmar()}>
                            confirmar
                        </Button>
                        {onEditar ? (
                            <Button type="button" variant="tertiary" size="md" disabled={pendente} onClick={onEditar}>
                                editar
                            </Button>
                        ) : null}
                    </div>
                ) : null}
                {mostraLembrar ? (
                    <Button type="button" variant="link" size="md" className="self-center" disabled={pendente} onClick={() => void lembrar()}>
                        {aliasAtual.data
                            ? `Trocar "${aliasAtual.data}" por "${walletCard}"`
                            : `Lembrar "${walletCard}" como este cartão`}
                    </Button>
                ) : null}
                {mostraDesfazer ? (
                    <AlertDialog
                        open={perguntando}
                        onOpenChange={(aberto) => {
                            setPerguntando(aberto)
                            if (!aberto) setErroDoDesfazer(null)
                        }}
                        pending={pendente}
                    >
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="link" size="md" className="self-center" disabled={pendente}>
                                desfazer importação
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{tituloDoDesfazer(lote.data)}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Todos os lançamentos que entraram com ela são apagados. Não dá para desfazer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {erroDoDesfazer ? <AlertDialogError>{erroDoDesfazer}</AlertDialogError> : null}
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        void desfazer()
                                    }}
                                >
                                    Apagar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : null}
            </CardContent>
        </Card>
    )
}
