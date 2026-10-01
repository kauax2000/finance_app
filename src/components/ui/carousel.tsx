"use client"

import {
  ArrowRightIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"
import * as React from "react"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { Card, CardSkeleton } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SkeletonGroup } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import {
  scrollFadeViewportClassName,
  scrollFadeViewportXClassName,
} from "@/lib/scroll-fade-classes"
import { disclosureRevealClassName } from "@/lib/disclosure-classes"
import { menuPanelTintClassName } from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * Itens que deslizam.
 *
 * ## As setas moravam fora da caixa
 *
 * O arquivo anterior era o shadcn intacto, e nele `CarouselPrevious` é
 * `absolute -left-12` — 48px **para fora** da própria região. O componente não
 * se dimensionava: ele exigia que o pai lhe cedesse sala, e todo pai que
 * recorta ou rola comia as setas.
 *
 * Medido na página do catálogo, num contêiner de 958px: a caixa de recorte ia
 * de 297 a 1255, a seta anterior de **289 a 317** e a seguinte de **1235 a
 * 1263** — 8px fora de cada lado. O `scrollWidth` do pai dava **966 contra 958
 * de `clientWidth`**, ou seja o carrossel dava ao contêiner uma barra de
 * rolagem horizontal fantasma; e `elementsFromPoint` a 90% da largura da seta
 * seguinte devolvia uma `div`, **não o botão** — um pedaço da seta não era
 * clicável.
 *
 * Hoje o padrão é `controls="inside"`: as setas pousam sobre as bordas do
 * viewport, dentro da caixa. `outside` continua existindo para quem tem a
 * calha de verdade, e é opt-in — a família do defeito que a rodada do
 * `Container` corrigiu ao tornar a calha opt-in pelo mesmo motivo.
 *
 * ## A documentação afirmava um comportamento que o código nunca teve
 *
 * A página dizia, com todas as letras, que *"as setas não existem no
 * telefone"*. Medido a 375px: `display: flex` nas duas, **28×28**, sobrepostas
 * ao conteúdo. Elas sempre existiram, e abaixo dos 44px que esta casa usa para
 * dedo. Hoje existem de propósito e **crescem por pseudo-elemento** —
 * `pointer-coarse:after:-inset-2.5` leva a caixa de 28 a um alvo de 46 sem
 * mexer na caixa — a saída do `PageHeaderBack`, do × da `AnnouncementBar` e
 * dos degraus do `Breadcrumb`. Aqui ela é segura porque as duas setas ficam em pontas
 * opostas; numa fileira de alvos adjacentes ela seria errada, e é por isso que
 * os pontos do `CarouselDots` crescem de verdade (ver a peça).
 *
 * ## A lib publicava treze mecanismos e o arquivo lia quatro
 *
 * `embla-carousel` 8.6 expõe `scrollProgress()`, `scrollSnapList()`,
 * `selectedScrollSnap()`, `scrollTo()`, `slidesInView()` e os eventos
 * `scroll`, `settle`, `slidesInView`, `slideFocus` e `slidesChanged`. O
 * arquivo lia `canScrollPrev/Next` e os eventos `select`/`reInit`, e mais
 * nada: um carrossel de quatro faturas sem nenhum sinal de quantas existem.
 * É o mesmo diagnóstico da rodada do `resizable`.
 *
 * `CarouselDots` e `CarouselStatus` são o que sai daí. O contexto passou a
 * publicar `selectedIndex`, `snapCount` e `scrollTo`.
 *
 * ## Dois papéis que não tinham nome
 *
 * `role="region"` sem `aria-label` — medido, `hasAccessibleName: false`. É a
 * medição que o `Popover` e o `resizable` já pagaram nesta base: um papel sem
 * nome é anunciado como o papel, e nada mais. O rótulo tem padrão em pt-BR
 * pela mesma razão que o `locale` do `Calendar` tem — um idioma que só vale
 * quando alguém lembra de passar não é o idioma do app.
 *
 * E cada item era `role="group" aria-roledescription="slide"` **sem rótulo**:
 * quatro grupos anônimos. A posição agora vem do **contêiner**, que é quem a
 * sabe — `CarouselContent` deriva índice e total, do mesmo jeito que a
 * `BreadcrumbList` assumiu os separadores e o `Stepper` passou a derivar o
 * `isLast`. Quem escreve a tela não conta itens à mão.
 *
 * ## Três defeitos menores, os três reais
 *
 * O teclado tratava **só `ArrowLeft`/`ArrowRight`**, inclusive com
 * `orientation="vertical"` — a seta do eixo certo não fazia nada. A limpeza do
 * efeito desinscrevia `select` e **não** `reInit`. E
 * `orientation || (opts?.axis === "y" ? …)` era inalcançável, porque
 * `orientation` tem padrão: código morto, a família que esta base já documenta.
 *
 * ## A dissolução reusa a rampa e traz motor próprio
 *
 * A borda em seco lê como lista terminada, e a casa já tem a primitiva. Mas
 * **`useScrollFade` não pode dirigi-la aqui**, e isso é medido: o embla
 * translada o **trilho**, então o viewport fica com `scrollLeft: 0` enquanto
 * `scrollWidth` é 1476 contra `clientWidth` 730. O hook lê `scrollLeft` e
 * reportaria início 0 e fim 746 para sempre — a ponta esquerda nunca acenderia.
 *
 * ## A zona é o triplo da do sistema, e a razão é o que o item carrega
 *
 * `--scroll-fade-x-h` vale 2rem, calibrado para **glifo** — uma trilha de abas,
 * uma célula de tabela, onde a rampa só precisa apagar letra. Aqui o item é um
 * `Card` **com borda**, e um fio de 1px é o que mais resiste: ele corre a
 * altura toda e não tem contrafundo que o dissolva. Medido, o alfa desse fio a
 * 15px da ponta:
 *
 * | zona | alfa do fio |
 * | --- | --- |
 * | 2rem (o sistema) | **31%** — legível, e é o "fade fraco" que se vê |
 * | 4rem | 13% |
 * | **6rem** | **9,5%** |
 *
 * E o **último** pixel nunca chega a zero: `--scroll-fade-floor` é 0,06 de
 * propósito, para a ponta dizer que há mais e não que acabou. Baixá-lo foi
 * medido ao vivo e é indistinguível — 6% de uma borda de 1px dá ~1 unidade de
 * RGB. Quem decide aqui é a **largura** da zona, não o piso.
 *
 * É **variável e não propriedade**: ela herda para a rampa sem disputar com
 * nada, e os outros consumidores da dissolução horizontal não se mexem.
 *
 * A rampa continua sendo a do sistema (`scroll-fade-x`, de `globals.css`); só
 * o motor é daqui, publicando `--scroll-fade-start/end` a partir de
 * `api.scrollProgress()`. As invariantes de `scroll-fade-classes` valem: a
 * máscara vai no **viewport**, que não desenha nada, e quem pinta é a raiz —
 * as setas são irmãs do viewport, então a máscara não as alcança.
 *
 * ## O `variant` de superfície entrou contra a contagem
 *
 * Nenhuma tela do app pede uma superfície para o carrossel — ele tem zero
 * consumidores, e a régua desta casa é que eixo sem contagem é ficção (o
 * precedente é a `Toolbar`, que não ganhou eixo nenhum e registrou isso como a
 * leitura honesta das contagens). O eixo existe por decisão explícita do dono,
 * tomada com esse custo na mesa, e fica registrado assim em vez de ser
 * apresentado como se a medida o tivesse pedido.
 *
 * `card` e `inset` **forçam `controls="inside"`**, com precedência explícita: a
 * raiz passa a pintar, e uma seta a `-left-12` flutuaria fora da superfície que
 * a contém. É a forma com que `scrollable` vence `stretch` no `Tabs`.
 *
 * Nenhuma das duas declara `overflow-hidden`. Ela não é necessária — o recuo da
 * raiz já mantém os itens dentro do raio, e o viewport recorta o trilho —, e
 * declará-la cortaria o anel de foco de 3px das setas contra a borda.
 *
 * ## A seta viajava, e ancorar em variável foi o que a fez viajar
 *
 * A primeira versão desta ancoragem resolveu a geometria e criou um defeito de
 * **movimento**, que medir posição não pega: `top` passou a sair de uma variável
 * escrita por JS, e a base do `Button` declara `transition-all`. Toda remedição
 * — fonte carregando, `snapCount` chegando e os pontos aparecendo, resize —
 * virava uma animação da seta atravessando o cartão.
 *
 * Somavam-se duas coisas. O `cva` declara `50%` como palpite pré-medição, e esse
 * `top: 50%` resolve contra a **raiz**, que inclui pontos e contagem: medido na
 * demonstração padrão, raiz 111px dá 55, contra os 37,5 do centro do trilho —
 * **17,5px** percorridos animadamente na primeira pintura.
 *
 * São dois consertos independentes, e é de propósito: o **layout effect** mata a
 * viagem da primeira pintura (o cliente nunca pinta o palpite), e
 * `CONTROL_TRANSITION` mata a das remedições posteriores, que efeito nenhum
 * alcança. Nenhum dos dois sozinho fecha o caso.
 *
 * ## Uma biblioteca, e um motor só (rodada 134)
 *
 * O dono pediu uma biblioteca de carrossel a partir de onze referências. Cada
 * versão é **composição do mesmo motor**, nunca um componente paralelo:
 *
 * - `effect` — `scale`, `spotlight` (o cartão em destaque no centro),
 *   `parallax` e `curve` (a galeria curva, em CSS e não em WebGL). Um driver
 *   só escreve `--carousel-slide-d` / `-s` em cada slide; os efeitos são
 *   `@utility carousel-effect-*` que só leem a variável;
 * - `loop`, `autoplay` (com `CarouselPlayPause` e o ponto-temporizador),
 *   `bleed` (de borda a borda, sem dissolução) e `layout="accordion"` (os
 *   itens colapsados que abrem conforme se passa);
 * - peças satélite: `CarouselToolbar` (setas no topo, embaixo ou em volta dos
 *   pontos), `CarouselCaption` (a legenda e a ação do item atual),
 *   `CarouselSteps` (passos nomeados) e `CarouselThumbs` (miniaturas). Moram
 *   todas neste arquivo e nesta página: nenhuma se usa sem o `Carousel`, e um
 *   arquivo à parte cobraria do catálogo uma página para um modo.
 *
 * ## A seta não tem fundo, e a dissolução é o que a sustenta
 *
 * `variant="tertiary"` nos dois modos: nada em repouso, fundo no cursor **e no
 * toque** — o par `active:` entrou na origem, em `button.tsx`, porque `hover:`
 * compila dentro de `@media (hover: hover)` e sem ele a seta não acenderia no
 * telefone. E `fade` passou a ser padrão pela mesma decisão: sem preenchimento o
 * glifo pousa direto sobre o conteúdo, e a rampa é o que abre chão para ele.
 *
 * ## Rodada 205: o que faltava a uma tira de verdade
 *
 * - `until="md" | "lg"` — **carrossel só no telefone**: o embla desliga por
 *   breakpoint (`active: false`), o trilho vira grade e setas, pontos,
 *   contagem e barra somem (`group-data-[until=…]/carousel`). A grade usa a
 *   mesma calha do `gap`.
 * - `snap="free"` — arraste livre, com inércia (`dragFree`). Pontos não dizem
 *   nada aqui; quem diz é o `CarouselProgress`.
 * - `selectOnClick` (**ligado**) — o item cortado na borda, clicado, vem para
 *   a vista **antes de agir**: o clique é engolido em captura e o embla rola.
 *   No `spotlight` e no `curve` a régua é ser o central, não estar inteiro.
 * - `wheel` (**ligado**) — o gesto horizontal de dois dedos passa um item por
 *   gesto. A inércia do trackpad manda eventos por quase um segundo, então o
 *   passo trava até 160ms de silêncio. Ouvinte nativo com `passive: false`:
 *   o `onWheel` do React é passivo, e sem `preventDefault` o Chrome do Mac
 *   leria o mesmo gesto como "voltar".
 * - `effect="fade"` — um item por vez, trocando por dissolução: o driver dos
 *   efeitos já sabe a distância de cada item, e a utility o desloca de volta
 *   para a origem e apaga pela distância. Força `gap="none"` e tira a rampa
 *   das pontas (ela apagaria o item inteiro).
 * - Peças: `CarouselProgress` (a barra de rolagem da tira), `CarouselSkeleton`
 *   (o carrossel carregando, com o `basis` real), `CarouselMore` (o último
 *   item é o caminho para a lista), `CarouselStatus placement="overlay"` (o
 *   "3 de 6" sobre a foto), `CarouselThumbs orientation="vertical"` (as
 *   miniaturas ao lado da foto a partir de `md`) e `CarouselFullscreen` (a
 *   galeria num `Dialog` de tela cheia, que devolve o índice ao fechar).
 */

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselOrientation = "horizontal" | "vertical"
type CarouselControls = "inside" | "outside" | "none"
type CarouselGap = "none" | "sm" | "md" | "lg"
type CarouselEffect = "none" | "scale" | "spotlight" | "parallax" | "curve" | "fade"
type CarouselUntil = "md" | "lg"
type CarouselLayout = "slide" | "accordion"

