"use client"

import { SectionLabel } from "@/components/transactions/installment-purchase-section"
import { Card, CardField } from "@/components/ui/card"
import { currencyBRL } from "@/lib/formatters"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { CreditCard, WorkspaceSubscriptionListRow } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
    TableSkeleton,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { subscriptionBillingIntervalLabel } from "@/components/subscriptions/subscription-form-shared"
import type { ExpenseCategoryOption } from "@/components/subscriptions/subscription-form-shared"
import type { SubscriptionFormPayload } from "@/components/subscriptions/subscription-form-shared"
import { SubscriptionFormSurface } from "@/components/subscriptions/subscription-form-surface"
import { useSubscriptionForm } from "@/components/subscriptions/use-subscription-form"
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import {
    tagChipSky,
    tagChipSuccess,
    tagChipWarning,
} from "@/components/ui/badge"
import { formatDatePtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"
import { advanceBilling } from "@/lib/subscription-billing-projection"

type SubscriptionTransactionCharge = {
    id: string
    amount: number
    date: string
    created_at: string
}

type SubscriptionChargeRow = {
    key: string
    date: string | null
    amount: number
    status: "posted" | "paid" | "pending"
}

/**
 * A próxima cobrança depois de `ymd`, pela mesma regra do banco: o dia-âncora
 * é cortado no fim do mês e volta depois (31/01 → 28/02 → 31/03). O `setMonth`
 * cru que havia aqui levava 31/01 para 03/03, e tratava bimestral como mensal.
 */
function addSubscriptionIntervalYmd(
    ymd: string,
    interval: WorkspaceSubscriptionListRow["billing_interval"],
    anchorDay: number | null | undefined,
): string {
    const from = parseYmdLocal(ymd)
    if (!from) return ymd
    return localYmdFromDate(advanceBilling(from, interval, anchorDay ?? from.getDate()))
}

function subscriptionChargeStatusChipClassName(
    status: SubscriptionChargeRow["status"]
): string {
    if (status === "pending") return tagChipWarning
    if (status === "paid") return tagChipSuccess
    return tagChipSky
}

export type SubscriptionDetailSheetProps = {
    subscription: WorkspaceSubscriptionListRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    txSummaryLine: string
    expenseCategories: ExpenseCategoryOption[]
    categoriesHref: string
    creditCards: CreditCard[]
    creditCardsHref: string
    saving: boolean
    onSave: (
        payload: SubscriptionFormPayload,
        subscriptionIdForUpdate?: string | null
    ) => Promise<boolean>
    onDelete: (s: WorkspaceSubscriptionListRow) => void
    /** Toggle active/inactive from view mode without opening the edit form. */
    onActiveChange: (
        subscriptionId: string,
        isActive: boolean
    ) => Promise<boolean>
    activeToggleSaving?: boolean
    launchInEditMode?: boolean
    onLaunchEditConsumed?: () => void
}

export function SubscriptionDetailSheet({
    subscription,
    open,
    onOpenChange,
    txSummaryLine,
    expenseCategories,
    categoriesHref,
    creditCards,
    creditCardsHref,
    saving,
    onSave,
    onDelete,
    onActiveChange,
    activeToggleSaving = false,
    launchInEditMode = false,
    onLaunchEditConsumed,
}: SubscriptionDetailSheetProps) {
    const isMobile = useIsMobile()
    const [detailMode, setDetailMode] = useState<"view" | "edit">("view")
    const [statusActive, setStatusActive] = useState(
        () => subscription?.is_active ?? true
    )
    const [latestCharge, setLatestCharge] =
        useState<SubscriptionTransactionCharge | null>(null)
    const [latestChargeLoading, setLatestChargeLoading] = useState(false)
    const s = subscription
    const subscriptionId = s?.id ?? null
    const nextCharge = s?.next_billing_date ?? s?.start_date ?? null

    useEffect(() => {
        if (!s) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync optimistic toggle when a different subscription is opened
        setStatusActive(s.is_active)
    }, [s])

    /* eslint-disable react-hooks/set-state-in-effect -- load linked transaction charge when sheet opens */
    useEffect(() => {
        if (!open || !subscriptionId) {
            setLatestCharge(null)
            return
        }
        let cancelled = false
        const id = subscriptionId
        setLatestChargeLoading(true)
        void (async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("id, amount, date, created_at")
                .eq("subscription_id", id)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            if (cancelled) return
            if (!error && data) {
                setLatestCharge({
                    id: data.id,
                    amount: Number(data.amount),
                    date: data.date,
                    created_at: data.created_at,
                })
            } else {
                setLatestCharge(null)
            }
            setLatestChargeLoading(false)
        })()
        return () => {
            cancelled = true
        }
    }, [open, subscriptionId])
    /* eslint-enable react-hooks/set-state-in-effect */

    const {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        showFooter,
        submitDisabled,
        submitLabel,
    } = useSubscriptionForm({
        active: open && detailMode === "edit" && Boolean(s),
        saving,
        editingSubscription: s,
        expenseCategories,
        categoriesHref,
        creditCards,
        creditCardsHref,
        onSave,
        closeOnSuccess: false,
        onClose: () => onOpenChange(false),
        onSuccess: () => setDetailMode("view"),
    })

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reset view when sheet closes (same as transaction detail)
            setDetailMode("view")
        }
    }, [open])

    useEffect(() => {
        if (!open || !launchInEditMode) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- open in edit from toolbar/row (same as transaction detail)
        setDetailMode("edit")
        onLaunchEditConsumed?.()
    }, [open, launchInEditMode, onLaunchEditConsumed])

    const subscriptionChargeRows = useMemo(() => {
        const rows: SubscriptionChargeRow[] = []
        if (latestCharge) {
            const postedDate = latestCharge.date.slice(0, 10)
            const isPaid = nextCharge ? postedDate < nextCharge.slice(0, 10) : false
            rows.push({
                key: `posted-${latestCharge.id}`,
                date: latestCharge.date,
                amount: latestCharge.amount,
                status: isPaid ? "paid" : "posted",
            })
        }

        const nextDate =
            nextCharge ??
            (latestCharge
                ? addSubscriptionIntervalYmd(
                      latestCharge.date.slice(0, 10),
                      s?.billing_interval ?? "monthly",
                      s?.billing_anchor_day
                  )
                : null)
        if (nextDate) {
            rows.push({
                key: "next",
                date: nextDate,
                amount: Number(s?.amount ?? 0),
                status: "pending",
            })
        }
        return rows.slice(0, 2)
    }, [latestCharge, nextCharge, s?.amount, s?.billing_interval, s?.billing_anchor_day])

    if (!s) {
        return null
    }

    const paymentCard = s.payment_credit_card_id
        ? creditCards.find((c) => c.id === s.payment_credit_card_id)
        : undefined
    const paymentSummary =
        s.payment_method === "credit_card" && paymentCard
            ? `${paymentMethodLabel(s.payment_method)} · ${paymentCard.name} · •••• ${paymentCard.last_four}`
            : s.payment_method
              ? paymentMethodLabel(s.payment_method)
              : null

    const commitStatus = (next: boolean) => {
        if (activeToggleSaving || next === statusActive) return
        const prev = statusActive
        setStatusActive(next)
        void onActiveChange(s.id, next).then((ok) => {
            if (!ok) setStatusActive(prev)
        })
    }

    const viewBody = (
        <div className="flex min-h-0 flex-1 flex-col gap-0">
            <DialogDescription className="sr-only">
                Assinatura {s.name}. Valor {currencyBRL(Number(s.amount))}.
                Próxima cobrança {formatDatePtBr(nextCharge)}.
            </DialogDescription>
            <div
                className={cn(
                    "shrink-0 border-b border-border",
                    "mb-3",
                )}
            >
                <div
                    className={cn(
                        "flex items-center gap-3 px-4 pb-4 pt-4 sm:px-5 md:pt-5",
                        isMobile && "pt-2"
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="font-heading text-base font-medium leading-tight">
                                Detalhe da assinatura
                            </DialogTitle>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                        {/* No telefone o ⋯ é a folha de ações, com a assinatura em cima. */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="icon-md"
                                    className="shrink-0"
                                    aria-label="Mais opções"
                                >
                                    <EllipsisHorizontalIcon
                                        aria-hidden
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                size="sm"
                                header={
                                    <DropdownMenuHeader
                                        title={s.name}
                                        description={`${currencyBRL(Number(s.amount))} · próxima ${formatDatePtBr(nextCharge)}`}
                                    />
                                }
                            >
                                <DropdownMenuItem
                                    onClick={() => setDetailMode("edit")}
                                >
                                    <PencilIcon aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive"
                                    onClick={() => onDelete(s)}
                                >
                                    <TrashIcon aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="icon-sm"
                            className="shrink-0 -mr-1"
                            onClick={() => onOpenChange(false)}
                            aria-label="Fechar"
                        >
                            <XMarkIcon aria-hidden />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
                <Card asChild variant="muted" className="gap-3 px-4">
                <section>
                    <div className="flex items-center justify-between gap-3">
                        <SectionLabel className="shrink-0">Resumo</SectionLabel>
                        <div
                            className="flex shrink-0 items-center gap-1.5 sm:gap-2"
                            title={
                                statusActive
                                    ? "Cobranças automáticas ativas"
                                    : "Pausada — sem cobranças novas"
                            }
                        >
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {statusActive ? "Ativa" : "Pausada"}
                            </span>
                            <Switch
                                size="sm"
                                checked={statusActive}
                                pending={activeToggleSaving}
                                aria-label={
                                    statusActive
                                        ? "Pausar assinatura"
                                        : "Ativar assinatura"
                                }
                                onCheckedChange={(next) => {
                                    commitStatus(next)
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Nome</p>
                        <p className="mt-0.5 text-lg font-medium leading-snug text-foreground">
                            {s.name}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                            {currencyBRL(Number(s.amount))}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Próxima cobrança
                        </p>
                        <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                            {formatDatePtBr(nextCharge)}
                        </p>
                    </div>
                </section>
                </Card>

                <section className="space-y-3">
                    <SectionLabel>Detalhes</SectionLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <CardField label="Periodicidade">
                            <p className="text-sm text-foreground">
                                {subscriptionBillingIntervalLabel(
                                    s.billing_interval
                                )}
                            </p>
                        </CardField>
                        <CardField label="Categoria">
                            {s.category ? (
                                <p className="inline-flex items-center gap-2 text-sm">
                                    <span
                                        className="size-2 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor:
                                                s.category.color ||
                                                "var(--muted-foreground)",
                                        }}
                                        aria-hidden
                                    />
                                    {s.category.name}
                                </p>
                            ) : (
                                <p className="text-sm">—</p>
                            )}
                        </CardField>
                        <CardField label="Forma de cobrança" className="sm:col-span-2">
                            <p className="text-sm text-foreground">
                                {paymentSummary ?? "—"}
                            </p>
                            {s.payment_method === "credit_card" &&
                            s.payment_credit_card_id &&
                            !paymentCard ? (
                                <p className="text-xs text-muted-foreground">
                                    Cartão não encontrado (removido ou inativo).
                                    Edite a assinatura para escolher outro cartão
                                    em{" "}
                                    <Link
                                        href={creditCardsHref}
                                        className="font-medium text-foreground underline-offset-2 hover:underline"
                                    >
                                        Cartões de crédito
                                    </Link>
                                    .
                                </p>
                            ) : null}
                        </CardField>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Cobranças em transações</SectionLabel>
                    <div className="overflow-hidden rounded-row-lg border border-border/80 bg-gradient-to-b from-muted/30 to-muted/10 p-3.5 dark:from-muted/15 dark:to-muted/5 sm:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                    Assinatura vinculada ao extrato
                                </p>
                                <p className="mt-0.5 text-2xs text-muted-foreground">
                                    {txSummaryLine}
                                </p>
                            </div>
                        </div>

                        {/* Carregando, a tabela inteira espera — cabeçalho em
                            versalete igual ao de verdade, para não pular. */}
                        {latestChargeLoading ? (
                            <TableSkeleton
                                variant="outline"
                                size="sm"
                                className="mt-3 min-w-70"
                                headerVariant="plain"
                                headerLabels="caps"
                                columns={[
                                    { label: "Cobrança" },
                                    { label: "Valor", numeric: true },
                                    { label: "Status" },
                                ]}
                                rows={1}
                                label="Carregando cobranças…"
                            />
                        ) : (
                            <Table variant="outline" size="sm" className="mt-3 min-w-70">
                                <TableHeader labels="caps">
                                    <TableRow>
                                        <TableHead>
                                            Cobrança
                                        </TableHead>
                                        <TableHead numeric>
                                            Valor
                                        </TableHead>
                                        <TableHead>
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subscriptionChargeRows.length > 0 ? (
                                        subscriptionChargeRows.map((row) => (
                                            <TableRow
                                                key={row.key}
                                                // A cobrança já lançada é a de agora;
                                                // a próxima ainda não aconteceu.
                                                state={row.status !== "pending" ? "current" : undefined}
                                            >
                                                <TableCell className="max-w-36 truncate tabular-nums text-muted-foreground">
                                                    {row.date
                                                        ? formatDatePtBr(row.date.slice(0, 10))
                                                        : "—"}
                                                </TableCell>
                                                <TableCell numeric className="font-medium">
                                                    {currencyBRL(row.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            "inline-flex h-5 w-fit items-center justify-center rounded-full border-0 px-2 py-0 text-2xs font-medium uppercase tracking-wide",
                                                            subscriptionChargeStatusChipClassName(
                                                                row.status
                                                            )
                                                        )}
                                                    >
                                                        {row.status === "pending"
                                                            ? "Próxima"
                                                            : row.status === "paid"
                                                              ? "Paga"
                                                              : "Lançada"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableEmpty colSpan={3}>
                                            Nenhuma cobrança para exibir.
                                        </TableEmpty>
                                    )}
                                </TableBody>
                            </Table>
                        )}

                    </div>
                </section>

                {s.notes ? (
                    <section className="space-y-2">
                        <SectionLabel>Observações</SectionLabel>
                        <CardField>
                            <p className="whitespace-pre-wrap text-muted-foreground">{s.notes}</p>
                        </CardField>
                    </section>
                ) : null}
            </div>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                variant="flush"
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-modal pt-0 sm:max-w-full"
                )}
            >
                {detailMode === "edit" ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                        <SubscriptionFormSurface
                            variant="detail-sheet"
                            handleSubmit={handleSubmit}
                            fieldsProps={fieldsProps}
                            formTitle={formTitle}
                            formDescription={formDescription}
                            showFooter={showFooter}
                            submitDisabled={submitDisabled}
                            submitLabel={submitLabel}
                            saving={saving}
                            // Cancelar sai da edição, não da folha: a assinatura
                            // continua à vista, como na folha de transação.
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
