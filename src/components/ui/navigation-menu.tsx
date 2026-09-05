"use client"

import * as React from "react"
import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import {
  menuItemGeometryClassName,
  menuLabelClassName,
  menuPanelSurfaceClassName,
} from "@/lib/menu-classes"
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"

/**
 * A fileira de navegação com painéis suspensos.
 *
 * ## O que ele é, e onde ele é a resposta certa
 *
 * A navegação **deste app** é a `Sidebar` no desktop e a ilha na base no
 * telefone, e continua sendo — um terceiro lugar onde procurar a mesma tela é
 * um a mais. Este componente é o cabeçalho de uma superfície **pública**:
 * landing, preços, institucional. Ali a `Sidebar` não serve, porque quem chega
 * não tem sessão e a tela inteira é o argumento.
 *
 * ## `aria-expanded:` e não `data-open:`, e a razão é especificidade
 *
 * No Tailwind 4.2.2 o variante `data-open:` compila para
 * `:where([data-open]:not([data-open=false])), :where([data-state=open])` —
 * **zero especificidade**, medido no CSS emitido. Ele perde para `hover:`
 * (0,2,0), que mora no mesmo elemento. Em `variant="solid"` isso é visível:
 * passar o cursor sobre um gatilho **aberto** o derrubaria de `bg-background`
 * para `/60`, ou seja o realce de aberto desapareceria justo quando a pessoa
 * está apontando para ele.
 *
 * O Radix carimba `aria-expanded` no gatilho (além de `data-state`), e
 * `.classe[aria-expanded="true"]` é 0,2,0 — seletor de atributo de verdade. É
 * a mesma saída que o [`Menubar`](./menubar.tsx) já usa. `data-open:` fica onde
 * não há disputa: nas animações da superfície.
 *
 * ## O marcador já viajava, e faltava uma classe
 *
 * O `Indicator` do Radix posiciona-se sozinho a partir de
 * `offsetLeft`/`offsetWidth` do gatilho ativo, com `ResizeObserver` próprio, e
 * já entende a vertical. O mecanismo que a rodada do `Tabs` construiu à mão
 * **já está pago aqui**. O que faltava era a transição: sem ela, um marcador só
 * pisca de aba em aba, que é o mesmo nada que três marcadores acendendo e
 * apagando.
 *
 * Por isso ele deixou de ser peça que o consumidor lembra de escrever e virou
 * eixo: a fileira o monta quando `indicator !== "none"`.
 *
 * ## O teto mora no painel, e não no viewport
 *
 * O Radix expõe **duas** variáveis aqui — `--radix-navigation-menu-viewport-height`
 * e `-width` — e nenhuma `available-height`. Mas ele calcula a primeira a partir
 * do `offsetHeight` do conteúdo: capar o **conteúdo** devolve a altura já capada,
 * e o viewport anima para o número certo sem `max-h` nenhum.
 *
 * De brinde, isso satisfaz a invariante 2 do `scroll-fade` de graça — o
 * `NavigationMenuPanel` não desenha nada, quem desenha é o viewport —, então a
 * dissolução das bordas pode morar nele sem apagar fio nem sombra.
 */

type NavigationMenuVariant = "plain" | "outline" | "solid"
type NavigationMenuSize = "sm" | "md" | "lg"
type NavigationMenuIndicator = "none" | "arrow" | "underline"
type NavigationMenuAlign = "trigger" | "start" | "center" | "end"
type NavigationMenuOrientation = "horizontal" | "vertical"

/**
 * O padrão do marcador sai do outro eixo, e não de uma preferência.
 *
 * Com viewport há **um** painel compartilhado, longe do gatilho que o abriu: a
 * seta é o que liga os dois, e sem ela o painel aparece órfão no meio da linha.
 * Sem viewport o painel nasce embaixo do próprio item, encostado nele — a seta
 * repetiria uma informação que a geometria já dá.
 *
 * O precedente é `defaultTabsSize(variant)` e o `stretch ?? variant === "solid"`
 * do mesmo arquivo: derivar é melhor que cravar, e a derivação fica exportada
 * para ser inspecionável em vez de enterrada numa expressão.
 */
