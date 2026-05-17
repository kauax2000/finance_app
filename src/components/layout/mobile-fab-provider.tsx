"use client"

import {
    createContext,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react"

type MobileFabActions = {
    register: (node: ReactNode) => void
    unregister: (node: ReactNode) => void
}

/** Registered via `useHideMobileFab` — suppresses the default FAB without a replacement. */
export const MOBILE_FAB_HIDDEN = Symbol("mobile-fab-hidden")

export type MobileFabSlot = ReactNode | typeof MOBILE_FAB_HIDDEN | null

const MobileFabSlotContext = createContext<MobileFabSlot>(null)
const MobileFabActionsContext = createContext<MobileFabActions | null>(null)

export function MobileFabProvider({ children }: { children: ReactNode }) {
    const [slot, setSlot] = useState<MobileFabSlot>(null)

    const [actions] = useState<MobileFabActions>(() => ({
        register: (node: ReactNode) => setSlot(node as MobileFabSlot),
        unregister: (node: ReactNode) =>
            setSlot((cur) => (cur === node ? null : cur)),
    }))

    return (
        <MobileFabActionsContext.Provider value={actions}>
            <MobileFabSlotContext.Provider value={slot}>
                {children}
            </MobileFabSlotContext.Provider>
        </MobileFabActionsContext.Provider>
    )
}

/**
 * Pages call this hook to replace the default mobile FAB.
 * Pass a ReactNode to show, or null to restore the default.
 */
export function useMobileFabSlot(node: ReactNode | null) {
    const actions = useContext(MobileFabActionsContext)
    const slotRef = useRef<ReactNode | null>(null)

    useLayoutEffect(() => {
        if (!actions) return
        if (slotRef.current) actions.unregister(slotRef.current)
        if (node) {
            slotRef.current = node
            actions.register(node)
        } else {
            slotRef.current = null
        }
        return () => {
            if (slotRef.current) {
                actions.unregister(slotRef.current)
                slotRef.current = null
            }
        }
    })
}

/** Hides the default mobile FAB for the current page (no replacement). */
export function useHideMobileFab() {
    useMobileFabSlot(MOBILE_FAB_HIDDEN as unknown as ReactNode)
}

/** MobileBottomNav reads the current slot (null means use the default QuickActionButton). */
export function useMobileFab(): MobileFabSlot {
    return useContext(MobileFabSlotContext)
}
