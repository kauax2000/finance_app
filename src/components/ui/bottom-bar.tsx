"use client"

import * as React from "react"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { MOBILE_GLASS_SURFACE_CLASSNAME } from "@/lib/mobile-glass-surface"
import type { HeroIcon } from "@/types/navigation"
import { cn } from "@/lib/utils"

/**
 * A barra de baixo do telefone — a irmã do `TopBar`.
 *
 * Ela nasceu de **seis arquivos** em `components/layout/`: a casca, a aba, três
 * funções de classe, o material e o quadrado do FAB. Nenhum teste, e o
 * `ds:audit` reportando um achado no subsistema inteiro — porque a regra H
 * varre `className="…"` e ali tudo morava dentro de função.
 *
 * ## A altura é do degrau, e a área segura entra dentro da caixa
 *
 * `--bottom-bar-h` é publicada pelo eixo `labels`, como o `TopBar` publica
 * `--top-bar-h`. Ela **não** é token de CSS: uma altura que depende de um eixo
 * não pode morar em `globals.css`, senão são duas declarações que precisam
 * concordar. O que fica no tema é `--bottom-bar-margin`, que é o que a casca
 * precisa saber para reservar espaço.
 *
 * ## A casca não recebe eventos
 *
 * O `<nav>` cobre a largura toda e a folga de baixo; sem `pointer-events-none`
 * ele engoliria o toque na base da tela, fora da pílula. Quem recebe é a linha.
 *
 * ## O vidro é o da folha, e não o da barra
 *
 * A casa tem três réguas de vidro em `lib/` e esta não veste nenhuma:
 * `barSurfaceClassName` é `--background` a 95/60 e serve barra **rente** à
 * borda. Esta ilha **flutua com margem** — ela é superfície elevada sobre a
 * lista, e `--mobile-glass-bg` (55/45) é calibrado para exatamente isso. Trocar
 * deixaria a pílula quase opaca e mataria o efeito que justifica o borrão: numa
 * ilha você **quer** ver a lista correndo por baixo.
 *
 * ## A borda e o anel não são dois sinais para a mesma emenda
 *
 * O plano desta rodada mandava tirar o `ring-1 ring-border/20`, alegando três
 * separadores onde bastariam dois. **A medição reverteu**, e o número é o que
 * decide:
 *
 * | | borda sobre o corpo | anel sobre o corpo |
 * | --- | --- | --- |
 * | claro | **1,007** | é o único que desenha |
 * | escuro | **1,117** | 1,042 |
 *
 * `--mobile-glass-border` é **branco** (10% no claro, 5% no escuro): sobre uma
 * pílula de 250 ele é branco no branco e não existe — 1,007 é ruído de
 * arredondamento. Ali quem dá aresta é o anel, que sai de `--border`. No escuro
 * a conta se inverte e a borda passa à frente.
 *
 * É a física que `--secondary-hover` e o aro da barra lateral já registram:
 * **um valor único não serve os dois temas quando a direção que lê se
 * inverte.** Os dois ficam, e cada um carrega a aresta no tema em que o outro
 * não alcança.
 *
 * ## A camada é `--z-modal`, e é decisão registrada
 *
 * `docs/layers.tsx` diz com todas as letras que `--z-nav-island` (30)
 * *"nomeava a ilha, **que está no 50**"*. Ela empata com o `Dialog` e vence por
 * ordem de DOM — o diálogo é portalizado ao `body`, depois dela. Está medido, e
 * não se mexe aqui.
 */