export function defaultNavigationMenuIndicator(
  viewport: boolean
): NavigationMenuIndicator {
  return viewport ? "arrow" : "none"
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

const NavigationMenuContext = React.createContext<{
  size: NavigationMenuSize
  variant: NavigationMenuVariant
  indicator: NavigationMenuIndicator
  align: NavigationMenuAlign
  orientation: NavigationMenuOrientation
  viewport: boolean
  /** Se `--navigation-menu-anchor-c*` já foi escrita. Antes disso o painel centra na fileira. */
  anchored: boolean
}>({
  size: "md",
  variant: "plain",
  indicator: "arrow",
  align: "center",
  orientation: "horizontal",
  viewport: true,
  anchored: false,
})

/**
 * Se este link está dentro de um `NavigationMenuPanel` — que é um `<ul>`, e por
 * isso quer o `<li>` que o link passa a trazer sozinho.
 *
 * É o que torna `<ul>` sem `<li>` impossível de escrever: antes o consumidor
 * montava a lista à mão, e a página deste catálogo montava errado.
 */
const NavigationMenuPanelContext = React.createContext(false)

/**
 * Nota de ordem: `npm run ds:catalog` lê o **primeiro** bloco `variants:` de
 * cada fonte, e é por isso que o do gatilho vem antes do da fileira — ele
 * carrega `variant` **e** `size`, enquanto o da fileira só repetiria `variant`.
 * O precedente é o `itemVariants`, que subiu para o topo do `item.tsx` pela
 * mesma razão. Nenhum dos dois carrega decisão pela posição.
 */
/**
 * O gatilho, na escada do sistema: 28 · 32 · 36, os mesmos nomes e os mesmos
 * números do `Button`, do `Input`, do `Tabs` e do `Menubar`. Botão ao lado de
 * gatilho alinha sem ninguém dizer `size`.
 *
 * `pointer-coarse:h-10` pergunta pelo **apontador** e não pela largura, como o
 * item de menu e o `Calendar` já fazem: um telefone em paisagem continua grosso,
 * um desktop estreito continua fino.
 */
const navigationMenuTriggerVariants = cva(
  [
    "group/navigation-menu-trigger flex shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap outline-hidden select-none",
    "transition-colors",
    "focus-visible:ring-3 focus-visible:ring-ring/70",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        plain:
          "hover:bg-muted active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        outline:
          "hover:bg-muted active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        solid:
          "border border-transparent hover:bg-background/60 active:bg-background/60 aria-expanded:border-border/80 aria-expanded:bg-background aria-expanded:text-foreground aria-expanded:shadow-xs",
      },
      /** O piso é 28: `xs` (24) é para dentro de outro controle, não para uma fileira. */
      size: {
        sm: "h-7 pointer-coarse:h-10",
        md: "h-8 pointer-coarse:h-10",
        lg: "h-9 pointer-coarse:h-10",
      },
    },
    defaultVariants: { variant: "plain", size: "md" },
  }
)

/**
 * A fileira. As três superfícies são **as três strings do `Menubar`**, e isso é
 * convergência e não invenção: uma fileira de gatilhos que se percorre com a
 * seta é o mesmo objeto, e duas palavras para a mesma coisa é o que a rodada
 * dos menus existiu para acabar.
 *
 * `plain` mantém `border-transparent` de propósito — a caixa fica idêntica nas
 * três, então trocar de variante não move um pixel do que está em volta.
 *
 * Ela **não declara altura**: quem mede é o gatilho, e a fileira cresce em
 * volta. Ancorar a escada no contêiner é o defeito que esta base já cometeu
 * quatro vezes — `Menubar` entregou 24, `Tabs` entregou 27, `Item` teve dois
 * degraus com a mesma string, `Calendar` entregou 28.
 */
const navigationMenuListVariants = cva(
  [
    "flex list-none items-center gap-0.5 rounded-lg p-0.5",
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
  ],
  {
    variants: {
      variant: {
        plain: "border border-transparent bg-transparent",
        outline: "border border-border bg-background",
        solid: "border border-transparent bg-muted",
      },
    },
    defaultVariants: { variant: "plain" },
  }
)

/**
 * O marcador. A transição é o componente inteiro: o Radix já escreve a caixa do
 * gatilho ativo em `transform`/`width`/`height` inline, e é ela que transforma
 * teleporte em trajeto.
 *
 * Movimento reduzido não precisa de regra própria — o bloco global encurta
 * transições para 0,01ms, o marcador salta, e o estado final chega igual.
 */
