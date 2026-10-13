import type { ReactNode } from "react"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { SplitShellAside } from "@/components/ui/split-shell"

/**
 * O painel de marca das telas de acesso.
 *
 * Ele existe para responder, antes da senha, a pergunta que a tela de acesso
 * padrão não responde: **o que é este app**. A resposta não é uma frase de
 * efeito: é um pedaço do próprio produto, e **cada tela de acesso traz o seu**
 * (a cena, em `components/auth/showcase/scenes.ts`) — o painel só hospeda o
 * palco (`AuthShowcase`), que no desktop ocupa o campo inteiro (`absolute
 * inset-0`): por isso o campo é o pai posicionado e recorta o que passa da
 * borda, e o wordmark fica acima do palco (`z-10`).
 *
 * **É um cartão, não uma coluna.** A superfície é a `@utility brand-field` — o
 * arco-íris da marca com grão pesado e vinheta para o preto — e a geometria
 * (cartão no topo do telefone, coluna no desktop, área segura, `self-start` da
 * marca) é do `SplitShellAside`.
 *
 * **Nenhum texto corrido mora direto sobre o arco-íris.** Sete matizes não têm
 * um contraste só: o que se lê vive dentro de `Card`, que segue o tema. A
 * única exceção é o `AppWordmark`, branco, que herda o `color` do campo por
 * `currentColor`. No telefone o painel encolhe ao wordmark (`logo`).
 */
export function AuthBrandPanel({ children }: { children: ReactNode }) {
    return (
        <SplitShellAside
            surface="brand"
            className="@3xl/split-shell:relative @3xl/split-shell:isolate @3xl/split-shell:overflow-clip"
            brand={<AppWordmark size="lg" className="relative z-10" />}
            logo={<AppWordmark size="md" rainbow />}
        >
            {children}
        </SplitShellAside>
    )
}
