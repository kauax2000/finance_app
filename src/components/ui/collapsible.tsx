"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  disclosureMarkerClassName,
  disclosureMotionClassName,
} from "@/lib/disclosure-classes"

/**
 * Um bloco que expande — o `Accordion` de um item só, sem a semântica de lista.
 *
 * ## Ele não desenhava nada, e por isso cada tela desenhava um pouco diferente
 *
 * Este arquivo eram três passa-tudo e um `overflow-hidden`. O componente não
 * trazia linha, nem marcador, nem rotação — então os **dois de dois**
 * consumidores reais montaram a linha por conta própria, e montaram diferente:
 * `credit-card-form-fields` gira um `ChevronDown` em 180 num corpo `size-3.5`;
 * a gaveta de código do próprio catálogo gira um `ChevronRight` em 90 no corpo
 * padrão. É o invariante 1 acontecendo dentro do design system.
 *
 * `CollapsibleMarker` é o conserto, e ele não tem opinião nenhuma além da que já
 * está em [`lib/disclosure-classes`](../../lib/disclosure-classes.ts) — a mesma
 * régua que o `Accordion` veste. Um marcador para a casa toda.
 *
 * ## `peek`: o fechado que não é altura zero
 *
 * A segunda forma deste componente é o **"mostrar mais"** — a descrição longa, a
 * lista que continua, o texto legal. Ali o fechado não é ausência: é uma
 * espiada, e o que diz "tem mais" é o conteúdo **dissolvendo** na base, que é a
 * primitiva que este projeto já elegeu no lugar de um véu pintado (máscara é
 * alfa, e alfa não precisa saber de que cor é o fundo).
 *
 * Ele custa três coisas, e as três são armadilhas conhecidas desta casa:
 *
 * 1. **`forceMount`, e o `hidden` que vem com ele.** Sem `forceMount` o Radix
 *    desmonta o conteúdo fechado, e não há o que espiar. Com ele o nó fica, mas
 *    o Radix ainda escreve o atributo `hidden` — que é `display: none` na folha
 *    do agente. Qualquer declaração de autor vence essa, e é o que
 *    `data-closed:block` faz. **O que importa é que o texto continue na árvore
 *    de acessibilidade**, e ele continua porque os navegadores computam
 *    exposição a partir do que é renderizado, não do atributo. Medido, não
 *    suposto.
 * 2. **Os keyframes saem de cena, e a medida do Radix também.** `collapsible-down/up`
 *    animam de 0 até a variável do Radix, e em `peek` o trajeto não parte de
 *    zero. E a variável não serve de destino: o Radix a calcula lendo a caixa da
 *    própria `Content`, que em `peek` é o nó **preso** à espiada — ele publicava
 *    a espiada como "altura do conteúdo". Ver `useAlturaCheia`, abaixo. A
 *    espiada abre de uma vez, de propósito e por limite medido; a nota antes de
 *    `COLLAPSIBLE_PEEK_SHELL` conta os quatro consertos que falharam.
 * 3. **`_-_` em todo `-` binário dentro de `calc()` arbitrário.** O Tailwind
 *    normaliza espaço em torno de `+`, `*` e `/`, mas não pode com `-`, que
 *    seria indistinguível de `--var`. Escrito com espaço literal, a classe é
 *    cortada no meio e a máscara cai para `none` — em silêncio.
 *
 * ## A altura anima nos dois sentidos
 *
 * Isso já era verdade e continua: os keyframes vêm do `tw-animate-css` que o
 * projeto instala, ligados a `--radix-collapsible-content-height`, e sem
 * `overflow-hidden` o conteúdo vaza durante o trajeto. O que mudou é que a
 * duração e a curva agora saem da régua compartilhada, e não deste arquivo — o
 * `Accordion` rodava no padrão de fábrica enquanto este pedia os tokens do
 * projeto, dois componentes com a mesma interação abrindo em curvas diferentes.
 */

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/**
 * O gatilho continua sendo o primitivo cru, de propósito.
 *
 * Ele é quase sempre usado com `asChild` em volta de um `Button`, e com
 * `asChild` o Radix **funde** a `className` no filho: carimbar cromagem aqui
 * vazaria para dentro de todo botão que já existe. Quem quer a linha inteira
 * desenhada usa o `Accordion` — que é este componente com semântica de lista.
 *
 * O `group/disclosure` é a única coisa que ele ganha, e é o que faz o
 * `CollapsibleMarker` girar sem que o consumidor escreva o seletor. Com
 * `asChild` ele desce para o filho junto com o resto da `className`.
 */
function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn("group/disclosure", className)}
      {...props}
    />
  )
}