const navigationMenuIndicatorVariants = cva(
  [
    "group/navigation-menu-indicator pointer-events-none",
    "transition-[transform,width,height] duration-(--duration-base) ease-(--ease-out)",
    "data-[state=visible]:animate-in data-[state=visible]:fade-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out",
  ],
  {
    variants: {
      indicator: {
        none: "hidden",
        arrow: [
          "flex overflow-hidden",
          "data-[orientation=horizontal]:top-full data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:items-start data-[orientation=horizontal]:justify-center",
          "data-[orientation=vertical]:left-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:items-center data-[orientation=vertical]:justify-start",
        ].join(" "),
        underline: [
          "rounded-full bg-primary-accent",
          "data-[orientation=horizontal]:top-full data-[orientation=horizontal]:h-0.5",
          "data-[orientation=vertical]:left-full data-[orientation=vertical]:w-0.5",
        ].join(" "),
      },
    },
    defaultVariants: { indicator: "arrow" },
  }
)

/**
 * O conteúdo. Ele tem duas formas, e o eixo é lido do **contexto** em vez de
 * escrito como `group-data-[viewport=false]/navigation-menu:` doze vezes — que
 * era como o arquivo fazia, em uma string de 1.400 caracteres.
 *
 * Com viewport ele é só a lâmina que desliza dentro de uma superfície que já
 * existe. Sem viewport ele **é** a superfície, e veste
 * `menuPanelSurfaceClassName` em vez de reescrever a receita.
 */
const navigationMenuContentVariants = cva(
  [
    "w-full",
    "data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out",
    "data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52",
    "data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52",
    "duration-(--duration-instant)",
  ],
  {
    variants: {
      viewport: {
        true: "top-0 left-0 md:absolute md:w-auto",
        false: [
          "absolute top-full z-(--z-popover) mt-2 overflow-hidden md:w-auto",
          menuPanelSurfaceClassName,
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        ].join(" "),
      },
      align: { trigger: "", start: "", center: "", end: "" },
    },
    compoundVariants: [
      // O item deixou de ser `relative` (ver `NavigationMenuItem`), então este
      // absoluto tem o mesmo bloco contentor do marcador e do viewport: a mesma
      // variável medida serve os dois modos.
      {
        viewport: false,
        align: "trigger",
        class: "left-(--navigation-menu-anchor-cx) -translate-x-1/2",
      },
      { viewport: false, align: "start", class: "left-0" },
      { viewport: false, align: "center", class: "left-1/2 -translate-x-1/2" },
      { viewport: false, align: "end", class: "right-0" },
    ],
    defaultVariants: { viewport: true, align: "trigger" },
  }
)

/**
 * O painel: a grade dentro do conteúdo, o recuo, o teto e a rolagem.
 *
 * A largura é variável e não classe porque as três contagens de coluna precisam
 * concordar com ela; o teto de altura também, e é o precedente do
 * `--command-list-max-h` — quem declara o teto é a casca do que rola.
 *
 * `max-w` existe porque um painel de três colunas num laptop de 13" é mais
 * largo que a janela, e um mega-menu que sangra para fora da tela é pior que um
 * que quebra em duas colunas.
 */
