"use client"

import {
    MoonIcon as MoonOutlineIcon,
    SunIcon as SunOutlineIcon,
} from "@heroicons/react/24/outline"
import {
    MoonIcon as MoonSolidIcon,
    SunIcon as SunSolidIcon,
} from "@heroicons/react/16/solid"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Switch as SwitchPrimitive } from "radix-ui"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Alternador de tema: um switch com as duas faces visíveis.
 *
 * Era um par de botões com `aria-pressed` e um indicador deslizante por baixo.
 * O desenho estava certo; a semântica é que pedia duas paradas de tabulação e
 * dois nomes acessíveis para uma decisão binária. Sobre o `Switch` do Radix ele
 * vira um controle só, com `role="switch"`, `aria-checked` e Espaço/Enter de
 * graça.
 *
 * A lua e o sol continuam **os dois** desenhados, e é isso que separa este
 * switch de um liga/desliga: num switch nu, "marcado" não diz qual tema é. Aqui
 * o polegar desliza por baixo dos dois ícones e acende o que está valendo, então
 * o controle continua respondendo "qual dos dois" e não "ligado ou não".
 */
export function AppThemeToggle({
    className,
}: {
    /** Classes para o contentor do switch. */
    className?: string
}) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- client-only mounted gate for next-themes */
        setMounted(true)
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [])

    const effective =
        theme === "light" || theme === "dark" ? theme : resolvedTheme
    const isLight = mounted && effective === "light"

    // next-themes roda com `disableTransitionOnChange`, que injeta
    // `* { transition: none !important }` enquanto troca a classe do tema.
    // Aplicar a posição dois quadros depois deixa o deslize acontecer já sem esse
    // estilo, senão o polegar salta de um lado ao outro sem animar.
    //
    // Só a *aparência* é adiada. O `checked` do Radix acompanha o estado real na
    // hora, então o leitor de tela nunca anuncia o valor antigo.
    const [visualIsLight, setVisualIsLight] = useState(isLight)

    useEffect(() => {
        let raf2: number | null = null
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setVisualIsLight(isLight))
        })
        return () => {
            cancelAnimationFrame(raf1)
            if (raf2 !== null) cancelAnimationFrame(raf2)
        }
    }, [isLight])

    if (!mounted) {
        return (
            <Skeleton
                className={cn("h-8 w-18 shrink-0 rounded-full", className)}
            />
        )
    }

    return (
        <SwitchPrimitive.Root
            checked={isLight}
            onCheckedChange={(next) => setTheme(next ? "light" : "dark")}
            aria-label="Tema claro"
            data-slot="app-theme-toggle"
            data-visual={visualIsLight ? "light" : "dark"}
            className={cn(
                "group/theme relative inline-flex h-8 w-18 shrink-0 items-center rounded-full bg-muted/60 p-0.5 outline-none ring-1 ring-border/60 transition-colors",
                // O alvo de toque real: a pílula tem 32px de altura, e o
                // pseudo-elemento a leva aos 44px que um dedo pede sem mexer no
                // layout de quem a posiciona.
                "after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-['']",
                "focus-visible:ring-3 focus-visible:ring-ring/70",
                "dark:bg-muted/40",
                // **Onde o polegar está, e para onde ele vai.** As duas medidas
                // moram aqui porque o deslocamento do blob depende de *duas*
                // coisas ao mesmo tempo — o estado e o cursor —, e empilhar
                // `group-hover/theme:group-data-[visual=light]/theme:` **não
                // compila**: o Tailwind trata variantes empilhadas como cadeia
                // de descendentes, e as duas aqui apontam para o mesmo
                // elemento, então o seletor não casaria com nada.
                //
                // Com o estado na variável, cada classe do blob fica com um
                // variante só: o hover apenas troca qual das duas ele lê.
                "[--theme-blob-rest:0%] [--theme-blob-dest:100%]",
                "data-[visual=light]:[--theme-blob-rest:100%] data-[visual=light]:[--theme-blob-dest:0%]",
                className,
            )}
            // Ele vive dentro de menus suspensos (conta e menu mobile): sem isto,
            // o pointer down fecha o menu antes do clique chegar.
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* A previsão do destino.
             *
             * Ela vem **antes** do polegar no DOM, e é isso que a faz nascer de
             * trás dele sem precisar de `z-index`: em repouso os dois ocupam a
             * mesma posição (`--theme-blob-rest`), e o polegar é opaco. No
             * cursor ela viaja para o outro lado e aparece — no tema claro, um
             * borrão escuro em volta da lua, dizendo para onde o botão vai.
             *
             * A cor inverte sozinha: `--foreground` é quase preto no claro e
             * quase branco no escuro, então a mesma classe prevê o outro modo
             * nos dois sentidos, sem uma única cor cravada.
             *
             * Ao clicar com o cursor em cima, as duas variáveis se invertem: o
             * polegar vai para onde o blob estava e o blob para o lado oposto.
             * Eles se cruzam, e o blob passa a prever a volta.
             */}
            <span
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full bg-foreground/12",
                    "transform-gpu will-change-transform transition-[transform,opacity] duration-(--duration-slow) ease-(--ease-emphasized)",
                    "translate-x-(--theme-blob-rest) scale-90 opacity-0",
                    // **O gatilho é a metade de destino, não a pílula.** Com
                    // `group-hover/theme:` o blob acendia com o cursor em
                    // qualquer lugar do botão — inclusive sobre o lado que já
                    // está ativo, onde não há nada a prever.
                    //
                    // Quem sabe qual metade é o destino é o React, e ele carimba
                    // `data-role="target"` nela. O `has-` lê isso a partir da
                    // raiz, então continua **um variante por classe**: nada de
                    // empilhar `group-hover` com `group-data-[visual]`, que
                    // viraria cadeia de descendentes e não casaria.
                    "group-has-[[data-role=target]:hover]/theme:translate-x-(--theme-blob-dest) group-has-[[data-role=target]:hover]/theme:scale-100 group-has-[[data-role=target]:hover]/theme:opacity-100",
                    // `hover:` compila para `@media (hover: hover)` e não vale
                    // no telefone. Sem o par, a regra H do projeto acusa — e o
                    // toque ficaria sem nenhuma resposta antes do polegar sair.
                    "group-has-[[data-role=target]:active]/theme:translate-x-(--theme-blob-dest) group-has-[[data-role=target]:active]/theme:scale-100 group-has-[[data-role=target]:active]/theme:opacity-100",
                )}
            />
            <SwitchPrimitive.Thumb
                data-slot="app-theme-toggle-thumb"
                className={cn(
                    "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full border border-border/80 bg-background shadow-sm",
                    "transform-gpu will-change-transform transition-transform duration-(--duration-slow) ease-(--ease-emphasized)",
                    "group-data-[visual=light]/theme:translate-x-full",
                    "dark:bg-card",
                )}
            />
            <ThemeFace icon="dark" alvo={visualIsLight} />
            <ThemeFace icon="light" alvo={!visualIsLight} />
        </SwitchPrimitive.Root>
    )
}

