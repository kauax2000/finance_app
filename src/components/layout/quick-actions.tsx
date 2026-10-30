"use client"

import { ArrowPathRoundedSquareIcon, PlusIcon } from "@heroicons/react/16/solid"
import { PlusIcon as PlusMiniIcon } from "@heroicons/react/20/solid"
import * as React from "react"
import { useRouter } from "next/navigation"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { ROUTES } from "@/config/navigation"
import { bottomBarActionClassName } from "@/components/ui/bottom-bar"
import { MOBILE_GLASS_FAB_MENU_ITEM_CLASSNAME } from "@/lib/mobile-glass-surface"
import { cn } from "@/lib/utils"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
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
            <ArrowPathRoundedSquareIcon className={mobileGlass ? undefined : "h-4 w-4"} />
            <span>Assinatura</span>
        </DropdownMenuItem>
    )
}

type QuickActionButtonProps = {
    variant?: "sidebar" | "fab"
}

/** "+ Adicionar" abre direto o lançamento em Despesa; o tipo se troca no próprio formulário. */
export function QuickActionButton({ variant = "sidebar" }: QuickActionButtonProps) {
    const isFab = variant === "fab"
    const { state } = useSidebar()
    const quickCreate = useQuickCreateTransaction()
    const isSidebarCollapsed = state === "collapsed"
    const abrir = () => quickCreate("expense")

    return isFab || isSidebarCollapsed ? (
        <Button
            variant="primary"
            size="icon-lg"
            type="button"
            onClick={abrir}
            className={cn(
                isFab && bottomBarActionClassName,
                !isFab &&
                    "size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:flex-none"
            )}
            aria-label="Adicionar"
        >
            <PlusMiniIcon className="size-5 shrink-0" />
        </Button>
    ) : (
        <Button
            variant="primary"
            type="button"
            onClick={abrir}
            className="h-9 w-full justify-center gap-2 text-xs group-data-[collapsible=icon]:hidden"
        >
            <PlusIcon className="size-4 shrink-0" />
            <span className="truncate">Adicionar</span>
        </Button>
    )
}