const navigationMenuPanelVariants = cva(
  [
    "grid w-(--navigation-menu-panel-w) max-w-(--navigation-menu-panel-max-w) gap-0.5 p-1",
    "max-h-(--navigation-menu-panel-max-h) overflow-y-auto overscroll-contain",
    // O teto de largura é **medido**, e a variável mora na raiz — ver
    // `limite()`. Declarar o padrão dela aqui seria declará-la no mesmo
    // elemento que a lê, e o valor local vence o herdado: medido, o
    // `max-width` computado saía **884px** (`100vw` menos um respiro) enquanto
    // a raiz publicava **304**. O padrão está na casca.
    "[--navigation-menu-panel-max-h:min(60dvh,32rem)]",
  ],
  {
    variants: {
      columns: {
        // **A largura de uma coluna sai do conteúdo, não do consumidor.**
        //
        // Com linhas, 224 — o degrau mais largo que o `DropdownMenuContent`
        // oferece (auto · 176 · 192 · 208 · 224). Antes eram 288, mais largo
        // que qualquer menu do sistema: medido, sobravam 175px de vazio numa
        // linha cujo rótulo mais longo mede 101.
        //
        // Com **cartões**, 288 — e o número é derivado, não escolhido. Um
        // cartão é ícone (20) + calha (10) + texto, dentro de `p-2.5` (20) e do
        // `p-1` do painel (8): 58px de cromagem. A descrição mais larga da
        // página pede **209** sem quebrar, e 209 + 58 = 267. Os 288 do degrau
        // acima dão **245** de texto — exatamente o que a coluna do mega-menu
        // de duas já dá (295 de coluna, 245 de texto), onde as seis descrições
        // cabem em uma linha. **A coluna de cartões mede o mesmo em 1, 2 ou 3
        // colunas.** A 224 sobravam 166, e a descrição quebrava em três linhas
        // com uma palavra órfã.
        //
        // O `has-` é o mecanismo do `Popover` (`has-[[data-slot=popover-body]]`)
        // e do próprio cartão logo abaixo (`has-[>svg]`): quem decide é o que
        // está dentro. Ele é `&:has(…)` — 0,2,0 contra os 0,1,0 da classe base,
        // no mesmo elemento —, então vence sem `!important` e sem ordem.
        1: "[--navigation-menu-panel-w:--spacing(56)] has-[[data-variant=card]]:[--navigation-menu-panel-w:--spacing(72)]",
        2: "[--navigation-menu-panel-w:--spacing(150)] sm:grid-cols-2",
        3: "[--navigation-menu-panel-w:--spacing(216)] sm:grid-cols-2 lg:grid-cols-3",
      },
    },
    defaultVariants: { columns: 1 },
  }
)

/**
 * O que todo link da fileira tem, esteja no topo ou dentro do painel.
 *
 * O anel de foco **fica**. O arquivo anterior o apagava de dentro do painel com
 * `**:…[navigation-menu-link]:focus:ring-0` mais `focus:outline-none`, e o
 * resultado era teclado invisível exatamente onde o teclado é o caminho normal:
 * com o mouse o foco nunca entra no painel, então o defeito só existia para
 * quem navega com Tab.
 */
const NAVIGATION_MENU_LINK_BASE = [
  "group/navigation-menu-link relative min-w-0 outline-hidden select-none",
  "transition-colors",
  "focus-visible:ring-3 focus-visible:ring-ring/70",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0",
].join(" ")

/**
 * **O link do topo veste a régua do gatilho.** Numa fileira real, "Preços" (um
 * link) fica ao lado de "Produto" (um gatilho com painel), e os dois têm de
 * medir igual — não por coincidência, mas porque leem o mesmo `size`. Compor
 * `navigationMenuTriggerVariants` em vez de repetir a escada é o que garante
 * que eles não possam divergir no dia em que um degrau mudar.
 *
 * Só o realce de rota atual é próprio, e ele é `aria-[current=page]:` e não
 * `data-active:` **pela mesma aritmética que trocou o gatilho**: o variante
 * `data-*` compila com `:where()` (0,1,0) e perderia para o `hover:` (0,2,0)
 * que mora no mesmo elemento — o item da página em que a pessoa está apagaria
 * ao ser apontado. O Radix escreve os dois atributos juntos quando o link
 * recebe `active`.
 */
const navigationMenuTopLinkVariants = cva(NAVIGATION_MENU_LINK_BASE, {
  variants: {
    variant: {
      plain:
        "aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
      outline:
        "aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
      solid:
        "aria-[current=page]:border-border/80 aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-xs",
    },
  },
  defaultVariants: { variant: "plain" },
})

/**
 * O link dentro do painel, em duas formas.
 *
 * `row` é a linha de menu: um rótulo, talvez um ícone. `card` é a forma que
 * todo mega-menu real tem — ícone, título e uma linha do que aquilo é —, e ela
 * existe sobretudo para **trancar o par de identidade**: título e descrição são
 * o mesmo dado em duas linhas, quem os separa é a entrelinha, e `gap-y-0` é o
 * que impede o `gap-1` que quem escreve a tela escreveria. Foi assim que
 * `ItemContent`, `StatCard`, `FieldContent` e `PageHeaderTitleRow` foram pegos,
 * quatro vezes, com a documentação já dizendo o contrário do código.
 *
 * A coluna do ícone só nasce quando há ícone (`has-[>svg]:`) — senão o título e
 * a descrição cairiam lado a lado em vez de empilhados.
 */