/**
 * Uma das duas faces. Vem depois do polegar no DOM de propósito: assim ela pinta
 * por cima dele sem precisar de `z-index`, e o ícone que está valendo aparece
 * *sobre* a pastilha em vez de sumir debaixo dela.
 *
 * **A face que está valendo é sólida; a outra é de contorno.** O peso do traço é
 * o sinal mais forte dos três, e ele resolve o que a cor sozinha não resolvia: no
 * tema escuro a distância entre `foreground` e `muted-foreground` fica sutil
 * demais num glifo de 16px. A escala e a tinta continuam, somando ao mesmo lado.
 *
 * O par não é do mesmo conjunto, e não podia ser: **o Heroicons só tem contorno
 * em 24** — não existe `16/outline` nem `20/outline`. Então o ativo usa o micro
 * (`16/solid`), que é o conjunto certo para `size-4`, e o inativo é o glifo de
 * 24 desenhado a 16. Ele fica com o traço fino, e é exatamente o que a régua de
 * iconografia adverte — aqui a troca é consciente: o contorno é o **estado
 * apagado**, e o traço mais leve trabalha a favor dele em vez de contra.
 *
 * Os dois glifos ficam empilhados e trocam por opacidade, e não por condicional
 * no JSX: o estado visual é dirigido por CSS (`data-visual`, dois quadros atrás
 * do estado real, ver acima), então uma troca em React aconteceria no meio do
 * deslize do polegar — glifo pulando enquanto a pastilha ainda anda.
 */
function ThemeFace({
    icon,
    alvo,
}: {
    icon: "light" | "dark"
    /** Esta é a metade para onde o polegar vai — a que responde ao cursor. */
    alvo: boolean
}) {
    const OutlineIcon = icon === "light" ? SunOutlineIcon : MoonOutlineIcon
    const SolidIcon = icon === "light" ? SunSolidIcon : MoonSolidIcon

    // As três variantes são escritas por extenso, e não montadas a partir de
    // `icon`: o Tailwind varre o código como **texto**, e uma classe interpolada
    // em tempo de execução nunca chega ao CSS.
    const ativo =
        icon === "light"
            ? "group-data-[visual=light]/theme:scale-100 group-data-[visual=light]/theme:text-foreground"
            : "group-data-[visual=dark]/theme:scale-100 group-data-[visual=dark]/theme:text-foreground"
    const sumeAtivo =
        icon === "light"
            ? "group-data-[visual=light]/theme:opacity-0"
            : "group-data-[visual=dark]/theme:opacity-0"
    const acendeAtivo =
        icon === "light"
            ? "opacity-0 group-data-[visual=light]/theme:opacity-100"
            : "opacity-0 group-data-[visual=dark]/theme:opacity-100"

    const glifo =
        "absolute inset-0 size-4 transition-opacity duration-(--duration-slow) ease-(--ease-emphasized)"

    return (
        // `data-role` é o que o blob procura pelo `has-` da raiz. E a face de
        // destino **precisa** receber o ponteiro para poder ser o gatilho: o
        // `pointer-events-none` fica só na que já está ativa. O clique não se
        // perde — ele borbulha para o botão.
        <span
            data-role={alvo ? "target" : "active"}
            className={cn(
                // `z-10` não é enfeite: o `::after` que expande o alvo de toque
                // da raiz é gerado **depois** das faces e, sem `z-index`, pinta
                // por cima delas — ele engolia o ponteiro, e a face de destino
                // nunca recebia `:hover`. Medido: a pílula casava `:hover` e a
                // face não. Subindo a face, o anel externo do `::after` continua
                // capturando o que está fora da pílula.
                "relative z-10 flex w-1/2 items-center justify-center",
                !alvo && "pointer-events-none",
            )}
        >
            <span
                className={cn(
                    "relative block size-4 scale-90 text-muted-foreground transition-[transform,color] duration-(--duration-slow) ease-(--ease-emphasized)",
                    ativo,
                )}
            >
                <OutlineIcon aria-hidden className={cn(glifo, sumeAtivo)} />
                <SolidIcon aria-hidden className={cn(glifo, acendeAtivo)} />
            </span>
        </span>
    )
}
