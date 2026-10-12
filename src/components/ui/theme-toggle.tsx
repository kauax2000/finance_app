"use client"

import {
    ComputerDesktopIcon as ComputerOutlineIcon,
    MoonIcon as MoonOutlineIcon,
    SunIcon as SunOutlineIcon,
} from "@heroicons/react/24/outline"
import {
    ComputerDesktopIcon as ComputerSolidIcon,
    MoonIcon as MoonSolidIcon,
    SunIcon as SunSolidIcon,
} from "@heroicons/react/16/solid"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useTheme } from "next-themes"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { AMPLITUDE_POR_SALTO, viajarLiquido } from "@/lib/liquid-move"

/**
 * As três paradas, na ordem do trilho (a do menu de tema do macOS, por decisão
 * do dono): o eixo do trilho não significa escuro→claro, então não há nada a
 * derivar da posição.
 * O par de ícones é misto (exceção nomeada no auditor, `HEROICON_SET_EXCEPTIONS`):
 * o Heroicons não tem `16/outline`, então a face apagada é o glifo de 24 desenhado
 * a 16, e o traço fino é o sinal que a cor sozinha não entrega no escuro.
 */
const PARADAS = [
    {
        valor: "system",
        rotulo: "Sistema",
        Solido: ComputerSolidIcon,
        Contorno: ComputerOutlineIcon,
    },
    {
        valor: "light",
        rotulo: "Claro",
        Solido: SunSolidIcon,
        Contorno: SunOutlineIcon,
    },
    {
        valor: "dark",
        rotulo: "Escuro",
        Solido: MoonSolidIcon,
        Contorno: MoonOutlineIcon,
    },
] as const

type Tema = (typeof PARADAS)[number]["valor"]

const indiceDe = (tema: string | undefined) => {
    const i = PARADAS.findIndex((p) => p.valor === tema)
    return i === -1 ? 0 : i
}

/**
 * Três degraus, na escada de controle: `sm` 28 (barras densas), `md` 32 (padrão,
 * o do menu da conta) e `lg` 36 (ao lado de um campo `lg`). Trilho = 4 de recuo
 * + 3 paradas, a parada é a altura menos 4 e a viagem é uma parada por índice. A
 * área de toque segue em 44 (o `::after` cresce o que falta).
 * Com `labels` a parada alarga (`LARGURA_COM_ROTULO`, igual nas três para a
 * viagem continuar uma conta). A geometria desce por estilo inline porque é
 * número calculado, e classe montada em runtime não chega ao CSS.
 */
const DEGRAU = {
    sm: { altura: 28, toque: "after:-inset-y-2" },
    md: { altura: 32, toque: "after:-inset-y-1.5" },
    lg: { altura: 36, toque: "after:-inset-y-1" },
} as const

/** A largura de uma parada com rótulo: "Sistema" no corpo do degrau, e folga. */
const LARGURA_COM_ROTULO = { sm: 76, md: 88, lg: 100 } as const

/**
 * A revelação circular: a troca de tema abre num círculo que parte da parada
 * tocada, pela View Transitions API (o navegador fotografa a página velha, a nova
 * vive por baixo e o que anima é o recorte do `::view-transition-new(root)`). O
 * `flushSync` faz o tema trocar dentro do callback, antes da foto nova. Sem a
 * API, sem a parada, com `reveal={false}` ou com movimento reduzido, troca como
 * sempre. O CSS que desliga o esmaecer padrão mora em `globals.css`, escopado por
 * `.theme-reveal` no `<html>` enquanto a transição dura.
 */
const REVELACAO = { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }

type DocumentoComTransicao = Document & {
    startViewTransition?: (cb: () => void) => {
        ready: Promise<void>
        finished: Promise<void>
    }
}

