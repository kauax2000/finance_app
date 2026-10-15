"use client"

import { ChevronDownIcon, PlusIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"
import { cn } from "@/lib/utils"

export type TransactionNewSplitButtonProps = {
    onNew: (mode: NewTransactionMode) => void
    /** Extra rows below the three launch types (e.g. Nova assinatura). */
    menuFooter?: React.ReactNode
    menuAlign?: "start" | "end"
    menuSide?: "top" | "right" | "bottom" | "left"
    className?: string
}

export function TransactionNewSplitButton({
    onNew,
    menuFooter,
    menuAlign = "end",
    menuSide,
    className,
}: TransactionNewSplitButtonProps) {
    return (
        <ButtonGroup className={cn("min-w-0 max-w-full", className)}>
            <Button
                type="button"
                variant="primary"
                className="min-w-0 flex-1 justify-center"
                onClick={() => onNew("expense")}
            >
                <PlusIcon />
                <span className="truncate">Nova transação</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="primary"
                        size="icon-lg"
                        className="shrink-0"
                        aria-label="Mais tipos de lançamento"
                    >
                        <ChevronDownIcon className="opacity-90" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={menuAlign}
                    side={menuSide}
                    className="min-w-56 w-max max-w-[min(100vw-2rem,18rem)]"
                >
                    <DropdownMenuItem onClick={() => onNew("expense")}>
                        Nova despesa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNew("income")}>
                        Nova receita
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNew("installment")}>
                        Nova compra parcelada
                    </DropdownMenuItem>
                    {menuFooter}
                </DropdownMenuContent>
            </DropdownMenu>
        </ButtonGroup>
    )
}