const navigationMenuLinkVariants = cva(
  [
    NAVIGATION_MENU_LINK_BASE,
    "rounded-md text-sm pointer-coarse:min-h-11",
    "hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground",
    "aria-[current=page]:bg-accent/60 aria-[current=page]:font-medium",
  ],
  {
    variants: {
      variant: {
        // **O corpo é o dos outros menus, e não um parecido.** Ele estava
        // reimplementado aqui 4px mais alto e mais folgado — `px-2 py-1.5
        // gap-2` contra `px-1.5 py-1 gap-1.5` —, quando
        // `menuItemGeometryClassName` existe exatamente para as superfícies de
        // comando medirem igual: `DropdownMenu`, `ContextMenu`, `Menubar` e
        // `Command` já a vestem.
        //
        // `cursor-pointer` é a **única** contra-classe: a régua traz
        // `cursor-default`, que é o certo para um `role="menuitem"` e o errado
        // para um `<a href>`.
        row: cn(menuItemGeometryClassName, "cursor-pointer"),
        card: [
          "grid grid-cols-1 gap-y-0 p-2.5",
          "has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:gap-x-2.5",
          "[&>svg]:row-span-2 [&>svg]:mt-0.5 [&>svg:not([class*='size-'])]:size-5 [&>svg]:text-muted-foreground",
          "hover:[&>svg]:text-accent-foreground active:[&>svg]:text-accent-foreground",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "row" },
  }
)

/**
 * ## O painel segue o gatilho, e por que isso precisou de medição
 *
 * Com viewport há **um** painel para a fileira inteira, e o Radix não o desloca:
 * ele nasce onde a casca o ancorar. Ancorado na fileira — que é o que
 * `start`/`center`/`end` fazem —, abrir o **segundo** gatilho põe o painel no
 * mesmo lugar em que o primeiro o pusera, e a leitura é a de um menu que abriu
 * o painel errado. Pior com `indicator="arrow"`: a seta fica sobre o gatilho
 * certo e o painel fica em outro lugar, então as duas peças apontam para
 * direções diferentes.
 *
 * `align="trigger"` — o padrão — mede o gatilho aberto e publica o **centro**
 * dele em `--navigation-menu-anchor-cx` / `-cy`; o painel centra ali. A seta
 * passa a cair no meio da borda de cima do painel, que é o único lugar em que
 * um bico de balão faz sentido.
 *
 * O mecanismo é o do marcador do `Tabs`: `ResizeObserver` na raiz e nos
 * gatilhos, `MutationObserver` em `data-state` — nada de laço por quadro. A
 * diferença é que aqui a leitura é por `getBoundingClientRect` e não por
 * `offsetLeft`: o `NavigationMenuItem` é `relative`, então ele **é** o
 * `offsetParent` do gatilho e `offsetLeft` daria zero. A troca é segura porque
 * esta raiz não rola por dentro — foi a rolagem que obrigou o `Tabs` a fazer o
 * contrário.
 *
 * Ao fechar, a âncora **não** é recalculada: o painel sai animando, e mover o
 * ponto de fuga no meio da saída é um salto.
 */
function NavigationMenu({
  className,
  children,
  ref,
  variant = "plain",
  size = "md",
  align = "trigger",
  orientation = "horizontal",
  indicator,
  viewport = true,
  ...props
}: Omit<
  React.ComponentProps<typeof NavigationMenuPrimitive.Root>,
  "orientation"
> & {
  variant?: NavigationMenuVariant
  size?: NavigationMenuSize
  align?: NavigationMenuAlign
  orientation?: NavigationMenuOrientation
  indicator?: NavigationMenuIndicator
  viewport?: boolean
}) {
  const raizRef = React.useRef<HTMLElement | null>(null)
  const [anchored, setAnchored] = React.useState(false)
  const segueGatilho = align === "trigger"

  useIsomorphicLayoutEffect(() => {
    const raiz = raizRef.current
    if (!raiz || !segueGatilho) return

    let ultimoPainel: Element | null = null

    /**
     * O retângulo em que o painel precisa caber.
     *
     * **Não é a janela.** Esta é a única superfície ancorada do sistema que
     * **não é portalizada** — `Popover`, `Select`, `Tooltip` e os três menus
     * mandam o conteúdo para o `body` e escapam de qualquer `overflow`; o
     * viewport daqui é filho da raiz, então todo ancestral que recorta o
     * recorta. Medido dentro do `Preview` do catálogo: janela de 0 a 420, mas
     * o que de fato corta vai de **17 a 403** — o painel posto em `left: 8`
     * ficava com **9px fora**, e era isso que aparecia como "o dropdown está
     * cortado".
     *
     * É o mesmo trabalho que o `collisionBoundary` do Radix faz nas
     * primitivas Popper. Aqui ele é à mão porque esta primitiva não tem.
     */
    const limite = () => {
      let esquerda = 0
      let direita = window.innerWidth
      let n: HTMLElement | null = raiz.parentElement
      while (n && n !== document.body) {
        const cs = getComputedStyle(n)
        if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
          const r = n.getBoundingClientRect()
          esquerda = Math.max(esquerda, r.left)
          direita = Math.min(direita, r.right)
        }
        n = n.parentElement
      }
      return { esquerda, direita }
    }

    const medir = () => {
      const aberto = raiz.querySelector<HTMLElement>(
        '[data-slot="navigation-menu-trigger"][data-state="open"]'
      )
      if (!aberto) return
      const g = aberto.getBoundingClientRect()
      const r = raiz.getBoundingClientRect()
      const { esquerda, direita } = limite()
      let cx = g.left - r.left + g.width / 2

      // O painel nunca é mais largo que o espaço que sobra: sem este teto,
      // deslocar não resolve — não existe posição que torne visível o que não
      // cabe. Ele desce por variável, e o painel a lê.
      const folga = ANCHORED_COLLISION_PADDING
      const maxW = Math.max(0, direita - esquerda - folga * 2)
      raiz.style.setProperty("--navigation-menu-panel-max-w", `${maxW}px`)

      // O painel centra no gatilho, mas **não sai do retângulo**: um mega-menu
      // de 600px preso a um gatilho de 91 abriria 259px para fora — medido. O
      // trilho usa a mesma folga do `collisionPadding` das outras superfícies.
      // Quando o painel é mais largo que o próprio trilho a conta se inverte, e
      // aí ela é descartada em vez de espremer.
      const painel = raiz.querySelector(
        '[data-slot="navigation-menu-viewport"], [data-slot="navigation-menu-content"]'
      )
      if (painel) {
        // O Radix dimensiona o viewport **depois** de montá-lo, então o painel
        // entra no observador na primeira vez em que aparece; sem isso o clamp
        // rodaria uma vez só, com largura zero.
        if (painel !== ultimoPainel) {
          ultimoPainel = painel
          ro.observe(painel)
        }
        const w = painel.getBoundingClientRect().width
        if (w > 0) {
          const min = esquerda + folga - r.left + w / 2
          const max = direita - folga - r.left - w / 2
          if (min <= max) cx = Math.min(Math.max(cx, min), max)
        }
      }

      raiz.style.setProperty("--navigation-menu-anchor-cx", `${cx}px`)
      raiz.style.setProperty(
        "--navigation-menu-anchor-cy",
        `${g.top - r.top + g.height / 2}px`
      )
      setAnchored(true)
    }

    const ro = new ResizeObserver(medir)

    medir()

    ro.observe(raiz)
    for (const gatilho of raiz.querySelectorAll(
      '[data-slot="navigation-menu-trigger"]'
    )) {
      ro.observe(gatilho)
    }

    const mo = new MutationObserver(medir)
    mo.observe(raiz, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
      childList: true,
    })

    // A raiz é `w-fit`. Estreitar a janela pode não mudar a caixa dela, e aí
    // nenhum dos dois observadores acorda — mas o retângulo de recorte mudou.
    window.addEventListener("resize", medir)

    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", medir)
    }
  }, [segueGatilho, orientation, size, variant])

  const ctx = React.useMemo(
    () => ({
      size,
      variant,
      align,
      orientation,
      viewport,
      anchored: anchored && segueGatilho,
      indicator: indicator ?? defaultNavigationMenuIndicator(viewport),
    }),
    [size, variant, align, orientation, viewport, indicator, anchored, segueGatilho]
  )

  return (
    <NavigationMenuContext.Provider value={ctx}>
      <NavigationMenuPrimitive.Root
        ref={composeRefs(raizRef, ref)}
        data-slot="navigation-menu"
        data-variant={variant}
        data-size={size}
        data-align={align}
        data-orientation={orientation}
        data-viewport={viewport}
        orientation={orientation}
        className={cn(
          "relative flex w-fit max-w-full",
          // O padrão do teto do painel, para o quadro anterior à primeira
          // medição. `medir()` o sobrescreve inline, e o painel o herda.
          "[--navigation-menu-panel-max-w:100vw]",
          className
        )}
        {...props}
      >
        {children}
        {viewport ? <NavigationMenuViewport /> : null}
      </NavigationMenuPrimitive.Root>
    </NavigationMenuContext.Provider>
  )
}

