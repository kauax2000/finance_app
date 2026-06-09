"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers"
import { AccountMenuUserSummary } from "@/components/layout/account-menu-user-summary"
import {
    ACCOUNT_MENU_PROFILE_LINK_ITEMS,
} from "@/components/layout/account-menu-links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
    getMobileAccountMenuPinnedNavItems,
    isMobileAccountMenuNavItemActive,
    type MobileAccountMenuNavItem,
} from "@/config/mobile-navigation"
import {
    MOBILE_GLASS_ACCOUNT_MENU_CONTENT_CLASSNAME,
    MOBILE_GLASS_MENU_INNER_CLASSNAME,
    MOBILE_GLASS_MENU_ROW_CLASSNAME,
    MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME,
} from "@/components/layout/mobile-glass-surface"
import { AppThemeToggle } from "@/components/settings/app-theme-toggle"
import { cn } from "@/lib/utils"

export type MobileAccountMenuProps = {
    children: React.ReactElement
}

const rowButtonClass = MOBILE_GLASS_MENU_ROW_CLASSNAME

const MOBILE_POPOVER_X_CENTER_QUERY = "(max-width: 767px)"

function useMatchMedia(query: string): boolean {
    const [matches, setMatches] = React.useState(false)

    React.useEffect(() => {
        const media = window.matchMedia(query)
        const update = () => setMatches(media.matches)

        update()
        media.addEventListener("change", update)
        return () => media.removeEventListener("change", update)
    }, [query])

    return matches
}

/**
 * Anchor virtual que espelha os limites verticais do trigger (avatar) mas fixa
 * o eixo X no centro da viewport. Assim o Radix posiciona e anima o popover
 * nativamente (side=top, align=center), centralizado horizontalmente na tela.
 */
function createCenteredViewportAnchor(
    triggerRef: React.RefObject<HTMLElement | null>
): { getBoundingClientRect: () => DOMRect } {
    return {
        getBoundingClientRect: () => {
            const viewport = window.visualViewport
            const viewportWidth = viewport?.width ?? window.innerWidth
            const offsetLeft = viewport?.offsetLeft ?? 0
            const centerX = offsetLeft + viewportWidth / 2

            const rect = triggerRef.current?.getBoundingClientRect()
            const top = rect?.top ?? window.innerHeight
            const bottom = rect?.bottom ?? window.innerHeight

            return {
                x: centerX,
                y: top,
                width: 0,
                height: bottom - top,
                top,
                bottom,
                left: centerX,
                right: centerX,
                toJSON() {},
            } as DOMRect
        },
    }
}

type MenuNavLinkRowProps = {
    href: string
    label: string
    icon: MobileAccountMenuNavItem["icon"]
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

export function MobileAccountMenu({ children }: MobileAccountMenuProps) {
    const pathname = usePathname()
    const { signOut } = useAuth()

    const [open, setOpen] = React.useState(false)
    const triggerRef = React.useRef<HTMLElement | null>(null)
    const isMobileCenter = useMatchMedia(MOBILE_POPOVER_X_CENTER_QUERY)
    const centeredAnchorRef = React.useRef(
        createCenteredViewportAnchor(triggerRef)
    )

    const closeMenu = React.useCallback(() => setOpen(false), [])

    const triggerChild = React.useMemo(
        () =>
            React.cloneElement(
                children as React.ReactElement<{
                    ref?: React.Ref<HTMLElement>
                }>,
                { ref: triggerRef }
            ),
        [children]
    )

    const pinnedNavItems = getMobileAccountMenuPinnedNavItems()
    const hasPinnedNav = pinnedNavItems.length > 0

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>{triggerChild}</PopoverTrigger>
                {isMobileCenter ? (
                    <PopoverAnchor virtualRef={centeredAnchorRef} />
                ) : null}
                <PopoverContent
                    side="top"
                    align="center"
                    sideOffset={12}
                    collisionPadding={16}
                    className={cn(
                        MOBILE_GLASS_ACCOUNT_MENU_CONTENT_CLASSNAME,
                        "max-h-[min(72dvh,29rem)]"
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

                        <Separator
                            className={cn(
                                "h-px w-full min-w-0 shrink-0",
                                MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME
                            )}
                        />

                        <nav
                            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-0"
                            aria-label="Menu da conta"
                        >
                            {hasPinnedNav ? (
                                <>
                                    <div className={MOBILE_GLASS_MENU_INNER_CLASSNAME}>
                                        {pinnedNavItems.map((item) => {
                                            const { href, name, icon: Icon } = item
                                            const beta =
                                                "beta" in item ? item.beta : undefined
                                            const active =
                                                isMobileAccountMenuNavItemActive(
                                                    pathname,
                                                    item
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
                                    <Separator
                                        className={cn(
                                            "h-px w-full min-w-0 shrink-0",
                                            MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME
                                        )}
                                    />
                                </>
                            ) : null}

                            <div className={MOBILE_GLASS_MENU_INNER_CLASSNAME}>
                                {ACCOUNT_MENU_PROFILE_LINK_ITEMS.map((item) => {
                                    const { href, label, icon: Icon } = item
                                    const active =
                                        isMobileAccountMenuNavItemActive(
                                            pathname,
                                            item
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
                                })}
                            </div>

                            <Separator
                                className={cn(
                                    "h-px w-full min-w-0 shrink-0",
                                    MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME
                                )}
                            />

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
