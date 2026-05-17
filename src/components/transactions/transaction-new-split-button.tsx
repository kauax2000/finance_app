"use client"

import * as React from "react"
import { ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
        <div
            className={cn(
                "flex min-h-0 min-w-0 max-w-full items-stretch overflow-hidden rounded-md",
                className,
            )}
        >
            <Button
                type="button"
                variant="default"
                size="default"
                className="h-9 min-w-0 flex-1 justify-center gap-2 rounded-r-none border-r border-border/50 text-xs md:h-8"
                onClick={() => onNew("expense")}
            >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Nova transação</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="default"
                        size="default"
                        className="h-9 w-8 shrink-0 rounded-l-none border-l-0 px-0 text-xs md:h-8"
                        aria-label="Mais tipos de lançamento"
                    >
                        <ChevronDown
                            className="h-4 w-4 opacity-90"
                            aria-hidden
                        />
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
        </div>
    )
}
