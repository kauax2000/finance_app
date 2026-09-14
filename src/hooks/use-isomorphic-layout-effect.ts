import * as React from "react"

/** `useLayoutEffect` no cliente e `useEffect` no servidor, onde o primeiro só avisa. */
export const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
