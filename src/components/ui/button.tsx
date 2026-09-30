"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * O florescer do hover (rodadas 151 e 152): liga `--button-bloom` no cursor e
 * no toque, e escolhe o ritmo de cada lado — a mola da casa ao entrar,
 * `--ease-out` ao sair. A pintura é das `@utility button-bloom` e
 * `button-colorful`, no `globals.css`. A lista de `transition` é restatada com
 * a variável no fim, porque o `tailwind-merge` troca a lista da base em vez de
 * acrescentar.
 */
const FLORESCER =
  "hover:[--button-bloom:1] active:[--button-bloom:1] transition-[color,background-color,border-color,box-shadow,opacity,translate,--button-bloom] duration-(--duration-slow) ease-(--ease-out) hover:duration-(--duration-spring) hover:ease-(--ease-spring) active:duration-(--duration-spring) active:ease-(--ease-spring)"
/** O mesmo florescer para quem realça também o menu aberto. */
const FLORESCER_EXPANDIDO = `${FLORESCER} aria-expanded:[--button-bloom:1] aria-expanded:duration-(--duration-spring) aria-expanded:ease-(--ease-spring)`

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,translate] duration-(--duration-fast) ease-(--ease-out) outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>[data-slot=button-label]]:first-letter:uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // A hierarquia é uma escada, e ela desce em peso visual, não só em nome:
      // `primary` preenche de preto (branco no escuro), `secondary` preenche
      // de cinza, `tertiary` não preenche nada. Uma tela tem um `primary` só.
      //
      // `outline` fica de fora da escada de propósito: é a exceção, para
      // quando um controle precisa de contorno próprio (um par de navegação,
      // um filtro que alterna) e nenhum dos três degraus serve. `brand`
      // também fica de fora: o CTA neutro com o brilho de marca na borda,
      // para **um** CTA de marca por tela — entrar, começar.
      //
      // `success` e `warning` foram removidos: nomeavam um estado, não um
      // peso, e nenhuma tela do app chegou a usá-los. Estado de sucesso e de
      // atenção continua sendo trabalho do `Badge` e do `Alert`.
      variant: {
        // **O primário é o "Button Colorful" da Kokonut UI** (21st, MIT;
        // rodadas 149 a 151), com a cor guardada para a interação: em repouso
        // ele é a tecla preta (branca no escuro) **chapada** — a identidade
        // preto e branco —, e no cursor, no toque e com o menu aberto cinco
        // paradas do arco-íris (teal, azul, violeta, magenta, coral)
        // **florescem do centro**, comprimidas e borradas, abrindo até as
        // bordas enquanto ganham foco — o `FLORESCER` de todo peso, com a
        // pintura da `@utility button-colorful`.
        //
        // O fundo fica recortado no `padding-box` (a `bg-clip-padding` da
        // base), e não em `border-box` como no `secondary`: é o vão de 1px da
        // borda transparente que desenha a emenda do primário no `ButtonGroup`.
        // Enviando (`aria-busy`) a opacidade fica cheia, para "salvando" não
        // ler como "desabilitado".
        primary: `button-colorful bg-primary text-primary-foreground ${FLORESCER_EXPANDIDO} aria-busy:disabled:opacity-100`,
        // **O CTA de marca é neutro, e a borda acende de perto** (rodada 145).
        // Em repouso é a superfície do `secondary` com o fio do sistema; o
        // arco-íris acende num arco da borda conforme o ponteiro se aproxima e
        // viaja até ele — a família do brilho, a mesma do `Alert`, do `Card` e
        // do `Badge` (`@utility brand-glow` + `useBrandGlow`). Até aqui ele era
        // a tecla preta do `primary` com o degradê em 1px e um halo borrado
        // sempre aceso; o dono o quis neutro, como o `Badge`.
        //
        // **O fundo não muda no cursor**: a resposta ao cursor é o próprio
        // brilho, e o clique afunda 1px pela base. Até a rodada 155 isso era
        // mecânico — o anel trazia um núcleo chapado que cobria a fatia acesa,
        // e um hover de fundo sumiria nela. Desde a 156 o anel é recortado na
        // máscara e o meio nunca é pintado, então um hover de fundo passaria a
        // ser possível; fica a decisão, não a trava.
        //
        // Intensidade cheia (`--brand-glow-opacity: 1`), a do `Badge`: numa
        // caixa de 32px o arco tem poucos pixels. Sem ponteiro fino (telefone)
        // não há brilho, e o botão fica o neutro. `brand-rainbow-image` declara
        // `--brand-rainbow` no elemento, e não se apaga. Um por tela.
        brand:
          "brand-rainbow-image brand-glow relative isolate border-border bg-secondary text-secondary-foreground [--brand-glow-opacity:1] aria-busy:disabled:opacity-100",
        // **O Rainbow Button da Magic UI** (rodada 153): a tecla preta
        // (branca no escuro) com o arco-íris só na borda de baixo e um brilho
        // borrado embaixo, os dois deslizando num laço de 2s — sempre aceso,
        // para quando a marca não pode depender do ponteiro. A pintura é a
        // `@utility brand-rainbow-button`; aqui fica o miolo (`--brand-fill`),
        // que escurece no cursor, no toque e com o menu aberto.
        brandOutline:
          "brand-rainbow-slide brand-rainbow-button text-primary-foreground [--brand-fill:var(--primary)] hover:[--brand-fill:var(--primary-hover)] active:[--brand-fill:var(--primary-hover)] aria-expanded:[--brand-fill:var(--primary-hover)] aria-busy:disabled:opacity-100",

        // Sem borda visível — e sem o anel vazado que havia antes. O culpado
        // não era a borda transparente da base, era o `bg-clip-padding` que a
        // acompanha: ele recortava o preenchimento na caixa de padding, então o
        // cinza pintava 30px dentro de uma caixa de 32. `bg-clip-border` faz o
        // preenchimento passar por baixo da borda e chegar à aresta.
        //
        // Preferido a `border-0` porque a borda de 1px é o que mantém a
        // geometria igual entre as variantes: com `border-0` o rótulo do
        // `secondary` recuava para 12px contra os 13px das outras, e os chips
        // que alternam entre `secondary` e `outline` saltavam 2px ao selecionar.
        secondary: `button-bloom bg-clip-border bg-secondary text-secondary-foreground [--button-bloom-fill:var(--secondary-hover)] ${FLORESCER} aria-expanded:bg-secondary aria-expanded:text-secondary-foreground`,
        // **O hover floresce do centro, como o do primário** (rodada 152): a
        // cor do hover nasce pequena e difusa no meio e se abre até as bordas
        // (`@utility button-bloom`, uma elipse no próprio fundo — o `::after`
        // destes pesos é o alvo de toque ampliado de várias peças). Cada peso
        // declara só a cor (`--button-bloom-fill`, com par `dark:` onde o
        // escuro tem outra); os alfas do escuro e do `destructive` são
        // **compostos** (`repouso + a·(1 − repouso) = hover`: 11%, 12,5%, 29%),
        // porque a elipse pinta por cima do repouso. Da rodada 99 à 148 a cor
        // crescia num disco a partir do ponteiro; na 149 virou a troca seca;
        // na 152, o florescer do primário.
        //
        // O par `active:` não é redundante com o `hover:`: `hover:` compila
        // dentro de `@media (hover: hover)`, então sem ele **o terciário não
        // devolvia nada ao toque** — em nenhuma das telas que o usam (rodada
        // 29b). O conserto mora aqui e não em cada chamada, que é onde `Toggle`,
        // `Tabs`, `Menubar`, `Item` e `Calendar` já o escreviam à mão.
        tertiary: `button-bloom [--button-bloom-fill:var(--muted)] dark:[--button-bloom-fill:color-mix(in_oklab,var(--muted)_50%,transparent)] hover:text-foreground active:text-foreground aria-expanded:text-foreground ${FLORESCER_EXPANDIDO}`,
        outline: `button-bloom border-border bg-background [--button-bloom-fill:var(--muted)] dark:[--button-bloom-fill:color-mix(in_oklab,var(--input-fill)_29%,transparent)] hover:text-foreground active:text-foreground aria-expanded:text-foreground dark:border-input dark:bg-input-fill/30 ${FLORESCER_EXPANDIDO}`,
        destructive: `button-bloom bg-destructive/10 text-destructive-muted-foreground [--button-bloom-fill:color-mix(in_oklab,var(--destructive)_11%,transparent)] dark:[--button-bloom-fill:color-mix(in_oklab,var(--destructive)_12.5%,transparent)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 ${FLORESCER}`,
        // O link é sublinhado **sempre**: com a marca preta ele tem a cor do
        // texto, e sem o traço nada o distinguia até o cursor passar — o que
        // no toque é nunca. No cursor e no toque o traço **troca de tinta**,
        // do texto para o arco-íris, sem animação nenhuma.
        //
        // **O traço entra pela esquerda e sai pela direita**, na mecânica do
        // `link-button` do 21st que o dono trouxe: um `::after` que vive em
        // `scaleX(0)` com a origem à direita e, no cursor, troca a origem para
        // a esquerda e vai a `scaleX(1)`. A troca de origem é o truque — sem
        // ela o traço encolheria de volta por onde veio.
        //
        // **Não há traço em repouso, e isso reverte a regra do sublinhado
        // permanente.** Decisão do dono, com o custo dito: sem cursor o link
        // deixa de se distinguir do texto ao redor e passa a depender de
        // `--primary-accent`. As rodadas 91 a 93 tinham varrido e recuado
        // antes, e a 94 encerrou pedindo a troca seca; esta é a volta do
        // movimento, agora com o traço ausente em repouso em vez de branco.
        //
        // **Continua não sendo `text-decoration`, e a razão é a mesma emenda
        // medida.** O `::first-letter` da base — a garantia de maiúscula do
        // CTA — cria caixa própria para a primeira letra, e a decoração
        // propagada é pintada em **dois segmentos** com uma costura visível a
        // olho nu. Quatro candidatos foram testados a 22× de ampliação:
        // sublinhar também o `::first-letter`, `text-decoration-skip-ink:
        // none` e mover a decoração para o `<span>` **mantêm** a emenda; só
        // uma pintura própria a elimina. **Quem devolver `underline` aqui traz
        // a emenda junto.**
        //
        // O resto da receita — a âncora `calc(50% + 0.5lh)`, o traço morando
        // no `data-slot="button-label"` para ter a largura do texto e não a do
        // botão, e o porquê de `prefers-reduced-motion` não desligar o traço —
        // está em `@utility link-sweep`, em `globals.css`.
        //
        // `brand-rainbow-image` pela mesma razão do `brand`: ela declara
        // `--brand-rainbow` aqui, que é o que o traço de 1px lê no cursor.
        link: "brand-rainbow-image link-sweep text-primary-accent",
      },
      // Uma escada só, de 24 a 40 em degraus de 4, e a coluna `icon-*` espelha
      // a de texto degrau a degrau: `md` casa com `icon-md`, `lg` com
      // `icon-lg`. Não existe `default` na escala — o nome dizia "o padrão" e
      // apontava para 36, que deixou de ser o padrão; um rótulo que promete
      // uma coisa e entrega outra custa mais caro que um degrau a mais.
      //
      // O padrão é `md` (32), o corpo da ação comum. `lg` (36) é a altura de
      // `Input` e `SelectTrigger`: botão colado a campo pede `lg` e alinha sem
      // ajuste.
      size: {
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-control-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xl: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-md": "size-8",
        "icon-lg": "size-9",
        "icon-xl": "size-10",
      },
      // O ícone que gira. `spin` é a meia-volta do "tentar novamente": no
      // cursor (e no toque, pelo par `active:`) as setas giram 180° na mola da
      // casa e voltam ao sair. O `ArrowPathIcon` é simétrico a 180°, então a
      // meia-volta lê como uma volta inteira. É `rotate`, a propriedade
      // independente do Tailwind v4 — ela não disputa com o `translate` do
      // clique —, e o bloco global de movimento reduzido corta a transição.
      // A forma. `rounded` é o canto do sistema (`rounded-lg`, da base);
      // `pill` é a borda 100% arredondada. Na pílula o recuo lateral sobe meio
      // degrau (compostas abaixo): a curva come o canto, e com o recuo do
      // retângulo o rótulo fica espremido contra ela. Nos `icon-*` a pílula é
      // um círculo.
      shape: {
        rounded: "",
        pill: "rounded-full",
      },
      iconMotion: {
        none: "",
        spin: "[&_svg]:transition-[rotate] [&_svg]:duration-(--duration-spring) [&_svg]:ease-(--ease-spring) hover:[&_svg]:rotate-180 active:[&_svg]:rotate-180",
      },
    },
    compoundVariants: [
      { shape: "pill", size: "xs", class: "px-2.5" },
      { shape: "pill", size: "sm", class: "px-3" },
      { shape: "pill", size: "md", class: "px-3.5" },
      { shape: "pill", size: "lg", class: "px-4" },
      { shape: "pill", size: "xl", class: "px-4.5" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "rounded",
      iconMotion: "none",
    },
  }
)

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>

