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
import { cn } from "@/lib/utils"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import { TransactionNewSplitButton } from "@/components/transactions/transaction-new-split-button"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"

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

export function QuickActionResourceLinks({
    onCloseMenu,
}: {
    onCloseMenu: () => void
}) {
    const shell = useGlobalShellDialogsOptional()
    const router = useRouter()

    const wrap = React.useCallback(
        (fn: () => void) => {
            fn()
            onCloseMenu()
        },
        [onCloseMenu]
    )

    if (!shell) {
        return (
            <DropdownMenuItem
                onClick={() =>
                    wrap(() =>
                        router.push(`${ROUTES.SUBSCRIPTIONS}?new=1`)
                    )
                }
                className="gap-2"
            >
                <Repeat className="h-4 w-4" />
                <span>Nova assinatura</span>
            </DropdownMenuItem>
        )
    }

    return (
        <DropdownMenuItem
            onClick={() => wrap(() => shell.openSubscriptionCreate())}
            className="gap-2"
        >
            <Repeat className="h-4 w-4" />
            <span>Nova assinatura</span>
        </DropdownMenuItem>
    )
}

function QuickTransactionMenuItems({
    onPick,
    onCloseMenu,
}: {
    onPick: (mode: NewTransactionMode) => void
    onCloseMenu: () => void
}) {
    return (
        <>
            <DropdownMenuItem onClick={() => onPick("expense")}>
                Nova despesa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPick("income")}>
                Nova receita
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPick("installment")}>
                Nova compra parcelada
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <QuickActionResourceLinks onCloseMenu={onCloseMenu} />
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

    const plusOnlyOpensMenu = isFab || state === "collapsed"

    const pick = React.useCallback(
        (mode: NewTransactionMode) => {
            quickCreate(mode)
            setOpen(false)
        },
        [quickCreate]
    )

    const closeMenu = React.useCallback(() => setOpen(false), [])

    if (plusOnlyOpensMenu) {
        return (
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="default"
                        size={isFab ? "default" : "icon"}
                        type="button"
                        className={cn(
                            isFab && MOBILE_FLOATING_ACTION_BUTTON_CLASSNAME,
                            !isFab &&
                                "size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:flex-none"
                        )}
                        aria-label="Ações rápidas"
                    >
                        <Plus className="size-4 shrink-0" />
                        {isFab && (
                            <span className="text-sm font-medium">
                                Nova transação
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={isFab ? "center" : "start"}
                    side={isFab ? "top" : "right"}
                    className={cn(
                        isFab
                            ? "min-w-[min(100vw-2rem,16rem)] w-max max-w-[min(100vw-2rem,20rem)]"
                            : "min-w-56 w-max max-w-[min(100vw-2rem,18rem)]"
                    )}
                    sideOffset={isFab ? 10 : 8}
                >
                    <QuickTransactionMenuItems onPick={pick} onCloseMenu={closeMenu} />
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <TransactionNewSplitButton
            menuAlign="start"
            menuSide="right"
            onNew={pick}
            menuFooter={
                <>
                    <DropdownMenuSeparator />
                    <QuickActionResourceLinks onCloseMenu={() => {}} />
                </>
            }
        />
    )
}