function NavigationMenuList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  const { variant, indicator } = React.useContext(NavigationMenuContext)

  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(navigationMenuListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {indicator === "none" ? null : (
        <NavigationMenuIndicator indicator={indicator} />
      )}
    </NavigationMenuPrimitive.List>
  )
}

/**
 * **Ele não é `relative`, e isso é carga estrutural.**
 *
 * O `Indicator` do Radix se posiciona com `translateX(activeTrigger.offsetLeft)`,
 * e `offsetLeft` é medido contra o **`offsetParent`** — o ancestral posicionado
 * mais próximo. Com `relative` aqui, esse ancestral passa a ser o próprio
 * `<li>`, e `offsetLeft` vale **0 para todo gatilho**: o marcador nunca sai do
 * lugar. Medido, com o segundo gatilho aberto: seta em 45,5 e gatilho em 152,8,
 * **107,3px** de desalinho — e o primeiro gatilho acertava por acidente, porque
 * ali zero é o valor certo.
 *
 * Sem ele, o `offsetParent` volta a ser o `<div style="position:relative">` que
 * o Radix põe em volta da fileira, que é o mesmo bloco contentor do marcador e
 * do painel. Um posicionamento só, para as três peças.
 */
function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("min-w-0", className)}
      {...props}
    />
  )
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const { size, variant } = React.useContext(NavigationMenuContext)

  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="transition-[rotate] duration-(--duration-base) ease-(--ease-out) group-data-open/navigation-menu-trigger:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

