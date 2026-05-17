import type { LucideIcon } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

/** Heroicons v2 outline/solid icon component (categories, workspace picker, overflow menus). */
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>

export type NavigationItem = {
    name: string
    href: string
    icon: LucideIcon
    /** Ex.: badge Beta na sidebar e no tooltip quando colapsada */
    beta?: boolean
}

export type SubPageMeta = {
    parent: string
    parentTitle: string
    title: string
}
