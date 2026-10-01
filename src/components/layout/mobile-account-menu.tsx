"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/20/solid"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers"
import { AccountMenuUserSummary } from "@/components/layout/account-menu-user-summary"
import {
    ACCOUNT_MENU_PROFILE_LINK_ITEMS,
} from "@/components/layout/account-menu-links"
import { Badge } from "@/components/ui/badge"
import {
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerAction,
    DrawerActions,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import {
    getMobileAccountMenuPinnedNavItems,
    isMobileAccountMenuNavItemActive,
    type MobileAccountMenuNavItem,
} from "@/config/mobile-navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

export type MobileAccountMenuProps = {
    children: React.ReactElement
}

type MenuNavLinkRowProps = {
    href: string
    label: string
    icon: MobileAccountMenuNavItem["icon"]
    active: boolean
    beta?: boolean
}

/** Uma linha de navegação: a `DrawerAction` num link, que fecha a gaveta. */
function MenuNavLinkRow({
    href,
    label,
    icon: Icon,
    active,
    beta,
}: MenuNavLinkRowProps) {
    return (
        <DrawerAction asChild className={cn(active && "bg-muted")}>
            <Link href={href} aria-current={active ? "page" : undefined}>
                <Icon
                    className={cn(active && "text-foreground")}
                    aria-hidden
                />
                <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 truncate">{label}</span>
                    {beta ? (
                        <Badge size="xs" className="shrink-0">
                            Beta
                        </Badge>
                    ) : null}
                </span>
            </Link>
        </DrawerAction>
    )
}

/**
 * O menu da conta no telefone: uma gaveta (rodada 212), com o fundo que
 * encolhe. Era um `Popover` centrado na tela por uma âncora virtual, com o
 * vidro escrito à mão (`lib/mobile-glass-surface`) — uma folha flutuante que
 * não se arrastava. A identidade e o tema ficam em cima, os links são as
 * linhas da folha de ações, e sair é a destrutiva.
 */
export function MobileAccountMenu({ children }: MobileAccountMenuProps) {
    const pathname = usePathname()
    const { signOut } = useAuth()
    const [open, setOpen] = React.useState(false)

    const pinnedNavItems = getMobileAccountMenuPinnedNavItems()

    return (
        <Drawer open={open} onOpenChange={setOpen} scaleBackground>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent variant="inset">
                <DialogHeader className="sr-only">
                    <DialogTitle>Menu da conta</DialogTitle>
                    <DialogDescription>
                        Menu da conta e configurações.
                    </DialogDescription>
                </DialogHeader>

                {/* Um filho só abaixo do cabeçalho: é ele que rola, se a
                    lista passar da altura (o meio da gaveta). */}
                <div className="flex flex-col pb-2">
                    <div className="px-2">
                        <AccountMenuUserSummary />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-5 py-2">
                        <span className="text-sm text-foreground">Tema</span>
                        <ThemeToggle className="ml-auto shrink-0" />
                    </div>

                    <Separator tone="soft" className="my-2" />

                    <nav aria-label="Menu da conta">
                        {pinnedNavItems.length > 0 ? (
                            <>
                                <DrawerActions>
                                    {pinnedNavItems.map((item) => (
                                        <MenuNavLinkRow
                                            key={item.href}
                                            href={item.href}
                                            label={item.name}
                                            icon={item.icon}
                                            active={isMobileAccountMenuNavItemActive(
                                                pathname,
                                                item
                                            )}
                                            beta={
                                                "beta" in item ? item.beta : undefined
                                            }
                                        />
                                    ))}
                                </DrawerActions>
                                <Separator tone="soft" className="my-2" />
                            </>
                        ) : null}

                        <DrawerActions>
                            {ACCOUNT_MENU_PROFILE_LINK_ITEMS.map((item) => (
                                <MenuNavLinkRow
                                    key={item.href}
                                    href={item.href}
                                    label={item.label}
                                    icon={item.icon}
                                    active={isMobileAccountMenuNavItemActive(
                                        pathname,
                                        item
                                    )}
                                />
                            ))}
                        </DrawerActions>

                        <Separator tone="soft" className="my-2" />

                        <DrawerActions>
                            <DrawerAction
                                variant="destructive"
                                onClick={() => void signOut()}
                            >
                                <ArrowRightStartOnRectangleIcon aria-hidden />
                                Sair
                            </DrawerAction>
                        </DrawerActions>
                    </nav>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
