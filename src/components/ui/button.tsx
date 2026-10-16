"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * O realce do hover: liga `--button-hover` no cursor e no toque, e a
 * `@utility button-hover` pinta por cima do repouso a cor que o peso declara em
 * `--button-hover-fill`. Esmaece na transição da base, sem mola.
 */
const REALCE = "button-hover hover:[--button-hover:1] active:[--button-hover:1]"
/** O mesmo realce para quem acende também com o menu aberto. */
const REALCE_EXPANDIDO = `${REALCE} aria-expanded:[--button-hover:1]`

/**
 * O florescer do `brandColorful`: liga `--button-bloom` no cursor e no toque
 * (mola ao entrar, `--ease-out` ao sair). A pintura é da `@utility
 * button-colorful`. A lista de `transition` é restatada com a variável no fim
 * porque o `tailwind-merge` troca a lista da base em vez de acrescentar.
 */
const FLORESCER =
  "hover:[--button-bloom:1] active:[--button-bloom:1] aria-expanded:[--button-bloom:1] transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-bloom] duration-(--duration-slow) ease-(--ease-out) hover:duration-(--duration-spring) hover:ease-(--ease-spring) active:duration-(--duration-spring) active:ease-(--ease-spring) aria-expanded:duration-(--duration-spring) aria-expanded:ease-(--ease-spring)"

