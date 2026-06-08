"use client"

import { formatTransactionDayPtBr } from "@/lib/transaction-date"
import { ROUTES } from "@/config/navigation"
import {
    TransactionFormDialog,
} from "@/components/transactions/transaction-form-dialog"
import { TransactionNewSplitButton } from "@/components/transactions/transaction-new-split-button"
import { TransactionsToolbar } from "@/components/transactions/transactions-toolbar"
import { QuickActionResourceLinks } from "@/components/layout/quick-actions"
import { TransactionsActiveFiltersChips } from "@/components/transactions/transactions-active-filters-chips"
import { TransactionsTable } from "@/components/transactions/transactions-table"
import { useTransactionsListController } from "@/components/transactions/use-transactions-list-controller"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/ui/money-display"
import { TransactionsPageSkeleton } from "@/components/transactions/transactions-page-skeleton"
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
import {
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Plus, Receipt, SearchX } from "lucide-react"
import {
    hasInstallmentDeleteImpact,
    INSTALLMENT_DELETE_WARNING,
} from "@/lib/transactions/delete-transactions"

const PAGE_SIZE = 100

export default function TransactionsPage() {
    const c = useTransactionsListController({ mode: "page" })

    /* eslint-disable @typescript-eslint/no-unused-vars -- view-model is split between this page and the shared controller hook */
    const {
        user,
        authLoading,
        currentWorkspaceId,
        workspaceLoading,
        workspaceError,
        router,
        pathname,
        searchParams,
        transactions,
        categories,
        creditCards,
        workspaceHasTransactions,
        invoicePaidByCardClose,
        totalCount,
        page,
        setPage,
        loading,
        dialogOpen,
        setDialogOpen,
        editingTransaction,
        setEditingTransaction,
        saving,
        setSaving,
        pendingDelete,
        setPendingDelete,
        deleting,
        setDeleting,
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
        setFilterCategoryIds,
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
            periodDraftFrom,
        setPeriodDraftFrom,
            periodDraftTo,
        setPeriodDraftTo,
        periodDraftDirty,
        setPeriodDraftDirty,
        suppressPeriodDraftDirtyRef,
        filtersSheetOpen,
        setFiltersSheetOpen,
            installmentPlans,
            subscriptions,
        sortKey,
        setSortKey,
        sortDir,
        setSortDir,
        didAutoOpen,
        setDidAutoOpen,
        detailTransaction,
        setDetailTransaction,
        detailOpen,
        setDetailOpen,
        detailLaunchEdit,
        setDetailLaunchEdit,
        skipUrlWriteRef,
        syncPeriodDraftToApplied,
            handlePeriodDraftFromChange,
            handlePeriodDraftToChange,
        creditCardPaymentSelected,
        refreshAll,
        openDialog,
        openTransactionDetail,
        handleDetailLaunchEditConsumed,
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
            clearAllCategoryFilters,
            handleUncategorizedOnlyChange,
        advancedFiltersActive,
        anyFiltersActive,
        filtersPanelProps,
        hasNoTransactions,
        hasNoMatches,
    } = c
    /* eslint-enable @typescript-eslint/no-unused-vars */

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

    if (loading) {
        return <TransactionsPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-3">
            <TransactionsToolbar
                filterType={filterType}
                onFilterTypeChange={setFilterType}
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
                            onRemoveCategoryId={(id) => toggleFilterCategory(id)}
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
                toolbarTrailing={() => (
                    <TransactionNewSplitButton
                        menuAlign="end"
                        menuSide="bottom"
                        onNew={(mode) => {
                            openDialog(undefined, mode)
                        }}
                        menuFooter={
                            <>
                                <DropdownMenuSeparator />
                                <QuickActionResourceLinks
                                    onCloseMenu={() => {}}
                                />
                            </>
                        }
                    />
                )}
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

            {!hasNoTransactions && !hasNoMatches ? (
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="relative flex flex-col p-0">
                        <TransactionsTable
                            transactions={transactions}
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
                            totalCount={totalCount}
                            invoicePaidByCardClose={invoicePaidByCardClose}
                        />
                    </CardContent>
                </Card>
            ) : hasNoMatches ? (
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
                            Tente outro tipo (receita/despesa), ampliar o período ou usar um
                            preset como &quot;Mês atual&quot;.
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
                            Lance receitas e despesas para ver o histórico aqui e acompanhar
                            suas finanças por categoria.
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
                                {pendingDelete &&
                                hasInstallmentDeleteImpact(
                                    pendingDelete.mode === "single"
                                        ? [
                                              {
                                                  installment_plan_id:
                                                      pendingDelete.transaction
                                                          .installment_plan_id,
                                              },
                                          ]
                                        : pendingDelete.ids.map((id) => ({
                                              installment_plan_id:
                                                  transactions.find(
                                                      (t) => t.id === id
                                                  )?.installment_plan_id ?? null,
                                          }))
                                ) ? (
                                    <p className="text-foreground">
                                        {INSTALLMENT_DELETE_WARNING}
                                    </p>
                                ) : null}
                                {pendingDelete?.mode === "single" ? (
                                    <>
                                        <p className="text-foreground">
                                            Esta transação será removida do
                                            extrato.
                                        </p>
                                        <ul className="list-inside list-disc text-foreground">
                                            <li>
                                                {formatTransactionDayPtBr(
                                                    pendingDelete.transaction
                                                        .date
                                                )}{" "}
                                                —{" "}
                                                {pendingDelete.transaction
                                                    .description ||
                                                    pendingDelete.transaction
                                                        .category?.name ||
                                                    "Sem descrição"}
                                            </li>
                                            <li className="flex flex-wrap items-center gap-1 font-medium">
                                                {pendingDelete.transaction
                                                    .type === "income"
                                                    ? "Receita"
                                                    : "Despesa"}{" "}
                                                de{" "}
                                                <MoneyDisplay
                                                    value={Number(
                                                        pendingDelete
                                                            .transaction
                                                            .amount
                                                    )}
                                                    size="sm"
                                                    className="inline font-medium"
                                                />
                                            </li>
                                        </ul>
                                    </>
                                ) : pendingDelete?.mode === "bulk" ? (
                                    <>
                                        <p className="text-foreground">
                                            As{" "}
                                            {pendingDelete.ids.length.toLocaleString(
                                                "pt-BR"
                                            )}{" "}
                                            transações selecionadas serão
                                            removidas do extrato.
                                        </p>
                                        <ul className="max-h-40 list-inside list-disc overflow-y-auto text-foreground">
                                            {pendingDelete.ids
                                                .slice(0, 8)
                                                .map((id) => {
                                                    const t = transactions.find(
                                                        (x) => x.id === id
                                                    )
                                                    if (!t) {
                                                        return (
                                                            <li key={id}>
                                                                {id.slice(0, 8)}…
                                                            </li>
                                                        )
                                                    }
                                                    const line =
                                                        t.description ||
                                                        t.category?.name ||
                                                        "Sem descrição"
                                                    return (
                                                        <li key={id}>
                                                            {formatTransactionDayPtBr(
                                                                t.date
                                                            )}{" "}
                                                            — {line}
                                                        </li>
                                                    )
                                                })}
                                            {pendingDelete.ids.length > 8 ? (
                                                <li className="text-muted-foreground">
                                                    e mais{" "}
                                                    {(
                                                        pendingDelete.ids.length -
                                                        8
                                                    ).toLocaleString("pt-BR")}{" "}
                                                    …
                                                </li>
                                            ) : null}
                                        </ul>
                                    </>
                                ) : null}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            type="button"
                            disabled={deleting}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            className={buttonVariants({
                                variant: "destructive",
                            })}
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
    )
}
