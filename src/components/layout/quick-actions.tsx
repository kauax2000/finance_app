"use client"

import {
    ArrowPathRoundedSquareIcon,
    ArrowTrendingDownIcon as DespesaMicroIcon,
    ArrowTrendingUpIcon as ReceitaMicroIcon,
    PlusIcon,
    RectangleStackIcon as ParcelaMicroIcon,
} from "@heroicons/react/16/solid"
import {
    ArrowPathRoundedSquareIcon as AssinaturaIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    PlusIcon as PlusMiniIcon,
    RectangleStackIcon,
} from "@heroicons/react/20/solid"
import * as React from "react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerAction,
    DrawerActions,
    DrawerCancel,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useSidebar } from "@/components/ui/sidebar"
import { ROUTES } from "@/config/navigation"
import { BottomBarAction } from "@/components/ui/bottom-bar"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"

const FIXED_TRANSACTION_ACTIONS: ReadonlyArray<{
    mode: NewTransactionMode
    label: string
    /** O ícone da linha na folha de ações do telefone (20/solid). */
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    /** O mesmo ícone na linha do menu, que o desenha a 16 (16/solid). */
    menuIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = [
    { mode: "expense", label: "Despesa", icon: ArrowTrendingDownIcon, menuIcon: DespesaMicroIcon },
    { mode: "installment", label: "Compra parcelada", icon: RectangleStackIcon, menuIcon: ParcelaMicroIcon },
    { mode: "income", label: "Receita", icon: ArrowTrendingUpIcon, menuIcon: ReceitaMicroIcon },
]

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

function FixedQuickCreateMenuItems({
    onPickTransaction,
    onPickSubscription,
}: {
    onPickTransaction: (mode: NewTransactionMode) => void
    onPickSubscription: () => void
}) {
    // Toda linha com ícone, uma lista só.
    return (
        <>
            {FIXED_TRANSACTION_ACTIONS.map(({ mode, label, menuIcon: Icon }) => (
                <DropdownMenuItem
                    key={mode}
                    onClick={() => onPickTransaction(mode)}
                >
                    <Icon aria-hidden />
                    {label}
                </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={onPickSubscription}>
                <ArrowPathRoundedSquareIcon aria-hidden />
                Assinatura
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
    const { state, espiando } = useSidebar()
    const quickCreate = useQuickCreateTransaction()
    const createSubscription = useQuickCreateSubscription()
    // Espiando, a barra está aberta por cima com o `state` ainda `collapsed` (a
    // folga não se mexe): o botão volta ao primário inteiro com ela.
    const isSidebarCollapsed = state === "collapsed" && !espiando

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

    // No telefone o "+" abre a folha de ações (rodada 212): era um
    // `DropdownMenu` com o vidro escrito à mão (`lib/mobile-glass-surface`),
    // flutuando sobre o botão. A ação roda e a gaveta fecha.
    if (isFab) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <BottomBarAction label="Adicionar">
                        <PlusMiniIcon className="size-5 shrink-0" />
                    </BottomBarAction>
                </DrawerTrigger>
                <DrawerContent>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Adicionar</DialogTitle>
                        <DialogDescription>
                            O que você quer registrar?
                        </DialogDescription>
                    </DialogHeader>
                    <DrawerActions>
                        {FIXED_TRANSACTION_ACTIONS.map(({ mode, label, icon: Icon }) => (
                            <DrawerAction
                                key={mode}
                                onClick={() => quickCreate(mode)}
                            >
                                <Icon aria-hidden />
                                {label}
                            </DrawerAction>
                        ))}
                        <DrawerAction onClick={() => createSubscription()}>
                            <AssinaturaIcon aria-hidden />
                            Assinatura
                        </DrawerAction>
                    </DrawerActions>
                    <DrawerCancel />
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {isSidebarCollapsed ? (
                    <Button
                        variant="primary"
                        size="icon-md"
                        type="button"
                        aria-label="Adicionar"
                    >
                        <PlusIcon aria-hidden />
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        type="button"
                        className="w-full"
                    >
                        <PlusIcon aria-hidden />
                        Adicionar
                    </Button>
                )}
            </DropdownMenuTrigger>
            {/* 4px do botão (sem encostar nele) e por cima da borda da placa — o
                botão fica 8 para dentro dela aberta e 16 recolhida. Encostado e
                alinhado à borda, lia como parte do fundo. */}
            <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={4}
                size="xl"
            >
                <FixedQuickCreateMenuItems
                    onPickTransaction={pickTransaction}
                    onPickSubscription={pickSubscription}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
