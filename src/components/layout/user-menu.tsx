"use client"

import { useAuth } from "@/components/providers"
import { AccountMenuUserSummary } from "@/components/layout/account-menu-user-summary"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
                className="w-60 max-w-[calc(100vw-2rem)]"
                align="end"
                side="right"
                sideOffset={16}
                header={
                    <DropdownMenuLabel className="p-0 font-normal">
                        <AccountMenuUserSummary />
                    </DropdownMenuLabel>
                }
            >
                <div className="overflow-hidden rounded-xl py-1">

                    <div
                        className="flex items-center justify-between gap-3 px-2.5 py-1.5"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <span className="text-sm text-foreground">Tema</span>
                        <ThemeToggle className="ml-auto shrink-0" />
                    </div>

                    <DropdownMenuSeparator className="mx-0 my-0 bg-border/60" />

                    <div className="p-1">
                        {dropdownLinkItems.map(({ href, label, icon: Icon }) => (
                            <DropdownMenuItem key={href} asChild>
                                <Link href={href}>
                                    <Icon />
                                    {label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>

                    <DropdownMenuSeparator className="mx-0 my-0 bg-border/60" />

                    <div className="p-1">
                        <DropdownMenuItem variant="destructive" className="cursor-pointer"
                            onClick={() => signOut()}
                        >
                            <ArrowRightStartOnRectangleIcon />
                            Sair
                        </DropdownMenuItem>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