const bottomBarVariants = cva(
  [
    "pointer-events-none fixed inset-x-0 bottom-0 md:hidden",
    "z-(--z-modal)",
    "[--bottom-bar-safe:env(safe-area-inset-bottom,0px)]",
    "pb-[calc(var(--bottom-bar-margin)+var(--bottom-bar-safe,0px))]",
  ].join(" "),
  {
    variants: {
      /**
       * Sem rótulo a barra é uma fileira de ícones de 24 numa caixa de 56 — a
       * forma do app. Com rótulo o par ícone+texto precisa de 64: 24 do glifo,
       * 2 do `gap`, ~11 da linha do `text-2xs`, e o respiro.
       *
       * O padrão é **desligado**, e não por timidez: nenhuma tela pede rótulo
       * hoje. O eixo existe para a decisão de ligar ser uma prop, e não uma
       * rodada.
       */
      labels: {
        false: "[--bottom-bar-h:3.5rem]",
        true: "[--bottom-bar-h:4rem]",
      },
      /**
       * `island` flutua, com margem nos quatro lados — é a forma de hoje, e a
       * premissa do `backdrop-filter`: há conteúdo passando por baixo.
       *
       * Ele entra com **um valor só**, de propósito: é ele que dá dono ao
       * `--bottom-bar-margin`. Sem o eixo, a margem cairia na base e a barra
       * não teria como dizer que forma é. `flush` — a faixa rente à borda, sem
       * margem e sem raio — não entra: zero casos, e a régua é a da `Toolbar`.
       */
      shape: {
        island: "[--bottom-bar-margin:1rem]",
      },
    },
    defaultVariants: { labels: false, shape: "island" },
  }
)

/**
 * O eixo `labels` desce por **contexto**, e não por `in-data-labels:`.
 *
 * Aquele variante compila com `:where()`, que **não soma especificidade**: o
 * rótulo declara `hidden` no próprio elemento, e um `in-*:block` empataria com
 * ele — decidido pela ordem de emissão do Tailwind, e não pelo que se escreveu.
 * É a armadilha que o `DescriptionList` já pagou. Contexto não disputa.
 *
 * E aqui ele é de graça: o arquivo já é módulo cliente.
 */
const BottomBarContext = React.createContext(false)


/**
 * Se o marcador já mediu — e portanto se o item cede a ele o preenchimento.
 *
 * É contexto e não seletor pela razão de sempre: `in-*` e `group-*` compilam
 * com `:where()`, que não soma especificidade e perderia para a classe do
 * próprio item.
 */
const BottomBarMarkerContext = React.createContext(false)

function BottomBar({
  className,
  labels,
  shape,
  action,
  children,
  ...props
}: React.ComponentProps<"nav"> &
  VariantProps<typeof bottomBarVariants> & {
    /** A ação primária, à direita da pílula. Quem a pinta é quem a passa. */
    action?: React.ReactNode
  }) {
  return (
    <nav
      data-slot="bottom-bar"
      data-labels={labels ? "" : undefined}
      data-shape={shape ?? "island"}
      className={cn(bottomBarVariants({ labels, shape }), className)}
      {...props}
    >
      <BottomBarContext.Provider value={labels === true}>
      <BottomBarRow>
        <BottomBarTabs>{children}</BottomBarTabs>
        {action ? (
          <div
            data-slot="bottom-bar-action-slot"
            className="flex h-(--bottom-bar-h) shrink-0 items-center"
          >
            {action}
          </div>
        ) : null}
      </BottomBarRow>
      </BottomBarContext.Provider>
    </nav>
  )
}

function BottomBarRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-bar-row"
      className={cn(
        "pointer-events-auto mx-(--bottom-bar-margin) flex items-stretch gap-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A pílula de vidro, e a grade.
 *
 * ## A pílula e o realce são `rounded-full`, e isso é concentricidade de graça
 *
 * A caixa é 56 com `border` de 1 e `p-0.5`, então o item de dentro mede 50. Um
 * raio fixo teria de ser 28 por fora e **25** por dentro para os dois arcos
 * serem concêntricos — dois números que precisam concordar, e que deixam de
 * concordar no dia em que o recuo mudar. Com `rounded-full` a conta é a própria
 * definição da forma: metade da menor dimensão de cada um, 28 e 25. Ligar
 * `labels` leva a caixa a 64 e o item a 58, e os arcos continuam concêntricos
 * sem ninguém recalcular nada.
 *
 * **A contagem de colunas é derivada.** Ela era `grid-cols-4` cravado no
 * consumidor: acrescentar uma aba à config faria a grade estourar para uma
 * quinta coluna que não existe, calado. `Children.count` não deixa os dois
 * divergirem.
 */
function BottomBarTabs({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const colunas = React.Children.toArray(children).length
  const trilhaRef = React.useRef<HTMLDivElement | null>(null)
  const [medido, setMedido] = React.useState(false)

  /**
   * A medição do marcador que viaja — o mecanismo do `Tabs` e da `Sidebar`:
   * um `ResizeObserver` na pílula e nos itens, um `MutationObserver` em
   * `data-active`, e nada de laço por quadro.
   *
   * **`offsetLeft` direto, e não a cadeia da `Sidebar`.** Lá o `<li>` é
   * `relative` e vira o `offsetParent` do botão; aqui a aba e o slot são filhos
   * diretos da pílula, que é a configuração do `Tabs`. E `offsetLeft` concorda
   * com a caixa do absoluto por construção: os dois são medidos a partir da
   * caixa de padding da pílula, que desconta a borda de 1px igual dos dois lados.
   *
   * `:scope >` cobre a aba **e** o slot com um seletor só, e impede o marcador
   * de medir algo aninhado no conteúdo do slot.
   */
  useIsomorphicLayoutEffect(() => {
    const trilha = trilhaRef.current
    if (!trilha) return

    const medir = () => {
      const ativo = trilha.querySelector<HTMLElement>(":scope > [data-active]")
      if (!ativo) {
        setMedido(false)
        return
      }
      trilha.style.setProperty("--bottom-bar-marker-x", `${ativo.offsetLeft}px`)
      trilha.style.setProperty("--bottom-bar-marker-y", `${ativo.offsetTop}px`)
      trilha.style.setProperty("--bottom-bar-marker-w", `${ativo.offsetWidth}px`)
      trilha.style.setProperty("--bottom-bar-marker-h", `${ativo.offsetHeight}px`)
      setMedido(true)
    }

    medir()

    const ro = new ResizeObserver(medir)
    ro.observe(trilha)
    for (const item of trilha.children) ro.observe(item)

    const mo = new MutationObserver(medir)
    mo.observe(trilha, {
      attributes: true,
      attributeFilter: ["data-active"],
      subtree: true,
      childList: true,
    })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  return (
    <BottomBarMarkerContext.Provider value={medido}>
    <div
      ref={trilhaRef}
      data-slot="bottom-bar-tabs"
      style={{ "--bottom-bar-cols": colunas } as React.CSSProperties}
      className={cn(
        MOBILE_GLASS_SURFACE_CLASSNAME,
        "relative h-(--bottom-bar-h) min-w-0 flex-1 rounded-full p-0.5",
        "grid grid-cols-[repeat(var(--bottom-bar-cols),minmax(0,1fr))] items-stretch gap-0.5",
        className
      )}
      {...props}
    >
      {/*
        O marcador. **Primeiro filho, e sem `z-index`**: os itens são
        `relative`, então todos são posicionados com `z-index: auto` e quem
        decide a pintura é a ordem no documento. Um `-z-10` faria o oposto do
        que parece — `relative` com `z-index: auto` não cria contexto de
        empilhamento, e o marcador escaparia para trás da própria pílula.

        Ele só existe depois de medido: montá-lo antes o faria escorregar de
        0,0 até o lugar na primeira pintura.
      */}
      {medido ? (
        <span
          aria-hidden
          data-slot="bottom-bar-marker"
          className={cn(
            "pointer-events-none absolute top-0 left-0 rounded-full",
            "bg-foreground/10 dark:bg-foreground/12",
            "translate-x-(--bottom-bar-marker-x) translate-y-(--bottom-bar-marker-y)",
            "w-(--bottom-bar-marker-w) h-(--bottom-bar-marker-h)",
            "transition-[translate,width,height] duration-(--duration-base) ease-(--ease-out)"
          )}
        />
      ) : null}
      {children}
    </div>
    </BottomBarMarkerContext.Provider>
  )
}

/**
 * A caixa de um item — a aba e o slot dividem esta régua.
 *
 * **O alvo é a caixa, e não um pseudo-elemento.** Numa fileira de alvos
 * adjacentes um `::after` de 44px em cada um engoliria o vizinho; o padrão da
 * casa nesse caso é o da `Pagination` — o controle **é** a área, e o glifo é o
 * filho centralizado. Medido a 375px: ~67×52 por item, folgado sobre os 44.
 *
 * O anel de foco é **externo**, ao contrário do `Accordion`: a aba não sangra
 * até a borda da pílula — há `p-0.5` de folga —, então ele cabe sem cavalgar o
 * vizinho.
 *
 * `active:translate-y-px` substitui o `active:scale-[0.98]` que havia: é o
 * afundamento que todo botão do app tem, e escalar um alvo de 67×52 distorce o
 * raio.
 */
const itemRootClassName = [
  // `relative` é o que põe o item **por cima** do marcador sem `z-index`: um
  // estático pintaria antes do posicionado, e o marcador cobriria o ícone.
  "group/bottom-bar-item relative flex h-full w-full min-w-0 items-stretch rounded-full",
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/70",
  "transition-[translate] duration-(--duration-fast) ease-(--ease-out)",
  "active:translate-y-px",
].join(" ")

/**
 * O miolo, e as quatro tintas.
 *
 * **Uma prop, dois atributos, e um só decide a tinta.** `active` escreve
 * `aria-current="page"` na aba — que é a verdade semântica de um link — e
 * `data-active` nos dois, que é o que o estilo lê. Um `<button>` que abre
 * popover **não** é a página atual, mesmo com a rota ativa dentro dele, então
 * `aria-current` não serviria para os dois; `data-active` serve, e os dois
 * saem da mesma prop.
 *
 * **O par `hover:`/`active:` é obrigatório, e não é simetria.** `hover:`
 * compila dentro de `@media (hover: hover)` e não existe no dedo; `active:` não
 * existe no trackpad de um iPad. A barra tinha **só** o segundo — o inverso do
 * defeito usual, e a razão de ela ser inerte ao cursor.
 *
 * **A tinta do ativo é `--foreground` nos dois temas.** Havia um
 * `dark:text-primary-foreground`, que é a tinta de *sobre o preenchimento
 * primário* — papel errado sobre um fundo `foreground/12`, e só não berrava
 * porque no escuro aquele token calha de ser quase branco.
 */
const itemInnerClassName = [
  "flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full",
  "text-muted-foreground",
  "transition-[background-color,color] duration-(--duration-base) ease-(--ease-out)",
  "hover:text-foreground active:text-foreground",
  // A tinta **fica** no item: ela não viaja, e compartilha o relógio do
  // marcador — a tinta do rótulo e o deslocamento do realce são um evento.
  "group-data-[active]/bottom-bar-item:text-foreground",
].join(" ")

/**
 * O realce **enquanto não há medida** — e só enquanto.
 *
 * É a pintura que o item fazia sozinho, preservada para a primeira pintura e
 * para quem roda sem JavaScript: sem ela, o item ativo apareceria sem marca
 * nenhuma até a hidratação. O alfa é o mesmo do marcador, então a troca não
 * pisca.
 *
 * **Aqui ceder não precisa apagar**, ao contrário da `Sidebar`: lá a base do
 * `cva` pintava o ativo incondicionalmente e exigia um `bg-transparent`; aqui a
 * string é inteira desta peça, e basta não incluí-la.
 */
const itemFallbackClassName = [
  "group-data-[active]/bottom-bar-item:bg-foreground/10",
  "dark:group-data-[active]/bottom-bar-item:bg-foreground/12",
].join(" ")

/**
 * O rótulo do eixo `labels` — quem o liga é a barra, por contexto.
 *
 * **Ele cabe dentro do realce, e não dentro do item.** O realce é
 * `rounded-full`, e o rótulo mora no arco de baixo: num item de 65×58 a corda
 * da pílula na base do rótulo mede ~51px, contra os 65 da caixa. Com `w-full`
 * sozinho, "Transações" vazava pela curva. O `px-2` corta a caixa para dentro
 * dela, e o `truncate` põe as reticências ali — e segue valendo com cinco abas,
 * onde o item estreita e a corda cai junto.
 */
const itemLabelClassName =
  "w-full truncate px-2 text-center text-2xs leading-none"

function BottomBarLabel({ children }: { children: React.ReactNode }) {
  const labels = React.useContext(BottomBarContext)
  if (!labels) return null
  return (
    <span className={itemLabelClassName} aria-hidden>
      {children}
    </span>
  )
}

function BottomBarTab({
  className,
  href,
  label,
  icon: Icon,
  iconActive: IconActive,
  active,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string
  label: string
  icon: HeroIcon
  /**
   * O par preenchido, para a aba ativa — a convenção de tab bar do iOS.
   *
   * É **prop e não derivação**: a peça não tem como saber o sólido de um ícone
   * qualquer, e adivinhar por nome quebraria no build de produção, onde o nome
   * da função é mangled. Sem ele, a aba ativa continua de contorno.
   */
  iconActive?: HeroIcon
  active?: boolean
}) {
  const Glifo = active && IconActive ? IconActive : Icon
  const temMarcador = React.useContext(BottomBarMarkerContext)

  return (
    <Link
      data-slot="bottom-bar-tab"
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "" : undefined}
      aria-label={label}
      className={cn(itemRootClassName, className)}
      {...props}
    >
      <span
        className={cn(itemInnerClassName, !temMarcador && itemFallbackClassName)}
      >
        <Glifo className="size-6 shrink-0" aria-hidden />
        <BottomBarLabel>{label}</BottomBarLabel>
      </span>
    </Link>
  )
}

/**
 * A mesma caixa da aba, sem `href` — para hospedar o gatilho de um popover.
 *
 * Ele não recebe `aria-current`: um `<button>` que abre um painel não é a
 * página atual, mesmo quando a rota ativa mora dentro dele. O realce vem de
 * `data-active`, e quem o escreve é quem sabe da rota.
 *
 * O conteúdo é de quem chama — são quatro estados (carregando, deslogado,
 * ícone da rota ativa, avatar), e quem os conhece é o app.
 */
function BottomBarSlot({
  className,
  active,
  label,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  active?: boolean
  /** O rótulo sob o conteúdo, quando a barra liga `labels`. */
  label?: string
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"
  const temMarcador = React.useContext(BottomBarMarkerContext)

  return (
    <Comp
      data-slot="bottom-bar-slot"
      data-active={active ? "" : undefined}
      type={asChild ? undefined : "button"}
      className={cn(itemRootClassName, className)}
      {...props}
    >
      <span
        className={cn(itemInnerClassName, !temMarcador && itemFallbackClassName)}
      >
        {children}
        {label ? <BottomBarLabel>{label}</BottomBarLabel> : null}
      </span>
    </Comp>
  )
}

/**
 * A ação primária, à direita da pílula.
 *
 * Ela é **redonda** (`rounded-full`), e não um quadrado de cantos moles: ao
 * lado de uma pílula, um retângulo arredondado lê como a forma que não decidiu
 * qual das duas é.
 *
 * **56 não é degrau do `Button`** — a escada termina em `icon-xl` (40). Ela lê
 * `--bottom-bar-h`, então a ação é a altura da barra por construção, e ligar
 * `labels` a leva a 64 junto sem ninguém dizer nada.
 *
 * E ela **não declara cor nenhuma**. A classe que ela substitui tinha **seis
 * `!important`** (`hover:!bg-primary`, `hover:!border-primary`, e os pares
 * `dark:`) que anulavam a tecla que o `primary` virou na rodada 78: o
 * `hover:bg-primary-hover`, o `border-primary-edge` e o
 * `shadow-(--primary-shadow-value)`. O FAB era um quadrado verde chapado e
 * inerte ao cursor. O `active:scale-95` saiu junto — a base já traz
 * `active:translate-y-px` e a tecla já tem a sombra de apertado; dois
 * afundamentos são um a mais.
 */
const bottomBarActionClassName = [
  "size-(--bottom-bar-h) shrink-0 rounded-full p-0",
  "[&_svg:not([class*='size-'])]:size-5",
].join(" ")

export {
  BottomBar,
  BottomBarRow,
  BottomBarTabs,
  BottomBarTab,
  BottomBarSlot,
  bottomBarActionClassName,
  bottomBarVariants,
}
