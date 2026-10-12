import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DsShell } from "./ds-shell"
import { isDesignSystemEnabled } from "./enabled"

export const metadata: Metadata = {
    title: "Design system · Finance",
    description: "Tokens, componentes e padrões do Finance App.",
    robots: {
        index: false,
        follow: false,
    },
}

/**
 * A rota fica fora de `(app)` e `(dashboard)`, então não passa pelo `AuthGuard`. Em produção só existe com
 * `NEXT_PUBLIC_DS_DOCS` ligada (404 é mais barato de defender). Não declara `ThemeProvider`: o do layout raiz
 * serve, e um segundo aninhado brigaria com ele pelo atributo do `<html>`.
 */
export default function DesignSystemLayout({
    children,
}: {
    children: React.ReactNode
}) {
    if (!isDesignSystemEnabled()) notFound()

    return <DsShell>{children}</DsShell>
}