export function ThemeToggle({
    className,
    size = "md",
    labels = false,
    variant = "default",
    reveal = true,
}: {
    className?: string
    /** `sm` 28, `md` 32 (o padrão) ou `lg` 36. */
    size?: keyof typeof DEGRAU
    /** Ícone e texto em cada parada, para uma tela de preferências. */
    labels?: boolean
    /** `brand` é o brilho de arco-íris na borda do trilho. Uma por tela. */
    variant?: "default" | "brand"
    /** A troca abre num círculo a partir da parada tocada. */
    reveal?: boolean
}) {
    const degrau = DEGRAU[size]
    const face = degrau.altura - 4
    const passo = labels ? LARGURA_COM_ROTULO[size] : face
    const larguraTrilho = 4 + passo * PARADAS.length
    const { theme, setTheme } = useTheme()
    const [montado, setMontado] = useState(false)

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- client-only mounted gate for next-themes */
        setMontado(true)
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [])

    const indice = montado ? indiceDe(theme) : 0

    const raizRef = useRef<HTMLDivElement>(null)
    // `montado` entra na condição porque o hook liga o ponteiro num efeito, na
    // montagem: antes dela quem está na tela é o `Skeleton`, o ref é nulo e o brilho
    // nunca acenderia.
    const glowRef = useBrandGlow<HTMLDivElement>(variant === "brand" && montado)
    const cabecaRef = useRef<HTMLSpanElement>(null)
    const anterior = useRef(indice)
    const emCurso = useRef<Animation[]>([])
    const jaPintou = useRef(false)

    const trocar = (valor: Tema) => {
        const doc = document as DocumentoComTransicao
        const origem = raizRef.current?.querySelector<HTMLElement>(
            `[data-parada="${valor}"]`,
        )
        if (
            !reveal ||
            !origem ||
            !doc.startViewTransition ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            setTheme(valor)
            return
        }
        const r = origem.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        const raio = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y),
        )
        const html = document.documentElement
        html.classList.add("theme-reveal")
        const transicao = doc.startViewTransition(() => {
            flushSync(() => setTheme(valor))
        })
        transicao.ready
            .then(() => {
                html.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${raio}px at ${x}px ${y}px)`,
                        ],
                    },
                    { ...REVELACAO, pseudoElement: "::view-transition-new(root)" },
                )
            })
            .catch(() => {})
        transicao.finished.finally(() => html.classList.remove("theme-reveal"))
    }

    useLayoutEffect(() => {
        // Antes de montar não há tema conhecido: `indice` é 0 por convenção e o
        // componente nem está na tela (quem está é o `Skeleton`).
        if (!montado) return

        const de = anterior.current
        anterior.current = indice

        // A primeira pintura não anima: o gate de montagem faz `indice` sair de 0 para a
        // parada real, e sem esta guarda o polegar entraria deslizando da esquerda toda
        // vez que o componente nasce (todo abrir do menu da conta, cujo conteúdo
        // desmonta ao fechar). Nascer é chegar, não viajar.
        if (!jaPintou.current) {
            jaPintou.current = true
            return
        }

        if (de === indice) return

        // Um salto novo cancela o anterior: senão dois cliques seguidos deixam duas
        // animações disputando a mesma propriedade.
        for (const a of emCurso.current) a.cancel()
        emCurso.current = []

        // O bloco global de `globals.css` corta transição, e não WAAPI: a pergunta de
        // movimento reduzido é feita à mão. Sem movimento, o estilo de repouso já pôs
        // tudo no lugar.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        const peca = cabecaRef.current
        if (!peca) return

        const salto = Math.abs(indice - de)
        // O esticão é o mesmo em pixels, com rótulo ou sem: a amplitude é proporcional à
        // parada de ícone, e uma pílula de 88px esticaria 19px e leria como elástico.
        const amplitude = (AMPLITUDE_POR_SALTO[salto] ?? 0.22) * (face / passo)
        const paraDireita = indice > de

        // As duas origens (a borda de trás enquanto corre, a da frente no pouso) são do
        // `viajarLiquido`. O repouso fica com a de trás; com escala 1 não pinta nada, e
        // é a que vale no próximo salto antes de o quadro 0 assumir.
        peca.style.transformOrigin = paraDireita ? "0% 50%" : "100% 50%"

        // Sem tamanho nas caixas: a peça não muda de tamanho, e só a posição e
        // o esticão animam — o trajeto e o perfil de sempre (`TRAJETO`).
        emCurso.current = viajarLiquido(
            peca,
            { x: de * passo, y: 0 },
            { x: indice * passo, y: 0 },
            { amplitude },
        )
    }, [indice, montado, passo, face])

    if (!montado) {
        return (
            <Skeleton
                className={cn("shrink-0 rounded-full", className)}
                style={{ width: larguraTrilho, height: degrau.altura }}
            />
        )
    }

    return (
        <RadioGroupPrimitive.Root
            ref={composeRefs(raizRef, glowRef)}
            value={PARADAS[indice].valor}
            onValueChange={(v) => trocar(v as Tema)}
            orientation="horizontal"
            loop
            aria-label="Tema"
            data-slot="theme-toggle"
            data-size={size}
            data-variant={variant}
            data-visual={PARADAS[indice].valor}
            style={{ width: larguraTrilho, height: degrau.altura }}
            className={cn(
                // A bandeja é sobreposição, e não tinta chapada, e isto diverge do `TabsList` de
                // propósito: o `bg-muted` opaco pintava 38,38,38 no cabeçalho e dentro do painel
                // de um cartão, ignorando o que está atrás, e este controle mora em lugares
                // diferentes (barra do catálogo em vidro, `DropdownMenu`, `Popover` do telefone,
                // solto num cartão). A superfície é a do campo, `bg-input-fill/50` (a de
                // `field-classes`): no escuro `--input-fill` é branco a 15%, então a /50 dá 28
                // sobre a página e 40 sobre o cartão; no claro o token é opaco e a placa segue
                // se comportando como campo.
                "group/theme relative inline-flex shrink-0 items-center rounded-full bg-input-fill/50 p-0.5",
                // O alvo de toque real: o pseudo-elemento leva a pílula aos 44px sem mexer no layout.
                "after:absolute after:-inset-x-1 after:content-['']",
                degrau.toque,
                // O brilho mora no `::before`; o `::after` segue sendo o alvo.
                variant === "brand" && "brand-glow isolate [--brand-glow-opacity:1]",
                className,
            )}
            // Ele vive dentro de menus suspensos (conta e menu mobile): sem isto o pointer
            // down fecha o menu antes do clique chegar.
            onPointerDown={(e) => e.stopPropagation()}
            // A seleção segue o foco, escrito à mão de propósito. O Radix marca uma flag num
            // `keydown` de `document` e clica no `onFocus` do item se ela estiver de pé, mas
            // o React 19 delega os eventos no contêiner da raiz (abaixo de `document`): o
            // `onKeyDown` do item move o foco antes de o listener levantar a flag, e a seta
            // não troca o tema nem o Espaço pega. Ler o foco não depende de ordem de
            // entrega: entrar por Tab foca a marcada e não muda nada; clicar foca a já
            // escolhida; a seta foca a vizinha e a escolhe (o `radiogroup` da WAI-ARIA).
            onFocus={(e) => {
                const alvo = (e.target as HTMLElement).dataset?.parada
                if (alvo && alvo !== PARADAS[indice].valor) trocar(alvo as Tema)
            }}
        >
            {/*
               A peça, uma só (cabeça, rastro e pescoço leriam como duas bolas). Sem borda,
               por decisão do dono: o fio duro denunciaria a distorção quando a forma estica;
               quem segura a peça contra a bandeja é a sombra, a conta apertada do tema claro,
               onde `--background` e `--muted` estão a ΔRGB 15 (contra 28 no escuro).
            */}
            <span
                aria-hidden
                ref={cabecaRef}
                data-slot="theme-toggle-thumb"
                className="pointer-events-none absolute top-0.5 left-0.5 rounded-full bg-background shadow-sm"
                style={{ width: passo, height: face, translate: `${indice * passo}px` }}
            />
            {PARADAS.map((parada) => (
                <ThemeFace
                    key={parada.valor}
                    parada={parada}
                    ativo={PARADAS[indice].valor === parada.valor}
                    largura={passo}
                    altura={face}
                    rotulo={labels}
                    corpo={size === "lg" ? "text-sm" : "text-xs"}
                />
            ))}
        </RadioGroupPrimitive.Root>
    )
}

/**
 * Uma das três faces. Vem depois dos discos no DOM para pintar por cima deles
 * sem `z-index`. Os dois glifos ficam empilhados e trocam por opacidade (montar e
 * desmontar não tem o que esmaecer); esmaecem por transição de CSS, então o
 * `disableTransitionOnChange` do next-themes os troca de estalo no momento da
 * viagem, o certo aqui: a página inteira troca de cor no mesmo instante. O que se
 * desloca usa WAAPI para escapar do mesmo `!important`.
 */
function ThemeFace({
    parada,
    ativo,
    largura,
    altura,
    rotulo: comRotulo,
    corpo,
}: {
    parada: (typeof PARADAS)[number]
    ativo: boolean
    largura: number
    altura: number
    rotulo: boolean
    corpo: string
}) {
    const { Solido, Contorno, valor, rotulo } = parada

    return (
        <RadioGroupPrimitive.Item
            value={valor}
            // Com o texto à vista, o nome é o texto; sem ele, o rótulo.
            aria-label={comRotulo ? undefined : rotulo}
            data-slot="theme-toggle-face"
            // Lido pelo `onFocus` da raiz: é o valor desta parada, no elemento
            // que recebe o foco.
            data-parada={valor}
            className={cn(
                // `group/face` porque quem recebe o ponteiro é este botão e quem carrega a tinta
                // é o glifo de dentro: cada classe fica com um variante só (a armadilha das
                // variantes empilhadas).
                "group/face",
                // `z-10` não é enfeite: o `::after` que expande o alvo de toque da raiz é gerado
                // depois das faces e, sem `z-index`, pinta por cima delas e a face nunca recebe
                // `:hover`. O anel externo do `::after` segue capturando o que está fora da pílula.
                "relative z-10 flex items-center justify-center gap-1.5 rounded-full outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/45",
            )}
            style={{ width: largura, height: altura }}
        >
            <span
                className={cn(
                    "relative block size-4 scale-90 text-muted-foreground transition-[transform,color] duration-(--duration-slow) ease-(--ease-emphasized)",
                    // O realce é só tinta: a régua do `TabsTrigger` inativo (`hover:text-foreground`).
                    // No cursor a face acende o rótulo, sem pintar superfície nem deslocar objeto; o
                    // movimento fica para a troca de verdade.
                    "group-hover/face:text-foreground",
                    // `hover:` compila para `@media (hover: hover)` e não vale no telefone; sem o
                    // par, a regra H do projeto acusa e o toque ficaria sem resposta.
                    "group-active/face:text-foreground",
                    ativo && "scale-100 text-foreground",
                )}
            >
                <Contorno
                    aria-hidden
                    className={cn(
                        "absolute inset-0 size-4 transition-opacity duration-(--duration-slow) ease-(--ease-emphasized)",
                        ativo && "opacity-0",
                    )}
                />
                <Solido
                    aria-hidden
                    className={cn(
                        "absolute inset-0 size-4 opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-emphasized)",
                        ativo && "opacity-100",
                    )}
                />
            </span>
            {comRotulo ? (
                <span
                    className={cn(
                        "font-medium text-muted-foreground transition-colors duration-(--duration-slow) ease-(--ease-emphasized) group-hover/face:text-foreground group-active/face:text-foreground",
                        corpo,
                        ativo && "text-foreground",
                    )}
                >
                    {rotulo}
                </span>
            ) : null}
        </RadioGroupPrimitive.Item>
    )
}
