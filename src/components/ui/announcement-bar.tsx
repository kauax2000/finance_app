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
    "has-[>svg]:gap-x-3 [&>svg]:size-(--announcement-icon) [&>svg]:shrink-0 [&>svg]:text-current",
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
    },
    defaultVariants: {
      tone: "info",
      size: "md",
      sticky: false,
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

function AnnouncementBar({
  className,
  tone,
  size,
  sticky,
  role,
  onDismiss,
  dismissLabel = "Dispensar aviso",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof announcementBarVariants> & {
    onDismiss?: () => void
    dismissLabel?: string
  }) {
  return (
    <div
      data-slot="announcement-bar"
      data-tone={tone ?? "info"}
      role={role ?? PAPEL_POR_TOM[tone ?? "info"]}
      className={cn(
        announcementBarVariants({ tone, size, sticky }),
        className
      )}
      {...props}
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
            "relative -mr-1 ms-auto shrink-0 text-current",
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
            "hover:border-current/25 hover:bg-current/15",
            "active:border-current/25 active:bg-current/15",
            // O alvo cresce por pseudo-elemento, e não por medida: aumentar a
            // caixa devolveria o salto de altura que esta rodada tirou. 10px de
            // cada lado levam 24 a 44.
            "pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']"
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
 * As ações — "Você está offline — [Tentar de novo]", que é o caso canônico e
 * não tinha lugar.
 *
 * O botão de dentro não declara cor: `tertiary` mais `currentColor` serve os
 * cinco tons com a mesma linha, e vem com o par `active:`. É a decisão que o
 * `AlertActions` já registra — escrever `border-warning/40
 * hover:bg-warning/10` aqui seria reimportar a paleta para dentro da tela.
 */
function AnnouncementBarActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="announcement-bar-actions"
      className={cn(
        "ms-auto flex shrink-0 items-center gap-1.5",
        // O realce é `current/10`, e não `foreground/10`. Os dois são quase
        // iguais no escuro e visivelmente diferentes no claro, e o
        // `AlertActions` — o precedente documentado — usa `current`: "borda,
        // tinta e realce saem de `currentColor`". A versão anterior desta
        // linha divergia dele, e o toast herdaria a divergência ao copiar
        // daqui.
        "[&_[data-slot=button]]:border-current/25 [&_[data-slot=button]]:text-current",
        "[&_[data-slot=button]]:hover:bg-current/10 [&_[data-slot=button]]:active:bg-current/10",
        className
      )}
      {...props}
    />
  )
}

export {
  AnnouncementBar,
  AnnouncementBarActions,
  AnnouncementBarContent,
  announcementBarVariants,
}
