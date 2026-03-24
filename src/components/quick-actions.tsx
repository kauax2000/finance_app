"use client"

import * as React from "react"
import Link from "next/link"
import {
    Plus,
    ChevronDown,
    Wallet,
    CreditCard,
    ArrowUpDown,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function QuickActionButton() {
    const [open, setOpen] = React.useState(false)

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {/* Container com transição suave de shrink */}
                <div className="group/buttongroup flex w-full justify-start overflow-hidden rounded-md ring-sidebar-ring transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:rounded-lg">
                    {/* Primeiro botão: Link para nova transação */}
                    <Button
                        variant="default"
                        className="flex-1 justify-center gap-2 rounded-r-none border-r-0 h-10 group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0"
                        asChild
                    >
                        <Link href="/dashboard/transactions/new" className="group-data-[collapsible=icon]:px-0">
                            <Plus className="h-5 w-5 shrink-0" />
                            <span className="transition-opacity duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:overflow-hidden">Nova Despesa</span>
                        </Link>
                    </Button>
                    {/* Segundo botão: Chevron para dropdown */}
                    <Button
                        variant="default"
                        className="rounded-l-none border-l-[1px] h-10 group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:hidden"
                    >
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </div>
            </DropdownMenuTrigger>

            {/* Dropdown Menu Content */}
            <DropdownMenuContent
                align="start"
                side="right"
                className="w-48"
                sideOffset={8}
            >
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/transactions/new" className="gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <span>Nova Transação</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/wallets/new" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        <span>Nova Carteira</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/categories/new" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Nova Categoria</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
