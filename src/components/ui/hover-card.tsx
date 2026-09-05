"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { Caption } from "@/components/ui/typography"

/**
 * Uma prévia rica ao pousar o cursor — e ela é **sempre redundante**, porque no
 * toque ela não existe.
 *
 * ## A superfície era uma cópia manual da do popover, e faltavam três coisas
 *
 * `HoverCardContent` escrevia `rounded-lg bg-popover shadow-md ring-1
 * ring-foreground/10` de novo, à mão. Copiar não é o defeito — o Tailwind varre
 * o código como texto, e as classes que carregam o nome da primitiva (`origin-`,
 * `max-h-`) **têm** que ser literais em cada arquivo, como `menu-classes` já
 * documenta. O defeito é que a cópia veio **incompleta**:
 *
 * - **sem `max-h-(--radix-hover-card-content-available-height)`** — o Radix já
 *   publicava a variável e ninguém a lia, então uma prévia alta perto da borda
 *   de baixo simplesmente saía da tela;
 * - **sem `overflow-y-auto`** — corolário do anterior: com teto e sem rolagem, o
 *   que passa do teto some;
 * - **sem `collisionPadding`** — a prévia encostava na borda da janela, enquanto
 *   o `PopoverContent` já somava os 8px de folga "de fábrica".
 *
 * As três são exatamente o que o AGENTS.md manda para superfície ancorada num
 * gatilho. Um hover card é um popover que abre com o cursor; não havia razão
 * para ele ser a única das oito superfícies ancoradas sem elas.
 *
 * ## Os atrasos são uma decisão, e o padrão do Radix não serve
 *
 * O Radix abre em 700ms e fecha em 300. Setecentos milissegundos numa prévia
 * presa a um nome em texto corrido não lê como cortesia: lê como componente
 * quebrado — a pessoa já tirou o cursor antes de a prévia aparecer. Zero lê como
 * defeito oposto, disparando em toda passagem de cursor sobre um parágrafo com
 * quatro nomes.
 *
 * 400 fica acima do limiar de pausa intencional (~300ms) e abaixo do ponto em
 * que a espera vira dúvida. O fechamento em 200 é o que dá tempo de o cursor
 * atravessar o vão entre o gatilho e o cartão.
 *
 * ## O gatilho tem que ser focável
 *
 * O Radix abre no foco, além do cursor — é o que dá ao teclado o mesmo acesso.
 * Um `HoverCardTrigger` em volta de um `<span>` perde isso em silêncio: a prévia
 * passa a existir só para quem tem mouse. Envolva um link ou um `Button`.
 *
 * E continua valendo o de sempre: **clicar precisa levar à mesma informação.**
 * No telefone este componente não acontece.
 */

const hoverCardContentVariants = cva(
  [
    /** Acima do véu da Sheet (`z-(--z-sheet)`); abaixo do Toaster (`z-(--z-toast)`). */
    "z-(--z-popover) flex flex-col origin-(--radix-hover-card-content-transform-origin)",
    "rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden",
    "max-h-(--radix-hover-card-content-available-height) max-w-(--radix-hover-card-content-available-width) overflow-y-auto overscroll-contain",
    "duration-(--duration-instant) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
  ],
  {
    variants: {
      /**
       * A largura, e os três degraus saem de contagem, não de invenção: o
       * componente nascia `w-64` e a **única** demonstração que existia dele já
       * o sobrescrevia para `w-72`. Um padrão que o seu único consumidor anula
       * não é padrão, é chute.
       *
       * `sm` é o cartão de um dado só (um saldo, uma data). `md` é o par
       * identidade + linha de meta, que é o caso canônico. `lg` é para quando
       * há um parágrafo, e é o teto: acima de 320px a prévia deixa de ser
       * prévia e vira a página que ela deveria adiar.
       */
      size: { sm: "w-56", md: "w-64", lg: "w-80" },
      /**
       * O mesmo eixo, com o mesmo nome e a mesma razão do `PopoverContent`: um
       * cartão que hospeda um componente inteiro cede o respiro para o conteúdo.
       * `none` zera o `gap` junto, porque as duas coisas andam juntas.
       */
      padding: {
        default:
          "gap-2.5 p-2.5 [--hover-card-strip-px:0px] [--hover-card-strip-py:0px]",
        none: "gap-0 p-0 [--hover-card-strip-px:--spacing(3)] [--hover-card-strip-py:--spacing(2)]",
      },
    },
    defaultVariants: { size: "md", padding: "default" },
  }
)

