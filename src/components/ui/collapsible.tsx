"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { animate, type AnimationPlaybackControls } from "motion/react"

import { cn } from "@/lib/utils"
import {
  disclosureMarkerClassName,
  disclosureMotionClassName,
  disclosureRevealClassName,
} from "@/lib/disclosure-classes"
import { MOLA } from "@/lib/spring"

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
 *    a espiada como "altura do conteúdo". Ver `useEspiada`, abaixo, que também
 *    é quem faz a espiada deslizar: a altura da casca é escrita por JS.
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
 * **Quem mede não pode ser quem é medido**, e isto foi um defeito de verdade,
 * encontrado no navegador.
 *
 * O Radix descobre a altura do conteúdo lendo a caixa da própria `Content`, e
 * com `peek` a `Content` é o nó **preso** à espiada: ele publicava a espiada
 * (100px) como "altura do conteúdo", contra um `scrollHeight` de 206. Quem é
 * medido aqui é um envelope interno, livre de altura.
 *
 * ## E a espiada desliza, porque a altura da casca é escrita por JS
 *
 * Por cinco rodadas a espiada abriu de uma vez. A altura morava no CSS
 * (`has-[…open]:h-(--collapsible-full)`), e o Radix envolve a troca de estado
 * num recálculo forçado com `transition-duration: 0s`: a altura nova era
 * resolvida **na mesma passagem** em que o `data-state` virava `open`, e não
 * havia transição para começar. Quatro consertos de CSS e de WAAPI falharam, e
 * o que falhava em todos era a mesma coisa: a caixa mudava **dentro** do
 * recálculo do Radix, antes de alguém poder lê-la.
 *
 * Com a altura como estilo inline escrito aqui, o recálculo não a alcança: um
 * `data-state` novo não muda estilo inline. Um `MutationObserver` no
 * `data-state` lê a altura atual da casca (ainda a de antes) e anima até o
 * destino com o `animate` do `motion`. Abrir é a mola da casa (`MOLA`), e
 * fechar é o `--ease-out` em `--duration-base` (a regra da rodada 129: uma
 * mola até a espiada passaria por baixo dela). Ao fim da abertura a altura
 * volta a `auto`, para um parágrafo que reflua não ser recortado.
 *
 * A mola é de JavaScript, e o bloco global de `prefers-reduced-motion` só
 * alcança CSS. Por isso a preferência é perguntada à mão, como no `Alert`.
 */
function useEspiada() {
  return React.useCallback((envelope: HTMLElement | null) => {
    if (!envelope) return
    const conteudo = envelope.parentElement
    const casca = conteudo?.parentElement
    if (!conteudo || !casca) return

    // A espiada vem do degrau, em `rem`, na variável da casca.
    const espiada = () =>
      parseFloat(getComputedStyle(casca).getPropertyValue("--collapsible-peek")) *
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    const aberto = () => conteudo.dataset.state === "open"

    casca.style.height = aberto() ? "auto" : `${espiada()}px`

    let trajeto: AnimationPlaybackControls | undefined
    const mo = new MutationObserver(() => {
      trajeto?.stop()
      const abre = aberto()
      const de = casca.getBoundingClientRect().height
      const para = abre ? envelope.scrollHeight : espiada()
      const final = abre ? "auto" : `${para}px`
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        casca.style.height = final
        return
      }
      trajeto = animate(
        casca,
        { height: [`${de}px`, `${para}px`] },
        abre ? MOLA : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
      )
      trajeto.finished.then(() => {
        if (aberto() === abre) casca.style.height = final
      })
    })
    mo.observe(conteudo, { attributes: true, attributeFilter: ["data-state"] })

    return () => {
      mo.disconnect()
      trajeto?.stop()
    }
  }, [])
}

/**
 * A casca da espiada. A altura **não** mora aqui: é estilo inline, escrito
 * por `useEspiada`.
 */
const COLLAPSIBLE_PEEK_SHELL = [
  "overflow-hidden",

  // A rampa, **proporcional com teto**. Fixa em 40px ela comia dois terços do
  // degrau `sm`: 40 de rampa num peek de 60 deixa uma linha nítida e duas
  // dissolvendo, e a amostra passa a esconder mais do que mostra.
  // `min(2.5rem, 40%)` dá 24px em `sm` e os 40 cheios em `md` e `lg`.
  //
  // `_-_` obrigatório no `-` binário: com espaço literal a classe é cortada no
  // meio, a rampa vira inválida em cascata e a máscara cai para `none`.
  "[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_min(2.5rem,40%)),transparent)]",
  "has-[>[data-slot=collapsible-content][data-state=open]]:[mask-image:none]",
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
  const medirEnvelope = useEspiada()

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
        espiando ? "h-full" : disclosureRevealClassName,
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
