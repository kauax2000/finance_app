"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Repeat } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { ROUTES } from "@/config/navigation"
import { MOBILE_FLOATING_ACTION_BUTTON_CLASSNAME } from "@/components/layout/mobile-fab-button-classes"
import {
    MOBILE_GLASS_FAB_MENU_CONTENT_CLASSNAME,
    MOBILE_GLASS_FAB_MENU_ITEM_CLASSNAME,
    MOBILE_GLASS_MENU_INNER_CLASSNAME,
    MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME,
} from "@/components/layout/mobile-glass-surface"
import { cn } from "@/lib/utils"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"

const FIXED_TRANSACTION_ACTIONS: ReadonlyArray<{
    mode: NewTransactionMode
    label: string
}> = [
    { mode: "expense", label: "Despesas" },
    { mode: "installment", label: "Parcelas" },
    { mode: "income", label: "Receitas" },
]

function useQuickCreateTransaction() {
    const shell = useGlobalShellDialogsOptional()
    const router = useRouter()

    return React.useCallback(
        (mode: NewTransactionMode) => {
            if (shell) {
                shell.openTransactionCreate(mode)
                return
            }
            const q =
                mode === "installment"
                    ? "parcelada"
                    : mode === "income"
                      ? "receita"
                      : "1"
            router.push(
                `${ROUTES.TRANSACTIONS}?new=${encodeURIComponent(q)}`
            )
        },
        [shell, router]
    )
}

function useQuickCreateSubscription() {
    const shell = useGlobalShellDialogsOptional()
    const router = useRouter()

    return React.useCallback(() => {
        if (shell) {
            shell.openSubscriptionCreate()
            return
        }
        router.push(`${ROUTES.SUBSCRIPTIONS}?new=1`)
    }, [shell, router])
}

export function QuickActionResourceLinks({
    onCloseMenu,
    mobileGlass = false,
}: {
    onCloseMenu: () => void
    mobileGlass?: boolean
}) {
    const createSubscription = useQuickCreateSubscription()
    const itemClassName = mobileGlass ? MOBILE_GLASS_FAB_MENU_ITEM_CLASSNAME : "gap-2"

    return (
        <DropdownMenuItem
            onClick={() => {
                createSubscription()
                onCloseMenu()
            }}
            className={itemClassName}
        >
            <Repeat className={mobileGlass ? undefined : "h-4 w-4"} />
            <span>Assinatura</span>
        </DropdownMenuItem>
    )
}

function FixedQuickCreateMenuItems({
    onPickTransaction,
    onPickSubscription,
    mobileGlass = false,
    part = "all",
}: {
    onPickTransaction: (mode: NewTransactionMode) => void
    onPickSubscription: () => void
    mobileGlass?: boolean
    /** Splits glass FAB menu so the separator can sit outside padded sections. */
    part?: "all" | "transactions" | "subscription"
}) {
    const itemClassName = mobileGlass
        ? MOBILE_GLASS_FAB_MENU_ITEM_CLASSNAME
        : undefined
    const separatorClassName = mobileGlass
        ? MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME
        : undefined

    if (part === "subscription") {
        return (
            <DropdownMenuItem
                className={itemClassName}
                onClick={onPickSubscription}
            >
                <Repeat className={mobileGlass ? undefined : "h-4 w-4"} />
                <span>Assinatura</span>
            </DropdownMenuItem>
        )
    }

    const transactionItems = (
        <>
            {FIXED_TRANSACTION_ACTIONS.map(({ mode, label }) => (
                <DropdownMenuItem
                    key={mode}
                    className={itemClassName}
                    onClick={() => onPickTransaction(mode)}
                >
                    {label}
                </DropdownMenuItem>
            ))}
        </>
    )

    if (part === "transactions") {
        return transactionItems
    }

    return (
        <>
            {transactionItems}
            <DropdownMenuSeparator className={separatorClassName} />
            <DropdownMenuItem
                className={itemClassName}
                onClick={onPickSubscription}
            >
                <Repeat className={mobileGlass ? undefined : "h-4 w-4"} />
                <span>Assinatura</span>
            </DropdownMenuItem>
        </>
    )
}

type QuickActionButtonProps = {
    variant?: "sidebar" | "fab"
}

export function QuickActionButton({ variant = "sidebar" }: QuickActionButtonProps) {
    const [open, setOpen] = React.useState(false)
    const isFab = variant === "fab"
    const { state } = useSidebar()
    const quickCreate = useQuickCreateTransaction()
    const createSubscription = useQuickCreateSubscription()
    const isSidebarCollapsed = state === "collapsed"

    const pickTransaction = React.useCallback(
        (mode: NewTransactionMode) => {
            quickCreate(mode)
            setOpen(false)
        },
        [quickCreate]
    )

    const pickSubscription = React.useCallback(() => {
        createSubscription()
        setOpen(false)
    }, [createSubscription])

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {isFab || isSidebarCollapsed ? (
                    <Button
                        variant="default"
                        size="icon"
                        type="button"
                        className={cn(
                            isFab && MOBILE_FLOATING_ACTION_BUTTON_CLASSNAME,
                            !isFab &&
                                "size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:flex-none"
                        )}
                        aria-label="Adicionar"
                    >
                        <Plus className="size-5 shrink-0" />
                    </Button>
                ) : (
                    <Button
                        variant="default"
                        type="button"
                        className="h-9 w-full justify-center gap-2 text-xs group-data-[collapsible=icon]:hidden"
                    >
                        <Plus className="size-4 shrink-0" />
                        <span className="truncate">Adicionar</span>
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={isFab ? "end" : "start"}
                side={isFab ? "top" : "right"}
                collisionPadding={isFab ? 16 : undefined}
                className={
                    isFab
                        ? MOBILE_GLASS_FAB_MENU_CONTENT_CLASSNAME
                        : "min-w-56 w-max max-w-[min(100vw-2rem,18rem)]"
                }
                sideOffset={isFab ? 12 : 8}
            >
                {isFab ? (
                    <>
                        <div className={MOBILE_GLASS_MENU_INNER_CLASSNAME}>
                            <FixedQuickCreateMenuItems
                                mobileGlass
                                part="transactions"
                                onPickTransaction={pickTransaction}
                                onPickSubscription={pickSubscription}
                            />
                        </div>
                        <DropdownMenuSeparator
                            className={MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME}
                        />
                        <div className={MOBILE_GLASS_MENU_INNER_CLASSNAME}>
                            <FixedQuickCreateMenuItems
                                mobileGlass
                                part="subscription"
                                onPickTransaction={pickTransaction}
                                onPickSubscription={pickSubscription}
                            />
                        </div>
                    </>
                ) : (
                    <FixedQuickCreateMenuItems
                        onPickTransaction={pickTransaction}
                        onPickSubscription={pickSubscription}
                    />
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
