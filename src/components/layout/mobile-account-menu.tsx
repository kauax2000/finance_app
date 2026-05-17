"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers"
import { AccountMenuUserSummary } from "@/components/layout/account-menu-user-summary"
import {
    ACCOUNT_MENU_PROFILE_LINK_ITEMS,
    ACCOUNT_MENU_WORKSPACE_LINK_ITEMS,
} from "@/components/layout/account-menu-links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import type { HeroIcon, NavigationItem } from "@/types/navigation"
import { isExactPath } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { AppThemeToggle } from "@/components/settings/app-theme-toggle"

export type MobileAccountMenuProps = {
    children: React.ReactElement
    /** Navegação que não cabe na barra inferior (ex.: Categorias) */
    overflowNavItems: NavigationItem[]
}

const rowButtonClass =
    "flex h-10 w-full min-w-0 items-center justify-start gap-2.5 rounded-lg px-2 font-normal"

type MenuNavLinkRowProps = {
    href: string
    label: string
    icon: HeroIcon
    active: boolean
    onNavigate: () => void
    beta?: boolean
}

function MenuNavLinkRow({
    href,
    label,
    icon: Icon,
    active,
    onNavigate,
    beta,
}: MenuNavLinkRowProps) {
    return (
        <Button
            variant="ghost"
            className={cn(rowButtonClass, active && "bg-accent text-accent-foreground")}
            asChild
        >
            <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
            >
                <Icon
                    className={cn(
                        "size-5 shrink-0",
                        active
                            ? "text-accent-foreground"
                            : "text-muted-foreground"
                    )}
                    aria-hidden
                />
                <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="min-w-0 truncate">{label}</span>
                    {beta ? (
                        <Badge
                            size="xs"
                            variant="primary"
                            className="shrink-0"
                        >
                            Beta
                        </Badge>
                    ) : null}
                </span>
            </Link>
        </Button>
    )
}

export function MobileAccountMenu({
    children,
    overflowNavItems,
}: MobileAccountMenuProps) {
    const pathname = usePathname()
    const { signOut } = useAuth()

    const [open, setOpen] = React.useState(false)

    const closeMenu = React.useCallback(() => setOpen(false), [])

    const pinnedNavItems = React.useMemo(
        () => [
            ...overflowNavItems,
            ...ACCOUNT_MENU_WORKSPACE_LINK_ITEMS.map(
                ({ href, label, icon }) => ({
                    href,
                    name: label,
                    icon,
                })
            ),
        ],
        [overflowNavItems]
    )

    const hasPinnedNav = pinnedNavItems.length > 0

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>{children}</PopoverTrigger>
                <PopoverContent
                    side="top"
                    align="center"
                    sideOffset={12}
                    collisionPadding={16}
                    className={cn(
                        "w-[min(calc(100vw-2rem),20rem)] max-w-[min(calc(100vw-2rem),20rem)]",
                        "max-h-[min(72dvh,29rem)] flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg ring-1 ring-border/10"
                    )}
                >
                    <PopoverHeader className="sr-only">
                        <PopoverTitle>Menu da conta</PopoverTitle>
                        <PopoverDescription>
                            Menu da conta e configurações.
                        </PopoverDescription>
                    </PopoverHeader>

                    <div className="flex min-h-0 max-h-[min(72dvh,29rem)] flex-col overflow-hidden rounded-xl py-1">
                        <div className="shrink-0">
                            <AccountMenuUserSummary />
                            <div
                                className="flex items-center justify-between gap-3 px-2.5 py-1.5"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <span className="text-sm text-foreground">Tema</span>
                                <AppThemeToggle className="ml-auto shrink-0" />
                            </div>
                        </div>

                        <Separator className="h-px w-full min-w-0 shrink-0 bg-border/60" />

                        <nav
                            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-0"
                            aria-label="Menu da conta"
                        >
                            {hasPinnedNav ? (
                                <>
                                    <div className="flex flex-col gap-0.5 px-2.5 py-2.5">
                                        {pinnedNavItems.map((item) => {
                                            const { href, name, icon: Icon } = item
                                            const beta =
                                                "beta" in item ? item.beta : undefined
                                            const active = isExactPath(
                                                pathname,
                                                href
                                            )
                                            return (
                                                <MenuNavLinkRow
                                                    key={href}
                                                    href={href}
                                                    label={name}
                                                    icon={Icon}
                                                    active={active}
                                                    beta={beta}
                                                    onNavigate={closeMenu}
                                                />
                                            )
                                        })}
                                    </div>
                                    <Separator className="h-px w-full min-w-0 shrink-0 bg-border/60" />
                                </>
                            ) : null}

                            <div className="flex flex-col gap-0.5 px-2.5 py-2.5">
                                {ACCOUNT_MENU_PROFILE_LINK_ITEMS.map(
                                    ({ href, label, icon: Icon }) => {
                                        const active = isExactPath(
                                            pathname,
                                            href
                                        )
                                        return (
                                            <MenuNavLinkRow
                                                key={href}
                                                href={href}
                                                label={label}
                                                icon={Icon}
                                                active={active}
                                                onNavigate={closeMenu}
                                            />
                                        )
                                    }
                                )}
                            </div>

                            <Separator className="h-px w-full min-w-0 shrink-0 bg-border/60" />

                            <div className="flex shrink-0 flex-col px-2.5 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className={cn(
                                        rowButtonClass,
                                        "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    )}
                                    onClick={() => {
                                        closeMenu()
                                        void signOut()
                                    }}
                                >
                                    <ArrowRightStartOnRectangleIcon
                                        className="size-5 shrink-0"
                                        aria-hidden
                                    />
                                    Sair
                                </Button>
                            </div>
                        </nav>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}
