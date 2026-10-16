"use client"

import { ArrowPathRoundedSquareIcon, PlusIcon } from "@heroicons/react/16/solid"
import { PlusIcon as PlusMiniIcon } from "@heroicons/react/20/solid"
import * as React from "react"
import { useRouter } from "next/navigation"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
    const quickCreate = useQuickCreateTransaction()
    const abrir = React.useCallback(() => quickCreate("expense"), [quickCreate])

    if (variant === "fab") {
        return (
            <BottomBarAction label="Adicionar" onClick={abrir}>
                <PlusMiniIcon className="size-5 shrink-0" />
            </BottomBarAction>
        )
    }

    // Um botão só nos dois estados, que encolhe junto com a barra: recolhida (também
    // espiando, quando o `data-collapsible` fica vazio e ele volta inteiro), a largura vai
    // a 32, o rótulo some encolhendo e o ícone desliza até o centro, na curva das linhas
    // da barra. A faixa de 36 não muda de altura: o que vem abaixo não sobe.
    return (
        <div className="flex h-9 items-center">
            <Button
                variant="primary"
                size="lg"
                type="button"
                onClick={abrir}
                className="w-full overflow-hidden transition-[width,height,padding,gap,color,background-color,border-color,box-shadow,opacity,translate] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[--button-h:--spacing(8)]"
            >
                <PlusIcon aria-hidden />
                <span className="max-w-24 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-(--duration-slow) ease-(--ease-emphasized) group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
                    Adicionar
                </span>
            </Button>
        </div>
    )
}