/**
 * Os efeitos, escritos por extenso: o Tailwind varre o código como texto, e
 * `carousel-effect-${effect}` nunca chegaria à folha.
 */
const EFFECT_CLASSES = {
  none: "",
  scale: "carousel-effect-scale",
  spotlight: "carousel-effect-spotlight",
  parallax: "carousel-effect-parallax",
  curve: "carousel-effect-curve",
  fade: "carousel-effect-fade",
} as const satisfies Record<CarouselEffect, string>

/** As consultas de `until`, que o embla e o ouvinte da roda leem. */
const UNTIL_QUERY = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
} as const satisfies Record<CarouselUntil, string>

/**
 * A tira que vira grade. Literal por degrau e por calha — o Tailwind varre o
 * código como texto. A grade preenche colunas de 16rem (ou a largura toda,
 * se a coluna for menor), e a calha é a do `gap`: a margem negativa do
 * trilho e o recuo do item saem, e o `gap` da grade entra.
 */
const UNTIL_TRACK = {
  md: {
    none: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-0",
    sm: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-2",
    md: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-4",
    lg: "md:grid md:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] md:ml-0 md:gap-6",
  },
  lg: {
    none: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-0",
    sm: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-2",
    md: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-4",
    lg: "lg:grid lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] lg:ml-0 lg:gap-6",
  },
} as const

const UNTIL_ITEM = { md: "md:pl-0", lg: "lg:pl-0" } as const

/**
 * O que some quando a tira vira grade: setas, pontos, contagem, barra, play.
 * As duas linhas sempre, porque só a do degrau da raiz casa.
 */
const ESCONDE_NA_GRADE =
  "group-data-[until=md]/carousel:md:hidden group-data-[until=lg]/carousel:lg:hidden"

/** A grade está valendo agora? Fora do navegador, nunca. */
function naGrade(until: CarouselUntil | undefined) {
  return (
    until !== undefined &&
    typeof window !== "undefined" &&
    window.matchMedia(UNTIL_QUERY[until]).matches
  )
}

/** O rótulo da região, quando quem chama não dá um. Ver o cabeçalho. */
const ROTULO_PADRAO = "Carrossel"

const DEFAULT_GAP: CarouselGap = "md"

/**
 * A superfície da raiz, e a calha das setas.
 *
 * Ela é quem pinta — o viewport carrega a máscara e por isso não desenha nada
 * (invariante 2 de `scroll-fade-classes`).
 *
 * **`outside` reserva a própria calha.** É aqui que o defeito desta rodada se
 * fecha de verdade: na versão antiga o modo "seta fora" punha o botão a
 * `-left-12` e ia buscar 48px no pai, que ninguém tinha prometido. Hoje a raiz
 * declara a calha e a seta pousa em `left-0`, então o componente **nunca**
 * desenha fora da própria caixa, em nenhum dos três modos. A medida da calha
 * está nos `compoundVariants`, com o motivo.
 *
 * `orientation` é eixo do `cva` pela mesma razão: a calha do modo vertical é
 * `py`, e o par só se resolve por `compoundVariants`.
 */
// As duas âncoras nascem em 50%, e isso é o **estado do HTML do servidor**, antes
// de existir caixa para medir. É uma aproximação da *raiz*, não do trilho: onde a
// raiz carrega pontos ou contagem, os dois diferem. Na hidratação o layout effect
// do `CarouselContent` corrige antes da primeira pintura do cliente.
const carouselVariants = cva("group/carousel relative [--carousel-control-x:50%] [--carousel-control-y:50%]", {
  variants: {
    variant: {
      plain: "",
      card: "rounded-xl border border-border bg-card p-3",
      inset: "rounded-xl bg-muted p-3",
    },
    controls: { inside: "", outside: "", none: "" },
    orientation: { horizontal: "", vertical: "" },
  },
  compoundVariants: [
    // A calha é **a seta mais um respiro**, e não um número herdado.
    //
    // Ela era `px-12` (48), que veio do `-left-12` do shadcn e que eu preservei
    // por fidelidade à distância antiga. Medido, aquilo deixava **20px de fundo
    // puro** entre a borda de dentro da seta (28) e o começo do conteúdo (48) —
    // e como a dissolução mora na borda do viewport, ela nascia depois desse
    // vão. A seta lia como solta, e não como parte da tira que ela controla.
    //
    // 36 = 28 do botão + 8, que é `--space-inline`: a distância que esta casa
    // usa **dentro** de um bloco. A seta e o trilho são o mesmo bloco, então a
    // dissolução passa a encostar nela, como já acontece em `inside`.
    { controls: "outside", orientation: "horizontal", class: "px-9" },
    { controls: "outside", orientation: "vertical", class: "py-9" },
  ],
  defaultVariants: {
    variant: "plain",
    controls: "inside",
    orientation: "horizontal",
  },
})

/**
 * A calha entre itens, por degrau e por eixo.
 *
 * Escrita **literal**, e não montada a partir de um número: o Tailwind varre o
 * código como texto, e a armadilha já pegou a mesma pessoa que a escreveu na
 * rodada do `Tabs` — `pointer-coarse:${…}` estava no elemento e não existia na
 * folha.
 *
 * A calha é margem negativa no trilho mais recuo no item, e não `gap` no flex,
 * porque `gap` entraria na conta de `basis-*`: com `basis-1/2` e um `gap`, dois
 * itens deixam de caber em 100%.
 */
const GAP_CLASSES = {
  horizontal: {
    none: { track: "", item: "" },
    sm: { track: "-ml-2", item: "pl-2" },
    md: { track: "-ml-4", item: "pl-4" },
    lg: { track: "-ml-6", item: "pl-6" },
  },
  vertical: {
    none: { track: "", item: "" },
    sm: { track: "-mt-2", item: "pt-2" },
    md: { track: "-mt-4", item: "pt-4" },
    lg: { track: "-mt-6", item: "pt-6" },
  },
} as const satisfies Record<
  CarouselOrientation,
  Record<CarouselGap, { track: string; item: string }>
>

/**
 * Onde a seta pousa. Nos dois modos ela fica **dentro** da caixa da raiz: em
 * `inside`, sobre a borda do viewport; em `outside`, dentro da calha que o
 * `cva` acima reserva. Nenhuma coordenada é negativa — foi o defeito.
 *
 * ## Ela se centra no viewport, e não na raiz
 *
 * `top-1/2` parece a resposta e não é: a raiz **também contém os pontos e a
 * contagem**, então metade dela fica abaixo do meio do trilho. Medido, com um
 * `CarouselDots` no telefone: raiz 131, viewport 75, e a seta saindo **28px
 * abaixo do centro** — com a borda de baixo dela já **fora** do viewport.
 *
 * Por isso a âncora é `--carousel-control-y`, que o `CarouselContent` escreve
 * a partir da caixa medida do viewport. O padrão declarado no `cva` é `50%`,
 * então antes da medição o comportamento é o de `top-1/2` e não há salto — a
 * mesma ideia do gatilho do `Tabs`, que se pinta sozinho enquanto o marcador
 * não tem caixa para medir.
 */
