"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import type { CreditCard, WorkspaceSubscriptionListRow } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { mobileSheetChromeBelowHeaderClassName } from "@/components/ui/mobile-sheet-form-chrome"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { subscriptionBillingIntervalLabel } from "@/components/subscriptions/subscription-form-shared"
import type { ExpenseCategoryOption } from "@/components/subscriptions/subscription-form-shared"
import type { SubscriptionFormPayload } from "@/components/subscriptions/subscription-form-shared"
import { SubscriptionFormSurface } from "@/components/subscriptions/subscription-form-surface"
import { useSubscriptionForm } from "@/components/subscriptions/use-subscription-form"
import { ArrowPathIcon, EllipsisHorizontalIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import {
    tagChipSky,
    tagChipSuccess,
    tagChipWarning,
} from "@/lib/tag-chip-classes"
import { formatDatePtBr } from "@/lib/transaction-date"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

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

function addSubscriptionIntervalYmd(
    ymd: string,
    interval: WorkspaceSubscriptionListRow["billing_interval"]
): string {
    const [y, m, d] = ymd.split("-").map(Number)
    if (!y || !m || !d) return ymd
    const dt = new Date(y, m - 1, d)
    if (interval === "weekly") {
        dt.setDate(dt.getDate() + 7)
    } else if (interval === "yearly") {
        dt.setFullYear(dt.getFullYear() + 1)
    } else {
        dt.setMonth(dt.getMonth() + 1)
    }
    const yy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
    return `${yy}-${mm}-${dd}`
}

function subscriptionChargeStatusChipClassName(
    status: SubscriptionChargeRow["status"]
): string {
    if (status === "pending") return tagChipWarning
    if (status === "paid") return tagChipSuccess
    return tagChipSky
}

function SectionLabel({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <p
            className={cn(
                "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                className
            )}
        >
            {children}
        </p>
    )
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
                      s?.billing_interval ?? "monthly"
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
    }, [latestCharge, nextCharge, s?.amount, s?.billing_interval])

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
            {isMobile ? <SheetDragHandle /> : null}
            <SheetDescription className="sr-only">
                Assinatura {s.name}. Valor {currencyFmt.format(Number(s.amount))}.
                Próxima cobrança {formatDatePtBr(nextCharge)}.
            </SheetDescription>
            <div
                className={cn(
                    "shrink-0 border-b border-border",
                    mobileSheetChromeBelowHeaderClassName,
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
                            <SheetTitle className="font-heading text-base font-medium leading-tight">
                                Detalhe da assinatura
                            </SheetTitle>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0"
                                    aria-label="Mais opções"
                                >
                                    <EllipsisHorizontalIcon
                                        className="h-5 w-5"
                                        aria-hidden
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                    onClick={() => setDetailMode("edit")}
                                >
                                    <PencilIcon className="h-4 w-4" aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(s)}
                                >
                                    <TrashIcon className="h-4 w-4" aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 -mr-1"
                            onClick={() => onOpenChange(false)}
                            aria-label="Fechar"
                        >
                            <XMarkIcon className="h-5 w-5" aria-hidden />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5">
                <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 dark:bg-muted/10">
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
                            {activeToggleSaving ? (
                                <ArrowPathIcon
                                    className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                                    aria-hidden
                                />
                            ) : (
                                <span className="whitespace-nowrap text-xs text-muted-foreground">
                                    {statusActive ? "Ativa" : "Pausada"}
                                </span>
                            )}
                            <Switch
                                size="sm"
                                checked={statusActive}
                                disabled={activeToggleSaving}
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
                            {currencyFmt.format(Number(s.amount))}
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

                <section className="space-y-3">
                    <SectionLabel>Detalhes</SectionLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                Periodicidade
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                                {subscriptionBillingIntervalLabel(
                                    s.billing_interval
                                )}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                Categoria
                            </p>
                            {s.category ? (
                                <p className="mt-1 inline-flex items-center gap-2 text-sm">
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
                                <p className="mt-1 text-sm">—</p>
                            )}
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/80 p-3 sm:col-span-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                Forma de cobrança
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                                {paymentSummary ?? "—"}
                            </p>
                            {s.payment_method === "credit_card" &&
                            s.payment_credit_card_id &&
                            !paymentCard ? (
                                <p className="mt-1 text-xs text-muted-foreground">
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
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Cobranças em transações</SectionLabel>
                    <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-muted/30 to-muted/10 p-3.5 dark:from-muted/15 dark:to-muted/5 sm:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                    Assinatura vinculada ao extrato
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {txSummaryLine}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 overflow-x-auto rounded-lg border border-border/50 bg-background/40">
                            <Table className="min-w-[280px] text-xs">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-8 px-2 text-[10px] font-semibold uppercase tracking-wide">
                                            Cobrança
                                        </TableHead>
                                        <TableHead className="h-8 px-2 text-right text-[10px] font-semibold uppercase tracking-wide">
                                            Valor
                                        </TableHead>
                                        <TableHead className="h-8 px-2 text-[10px] font-semibold uppercase tracking-wide">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {latestChargeLoading ? (
                                        <TableRow className="h-9 border-border/40 hover:bg-transparent">
                                            <TableCell className="px-2 py-1.5">
                                                <Skeleton className="h-3.5 w-20 rounded-md" />
                                            </TableCell>
                                            <TableCell className="px-2 py-1.5">
                                                <Skeleton className="ml-auto h-3.5 w-16 rounded-md" />
                                            </TableCell>
                                            <TableCell className="px-2 py-1.5">
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </TableCell>
                                        </TableRow>
                                    ) : subscriptionChargeRows.length > 0 ? (
                                        subscriptionChargeRows.map((row) => (
                                            <TableRow
                                                key={row.key}
                                                className={cn(
                                                    "h-9 border-border/40",
                                                    row.status !== "pending" &&
                                                        "bg-muted/50 dark:bg-muted/30"
                                                )}
                                            >
                                                <TableCell className="max-w-[9rem] truncate px-2 py-1.5 tabular-nums text-muted-foreground">
                                                    {row.date
                                                        ? formatDatePtBr(row.date.slice(0, 10))
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="px-2 py-1.5 text-right tabular-nums font-medium">
                                                    {currencyFmt.format(row.amount)}
                                                </TableCell>
                                                <TableCell className="px-2 py-1.5">
                                                    <span
                                                        className={cn(
                                                            "inline-flex h-5 w-fit items-center justify-center rounded-full border-0 px-2 py-0 text-[9px] font-medium uppercase tracking-wide",
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
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell
                                                colSpan={3}
                                                className="h-10 px-2 text-center text-muted-foreground"
                                            >
                                                Nenhuma cobrança para exibir.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                    </div>
                </section>

                {s.notes ? (
                    <section className="space-y-2">
                        <SectionLabel>Observações</SectionLabel>
                        <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                {s.notes}
                            </p>
                        </div>
                    </section>
                ) : null}
            </div>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-2xl pt-0 sm:max-w-full"
                )}
                showCloseButton={false}
            >
                {detailMode === "edit" ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
                        {isMobile ? <SheetDragHandle /> : null}
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
                            onCancel={() => onOpenChange(false)}
                        />
                    </div>
                ) : (
                    viewBody
                )}
            </SheetContent>
        </Sheet>
    )
}
