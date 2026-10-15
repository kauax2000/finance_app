"use client"

import { createElement } from "react"
import { useAuth } from "@/components/providers"
import { AccountMenuUserSummary } from "@/components/layout/account-menu-user-summary"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuSection,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRightStartOnRectangleIcon, SwatchIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { ACCOUNT_MENU_LINK_ITEMS } from "@/components/layout/account-menu-links"
import { ROUTES } from "@/config/navigation"
import { microIconFor } from "@/config/mobile-navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface UserMenuProps {
    children: React.ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
    const { signOut } = useAuth()

    const dropdownLinkItems = ACCOUNT_MENU_LINK_ITEMS.filter(
        ({ href }) =>
            href !== ROUTES.SETTINGS && href !== ROUTES.MEMBERS
    )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            {/* 8 do recuo da placa flutuante + 8 de calha: o menu abre a 8px dela. */}
            <DropdownMenuContent
                variant="panel"
                size="xl"
                align="end"
                side="right"
                sideOffset={16}
                header={
                    <DropdownMenuHeader>
                        <AccountMenuUserSummary />
                    </DropdownMenuHeader>
                }
            >
                {/* Do mais usado ao menos: as páginas da conta, a preferência de
                    tema e, por último, sair. Sem fio: o do cabeçalho já separa a
                    identidade dos comandos. "Sair" não é `destructive` — tem
                    volta, e o vermelho é do que não tem. */}
                <DropdownMenuSection>
                    {dropdownLinkItems.map(({ href, label, icon }) => (
                        <DropdownMenuItem key={href} asChild>
                            <Link href={href}>
                                {createElement(microIconFor(icon) ?? icon)}
                                {label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    {/* O tema é um controle, não um comando: a linha não fecha o menu.
                        `py-0.5`: o trilho de 32 numa linha de 36, a das outras. */}
                    <div
                        className="flex items-center justify-between gap-3 px-2 py-0.5"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {/* Com ícone, o rótulo cai na coluna dos outros (o recuo e o vão da linha do menu). */}
                        <span className="flex items-center gap-1.5 text-sm">
                            <SwatchIcon aria-hidden className="size-4 shrink-0" />
                            Tema
                        </span>
                        <ThemeToggle />
                    </div>
                    <DropdownMenuItem onSelect={() => signOut()}>
                        <ArrowRightStartOnRectangleIcon />
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuSection>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