const CONTROL_POSITION = {
  inside: {
    horizontal: {
      prev: "top-(--carousel-control-y) left-2 -translate-y-1/2",
      next: "top-(--carousel-control-y) right-2 -translate-y-1/2",
    },
    vertical: {
      prev: "left-(--carousel-control-x) top-2 -translate-x-1/2",
      next: "left-(--carousel-control-x) bottom-2 -translate-x-1/2",
    },
  },
  outside: {
    horizontal: {
      prev: "top-(--carousel-control-y) left-0 -translate-y-1/2",
      next: "top-(--carousel-control-y) right-0 -translate-y-1/2",
    },
    vertical: {
      prev: "left-(--carousel-control-x) top-0 -translate-x-1/2",
      next: "left-(--carousel-control-x) bottom-0 -translate-x-1/2",
    },
  },
} as const

/**
 * O alvo de dedo das setas, por pseudo-elemento, sem mexer na caixa. Seguro
 * aqui porque as duas ficam em pontas opostas — ver o cabeçalho.
 *
 * **A conta não é `28 + 2×inset`, e isso foi medido.** O bloco que contém um
 * absoluto é a **caixa de padding** do ancestral posicionado, não a de borda:
 * o `Button` tem 1px de borda, então a base são **26**, e não 28. Com
 * `-inset-2` o alvo sai **42×42** — medido, `getComputedStyle(seta,"::after")`
 * devolve `42px`.
 *
 * Por isso o degrau é `2.5`: 26 + 2×10 = **46**, e 44 é piso, não teto. Os 2px
 * a mais não custam nada num controle sem vizinho.
 *
 * As três ocorrências que esta casa já tinha carregavam o mesmo desconto e
 * afirmavam 44 nos comentários. As três foram pagas: o `PageHeaderBack` (32
 * com `-inset-2` → 46), o × da `AnnouncementBar` (`-inset-3`) e os degraus do
 * `Breadcrumb` (`-inset-y-3`, que só crescem na altura, porque são vizinhos).
 */
const CONTROL_TOUCH_TARGET =
  "pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']"

/**
 * A lista é escrita à mão porque a distinção é o ponto: **`translate` transiciona,
 * `top` não.**
 *
 * `top` é ancorado numa variável que o JS mede, e a base do `Button` declara
 * `transition-all`: com ela, toda remedição virava uma **animação** da seta
 * atravessando o cartão. Medido — trocando a variável, a seta ainda estava na
 * origem um quadro depois e só assentava 300ms adiante.
 *
 * Mas trocar por `transition-colors` matava junto o **press**, que é feedback
 * legítimo e que esta seta deve ter como qualquer botão. Os dois convivem porque
 * são propriedades diferentes: a âncora medida mexe em `top` e salta; o press
 * mexe em `translate` e desliza.
 *
 * Enumerar é obrigatório — `transition-all` traria `top` de volta, e
 * `transition-colors` não alcança `translate`. É o mesmo idioma de
 * `transition-[rotate,translate,color]` em `disclosure-classes` e de
 * `transition-[translate,width,height]` no marcador do `Tabs`. E, sendo o mesmo
 * grupo no `twMerge`, esta classe **substitui** a da base em vez de disputar com
 * ela.
 */
const CONTROL_TRANSITION =
  "transition-[color,background-color,border-color,translate]"

/**
 * O afundamento de press **compõe** com a centragem, em vez de substituí-la.
 *
 * A seta tem o mesmo feedback de clique que qualquer botão da casa — 1px para
 * baixo, com a mesma curva. O que ela não pode é herdá-lo cru, e a razão é uma
 * colisão de propriedade, não de gosto.
 *
 * No Tailwind v4 `translate` é propriedade independente, e `-translate-y-1/2` e
 * `active:translate-y-px` escrevem a **mesma** custom property. Verificado no CSS
 * emitido:
 *
 * ```
 * .-translate-y-1\/2        { --tw-translate-y: calc(calc(1 / 2 * 100%) * -1) }
 * .active\:translate-y-px   { &:active { --tw-translate-y: 1px } }
 * ```
 *
 * `.classe:active` é (0,2,0) contra os (0,1,0) da centragem, então ao apertar a
 * seta ia de **−14px para +1px — 15px para baixo**, perdendo a centragem inteira.
 *
 * A saída é somar as duas na **mesma declaração** — `calc(-50% + 1px)` —, e
 * entregá-la pelo **`twMerge` e não por especificidade**: mesma família de
 * utilitário sob o mesmo variante, então esta classe **remove**
 * `active:translate-y-px` da lista em vez de disputar com ela por ordem de
 * emissão, que é o que esta base já registra como decidido "pela ordem do
 * Tailwind e não pelo que se escreveu".
 *
 * O afundamento continua existindo, com a mesma medida do `Button`; o que ele
 * deixou de fazer é apagar a centragem no caminho.
 */
const CONTROL_PRESS_FIX = {
  // A centragem e o afundamento somados na mesma declaração. O `-50%` é a
  // centragem, o `1px` é o mesmo degrau que o `Button` usa — o que muda é que
  // aqui eles **compõem** em vez de um apagar o outro.
  horizontal: "active:translate-y-[calc(-50%_+_1px)]",
  // Na vertical a centragem é em X, então o `active:translate-y-px` da base não
  // colide com nada e já é exatamente o afundamento certo.
  vertical: "",
} as const

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: CarouselOrientation
  setApi?: (api: CarouselApi) => void
  /** Onde as setas pousam. `card` e `inset` forçam `inside`. */
  controls?: CarouselControls
  /** A calha entre itens. */
  gap?: CarouselGap
  /**
   * Dissolve as duas pontas do viewport conforme o trilho anda. **Padrão.**
   *
   * Ela é o que torna a seta sem fundo legível: sem preenchimento o glifo pousa
   * direto sobre o conteúdo, e a rampa é o que abre chão para ele nas duas
   * pontas. Continua sendo prop para quem precisar desligar, e não custa nada
   * quando não há transbordo — o motor só liga `data-scroll-fade` nesse caso.
   */
  fade?: boolean
  /** Volta ao começo depois do último. `spotlight` liga por padrão. */
  loop?: boolean
  /**
   * O movimento dos itens conforme se afastam do centro. `spotlight` também
   * centraliza (`align: "center"`) e liga o `loop`.
   */
  effect?: CarouselEffect
  /**
   * Rotação automática, em milissegundos. Só em conteúdo editorial, nunca
   * sobre dado da pessoa. Pausa sob o cursor, com foco dentro, com a aba
   * escondida e pelo `CarouselPlayPause`; com movimento reduzido nasce pausada.
   */
  autoplay?: number
  /**
   * De borda a borda: sem dissolução, e a raiz sangra a calha da casca
   * (`-mx-4 md:-mx-6`, os números do `Container gutter="page"`), com o
   * primeiro item alinhado ao conteúdo.
   */
  bleed?: boolean
  /**
   * `accordion`: os itens ficam lado a lado, colapsados, e o selecionado abre.
   * O embla fica inativo — o índice é do contexto, e setas, pontos, passos e
   * teclado funcionam iguais porque leem dele.
   */
  layout?: CarouselLayout
  /**
   * Carrossel só abaixo do degrau: a partir dele, grade, sem setas nem
   * pontos. O caso da tira de cartões que no desktop cabe inteira.
   */
  until?: CarouselUntil
  /** `free`: arraste livre, com inércia, parando onde o dedo soltar. */
  snap?: "item" | "free"
  /** O item cortado, clicado, vem para a vista antes de agir. Ligado. */
  selectOnClick?: boolean
  /** O gesto horizontal do trackpad passa um item por gesto. Ligado. */
  wheel?: boolean
}

type CarouselAutoplay = ReturnType<typeof useCarouselAutoplay>

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  canScrollPrev: boolean
  canScrollNext: boolean
  selectedIndex: number
  snapCount: number
  orientation: CarouselOrientation
  controls: CarouselControls
  gap: CarouselGap
  fade: boolean
  effect: CarouselEffect
  layout: CarouselLayout
  bleed: boolean
  autoplay: CarouselAutoplay
  until: CarouselUntil | undefined
  selectOnClick: boolean
  /** O acordeão conta os itens pelo contêiner, que é quem os vê. */
  registrarTotal: (total: number) => void
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

/**
 * Medição de caixa acontece **antes da pintura**, senão o cliente chega a pintar
 * o palpite do `cva` e a seta salta dele para o valor medido. O `Tabs` tem o
 * mesmo, local, pelo mesmo motivo.
 */

