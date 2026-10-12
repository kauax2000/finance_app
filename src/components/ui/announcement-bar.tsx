"use client"

import { XMarkIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
// Os ícones por tom são os do `Alert`, e pela mesma razão: o destrutivo não é
// o triângulo.
import { TONE_ICON } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

/**
 * Faixa de largura total para um aviso da sessão inteira: modo offline, convite
 * pendente, manutenção. Não é um `Alert` (que fala de uma coisa da tela).
 * Dispensável sempre que o estado permitir (`onDismiss`).
 *
 * Cada tom traz o seu ícone (`icon` troca, `icon={false}` tira). O `role` segue
 * o tom (`alert` em `destructive`). `variant="brand"` é a faixa sem fundo com o
 * arco-íris translúcido atrás do texto, para o produto falar de si. A linha
 * declara a própria altura mínima, para o × não mudar a altura da barra.
 */
const announcementBarVariants = cva(
  [
    "group/announcement flex w-full items-center gap-3 text-sm",
    // A entrada esmaece e desce, em CSS; o bloco global de movimento reduzido
    // encurta a transição.
    "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) starting:opacity-0",
    "[&>svg]:size-(--announcement-icon) [&>svg]:shrink-0 [&>svg]:text-current",
  ],
  {
    variants: {
      tone: {
        // `bg-muted` e não `bg-card`: a faixa atravessa o topo, onde `--card`
        // mal se separa da página no escuro. O texto é o cheio (como no `Alert
        // default`); com `--muted-foreground` o neutro seria o tom lido pior.
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
      // Onde a faixa mora; a camada é `--z-banner`. O `relative` do `static`
      // existe porque o véu de marca é um pseudo `absolute`; na variante
      // `brand` ele vencia o `sticky` no `tailwind-merge`.
      position: {
        static: "relative starting:-translate-y-1",
        // O fio de baixo herda o tom (`current/20`, uma linha para os cinco).
        sticky:
          "sticky top-0 z-(--z-banner) border-b border-current/20 starting:-translate-y-full",
        // Presa à janela: o `top` é de quem chama quando há outra barra fixa acima.
        fixed:
          "fixed inset-x-0 top-0 z-(--z-banner) border-b border-current/20 starting:-translate-y-full",
      },
      // O anúncio de produto centraliza; o aviso de estado lê da borda. O ×
      // sai do fluxo para o recuo ficar simétrico.
      align: {
        start: "",
        center:
          "justify-center text-center has-[>[data-slot=announcement-bar-dismiss]]:px-11",
      },
      // O véu de marca substituiu a régua. O arco-íris mora num `::before` em
      // `z` negativo e o `isolate` o mantém visível. É arco-íris sob texto,
      // pago pelo alfa `--brand-flow-alpha` (`scripts/tone-contrast.mjs`);
      // receita em `@utility brand-flow`. `bg-transparent` apaga a superfície
      // tonal do `defaultVariants`, e `border-b-0` o fio do `sticky`. A ordem
      // deste eixo depois do `position` é estrutural (último vence no
      // `tailwind-merge`). Uma por tela.
      variant: {
        soft: "",
        brand: [
          "isolate border-b-0 bg-transparent text-foreground",
          "before:absolute before:inset-0 before:-z-1 before:content-[''] before:brand-flow",
        ].join(" "),
      },
    },
    defaultVariants: {
      tone: "info",
      size: "md",
      position: "static",
      align: "start",
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
    /** O ícone. Padrão: o do tom (nenhum em `default`); `false` tira. */
    icon?: React.ReactNode | false
    onDismiss?: () => void
    dismissLabel?: string
  }

/**
 * `tone` e `variant="brand"` são excludentes (o precedente é o `Progress`): a
 * marca não tem gravidade, e juntos o `tailwind-merge` apagaria a superfície
 * tonal.
 */
type AnnouncementBarProps =
  | (BarBase & { variant?: "soft" })
  | (BarBase & { variant: "brand"; tone?: never })

function AnnouncementBar({
  className,
  size,
  position,
  align,
  role,
  icon,
  onDismiss,
  dismissLabel = "Dispensar aviso",
  children,
  ...props
}: AnnouncementBarProps) {
  const { tone, variant = "soft", ...rest } = props as BarBase & {
    variant?: "soft" | "brand"
  }

  // Em `brand` a superfície é a neutra: `data-tone` diz `default`, e marca não
  // interrompe (o papel cai no `status`).
  const tomEfetivo = variant === "brand" ? "default" : (tone ?? "info")
  const iconNode =
    icon === false ? null : (icon ?? TONE_ICON[variant === "brand" ? "brand" : tomEfetivo])

  return (
    <div
      data-slot="announcement-bar"
      data-tone={tomEfetivo}
      data-align={align ?? "start"}
      role={role ?? PAPEL_POR_TOM[tomEfetivo]}
      className={cn(
        announcementBarVariants({ tone, size, position, align, variant }),
        className
      )}
      {...rest}
    >
      {iconNode}
      {children}
      {onDismiss ? (
        <Button
          data-slot="announcement-bar-dismiss"
          type="button"
          variant="tertiary"
          size="icon-xs"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn(
            // `ms-auto` e não `flex-1` no texto: a barra funciona também com um
            // texto solto como filho.
            "relative -me-1 ms-auto shrink-0 text-current",
            // Centralizada, o × sai do fluxo e fica na borda.
            "group-data-[align=center]/announcement:absolute group-data-[align=center]/announcement:end-3 group-data-[align=center]/announcement:me-0",
            // O realce é mais forte que o da ação (15% contra 10%): um ícone de
            // 12px numa caixa de 24 tem um quarto da área, e a mesma diferença
            // de cor lê como menos. Herdando o `--muted` do `tertiary` os tons
            // convergiam no mesmo cinza no claro, daí `currentColor`. O `dark:`
            // é necessário: `.cls:is(.dark *)` (0,2,0) vence a classe simples.
            "[--button-hover-fill:color-mix(in_oklab,currentColor_15%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,currentColor_15%,transparent)]",
            // A tinta do ícone é presa: o `hover:text-foreground` do
            // `tertiary` (0,2,0) venceria o `text-current` da base.
            "hover:text-current active:text-current",
            // O alvo cresce por pseudo-elemento: aumentar a caixa devolveria o
            // salto de altura.
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
 * O texto do aviso, quando deve ocupar a sobra (mantém os botões na borda). É
 * opcional: um texto solto também funciona, porque o × e as ações usam `ms-auto`.
 */
function AnnouncementBarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="announcement-bar-content"
      className={cn(
        "min-w-0 flex-1 text-pretty",
        // Centralizada, o texto não ocupa a sobra.
        "group-data-[align=center]/announcement:flex-none",
        className
      )}
      {...props}
    />
  )
}

/**
 * A fileira de ações. Quem veste o botão é o `AnnouncementBarAction`: alcançar
 * o botão por seletor descendente empatava em especificidade com o
 * `dark:hover:` do `tertiary`.
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
        "group-data-[align=center]/announcement:ms-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * A ação da barra, um `Button` que não escolhe cor. Irmão do `AlertAction`, no
 * degrau `xs` porque a barra é mais densa. O realce é `current/10` (mais fraco
 * que o ×, de área maior), na camada `--button-hover-fill` do `tertiary`, com
 * o par `dark:` obrigatório.
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
        // O realce na pele da barra: `currentColor` a 10%, com o par `dark:`.
        "[--button-hover-fill:color-mix(in_oklab,currentColor_10%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,currentColor_10%,transparent)]",
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
