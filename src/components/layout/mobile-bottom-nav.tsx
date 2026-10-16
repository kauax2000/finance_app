"use client"

import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline"

import { usePathname } from "next/navigation"
import { QuickActionButton } from "@/components/layout/quick-actions"
import { MobileAccountMenu } from "@/components/layout/mobile-account-menu"
import {
    BottomBar,
    BottomBarSlot,
    BottomBarTab,
} from "@/components/ui/bottom-bar"
import { getMobileNavTabs, solidIconFor } from "@/config/mobile-navigation"
import { isExactPath, ROUTES } from "@/config/navigation"

function isMobileNavTabActive(pathname: string, href: string): boolean {
    if (href === ROUTES.DASHBOARD_CATEGORIES) {
        return pathname === href || pathname.startsWith(`${href}/`)
    }
    return isExactPath(pathname, href)
}

export function MobileBottomNav() {
    const pathname = usePathname()
    const navTabs = getMobileNavTabs()

    return (
        <BottomBar labels action={<QuickActionButton variant="fab" />}>
            {navTabs.map((item) => (
                <BottomBarTab
                    key={item.href}
                    href={item.href}
                    label={item.name}
                    icon={item.icon}
                    iconActive={solidIconFor(item.icon)}
                    active={isMobileNavTabActive(pathname, item.href)}
                />
            ))}

            {/* "Mais" é fixo: não vira o nome nem o ícone da página aberta pelo menu,
                e não fica ativo nela. Era o avatar, que esperava o perfil num
                esqueleto, e trocava de ícone e de rótulo a cada página do menu. */}
            <MobileAccountMenu>
                <BottomBarSlot label="Mais" aria-label="Mais opções">
                    <EllipsisHorizontalIcon className="size-6 shrink-0" aria-hidden />
                </BottomBarSlot>
            </MobileAccountMenu>
        </BottomBar>
    )
}
