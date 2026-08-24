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
 * A rota fica na raiz de `src/app/`, fora de `(app)` e `(dashboard)`, então não
 * passa pelo `AuthGuard` — o catálogo não depende de sessão nem de workspace.
 *
 * Em produção ela só existe se `NEXT_PUBLIC_DS_DOCS` estiver ligada. O inventário
 * interno de um produto financeiro não precisa ser público, e uma rota que
 * responde 404 é mais barata de defender do que uma que responde 200 e depende
 * de ninguém ter achado o link.
 *
 * Não declara `ThemeProvider`: o layout raiz já monta um dentro do `AuthProvider`
 * (`attribute="class"`), e um segundo aninhado brigaria com ele pelo atributo do
 * `<html>`. O alternador de tema da casca consome aquele mesmo provider.
 */
export default function DesignSystemLayout({
    children,
}: {
    children: React.ReactNode
}) {
    if (!isDesignSystemEnabled()) notFound()

    return <DsShell>{children}</DsShell>
}