/** Junta o ref do embla ao ref de medição. O `Tabs` tem o mesmo, local. */
function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  variant = "plain",
  controls: controlsProp,
  gap: gapProp = DEFAULT_GAP,
  fade: fadeProp = true,
  loop,
  effect = "none",
  autoplay: intervalo = 0,
  bleed = false,
  layout = "slide",
  until,
  snap = "item",
  selectOnClick = true,
  wheel = true,
  className,
  style,
  children,
  ref,
  onPointerEnter,
  onPointerLeave,
  onFocusCapture,
  onBlurCapture,
  ...props
}: React.ComponentProps<"div"> &
  CarouselProps &
  // Só o eixo de superfície vem do `cva`. `controls` e `orientation` são props
  // de verdade, com padrão e com precedência própria — herdá-los de
  // `VariantProps` os deixaria anuláveis e duplicaria o padrão em dois lugares.
  Pick<VariantProps<typeof carouselVariants>, "variant">) {
  // Uma superfície pintada não tem controle flutuando fora dela. Precedência
  // explícita, como `scrollable` vencendo `stretch` no `Tabs`.
  const controls: CarouselControls =
    variant === "plain" ? (controlsProp ?? "inside") : "inside"

  const acordeao = layout === "accordion"
  // Sangria e dissolução não convivem: a rampa apagaria justamente as pontas
  // que a sangria veio mostrar.
  const dissolve = effect === "fade"
  // Na dissolução os itens se sobrepõem na origem: calha nenhuma, e nenhuma
  // rampa nas pontas — ela apagaria o item inteiro.
  const gap: CarouselGap = dissolve ? "none" : gapProp
  const fade = fadeProp && !bleed && !acordeao && !dissolve
  const loopEfetivo = loop ?? (effect === "spotlight" ? true : undefined)

  const [carouselRef, api] = useEmblaCarousel(
    {
      // 32 e não os 25 do embla: a transição entre itens lia apressada, e a
      // curva do embla é física — a duração é o que a deixa assentar.
      duration: 32,
      ...(effect === "spotlight" && { align: "center" as const }),
      ...(loopEfetivo !== undefined && { loop: loopEfetivo }),
      ...(snap === "free" && { dragFree: true }),
      ...(until && { breakpoints: { [UNTIL_QUERY[until]]: { active: false } } }),
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      // No acordeão o embla não move nada: quem troca o item é o contexto.
      ...(acordeao && { active: false }),
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [snapCount, setSnapCount] = React.useState(0)
  const [total, registrarTotal] = React.useState(0)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setSelectedIndex(api.selectedScrollSnap())
    setSnapCount(api.scrollSnapList().length)
  }, [])

  const scrollPrev = React.useCallback(() => {
    if (!acordeao) return api?.scrollPrev()
    setSelectedIndex((i) => (i > 0 ? i - 1 : loopEfetivo ? total - 1 : i))
  }, [api, acordeao, loopEfetivo, total])
  const scrollNext = React.useCallback(() => {
    if (!acordeao) return api?.scrollNext()
    setSelectedIndex((i) => (i < total - 1 ? i + 1 : loopEfetivo ? 0 : i))
  }, [api, acordeao, loopEfetivo, total])
  const scrollTo = React.useCallback(
    (index: number) => {
      if (!acordeao) return api?.scrollTo(index)
      setSelectedIndex(Math.max(0, Math.min(index, total - 1)))
    },
    [api, acordeao, total]
  )

  // No acordeão, poder avançar é aritmética do índice, e não pergunta ao embla.
  const podeAnterior = acordeao
    ? total > 1 && (loopEfetivo || selectedIndex > 0)
    : canScrollPrev
  const podeSeguinte = acordeao
    ? total > 1 && (loopEfetivo || selectedIndex < total - 1)
    : canScrollNext
  const contagem = acordeao ? total : snapCount

  // A rotação avança e, no fim sem `loop`, volta ao começo — senão ela
  // pararia calada no último item com o relógio ainda desenhado.
  const avancar = React.useCallback(() => {
    if (podeSeguinte) scrollNext()
    else scrollTo(0)
  }, [podeSeguinte, scrollNext, scrollTo])
  const autoplay = useCarouselAutoplay({
    intervalo,
    avancar,
    chave: selectedIndex,
  })

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // A escuta é em captura na região inteira: sem esta saída, a seta dentro
      // de um campo num slide trocava de slide em vez de mover o cursor.
      const alvo = event.target as HTMLElement
      if (alvo.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return
      // Na grade não há para onde andar, e a seta é do navegador.
      if (naGrade(until)) return
      // A seta segue o eixo. Antes eram sempre as horizontais, inclusive num
      // carrossel vertical, onde a tecla certa não fazia nada.
      const anterior = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp"
      const seguinte = orientation === "horizontal" ? "ArrowRight" : "ArrowDown"

      if (event.key === anterior) {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === seguinte) {
        event.preventDefault()
        scrollNext()
      } else if (event.key === "Home") {
        event.preventDefault()
        scrollTo(0)
      } else if (event.key === "End") {
        event.preventDefault()
        scrollTo(Math.max(0, contagem - 1))
      }
    },
    [orientation, scrollPrev, scrollNext, scrollTo, contagem, until]
  )

  // A roda do trackpad. Os passos mais recentes por ref: o ouvinte é montado
  // uma vez, e `scrollNext` muda de identidade com o total do acordeão.
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const passos = React.useRef({ scrollPrev, scrollNext })
  React.useEffect(() => {
    passos.current = { scrollPrev, scrollNext }
  }, [scrollPrev, scrollNext])
  React.useEffect(() => {
    const no = rootRef.current
    if (!no || !wheel || orientation !== "horizontal") return
    let acumulado = 0
    let travado = false
    let silencio: ReturnType<typeof setTimeout> | undefined
    const aoRolar = (e: WheelEvent) => {
      // Só o gesto de lado: o vertical continua rolando a página.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      if (naGrade(until)) return
      e.preventDefault()
      clearTimeout(silencio)
      silencio = setTimeout(() => {
        acumulado = 0
        travado = false
      }, 160)
      if (travado) return
      acumulado += e.deltaX
      if (Math.abs(acumulado) < 40) return
      travado = true
      if (acumulado > 0) passos.current.scrollNext()
      else passos.current.scrollPrev()
    }
    no.addEventListener("wheel", aoRolar, { passive: false })
    return () => {
      no.removeEventListener("wheel", aoRolar)
      clearTimeout(silencio)
    }
  }, [wheel, orientation, until])

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api || acordeao) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    api.on("slidesChanged", onSelect)

    return () => {
      // `reInit` e `slidesChanged` ficavam inscritos para sempre: a limpeza
      // antiga desinscrevia só o `select`.
      api.off("reInit", onSelect)
      api.off("select", onSelect)
      api.off("slidesChanged", onSelect)
    }
  }, [api, onSelect, acordeao])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev: podeAnterior,
        canScrollNext: podeSeguinte,
        selectedIndex,
        snapCount: contagem,
        orientation,
        controls,
        gap,
        fade,
        effect,
        layout,
        bleed,
        autoplay,
        until,
        selectOnClick,
        registrarTotal,
      }}
    >
      <div
        ref={composeRefs(rootRef, ref)}
        onKeyDownCapture={handleKeyDown}
        onPointerEnter={(e) => {
          autoplay.pausar("cursor")
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          autoplay.retomar("cursor")
          onPointerLeave?.(e)
        }}
        onFocusCapture={(e) => {
          autoplay.pausar("foco")
          onFocusCapture?.(e)
        }}
        onBlurCapture={(e) => {
          // Só retoma quando o foco sai da região, e não quando anda dentro
          // dela — de uma seta para um ponto.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            autoplay.retomar("foco")
          }
          onBlurCapture?.(e)
        }}
        style={
          autoplay.ativo
            ? ({
                "--carousel-autoplay-ms": `${intervalo}ms`,
                ...style,
              } as React.CSSProperties)
            : style
        }
        data-autoplay={
          autoplay.ativo ? (autoplay.rodando ? "running" : "paused") : undefined
        }
        data-effect={effect === "none" ? undefined : effect}
        data-layout={layout}
        data-until={until}
        data-snap={snap === "free" ? "free" : undefined}
        className={cn(
          carouselVariants({ variant, controls, orientation }),
          // A calha da casca, devolvida: a raiz sangra até a borda e o trilho
          // recua o mesmo tanto, para o primeiro item alinhar com o conteúdo.
          bleed && "-mx-4 md:-mx-6",
          className
        )}
        role="region"
        aria-roledescription="carousel"
        aria-label={ROTULO_PADRAO}
        data-slot="carousel"
        data-variant={variant}
        data-controls={controls}
        data-gap={gap}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/**
 * O viewport e o trilho.
 *
 * `className` vai no **trilho**, que é onde `basis-*` e a calha operam;
 * `viewportClassName` vai na caixa que recorta. Os dois existem porque o
 * `data-slot` fica no viewport e quem escrevia `className` não dimensionava o
 * que via — o mesmo defeito que o `SearchInput` pagou e resolveu com
 * `inputClassName`.
 */
