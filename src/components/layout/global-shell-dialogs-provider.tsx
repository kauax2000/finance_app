"use client"

import * as React from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog"
import { persistInstallmentPlanCreate } from "@/components/transactions/transaction-form-persistence"
import type {
    InstallmentPlanFormSavePayload,
    TransactionFormSavePayload,
} from "@/components/transactions/transaction-form-types"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog"
import type { SubscriptionFormPayload } from "@/components/subscriptions/subscription-form-shared"
import { CreditCardCreateDialog } from "@/components/credit-cards/credit-card-create-dialog"
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog"
import { WorkspaceInviteDialog } from "@/components/members/workspace-invite-dialog"
import { ROUTES } from "@/config/navigation"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { persistTransactionSave } from "@/lib/transaction-detail-sheet-mutations"
import { toastError, toastSuccess } from "@/lib/toast"
import {
    dispatchFinanceTransactionsMutated,
    dispatchFinanceSubscriptionsMutated,
} from "@/lib/workspace-data-events"

export type GlobalShellDialogsContextValue = {
    openTransactionCreate: (mode: NewTransactionMode) => void
    openCategoryCreate: () => void
    openSubscriptionCreate: () => void
    openCreditCardCreate: () => void
    openMemberInvite: () => void
}

const GlobalShellDialogsContext =
    React.createContext<GlobalShellDialogsContextValue | null>(null)

export function useGlobalShellDialogsOptional(): GlobalShellDialogsContextValue | null {
    return React.useContext(GlobalShellDialogsContext)
}

function modeToLaunchKind(mode: NewTransactionMode): TransactionFormKind {
    if (mode === "installment") return "installment"
    if (mode === "income") return "income"
    return "expense"
}

