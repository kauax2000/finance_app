"use client"

import { XMarkIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Faixa de largura total para um aviso que vale para a sessão inteira: modo
 * offline, convite pendente, manutenção programada.
 *
 * Não é um `Alert`. O Alert fica dentro do conteúdo e fala de uma coisa da tela;
 * este atravessa o topo do app e fala de estado global. Dispensável por padrão,
 * porque um aviso permanente que não se pode fechar vira ruído em uma semana.
 *
 * ## O ícone não é enfeite
 *
 * Ela não tinha nenhum, em nenhum dos cinco tons — a gravidade era dita **só
 * pela cor**, que é exatamente o que o `Alert` resolve com um ícone. A mecânica
 * é a de lá: o ícone entra como filho direto, medido por variável, e o espaço
 * se adapta por `has-[…]`. Sem sub-componente novo.
 *
 * ## O papel segue o tom
 *
 * `role="status"` era cravado, inclusive em `destructive` — um erro bloqueante
 * anunciado com polidez, quando ali o papel é `alert`. Quem precisar de outro
 * ainda passa `role` por fora.
 *
 * ## A marca fala aqui, num véu
 *
 * `variant="brand"` é a faixa sem fundo, com o arco-íris translúcido
 * **atrás** do texto, saindo forte do topo central e deslizando em 20s — o
 * `Banner` rainbow do Fumadocs. Ela existe porque esta barra e o `Alert` são
 * as duas superfícies onde o produto fala sobre **si mesmo**: a demonstração
 * do catálogo anunciava "uma nova versão está disponível" em `tone="info"`,
 * ou seja, o azul da rampa de **estado** carregando o produto se anunciando.
 *
 * ## A altura não depende do botão de fechar
 *
 * Medido antes: **40px sem o ×, 44px com**. O `Button size="xs"` (24) é mais
 * alto que a linha de texto, então era ele quem passava a mandar na altura, e
 * uma barra que ganha o × ao mudar de estado saltava 4px. Agora a linha declara
 * a própria altura mínima e o × cabe dentro dela.
 */
const announcementBarVariants = cva(
  [
    "flex w-full items-center gap-3 text-sm",
    "[&>svg]:size-(--announcement-icon) [&>svg]:shrink-0 [&>svg]:text-current",
  ],
  {
    variants: {
      tone: {
        // O neutro faltava: um aviso sem gravidade era obrigado a se pintar de
        // `info`, que promete informação nova.
        //
        // **`bg-muted` e não `bg-card`, ao contrário do `Alert`, e é medido.**
        // O Alert fica dentro do conteúdo, onde `--card` já o separa da página.
        // Esta faixa atravessa o topo, e ali `--card` seria quase invisível: no
        // tema escuro ele fica a 23 de distância da página, contra os 48 do
        // `--muted`. Uma faixa que não se separa do fundo não é faixa.
        //
        // **O texto, porém, é o cheio** — como no `Alert default`, que usa
        // `text-card-foreground` e não o muted. Com `--muted-foreground` o tom
        // neutro era o que se lia **pior** de todos: 5,04 no claro e 5,86 no
        // escuro, contra 6,9–10,8 dos quatro tonais. Com o foreground cheio,
        // 16,61. Uma faixa cujo trabalho é ser lida não pode ter o texto mais
        // fraco justamente no tom que carrega aviso sem cor para ajudar.
        default: "bg-muted text-foreground",
        info: "bg-info-muted text-info-muted-foreground",
        success: "bg-success-muted text-success-muted-foreground",
        warning: "bg-warning-muted text-warning-muted-foreground",
        destructive: "bg-destructive-muted text-destructive-muted-foreground",
      },
      size: {
        sm: "min-h-9 px-3 py-1.5 text-xs [--announcement-icon:--spacing(3.5)]",
        md: "min-h-11 px-4 py-2 [--announcement-icon:--spacing(4)]",
      },
      // O que o `offline-banner` montava à mão em quatro classes. A camada tem
      // nome na escala — `--z-banner`, 30 — e ela existe para isto.
      sticky: {
        // O fio de baixo herda o tom. Era `border-border/50` — cinza sobre
        // superfície colorida, a mesma família do texto cinza que o `Alert`
        // documenta e reverteu. `current/20` é uma linha só para os cinco tons,
        // e é a decisão que o `AlertActions` já registra.
        true: "sticky top-0 z-(--z-banner) border-b border-current/20",
        false: "",
      },
      // **O véu de marca**, e ele substituiu a régua (o fio de 1px na base).
      // O arco-íris mora num `::before` em `z` negativo, e o `isolate` é o que
      // o mantém visível: sem raiz de empilhamento própria (barra não
      // `sticky`), o pseudo cai atrás do fundo de um ancestral e some. Com ela,
      // a ordem de pintura é a que se quer — fundo da barra, véu, texto.
      //
      // **É arco-íris sob texto**, a exceção consciente à invariante 3: o que
      // a paga é o alfa `--brand-flow-alpha`, medido contra o `--foreground`
      // em `scripts/tone-contrast.mjs`. A receita mora em `@utility
      // brand-flow`.
      //
      // **Sem fundo** (`bg-transparent`, a pedido do dono): quem aparece atrás
      // do véu é o que está atrás da faixa. O `bg-transparent` não é
      // redundante — é ele que o `tailwind-merge` usa para apagar a superfície
      // tonal do `defaultVariants`.
      //
      // **Ele substitui o fio do `sticky`, e não se soma a ele** — daí o
      // `border-b-0`. E daí este eixo ser declarado **depois** do `sticky`
      // nesta lista: o `cva` concatena na ordem das chaves e o `tailwind-merge`
      // resolve por último-vence. A ordem aqui é carga estrutural, não estilo.
      //
      // Pela mesma aritmética, a superfície daqui vence o tom que o
      // `defaultVariants` aplica — e por isso o tipo proíbe `tone` junto de
      // `brand`, para a tela não escrever uma cor que não pinta. **Uma por
      // tela.**
      variant: {
        soft: "",
        brand: [
          "relative isolate border-b-0 bg-transparent text-foreground",
          "before:absolute before:inset-0 before:-z-1 before:content-[''] before:brand-flow",
        ].join(" "),
      },
    },
    defaultVariants: {
      tone: "info",
      size: "md",
      sticky: false,
      variant: "soft",
    },
  }
)

const PAPEL_POR_TOM = {
  default: "status",
  info: "status",
  success: "status",
  warning: "status",
  destructive: "alert",
} as const

type BarBase = React.ComponentProps<"div"> &
  VariantProps<typeof announcementBarVariants> & {
    onDismiss?: () => void
    dismissLabel?: string
  }

/**
 * **`tone` e `variant="brand"` são excludentes**, e o tipo cobra — o
 * precedente é o `Progress`, que faz o mesmo com `tone`, `bands` e `brand`.
 *
 * Os dois respondem à mesma pergunta (que cor tem a faixa) por caminhos
 * diferentes: `tone` é a gravidade do estado, e a marca não tem gravidade
 * nenhuma. Aceitar os dois juntos seria aceitar que um não faz nada — e aqui
 * seria literal, porque o `variant` é declarado depois do `tone` no `cva` e o
 * `tailwind-merge` apaga a superfície tonal.
 */
type AnnouncementBarProps =
  | (BarBase & { variant?: "soft" })
  | (BarBase & { variant: "brand"; tone?: never })

function AnnouncementBar({
  className,
  size,
  sticky,
  role,
  onDismiss,
  dismissLabel = "Dispensar aviso",
  children,
  ...props
}: AnnouncementBarProps) {
  const { tone, variant = "soft", ...rest } = props as BarBase & {
    variant?: "soft" | "brand"
  }

  // Em `brand` a superfície **é** a neutra, então `data-tone` diz `default` em
  // vez de repetir o `info` do `defaultVariants`: um atributo de diagnóstico
  // que mente sobre a cor pintada é pior que nenhum. E marca não interrompe —
  // o papel cai no `status` do tom neutro pela própria tabela.
  const tomEfetivo = variant === "brand" ? "default" : (tone ?? "info")

  return (
    <div
      data-slot="announcement-bar"
      data-tone={tomEfetivo}
      role={role ?? PAPEL_POR_TOM[tomEfetivo]}
      className={cn(
        announcementBarVariants({ tone, size, sticky, variant }),
        className
      )}
      {...rest}
    >
      {children}
      {onDismiss ? (
        <Button
          type="button"
          variant="tertiary"
          size="icon-xs"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn(
            // `ms-auto` e não `flex-1` no texto: assim a barra funciona tanto
            // com `AnnouncementBarContent` quanto com um texto solto como
            // filho, que é como as chamadas mais curtas a escrevem.
            "relative -me-1 ms-auto shrink-0 text-current",
            // **O realce dele é mais forte que o do botão de ação, e não é
            // capricho.** Medido no escuro, `current/10` dá contraste 1,23–1,29
            // contra o fundo — o hover do `Button tertiary` do app dá 1,11 e o
            // do menu 1,14, então o delta já era maior que o da casa. O que
            // falta não é delta: é **área**. Um ícone de 12px numa caixa de 24
            // sem contorno tem um quarto da superfície de um botão de texto, e
            // a mesma diferença de cor lê como menos.
            //
            // Daí as duas alavancas: 15% em vez de 10%, e o contorno
            // aparecendo — é ele que delimita os 24px e diz onde o alvo começa.
            // No hover o × passa a falar exatamente a língua do botão de ação
            // ao lado (preenchimento fraco + `current/25` de borda).
            // **E os 15% agora moram no disco da rodada 99, não num fundo
            // chapado.** Este botão e o `AnnouncementBarAction` ficaram de fora
            // daquela rodada: mantinham `hover:bg-current/N` e nunca declaravam
            // `--button-fill-color`, então herdavam o cinza de `--muted` do
            // `tertiary` e o realce pintava **duas** camadas — a tinta do tom na
            // caixa toda e um disco cinza crescendo por cima.
            //
            // Medido no tema claro, onde `--muted` é opaco (`oklch(0.94 0 0)`):
            // os quatro tons convergiam no **mesmo** cinza `235,235,235` —
            // `info` saía de `200,241,255` e `warning` de `255,234,186` para o
            // mesmo lugar. O realce não realçava o tom, apagava. No escuro o
            // disco é 50% e o efeito era dessaturação (`warning` de `78,45,0`
            // para `67,50,28`).
            //
            // **Ninguém viu porque a razão de luminância é 1,007–1,078** — o
            // defeito é cromático, e os scripts da casa só medem luminância. Com
            // `currentColor` no disco: 1,16–1,19 no claro e 1,26–1,30 no escuro,
            // a faixa que o `bg-current/10` desta casa sempre registrou.
            //
            // O `dark:` não é redundante, e a falta dele era um defeito medido:
            // `.cls:is(.dark *)` é (0,2,0) contra os (0,1,0) de `.cls`, então a
            // declaração do `tertiary` sob `dark:` vence esta classe simples no
            // tema escuro. `currentColor` inverte sozinho, mas a regra que o lê
            // precisa vencer a do peso. É a mesma armadilha que o `AlertAction`
            // já pagou duas vezes.
            "[--button-fill-color:color-mix(in_oklab,currentColor_15%,transparent)]",
            "dark:[--button-fill-color:color-mix(in_oklab,currentColor_15%,transparent)]",
            // A borda é a **segunda** alavanca, e fica: é ela que delimita os
            // 24px e diz onde o alvo começa.
            "hover:border-current/25 active:border-current/25",
            // E a tinta do ícone tem de ser presa: o `tertiary` declara
            // `hover:text-foreground`, que é (0,2,0) contra o (0,1,0) do
            // `text-current` da base — sem este par, o × trocava a tinta do tom
            // pelo cinza neutro no cursor.
            "hover:text-current active:text-current",
            // O alvo cresce por pseudo-elemento, e não por medida: aumentar a
            // caixa devolveria o salto de altura que esta rodada tirou. 10px de
            // cada lado levam os 22 da caixa de padding a 46 (a borda não conta).
            "pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']"
          )}
        >
          <XMarkIcon aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}

/**
 * O texto do aviso, quando ele deve **ocupar a sobra** — numa barra com ações,
 * é o que mantém os botões colados na borda em vez de logo depois da frase.
 *
 * É opcional: um texto solto como filho também funciona, porque quem se empurra
 * para a borda é o × (e as ações), com `ms-auto`.
 */
function AnnouncementBarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="announcement-bar-content"
      className={cn("min-w-0 flex-1 text-pretty", className)}
      {...props}
    />
  )
}

/**
 * A fileira de ações, à direita do texto.
 *
 * **Ela é só a fileira.** Quem veste o botão é o `AnnouncementBarAction` — e
 * essa divisão é a correção desta rodada. Antes, esta peça alcançava o botão
 * por **seletor descendente** (`[&_[data-slot=button]]:` quatro vezes) e o
 * JSDoc *pedia* que quem chamasse escrevesse `variant="tertiary" size="xs"`.
 * Pedir não é garantir, e o seletor ainda empatava em especificidade com o
 * `dark:hover:` do `tertiary` — (0,3,0) contra (0,3,0) —, deixando o realce do
 * tema escuro para a ordem de emissão decidir.
 */
function AnnouncementBarActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="announcement-bar-actions"
      className={cn("ms-auto flex shrink-0 items-center gap-1.5", className)}
      {...props}
    />
  )
}