function CarouselContent({
  className,
  viewportClassName,
  children,
  ...props
}: React.ComponentProps<"div"> & { viewportClassName?: string }) {
  const {
    carouselRef,
    orientation,
    gap,
    fade,
    api,
    effect,
    layout,
    bleed,
    until,
    registrarTotal,
  } = useCarousel()
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const acordeao = layout === "accordion"

  // A âncora das setas é o **centro do viewport**, e não o da raiz — que também
  // carrega os pontos e a contagem. Ver a nota em `CONTROL_POSITION`: sem isto,
  // medido, a seta saía 28px abaixo e com a borda fora do trilho.
  //
  // Um `ResizeObserver` e não uma leitura no render: a altura só existe depois
  // do layout. É o mecanismo de `useScrollFade` e do marcador do `Tabs`.
  //
  // E **layout effect**, não `useEffect`: com o efeito depois da pintura, o
  // cliente chegava a pintar o palpite de `50%` do `cva` — que resolve contra a
  // **raiz**, e não contra o trilho — e a seta viajava dali até o valor medido.
  // Medido na demonstração padrão: raiz 111px, logo 50% = 55, contra os 37,5 do
  // centro do trilho. Dezessete pixels e meio de viagem, animados pelo
  // `transition-all` da base do `Button`. Os dois consertos são independentes:
  // este mata a viagem da primeira pintura, e `CONTROL_TRANSITION` mata a das
  // remedições posteriores, que efeito nenhum alcança.
  useIsomorphicLayoutEffect(() => {
    const node = viewportRef.current
    const raiz = node?.closest<HTMLElement>("[data-slot=carousel]")
    if (!node || !raiz) return

    // `offsetTop`/`offsetLeft` e não `getBoundingClientRect`: o bloco que
    // contém um absoluto é a **caixa de padding** da raiz, que desconta a
    // borda mas **não** o recuo — e `offsetTop` é medido a partir dessa mesma
    // caixa. Só a metade da altura não basta: em `card` e `inset` o `p-3`
    // empurra o viewport 12px para baixo enquanto o `top` continua contando do
    // topo, e a seta saía **11px acima** do centro (medido, nas duas). É a
    // mesma escolha que o marcador do `Tabs` registra pelo mesmo motivo.
    const medir = () => {
      raiz.style.setProperty(
        "--carousel-control-y",
        `${Math.round(node.offsetTop + node.clientHeight / 2)}px`
      )
      raiz.style.setProperty(
        "--carousel-control-x",
        `${Math.round(node.offsetLeft + node.clientWidth / 2)}px`
      )
    }

    medir()
    const observer = new ResizeObserver(medir)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // A rampa é a do sistema; o motor é daqui, porque o embla translada o trilho
  // e o `scrollLeft` do viewport nunca sai de zero. Ver o cabeçalho.
  React.useEffect(() => {
    const node = viewportRef.current
    if (!api || !fade || !node) return

    const escrever = () => {
      const trilho = api.containerNode()
      const total =
        orientation === "horizontal"
          ? trilho.scrollWidth - node.clientWidth
          : trilho.scrollHeight - node.clientHeight
      if (total <= 0) {
        delete node.dataset.scrollFade
        return
      }
      const progresso = Math.min(1, Math.max(0, api.scrollProgress()))
      node.style.setProperty(
        "--scroll-fade-start",
        `${Math.round(progresso * total)}px`
      )
      node.style.setProperty(
        "--scroll-fade-end",
        `${Math.round((1 - progresso) * total)}px`
      )
      node.dataset.scrollFade = "on"
    }

    escrever()
    api.on("scroll", escrever)
    api.on("reInit", escrever)
    api.on("resize", escrever)

    return () => {
      api.off("scroll", escrever)
      api.off("reInit", escrever)
      api.off("resize", escrever)
    }
  }, [api, fade, orientation])

  // **O driver dos efeitos.** Um só, para os quatro: ele escreve em cada slide a
  // distância ao ponto de encaixe atual, em passos — `--carousel-slide-s` com
  // sinal (direita positiva) e `--carousel-slide-d` sem —, e o CSS decide o que
  // fazer com ela (`@utility carousel-effect-*`). É o método do exemplo de
  // tween do próprio embla, inclusive o desvio do `loop`: um slide reposto na
  // outra ponta pelo `slideLooper` mede a distância pelo lado de lá.
  //
  // Nada transiciona: a variável muda a cada quadro de rolagem, e quem suaviza
  // é o próprio embla.
  React.useEffect(() => {
    if (!api || effect === "none" || acordeao) return

    const escrever = () => {
      const engine = api.internalEngine()
      const progresso = api.scrollProgress()
      const snaps = api.scrollSnapList()
      const nos = api.slideNodes()
      // Em `loop` os encaixes dividem a volta inteira; sem ele, o intervalo
      // entre o primeiro e o último. É o que faz "um passo" valer 1.
      const passos = Math.max(
        1,
        engine.options.loop ? snaps.length : snaps.length - 1
      )

      snaps.forEach((snap, i) => {
        for (const indice of engine.slideRegistry[i] ?? []) {
          let diff = snap - progresso
          if (engine.options.loop) {
            for (const ponto of engine.slideLooper.loopPoints) {
              const alvo = ponto.target()
              if (indice === ponto.index && alvo !== 0) {
                diff =
                  Math.sign(alvo) === -1
                    ? snap - (1 + progresso)
                    : snap + (1 - progresso)
              }
            }
          }
          const s = Math.max(-2, Math.min(2, diff * passos))
          const no = nos[indice]
          no?.style.setProperty("--carousel-slide-s", s.toFixed(3))
          no?.style.setProperty("--carousel-slide-d", Math.abs(s).toFixed(3))
        }
      })
    }

    escrever()
    api.on("scroll", escrever)
    api.on("reInit", escrever)
    api.on("slideFocus", escrever)
    return () => {
      api.off("scroll", escrever)
      api.off("reInit", escrever)
      api.off("slideFocus", escrever)
    }
  }, [api, effect, acordeao])

  // A posição do item é derivada por quem a conhece — o contêiner —, e não
  // escrita à mão em cada item. É o que a `BreadcrumbList` fez ao assumir os
  // separadores e o `Stepper` ao derivar o `isLast`.
  const itens = React.Children.toArray(children).filter(React.isValidElement)
  const total = itens.length

  // O acordeão não tem encaixes do embla para contar: quem sabe o total é o
  // contêiner, e ele o publica.
  React.useEffect(() => {
    registrarTotal(total)
  }, [registrarTotal, total])

  return (
    <div
      ref={composeRefs(carouselRef, viewportRef)}
      // Sem `bg`, sem `ring`, sem `radius`: quem carrega a máscara não desenha
      // nada — invariante 2 de `scroll-fade-classes`.
      className={cn(
        "overflow-hidden",
        // O triplo da zona do sistema — ver o cabeçalho.
        fade && "[--scroll-fade-x-h:--spacing(24)]",
        // A rampa segue o eixo. Cravar a horizontal aqui foi um defeito real:
        // um carrossel vertical saía dissolvendo as bordas **laterais**,
        // enquanto o conteúdo entrava e saía por cima e por baixo. As duas
        // utilities leem as mesmas `--scroll-fade-start/end` que o motor
        // publica — muda só o eixo do gradiente e o teto do clamp (44px na
        // vertical, 32 na horizontal), então o driver não precisou mudar.
        //
        // E é uma **ou** a outra, nunca as duas: a invariante 3 de
        // `scroll-fade-classes` é um gradiente por elemento.
        fade &&
          (orientation === "horizontal"
            ? scrollFadeViewportXClassName
            : scrollFadeViewportClassName),
        // O recuo da sangria mora no viewport: o primeiro item alinha com o
        // conteúdo da página, e o resto passa por baixo da calha até a borda.
        bleed && "px-4 md:px-6",
        viewportClassName
      )}
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          // `h-full` na vertical é **carga estrutural**, e foi medido.
          //
          // O embla mede o **contêiner** (este trilho) para achar o
          // comprimento do eixo, e não o viewport. Com a altura só no viewport
          // o trilho cresce até o conteúdo — medido, viewport 160 e trilho 362
          // —, o embla conclui que tudo cabe e **desabilita as duas setas**,
          // com o conteúdo transbordando calado. Com `h-full` o trilho passa a
          // medir o viewport, e aí `basis-1/2` também volta a significar
          // metade do que se vê.
          //
          // É por isso que a altura de um carrossel vertical vai em
          // `viewportClassName`, e não aqui.
          orientation === "horizontal" ? "" : "h-full flex-col",
          // O acordeão estica os itens na altura do viewport — a altura dele é
          // de quem chama, em `viewportClassName`.
          acordeao && "h-full",
          GAP_CLASSES[orientation][gap].track,
          // A grade de `until`: só no eixo horizontal, que é o da tira.
          until && orientation === "horizontal" && UNTIL_TRACK[until][gap],
          EFFECT_CLASSES[effect],
          className
        )}
        {...props}
      >
        {itens.map((child, i) =>
          React.isValidElement<{ "aria-label"?: string; index?: number }>(child)
            ? React.cloneElement(child, {
                "aria-label": child.props["aria-label"] ?? `${i + 1} de ${total}`,
                // O índice também é do contêiner: o item o usa para saber se é
                // o selecionado e, no acordeão, para se selecionar no clique.
                index: child.props.index ?? i,
              })
            : child
        )}
      </div>
    </div>
  )
}

/**
 * A resposta ao cursor, no **filho** do item e não nele: o item carrega a
 * calha (`pl-*`), e uma sombra nele contornaria a calha junto.
 *
 * `lift` e `zoom` não combinam com `effect="curve"` nem `"parallax"`: os dois
 * efeitos também escrevem `translate`/`scale`, e a transição do cursor
 * arrastaria o valor que o driver escreve a cada quadro.
 */
const ITEM_HOVER = {
  none: "",
  lift: [
    "*:transition-[translate,box-shadow] *:duration-(--duration-base) *:ease-(--ease-out)",
    "hover:*:-translate-y-1 hover:*:shadow-md active:*:-translate-y-1 active:*:shadow-md",
  ].join(" "),
  zoom: [
    "[&_img]:transition-[scale] [&_img]:duration-(--duration-slow) [&_img]:ease-(--ease-out)",
    "hover:[&_img]:scale-105 active:[&_img]:scale-105",
  ].join(" "),
} as const

function CarouselItem({
  className,
  index = 0,
  hover = "none",
  onClick,
  onKeyDown,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  /** Escrito pelo `CarouselContent`; não precisa ser passado. */
  index?: number
  /** A resposta ao cursor e ao toque. */
  hover?: keyof typeof ITEM_HOVER
}) {
  const {
    api,
    orientation,
    gap,
    layout,
    effect,
    until,
    selectOnClick,
    selectedIndex,
    scrollTo,
  } = useCarousel()
  const acordeao = layout === "accordion"
  const selecionado = index === selectedIndex

  // O item cortado na borda vem para a vista **antes de agir**: o clique é
  // engolido em captura, e o embla rola até o encaixe que contém o item. No
  // `spotlight` e no `curve` a régua é ser o central, e não estar inteiro.
  // Arrasto não chega aqui: o embla 8 cancela o clique que termina um arrasto.
  const trazerParaVista = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectOnClick || acordeao || effect === "fade" || !api || naGrade(until)) return
    const encaixe = api
      .internalEngine()
      .slideRegistry.findIndex((grupo) => grupo.includes(index))
    if (encaixe < 0) return
    let fora: boolean
    if (effect === "spotlight" || effect === "curve") {
      fora = encaixe !== api.selectedScrollSnap()
    } else {
      // O filho, e não o item: o item carrega a calha, e o primeiro começa
      // 16px antes do viewport pela margem negativa do trilho.
      const caixa = (e.currentTarget.firstElementChild ?? e.currentTarget).getBoundingClientRect()
      const vista = api.rootNode().getBoundingClientRect()
      fora =
        orientation === "horizontal"
          ? caixa.left < vista.left - 1 || caixa.right > vista.right + 1
          : caixa.top < vista.top - 1 || caixa.bottom > vista.bottom + 1
    }
    if (!fora) return
    e.preventDefault()
    e.stopPropagation()
    api.scrollTo(encaixe)
  }

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      data-selected={selecionado || undefined}
      className={cn(
        acordeao
          ? // O peso cresce na mola da casa: o selecionado abre para 4 partes
            // e os outros ficam com uma, colapsados mas visíveis.
            "min-w-0 basis-0 grow-(--carousel-weight) cursor-pointer transition-[flex-grow] duration-(--duration-spring) ease-(--ease-spring)"
          : "min-w-0 shrink-0 grow-0 basis-full",
        acordeao &&
          "rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-inset",
        GAP_CLASSES[orientation][gap].item,
        until && orientation === "horizontal" && UNTIL_ITEM[until],
        ITEM_HOVER[hover],
        className
      )}
      style={
        acordeao
          ? ({
              "--carousel-weight": selecionado ? 4 : 1,
              ...style,
            } as React.CSSProperties)
          : style
      }
      onClickCapture={trazerParaVista}
      onClick={(e) => {
        if (acordeao) scrollTo(index)
        onClick?.(e)
      }}
      // No acordeão o item colapsado é um alvo: ele recebe foco e abre com
      // Enter e Espaço, como o clique. As setas continuam andando pela região.
      tabIndex={acordeao ? 0 : undefined}
      onKeyDown={(e) => {
        if (acordeao && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          scrollTo(index)
        }
        onKeyDown?.(e)
      }}
      {...props}
    />
  )
}