/**
 * O degrau que um `ButtonGroup size` desce aos filhos (rodada 188). Um `size`
 * no próprio botão vence; sem nenhum dos dois, `md`.
 */
const ButtonSizeContext = React.createContext<ButtonSize | undefined>(undefined)

function Button({
  className,
  variant = "primary",
  size: sizeProp,
  shape,
  iconMotion,
  asChild = false,
  children,
  ref,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const groupSize = React.useContext(ButtonSizeContext)
  const size = sizeProp ?? groupSize ?? "md"
  const glowRef = useBrandGlow<HTMLButtonElement>(variant === "brand")

  // A maiúscula inicial é do design system, não de quem escreve o rótulo — mas
  // `::first-letter` não se aplica a `inline-flex`, e o botão precisa ser flex
  // para alinhar ícone. O texto cru vira um `span`, que como item de flex é
  // blocado e aí aceita o pseudo-elemento.
  //
  // Só texto cru. Quem passa um elemento assume a caixa alta — é a saída para
  // um rótulo que precisa de minúscula, como os nomes de prop do catálogo.
  // Com `asChild` nada é embrulhado: o Slot exige um filho único.
  const wrapText = (nodes: React.ReactNode) =>
    React.Children.map(nodes, (child) =>
      typeof child === "string" || typeof child === "number" ? (
        <span data-slot="button-label">{child}</span>
      ) : (
        child
      )
    )

  // Com `asChild` o Slot exige um filho único, então o embrulho desce um nível:
  // clona o filho e embrulha o texto **dele**. Sem isto, `<Button asChild>` com
  // um `<Link>` — que é a forma documentada de botão que navega — ficaria de
  // fora da regra, e ela vale para todo CTA.
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
      data-shape={shape ?? "rounded"}
      data-icon-motion={iconMotion ?? undefined}
      className={cn(buttonVariants({ variant, size, shape, iconMotion, className }))}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, ButtonSizeContext, buttonVariants, type ButtonSize }