/**
 * A ação da barra — um `Button` que não escolhe cor nenhuma.
 *
 * Irmão do `AlertAction`, e o degrau é **outro de propósito**: `xs` contra o
 * `sm` do alerta, porque a barra é mais densa — ela atravessa o topo do app e
 * não pode empurrar o conteúdo para baixo.
 *
 * O realce é `current/10`, e não `foreground/10`: os dois são quase iguais no
 * escuro e visivelmente diferentes no claro, e o `AlertAction` — o precedente
 * documentado — usa `current`. Desde esta rodada ele é o **disco** da rodada 99
 * e não um fundo chapado, e o par `dark:` é obrigatório pela mesma aritmética
 * escrita no × acima.
 *
 * **E ele fica mais fraco que o ×, de propósito**: 10% aqui contra 15% lá. O ×
 * é um ícone de 12px numa caixa de 24 sem contorno, e a mesma diferença de cor
 * em um quarto da área lê como menos.
 */
function AnnouncementBarAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="announcement-bar-action"
      type="button"
      variant="tertiary"
      size="xs"
      className={cn(
        "border-current/25 bg-transparent text-current",
        // A cor do disco da rodada 99, na pele da barra — `currentColor` a 10%,
        // o mesmo tom de antes, agora nascendo sob o ponteiro em vez de chapar
        // a caixa. O par `dark:` é obrigatório por especificidade, e as
        // medições que motivaram a troca estão no × acima.
        "[--button-fill-color:color-mix(in_oklab,currentColor_10%,transparent)]",
        "dark:[--button-fill-color:color-mix(in_oklab,currentColor_10%,transparent)]",
        "hover:text-current active:text-current",
        className
      )}
      {...props}
    />
  )
}

export {
  AnnouncementBar,
  AnnouncementBarAction,
  AnnouncementBarActions,
  AnnouncementBarContent,
  announcementBarVariants,
}
