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
 *
 * ## A superfície é a do `TabsList`, e a divergência era só no escuro
 *
 * Este controle e uma fileira de abas `solid` são **a mesma anatomia**: uma
 * bandeja com um polegar que desliza para marcar qual das posições vale. Só que
 * eles nasceram de primitivas diferentes (`Switch` aqui, `Tabs.List` lá) e
 * tomaram a decisão de superfície duas vezes, com respostas contrárias.
 *
 * No tema claro elas quase coincidiam. No escuro **invertiam**: o `Tabs` põe a
 * bandeja em `--muted` (0,269) e faz o polegar *afundar* para `--background`
 * (0,145) — a mesma decisão que o `Menubar` registra, de subir para o fundo da
 * página em vez de tingir, já que `--accent` e `--muted` são a mesma cor no
 * escuro. Aqui era o oposto: bandeja rebaixada com alfa (`bg-muted/40`, que
 * compõe perto de 0,195) e polegar **subindo** para `--card` (0,205). Sobravam
 * 0,01 de luminosidade entre os dois — contra os 0,124 do `Tabs` —, e o que
 * ainda separava a pastilha do trilho era a borda de 1px e a sombra, não a
 * superfície. Ela sumia no próprio trilho.
 *
 * Então a régua passou a ser a do `TabsList`: trilho `bg-muted` chapado nos dois
 * temas, polegar `bg-background` com `border-border/80` e `shadow-xs` — as três
 * classes do `tabs-indicator`, na letra. O `ring-1 ring-border/60` do trilho
 * saiu junto, porque a moldura do `Tabs` não tem contorno: com a bandeja
 * chapada ela não precisa de um, e o `focus-visible:ring-3` continua sendo o
 * único anel que este controle desenha.
 *
 * ## O hover é tinta, e nada se move
 *
 * O `TabsTrigger` inativo declara `hover:text-foreground` e mais nada: no cursor
 * ele **acende o rótulo**, sem pintar superfície e sem deslocar objeto. O
 * movimento é reservado para a troca de estado de verdade — é a mesma economia
 * que faz o marcador viajar só quando a aba muda.
 *
 * Aqui era o inverso exato. A tinta das faces não reagia ao cursor (ela só lia
 * `data-visual`), e quem respondia era um segundo elemento — um "blob"
 * `bg-foreground/12`, do tamanho e da forma do polegar, que aparecia na metade
 * de destino e deslizava até ela para *prever* o clique.
 *
 * Ele saiu por duas razões. A primeira é a régua: desenhar uma superfície no
 * hover é o que este design system não faz em controle segmentado. A segunda é
 * que ele piorou com o conserto anterior — sobre o trilho rebaixado de antes o
 * blob compunha perto de 0,290, e sobre o `bg-muted` chapado ele vai a ~0,355,
 * enquanto o polegar de verdade afunda para 0,145. Passavam a ser **duas
 * pastilhas do mesmo tamanho** em lados opostos do trilho, uma clara e uma
 * escura, e num controle onde a pastilha *é* o estado isso lê como "já trocou".
 *
 * No lugar dele, a face de destino acende — `group-hover/face:text-foreground`,
 * com o par `active:` que a regra H exige. O destino continua sendo anunciado
 * antes do clique, pelo mesmo meio que uma aba usa.
 *
 * **O que continua divergindo, de propósito.** O `rounded-full` das duas peças,
 * porque um alternador de tema lê como switch por convenção e um trilho
 * segmentado não. O recuo de 2px contra os 4px do `Tabs`, porque lá o gatilho é
 * um controle de verdade e deve a altura à escada — aqui as duas metades não
 * são focáveis, o `role="switch"` é a raiz inteira, e subir a pílula para 40px
 * só para hospedar um polegar de 32 mudaria o cabeçalho que a contém. E o
 * relógio: `--duration-slow` com `--ease-emphasized` contra os 200ms do `Tabs`,
 * que documenta que "a 300 o marcador arrasta" — ali o marcador acompanha uma
 * troca de painel, aqui o deslize **é** a resposta, e ele ainda trabalha em
 * volta do `disableTransitionOnChange` do next-themes (ver os dois quadros
 * abaixo).
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
                "group/theme relative inline-flex h-8 w-18 shrink-0 items-center rounded-full bg-muted p-0.5 outline-none transition-colors",
                // O alvo de toque real: a pílula tem 32px de altura, e o
                // pseudo-elemento a leva aos 44px que um dedo pede sem mexer no
                // layout de quem a posiciona.
                "after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-['']",
                "focus-visible:ring-3 focus-visible:ring-ring/70",
                className,
            )}
            // Ele vive dentro de menus suspensos (conta e menu mobile): sem isto,
            // o pointer down fecha o menu antes do clique chegar.
            onPointerDown={(e) => e.stopPropagation()}
        >
            <SwitchPrimitive.Thumb
                data-slot="app-theme-toggle-thumb"
                className={cn(
                    // As três classes de superfície são as do `tabs-indicator`
                    // (`bg-background`, `border-border/80`, `shadow-xs`), e o
                    // escuro **não** as sobrescreve — ver o cabeçalho. Só a
                    // forma diverge, porque este é um switch.
                    "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full border border-border/80 bg-background shadow-xs",
                    "transform-gpu will-change-transform transition-transform duration-(--duration-slow) ease-(--ease-emphasized)",
                    "group-data-[visual=light]/theme:translate-x-full",
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
    /** Esta é a metade para onde o polegar vai — a que acende sob o cursor. */
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
        // A face de destino **precisa** receber o ponteiro para poder acender:
        // o `pointer-events-none` fica só na que já está ativa. O clique não se
        // perde — ele borbulha para o botão. `data-role` sobrevive porque é o
        // que distingue as duas em teste e em depuração; nada de CSS o lê mais,
        // desde que o hover deixou de ser desenhado pela raiz.
        <span
            data-role={alvo ? "target" : "active"}
            className={cn(
                // `group/face` porque quem recebe o ponteiro é esta caixa e quem
                // carrega a tinta é o glifo lá dentro. Assim cada classe fica com
                // **um variante só** — a armadilha das variantes empilhadas que
                // este arquivo já documentou, e que aqui nem chega a existir.
                "group/face",
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
                    // **O hover é tinta, e só.** É a régua do `TabsTrigger`
                    // inativo (`hover:text-foreground`) — ver o cabeçalho. A
                    // face que já está valendo tem `pointer-events-none`, então
                    // só a de destino acende, que é exatamente o que a aba
                    // inativa faz e a ativa não precisa fazer.
                    "group-hover/face:text-foreground",
                    // `hover:` compila para `@media (hover: hover)` e não vale no
                    // telefone. Sem o par, a regra H do projeto acusa — e o toque
                    // ficaria sem resposta nenhuma antes do polegar sair.
                    "group-active/face:text-foreground",
                    ativo,
                )}
            >
                <OutlineIcon aria-hidden className={cn(glifo, sumeAtivo)} />
                <SolidIcon aria-hidden className={cn(glifo, acendeAtivo)} />
            </span>
        </span>
    )
}
