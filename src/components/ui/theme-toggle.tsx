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
import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * As três paradas, na ordem do trilho. A ordem é decisão do dono — a do menu de
 * tema do macOS —, e a consequência fica dita: **o eixo do trilho não significa
 * escuro→claro**, então não há nada a derivar da posição. Quem quiser um eixo
 * com sentido reordena aqui e em mais lugar nenhum.
 *
 * O par de ícones é **misto**, e isso é exceção nomeada no auditor
 * (`HEROICON_SET_EXCEPTIONS`): o Heroicons não tem `16/outline`, então a face
 * apagada é o glifo de 24 desenhado a 16. O traço fino trabalha a favor dela —
 * contorno é o estado apagado —, e o peso do traço é o sinal que a cor sozinha
 * não entrega num glifo de 16px no tema escuro.
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
 * O relógio da viagem, e **por que ela é uma peça só**.
 *
 * ## Três nós nunca iam ler como um
 *
 * A primeira versão tinha cabeça, rastro e pescoço: dois discos iguais viajando
 * em relógios diferentes com uma barra entre eles, fundidos por serem do mesmo
 * `--background`. Na tela isso lê como **duas bolas transitando**, e não como
 * matéria — a fusão por cor apaga a costura, mas não faz uma forma só.
 *
 * A saída é a do switcher de vidro do 21st (Dennys Dionigi), lido do bundle do
 * preview: **uma pílula**, e o orgânico vem de três coisas, não de três nós.
 *
 * 1. **Um trajeto com inércia.** `cubic-bezier(1, 0, 0.4, 1)` quase não sai do
 *    lugar no começo, dispara no meio e pousa macio. É o que dá peso à forma.
 * 2. **Um esticão com pico no meio do caminho**, em `scale`, voltando a 1 na
 *    chegada — squash-and-stretch clássico.
 * 3. **A origem presa na borda de trás do movimento.** Com `transform-origin`
 *    atrás e `scaleX > 1`, a forma **estica para a frente**, na direção da
 *    viagem. É para isto, e só para isto, que a referência mantém um
 *    `data-previous` no trilho — aqui já temos o `anterior`.
 *
 * ## O que a leitura do bundle desmentiu
 *
 * A referência declara dois filtros SVG (`feImage` + `feDisplacementMap`), e é
 * tentador copiar a refração. **Ela não está ligada**: `filter` e
 * `backdrop-filter` computam `none` nos elementos. O que faz o "líquido" ali é
 * a aresta mais o esticão.
 *
 * E o esticão dela **não** depende da distância — o pico sai do destino (1,1 nas
 * pontas, 1,2 no meio). Aqui ele sai de quanto se andou, que é a régua desta
 * casa: um salto de duas paradas estica mais que um de uma.
 *
 * ## Continua em WAAPI
 *
 * O next-themes roda com `disableTransitionOnChange`, que injeta
 * `* { transition: none !important }` enquanto troca a classe do tema. Uma
 * transição de CSS morre ali; a WAAPI não é uma transição e escapa. A posição de
 * repouso é o `translate` inline, e a animação (com `fill: "none"`) só cobre o trajeto.
 */
/**
 * **Três degraus, na escada de controle**: `sm` 28 (rodada 181, para barras
 * densas), `md` 32 — o padrão, o do menu da conta — e `lg` 36, para ficar ao
 * lado de um campo `lg`. A aritmética é a mesma nos três: trilho = 4 de recuo
 * + 3 paradas, a parada é a altura menos 4, e a viagem é uma parada por
 * índice. A área de toque continua em 44 (o `::after` cresce o que falta).
 *
 * **Com `labels` a parada alarga** (rodada 181): ícone e texto não cabem num
 * círculo, e a parada passa a ter a largura de `LARGURA_COM_ROTULO`, igual nas
 * três para a viagem continuar sendo uma conta. A geometria desce por estilo
 * inline, e não por classe, porque ela é número calculado — e classe montada
 * em tempo de execução não chega ao CSS.
 */
