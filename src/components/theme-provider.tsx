"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * O `next-themes` desenha um `<script>` que tira o pisca do tema. Ele só vale no HTML do servidor;
 * renderizado no cliente (remontagem), o React 19.2 avisa "Encountered a script tag". No cliente o
 * script vira bloco de dados (`text/plain`), que o React não acusa — o tema já está aplicado.
 */
const SCRIPT_PROPS = { type: typeof window === "undefined" ? "text/javascript" : "text/plain" } as const

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider scriptProps={SCRIPT_PROPS} {...props}>
            {children}
        </NextThemesProvider>
    )
}