// O afundar do clique é o `active:translate-y-px` mais o `afundar` (abaixo), que
// cobre o gatilho de menu do Radix: lá o `:active` não chega a pintar.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-hover] duration-(--duration-fast) ease-(--ease-out) outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>[data-slot=button-label]]:first-letter:uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // A hierarquia é uma escada em peso visual: `primary` preenche de preto,
      // `secondary` de cinza, `tertiary` não preenche. Uma tela tem um
      // `primary` só. `outline` (contorno próprio) e `brand` (um CTA de marca
      // por tela) ficam fora da escada. Estado de sucesso e atenção é do
      // `Badge` e do `Alert`, não do botão.
      variant: {
        // O primário é a tecla chapada: no cursor, no toque e com o menu aberto
        // vai a `--primary-hover`. O fundo fica no `padding-box` (a
        // `bg-clip-padding` da base): o vão de 1px da borda transparente
        // desenha a emenda do primário no `ButtonGroup`. Enviando
        // (`aria-busy`) a opacidade fica cheia, para "salvando" não ler como
        // "desabilitado". No cursor acende também um fio interno branco
        // (`--primary-hover-ring`; `inset-ring`, sombra por dentro do
        // `padding-box`: não mexe na caixa); em repouso ele já existe,
        // transparente, para esmaecer. Só no cursor: o toque não tem hover.
        primary:
          "bg-primary text-primary-foreground inset-ring-1 inset-ring-transparent hover:bg-primary-hover hover:inset-ring-primary-hover-ring active:bg-primary-hover aria-expanded:bg-primary-hover aria-busy:disabled:opacity-100",
        // A tecla do primário em repouso e, no cursor, no toque e com o menu
        // aberto, cinco paradas do arco-íris florescem do centro
        // (`@utility button-colorful`). Um CTA de marca por tela.
        brandColorful: `button-colorful bg-primary text-primary-foreground ${FLORESCER} aria-busy:disabled:opacity-100`,
        // CTA neutro: superfície do `secondary` com o fio do sistema; o
        // arco-íris acende num arco da borda conforme o ponteiro se aproxima
        // (`@utility brand-glow` + `useBrandGlow`). O fundo não muda no cursor:
        // a resposta é o próprio brilho, e o clique afunda 1px. Intensidade
        // cheia: numa caixa de 32px o arco tem poucos pixels. Sem ponteiro fino
        // não há brilho. `brand-rainbow-image` declara `--brand-rainbow` no
        // elemento. Um por tela.
        brand:
          "brand-rainbow-image brand-glow relative isolate border-border bg-secondary text-secondary-foreground [--brand-glow-opacity:1] aria-busy:disabled:opacity-100",
        // A tecla com o arco-íris só na borda de baixo e um brilho borrado
        // embaixo, deslizando num laço de 2s: sempre aceso, para quando a marca
        // não pode depender do ponteiro (`@utility brand-rainbow-button`). Aqui
        // fica o miolo (`--brand-fill`), que escurece no cursor.
        brandOutline:
          "brand-rainbow-slide brand-rainbow-button text-primary-foreground [--brand-fill:var(--primary)] hover:[--brand-fill:var(--primary-hover)] active:[--brand-fill:var(--primary-hover)] aria-expanded:[--brand-fill:var(--primary-hover)] aria-busy:disabled:opacity-100",

        // Sem borda visível: `bg-clip-border` faz o preenchimento chegar à
        // aresta (com `bg-clip-padding` o cinza pintava 30px dentro de 32).
        // Preferido a `border-0` porque a borda de 1px mantém a geometria igual
        // entre as variantes.
        secondary: `bg-clip-border bg-secondary text-secondary-foreground [--button-hover-fill:var(--secondary-hover)] ${REALCE} aria-expanded:bg-secondary aria-expanded:text-secondary-foreground`,
        // O realce é chapado: a cor do peso (`--button-hover-fill`) pinta por
        // cima do repouso e esmaece em `--duration-fast`. `tertiary`, `outline`
        // e `floating` usam `--accent` a 50%, o realce das linhas da barra lateral
        // (`bg-sidebar-accent/50`; no escuro os dois tokens são o mesmo 0,269),
        // pedido do dono; `destructive` 22% (25% no escuro). O par
        // `active:` é necessário: `hover:` compila dentro de `@media (hover:
        // hover)`, e sem ele o terciário não responde ao toque.
        tertiary: `[--button-hover-fill:color-mix(in_oklab,var(--accent)_50%,transparent)] hover:text-foreground active:text-foreground aria-expanded:text-foreground ${REALCE_EXPANDIDO}`,
        // O fio é o `--border` também no escuro (era o `--input`, 0,31 chapado): com o
        // `bg-clip-padding` da base ele soma à página, no contraste da barra lateral.
        outline: `border-border bg-background [--button-hover-fill:color-mix(in_oklab,var(--accent)_50%,transparent)] hover:text-foreground active:text-foreground aria-expanded:text-foreground dark:bg-input-fill/30 ${REALCE_EXPANDIDO}`,
        // A pílula flutuante: a receita das placas soltas (`--popover` chapado,
        // anel de 1px, sombra) num botão, com a tinta do `tertiary` e o realce
        // chapado. `bg-clip-border` evita 1px da página entre a placa e o anel.
        floating: `bg-clip-border bg-popover text-muted-foreground shadow-sm ring-1 ring-foreground/10 [--button-hover-fill:color-mix(in_oklab,var(--accent)_50%,transparent)] hover:text-foreground active:text-foreground aria-expanded:text-foreground ${REALCE_EXPANDIDO}`,
        destructive: `bg-destructive/10 text-destructive-muted-foreground [--button-hover-fill:color-mix(in_oklab,var(--destructive)_22%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,var(--destructive)_25%,transparent)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 ${REALCE}`,
        // O link é sublinhado por um `::after` que vive em `scaleX(0)` com a
        // origem à direita e, no cursor, troca a origem para a esquerda e vai a
        // `scaleX(1)`: entra pela esquerda, sai pela direita. Não há traço em
        // repouso, então sem cursor o link depende de `--primary-accent` para
        // se distinguir. Não é `text-decoration`: o `::first-letter` da base
        // cria caixa própria para a primeira letra e a decoração sairia em dois
        // segmentos com uma costura visível; quem devolver `underline` traz a
        // emenda. A receita está em `@utility link-sweep`.
        // `brand-rainbow-image` declara `--brand-rainbow` aqui, que o traço lê.
        link: "brand-rainbow-image link-sweep text-primary-accent",
      },
      // Uma escada só, de 24 a 40 em degraus de 4, e a coluna `icon-*` espelha
      // a de texto. O padrão é `lg` (36), a altura do `Input` e do
      // `SelectTrigger` no desktop. No dedo `md` e `lg` sobem a 40, o piso do
      // campo; `xs` e `sm` moram dentro de outro controle e ficam. A altura dos
      // dois passa por `--button-h`: um `h-*`/`size-*` de quem chama troca a
      // utilidade inteira no `twMerge`, e um `pointer-coarse:h-10` solto
      // sobreviveria a ele (a célula do calendário, a linha do seletor). Todo botão é
      // cápsula (círculo nos `icon-*`), com meio degrau a mais de recuo lateral
      // para a curva não espremer o rótulo.
      size: {
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3 text-control-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-(--button-h) [--button-h:--spacing(8)] pointer-coarse:[--button-h:--spacing(10)] gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-(--button-h) [--button-h:--spacing(9)] pointer-coarse:[--button-h:--spacing(10)] gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-10 gap-1.5 px-4.5 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-md": "size-(--button-h) [--button-h:--spacing(8)] pointer-coarse:[--button-h:--spacing(10)]",
        "icon-lg": "size-(--button-h) [--button-h:--spacing(9)] pointer-coarse:[--button-h:--spacing(10)]",
        "icon-xl": "size-10",
      },
      // `spin` é a meia-volta do "tentar novamente": no cursor e no toque o
      // ícone gira 180° na mola da casa. É `rotate` (propriedade independente
      // do Tailwind v4), que não disputa com o `translate` do clique.
      iconMotion: {
        none: "",
        spin: "[&_svg]:transition-[rotate] [&_svg]:duration-(--duration-spring) [&_svg]:ease-(--ease-spring) hover:[&_svg]:rotate-180 active:[&_svg]:rotate-180",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      iconMotion: "none",
    },
  }
)

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>

