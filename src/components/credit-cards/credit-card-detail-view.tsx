"use client"

import { useState } from "react"
import Link from "next/link"
import type { CreditCard, CreditCardInvoicePayment } from "@/lib/supabase"
import type { CreditCardInvoiceAnalytics } from "@/lib/credit-card-invoice-analytics"
import type { CardCycleSnapshot } from "@/lib/credit-card-billing"
import { formatDatePtBr } from "@/lib/credit-card-billing"
import {
    CC_DETAIL_INVOICE_POSTED_EMPTY_MESSAGE,
    formatCcDetailInvoicePostedShowingFooter,
} from "@/lib/credit-cards-workspace-transactions"
import type { Transaction } from "@/lib/supabase"
import type { WorkspaceMemberDirectoryEntry } from "@/components/dashboard/use-dashboard-data"
import { DashboardRecentTransactions } from "@/components/dashboard/dashboard-recent-transactions"
import { CreditCardInvoiceAnalyticsPanel } from "@/components/credit-cards/credit-card-invoice-analytics-panel"
import { CreditCardFaceTilt } from "@/components/credit-cards/credit-card-face-tilt"
import { RegisteredCreditCardFace } from "@/components/credit-cards/registered-credit-card-face"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowUpRightIcon,
    ChevronDownIcon,
    EllipsisHorizontalIcon,
    PencilIcon,
    PowerIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"
import { PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

function formatExpiryLine(card: CreditCard): string | null {
    const m = card.expiry_month
    const y = card.expiry_year
    if (m == null || y == null || m < 1 || m > 12) return null
    const yy = y >= 100 ? y % 100 : y
    return `${String(m).padStart(2, "0")}/${String(yy).padStart(2, "0")}`
}

function parseIsoToLocalDate(iso: string): Date | null {
    const s = iso.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [y, mo, d] = s.slice(0, 10).split("-").map(Number)
        if ([y, mo, d].some((n) => Number.isNaN(n))) return null
        return new Date(y, mo - 1, d, 12, 0, 0, 0)
    }
    const parsed = new Date(s)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type CreditCardDetailViewProps = {
    card: CreditCard
    workspaceId?: string
    /** Current user (required to record invoice payments). */
    userId?: string
    invoicePayments?: CreditCardInvoicePayment[]
    onInvoicePaymentChanged?: () => void | Promise<void>
    snapshot: CardCycleSnapshot | null
    invoiceAnalytics: CreditCardInvoiceAnalytics | null
    transactionsHref: string
    invoiceTransactions: Transaction[]
    /** Total de despesas postadas na janela da fatura (antes do limite de exibição). */
    invoicePostedTotalInPeriod: number
    invoicePostedDisplayCap: number
    invoicePeriodYm: string
    memberDirectoryByUserId: Record<string, WorkspaceMemberDirectoryEntry>
    currentUserId?: string | null
    invoicePaidByCardClose?: ReadonlySet<string>
    onTransactionClick?: (transaction: Transaction) => void
    /** Selected billing cycle vs today (0 = current). From credit card detail page. */
    cycleOffset?: number
    cycleOffsetBounds?: { min: number; max: number }
    onCycleOffsetChange?: (next: number) => void
    onEdit: () => void
    onDelete: () => void
    onSetActive?: (active: boolean) => void | Promise<void>
    onInstallmentPlanPress?: (planId: string) => void
}

export function CreditCardDetailView({
    card,
    workspaceId,
    userId,
    invoicePayments = [],
    onInvoicePaymentChanged,
    snapshot,
    invoiceAnalytics,
    transactionsHref,
    invoiceTransactions,
    invoicePostedTotalInPeriod,
    invoicePostedDisplayCap,
    invoicePeriodYm,
    memberDirectoryByUserId,
    currentUserId,
    invoicePaidByCardClose,
    onTransactionClick,
    cycleOffset = 0,
    cycleOffsetBounds = { min: 0, max: 0 },
    onCycleOffsetChange,
    onEdit,
    onDelete,
    onSetActive,
    onInstallmentPlanPress,
}: CreditCardDetailViewProps) {
    const [fichaExpanded, setFichaExpanded] = useState(false)

    const invoicePostedListTruncated =
        invoicePostedTotalInPeriod > invoicePostedDisplayCap

    const limitNum =
        card.credit_limit != null ? Number(card.credit_limit) : null
    const openLimitPct =
        snapshot != null && limitNum != null && limitNum > 0
            ? Math.min(
                  100,
                  (snapshot.committedOpenTotal / limitNum) * 100
              )
            : null

    const createdAt = parseIsoToLocalDate(card.created_at)
    const updatedAt = parseIsoToLocalDate(card.updated_at)
    const expiryLine = formatExpiryLine(card)

    return (
        <div className="w-full min-w-0 space-y-6">
            <p className="sr-only">
                Cartão {card.name}, final {card.last_four}.
                {card.brand?.trim() ? ` Bandeira ${card.brand.trim()}.` : ""}
            </p>

            <div className="flex flex-col items-center gap-3">
                <div className="mx-auto w-full max-w-sm">
                    <CreditCardFaceTilt className="w-full">
                        <RegisteredCreditCardFace card={card} size="md" />
                    </CreditCardFaceTilt>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2"
                    asChild
                >
                    <Link href={transactionsHref}>
                        <ArrowUpRightIcon className="size-3.5 shrink-0" aria-hidden />
                        Ver transações neste cartão
                    </Link>
                </Button>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base leading-snug">
                                {card.name}
                            </CardTitle>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 pl-1">
                            <Badge
                                size="sm"
                                variant={card.is_active ? "success" : "outline"}
                                className="shrink-0"
                            >
                                {card.is_active ? "Ativo" : "Inativo"}
                            </Badge>
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
                                <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                >
                                    <DropdownMenuItem onClick={() => onEdit()}>
                                        <PencilIcon className="h-4 w-4" aria-hidden />
                                        Editar
                                    </DropdownMenuItem>
                                    {onSetActive ? (
                                        <DropdownMenuItem
                                            onClick={() =>
                                                void onSetActive(!card.is_active)
                                            }
                                        >
                                            {card.is_active ? (
                                                <>
                                                    <PowerOff
                                                        className="h-4 w-4"
                                                        aria-hidden
                                                    />
                                                    Desativar cartão
                                                </>
                                            ) : (
                                                <>
                                                    <PowerIcon
                                                        className="h-4 w-4"
                                                        aria-hidden
                                                    />
                                                    Ativar cartão
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => onDelete()}
                                    >
                                        <TrashIcon className="h-4 w-4" aria-hidden />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="border-t border-border/50 px-4 py-3">
                    <div id="cc-ficha-details" hidden={!fichaExpanded}>
                        {fichaExpanded && (
                            <>
                                <p className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Ficha do cartão
                                </p>
                                <dl className="grid gap-2 text-sm">
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">Nome</dt>
                                        <dd className="text-right font-medium text-foreground">
                                            {card.name}
                                        </dd>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">Bandeira</dt>
                                        <dd className="text-right font-medium text-foreground">
                                            {card.brand?.trim() || "—"}
                                        </dd>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">Final</dt>
                                        <dd className="tabular-nums font-medium text-foreground">
                                            •••• {card.last_four}
                                        </dd>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">Validade</dt>
                                        <dd className="tabular-nums font-medium text-foreground">
                                            {expiryLine ?? "—"}
                                        </dd>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">
                                            Fechamento / vencimento
                                        </dt>
                                        <dd className="text-right font-medium text-foreground">
                                            Dia {card.closing_day} · Dia {card.due_day}
                                        </dd>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">Limite</dt>
                                        <dd className="tabular-nums font-medium text-foreground">
                                            {limitNum != null && !Number.isNaN(limitNum)
                                                ? currencyFmt.format(limitNum)
                                                : "—"}
                                        </dd>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                        <dt className="text-muted-foreground">Status</dt>
                                        <dd className="text-right font-medium text-foreground">
                                            {card.is_active ? "Ativo" : "Inativo"}
                                        </dd>
                                    </div>
                                    {createdAt ? (
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                            <dt className="text-muted-foreground">
                                                Cadastrado em
                                            </dt>
                                            <dd className="tabular-nums text-foreground">
                                                {formatDatePtBr(createdAt)}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {updatedAt ? (
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                            <dt className="text-muted-foreground">
                                                Atualizado em
                                            </dt>
                                            <dd className="tabular-nums text-foreground">
                                                {formatDatePtBr(updatedAt)}
                                            </dd>
                                        </div>
                                    ) : null}
                                </dl>
                                {!card.is_active ? (
                                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                                        Cartão inativo — não aparece ao lançar despesas no
                                        crédito.
                                    </p>
                                ) : null}
                            </>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-8 min-h-8 w-full justify-center gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:text-foreground",
                            fichaExpanded && "mt-3"
                        )}
                        onClick={() => setFichaExpanded((e) => !e)}
                        aria-expanded={fichaExpanded}
                        aria-controls="cc-ficha-details"
                    >
                        {fichaExpanded ? "Ver menos" : "Ver mais"}
                        <ChevronDownIcon
                            className={cn(
                                "size-4 transition-transform duration-300",
                                fichaExpanded && "rotate-180"
                            )}
                            aria-hidden
                        />
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {snapshot && invoiceAnalytics ? (
                    <CreditCardInvoiceAnalyticsPanel
                        analytics={invoiceAnalytics}
                        snapshot={snapshot}
                        openLimitPct={openLimitPct}
                        workspaceId={workspaceId}
                        cardId={card.id}
                        userId={userId}
                        invoicePayments={invoicePayments}
                        onInvoicePaymentChanged={onInvoicePaymentChanged}
                        invoiceDueDay={card.due_day}
                        cycleOffset={cycleOffset}
                        cycleOffsetBounds={cycleOffsetBounds}
                        onCycleOffsetChange={onCycleOffsetChange}
                        onInstallmentPlanPress={onInstallmentPlanPress}
                    />
                ) : null}

                {invoicePeriodYm ? (
                    <DashboardRecentTransactions
                        transactions={invoiceTransactions}
                        memberDirectoryByUserId={memberDirectoryByUserId}
                        currentUserId={currentUserId}
                        calendarYm={invoicePeriodYm}
                        invoicePaidByCardClose={invoicePaidByCardClose}
                        onTransactionClick={onTransactionClick}
                        sectionTitle="Últimos lançamentos"
                        viewAllHref={transactionsHref}
                        viewAllLabel="Ver todas as transações neste cartão"
                        emptyMessage={CC_DETAIL_INVOICE_POSTED_EMPTY_MESSAGE}
                        truncationFooter={
                            invoicePostedListTruncated
                                ? {
                                      displayedCount: invoiceTransactions.length,
                                      totalCount: invoicePostedTotalInPeriod,
                                      message: formatCcDetailInvoicePostedShowingFooter(
                                          invoiceTransactions.length,
                                          invoicePostedTotalInPeriod
                                      ),
                                      href: transactionsHref,
                                      linkLabel:
                                          "Ver todas as transações neste cartão",
                                  }
                                : undefined
                        }
                    />
                ) : null}
            </div>
        </div>
    )
}
