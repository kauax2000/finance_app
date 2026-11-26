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
    /** Quantos filtros ligados; com ele, o número no canto no lugar do ponto. */
    count?: number
    /** Desligado de verdade: esmaece (a tela publica, como Contas sem tabela). */
    disabled?: boolean
    /**
     * O botão que a rota declara antes de a página falar: sem `onOpen` nem
     * `popover`, um toque não faz nada, mas ele não esmaece — senão o ícone
     * acenderia de 50% a 100% a cada navegação, quando a página publica.
     */
    inerte?: boolean
    /** `filter` (o ajuste da folha de filtros) ou `month` (o calendário do mês). */
    icon?: "filter" | "month"
    /** O mês da tela (`YYYY-MM`), com `icon: "month"`: no desktop ele sobe à barra com o título. */
    month?: string
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
    menu: PageChromeMenuEntry | null
    setMenu: (next: PageChromeMenuEntry | null) => void
}

/**
 * O filtro publicado e a rota de quem o publicou: a de outra tela não vale. O
 * estado `null` é "nenhuma página falou" (ao sair, a tela devolve o estado a
 * ele); `{ pathname, filter: null }` é a página que falou e não quer filtro.
 */
type PageChromeFilterEntry = { pathname: string; filter: PageChromeFilter | null }

/** O ⋯ publicado e a rota de quem o publicou, no molde do filtro: `null` na entrada é "não quer ⋯". */
type PageChromeMenuEntry = { pathname: string; menu: React.ReactNode | null }

const PageChromeContext = React.createContext<PageChromeContextValue | null>(
    null,
)

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
    const [slot, setSlot] = React.useState<PageChromeSlotPatch | null>(null)
    const [filter, setFilter] = React.useState<PageChromeFilterEntry | null>(null)
    const [menu, setMenu] = React.useState<PageChromeMenuEntry | null>(null)
    const value = React.useMemo(
        () => ({ slot, setSlot, filter, setFilter, menu, setMenu }),
        [slot, filter, menu],
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
 * Ele não é `disabled`: o esmaecer piscaria a cada troca de tela.
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
        inerte: true,
        icon: declarado,
    }
}

/**
 * Publica o filtro da tela no cabeçalho do telefone; ao desmontar, devolve o
 * estado a "não falou" (`null`), para a rota voltar a declarar o botão inerte
 * em vez de herdar um "sem filtro" velho. O
 * `onOpen` e o `popover` vão por ref: o cabeçalho só renderiza de novo quando o
 * nome ou o estado mudam. Fora do provider (o catálogo), não faz nada; com
 * `enabled` falso, publica `{ pathname, filter: null }`, que vence a declaração
 * da rota e desliga o botão. Cada publicação leva o `pathname` da montagem.
 */
export function usePageChromeFilter(filter: PageChromeFilter, enabled = true) {
    const setFilter = React.useContext(PageChromeContext)?.setFilter
    const pathname = usePathname()
    const ref = React.useRef(filter)
    ref.current = filter
    const { label, active, count, disabled, icon, month } = filter
    const temPopover = Boolean(filter.popover)

    React.useLayoutEffect(() => {
        if (!setFilter) return
        if (!enabled) {
            setFilter({ pathname, filter: null })
            return () => setFilter(null)
        }
        setFilter({
            pathname,
            filter: {
                label,
                active,
                count,
                disabled,
                icon,
                month,
                onOpen: () => ref.current.onOpen?.(),
                popover: temPopover ? (fechar) => ref.current.popover?.(fechar) : undefined,
            },
        })
        return () => setFilter(null)
    }, [setFilter, pathname, enabled, label, active, count, disabled, icon, month, temPopover])
}

/**
 * O ⋯ que a página de `pathname` publicou para a cápsula do cabeçalho do
 * telefone; `undefined` enquanto ela não falou (aí a rota declara o ⋯ inerte,
 * `mobileHeaderMenuFor`). `null` é uma resposta: a página não quer ⋯ (o convidado).
 */
export function usePageChromeMenuFor(pathname: string): React.ReactNode | null | undefined {
    const ctx = React.useContext(PageChromeContext)
    if (!ctx) {
        throw new Error("usePageChromeMenuFor must be used within PageChromeProvider")
    }
    return ctx.menu?.pathname === pathname ? ctx.menu.menu : undefined
}

/**
 * Publica o ⋯ da tela na cápsula do cabeçalho do telefone, depois da lupa e do
 * filtro; ao desmontar, devolve o estado a "não falou". Quem chama memoriza o nó
 * (`useMemo`), senão cada render republica. Com `enabled` falso não fala: a rota
 * segue com o ⋯ inerte (enquanto a tela carrega). Fora do provider (o catálogo), não faz nada.
 */
export function usePageChromeMenu(menu: React.ReactNode | null, enabled = true) {
    const setMenu = React.useContext(PageChromeContext)?.setMenu
    const pathname = usePathname()
    React.useLayoutEffect(() => {
        if (!setMenu || !enabled) return
        setMenu({ pathname, menu })
        return () => setMenu(null)
    }, [setMenu, pathname, menu, enabled])
}