/** O degrau que um `ButtonGroup size` desce aos filhos; um `size` no botão vence, e sem nenhum é `lg`. */
const ButtonSizeContext = React.createContext<ButtonSize | undefined>(undefined)

/**
 * O afundar do clique, como animação de duração fixa: desce 1px e volta. O
 * `:active` sozinho não basta no gatilho de um menu do Radix — ele abre no
 * `pointerdown`, chama `preventDefault`, o menu modal põe `pointer-events: none`
 * no `body` e o React leva ~120ms montando o menu: medido, o aperto durava 11ms
 * pintado. A animação da Web Animations API anda pelo tempo, e não pelo aperto,
 * então se vê inteira e o botão volta com o menu já aberto. Segurando um botão
 * comum, o `:active` continua o mantendo embaixo. Movimento reduzido: nada.
 */
const AFUNDAR: Keyframe[] = [
  { translate: "0 0" },
  { translate: "0 1px", offset: 0.35 },
  { translate: "0 1px", offset: 0.6 },
  { translate: "0 0" },
]

function afundar(e: React.PointerEvent<HTMLElement>) {
  if (e.button !== 0) return
  const el = e.currentTarget
  const janela = el.ownerDocument.defaultView
  if (!el.animate || janela?.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  el.animate(AFUNDAR, { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
}

function Button({
  className,
  variant = "primary",
  size: sizeProp,
  iconMotion,
  asChild = false,
  children,
  ref,
  onPointerDown,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const groupSize = React.useContext(ButtonSizeContext)
  const size = sizeProp ?? groupSize ?? "lg"
  const glowRef = useBrandGlow<HTMLButtonElement>(variant === "brand")

  // `::first-letter` não vale em `inline-flex`, e o botão precisa ser flex para
  // alinhar ícone: o texto cru vira um `span`, que como item de flex aceita o
  // pseudo-elemento. Quem passa um elemento assume a caixa alta.
  const wrapText = (nodes: React.ReactNode) =>
    React.Children.map(nodes, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <span data-slot="button-label">{child}</span>
      ) : (
        child
      )
    )

  // Com `asChild` o Slot exige um filho único, então o embrulho desce um nível
  // e embrulha o texto do filho (`<Button asChild><Link>` segue coberto).
  const content =
    asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
      ? React.cloneElement(children, undefined, wrapText(children.props.children))
      : wrapText(children)

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      ref={composeRefs(glowRef, ref)}
      data-size={size}
      data-icon-motion={iconMotion ?? undefined}
      className={cn(buttonVariants({ variant, size, iconMotion, className }))}
      // Um `<button>` sem `type` é de envio, e o Enter implícito aciona o
      // primeiro: o botão de ícone antes do "Salvar" a roubaria.
      type={asChild ? undefined : "button"}
      {...props}
      onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(e)
        afundar(e)
      }}
    >
      {content}
    </Comp>
  )
}

export { Button, ButtonSizeContext, buttonVariants, type ButtonSize }
