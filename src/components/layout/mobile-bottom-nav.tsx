"use client"
/* eslint-disable @next/next/no-img-element -- bottom-nav avatar from user metadata URL */

import { usePathname } from "next/navigation"
import { Ellipsis } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { QuickActionButton } from "@/components/layout/quick-actions"
import { MobileAccountMenu } from "@/components/layout/mobile-account-menu"
import { MobileNavIsland } from "@/components/layout/mobile-nav-island"
import { MobileNavTab } from "@/components/layout/mobile-nav-tab"
import {
    mobileNavTabIconClass,
    mobileNavTabInnerClass,
    mobileNavTabRootClass,
} from "@/components/layout/mobile-nav-tab-classes"
import { useAuth } from "@/components/providers"
import { Skeleton } from "@/components/ui/skeleton"
import {
    getActiveMobileAccountMenuNavItem,
    getMobileNavTabs,
    type MobileAccountMenuNavItem,
} from "@/config/mobile-navigation"
import { isExactPath, ROUTES } from "@/config/navigation"
import { getAvatarColor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

function isMobileNavTabActive(pathname: string, href: string): boolean {
    if (href === ROUTES.DASHBOARD_CATEGORIES) {
        return pathname === href || pathname.startsWith(`${href}/`)
    }
    return isExactPath(pathname, href)
}

type MobileAccountMenuSlotContentProps = {
    activeMenuNavItem: MobileAccountMenuNavItem | null
    showEllipsis: boolean
    showSkeleton: boolean
    userName: string
    avatarColor: string
    avatarUrl?: string | null
}

function MobileAccountMenuSlotContent({
    activeMenuNavItem,
    showEllipsis,
    showSkeleton,
    userName,
    avatarColor,
    avatarUrl,
}: MobileAccountMenuSlotContentProps) {
    const reduceMotion = useReducedMotion()

    const slotKey = showEllipsis
        ? "ellipsis"
        : showSkeleton
          ? "skeleton"
          : activeMenuNavItem
            ? `icon:${activeMenuNavItem.href}`
            : "avatar"

    function renderSlot() {
        if (showEllipsis) {
            return (
                <Ellipsis
                    className={mobileNavTabIconClass(false)}
                    aria-hidden
                />
            )
        }

        if (showSkeleton) {
            return <Skeleton className="size-6 shrink-0 rounded-md" />
        }

        if (activeMenuNavItem) {
            const Icon = activeMenuNavItem.icon
            return (
                <Icon className={mobileNavTabIconClass(true)} aria-hidden />
            )
        }

        return (
            <span className="relative flex size-6 shrink-0 select-none overflow-hidden rounded-md bg-muted">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={userName}
                        className="aspect-square size-full object-cover"
                    />
                ) : (
                    <span
                        className={cn(
                            "flex size-full items-center justify-center text-[10px] font-medium text-white",
                            avatarColor
                        )}
                    >
                        {getInitials(userName)}
                    </span>
                )}
            </span>
        )
    }

    return (
        <span className="relative grid size-6 shrink-0 place-items-center">
            <AnimatePresence initial={false} mode="sync">
                <motion.span
                    key={slotKey}
                    className="col-start-1 row-start-1 flex items-center justify-center"
                    initial={
                        reduceMotion ? false : { opacity: 0, scale: 0.8 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                        reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.8 }
                    }
                    transition={{
                        duration: reduceMotion ? 0 : 0.22,
                        ease: "easeOut",
                    }}
                >
                    {renderSlot()}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}

export function MobileBottomNav() {
    const pathname = usePathname()
    const { user, profile, loading, profileReady } = useAuth()

    const navTabs = getMobileNavTabs()
    const activeMenuNavItem = getActiveMobileAccountMenuNavItem(pathname)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const avatarColor =
        profile?.avatar_color?.trim() ||
        (user?.email ? getAvatarColor(user.email) : getAvatarColor(userName))

    const showSkeleton = loading || (user != null && !profileReady)
    const showEllipsis = !user && !loading

    return (
        <MobileNavIsland trailing={<QuickActionButton variant="fab" />}>
            <div className="grid h-full grid-cols-4 items-stretch gap-0.5">
                {navTabs.map((item) => (
                    <MobileNavTab
                        key={item.href}
                        href={item.href}
                        name={item.name}
                        icon={item.icon}
                        active={isMobileNavTabActive(pathname, item.href)}
                    />
                ))}

                <MobileAccountMenu>
                    <button
                        type="button"
                        aria-label={
                            activeMenuNavItem?.name ??
                            "Abrir menu da conta e mais opções"
                        }
                        className={mobileNavTabRootClass}
                    >
                        <span
                            className={mobileNavTabInnerClass(
                                activeMenuNavItem != null
                            )}
                        >
                            <MobileAccountMenuSlotContent
                                activeMenuNavItem={activeMenuNavItem}
                                showEllipsis={showEllipsis}
                                showSkeleton={showSkeleton}
                                userName={userName}
                                avatarColor={avatarColor}
                                avatarUrl={user?.user_metadata?.avatar_url}
                            />
                        </span>
                    </button>
                </MobileAccountMenu>
            </div>
        </MobileNavIsland>
    )
}
