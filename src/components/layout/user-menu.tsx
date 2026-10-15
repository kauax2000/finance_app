"use client"

import { createElement } from "react"
import { useAuth } from "@/components/providers"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
            {/* 4px do botão (sem encostar nele) e por cima da borda da placa — o
                botão fica 8 para dentro dela aberta e 16 recolhida. Encostado e
                alinhado à borda, lia como parte do fundo. */}
            <DropdownMenuContent
                size="xl"
                align="end"
                side="right"
                sideOffset={4}
            >
                {/* Do mais usado ao menos: as páginas da conta, a preferência de
                    tema e, por último, sair. Sem cabeçalho de identidade: o nome e
                    o e-mail já estão no botão que abre o menu, logo ao lado. "Sair"
                    em vermelho, por escolha do dono, como na gaveta do telefone. */}
                {dropdownLinkItems.map(({ href, label, icon }) => (
                    <DropdownMenuItem key={href} asChild>
                        <Link href={href}>
                            {createElement(microIconFor(icon) ?? icon)}
                            {label}
                        </Link>
                    </DropdownMenuItem>
                ))}
                {/* Os fios isolam o tema: é uma preferência entre os comandos. */}
                <DropdownMenuSeparator />
                {/* O tema é um controle, não um comando: a linha não fecha o menu.
                    `py-0.5`: o trilho de 32 numa linha de 36, a das outras. */}
                <div
                    data-menu-row
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
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => signOut()}>
                    <ArrowRightStartOnRectangleIcon />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