const DEGRAU = {
    sm: { altura: 28, toque: "after:-inset-y-2" },
    md: { altura: 32, toque: "after:-inset-y-1.5" },
    lg: { altura: 36, toque: "after:-inset-y-1" },
} as const

/** A largura de uma parada com rótulo: "Sistema" no corpo do degrau, e folga. */
const LARGURA_COM_ROTULO = { sm: 76, md: 88, lg: 100 } as const

/** O trajeto. A curva da referência: quase parada, dispara, pousa macio. */
const TRAJETO = { duration: 400, easing: "cubic-bezier(1,0,0.4,1)" }

/**
 * **O esticão anda no mesmo relógio do trajeto, e em fase com a velocidade.**
 *
 * A referência põe o pico no meio do *seu* relógio (0,44s contra 0,40s de
 * viagem), e com esta curva isso sai **anticorrelacionado**: medido, aos 30% do
 * caminho a escala está em 1,33 com a velocidade a **6%** do máximo, e aos 70%,
 * com 68% da velocidade, a escala já caiu para 1,04. Na tela a forma **estica
 * parada** e depois atravessa contraída — o contrário do que matéria faz.
 *
 * A velocidade desta curva pica em **0,667**. O pico do esticão fica em 0,58:
 * perto o bastante para acompanhar a corrida, cedo o bastante para o auge não
 * cair em cima da borda do trilho.
 *
 * O perfil é uma meia-senoide de cada lado do pico, e não um triângulo: um
 * vértice reto no auge lê como um repuxão.
 */
const ESTICAO = { duration: 640, easing: "linear" }
const PICO_EM = 0.58

const ATRAS = "atras" as const
const FRENTE = "frente" as const
type Lado = typeof ATRAS | typeof FRENTE

/** Onde o trajeto acaba, na régua da escala. Também é onde `k` cruza zero. */
const VIRADA = TRAJETO.duration / ESTICAO.duration

/**
 * **O relógio da escala passa do trajeto de propósito**: 640 contra 400. Os 400
 * primeiros são o esticão em fase com a corrida; os 240 que sobram são o
 * **pouso**. As frações do esticão são as do trajeto multiplicadas por
 * `VIRADA`, então o auge continua caindo em 0,58 **do trajeto**, que é onde ele
 * tem de cair.
 *
 * `k` vale 0 em repouso, 1 no auge do esticão, e **negativo** no pouso, quando
 * a forma encolhe. A amplitude multiplica tudo, então um salto curto balança
 * menos sem precisar de tabela própria.
 *
 * **O pouso é um mergulho só, e não um quique.** A primeira versão oscilava
 * três vezes em 160ms (+0,5 · −0,28 · +0,12) e ficava estalada — o dono pediu
 * mais suave. Hoje é **uma** compressão que vai e volta em 240ms: a forma bate
 * na parada, o corpo compacta atrás e relaxa. Uma travessia por zero, nenhum
 * repique.
 */
const PERFIL: [number, number, Lado][] = [
    [0, 0, ATRAS],
    [0.15 * VIRADA, 0.395, ATRAS],
    [0.3 * VIRADA, 0.726, ATRAS],
    [0.45 * VIRADA, 0.939, ATRAS],
    [PICO_EM * VIRADA, 1, ATRAS],
    [0.7 * VIRADA, 0.901, ATRAS],
    [0.82 * VIRADA, 0.624, ATRAS],
    [0.92 * VIRADA, 0.294, ATRAS],
    [VIRADA, 0, ATRAS],
    // **A origem vira aqui, e a troca é invisível por construção**: neste
    // instante `k` é 0, a escala é 1, e uma transformação identidade não tem
    // origem que importe. Os dois quadros a 0,0001 de distância fazem disso um
    // degrau em vez de uma varredura — a origem deslizando com a escala fora de
    // 1 seria bem visível.
    [VIRADA + 0.0001, 0, FRENTE],
    // O mergulho do pouso, ancorado na borda **da frente**: a forma bate na
    // parada e compacta **para trás**, para dentro do trilho.
    [0.7, -0.16, FRENTE],
    [0.78, -0.22, FRENTE],
    [0.86, -0.17, FRENTE],
    [0.93, -0.08, FRENTE],
    [1, 0, FRENTE],
]

