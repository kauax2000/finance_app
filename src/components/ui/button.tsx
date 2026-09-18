import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,translate] duration-(--duration-fast) ease-(--ease-out) outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>[data-slot=button-label]]:first-letter:uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // A hierarquia é uma escada, e ela desce em peso visual, não só em nome:
      // `primary` preenche de preto (branco no escuro), `secondary` preenche
      // de cinza, `tertiary` não preenche nada. Uma tela tem um `primary` só.
      //
      // `outline` fica de fora da escada de propósito: é a exceção, para
      // quando um controle precisa de contorno próprio (um par de navegação,
      // um filtro que alterna) e nenhum dos três degraus serve. `brand`
      // também fica de fora: é a mesma tecla do `primary` com o arco-íris da
      // marca em volta, para **um** CTA de marca por tela — entrar, começar.
      // O arco-íris não entra no `primary` porque um acento em todo botão
      // deixa de ser acento.
      //
      // `success` e `warning` foram removidos: nomeavam um estado, não um
      // peso, e nenhuma tela do app chegou a usá-los. Estado de sucesso e de
      // atenção continua sendo trabalho do `Badge` e do `Alert`.
      variant: {
        // O primário é uma tecla: corpo chapado, contorno e plinto mais escuros
        // (`--primary-edge`), um fio de luz de 1px no topo e `shadow-xs` por
        // fora. O plinto é sombra **interna**, então a caixa continua com a
        // altura do degrau e alinhada ao `Input` do lado.
        //
        // Cursor e toque escurecem por token (`--primary-hover`), não por alfa:
        // `bg-primary/90` clareava num tema e escurecia no outro. Ao apertar a
        // tecla afunda — o plinto e a sombra somem e entra uma sombra interna
        // no topo —, e enviando (`aria-busy`) ela fica afundada com opacidade
        // cheia, para "salvando" não ler como "desabilitado". Os estados de
        // envio vão sob `aria-busy:disabled:` porque `disabled:` e `aria-busy:`
        // empatam em especificidade, e juntos vencem.
        //
        // Não é vidro, e não deve virar: a luz clara no corpo ou na borda foi
        // reprovada quatro vezes (a lápide está em `lib/glass-classes.ts`).
        primary:
          "border-primary-edge bg-primary text-primary-foreground shadow-(--primary-shadow-value) hover:bg-primary-hover active:bg-primary-hover aria-expanded:bg-primary-hover active:shadow-(--primary-shadow-pressed-value) aria-busy:disabled:shadow-(--primary-shadow-pressed-value) aria-busy:disabled:opacity-100 disabled:shadow-none",
        // A tecla de marca. Três camadas, e a ordem delas é a razão do
        // arranjo: o botão em si não pinta nada (`isolate` o faz raiz de
        // empilhamento; a base já traz `border-transparent`), o `::before`
        // é o preenchimento **e** o contorno — o preto em `padding-box` sobre
        // o arco-íris em `border-box`, com 1px de borda transparente entre
        // os dois, que é por onde o arco-íris aparece —, e o `::after` é o
        // halo: o mesmo degradê, borrado, uma camada abaixo.
        //
        // Por que não `bg-primary` no próprio botão: numa raiz de
        // empilhamento o fundo do elemento pinta **antes** dos filhos de
        // `z-index` negativo, então um `::before` a `-z-10` cobriria a tecla
        // em vez de ficar atrás dela. O preenchimento vai para o pseudo por
        // isso, e o hover troca a variável que ele lê.
        //
        // Sem grão: numa área de 32px o grão é ruído, não textura. Sem a
        // sombra da tecla: o contorno arco-íris já é a aresta.
        //
        // `brand-rainbow-image` **não é redundante**, e não se apaga: ela é
        // quem declara `--brand-rainbow` no botão. O degradê saiu do `:root`
        // porque um `var()` dentro de uma propriedade personalizada é
        // substituído onde ela é **declarada** — no `:root`, o
        // `var(--brand-angle)` congelava em 0deg e o arco-íris nunca girava.
        // Os dois pseudo-elementos herdam daqui o valor já substituído, então
        // basta a classe no elemento. Ver `@utility brand-rainbow-image` em
        // `globals.css`.
        brand:
          "brand-rainbow-image relative isolate text-primary-foreground [--brand-fill:var(--primary)] hover:[--brand-fill:var(--primary-hover)] active:[--brand-fill:var(--primary-hover)] aria-expanded:[--brand-fill:var(--primary-hover)] before:absolute before:-inset-px before:-z-10 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(var(--brand-fill),var(--brand-fill))_padding-box,var(--brand-rainbow)_border-box] before:transition-[background] before:duration-(--duration-fast) after:absolute after:-inset-1 after:-z-20 after:rounded-[inherit] after:bg-(image:--brand-rainbow) after:opacity-50 after:blur-md after:transition-opacity after:duration-(--duration-fast) hover:after:opacity-80 active:after:opacity-80 aria-busy:disabled:opacity-100",
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
        secondary:
          "bg-clip-border bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        // O par `active:` não é redundante com o `hover:`: `hover:` compila
        // dentro de `@media (hover: hover)`, então sem ele **o terciário não
        // devolvia nada ao toque** — em nenhuma das telas que o usam. Era um
        // item de backlog nomeado, e o conserto mora aqui e não em cada
        // chamada, que é onde `Toggle`, `Tabs`, `Menubar`, `Item` e `Calendar`
        // já o escreviam à mão.
        //
        // O `dark:active:` vem junto pela aritmética de sempre: `&:active` e
        // `&:is(.dark *)` empatam em especificidade e o `dark:` é emitido
        // depois, então sem o par o realce escuro venceria o de toque — calado,
        // e só num tema.
        tertiary:
          "hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 dark:active:bg-muted/50",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input-fill/30 dark:hover:bg-input-fill/50 dark:active:bg-input-fill/50",
        destructive:
          "bg-destructive/10 text-destructive-muted-foreground hover:bg-destructive/20 active:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:active:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        // O link é sublinhado **sempre**: com a marca preta ele tem a cor do
        // texto, e sem o traço nada o distinguia até o cursor passar — o que
        // no toque é nunca. No cursor e no toque o traço vira arco-íris, que é
        // um `background` de 1px no pé da caixa de conteúdo, e não um
        // `text-decoration`, porque decoração não aceita degradê.
        // `brand-rainbow-image` pela mesma razão do `brand`: ela declara
        // `--brand-rainbow` aqui, que é o que o sublinhado de 1px lê.
        link: "brand-rainbow-image text-primary-accent underline underline-offset-4 decoration-1 hover:no-underline hover:bg-(image:--brand-rainbow) hover:bg-[length:100%_1px] hover:bg-bottom hover:bg-no-repeat hover:bg-clip-content hover:bg-origin-content active:no-underline active:bg-(image:--brand-rainbow) active:bg-[length:100%_1px] active:bg-bottom active:bg-no-repeat active:bg-clip-content active:bg-origin-content",
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
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

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
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants }
