"use client"

import * as React from "react"

const QUERY = "(min-width: 64rem)"

function subscribe(onChange: () => void) {
    const mql = window.matchMedia(QUERY)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
}

/** Verdadeiro a partir de 64rem; `false` no servidor. */
export function useTelaLarga() {
    return React.useSyncExternalStore(
        subscribe,
        () => window.matchMedia(QUERY).matches,
        () => false
    )
}
