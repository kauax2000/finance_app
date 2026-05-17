"use client"
/* eslint-disable @next/next/no-img-element -- bottom-nav avatar from user metadata URL */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Ellipsis } from "lucide-react"
import { QuickActionButton } from "@/components/layout/quick-actions"
import {
    MOBILE_FAB_HIDDEN,
    useMobileFab,
} from "@/components/layout/mobile-fab-provider"
import { MobileAccountMenu } from "@/components/layout/mobile-account-menu"
import { useAuth } from "@/components/providers"
import { Skeleton } from "@/components/ui/skeleton"
import {
    isAccountActivityPath,
    isAccountHubPath,
    isAccountSessionsPath,
    isCreditCardDetailPath,
    isExactPath,
    isMembersPath,
    isPlansPath,
    isSettingsPath,
    MAIN_NAVIGATION,
    ROUTES,
} from "@/config/navigation"
import { getAvatarColor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

const MOBILE_BAR_NAV_COUNT = 4

export function MobileBottomNav() {
    const pathname = usePathname()
    const fabSlot = useMobileFab()
    const fabHidden =
        fabSlot === MOBILE_FAB_HIDDEN ||
        isCreditCardDetailPath(pathname) ||
        isAccountSessionsPath(pathname) ||
        isAccountActivityPath(pathname) ||
        isPlansPath(pathname) ||
        isAccountHubPath(pathname) ||
        isSettingsPath(pathname) ||
        isMembersPath(pathname)
    const fabOverride = fabHidden ? null : fabSlot
    const { user, profile, loading, profileReady } = useAuth()

    const barNav = MAIN_NAVIGATION.slice(0, MOBILE_BAR_NAV_COUNT)
    const overflowNav = MAIN_NAVIGATION.slice(MOBILE_BAR_NAV_COUNT)

    const moreActive =
        overflowNav.some((item) => isExactPath(pathname, item.href)) ||
        isExactPath(pathname, ROUTES.MEMBERS) ||
        isExactPath(pathname, ROUTES.SETTINGS)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const avatarColor =
        profile?.avatar_color?.trim() ||
        (user?.email ? getAvatarColor(user.email) : getAvatarColor(userName))

    const showSkeleton = loading || (user != null && !profileReady)
    const showEllipsis = !user && !loading

    return (
        <>
            <nav
                className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
                aria-label="Navegação principal"
            >
                <div className="relative grid min-h-14 grid-cols-5 items-stretch px-2.5 py-2">
                    {barNav.map((item) => {
                        const Icon = item.icon
                        const active = isExactPath(pathname, item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                aria-label={item.name}
                                className={cn(
                                    "flex min-h-10 items-center justify-center rounded-lg transition-colors",
                                    active
                                        ? "text-primary"
                                        : "text-muted-foreground active:text-foreground"
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                        active && "bg-primary/10"
                                    )}
                                >
                                    <Icon className="size-5 shrink-0" />
                                </span>
                            </Link>
                        )
                    })}

                    <MobileAccountMenu overflowNavItems={overflowNav}>
                        <button
                            type="button"
                            aria-label="Abrir menu da conta e mais opções"
                            className={cn(
                                "flex min-h-10 items-center justify-center rounded-lg transition-colors",
                                showEllipsis &&
                                    (moreActive
                                        ? "text-primary"
                                        : "text-muted-foreground active:text-foreground"),
                                !showEllipsis &&
                                    !moreActive &&
                                    "text-muted-foreground active:text-foreground"
                            )}
                        >
                            {showEllipsis ? (
                                <span
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                        moreActive && "bg-primary/10"
                                    )}
                                >
                                    <Ellipsis className="size-5 shrink-0" />
                                </span>
                            ) : showSkeleton ? (
                                <Skeleton className="size-8 shrink-0 rounded-lg" />
                            ) : (
                                <span
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                        moreActive && "bg-primary/10"
                                    )}
                                >
                                    <div className="group/avatar relative flex size-8 shrink-0 select-none overflow-hidden rounded-lg bg-muted">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt={userName}
                                                className="aspect-square size-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className={`flex h-full w-full items-center justify-center text-sm font-medium text-white ${avatarColor}`}
                                            >
                                                {getInitials(userName)}
                                            </div>
                                        )}
                                    </div>
                                </span>
                            )}
                        </button>
                    </MobileAccountMenu>
                </div>

                {!fabHidden ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex -translate-y-full justify-center pb-3">
                        <div className="pointer-events-auto">
                            {fabOverride ?? <QuickActionButton variant="fab" />}
                        </div>
                    </div>
                ) : null}
            </nav>

        </>
    )
}
