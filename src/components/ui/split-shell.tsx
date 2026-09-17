import type { ReactNode } from "react"

import { Container } from "@/components/ui/container"
import { H1, Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

/**
 * A página dividida: um campo à esquerda, uma coluna de conteúdo à direita.
 *
 * É o casco de uma tela que existe **fora** da casca do app — acesso, convite,
 * qualquer página que tenha algo a mostrar antes de pedir alguma coisa. Abaixo
 * de `lg` as duas partes empilham: o campo vira uma faixa no topo e a coluna
 * ocupa o resto.
 *
 * **Não há cartão, e é a decisão que ele carrega.** O cartão centrado existe
 * para dar moldura a um formulário solto no meio de um fundo cinza; com o campo
 * segurando metade da tela, a moldura já está dada, e um retângulo com borda
 * dentro dela é uma segunda fronteira para o mesmo limite — a mesma conta que
 * tirou o fio das tiras do `Card`. A coluna é a superfície.
 *
 * **O campo é um slot, e não uma peça deste arquivo.** O que ele mostra é
 * conteúdo de produto — marca, números, prova —, e conteúdo de produto não mora
 * em `ui/`. Quem usa passa o seu: no app, é o `AuthBrandPanel`.
 *
 * `5fr 6fr` e não `grid-cols-2`: o campo fica em ~45%, e a coluna do conteúdo é
 * a mais larga porque é ela que tem trabalho a fazer.
 */
function SplitShell({
    aside,
    title,
    description,
    children,
    className,
    ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
    /** O campo. No telefone ele vira a faixa do topo. */
    aside: ReactNode
    title: string
    /** Uma linha. Título sobre descrição é par de identidade — sem `gap`. */
    description?: ReactNode
    children: ReactNode
}) {
    return (
        <div
            data-slot="split-shell"
            className={cn(
                "flex min-h-svh flex-col lg:grid lg:grid-cols-[5fr_6fr]",
                className,
            )}
            {...props}
        >
            {aside}
            {/* No telefone o conteúdo encosta no topo, logo abaixo da faixa;
                centrado na vertical ele flutuava a 223px dela (medido a
                375×812) e a faixa deixava de ancorar coisa nenhuma. A sobra que
                fica embaixo é onde o teclado sobe. A partir de `lg` a coluna
                tem altura inteira, e aí centrar é o certo. */}
            <main className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:justify-center lg:px-12 lg:py-16">
                <Container size="sm" stack="section">
                    <header>
                        <H1>{title}</H1>
                        {description ? <Muted>{description}</Muted> : null}
                    </header>
                    {children}
                </Container>
            </main>
        </div>
    )
}

export { SplitShell }