/**
 * **O volume se conserva**, e é isso que faz a forma ler como matéria em vez de
 * uma pílula que engorda: esticando em X, ela **afina em Y**.
 *
 * O acoplamento não é o `1/√x` da física — a 1,22 ele daria 0,905, e numa peça
 * de 28px tirar 3px de altura é mais do que o olho aceita num controle. 0,45 do
 * esticão dá 0,90 no auge, que é o quanto se lê sem a peça parecer amassada.
 */
const ACOPLAMENTO_Y = 0.45

/**
 * A amplitude, **proporcional à velocidade**: as duas viagens duram o mesmo, e
 * a de duas paradas percorre o dobro do caminho — então ela corre ao dobro e
 * estica o dobro.
 *
 * O teto é a borda do trilho, e é conta fechada em **dois** pontos, não um: o
 * auge do esticão — que acontece no meio do caminho, onde sobra espaço — e o
 * **contragolpe do pouso**, que acontece com a forma já na parada final e por
 * isso é o apertado. Com 0,22 a borda dianteira chega a **87,7** dos 88px no
 * contragolpe. Quem subir isto põe a peça para fora da pílula — e ninguém vai
 * reclamar em teste, só na tela.
 */
const AMPLITUDE_POR_SALTO = [0, 0.11, 0.22]

/** `useLayoutEffect` no cliente, `useEffect` no servidor — o componente é
 *  renderizado no servidor (devolve o `Skeleton`), e o de layout avisa ali. */
