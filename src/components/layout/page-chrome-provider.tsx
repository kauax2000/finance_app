"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { MobileHeaderFilterIcon } from "@/config/mobile-navigation"

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
    filter: PageChromeFilterEntry | null
    setFilter: (next: PageChromeFilterEntry | null) => void
}

/** O filtro publicado e a rota de quem o publicou: a de outra tela não vale. */
type PageChromeFilterEntry = { pathname: string; filter: PageChromeFilter | null }

const PageChromeContext = React.createContext<PageChromeContextValue | null>(
    null,
)

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
    const [slot, setSlot] = React.useState<PageChromeSlotPatch | null>(null)
    const [filter, setFilter] = React.useState<PageChromeFilterEntry | null>(null)
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

/**
 * O filtro que a página de `pathname` publicou; `undefined` enquanto ela não
 * falou (a troca de tela ainda não montou a página, ou a publicada é de outra
 * rota). `null` é uma resposta: a página falou e não quer filtro.
 */
export function usePageChromeFilterFor(pathname: string): PageChromeFilter | null | undefined {
    const ctx = React.useContext(PageChromeContext)
    if (!ctx) {
        throw new Error("usePageChromeFilterFor must be used within PageChromeProvider")
    }
    return ctx.filter?.pathname === pathname ? ctx.filter.filter : undefined
}

/**
 * O que o cabeçalho desenha: a publicação da página vence (inclusive o `null`,
 * que desliga o filtro na aba Receitas); sem ela, a rota declara um botão inerte
 * na forma final, sem `onOpen` nem `popover`, que não abre nada até a página falar.
 */
export function filtroDoCabecalho(
    declarado: MobileHeaderFilterIcon | null,
    publicado: PageChromeFilter | null | undefined,
): PageChromeFilter | null {
    if (publicado !== undefined) return publicado
    if (!declarado) return null
    return {
        label: declarado === "month" ? "Mês" : "Filtros",
        active: false,
        disabled: true,
        icon: declarado,
    }
}

/**
 * Publica o filtro da tela no cabeçalho do telefone; sai ao desmontar. O
 * `onOpen` e o `popover` vão por ref: o cabeçalho só renderiza de novo quando o
 * nome ou o estado mudam. Fora do provider (o catálogo) ou com `enabled`
 * falso, não faz nada — ou melhor, publica `null` para a rota, que vence a
 * declaração dela e desliga o botão. Cada publicação leva o `pathname` da
 * montagem, e a limpeza também.
 */
export function usePageChromeFilter(filter: PageChromeFilter, enabled = true) {
    const setFilter = React.useContext(PageChromeContext)?.setFilter
    const pathname = usePathname()
    const ref = React.useRef(filter)
    ref.current = filter
    const { label, active, disabled, icon } = filter
    const temPopover = Boolean(filter.popover)

    React.useLayoutEffect(() => {
        if (!setFilter) return
        if (!enabled) {
            setFilter({ pathname, filter: null })
            return () => setFilter({ pathname, filter: null })
        }
        setFilter({
            pathname,
            filter: {
                label,
                active,
                disabled,
                icon,
                onOpen: () => ref.current.onOpen?.(),
                popover: temPopover ? (fechar) => ref.current.popover?.(fechar) : undefined,
            },
        })
        return () => setFilter({ pathname, filter: null })
    }, [setFilter, pathname, enabled, label, active, disabled, icon, temPopover])
}
