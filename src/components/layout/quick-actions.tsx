"use client"

import { ArrowPathRoundedSquareIcon, PlusIcon } from "@heroicons/react/16/solid"
import { PlusIcon as PlusMiniIcon } from "@heroicons/react/20/solid"
import * as React from "react"
import { useRouter } from "next/navigation"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { ROUTES } from "@/config/navigation"
import { BottomBarAction } from "@/components/ui/bottom-bar"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"

/**
 * As duas portas do "+ Adicionar": o formulário global da casca, ou a tela com
 * `?new=` quando a casca não está montada. Exportadas porque a paleta (⌘K)
 * oferece as mesmas ações e tem de entrar pelas mesmas portas.
 */
export function useQuickCreateTransaction() {
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

export function useQuickCreateSubscription() {
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
}: {
    onCloseMenu: () => void
}) {
    const createSubscription = useQuickCreateSubscription()

    return (
        <DropdownMenuItem
            onClick={() => {
                createSubscription()
                onCloseMenu()
            }}
        >
            <ArrowPathRoundedSquareIcon />
            <span>Assinatura</span>
        </DropdownMenuItem>
    )
}

type QuickActionButtonProps = {
    variant?: "sidebar" | "fab"
}

/**
 * O "+ Adicionar" abre direto o formulário de lançamento, com Despesa marcada:
 * o seletor dele já troca para Compra parcelada e Receita, e um menu antes do
 * formulário era um passo a mais na jornada mais comum. No telefone o mesmo
 * formulário vira a gaveta. A assinatura mora na tela dela e na paleta (⌘K).
 */
export function QuickActionButton({ variant = "sidebar" }: QuickActionButtonProps) {
    const { state, espiando } = useSidebar()
    const quickCreate = useQuickCreateTransaction()
    const abrir = React.useCallback(() => quickCreate("expense"), [quickCreate])
    // Espiando, a barra está aberta por cima com o `state` ainda `collapsed` (a
    // folga não se mexe): o botão volta ao primário inteiro com ela.
    const isSidebarCollapsed = state === "collapsed" && !espiando

    if (variant === "fab") {
        return (
            <BottomBarAction label="Adicionar" onClick={abrir}>
                <PlusMiniIcon className="size-5 shrink-0" />
            </BottomBarAction>
        )
    }

    return isSidebarCollapsed ? (
        <Button
            variant="primary"
            size="icon-md"
            type="button"
            aria-label="Adicionar"
            onClick={abrir}
        >
            <PlusIcon aria-hidden />
        </Button>
    ) : (
        <Button
            variant="primary"
            size="lg"
            type="button"
            className="w-full"
            onClick={abrir}
        >
            <PlusIcon aria-hidden />
            Adicionar
        </Button>
    )
}