/**
 * O marcador. Gira porque o gatilho é `group/disclosure` e o Radix escreve
 * `data-state` nele — nada a declarar do lado de quem chama.
 */
function CollapsibleMarker({
  className,
  ...props
}: React.ComponentProps<typeof ChevronDownIcon>) {
  return (
    <ChevronDownIcon
      data-slot="collapsible-marker"
      aria-hidden
      className={cn(disclosureMarkerClassName, className)}
      {...props}
    />
  )
}

/**
 * A espiada, em três degraus.
 *
 * Os números são alturas de leitura, e não da escada de controles: `sm` são
 * ~3 linhas de `text-sm`, `md` ~5, `lg` ~7. Abaixo de três linhas a espiada não
 * informa nada que o rótulo do gatilho já não informe.
 *
 * A rampa da dissolução vale `min(2.5rem, 40%)` — os 40px da mesma ordem de
 * grandeza dos 44 que a paleta de comandos usa, com teto proporcional para o
 * degrau curto. Ela come **a última linha e meia** em `md` e `lg`, e pouco mais
 * de uma em `sm`.
 */
const collapsibleContentVariants = cva(disclosureMotionClassName, {
  variants: {
    peek: {
      none: "data-open:animate-collapsible-down data-closed:animate-collapsible-up",
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: { peek: "none" },
})

/**
 * A variável do degrau mora **na casca**, e não no `cva` do conteúdo.
 *
 * A casca não pode vestir `collapsibleContentVariants`: a base dele é
 * `disclosureMotionClassName`, que traz `duration-` e `ease-` sem
 * `transition-property` — e o valor inicial dessa propriedade é `all`. A casca
 * ficava transicionando **tudo** em 200ms, medido. Movimento é do conteúdo; da
 * casca é só a geometria.
 */
const COLLAPSIBLE_PEEK_VAR = {
  none: "",
  sm: "[--collapsible-peek:3.75rem]",
  md: "[--collapsible-peek:6.25rem]",
  lg: "[--collapsible-peek:8.75rem]",
} as const

/**
 * **Quem mede não pode ser quem é medido** — e isto foi um defeito de verdade,
 * encontrado no navegador.
 *
 * O Radix descobre a altura do conteúdo lendo a caixa da própria `Content` num
 * efeito de layout, e publica o resultado em
 * `--radix-collapsible-content-height`. Com `peek`, a `Content` é justamente o
 * nó que está **preso** à altura da espiada — então o Radix media a espiada e
 * publicava 100px como "altura do conteúdo". Abrir levava de 100 a 100, e o
 * texto ficava recortado. Medido: `--radix-collapsible-content-height: 100px`
 * contra um `scrollHeight` de 206.
 *
 * É a mesma família do defeito que o `Accordion` tinha, com a mesma forma: um
 * elemento declarando como altura uma medida que ele próprio produz.
 *
 * A saída é a que o resto da casa já usa quando precisa de uma caixa em CSS —
 * `useScrollFade` e o marcador do `Tabs` fazem igual: **um observador escreve a
 * medida numa variável**. Aqui quem é observado é um envelope interno, livre de
 * altura, e quem lê a variável é a casca presa. Em modo `peek` a variável do
 * Radix não é consultada, e é por isso que ela continuar errada não importa.
 */
function useAlturaCheia() {
  return React.useCallback((envelope: HTMLElement | null) => {
    if (!envelope) return
    // Dois níveis: o pai é a `Content` do Radix, e quem lê `--collapsible-full`
    // é o envelope externo, que é o avô. Escrever no avô é o que faz a variável
    // chegar aos dois por herança.
    const casca = envelope.parentElement?.parentElement
    if (!casca) return

    let anterior = -1
    const medir = () => {
      // `scrollHeight` do envelope, e não da casca: a casca está presa e
      // recortando, então a altura dela é a da espiada, por definição.
      const altura = Math.round(envelope.scrollHeight)
      if (altura === anterior) return
      anterior = altura
      casca.style.setProperty("--collapsible-full", `${altura}px`)
    }
    medir()

    const ro = new ResizeObserver(medir)
    ro.observe(envelope)
    // Os filhos também: um parágrafo que reflui muda a altura do envelope sem
    // que a caixa **dele** mude em nenhum eixo que o observador da casca veja.
    for (const filho of Array.from(envelope.children)) ro.observe(filho)

    return () => ro.disconnect()
  }, [])
}

/**
 * **A espiada abre de uma vez, e isso é um limite conhecido — não um esquecimento.**
 *
 * A altura da espiada não anima, e a causa é a segunda metade do mesmo defeito
 * do `useAlturaCheia`: o Radix envolve a troca de estado num par "carimba
 * `transition-duration: 0s`, força um `getBoundingClientRect()`, devolve o
 * valor", e o recálculo forçado acontece **na mesma passagem** em que o
 * `data-state` vira `open`. A altura nova é resolvida ali, e o navegador nunca
 * vê os dois valores em recálculos diferentes: não há transição para começar.
 *
 * Medido, com a altura amostrada a 16, 40, 80, 140 e 260ms depois do clique:
 * 100px e depois 206px, sem nenhum valor no meio.
 *
 * **Quatro consertos foram tentados, e é isso que torna esta nota útil:**
 *
 * 1. `!important` na duração. Vence o estilo inline — verificado, o
 *    `transition-duration` computado voltou a 0,2s — e o salto continuou. O
 *    problema não é o valor da duração, é o instante em que a altura muda.
 * 2. Mover a altura para um envelope **externo**, que o Radix não manipula,
 *    lendo o estado com `has-data-[state=open]`. O recálculo forçado é do
 *    documento inteiro, e alcança o envelope igual.
 * 3. O `data-medido` do `Command`. Resolve outro problema — suprimir a transição
 *    na **primeira** pintura, antes de haver medida —, não a disputa com um
 *    recálculo síncrono.
 * 4. Animar por Web Animations API a partir de um `MutationObserver` no
 *    `data-state`. Chega a funcionar na abertura (medido: 100 → 146 → 181 → 200
 *    → 206, que é a curva de `--ease-out`), mas não no fechamento: a caixa lida
 *    dentro do callback é assimétrica entre os dois sentidos. Derivar as duas
 *    pontas dos valores declarados em vez de medir a caixa quebrou também a
 *    abertura. Um trajeto que só existe num sentido é pior que nenhum.
 *
 * O que **sai** disto sem trabalho nenhum: `peek` é uma revelação instantânea, e
 * é honesta — não há classe de transição aqui prometendo o que não acontece. A
 * dissolução na base continua sendo o que diz "tem mais", e ela não depende de
 * movimento. Fechar isso de verdade provavelmente passa por não usar a
 * `Collapsible.Content` do Radix em modo `peek` — sob `forceMount` ela não
 * contribui com nada que este componente use, exceto o `id` que o
 * `aria-controls` do gatilho aponta, que é justamente o que impede simplesmente
 * apagá-la.
 */
const COLLAPSIBLE_PEEK_SHELL = [
  "overflow-hidden",
  "h-(--collapsible-peek) has-data-[state=open]:h-(--collapsible-full)",

  // A rampa, **proporcional com teto**. Fixa em 40px ela comia dois terços do
  // degrau `sm`: 40 de rampa num peek de 60 deixa uma linha nítida e duas
  // dissolvendo, e a amostra passa a esconder mais do que mostra.
  // `min(2.5rem, 40%)` dá 24px em `sm` e os 40 cheios em `md` e `lg`.
  //
  // `_-_` obrigatório no `-` binário: com espaço literal a classe é cortada no
  // meio, a rampa vira inválida em cascata e a máscara cai para `none`.
  "[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_min(2.5rem,40%)),transparent)]",
  "has-data-[state=open]:[mask-image:none]",
].join(" ")

function CollapsibleContent({
  className,
  peek = "none",
  forceMount,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content> &
  VariantProps<typeof collapsibleContentVariants>) {
  const espiando = peek !== "none" && peek != null
  const medirEnvelope = useAlturaCheia()

  const conteudo = (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      data-peek={espiando ? peek : undefined}
      // `forceMount` é consequência de `peek`, não uma segunda decisão de quem
      // chama: sem ele o nó fechado não existe, e não há o que espiar. Quem
      // passar o seu continua ganhando.
      //
      // Sob `forceMount` o Radix calcula `isOpen = open || isPresent` com
      // `isPresent` sempre verdadeiro — então ele **nunca** escreve `hidden` e
      // sempre renderiza os filhos. Verificado no DOM: é por isso que não há
      // nada aqui vencendo um `display: none`.
      forceMount={espiando ? true : forceMount}
      className={cn(
        collapsibleContentVariants({ peek }),
        espiando && "h-full",
        className
      )}
      {...props}
    >
      {espiando ? (
        <div ref={medirEnvelope} data-slot="collapsible-peek-body">
          {children}
        </div>
      ) : (
        children
      )}
    </CollapsiblePrimitive.Content>
  )

  if (!espiando) return conteudo

  return (
    <div
      data-slot="collapsible-peek-shell"
      className={cn(COLLAPSIBLE_PEEK_VAR[peek], COLLAPSIBLE_PEEK_SHELL)}
    >
      {conteudo}
    </div>
  )
}

export {
  collapsibleContentVariants,
  Collapsible,
  CollapsibleContent,
  CollapsibleMarker,
  CollapsibleTrigger,
}
