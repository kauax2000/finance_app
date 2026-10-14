"use client"

import { useAuth } from "@/components/providers"
import { AccountMenuUserSummary } from "@/components/layout/account-menu-user-summary"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuSection,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { ACCOUNT_MENU_LINK_ITEMS } from "@/components/layout/account-menu-links"
import { ROUTES } from "@/config/navigation"
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
                <DropdownMenuSection>
                    {/* O tema é um controle, não um comando: a linha não fecha o menu. */}
                    <div
                        className="flex items-center justify-between gap-3 px-2 py-1"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <span className="text-sm">Tema</span>
                        <ThemeToggle />
                    </div>
                    <DropdownMenuSeparator />
                    {dropdownLinkItems.map(({ href, label, icon: Icon }) => (
                        <DropdownMenuItem key={href} asChild>
                            <Link href={href}>
                                <Icon />
                                {label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => signOut()}>
                        <ArrowRightStartOnRectangleIcon />
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuSection>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
