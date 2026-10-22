"use client"

import { useEffect, useRef, useState } from "react"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { PlusIcon } from "@heroicons/react/16/solid"
import { FunnelIcon, MagnifyingGlassIcon, ReceiptPercentIcon } from "@heroicons/react/24/outline"
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
import { Card, CardContent, CardMessage } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    AlertDialogList,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { numberBR } from "@/lib/formatters"
import {
    consumirParametroCompartilhado,
    consumirParametroFrase,
    consumirParametroImportar,
    PARAMETROS_DA_FRASE,
    PARAMETROS_DO_COMPARTILHADO,
} from "@/lib/transactions-list-search-params"
import { lerArquivoCompartilhado } from "@/lib/captura/compartilhado"
import { CompartilhadoAvisoWireframe } from "@/components/wireframe/compartilhado-aviso-wireframe"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import {
    ImportarExtratoLink,
    ImportarExtratoWireframe,
} from "@/components/wireframe/importar-extrato-wireframe"
import { AConferirListaWireframe } from "@/components/wireframe/a-conferir-lista-wireframe"
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

    // `?importar=1` abre o wireframe de importar e sai da URL, como o `new`.
    const [importarAberto, setImportarAberto] = useState(false)
    useEffect(() => {
        const resto = consumirParametroImportar(searchParams)
        if (resto == null) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- consome o parâmetro da URL uma vez
        setImportarAberto(true)
        router.replace(resto ? `${pathname}?${resto}` : pathname)
    }, [searchParams, pathname, router])

    // `?frase=` (o compartilhar do Android, `share_target`) abre a criação com
    // a frase já escrita, sem aplicar, e sai da URL.
    const shell = useGlobalShellDialogsOptional()
    useEffect(() => {
        const frase = consumirParametroFrase(searchParams)
        if (frase == null || !shell) return
        shell.openTransactionCreate("expense", { frase })
        const resto = new URLSearchParams(searchParams?.toString())
        for (const k of PARAMETROS_DA_FRASE) resto.delete(k)
        const qs = resto.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname)
    }, [searchParams, pathname, router, shell])

    // `?compartilhado=` (a foto ou o PDF do compartilhar, que o service worker
    // guardou no Cache Storage): a foto abre a criação com a "Foto do recibo"
    // lendo; o PDF e o arquivo que sumiu viram aviso. Sai da URL nos três casos.
    const [avisoCompartilhado, setAvisoCompartilhado] = useState<"pdf" | "indisponivel" | null>(null)
    const compartilhadoLido = useRef<string | null>(null)
    useEffect(() => {
        const naUrl = searchParams?.get("compartilhado")
        if (naUrl == null || !shell || compartilhadoLido.current === naUrl) return
        // Ler apaga o arquivo: o ref segura o segundo efeito do modo estrito.
        compartilhadoLido.current = naUrl
        const pedido = consumirParametroCompartilhado(searchParams)
        const resto = new URLSearchParams(searchParams?.toString())
        for (const k of PARAMETROS_DO_COMPARTILHADO) resto.delete(k)
        const qs = resto.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname)
        if (!pedido) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- consome o parâmetro da URL uma vez
            setAvisoCompartilhado("indisponivel")
            return
        }
        void lerArquivoCompartilhado(pedido.chave).then((arquivo) => {
            if (!arquivo) {
                setAvisoCompartilhado("indisponivel")
            } else if (pedido.tipo === "pdf") {
                setAvisoCompartilhado("pdf")
            } else {
                setAvisoCompartilhado(null)
                shell.openTransactionCreate("expense", { fotoInicial: arquivo })
            }
        })
    }, [searchParams, pathname, router, shell])

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

    if (loading) {
        return <TransactionsPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-3">
            {/* `?conferir=1` é uma vista (o atalho do ícone aponta para ela): fica na URL. */}
            {searchParams?.get("conferir") === "1" && currentWorkspaceId ? (
                <AConferirListaWireframe workspaceId={currentWorkspaceId} />
            ) : null}
            {avisoCompartilhado ? (
                <CompartilhadoAvisoWireframe
                    aviso={avisoCompartilhado}
                    onFechar={() => setAvisoCompartilhado(null)}
                />
            ) : null}
            {importarAberto && user && currentWorkspaceId ? (
                <ImportarExtratoWireframe
                    workspaceId={currentWorkspaceId}
                    userId={user.id}
                    cards={creditCards}
                    onClose={() => setImportarAberto(false)}
                />
            ) : (
                <ImportarExtratoLink
                    href={`${pathname}?${new URLSearchParams([...(searchParams?.entries() ?? []), ["importar", "1"]])}`}
                />
            )}
            <TransactionsToolbar
                sticky
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
                            onClearAll={resetAllFilters}
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
                    pending={c.tableLoading}
                    invoicePaidByCardClose={invoicePaidByCardClose}
                />
            ) : hasNoMatches ? (
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
                                Tente outro tipo (receita/despesa), ampliar o período ou usar um
                                preset como &quot;Mês atual&quot;.
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
                                Lance receitas e despesas para ver o histórico aqui e acompanhar
                                suas finanças por categoria.
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

            <AlertDialog
                pending={deleting}
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingDelete?.mode === "bulk"
                                ? `Excluir ${numberBR(pendingDelete.ids.length)} transações?`
                                : "Excluir transação?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
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
                                    <AlertDialogList>
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
                                    </AlertDialogList>
                                </>
                            ) : pendingDelete?.mode === "bulk" ? (
                                <>
                                    <p className="text-foreground">
                                        As{" "}
                                        {numberBR(pendingDelete.ids.length)}{" "}
                                        transações selecionadas serão
                                        removidas do extrato.
                                    </p>
                                    <AlertDialogList className="max-h-40 overflow-y-auto">
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
                                                {numberBR((
                                                    pendingDelete.ids.length -
                                                    8
                                                ))}{" "}
                                                …
                                            </li>
                                        ) : null}
                                    </AlertDialogList>
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            type="button"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Excluindo…"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                void confirmDelete()
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
