"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Plus, Receipt, SearchX } from "lucide-react"

import { ROUTES } from "@/config/navigation"
import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import {
    buildTransactionsListSearchParams,
    mergeTransactionsSearchParams,
} from "@/lib/transactions-list-search-params"
import type { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import {
    applyCategoryTransactionListFilters,
    sortCategoryExpenseMonthRows,
} from "@/lib/category-expense-month-rows"
import type { Transaction } from "@/lib/supabase"
import { TransactionsToolbar } from "@/components/transactions/transactions-toolbar"
import { TransactionsActiveFiltersChips } from "@/components/transactions/transactions-active-filters-chips"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PAGE_SIZE = 100

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export function CategoryEmbeddedTransactions({
    categoryType,
    controller,
    expenseMonthRows = null,
    yearMonth,
}: {
    categoryType: "income" | "expense"
    controller: ReturnType<typeof useTransactionsListController>
    /** Expense categories: posted + projected rows from category detail bundle. */
    expenseMonthRows?: Transaction[] | null
    yearMonth?: string
}) {
    const c = controller

    const {
        user: _user,
        authLoading,
        currentWorkspaceId,
        workspaceLoading,
        workspaceError,
        transactions,
        categories,
        creditCards,
        invoicePaidByCardClose,
        totalCount,
        page,
        setPage,
        dialogOpen,
        editingTransaction,
        saving,
        pendingDelete,
        setPendingDelete,
        deleting,
        selectedIds,
        setSelectedIds,
        filterType,
        setFilterType,
        fullPeriod,
        setFullPeriod,
        filterDateFrom,
        setFilterDateFrom,
        filterDateTo,
        setFilterDateTo,
        datePreset,
        setDatePreset,
        filterPaymentMethods,
        setFilterPaymentMethods,
        filterCreditCardIds,
        setFilterCreditCardIds,
        filterCategoryIds,
        filterUncategorizedOnly,
        setFilterUncategorizedOnly,
        filterAmountMin,
        setFilterAmountMin,
        filterAmountMax,
        setFilterAmountMax,
        filterDescriptionQuery,
        setFilterDescriptionQuery,
        filterInstallmentsOnly,
        setFilterInstallmentsOnly,
        filterInstallmentPlanId,
        setFilterInstallmentPlanId,
        filterSubscriptionId,
        setFilterSubscriptionId,
        setFiltersSheetOpen,
        installmentPlans,
        subscriptions,
        sortKey,
        sortDir,
        detailTransaction,
        setDetailTransaction,
        detailOpen,
        setDetailOpen,
        detailLaunchEdit,
        setDetailLaunchEdit,
        syncPeriodDraftToApplied,
        handleDialogOpenChange,
        handleSave,
        handleSaveInstallmentPlan,
        handleUpdateInstallmentPlan,
        confirmDelete,
        toggleSort,
        resetAllFilters,
        clearPeriodFilter,
        handleSelectFullPeriod,
        toggleFilterCategory,
        advancedFiltersActive,
        anyFiltersActive,
        lockPeriodToDefault,
        filtersPanelProps,
        hasNoTransactions,
        hasNoMatches,
        openDialog,
        openTransactionDetail,
        handleDetailLaunchEditConsumed,
    } = c

    void _user

    const useBundleExpenseRows = expenseMonthRows != null

    React.useEffect(() => {
        if (!useBundleExpenseRows || !yearMonth) return
        setPage(0)
    }, [setPage, useBundleExpenseRows, yearMonth])

    const bundleFilteredRows = React.useMemo(() => {
        if (!useBundleExpenseRows || !expenseMonthRows) return null
        const filtered = applyCategoryTransactionListFilters(expenseMonthRows, {
            filterType,
            filterCreditCardIds,
            filterPaymentMethods,
            filterAmountMin,
            filterAmountMax,
            filterDescriptionQuery,
            filterInstallmentsOnly,
            filterInstallmentPlanId,
            filterSubscriptionId,
        })
        return sortCategoryExpenseMonthRows(filtered, sortKey, sortDir)
    }, [
        expenseMonthRows,
        filterAmountMax,
        filterAmountMin,
        filterCreditCardIds,
        filterDescriptionQuery,
        filterInstallmentPlanId,
        filterInstallmentsOnly,
        filterPaymentMethods,
        filterSubscriptionId,
        filterType,
        sortDir,
        sortKey,
        useBundleExpenseRows,
    ])

    const displayTransactions = useBundleExpenseRows
        ? (bundleFilteredRows ?? []).slice(
              page * PAGE_SIZE,
              page * PAGE_SIZE + PAGE_SIZE,
          )
        : transactions

    const displayTotalCount = useBundleExpenseRows
        ? (bundleFilteredRows?.length ?? 0)
        : totalCount

    const displayHasNoTransactions = useBundleExpenseRows
        ? (expenseMonthRows?.length ?? 0) === 0
        : hasNoTransactions

    const displayHasNoMatches = useBundleExpenseRows
        ? (expenseMonthRows?.length ?? 0) > 0 &&
          (bundleFilteredRows?.length ?? 0) === 0
        : hasNoMatches

    const transactionsListHref = React.useMemo(() => {
        const next = buildTransactionsListSearchParams({
            filterType,
            fullPeriod,
            datePreset,
            filterDateFrom,
            filterDateTo,
            filterCreditCardIds,
            filterPaymentMethods,
            filterCategoryIds,
            filterUncategorizedOnly,
            filterAmountMin,
            filterAmountMax,
            filterDescriptionQuery,
            filterInstallmentsOnly,
            filterInstallmentPlanId,
            filterSubscriptionId,
            // Deep links should include `cats=…` even though embedded mode omits it from the host URL.
            lockedCategoryId: null,
        })
        const merged = mergeTransactionsSearchParams(
            new URLSearchParams(""),
            next
        )
        const qs = merged.toString()
        return qs ? `${ROUTES.TRANSACTIONS}?${qs}` : ROUTES.TRANSACTIONS
    }, [
        datePreset,
        filterAmountMax,
        filterAmountMin,
        filterCategoryIds,
        filterCreditCardIds,
        filterDateFrom,
        filterDateTo,
        filterDescriptionQuery,
        filterInstallmentsOnly,
        filterInstallmentPlanId,
        filterPaymentMethods,
        filterSubscriptionId,
        filterType,
        filterUncategorizedOnly,
        fullPeriod,
    ])

    if (workspaceError) {
        return (
            <Card>
                <CardContent className="py-6 text-sm text-red-500">
                    {workspaceError}
                </CardContent>
            </Card>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                    Nenhum espaço de trabalho selecionado. Escolha um espaço no menu
                    lateral para continuar.
                </CardContent>
            </Card>
        )
    }

    return (
        <section className="min-w-0 max-w-full space-y-3" aria-label="Lançamentos do mês">
            <div className="min-w-0 max-w-full space-y-3">
                    <TransactionsToolbar
                        filterType={filterType}
                        onFilterTypeChange={setFilterType}
                        showTransactionTypeSegment={false}
                        baselineTransactionFilterType={categoryType}
                        hidePeriodInFilters={lockPeriodToDefault}
                        treatPeriodAsAlwaysDefault={lockPeriodToDefault}
                        toolbarLeading={() => (
                            <div className="flex h-8 min-w-0 items-end">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Lançamentos do mês
                                </p>
                            </div>
                        )}
                        toolbarAfterFilters={() => (
                            <Button
                                asChild
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 min-w-0 flex-1 gap-2 px-2 text-xs md:h-8 md:w-auto"
                            >
                                <Link href={transactionsListHref}>
                                    <ExternalLink className="size-3.5 shrink-0 md:size-4" />
                                    <span className="truncate">Ver em Transações</span>
                                </Link>
                            </Button>
                        )}
                        fullPeriod={fullPeriod}
                        filterDateFrom={filterDateFrom}
                        filterDateTo={filterDateTo}
                        datePreset={datePreset}
                        onSelectFullPeriod={handleSelectFullPeriod}
                        onPresetChange={({ preset, from, to }) => {
                            setDatePreset(preset)
                            setFilterDateFrom(from)
                            setFilterDateTo(to)
                            setFullPeriod(false)
                        }}
                        onDateRangeApply={({ from, to }) => {
                            setDatePreset(null)
                            setFilterDateFrom(from)
                            setFilterDateTo(to)
                            setFullPeriod(false)
                        }}
                        onClearPeriodFilter={clearPeriodFilter}
                        resetAllFilters={resetAllFilters}
                        advancedFiltersActive={advancedFiltersActive}
                        filtersPanel={filtersPanelProps}
                        activeFiltersChips={
                            anyFiltersActive ? (
                                <TransactionsActiveFiltersChips
                                    filterType={filterType}
                                    onClearType={() => setFilterType("all")}
                                    fullPeriod={fullPeriod}
                                    datePreset={datePreset}
                                    filterDateFrom={filterDateFrom}
                                    filterDateTo={filterDateTo}
                                    onClearPeriod={() => clearPeriodFilter()}
                                    filterCreditCardIds={filterCreditCardIds}
                                    onRemoveCreditCardId={(id) =>
                                        setFilterCreditCardIds((prev) =>
                                            prev.filter((x) => x !== id)
                                        )
                                    }
                                    creditCards={creditCards}
                                    filterPaymentMethods={filterPaymentMethods}
                                    onRemovePaymentMethod={(method) =>
                                        setFilterPaymentMethods((prev) =>
                                            prev.filter((x) => x !== method)
                                        )
                                    }
                                    filterInstallmentsOnly={filterInstallmentsOnly}
                                    onClearInstallmentsOnly={() =>
                                        setFilterInstallmentsOnly(false)
                                    }
                                    filterInstallmentPlanId={filterInstallmentPlanId}
                                    onClearInstallmentPlan={() =>
                                        setFilterInstallmentPlanId(null)
                                    }
                                    installmentPlans={installmentPlans}
                                    filterSubscriptionId={filterSubscriptionId}
                                    onClearSubscription={() =>
                                        setFilterSubscriptionId(null)
                                    }
                                    subscriptions={subscriptions}
                                    filterCategoryIds={filterCategoryIds}
                                    onRemoveCategoryId={(id) =>
                                        toggleFilterCategory(id)
                                    }
                                    categories={categories}
                                    filterUncategorizedOnly={filterUncategorizedOnly}
                                    onClearUncategorizedOnly={() =>
                                        setFilterUncategorizedOnly(false)
                                    }
                                    filterAmountMin={filterAmountMin}
                                    filterAmountMax={filterAmountMax}
                                    onClearAmount={() => {
                                        setFilterAmountMin("")
                                        setFilterAmountMax("")
                                    }}
                                    filterDescriptionQuery={filterDescriptionQuery}
                                    onClearDescriptionQuery={() =>
                                        setFilterDescriptionQuery("")
                                    }
                                    hideCategoryFilters
                                    hideTypeFilter
                                    hidePeriodFilter={lockPeriodToDefault}
                                />
                            ) : null
                        }
                        onFiltersSheetOpenChange={(open) => {
                            setFiltersSheetOpen(open)
                            if (!open) {
                                syncPeriodDraftToApplied()
                                return
                            }
                            syncPeriodDraftToApplied()
                        }}
                    />

                    <TransactionFormDialog
                        open={dialogOpen && editingTransaction !== null}
                        onOpenChange={handleDialogOpenChange}
                        editingTransaction={editingTransaction}
                        defaultLaunchKind="expense"
                        categories={categories}
                        creditCards={creditCards}
                        categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                        creditCardsHref={ROUTES.CREDIT_CARDS}
                        saving={saving}
                        onSave={handleSave}
                        onSaveInstallmentPlan={handleSaveInstallmentPlan}
                        onUpdateInstallmentPlan={handleUpdateInstallmentPlan}
                    />

                    {detailTransaction ? (
                        <TransactionDetailSheet
                            transaction={detailTransaction}
                            open={detailOpen}
                            onOpenChange={(next) => {
                                setDetailOpen(next)
                                if (!next) {
                                    setDetailTransaction(null)
                                    setDetailLaunchEdit(false)
                                }
                            }}
                            creditCards={creditCards}
                            categories={categories}
                            categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                            creditCardsHref={ROUTES.CREDIT_CARDS}
                            subscriptionsHref={ROUTES.SUBSCRIPTIONS}
                            saving={saving}
                            onSave={handleSave}
                            onUpdateInstallmentPlan={handleUpdateInstallmentPlan}
                            launchInEditMode={detailLaunchEdit}
                            onLaunchEditConsumed={handleDetailLaunchEditConsumed}
                            onDelete={(tx) => {
                                setDetailOpen(false)
                                setDetailTransaction(null)
                                setPendingDelete({ mode: "single", transaction: tx })
                            }}
                        />
                    ) : null}

                    {!displayHasNoTransactions && !displayHasNoMatches ? (
                        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                            <CardContent className="relative flex flex-col p-0">
                                <TransactionsTable
                                    transactions={displayTransactions}
                                    selectedIds={selectedIds}
                                    setSelectedIds={setSelectedIds}
                                    sortKey={sortKey}
                                    sortDir={sortDir}
                                    onToggleSort={toggleSort}
                                    openTransactionDetail={openTransactionDetail}
                                    onDeleteSingle={(transaction) =>
                                        setPendingDelete({ mode: "single", transaction })
                                    }
                                    onDeleteBulk={(ids) =>
                                        setPendingDelete({ mode: "bulk", ids })
                                    }
                                    page={page}
                                    setPage={setPage}
                                    pageSize={PAGE_SIZE}
                                    totalCount={displayTotalCount}
                                    invoicePaidByCardClose={invoicePaidByCardClose}
                                />
                            </CardContent>
                        </Card>
                    ) : displayHasNoMatches ? (
                        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                            <CardContent
                                className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                                role="status"
                                aria-live="polite"
                            >
                                <div
                                    className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                                    aria-hidden
                                >
                                    <SearchX className="size-7 text-muted-foreground" />
                                </div>
                                <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                    Nenhuma transação com esses filtros
                                </h2>
                                <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                                    Tente outro tipo (receita/despesa), ampliar o período ou ajustar os filtros
                                    avançados.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="min-w-[10rem] text-xs"
                                    onClick={() => {
                                        resetAllFilters()
                                    }}
                                >
                                    Limpar filtros
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                            <CardContent
                                className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                                role="status"
                                aria-live="polite"
                            >
                                <div
                                    className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                                    aria-hidden
                                >
                                    <Receipt className="size-7 text-muted-foreground" />
                                </div>
                                <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                    Comece a registrar suas movimentações
                                </h2>
                                <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                                    Lance receitas e despesas para ver o histórico aqui.
                                </p>
                                <Button
                                    type="button"
                                    size="lg"
                                    onClick={() => openDialog()}
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    Nova transação
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <AlertDialog
                        open={pendingDelete !== null}
                        onOpenChange={(open) => {
                            if (!open && !deleting) setPendingDelete(null)
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {pendingDelete?.mode === "bulk"
                                        ? `Excluir ${pendingDelete.ids.length.toLocaleString("pt-BR")} transações?`
                                        : "Excluir transação?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>Esta ação não pode ser desfeita.</p>
                                        {pendingDelete?.mode === "single" ? (
                                            <ul className="list-inside list-disc text-foreground">
                                                <li>
                                                    {formatTransactionDayPtBr(
                                                        pendingDelete.transaction.date
                                                    )}{" "}
                                                    —{" "}
                                                    {pendingDelete.transaction.description ||
                                                        pendingDelete.transaction.category?.name ||
                                                        "Sem descrição"}
                                                </li>
                                                <li className="font-medium">
                                                    {pendingDelete.transaction.type === "income"
                                                        ? "Receita"
                                                        : "Despesa"}{" "}
                                                    de{" "}
                                                    {currencyFmt.format(
                                                        Number(pendingDelete.transaction.amount)
                                                    )}
                                                </li>
                                            </ul>
                                        ) : pendingDelete?.mode === "bulk" ? (
                                            <ul className="max-h-40 list-inside list-disc overflow-y-auto text-foreground">
                                                {pendingDelete.ids.slice(0, 8).map((id) => {
                                                    const t = displayTransactions.find((x) => x.id === id)
                                                    if (!t) {
                                                        return (
                                                            <li key={id}>{id.slice(0, 8)}…</li>
                                                        )
                                                    }
                                                    const line =
                                                        t.description || t.category?.name || "Sem descrição"
                                                    return (
                                                        <li key={id}>
                                                            {formatTransactionDayPtBr(t.date)} — {line}
                                                        </li>
                                                    )
                                                })}
                                                {pendingDelete.ids.length > 8 ? (
                                                    <li className="text-muted-foreground">
                                                        e mais{" "}
                                                        {(pendingDelete.ids.length - 8).toLocaleString(
                                                            "pt-BR"
                                                        )}{" "}
                                                        …
                                                    </li>
                                                ) : null}
                                            </ul>
                                        ) : null}
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={deleting}>
                                    Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleting}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        void confirmDelete()
                                    }}
                                >
                                    {deleting ? "Excluindo…" : "Excluir"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
            </div>
        </section>
    )
}
