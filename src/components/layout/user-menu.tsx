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
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { ACCOUNT_MENU_LINK_ITEMS } from "@/components/layout/account-menu-links"
import { ROUTES } from "@/config/navigation"
import { microIconFor } from "@/config/mobile-navigation"
import { useWorkspace } from "@/components/workspace-provider"
import { itensDeNavegacaoPara } from "@/lib/papeis/rotas-do-convidado"

interface UserMenuProps {
    children: React.ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
    const { signOut } = useAuth()
    const { papel } = useWorkspace()

    // A lista do papel (Bloco 7A): Minha conta, Planos e o Cofre valem para todos.
    const dropdownLinkItems = itensDeNavegacaoPara(papel, ACCOUNT_MENU_LINK_ITEMS).filter(
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
                {/* As páginas da conta e, por último, sair. Sem cabeçalho de identidade:
                    o nome e o e-mail já estão no botão que abre o menu, logo ao lado.
                    "Sair" em vermelho, por escolha do dono, como na gaveta do telefone. */}
                {dropdownLinkItems.map(({ href, label, icon }) => (
                    <DropdownMenuItem key={href} asChild>
                        <Link href={href}>
                            {createElement(microIconFor(icon) ?? icon)}
                            {label}
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => signOut()}>
                    <ArrowRightStartOnRectangleIcon />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
