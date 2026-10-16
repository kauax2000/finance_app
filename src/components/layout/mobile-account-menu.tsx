"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ACCOUNT_MENU_PROFILE_LINK_ITEMS } from "@/components/layout/account-menu-links"
import { ROUTES } from "@/config/navigation"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSection,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    getMobileAccountMenuPinnedNavItems,
    isMobileAccountMenuNavItemActive,
    microIconFor,
} from "@/config/mobile-navigation"
import type { HeroIcon } from "@/types/navigation"

export type MobileAccountMenuProps = {
    children: React.ReactElement
}

type MenuLink = { href: string; label: string; icon: HeroIcon; beta?: boolean }

/**
 * O menu da conta no telefone: o painel que brota da aba "Conta" da barra de
 * baixo (rodada 278). Era uma gaveta de 625px com a identidade, o tema e o
 * sair; agora só leva às telas que não cabem na barra. O tema mora em
 * Configurações; o sair e os planos, em Minha conta. `panel` porque são seis linhas de
 * 44 no dedo, acima do teto das listas suspensas.
 */
export function MobileAccountMenu({ children }: MobileAccountMenuProps) {
    const pathname = usePathname()

    const telas: MenuLink[] = getMobileAccountMenuPinnedNavItems().map((item) => ({
        href: item.href,
        label: item.name,
        icon: item.icon,
        beta: "beta" in item ? item.beta : undefined,
    }))
    // Em cima as telas da carteira; embaixo a conta e as configurações. Planos e
    // pagamentos mora na página Minha conta, no telefone.
    const grupos: MenuLink[][] = [
        telas.filter((item) => item.href !== ROUTES.SETTINGS),
        [
            ...ACCOUNT_MENU_PROFILE_LINK_ITEMS.filter((item) => item.href !== ROUTES.PLANS),
            ...telas.filter((item) => item.href === ROUTES.SETTINGS),
        ],
    ].filter((grupo) => grupo.length > 0)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent
                variant="panel"
                size="xl"
                side="top"
                align="end"
                sideOffset={12}
                aria-label="Menu da conta"
            >
                {grupos.map((grupo, i) => (
                    <React.Fragment key={grupo[0]!.href}>
                        {i > 0 ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuSection>
                            {grupo.map(({ href, label, icon, beta }) => {
                                const active = isMobileAccountMenuNavItemActive(pathname, { href })
                                return (
                                    <DropdownMenuItem key={href} asChild>
                                        <Link href={href} aria-current={active ? "page" : undefined}>
                                            {React.createElement(microIconFor(icon) ?? icon)}
                                            <span className="min-w-0 flex-1 truncate">{label}</span>
                                            {beta ? <Badge size="xs">Beta</Badge> : null}
                                        </Link>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuSection>
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
