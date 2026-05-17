"use client"

import * as React from "react"

export type PageChromeSlotPatch = {
    /** Overrides header title when set (non-empty string). */
    title?: string
    /** When set, shows back button to this href. */
    backHref?: string
    /** Right-side control (e.g. MonthNav icon-only). */
    dateFilter?: React.ReactNode
}

type PageChromeContextValue = {
    slot: PageChromeSlotPatch | null
    setSlot: (next: PageChromeSlotPatch | null) => void
}

const PageChromeContext = React.createContext<PageChromeContextValue | null>(
    null,
)

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
    const [slot, setSlot] = React.useState<PageChromeSlotPatch | null>(null)
    const value = React.useMemo(
        () => ({ slot, setSlot }),
        [slot],
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
 * Prefer memoizing `dateFilter` to avoid unnecessary header updates.
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
    }, [setSlot, patch.title, patch.backHref, patch.dateFilter])
}