/**
 * A seta é a **ponta do painel**, e não um objeto que aponta para ele.
 *
 * O que havia antes era um quadrado `bg-border` com `shadow-md` próprio: uma
 * cor diferente da superfície que ele encabeçava, e uma segunda sombra em cima
 * da que o painel já lança. Medido no tema escuro, ele dava **1,23:1 contra o
 * painel** — pouco para ler como peça, suficiente para ler como emenda.
 *
 * Agora é `bg-popover` com o mesmo `ring-foreground/10`: **1,00 contra o
 * painel**, ou seja nenhuma diferença, que é o número certo para um bico. Ele
 * não se destaca da página (1,10) e não deveria — quem o torna visível é o fio
 * e a sombra que o painel já tem, exatamente como num balão de fala.
 *
 * O recorte tem **2px a mais que a calha** de propósito: a base do bico passa
 * por baixo do painel (que vive em `--z-popover`, acima da fileira) em vez de
 * encostar nele. Sem isso, o `ring` do painel desenharia um fio reto
 * atravessando a base do bico, e as duas peças voltariam a ler como duas.
 */
function NavigationMenuIndicator({
  className,
  indicator = "arrow",
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator> & {
  indicator?: NavigationMenuIndicator
}) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(navigationMenuIndicatorVariants({ indicator }), className)}
      {...props}
    >
      {indicator === "arrow" ? (
        <span
          className={cn(
            "relative size-2 rotate-45 rounded-tl-xs bg-popover ring-1 ring-foreground/10",
            "group-data-[orientation=horizontal]/navigation-menu-indicator:top-1",
            "group-data-[orientation=vertical]/navigation-menu-indicator:left-1"
          )}
        />
      ) : null}
    </NavigationMenuPrimitive.Indicator>
  )
}

/**
 * Onde o painel se ancora. As três âncoras são decididas **em JavaScript**, e
 * não por `in-data-[orientation=…]:`, e a razão é a de sempre nesta base: `in-*`
 * compila com `:where()`, que não soma especificidade — o override de vertical
 * empataria com o `left-1/2` do alinhamento e quem decidiria seria a ordem de
 * emissão do Tailwind, não o que se escreveu.
 */
const VIEWPORT_ANCHOR: Record<
  NavigationMenuOrientation,
  Record<NavigationMenuAlign, string>
