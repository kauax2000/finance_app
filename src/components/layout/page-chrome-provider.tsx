"use client"

import * as React from "react"

export type PageChromeSlotPatch = {
    /** Overrides header title when set (non-empty string). */
    title?: string
    /** When set, shows back button to this href. */
    backHref?: string
}

/**
 * O filtro da tela, que o cabeçalho do telefone desenha à direita, colado à
 * lupa. Mora à parte do `slot` porque quem o publica é a barra da lista, e a
 * página dela pode publicar título e voltar ao mesmo tempo.
 */
export type PageChromeFilter = {
    /** O nome do botão, com o estado ("Filtros — ativos"). */
    label: string
    /** Há filtro fora do padrão: o ponto no canto. */
    active: boolean
    disabled?: boolean
    /** `filter` (o ajuste da folha de filtros) ou `month` (o calendário do mês). */
    icon?: "filter" | "month"
    /** Abre a folha da tela. */
    onOpen?: () => void
    /** No lugar da folha, um popover ancorado no botão; `fechar` o fecha. */
    popover?: (fechar: () => void) => React.ReactNode
}

type PageChromeContextValue = {
    slot: PageChromeSlotPatch | null
    setSlot: (next: PageChromeSlotPatch | null) => void
    filter: PageChromeFilter | null
    setFilter: (next: PageChromeFilter | null) => void
}

const PageChromeContext = React.createContext<PageChromeContextValue | null>(
    null,
)

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
    const [slot, setSlot] = React.useState<PageChromeSlotPatch | null>(null)
    const [filter, setFilter] = React.useState<PageChromeFilter | null>(null)
    const value = React.useMemo(
        () => ({ slot, setSlot, filter, setFilter }),
        [slot, filter],
    )
    return (
        <PageChromeContext.Provider value={value}>
            {children}
        </PageChromeContext.Provider>
    )
}

export function usePageChromeState(): PageChromeSlotPatch | null {
    const ctx = React.useContext(PageChromeContext)
    if (!ctx) {
        throw new Error("usePageChromeState must be used within PageChromeProvider")
    }
    return ctx.slot
}

/**
 * Publishes mobile header chrome for the current page. Clears on unmount.
 */
export function usePageChromeSlot(patch: PageChromeSlotPatch) {
    const ctx = React.useContext(PageChromeContext)
    if (!ctx) {
        throw new Error("usePageChromeSlot must be used within PageChromeProvider")
    }
    const { setSlot } = ctx
    const patchRef = React.useRef(patch)
    patchRef.current = patch

    React.useLayoutEffect(() => {
        setSlot({ ...patchRef.current })
        return () => setSlot(null)
    }, [setSlot, patch.title, patch.backHref])
}

export function usePageChromeFilterState(): PageChromeFilter | null {
    const ctx = React.useContext(PageChromeContext)
    if (!ctx) {
        throw new Error("usePageChromeFilterState must be used within PageChromeProvider")
    }
    return ctx.filter
}

/**
 * Publica o filtro da tela no cabeçalho do telefone; sai ao desmontar. O
 * `onOpen` e o `popover` vão por ref: o cabeçalho só renderiza de novo quando o
 * nome ou o estado mudam. Fora do provider (o catálogo) ou com `enabled`
 * falso, não faz nada.
 */
export function usePageChromeFilter(filter: PageChromeFilter, enabled = true) {
    const setFilter = React.useContext(PageChromeContext)?.setFilter
    const ref = React.useRef(filter)
    ref.current = filter
    const { label, active, disabled, icon } = filter
    const temPopover = Boolean(filter.popover)

    React.useLayoutEffect(() => {
        if (!setFilter || !enabled) return
        setFilter({
            label,
            active,
            disabled,
            icon,
            onOpen: () => ref.current.onOpen?.(),
            popover: temPopover ? (fechar) => ref.current.popover?.(fechar) : undefined,
        })
        return () => setFilter(null)
    }, [setFilter, enabled, label, active, disabled, icon, temPopover])
}
