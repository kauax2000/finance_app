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
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { ACCOUNT_MENU_LINK_ITEMS } from "@/components/layout/account-menu-links"
import { ROUTES } from "@/config/navigation"
import { AppThemeToggle } from "@/components/settings/app-theme-toggle"

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
            <DropdownMenuContent
                className="w-60 max-w-[calc(100vw-2rem)] rounded-xl p-0 shadow-lg ring-1 ring-border/10"
                align="end"
                side="right"
                sideOffset={8}
            >
                <div className="overflow-hidden rounded-xl py-1">
                    <DropdownMenuLabel className="p-0 font-normal">
                        <AccountMenuUserSummary />
                    </DropdownMenuLabel>

                    <div
                        className="flex items-center justify-between gap-3 px-2.5 py-1.5"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <span className="text-sm text-foreground">Tema</span>
                        <AppThemeToggle className="ml-auto shrink-0" />
                    </div>

                    <DropdownMenuSeparator className="mx-0 my-0 bg-border/60" />

                    <div className="p-1">
                        {dropdownLinkItems.map(({ href, label, icon: Icon }) => (
                            <DropdownMenuItem key={href} asChild>
                                <Link href={href}>
                                    <Icon className="mr-2 h-4 w-4" />
                                    {label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>

                    <DropdownMenuSeparator className="mx-0 my-0 bg-border/60" />

                    <div className="p-1">
                        <DropdownMenuItem
                            className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => signOut()}
                        >
                            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