function CarouselControl({
  direction,
  className,
  // `tertiary` nos dois modos: nada em repouso, fundo só no cursor e no toque.
  //
  // É convergência, e não exceção. Das três famílias de seta da casa, o
  // `Calendar` e a `Pagination` já são `tertiary` + `rounded-lg`; esta era **a
  // única seta `rounded-full` do repositório e a única com fundo em repouso**.
  //
  // Não há mais `defaultControlVariant`: com um peso só, uma função que escolhe
  // entre dois pesos é uma constante disfarçada. `controls` decide só a posição.
  variant = "tertiary",
  size = "icon-sm",
  placement = "overlay",
  appearance = "tertiary",
  ...props
}: React.ComponentProps<typeof Button> & {
  direction: "prev" | "next"
  /**
   * `overlay` pousa sobre as bordas do viewport (o padrão); `inline` é estático,
   * para morar numa `CarouselToolbar` — no topo, embaixo ou em volta dos pontos.
   */
  placement?: "overlay" | "inline"
  /**
   * `tertiary` sem fundo (o padrão); `glass`, redonda na tinta flutuante, para
   * pousar sobre foto; `solid`, redonda e preenchida, para uma barra.
   */
  appearance?: "tertiary" | "glass" | "solid"
}) {
  const {
    orientation,
    controls,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
  } = useCarousel()

  // `none` esconde as setas **sobrepostas**; as de uma barra são pedidas à
  // mão, e quem as pôs lá quer vê-las.
  if (controls === "none" && placement === "overlay") return null
  const sobreposta = placement === "overlay"

  const anterior = direction === "prev"
  const Icone = anterior
    ? orientation === "horizontal"
      ? ChevronLeftIcon
      : ChevronUpIcon
    : orientation === "horizontal"
      ? ChevronRightIcon
      : ChevronDownIcon

  return (
    <Button
      data-slot={anterior ? "carousel-previous" : "carousel-next"}
      data-appearance={appearance}
      variant={appearance === "solid" ? "secondary" : variant}
      size={size}
      className={cn(
        // Sem `rounded-full` no padrão: o raio é o do `Button` (`rounded-lg`,
        // 10px), que é o que `Calendar` e `Pagination` já entregam nas setas.
        sobreposta && "absolute",
        ESCONDE_NA_GRADE,
        CONTROL_TRANSITION,
        sobreposta && CONTROL_POSITION[controls === "none" ? "inside" : controls][orientation][direction],
        sobreposta && CONTROL_PRESS_FIX[orientation],
        // Na barra as setas são vizinhas: o alvo cresce de verdade, porque um
        // `::after` de 46px engoliria a do lado — a razão dos pontos.
        sobreposta ? CONTROL_TOUCH_TARGET : "pointer-coarse:size-11",
        // Sobre foto, a placa é a tinta flutuante (`background-color`) e o
        // realce do `tertiary` é o disco (`background-image`): propriedades
        // diferentes, que compõem em vez de disputar.
        appearance === "glass" &&
          cn(menuPanelTintClassName, "rounded-full shadow-sm ring-1 ring-foreground/10"),
        appearance === "solid" && "rounded-full shadow-xs",
        // Redonda, apagada em vez de sumir: numa foto ou numa barra, a seta que
        // some faz a moldura piscar a cada ponta.
        appearance !== "tertiary" && "disabled:opacity-30",
        // Em `inside` a seta pousa **sobre** o conteúdo, e desabilitada ela não
        // faz nada: no início do trilho a seta anterior ficava por cima do
        // primeiro item, que é o único que está inteiro na tela — medido, o
        // botão cobria o "R$" de um valor. Um controle morto tapando conteúdo
        // vivo é pior que um controle ausente.
        //
        // `invisible` e não `hidden`: ela é absoluta, então não há refluxo a
        // evitar, mas manter a caixa deixa a medição do alvo estável. Em
        // `outside` ela continua visível — lá existe calha reservada, e um
        // botão sumindo faria a moldura piscar a cada ponta.
        sobreposta && appearance === "tertiary" && controls === "inside" && "disabled:invisible",
        className
      )}
      disabled={anterior ? !canScrollPrev : !canScrollNext}
      onClick={anterior ? scrollPrev : scrollNext}
      {...props}
    >
      <Icone />
      <span className="sr-only">{anterior ? "Item anterior" : "Próximo item"}</span>
    </Button>
  )
}

function CarouselPrevious(
  props: Omit<React.ComponentProps<typeof CarouselControl>, "direction">
) {
  return <CarouselControl direction="prev" {...props} />
}

function CarouselNext(
  props: Omit<React.ComponentProps<typeof CarouselControl>, "direction">
) {
  return <CarouselControl direction="next" {...props} />
}

/**
 * O indicador de posição.
 *
 * O alvo **cresce de verdade**, e não por pseudo-elemento: o `pagination.tsx`
 * já recusou o `-inset` pelo motivo que vale aqui — alvos pequenos e
 * adjacentes se sobrepõem, e um `::after` de 44px em cada ponto engoliria o
 * vizinho. O botão *é* a área de toque, e o ponto é o filho que ele centraliza.
 *
 * O ativo é `bg-primary-accent`: marca sobre o fundo, que é a régua da casa
 * para o traço que precisa ser enxergado contra a página — `--primary` é o que
 * preenche e carrega texto por cima.
 */
