import type { ComponentType, SVGProps } from "react"

/** Componente de ícone Heroicons v2. É o tipo de todo ícone de interface. */
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>

export type NavigationItem = {
    name: string
    href: string
    icon: HeroIcon
    /** Ex.: badge Beta na sidebar e no tooltip quando colapsada */
    beta?: boolean
}

export type SubPageMeta = {
    parent: string
    parentTitle: string
    title: string
}