function HoverCard({
  openDelay = 400,
  closeDelay = 200,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  size,
  padding,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content> &
  VariantProps<typeof hoverCardContentVariants>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        data-padding={padding}
        className={cn(hoverCardContentVariants({ size, padding }), className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

/**
 * A seta, e este é o único lugar do sistema onde ela se paga.
 *
 * Um menu ou um `Select` abrem a partir de um controle que a pessoa acabou de
 * clicar: não há dúvida sobre a origem, e a seta é enfeite. Uma prévia dispara
 * sobre **uma palavra dentro de um parágrafo**, com outras três palavras iguais
 * na mesma linha — e aí a seta é a única coisa que diz de qual delas o cartão
 * está falando.
 *
 * **Ela não leva o anel da casca, e a alternativa é pior.** O `ring-1
 * ring-foreground/10` do cartão é uma sombra desenhada em volta da caixa do
 * conteúdo — a seta fica fora dela, então o fio da casca passa reto pela base da
 * seta em vez de contorná-la. Dar o mesmo anel ao triângulo devolveria o
 * contorno e acrescentaria uma diagonal atravessando a seta, porque as duas
 * arestas internas dele também seriam desenhadas. Entre uma interrupção de 12px
 * num fio de 10% de alfa e um traço a mais dentro da seta, a interrupção é a que
 * ninguém enxerga.
 *
 * `fill-popover` e não `bg-popover`: quem pinta um triângulo vetorial é o
 * `fill`. É a razão de a seta não ter virado um quadrado girado 45°, que é a
 * receita comum — ali o preenchimento é fundo, mas a geometria passa a ser
 * inventada e a rotação precisa de um deslocamento arbitrário para esconder a
 * metade de dentro.
 */
function HoverCardArrow({
  className,
  width = 12,
  height = 6,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Arrow>) {
  return (
    <HoverCardPrimitive.Arrow
      data-slot="hover-card-arrow"
      width={width}
      height={height}
      className={cn("fill-popover", className)}
      {...props}
    />
  )
}

/**
 * As tiras, espelhando o vocabulário que o `PopoverContent` já tem — e sem fio e
 * sem tinta, como todas as tiras do sistema. O que separa a tira do corpo é o
 * respiro que ela traz.
 *
 * Título sobre descrição é **par de identidade**: quem os separa é a entrelinha,
 * e não um `gap`.
 *
 * **Sem `shrink-0`, e isso é uma correção medida.** O `PopoverHeader` o tem, e lá
 * está certo: ali a faixa é irmã de um `PopoverBody` com `flex-1`, que a
 * espremeria na vertical. Aqui não existe corpo com `flex-1` — não há o que
 * espremer —, e a faixa é usada **dentro de uma linha**, ao lado de um avatar,
 * que é o arranjo canônico de uma prévia de pessoa. Nesse contexto `shrink-0`
 * impede o encolhimento **horizontal**: a descrição para de quebrar, transborda,
 * e como `overflow-y: auto` faz o eixo X virar `auto` junto (é a regra da spec:
 * um eixo não-`visible` promove o outro), o texto sai **recortado**. Medido no
 * navegador: "42 transações" saía como "42 transaç".
 */
function HoverCardHeader({
  className,
  children,
  endAdornment,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * O que fica no **canto superior direito** — um `Badge` de estado, uma
   * contagem, um ícone.
   *
   * Mesmo nome e mesma forma do `DialogHeaderRow`, de propósito: uma grade de
   * duas colunas com `items-start`. É o `items-start` que faz o adorno ficar
   * preso ao **topo** em vez de centralizar quando a descrição quebra em duas
   * linhas — e uma prévia de fatura tem sempre duas.
   *
   * A alternativa era o consumidor pôr um `absolute` no canto do cartão, e ela
   * é pior de dois jeitos: o adorno passaria por cima do título quando o título
   * fosse longo, e o recuo do canto seria um número escrito na tela, que é
   * exatamente o que `--hover-card-strip-px` existe para evitar.
   *
   * **Sem `space-y-1` no par**, que é onde este slot diverge do
   * `DialogHeaderRow`: título sobre descrição é o mesmo dado em duas linhas, e
   * quem os separa é a entrelinha. (O `space-y-1` de lá está no backlog.)
   */
  endAdornment?: React.ReactNode
}) {
  const pair = (
    <div className="flex min-w-0 flex-col">{children}</div>
  )

  return (
    <div
      data-slot="hover-card-header"
      className={cn(
        "min-w-0 text-sm",
        endAdornment != null
          ? "grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3"
          : "flex flex-col",
        "px-(--hover-card-strip-px) py-(--hover-card-strip-py)",
        className
      )}
      {...props}
    >
      {endAdornment != null ? pair : children}
      {endAdornment != null ? (
        <div data-slot="hover-card-header-adornment" className="shrink-0">
          {endAdornment}
        </div>
      ) : null}
    </div>
  )
}

function HoverCardTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="hover-card-title"
      className={cn("font-heading font-medium text-balance", className)}
      {...props}
    />
  )
}

function HoverCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="hover-card-description"
      className={cn("text-pretty", className)}
      {...props}
    />
  )
}

/**
 * O corpo — a região do meio, e ela existe porque a demonstração do catálogo
 * estava escrevendo `<div className="px-3 pb-1">` à mão.
 *
 * Com `padding="none"` o casco cede o respiro, e aí **cada região precisa ser
 * dona do seu**. O cabeçalho e o pé já eram; o meio não era, então quem punha
 * conteúdo ali tinha de adivinhar o recuo — e adivinhou 12px de um lado e 4 do
 * outro, dois números soltos onde existe `--hover-card-strip-px`. Completa o
 * vocabulário que o `PopoverContent` já tem: cabeçalho, corpo, pé.
 *
 * **Ele não rola, e isso é decisão.** O `PopoverBody` rola porque um popover
 * hospeda lista longa; um cartão de prévia que precisa rolar não é mais uma
 * prévia — é a página que ele deveria adiar, e o componente certo passa a ser o
 * `Popover`, que abre no clique e se retém. Por isso também não há o
 * `has-[[data-slot=…-body]]:overflow-hidden` que o popover precisa: aqui não há
 * duas rolagens para desempatar.
 *
 * **Ele traz o próprio `py`, e isso é o que faz a hierarquia existir.** A
 * primeira versão só recuava na horizontal, sob o argumento de que o `py` das
 * tiras vizinhas já dava o ar — e o resultado, medido na tela, era que *tudo*
 * ficava a 8px: identidade, rótulo, número, datas e rodapé liam como uma lista
 * de cinco linhas soltas, sem bloco nenhum. Com o `py` próprio, a distância
 * **entre** regiões vira 16 e a distância **dentro** do corpo continua 8, e é
 * essa razão de 2 para 1 que separa "outro assunto" de "mesmo assunto".
 *
 * Em `padding="default"` as duas variáveis valem zero, então isto é inócuo lá:
 * quem manda no respiro é o `p-2.5` do casco.
 */
function HoverCardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hover-card-body"
      className={cn(
        "flex min-w-0 flex-col gap-2",
        "px-(--hover-card-strip-px) py-(--hover-card-strip-py)",
        className
      )}
      {...props}
    />
  )
}

/** Espelho do cabeçalho, e sem fio pela mesma razão. */
function HoverCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="hover-card-footer"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2",
        "px-(--hover-card-strip-px) py-(--hover-card-strip-py)",
        className
      )}
      {...props}
    />
  )
}

export {
  hoverCardContentVariants,
  HoverCard,
  HoverCardArrow,
  HoverCardBody,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
}