function CarouselDots({
  className,
  variant = "dot",
  placement = "below",
  surface = "none",
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * `dot` pontos; `pill`, o ativo alonga para três vezes a largura, na mola da
   * casa; `bar`, segmentos que dividem a largura toda.
   */
  variant?: "dot" | "bar" | "pill"
  /** `overlay` pousa sobre a base do viewport, centralizado — para foto. */
  placement?: "below" | "overlay"
  /** `glass` dá uma cápsula de vidro atrás dos pontos. */
  surface?: "none" | "glass"
}) {
  const { snapCount, selectedIndex, scrollTo, autoplay } = useCarousel()

  // Um item só não tem posição para indicar.
  if (snapCount <= 1) return null

  const barra = variant === "bar"
  const pilula = variant === "pill"
  const sobreFoto = placement === "overlay"

  return (
    <div
      role="group"
      aria-label="Escolher item"
      data-slot="carousel-dots"
      data-variant={variant}
      data-placement={placement}
      className={cn(
        "flex items-center justify-center",
        ESCONDE_NA_GRADE,
        barra && "w-full gap-1",
        // Sobre a foto: centralizado na base do viewport, acima do conteúdo.
        sobreFoto &&
          "absolute inset-x-0 bottom-2 z-10 mx-auto w-fit",
        surface === "glass" &&
          cn(menuPanelTintClassName, "rounded-full px-1 shadow-sm ring-1 ring-foreground/10"),
        className
      )}
      {...props}
    >
      {Array.from({ length: snapCount }, (_, i) => {
        const ativo = i === selectedIndex
        // O temporizador mora no ativo, e remonta a cada troca (`key`): a
        // animação recomeça do zero junto com o relógio do `useCarouselAutoplay`.
        const relogio = ativo && autoplay.ativo
        return (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Ir para o item ${i + 1}`}
            aria-current={ativo ? "true" : undefined}
            data-slot="carousel-dot"
            data-active={ativo || undefined}
            className={cn(
              "group/dot flex shrink-0 cursor-pointer items-center justify-center",
              "rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
              barra
                ? "min-w-0 flex-1 py-2 pointer-coarse:py-5"
                : cn("h-6 pointer-coarse:h-11", pilula && ativo ? "px-1" : "w-6 pointer-coarse:w-11")
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative overflow-hidden rounded-full",
                "transition-[background-color,width] duration-(--duration-spring) ease-(--ease-spring)",
                barra ? "h-1 w-full" : cn("h-2", pilula && ativo ? "w-6" : "w-2"),
                // O ponto apagado também é um controle, e a 1.4.11 pede 3:1.
                // Varridos os degraus contra o fundo real nos dois temas, **45%
                // é o primeiro que passa nos dois** — 3,15 no claro e 4,36 no
                // escuro, contra 1,78 e 2,22 dos 25% que estavam aqui. O ativo
                // é `--primary-accent`: 7,66 e 6,14.
                //
                // **Sobre foto a tinta é a do véu** (`--scrim-foreground`,
                // branca nos dois temas): o `--foreground` do tema claro é
                // quase preto, e some numa foto escura.
                //
                // Os degraus são literais, e não montados: o Tailwind varre o
                // código como texto.
                sobreFoto
                  ? ativo
                    ? relogio
                      ? "bg-scrim-foreground/40"
                      : "bg-scrim-foreground"
                    : "bg-scrim-foreground/55 group-hover/dot:bg-scrim-foreground/85 group-active/dot:bg-scrim-foreground/85"
                  : ativo
                    ? relogio
                      ? "bg-primary-accent/30"
                      : "bg-primary-accent"
                    : "bg-foreground/45 group-hover/dot:bg-foreground/70 group-active/dot:bg-foreground/70"
              )}
            >
              {relogio ? (
                <span
                  key={selectedIndex}
                  className={cn(
                    "carousel-timer absolute inset-0 rounded-full",
                    sobreFoto ? "bg-scrim-foreground" : "bg-primary-accent"
                  )}
                />
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * "3 de 12" — e **é** a região viva que a APG pede para o carrossel.
 *
 * `role="status"` sozinho: o papel já implica `aria-live="polite"`, e declarar
 * os dois é a contradição que o `FormError` registra.
 */
function CarouselStatus({
  className,
  children,
  placement = "below",
  ...props
}: React.ComponentProps<typeof Caption> & {
  /**
   * `overlay`: a pílula de vidro no canto de cima da foto — a tinta
   * flutuante, que segue o tema, com o texto do corpo por cima.
   */
  placement?: "below" | "overlay"
}) {
  const { selectedIndex, snapCount, autoplay } = useCarousel()

  return (
    <Caption
      role="status"
      // Com a rotação andando, a região viva se cala: anunciar cada troca
      // automática atropelaria o leitor de tela (APG, carrossel com rotação).
      aria-live={autoplay.rodando ? "off" : undefined}
      data-slot="carousel-status"
      data-placement={placement}
      className={cn(
        "nums",
        ESCONDE_NA_GRADE,
        placement === "overlay" &&
          cn(
            menuPanelTintClassName,
            "absolute start-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-foreground/10"
          ),
        className
      )}
      {...props}
    >
      {children ?? `${Math.min(selectedIndex + 1, snapCount)} de ${snapCount}`}
    </Caption>
  )
}

/**
 * A barra de controles — o lugar das setas `placement="inline"`, e também dos
 * pontos, da contagem e do `CarouselPlayPause`.
 *
 * Ela não se posiciona: é quem a põe que decide. No `actions` de um
 * `PageSectionHeader` dentro do `Carousel` ela vira as setas do topo, à
 * direita do título; depois do conteúdo, as de baixo; com `align="center"` e
 * os pontos entre as setas, a barra de depoimento.
 */
function CarouselToolbar({
  className,
  align = "end",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "center" | "end" }) {
  return (
    <div
      data-slot="carousel-toolbar"
      className={cn(
        "flex items-center gap-1.5",
        ESCONDE_NA_GRADE,
        align === "start" && "justify-start",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * A legenda do item atual — título, texto e ação — fora do trilho.
 *
 * Ela remonta a cada troca (`key`) e entra com a `disclosure-reveal`, a mesma
 * cascata da divulgação: o texto sobe junto com o item que chegou, e não troca
 * de estalo. É a legenda com "Ler as notas" da referência do acordeão, e
 * serve qualquer versão.
 */
function CarouselCaption({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  children: (index: number) => React.ReactNode
}) {
  const { selectedIndex, autoplay } = useCarousel()
  return (
    <div
      data-slot="carousel-caption"
      aria-live={autoplay.rodando ? "off" : "polite"}
      className={className}
      {...props}
    >
      <div key={selectedIndex} className={disclosureRevealClassName}>
        {children(selectedIndex)}
      </div>
    </div>
  )
}

/**
 * Pausar e retomar a rotação — obrigatório onde há `autoplay` (WCAG 2.2.2).
 *
 * O ícone diz o que o botão **faz**, e o rótulo também: pausa quando está
 * rodando, retoma quando o usuário pausou. As pausas automáticas (cursor,
 * foco, aba escondida) não mexem nele, senão o botão mudaria de sentido sob o
 * próprio cursor que foi apertá-lo.
 */
function CarouselPlayPause({
  className,
  variant = "tertiary",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { autoplay } = useCarousel()
  if (!autoplay.ativo) return null
  const pausado = autoplay.pausadoPeloUsuario

  return (
    <Button
      type="button"
      data-slot="carousel-play-pause"
      variant={variant}
      size={size}
      onClick={autoplay.alternar}
      className={cn("pointer-coarse:size-11", ESCONDE_NA_GRADE, className)}
      {...props}
    >
      {pausado ? <PlayIcon /> : <PauseIcon />}
      <span className="sr-only">
        {pausado ? "Retomar a rotação" : "Pausar a rotação"}
      </span>
    </Button>
  )
}

/**
 * Os passos nomeados de um carrossel — a navegação que diz **o que** vem, e
 * não só quantos.
 *
 * Duas referências do dono moram aqui: as pílulas numeradas no topo de uma
 * vitrine ("Step 1 · Step 2 · …") e a lista de serviços com o trilho à
 * esquerda, em que só o ativo mostra a descrição. São `orientation`
 * `horizontal` e `vertical` da mesma peça, porque as duas respondem à mesma
 * pergunta: escolher o item pelo nome.
 *
 * ## Botões com `aria-current`, e não abas
 *
 * O padrão de "carrossel com abas" da APG pede `tablist` com `tabpanel`, e
 * aqui os painéis são os slides do embla — `role="group"` com
 * `aria-roledescription="slide"`. Declarar `role="tab"` sem painel é a posse
 * ARIA quebrada que o `ButtonGroup` já registra; um grupo de botões com
 * `aria-current` diz a verdade.
 *
 * Tem de morar dentro de um `<Carousel>`: lê e escreve o índice do contexto,
 * então setas, pontos, teclado e autoplay andam juntos com ele.
 */
type StepsContextValue = { orientation: "horizontal" | "vertical" }
const StepsContext = React.createContext<StepsContextValue>({
  orientation: "horizontal",
})

function CarouselSteps({
  className,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  const { selectedIndex } = useCarousel()
  const listaRef = React.useRef<HTMLDivElement | null>(null)
  const [medido, setMedido] = React.useState(false)

  // O marcador do trilho viaja até o passo ativo — a mecânica do `Tabs`: a
  // caixa é medida (`offsetTop`/`offsetHeight`, relativos à lista) e escrita
  // em variáveis, e o marcador transiciona para elas. Antes da primeira
  // medição ele não transiciona, senão nasceria viajando do topo.
  useIsomorphicLayoutEffect(() => {
    const lista = listaRef.current
    if (!lista || orientation !== "vertical") return
    const medir = () => {
      const ativo = lista.querySelector<HTMLElement>(
        '[data-slot="carousel-step"][aria-current="step"]'
      )
      if (!ativo) return
      lista.style.setProperty("--steps-y", `${ativo.offsetTop}px`)
      lista.style.setProperty("--steps-h", `${ativo.offsetHeight}px`)
      setMedido(true)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(lista)
    for (const passo of lista.children) observador.observe(passo)
    return () => observador.disconnect()
  }, [orientation, selectedIndex])

  const vertical = orientation === "vertical"

  return (
    <StepsContext.Provider value={{ orientation }}>
      <div
        ref={listaRef}
        role="group"
        aria-label="Passos"
        data-slot="carousel-steps"
        data-orientation={orientation}
        className={cn(
          vertical
            ? "relative flex flex-col border-s border-border"
            : "flex flex-wrap items-center gap-1.5",
          className
        )}
        {...props}
      >
        {children}
        {vertical ? (
          <span
            aria-hidden="true"
            data-slot="carousel-steps-indicator"
            className={cn(
              "pointer-events-none absolute -start-px top-0 w-0.5 rounded-full bg-foreground",
              "translate-y-(--steps-y) h-(--steps-h)",
              medido &&
                "transition-[translate,height] duration-(--duration-spring) ease-(--ease-spring)"
            )}
          />
        ) : null}
      </div>
    </StepsContext.Provider>
  )
}

function CarouselStep({
  index,
  label,
  description,
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  /** A posição do slide que este passo abre. */
  index: number
  label: React.ReactNode
  /** Só na vertical, e só no passo ativo. */
  description?: React.ReactNode
}) {
  const { selectedIndex, scrollTo, autoplay } = useCarousel()
  const { orientation } = React.useContext(StepsContext)
  const ativo = index === selectedIndex
  const numero = String(index + 1).padStart(2, "0")

  if (orientation === "vertical") {
    return (
      <button
        type="button"
        data-slot="carousel-step"
        aria-current={ativo ? "step" : undefined}
        onClick={(e) => {
          scrollTo(index)
          onClick?.(e)
        }}
        className={cn(
          "group/step flex w-full items-start gap-3 border-b border-border py-5 ps-6 pe-2 text-start outline-none last:border-b-0",
          "focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-inset",
          className
        )}
        {...props}
      >
        <span className="nums pt-1.5 text-2xs text-muted-foreground">/{numero}</span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "text-xl font-medium tracking-tight transition-colors duration-(--duration-base) ease-(--ease-out)",
              ativo
                ? "text-foreground"
                : "text-muted-foreground group-hover/step:text-foreground group-active/step:text-foreground"
            )}
          >
            {label}
          </span>
          {description ? (
            // A descrição abre só no ativo: `grid-rows` de 0fr a 1fr anima a
            // altura sem medir nada, na mola da casa.
            <span
              className={cn(
                "grid transition-[grid-template-rows] duration-(--duration-spring) ease-(--ease-spring)",
                ativo ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <span className="overflow-hidden">
                <span className="block pt-2 text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
            </span>
          ) : null}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      data-slot="carousel-step"
      aria-current={ativo ? "step" : undefined}
      onClick={(e) => {
        scrollTo(index)
        onClick?.(e)
      }}
      className={cn(
        "group/step relative inline-flex h-8 items-center gap-2 overflow-hidden rounded-full ps-1 pe-3 text-xs font-medium outline-none",
        "transition-colors duration-(--duration-base) ease-(--ease-out)",
        "focus-visible:ring-3 focus-visible:ring-ring/45 pointer-coarse:h-11",
        ativo
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/60 active:text-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "nums grid size-6 place-items-center rounded-full text-2xs",
          ativo ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        )}
      >
        {index + 1}
      </span>
      {label}
      {ativo && autoplay.ativo ? (
        // O relógio do autoplay, como um fio na base da pílula ativa.
        <span
          key={selectedIndex}
          aria-hidden="true"
          className="carousel-timer absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground/60"
        />
      ) : null}
    </button>
  )
}

/**
 * A tira de miniaturas de uma galeria — a referência do skate: a imagem
 * grande em cima, e embaixo as miniaturas que a escolhem.
 *
 * É um **segundo embla**, livre (`dragFree`), sincronizado com o principal
 * nos dois sentidos pelo contexto do `Carousel`: escolher uma miniatura rola o
 * principal, e rolar o principal traz a miniatura ativa para a vista. Quem
 * põe as setas nas pontas é uma `CarouselToolbar` com `CarouselPrevious` e
 * `CarouselNext` em `placement="inline"`.
 *
 * Arrastar a tira não escolhe a miniatura em que o arrasto termina: o embla 8
 * cancela sozinho o clique que vem de um arrasto.
 */

function CarouselThumbs({
  className,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * `vertical`: a coluna ao lado da foto, **a partir de `md`** — abaixo dele
   * ela deita embaixo, porque uma coluna de 80px come a foto no telefone. O
   * eixo troca pelo `breakpoints` do embla, e a coluna não mede nada
   * (`contain: size`): quem dá a altura é a foto, na mesma linha da grade.
   */
  orientation?: "horizontal" | "vertical"
}) {
  const { selectedIndex } = useCarousel()
  const vertical = orientation === "vertical"
  const [ref, api] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    ...(vertical && { breakpoints: { [UNTIL_QUERY.md]: { axis: "y" } } }),
  })

  React.useEffect(() => {
    api?.scrollTo(selectedIndex)
  }, [api, selectedIndex])

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Miniaturas"
      data-slot="carousel-thumbs"
      data-orientation={orientation}
      className={cn(
        "min-w-0 flex-1 overflow-hidden",
        vertical && "md:[contain:size]",
        className
      )}
      {...props}
    >
      {/* O recuo dá lugar ao anel de foco e ao da seleção, que o recorte do
            viewport cortaria rente à borda. */}
      <div className={cn("flex gap-2 p-1", vertical && "md:flex-col")}>{children}</div>
    </div>
  )
}

function CarouselThumb({
  index,
  className,
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  /** A posição do slide que esta miniatura abre. */
  index: number
}) {
  const { selectedIndex, scrollTo } = useCarousel()
  const ativa = index === selectedIndex

  return (
    <button
      type="button"
      data-slot="carousel-thumb"
      aria-label={`Ir para o item ${index + 1}`}
      aria-current={ativa ? "true" : undefined}
      onClick={(e) => {
        scrollTo(index)
        onClick?.(e)
      }}
      className={cn(
        "h-12 w-16 shrink-0 overflow-hidden rounded-md outline-none",
        "[&_img]:size-full [&_img]:object-cover",
        "transition-[opacity,box-shadow] duration-(--duration-base) ease-(--ease-out)",
        "focus-visible:ring-3 focus-visible:ring-ring/45",
        ativa
          ? "opacity-100 ring-2 ring-primary-accent ring-offset-2 ring-offset-background"
          : "opacity-55 hover:opacity-100 active:opacity-100",
        className
      )}
      {...props}
    />
  )
}

/**
 * A barra de rolagem da tira — quanto já passou, e quanto cabe de uma vez.
 *
 * É o indicador do arraste livre (`snap="free"`), onde pontos mentem: não há
 * "item 3" quando a tira para em qualquer lugar. O polegar tem a largura da
 * fração visível (viewport sobre trilho) e anda com `scrollProgress()` do
 * embla. Decorativa (`aria-hidden`): a posição falada é a do
 * `CarouselStatus`. Some quando tudo cabe. Horizontal, e sem `loop` — no
 * laço o progresso dá a volta e o polegar saltaria de uma ponta à outra.
 */
function CarouselProgress({ className, ...props }: React.ComponentProps<"div">) {
  const { api } = useCarousel()
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const no = ref.current
    if (!api || !no) return
    const escrever = () => {
      const trilho = api.containerNode()
      const fracao = Math.min(1, api.rootNode().clientWidth / Math.max(1, trilho.scrollWidth))
      const progresso = Math.min(1, Math.max(0, api.scrollProgress()))
      no.style.setProperty("--carousel-progress-w", `${fracao * 100}%`)
      // `translate` em % é da largura do próprio polegar: andar a pista toda
      // é `(1/fração − 1)` larguras.
      no.style.setProperty(
        "--carousel-progress-x",
        `${progresso * (1 / fracao - 1) * 100}%`
      )
      if (fracao >= 1) no.dataset.empty = ""
      else delete no.dataset.empty
    }
    escrever()
    api.on("scroll", escrever)
    api.on("reInit", escrever)
    api.on("resize", escrever)
    return () => {
      api.off("scroll", escrever)
      api.off("reInit", escrever)
      api.off("resize", escrever)
    }
  }, [api])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="carousel-progress"
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted data-empty:invisible",
        ESCONDE_NA_GRADE,
        className
      )}
      {...props}
    >
      <div className="h-full w-(--carousel-progress-w) translate-x-(--carousel-progress-x) rounded-full bg-primary-accent" />
    </div>
  )
}

/**
 * O carrossel carregando, na forma que ele vai ter: o mesmo `basis` e a
 * mesma calha, para a tira não pular quando o dado chega. Fica **fora** de um
 * `<Carousel>` — não há o que rolar —, e é um `SkeletonGroup`: a região
 * anuncia "Carregando…" e os ossos ficam calados. O osso de cada item é um
 * `CardSkeleton` sem barra, ou o que vier em `children`.
 */
function CarouselSkeleton({
  count = 3,
  gap = DEFAULT_GAP,
  itemClassName = "basis-2/3 sm:basis-1/3",
  className,
  children,
  ...props
}: React.ComponentProps<typeof SkeletonGroup> & {
  /** Quantos itens desenhar — o bastante para vazar da borda. */
  count?: number
  gap?: CarouselGap
  /** O `basis` do item real. */
  itemClassName?: string
}) {
  return (
    <SkeletonGroup
      data-slot="carousel-skeleton"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <div className={cn("flex", GAP_CLASSES.horizontal[gap].track)}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "min-w-0 shrink-0 grow-0",
              GAP_CLASSES.horizontal[gap].item,
              itemClassName
            )}
          >
            {children ?? <CardSkeleton toolbar={false} lines={2} />}
          </div>
        ))}
      </div>
    </SkeletonGroup>
  )
}

/**
 * O último item é o caminho para a lista — "Ver todos" —, e o fim da tira
 * deixa de ser parede. É um item de verdade (entra na contagem e no teclado),
 * com a superfície do lugar vazio (`Card variant="dashed"`) clicável.
 *
 * O filho é o link (`<Link href>`), que recebe a superfície por `asChild`; a
 * seta e a contagem entram em volta do texto dele.
 */
function CarouselMore({
  count,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CarouselItem>, "children"> & {
  /** O total da lista, dito embaixo ("12 no total"). */
  count?: number
  /** O link, com o texto: `<Link href="/credit-cards">Ver todos</Link>`. */
  children: React.ReactElement
}) {
  return (
    <CarouselItem data-more="" {...props}>
      <Card
        variant="dashed"
        interactive
        asChild
        className="h-full min-h-28 items-center justify-center gap-1.5 text-center font-medium text-foreground"
      >
        <Slot.Root data-slot="carousel-more">
          <span className="grid size-8 place-items-center rounded-full bg-muted" aria-hidden="true">
            <ArrowRightIcon className="size-4" />
          </span>
          <Slot.Slottable>{children}</Slot.Slottable>
          {count != null ? (
            <Caption className="nums font-normal">{count} no total</Caption>
          ) : null}
        </Slot.Root>
      </Card>
    </CarouselItem>
  )
}

/**
 * A galeria em tela cheia: o botão de expandir no canto da foto e um `Dialog`
 * com outro `Carousel` dentro, que **abre no item atual** (`startIndex`) e
 * devolve o índice ao fechar — o principal salta, sem animação, para onde a
 * pessoa parou. Os itens vêm em `children` outra vez, porque em tela cheia a
 * foto é outra: inteira (`object-contain`), e não recortada.
 *
 * As setas do teclado andam na tela cheia de qualquer foco: o diálogo abre com
 * o foco no ×, fora da região, e sem isto o teclado só voltaria a andar
 * depois de tabular até ela.
 */
function CarouselFullscreen({
  title = "Imagens",
  className,
  children,
}: {
  /** O nome do diálogo e da região. */
  title?: string
  className?: string
  /** Os `CarouselItem` da tela cheia. */
  children: React.ReactNode
}) {
  const { api: principal, selectedIndex } = useCarousel()
  const [interna, setInterna] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (!interna) return
    const devolver = () => principal?.scrollTo(interna.selectedScrollSnap(), true)
    interna.on("select", devolver)
    return () => {
      interna.off("select", devolver)
    }
  }, [interna, principal])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="tertiary"
          size="icon-sm"
          data-slot="carousel-fullscreen-trigger"
          className={cn(
            menuPanelTintClassName,
            "absolute end-2 top-2 z-10 rounded-full shadow-sm ring-1 ring-foreground/10",
            CONTROL_TOUCH_TARGET,
            className
          )}
        >
          <ArrowsPointingOutIcon />
          <span className="sr-only">Ver em tela cheia</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        data-slot="carousel-fullscreen"
        // Opaca nos dois temas: a placa modal é vidro (85% no claro, 40% no
        // escuro), e atrás de uma foto em tela cheia a página não pode aparecer.
        className="flex h-dvh max-h-none w-screen max-w-none flex-col justify-center rounded-none bg-background p-0 ring-0 sm:max-w-none dark:bg-background"
        onKeyDown={(e) => {
          // Dentro da região a captura já andou e marcou o evento.
          if (e.defaultPrevented) return
          if (e.key === "ArrowLeft") interna?.scrollPrev()
          else if (e.key === "ArrowRight") interna?.scrollNext()
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Carousel
          opts={{ startIndex: selectedIndex }}
          setApi={setInterna}
          gap="none"
          fade={false}
          aria-label={title}
          className="w-full"
        >
          <CarouselContent>{children}</CarouselContent>
          <CarouselPrevious appearance="glass" />
          <CarouselNext appearance="glass" />
          <CarouselStatus placement="overlay" />
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}

export {
  type CarouselApi,
  type CarouselEffect,
  CarouselToolbar,
  CarouselCaption,
  CarouselFullscreen,
  CarouselMore,
  CarouselProgress,
  CarouselSkeleton,
  CarouselPlayPause,
  CarouselStep,
  CarouselSteps,
  CarouselThumb,
  CarouselThumbs,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  CarouselStatus,
  carouselVariants,
  useCarousel,
  GAP_CLASSES as carouselGapClasses,
  CONTROL_POSITION as carouselControlPosition,
  CONTROL_TOUCH_TARGET as carouselControlTouchTarget,
  CONTROL_TRANSITION as carouselControlTransition,
  CONTROL_PRESS_FIX as carouselControlPressFix,
  DEFAULT_GAP as carouselDefaultGap,
  EFFECT_CLASSES as carouselEffectClasses,
  ITEM_HOVER as carouselItemHover,
  UNTIL_TRACK as carouselUntilTrack,
}