const useEfeitoDeLayout =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * **A revelação circular** (rodada 181): a troca de tema abre num círculo que
 * parte da parada tocada e cobre a tela, pela View Transitions API. O navegador
 * fotografa a página velha, a nova vive por baixo, e o que anima é o recorte
 * do `::view-transition-new(root)` — o polegar continua viajando dentro dele.
 * O `flushSync` é o que faz o tema trocar **dentro** do callback, antes da
 * foto nova. Sem a API, sem a parada, com `reveal={false}` ou com movimento
 * reduzido, troca como sempre. A curva é a do brilho, que sai rápido e pousa
 * longo; o CSS que desliga o esmaecer padrão mora em `globals.css`, escopado
 * por `.theme-reveal` no `<html>` enquanto a transição dura.
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
    // `montado` entra na condição porque o hook liga o ponteiro num efeito,
    // na montagem: antes dela quem está na tela é o `Skeleton`, o ref é nulo e
    // o brilho nunca acendia. Medido — sem isso, zero arco com o ponteiro colado.
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

    useEfeitoDeLayout(() => {
        // Antes de montar não há tema conhecido: `indice` é 0 por convenção e o
        // componente nem está na tela (quem está é o `Skeleton`).
        if (!montado) return

        const de = anterior.current
        anterior.current = indice

        // **A primeira pintura não anima.** O gate de montagem faz `indice` sair
        // de 0 para a parada real, e sem esta guarda o polegar entra deslizando
        // da esquerda toda vez que o componente nasce — o que no app é **toda
        // abertura do menu da conta**, já que o conteúdo de um `DropdownMenu`
        // desmonta ao fechar. Nascer é chegar, não viajar.
        if (!jaPintou.current) {
            jaPintou.current = true
            return
        }

        if (de === indice) return

        // Um salto novo cancela o anterior: sem isto, dois cliques seguidos
        // deixam duas animações disputando a mesma propriedade.
        for (const a of emCurso.current) a.cancel()
        emCurso.current = []

        // O bloco global de `globals.css` corta transição, e não WAAPI — aqui a
        // pergunta tem de ser feita à mão. Sem movimento, o estilo de repouso
        // já pôs tudo no lugar certo: não há nada a fazer.
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        const peca = cabecaRef.current
        if (!peca) return

        const salto = Math.abs(indice - de)
        // **O esticão é o mesmo em pixels**, com rótulo ou sem: a amplitude é
        // proporcional à parada de ícone, e uma parada larga estica a mesma
        // distância em proporção menor. Sem isso a pílula de 88px esticava 19px
        // e lia como elástico, não como matéria.
        const amplitude = (AMPLITUDE_POR_SALTO[salto] ?? 0.22) * (face / passo)
        const paraDireita = indice > de

        // **As duas origens.** Enquanto corre, a forma estica a partir da borda
        // de **trás**, ou seja, para a frente — é a direção da viagem. Ao
        // chegar, ela passa a se acomodar a partir da borda da **frente**, para
        // dentro do trilho: bateu na parada, o resto do corpo empilha atrás.
        // Presa num valor fixo, a forma esticaria para trás em metade dos
        // saltos, e nada quebraria — o movimento só ficaria errado.
        const origem: Record<Lado, string> = {
            [ATRAS]: paraDireita ? "0% 50%" : "100% 50%",
            [FRENTE]: paraDireita ? "100% 50%" : "0% 50%",
        }
        // O repouso fica com a de trás; com escala 1 ela não pinta nada, e é a
        // que vale no próximo salto antes de o quadro 0 assumir.
        peca.style.transformOrigin = origem[ATRAS]

        const animacoes = [
            peca.animate(
                [
                    { translate: `${de * passo}px` },
                    { translate: `${indice * passo}px` },
                ],
                { ...TRAJETO, fill: "none" },
            ),
            // O esticão é a segunda animação na **mesma** peça, noutra
            // propriedade: em CSS `translate` e `scale` são independentes, então
            // as duas convivem no mesmo relógio sem uma pisar na outra. O
            // `linear` do efeito é o que faz cada `offset` do perfil valer
            // exatamente a fração do tempo que ele diz.
            peca.animate(
                PERFIL.map(([offset, k, lado]) => ({
                    offset,
                    transformOrigin: origem[lado],
                    scale: `${(1 + amplitude * k).toFixed(4)} ${(
                        1 -
                        amplitude * k * ACOPLAMENTO_Y
                    ).toFixed(4)}`,
                })),
                { ...ESTICAO, fill: "none" },
            ),
        ]

        emCurso.current = animacoes.filter((a): a is Animation => Boolean(a))
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
                // **A bandeja é sobreposição, e não tinta chapada — e isto diverge do
                // `TabsList` de propósito.**
                //
                // `bg-muted` é opaco: medido, ele pintava **38,38,38** tanto no
                // cabeçalho quanto dentro do painel de um cartão, ignorando o que
                // está atrás. Um trilho de abas vive dentro de uma tela conhecida;
                // este controle não — ele mora na barra do catálogo (vidro sobre a
                // página), no painel do `DropdownMenu`, no `Popover` do telefone e
                // solto num cartão. Chapado, ele lê como um bloco estrangeiro
                // colado sobre o preto do app.
                //
                // A superfície passa a ser a do campo, `bg-input-fill/50` — a mesma
                // de `field-classes`, e por isso a placa lê como o fundo de um
                // `Input`. No escuro `--input-fill` é branco a 15%, então a /50 são
                // 7,5% de sobreposição: **28** sobre a página e **40** sobre o
                // cartão, contra os 38 fixos de antes. No claro o token é opaco por
                // construção, e a placa continua se comportando como campo.
                "group/theme relative inline-flex shrink-0 items-center rounded-full bg-input-fill/50 p-0.5",
                // O alvo de toque real: o pseudo-elemento leva a pílula aos 44px
                // que um dedo pede sem mexer no layout de quem a posiciona.
                "after:absolute after:-inset-x-1 after:content-['']",
                degrau.toque,
                // O brilho mora no `::before`; o `::after` segue sendo o alvo.
                variant === "brand" && "brand-glow isolate [--brand-glow-opacity:1]",
                className,
            )}
            // Ele vive dentro de menus suspensos (conta e menu mobile): sem isto,
            // o pointer down fecha o menu antes do clique chegar.
            onPointerDown={(e) => e.stopPropagation()}
            // **A seleção segue o foco, e isso é escrito à mão de propósito.**
            //
            // O Radix já tenta fazer isso: ele marca uma flag num `keydown` de
            // `document` e, no `onFocus` do item, clica se a flag estiver de pé.
            // Só que o React 19 delega os eventos no **contêiner da raiz**, que
            // fica abaixo de `document` — então o `onKeyDown` do item move o
            // foco *antes* de o listener de `document` levantar a flag, e o
            // `onFocus` a lê como falsa. Medido aqui: a seta movia o foco e
            // **não** trocava o tema, e o Espaço também não pegava. Com o
            // teclado, o controle ficava inerte.
            //
            // Ler o foco é a fonte de verdade que não depende de ordem de
            // entrega: entrar por Tab foca a parada marcada e não muda nada;
            // clicar foca a que já foi escolhida; a seta foca a vizinha e a
            // escolhe — que é o comportamento de `radiogroup` da WAI-ARIA.
            onFocus={(e) => {
                const alvo = (e.target as HTMLElement).dataset?.parada
                if (alvo && alvo !== PARADAS[indice].valor) trocar(alvo as Tema)
            }}
        >
            {/*
             * A peça. **Uma só** — ver o cabeçalho: cabeça, rastro e pescoço
             * liam como duas bolas viajando, e não como matéria.
             *
             * Sem borda, por decisão do dono: o fio duro é o que denuncia a
             * distorção quando a forma estica, porque o contorno deixa de ser
             * circular e o olho vê a elipse. Sem ele, quem segura a peça contra
             * a bandeja é a sombra — e essa é a conta apertada do tema claro,
             * onde `--background` e `--muted` estão a ΔRGB 15 (contra 28 no
             * escuro).
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
 * Uma das três faces. Vem depois dos discos no DOM de propósito: assim ela pinta
 * por cima deles sem precisar de `z-index` entre irmãos, e o glifo que está
 * valendo aparece *sobre* a pastilha em vez de sumir debaixo dela.
 *
 * Os dois glifos ficam empilhados e trocam por opacidade, e não por condicional
 * no JSX: desmontar e montar não tem o que esmaecer. **Estes dois esmaecem por
 * transição de CSS**, então o `disableTransitionOnChange` do next-themes os
 * pega e eles trocam de estalo no momento da viagem — o que é o certo aqui: a
 * página inteira troca de cor no mesmo instante, e um glifo dissolvendo sozinho
 * ficaria fora de compasso. Quem tem de animar é o que se **desloca**, e esse
 * usa WAAPI justamente para escapar do mesmo `!important`.
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
                // `group/face` porque quem recebe o ponteiro é este botão e quem
                // carrega a tinta é o glifo lá dentro. Assim cada classe fica
                // com **um variante só** — a armadilha das variantes empilhadas
                // que este arquivo já documentou.
                "group/face",
                // `z-10` não é enfeite: o `::after` que expande o alvo de toque
                // da raiz é gerado **depois** das faces e, sem `z-index`, pinta
                // por cima delas — ele engolia o ponteiro, e a face nunca
                // recebia `:hover`. Subindo a face, o anel externo do `::after`
                // continua capturando o que está fora da pílula.
                "relative z-10 flex items-center justify-center gap-1.5 rounded-full outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/45",
            )}
            style={{ width: largura, height: altura }}
        >
            <span
                className={cn(
                    "relative block size-4 scale-90 text-muted-foreground transition-[transform,color] duration-(--duration-slow) ease-(--ease-emphasized)",
                    // **O realce é tinta, e só.** É a régua do `TabsTrigger`
                    // inativo (`hover:text-foreground`): no cursor a face acende
                    // o rótulo, sem pintar superfície e sem deslocar objeto — o
                    // movimento fica reservado para a troca de verdade.
                    "group-hover/face:text-foreground",
                    // `hover:` compila para `@media (hover: hover)` e não vale no
                    // telefone. Sem o par, a regra H do projeto acusa — e o toque
                    // ficaria sem resposta nenhuma antes do dedo sair.
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
