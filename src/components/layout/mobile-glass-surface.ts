import { cn } from "@/lib/utils"

/** Shared Liquid Glass material for mobile island nav, FAB, and account popover. */
export const MOBILE_GLASS_SURFACE_CLASSNAME = cn(
    "mobile-glass-surface border shadow-lg ring-1 ring-border/20"
)

/** Glass menu panel shell (avatar popover + FAB dropdown). */
export const MOBILE_GLASS_MENU_CONTENT_CLASSNAME = cn(
    MOBILE_GLASS_SURFACE_CLASSNAME,
    "w-[min(calc(100vw-2rem),14rem)]",
    "flex flex-col gap-0 overflow-hidden rounded-xl p-0",
    "bg-transparent text-foreground shadow-lg"
)

export const MOBILE_GLASS_MENU_INNER_CLASSNAME =
    "flex flex-col gap-0.5 px-2.5 py-2.5"

export const MOBILE_GLASS_MENU_ITEM_CLASSNAME = cn(
    "relative flex h-11 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-3 text-sm font-normal outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0"
)

export const MOBILE_GLASS_MENU_ROW_CLASSNAME = cn(
    MOBILE_GLASS_MENU_ITEM_CLASSNAME,
    "w-full min-w-0 cursor-pointer justify-start"
)

export const MOBILE_GLASS_MENU_SEPARATOR_CLASSNAME =
    "mx-0 my-0 h-px bg-border/60"
