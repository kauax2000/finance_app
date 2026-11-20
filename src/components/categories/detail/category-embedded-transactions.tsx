"use client"

import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { ArrowTopRightOnSquareIcon, PlusIcon } from "@heroicons/react/16/solid"
import { FunnelIcon, MagnifyingGlassIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline"
import * as React from "react"
import Link from "next/link"
import { ROUTES } from "@/config/navigation"
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
import { ExcluirLancamentosDialog } from "@/components/transactions/excluir-lancamentos-dialog"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { Card, CardContent, CardFooter, CardMessage, CardToolbar } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemGroupLabel,
    ItemLink,
    ItemTitle,
} from "@/components/ui/item"
import { isProjectedTransactionRow } from "@/lib/category-expense-month-rows"
import { paymentMethodLabel } from "@/lib/payment-methods"
import { formatDayHeadingPtBr, groupByLocalDay } from "@/lib/transaction-date"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 100

export function CategoryEmbeddedTransactions({
    categoryType,
    controller,
    expenseMonthRows = null,
    yearMonth,
    forma = "tabela",
}: {
    categoryType: "income" | "expense"
    controller: ReturnType<typeof useTransactionsListController>
    /** Expense categories: posted + projected rows from category detail bundle. */
    expenseMonthRows?: Transaction[] | null
    yearMonth?: string
    /** `lista`: a forma compacta da coluna estreita (sem toolbar, chips nem paginação). */
    forma?: "tabela" | "lista"
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
                <CardMessage tone="destructive">
                    {workspaceError}
                </CardMessage>
            </Card>
        )
    }

    if (!authLoading && !workspaceLoading && !currentWorkspaceId) {
        return (
            <Card>
                <CardMessage>
                    Nenhum espaço de trabalho selecionado. Escolha um espaço no menu
                    lateral para continuar.
                </CardMessage>
            </Card>
        )
    }

    return (
        <section className="min-w-0 max-w-full space-y-3" aria-label="Lançamentos do mês">
            <div className="min-w-0 max-w-full space-y-3">
                    {forma === "tabela" ? (
                    <TransactionsToolbar
                        filterType={filterType}
                        onFilterTypeChange={setFilterType}
                        showTransactionTypeSegment={false}
                        // O cabeçalho desta tela leva o mês; o filtro dos lançamentos fica aqui.
                        headerFilter={false}
                        baselineTransactionFilterType={categoryType}
                        hidePeriodInFilters={lockPeriodToDefault}
                        treatPeriodAsAlwaysDefault={lockPeriodToDefault}
                        toolbarLeading={() => (
                            <div className="flex h-8 min-w-0 items-end">
                                <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Lançamentos do mês
                                </p>
                            </div>
                        )}
                        toolbarAfterFilters={() => (
                            <Button
                                asChild
                                variant="outline"
                                className="min-w-0 flex-1"
                            >
                                <Link href={transactionsListHref}>
                                    <ArrowTopRightOnSquareIcon aria-hidden />
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
                                    onClearAll={resetAllFilters}
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
                    ) : null}

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

                    {forma === "lista" && !displayHasNoTransactions && !displayHasNoMatches ? (
                        <Card padding="none">
                            <CardToolbar variant="title">
                                Lançamentos ({displayTotalCount})
                            </CardToolbar>
                            {groupByLocalDay(displayTransactions, (t) => t.date).map((g) => (
                                <ItemGroup key={g.chave}>
                                    <ItemGroupLabel sticky>
                                        {formatDayHeadingPtBr(g.data)}
                                    </ItemGroupLabel>
                                    {g.itens.map((t) => {
                                        const previsto = isProjectedTransactionRow(t)
                                        const formaDePagar = paymentMethodLabel(t.payment_method)
                                        return (
                                            <Item
                                                key={t.id}
                                                variant="flush"
                                                size="sm"
                                                interactive={!previsto}
                                            >
                                                <ItemContent className="min-w-0">
                                                    <ItemTitle className="truncate">
                                                        {previsto ? (
                                                            <span className="truncate">
                                                                {t.description || t.category?.name || "Sem descrição"}
                                                            </span>
                                                        ) : (
                                                            <ItemLink onClick={() => openTransactionDetail(t)}>
                                                                {t.description || t.category?.name || "Sem descrição"}
                                                            </ItemLink>
                                                        )}
                                                        {previsto ? <Badge tone="warning">Previsto</Badge> : null}
                                                    </ItemTitle>
                                                    {formaDePagar ? (
                                                        <ItemDescription className="truncate">{formaDePagar}</ItemDescription>
                                                    ) : null}
                                                </ItemContent>
                                                <ItemActions>
                                                    <MoneyDisplay
                                                        value={t.type === "income" ? Number(t.amount) : -Number(t.amount)}
                                                        signed
                                                        size="sm"
                                                    />
                                                </ItemActions>
                                            </Item>
                                        )
                                    })}
                                </ItemGroup>
                            ))}
                            <CardFooter>
                                <Button asChild variant="outline" className="min-w-0 flex-1">
                                    <Link href={transactionsListHref}>
                                        <ArrowTopRightOnSquareIcon aria-hidden />
                                        <span className="truncate">Ver em Transações</span>
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : !displayHasNoTransactions && !displayHasNoMatches ? (
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
                            pending={c.tableLoading}
                            invoicePaidByCardClose={invoicePaidByCardClose}
                        />
                    ) : displayHasNoMatches ? (
                        <Card padding="none">
                            <CardContent
                                className="px-4 py-12 md:py-14"
                                role="status"
                                aria-live="polite"
                            >
                                <EmptyState variant="plain" size="lg">
                                    <EmptyStateIcon variant="stack">
                                        <MagnifyingGlassIcon aria-hidden />
                                        <ReceiptPercentIcon aria-hidden />
                                        <FunnelIcon aria-hidden />
                                    </EmptyStateIcon>
                                    <EmptyStateTitle>Nenhuma transação com esses filtros</EmptyStateTitle>
                                    <EmptyStateDescription>
                                        Tente outro tipo (receita/despesa), ampliar o período ou ajustar os filtros
                                        avançados.
                                    </EmptyStateDescription>
                                    <EmptyStateActions>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetAllFilters()
                                            }}
                                        >
                                            Limpar filtros
                                        </Button>
                                    </EmptyStateActions>
                                </EmptyState>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card padding="none">
                            <CardContent
                                role="status"
                                aria-live="polite"
                            >
                                <EmptyState variant="plain" size="lg">
                                    <EmptyStateGhost leading="tile" trailing="amount" />
                                    <EmptyStateTitle>Comece a registrar suas movimentações</EmptyStateTitle>
                                    <EmptyStateDescription>
                                        Lance receitas e despesas para ver o histórico aqui.
                                    </EmptyStateDescription>
                                    <EmptyStateActions>
                                        <Button
                                            type="button"
                                            onClick={() => openDialog()}
                                        >
                                            <PlusIcon aria-hidden />
                                            Nova transação
                                        </Button>
                                    </EmptyStateActions>
                                </EmptyState>
                            </CardContent>
                        </Card>
                    )}

                    <ExcluirLancamentosDialog
                        linhas={
                            pendingDelete?.mode === "single"
                                ? [pendingDelete.transaction]
                                : pendingDelete?.mode === "bulk"
                                  ? pendingDelete.ids.flatMap((id) => displayTransactions.find((t) => t.id === id) ?? [])
                                  : []
                        }
                        pending={deleting}
                        open={pendingDelete !== null}
                        onOpenChange={(open) => {
                            if (!open && !deleting) setPendingDelete(null)
                        }}
                        onConfirm={() => void confirmDelete()}
                    />
            </div>
        </section>
    )
}
