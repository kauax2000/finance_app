"use client"

import { usePathname } from "next/navigation"

import { AuthShowcase } from "@/components/auth/showcase/auth-showcase"
import {
    AuthSceneProvider,
    defaultSceneFor,
    usePublishedAuthScene,
} from "@/components/auth/showcase/scene-context"
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel"
import { SplitShellRoot } from "@/components/ui/split-shell"

/**
 * O casco persistente das telas de acesso: mora no layout de `(auth)`, e por
 * isso o painel de marca é **o mesmo nó** entre `/login`, `/register`,
 * `/forgot-password`, `/reset-password` e `/invites/accept` — ele troca de
 * cena em vez de remontar. A coluna (`AuthShell`, um `SplitShellMain`) é de
 * cada formulário, e é ele que publica o id da cena.
 *
 * A cena padrão sai só do caminho: nada de `useSearchParams` aqui, que
 * obrigaria um `<Suspense>` em volta do layout inteiro.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
    return (
        <AuthSceneProvider>
            <Casco>{children}</Casco>
        </AuthSceneProvider>
    )
}

function Casco({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const cena = usePublishedAuthScene() ?? defaultSceneFor(pathname)
    return (
        <SplitShellRoot
            side="end"
            asideMobile="logo"
            aside={
                <AuthBrandPanel>
                    <AuthShowcase scene={cena} />
                </AuthBrandPanel>
            }
        >
            {children}
        </SplitShellRoot>
    )
}
