import type { ReactNode } from "react"

import { AppWordmark } from "@/components/layout/app-wordmark"
import { SplitShellAside } from "@/components/ui/split-shell"

/**
 * O painel de marca das telas de acesso.
 *
 * Ele existe para responder, antes da senha, a pergunta que a tela de acesso
 * padrão não responde: **o que é este app**. A resposta não é uma frase de
 * efeito: é um pedaço do próprio produto, e **cada tela de acesso traz o seu**
 * (`scene`, em `components/auth/scenes/`) — o painel só hospeda.
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
            brand={<AppWordmark size="lg" />}
            logo={<AppWordmark size="md" rainbow />}
        >
            {children}
        </SplitShellAside>
    )
}
