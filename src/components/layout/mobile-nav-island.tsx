"use client"

import type { ReactNode } from "react"
import { MOBILE_GLASS_SURFACE_CLASSNAME } from "@/components/layout/mobile-glass-surface"
import { cn } from "@/lib/utils"

type MobileNavIslandProps = {
    children: ReactNode
    trailing?: ReactNode
    className?: string
}

export function MobileNavIsland({
    children,
    trailing,
    className,
}: MobileNavIslandProps) {
    return (
        <nav
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden"
            aria-label="Navegação principal"
        >
            <div className="pointer-events-auto mx-4 flex items-stretch gap-2">
                <div
                    className={cn(
                        MOBILE_GLASS_SURFACE_CLASSNAME,
                        "relative h-[var(--mobile-nav-island-height)] min-w-0 flex-1 rounded-2xl p-0.5",
                        className
                    )}
                >
                    {children}
                </div>
                {trailing ? (
                    <div className="pointer-events-auto flex h-[var(--mobile-nav-island-height)] shrink-0 items-center">
                        {trailing}
                    </div>
                ) : null}
            </div>
        </nav>
    )
}