> = {
  horizontal: {
    trigger: "top-full left-(--navigation-menu-anchor-cx) -translate-x-1/2",
    start: "top-full left-0",
    center: "top-full left-1/2 -translate-x-1/2",
    end: "top-full right-0",
  },
  vertical: {
    trigger: "left-full top-(--navigation-menu-anchor-cy) -translate-y-1/2",
    start: "top-0 left-full",
    center: "top-1/2 left-full -translate-y-1/2",
    end: "bottom-0 left-full",
  },
}

/**
 * O viewport, e o wrapper que o alinha.
 *
 * O wrapper anterior era `absolute top-full left-0 … justify-center` — e o
 * `justify-center` não fazia nada, porque uma caixa absoluta sem largura já
 * encolhe até o conteúdo. Alinhar exige mexer na âncora, que é o que `align`
 * faz agora; a fileira de um cabeçalho encostado à direita finalmente tem como
 * abrir o painel para dentro da tela.
 *
 * Na vertical o painel voa para o lado, e não para baixo: uma coluna de
 * navegação com o painel embaixo da última linha não é um flyout, é um acordeão
 * mal desenhado.
 */
function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  const { align, orientation, anchored } = React.useContext(NavigationMenuContext)
  const vertical = orientation === "vertical"
  // Sem medida ainda não há âncora, e `left: var(--x)` indefinido cairia em
  // `auto`. O painel centra na fileira até o primeiro `medir()`.
  const ancora = align === "trigger" && !anchored ? "center" : align

  return (
    <div
      data-slot="navigation-menu-viewport-anchor"
      className={cn(
        "absolute isolate z-(--z-popover) flex",
        VIEWPORT_ANCHOR[orientation][ancora]
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden",
          vertical ? "ms-2 origin-left" : "mt-2 origin-top",
          menuPanelSurfaceClassName,
          "duration-(--duration-instant) md:w-(--radix-navigation-menu-viewport-width)",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  const { viewport, align, anchored } = React.useContext(NavigationMenuContext)
  // Mesma queda do viewport: sem medida, `left: var(--x)` cairia em `auto`.
  const ancora = align === "trigger" && !anchored ? "center" : align

  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        navigationMenuContentVariants({ viewport, align: ancora }),
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuPanel({
  className,
  columns = 1,
  ...props
}: React.ComponentProps<"ul"> &
  VariantProps<typeof navigationMenuPanelVariants>) {
  return (
    <NavigationMenuPanelContext.Provider value={true}>
      <ul
        ref={useScrollFade()}
        data-slot="navigation-menu-panel"
        data-columns={columns}
        className={cn(
          navigationMenuPanelVariants({ columns }),
          scrollFadeViewportClassName,
          className
        )}
        {...props}
      />
    </NavigationMenuPanelContext.Provider>
  )
}

/** O rótulo de grupo dentro do painel, na régua que os quatro menus já falam. */
function NavigationMenuSectionLabel({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="navigation-menu-section-label"
      className={cn(
        menuLabelClassName,
        "col-span-full pt-2 first:pt-0 [&:not(:first-child)]:mt-1",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuLink({
  className,
  variant = "row",
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link> &
  VariantProps<typeof navigationMenuLinkVariants>) {
  const inPanel = React.useContext(NavigationMenuPanelContext)
  const { size, variant: rowVariant } = React.useContext(NavigationMenuContext)

  const link = (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      data-variant={inPanel ? variant : "top"}
      className={cn(
        inPanel
          ? navigationMenuLinkVariants({ variant })
          : cn(
              navigationMenuTriggerVariants({ variant: rowVariant, size }),
              navigationMenuTopLinkVariants({ variant: rowVariant })
            ),
        className
      )}
      {...props}
    />
  )

  return inPanel ? <li className="min-w-0">{link}</li> : link
}

function NavigationMenuLinkTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-title"
      className={cn("truncate font-medium", className)}
      {...props}
    />
  )
}

function NavigationMenuLinkDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="navigation-menu-link-description"
      className={cn(
        "text-xs leading-snug text-muted-foreground group-hover/navigation-menu-link:text-accent-foreground/75 group-active/navigation-menu-link:text-accent-foreground/75",
        className
      )}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuPanel,
  NavigationMenuSectionLabel,
  NavigationMenuLink,
  NavigationMenuLinkTitle,
  NavigationMenuLinkDescription,
  navigationMenuListVariants,
  navigationMenuTriggerVariants,
  navigationMenuLinkVariants,
  navigationMenuTopLinkVariants,
  navigationMenuPanelVariants,
}
