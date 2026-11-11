"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
    ChevronDownIcon,
    ChevronUpIcon,
    EllipsisHorizontalIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/16/solid"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { AConferirNoDetalhe, temAConferir } from "@/components/transactions/a-conferir-no-detalhe"
import { AnexosDoLancamento } from "@/components/transactions/anexos-do-lancamento"
import {
    direcaoDaTecla,
    ehCampoDeTexto,
    fraseDaFatura,
    linhaDoHeroi,
    podeNavegar,
    rotuloDaOrigem,
    rotuloDaRecorrencia,
} from "@/components/transactions/detalhe-regras"
import { ImpactoDaParcela } from "@/components/transactions/impacto-da-parcela"
import { PartesDaDespesa } from "@/components/transactions/partes-da-despesa"
import {
    InstallmentPurchaseSection,
    summarizeInstallmentPlan,
    useInstallmentSlices,
} from "@/components/transactions/installment-purchase-section"
import { valorComSinal } from "@/components/transactions/transacoes-tabela-regras"
import type {
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
    TransactionSaveResult,
} from "@/components/transactions/transaction-form-types"
import { TransactionFormSurface } from "@/components/transactions/transaction-form-surface"
import { useTransactionForm } from "@/components/transactions/transaction-form-use"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    DescriptionDetails,
    DescriptionHint,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import {
    DialogBody,
    DialogCloseButton,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogHeaderRow,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Muted } from "@/components/ui/typography"
import { projetoDetailPath } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { tertiaryDestructiveClassName } from "@/lib/button-destructive-classes"
import { creditCardInvoiceHintForPurchase, creditCardInvoiceSlotLabelPt } from "@/lib/credit-card-billing"
import { currencyBRL } from "@/lib/formatters"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import type { Category, CreditCard, Transaction, TransactionInstallmentPlanRef } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { formatDateLongPtBr, formatTransactionDayPtBr, formatTransactionDmyPtBr } from "@/lib/transaction-date"
import { resolveInstallmentKn } from "@/lib/transaction-installment"
import { INSTALLMENT_DELETE_WARNING } from "@/lib/transactions/delete-transactions"
import { cn } from "@/lib/utils"

export type TransactionDetailSheetProps = {
    transaction: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    creditCards: CreditCard[]
    categories: Category[]
    categoriesHref: string
    creditCardsHref: string
    subscriptionsHref: string
    saving: boolean
    onSave: (payload: TransactionFormSavePayload) => Promise<TransactionSaveResult>
    onUpdateInstallmentPlan: (planId: string, payload: InstallmentPlanUpdatePayload) => Promise<boolean>
    onDelete: (t: Transaction) => void
    /** When the sheet opens with this true, switch to edit mode once (e.g. table “Editar”). */
    launchInEditMode?: boolean
    onLaunchEditConsumed?: () => void
    /** A linha de cima e a de baixo na página da lista; sem elas, as setas não aparecem. */
    anterior?: Transaction | null
    seguinte?: Transaction | null
    /** Troca o lançamento mostrado, sem fechar a folha (setas, ↑/↓ e J/K). */
    onNavegar?: (t: Transaction) => void
}