export function GlobalShellDialogsProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = useAuth()
    const { currentWorkspaceId, isWorkspaceOwner } = useWorkspace()

    const canManageMembers = Boolean(
        currentWorkspaceId && isWorkspaceOwner(currentWorkspaceId)
    )

    const [txOpen, setTxOpen] = React.useState(false)
    const [createLaunchKind, setCreateLaunchKind] =
        React.useState<TransactionFormKind>("expense")
    const [txSaving, setTxSaving] = React.useState(false)

    const [categoryOpen, setCategoryOpen] = React.useState(false)

    const [subscriptionOpen, setSubscriptionOpen] = React.useState(false)
    const [subscriptionSaving, setSubscriptionSaving] = React.useState(false)

    const [creditCardOpen, setCreditCardOpen] = React.useState(false)

    const [inviteOpen, setInviteOpen] = React.useState(false)

    const categoriesQuery = useCategoriesQuery(
        user && currentWorkspaceId ? currentWorkspaceId : null,
    )
    const creditCardsQuery = useCreditCardsQuery(
        user && currentWorkspaceId ? currentWorkspaceId : null,
    )

    const txCategories = categoriesQuery.data ?? []
    const txCreditCards = creditCardsQuery.data ?? []

    const afterTxMutation = React.useCallback(async () => {
        dispatchFinanceTransactionsMutated()
    }, [])

    const openTransactionCreate = React.useCallback((mode: NewTransactionMode) => {
        setCreateLaunchKind(modeToLaunchKind(mode))
        setTxOpen(true)
    }, [])

    const handleTxOpenChange = React.useCallback((open: boolean) => {
        setTxOpen(open)
    }, [])

    const handleTxSave = React.useCallback(
        async (payload: TransactionFormSavePayload): Promise<boolean> => {
            if (!user || !currentWorkspaceId) return false

            setTxSaving(true)
            const ok = await persistTransactionSave({
                supabase,
                user,
                workspaceId: currentWorkspaceId,
                payload,
                resolveEditingTransaction: () => null,
                onAfterSuccess: afterTxMutation,
            })
            setTxSaving(false)
            if (ok) setTxOpen(false)
            return ok
        },
        [user, currentWorkspaceId, afterTxMutation]
    )

    const handleTxSaveInstallmentPlan = React.useCallback(
        async (payload: InstallmentPlanFormSavePayload): Promise<boolean> => {
            if (!user || !currentWorkspaceId) return false

            setTxSaving(true)
            const ok = await persistInstallmentPlanCreate({
                supabase,
                user,
                workspaceId: currentWorkspaceId,
                payload,
                onAfterSuccess: afterTxMutation,
            })
            setTxSaving(false)
            if (ok) setTxOpen(false)
            return ok
        },
        [user, currentWorkspaceId, afterTxMutation]
    )

    const openSubscriptionCreate = React.useCallback(() => {
        setSubscriptionOpen(true)
    }, [])

    const handleSubscriptionOpenChange = React.useCallback((open: boolean) => {
        if (!open && subscriptionSaving) return
        setSubscriptionOpen(open)
    }, [subscriptionSaving])

    const handleSaveSubscription = React.useCallback(
        async (
            payload: SubscriptionFormPayload,
            subscriptionIdForUpdate?: string | null
        ): Promise<boolean> => {
            if (!user || !currentWorkspaceId) return false
            if (subscriptionIdForUpdate) return false

            setSubscriptionSaving(true)
            try {
                const { error } = await supabase.from("workspace_subscriptions").insert({
                    workspace_id: currentWorkspaceId,
                    user_id: user.id,
                    ...payload,
                })
                if (error) {
                    toastError(
                        formatSupabasePostgrestError(error) ??
                            "Não foi possível cadastrar a assinatura.",
                    )
                    return false
                }
                toastSuccess("Assinatura cadastrada.")
                dispatchFinanceSubscriptionsMutated()
                return true
            } finally {
                setSubscriptionSaving(false)
            }
        },
        [user, currentWorkspaceId]
    )

    const expenseCategories = React.useMemo(
        () =>
            txCategories
                .filter((c) => c.type === "expense")
                .map((c) => ({
                    id: c.id,
                    name: c.name,
                    color: c.color,
                    icon: c.icon,
                })),
        [txCategories],
    )

    const openCategoryCreate = React.useCallback(() => {
        setCategoryOpen(true)
    }, [])

    const openCreditCardCreate = React.useCallback(() => {
        setCreditCardOpen(true)
    }, [])

    const openMemberInvite = React.useCallback(() => {
        setInviteOpen(true)
    }, [])

    const value = React.useMemo(
        () => ({
            openTransactionCreate,
            openCategoryCreate,
            openSubscriptionCreate,
            openCreditCardCreate,
            openMemberInvite,
        }),
        [
            openTransactionCreate,
            openCategoryCreate,
            openSubscriptionCreate,
            openCreditCardCreate,
            openMemberInvite,
        ],
    )

    return (
        <GlobalShellDialogsContext.Provider value={value}>
            {children}
            <TransactionFormDialog
                open={txOpen}
                onOpenChange={handleTxOpenChange}
                editingTransaction={null}
                defaultLaunchKind={createLaunchKind}
                categories={txCategories}
                creditCards={txCreditCards}
                categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                creditCardsHref={ROUTES.CREDIT_CARDS}
                saving={txSaving}
                onSave={handleTxSave}
                onSaveInstallmentPlan={handleTxSaveInstallmentPlan}
            />
            <CategoryCreateDialog
                open={categoryOpen}
                onOpenChange={setCategoryOpen}
                user={user}
                workspaceId={currentWorkspaceId}
            />
            <SubscriptionFormDialog
                open={subscriptionOpen}
                onOpenChange={handleSubscriptionOpenChange}
                editingSubscription={null}
                expenseCategories={expenseCategories}
                categoriesHref={ROUTES.DASHBOARD_CATEGORIES}
                creditCards={txCreditCards}
                creditCardsHref={ROUTES.CREDIT_CARDS}
                saving={subscriptionSaving}
                onSave={handleSaveSubscription}
            />
            <CreditCardCreateDialog
                open={creditCardOpen}
                onOpenChange={setCreditCardOpen}
                user={user}
                workspaceId={currentWorkspaceId}
            />
            <WorkspaceInviteDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                user={user}
                workspaceId={currentWorkspaceId}
                canManageMembers={canManageMembers}
            />
        </GlobalShellDialogsContext.Provider>
    )
}