export function TransactionDetailSheet({
    transaction,
    open,
    onOpenChange,
    creditCards,
    categories,
    categoriesHref,
    creditCardsHref,
    subscriptionsHref,
    saving,
    onSave,
    onUpdateInstallmentPlan,
    onDelete,
    launchInEditMode = false,
    onLaunchEditConsumed,
    anterior,
    seguinte,
    onNavegar,
}: TransactionDetailSheetProps) {
    const isMobile = useIsMobile()
    const [detailMode, setDetailMode] = useState<"view" | "edit">("view")
    const [planFallback, setPlanFallback] = useState<TransactionInstallmentPlanRef | null>(null)
    const marca = useRef<HTMLDivElement>(null)

    const t = transaction
    const membros = useMemberDirectoryQuery(t?.workspace_id ?? null).data ?? []

    /* eslint-disable react-hooks/set-state-in-effect -- load/clear installment plan embed when sheet opens */
    useEffect(() => {
        if (!open || !t?.installment_plan_id) {
            setPlanFallback(null)
            return
        }
        if (t.installment_plan) {
            setPlanFallback(null)
            return
        }
        let cancelled = false
        void (async () => {
            const { data, error } = await supabase
                .from("workspace_installment_plans")
                .select(
                    "id,total_installments,installment_amount,final_installment_amount,generated_count,is_active,next_billing_date,description"
                )
                .eq("id", t.installment_plan_id!)
                .maybeSingle()
            if (cancelled) return
            if (!error && data) {
                setPlanFallback(data as TransactionInstallmentPlanRef)
            } else {
                setPlanFallback(null)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [open, t?.installment_plan_id, t?.installment_plan])
    /* eslint-enable react-hooks/set-state-in-effect */

    const { slices, slicesLoading } = useInstallmentSlices(t?.installment_plan_id, open)

    const installmentBlock = useMemo(() => {
        const plan = t?.installment_plan ?? planFallback
        if (!t || t.type !== "expense" || !t.installment_plan_id || !plan) {
            return null
        }
        return {
            kn: resolveInstallmentKn(t.installment_sequence, t.description, plan),
            summary: summarizeInstallmentPlan(plan, slices, slicesLoading),
        }
    }, [t, planFallback, slices, slicesLoading])

    const txForForm = useMemo((): Transaction | null => {
        if (!t) return null
        if (t.installment_plan || !planFallback) return t
        return { ...t, installment_plan: planFallback }
    }, [t, planFallback])

    const { handleSubmit, fieldsProps, formTitle, formDescription, showFooter, submitDisabled } = useTransactionForm({
        active: open && detailMode === "edit",
        saving,
        editingTransaction: txForForm,
        defaultLaunchKind: "expense",
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        onSave,
        onSaveInstallmentPlan: undefined,
        onUpdateInstallmentPlan,
        closeOnSuccess: false,
        onClose: () => setDetailMode("view"),
        onSuccess: () => setDetailMode("view"),
    })

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reset edit mode when sheet closes
            setDetailMode("view")
        }
    }, [open])

    useEffect(() => {
        if (!open || !launchInEditMode) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- open sheet directly in edit from row action
        setDetailMode("edit")
        onLaunchEditConsumed?.()
    }, [open, launchInEditMode, onLaunchEditConsumed])

    // As setas: só no desktop, só abertas pela lista, e desligadas enquanto edita.
    const setas = podeNavegar(isMobile || !onNavegar ? null : { anterior, seguinte }, detailMode === "edit")
    const { anterior: podeAnterior, seguinte: podeSeguinte } = setas
    const comSetas = !isMobile && Boolean(onNavegar) && (anterior !== undefined || seguinte !== undefined)

    useEffect(() => {
        if (!open || !onNavegar || (!podeAnterior && !podeSeguinte)) return
        const aoTeclar = (e: KeyboardEvent) => {
            if (e.defaultPrevented || ehCampoDeTexto(e.target)) return
            const direcao = direcaoDaTecla(e)
            if (!direcao) return
            // Só a folha: um menu ou uma confirmação portalizados por cima ficam com as setas.
            const casca = marca.current?.closest('[data-slot="sheet-content"]')
            const alvo = e.target as Node | null
            if (alvo && alvo !== document.body && !casca?.contains(alvo)) return
            const destino = direcao === "anterior" ? anterior : seguinte
            if (!destino || !(direcao === "anterior" ? podeAnterior : podeSeguinte)) return
            e.preventDefault()
            onNavegar(destino)
        }
        document.addEventListener("keydown", aoTeclar)
        return () => document.removeEventListener("keydown", aoTeclar)
    }, [open, onNavegar, anterior, seguinte, podeAnterior, podeSeguinte])

    if (!t) {
        return null
    }

    const paymentCard = t.payment_credit_card_id ? creditCards.find((c) => c.id === t.payment_credit_card_id) : null

    const paymentLine =
        t.type === "expense" && t.payment_method
            ? t.payment_method === "credit_card" && paymentCard
                ? `${paymentMethodLabel(t.payment_method)} · ${paymentCard.name} · •• ${paymentCard.last_four}`
                : paymentMethodLabel(t.payment_method)
            : null

    const fatura =
        t.type === "expense" && t.payment_method === "credit_card" && paymentCard
            ? creditCardInvoiceHintForPurchase(t.date, paymentCard)
            : null

    const isIncome = t.type === "income"
    const descricao = t.description?.trim() || t.category?.name || "Sem descrição"
    const nomeDe = (id: string | null | undefined) => {
        const m = id ? membros.find((x) => x.user_id === id) : undefined
        return m ? m.full_name || m.email : null
    }
    const variosMembros = membros.length >= 2
    const autor = variosMembros ? nomeDe(t.user_id) : null
    const pagou = variosMembros ? nomeDe(t.paid_by) : null

    const editar = () => setDetailMode("edit")
    const excluir = () => onDelete(t)

    const seta = (direcao: "anterior" | "seguinte") => {
        const destino = direcao === "anterior" ? anterior : seguinte
        const rotulo = direcao === "anterior" ? "Lançamento anterior" : "Próximo lançamento"
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label={rotulo}
                        disabled={!setas[direcao]}
                        onClick={() => destino && onNavegar?.(destino)}
                    >
                        {direcao === "anterior" ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent shortcut={direcao === "anterior" ? "up" : "down"}>{rotulo}</TooltipContent>
            </Tooltip>
        )
    }

    const viewBody = (
        <div ref={marca} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
                <DialogHeaderRow
                    endAdornment={
                        <>
                            {/* O ⋯ abre como menu também no telefone, na escala do toque. */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="tertiary" size="icon-md" aria-label="Mais opções">
                                        <EllipsisHorizontalIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" size="sm">
                                    <DropdownMenuItem onClick={editar}>
                                        <PencilIcon aria-hidden />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onClick={excluir}>
                                        <TrashIcon aria-hidden />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogCloseButton placement="inline" />
                        </>
                    }
                >
                    {comSetas ? (
                        <div className="flex items-center gap-1">
                            {seta("anterior")}
                            {seta("seguinte")}
                        </div>
                    ) : null}
                </DialogHeaderRow>
            </DialogHeader>
            <DialogDescription className="sr-only">
                {isIncome ? "Receita" : "Despesa"}. {formatTransactionDayPtBr(t.date)}. Valor {currencyBRL(Number(t.amount))}.
            </DialogDescription>

            <DialogBody className="flex flex-col gap-6">
                <div className="flex flex-col items-start gap-3">
                    <ColorTile size="md" color={t.category?.color}>
                        <CategoryIconPreview name={normalizeCategoryIcon(t.category?.icon)} />
                    </ColorTile>
                    <div className="min-w-0">
                        <DialogTitle tabIndex={-1} className="outline-none">{descricao}</DialogTitle>
                        <MoneyDisplay size="xl" signed value={valorComSinal(t)} tone={isIncome ? "income" : undefined} />
                        <Muted>{linhaDoHeroi(formatDateLongPtBr(t.date), autor, t.source)}</Muted>
                    </div>
                </div>

                {temAConferir(t) ? (
                    <AConferirNoDetalhe
                        // Confirmado na lista com o detalhe aberto: o bloco remonta, sem "Confirmar" velho.
                        key={`${t.id}:${t.needs_review}`}
                        transaction={t}
                        onFeito={(o) => {
                            if (o === "desfeito") onOpenChange(false)
                        }}
                    />
                ) : null}

                <DescriptionList>
                    <DescriptionListItem>
                        <DescriptionTerm>Categoria</DescriptionTerm>
                        <DescriptionDetails>
                            {t.category ? (
                                <span className="inline-flex items-center gap-2">
                                    <ColorTile size="xs" color={t.category.color}>
                                        <CategoryIconPreview name={normalizeCategoryIcon(t.category.icon)} />
                                    </ColorTile>
                                    {t.category.name}
                                </span>
                            ) : (
                                "Sem categoria"
                            )}
                        </DescriptionDetails>
                    </DescriptionListItem>
                    {paymentLine ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Pagamento</DescriptionTerm>
                            <DescriptionDetails>
                                {paymentLine}
                                {fatura ? (
                                    <DescriptionHint className="flex flex-wrap items-center gap-2">
                                        <Badge size="xs">{creditCardInvoiceSlotLabelPt(fatura.slot)}</Badge>
                                        {fraseDaFatura(fatura.statementClose, fatura.dueEstimate)}
                                    </DescriptionHint>
                                ) : null}
                            </DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                    <DescriptionListItem>
                        <DescriptionTerm>Data</DescriptionTerm>
                        <DescriptionDetails>{formatTransactionDmyPtBr(t.date)}</DescriptionDetails>
                    </DescriptionListItem>
                    {t.is_recurring ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Recorrência</DescriptionTerm>
                            <DescriptionDetails>{rotuloDaRecorrencia(t.recurring_interval)}</DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                    {t.subscription_id ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Assinatura</DescriptionTerm>
                            <DescriptionDetails>
                                <Button asChild variant="link" size="sm">
                                    <Link href={`${subscriptionsHref}?sub=${encodeURIComponent(t.subscription_id)}`}>
                                        {t.subscription?.name ?? "Ver assinatura"}
                                    </Link>
                                </Button>
                            </DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                    {t.project_id ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Projeto</DescriptionTerm>
                            <DescriptionDetails>
                                <Button asChild variant="link" size="sm">
                                    <Link href={projetoDetailPath(t.project_id)}>Ver projeto</Link>
                                </Button>
                            </DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                    <DescriptionListItem>
                        <DescriptionTerm>Entrou por</DescriptionTerm>
                        <DescriptionDetails>{rotuloDaOrigem(t.source)}</DescriptionDetails>
                    </DescriptionListItem>
                    {autor ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Lançado por</DescriptionTerm>
                            <DescriptionDetails>{autor}</DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                    {pagou && !isIncome ? (
                        <DescriptionListItem>
                            <DescriptionTerm>Quem pagou</DescriptionTerm>
                            <DescriptionDetails>{pagou}</DescriptionDetails>
                        </DescriptionListItem>
                    ) : null}
                </DescriptionList>

                {installmentBlock ? (
                    <InstallmentPurchaseSection
                        summary={installmentBlock.summary}
                        kn={installmentBlock.kn}
                        amount={Number(t.amount)}
                        isCurrentRow={(row) => row.transactionId === t.id}
                        currentRowTitle="Esta transação"
                        warning={INSTALLMENT_DELETE_WARNING}
                    />
                ) : null}
                {installmentBlock && t.installment_plan_id ? (
                    <ImpactoDaParcela planoId={t.installment_plan_id} />
                ) : null}

                {/* As partes (Bloco 7C): só na carteira dividida, para o adulto. */}
                <PartesDaDespesa transaction={t} />

                {/* Com a conta paga por este lançamento, o boleto da instância aparece junto. */}
                <AnexosDoLancamento key={t.id} transaction={t} />
            </DialogBody>

            <DialogFooter
                start={
                    <Button
                        type="button"
                        variant="tertiary"
                        className={tertiaryDestructiveClassName}
                        onClick={excluir}
                    >
                        Excluir
                    </Button>
                }
            >
                <Button type="button" variant="primary" onClick={editar}>
                    Editar
                </Button>
            </DialogFooter>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                // A folha flutuante, solta das bordas, como a das notificações (pedido do dono, 08/11/2026).
                side="right"
                size="md"
                fillMobileViewport={isMobile}
                onOpenAutoFocus={(e) => {
                    // O foco vai ao título, e não ao primeiro botão (a seta ↑, que abriria a dica).
                    const casca = e.currentTarget as HTMLElement | null
                    const titulo = casca?.querySelector<HTMLElement>('[data-slot="dialog-title"]')
                    if (!titulo) return
                    e.preventDefault()
                    titulo.focus()
                }}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0",
                    isMobile && "rounded-t-modal pt-0 sm:max-w-full"
                )}
            >
                {detailMode === "edit" ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                        <TransactionFormSurface
                            variant="detail-sheet"
                            handleSubmit={handleSubmit}
                            fieldsProps={fieldsProps}
                            formTitle={formTitle}
                            formDescription={formDescription}
                            showFooter={showFooter}
                            submitDisabled={submitDisabled}
                            saving={saving}
                            onCancel={() => setDetailMode("view")}
                        />
                    </div>
                ) : (
                    viewBody
                )}
            </SheetContent>
        </Sheet>
    )
}
