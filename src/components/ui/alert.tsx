"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { composeRefs } from "radix-ui/internal"
import { useBrandGlow } from "@/hooks/use-brand-glow"

/**
 * O aviso que mora dentro do conteúdo. A cor é o `tone` (o nome do `StatCard`,
 * `Progress`, `Timeline`), `variant` é a forma e `size` o corpo.
 *
 * `variant="brand"` é a caixa neutra com o brilho de arco-íris na borda, para
 * quando quem fala é o produto e não o dado da pessoa. Cada tom traz o seu
 * ícone (`TONE_ICON`); a tela não escreve `<svg>` como filho
 * (`alert-icon.test.ts`). `icon={false}` tira; um nó troca.
 */
const alertVariants = cva(
  [
    // Sem `gap-y`: o respiro entre título e descrição é margem da descrição,
    // para a ação `inline` poder ocupar duas linhas sem somar 2px.
    "group/alert relative grid w-full items-start",
    // A ação na linha mora numa terceira coluna `auto`. Uma container query não
    // enxerga o próprio contêiner, então quem pergunta a largura do alerta são
    // os filhos. O contêiner só existe com ela: `inline-size` tira do conteúdo
    // o poder de medir a caixa. Estreita, a ação atravessa as duas colunas.
    "has-[>[data-placement=inline]]:@container/alert",
    "has-[>[data-placement=inline]]:grid-cols-[1fr_auto]",
    "has-[>svg]:has-[>[data-placement=inline]]:grid-cols-[var(--alert-icon)_1fr_auto]",
    // A coluna do texto, que as três peças leem; sem ela uma peça cairia na
    // `auto` por auto-posicionamento.
    "[--alert-text-col:1] has-[>svg]:[--alert-text-col:2]",
    // O × não ocupa célula (é `absolute`); o texto recua para não passar por baixo.
    "has-[>[data-slot=alert-dismiss]]:pe-10 data-[size=sm]:has-[>[data-slot=alert-dismiss]]:pe-8",
    // Quem surge no meio de um formulário esmaece subindo 4px, sem JS.
    "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) starting:translate-y-1 starting:opacity-0",
    // A coluna do ícone é a mesma medida do ícone: uma variável declarada pelo `size`.
    "has-[>svg]:grid-cols-[var(--alert-icon)_1fr]",
    // O raio é do componente, não da variante (canto não é moldura), e desce
    // com o `size`: `md` na linha alta (16), `sm` na linha (12).
    // O deslocamento do ícone é por degrau: (entrelinha − ícone) / 2.
    "[&>svg]:size-(--alert-icon) [&>svg]:shrink-0 [&>svg]:text-current",
  ],
  {
    variants: {
      /** A cor chega ao texto, não só ao ícone: título e descrição herdam a tinta do tom. */
      tone: {
        default: "border-border bg-card bg-clip-padding text-card-foreground",
        info: "border-info/30 bg-info-muted text-info-muted-foreground",
        success:
          "border-success/30 bg-success-muted text-success-muted-foreground",
        warning:
          "border-warning/30 bg-warning-muted text-warning-muted-foreground",
        destructive:
          "border-destructive/35 bg-destructive-muted text-destructive-muted-foreground",
      },
      /**
       * A forma: `soft` (padrão) é o aviso com moldura própria; `brand` é a
       * caixa neutra com o brilho na borda e não aceita `tone`.
       */
      variant: {
        soft: "border",
        /**
         * O brilho de marca: a caixa neutra em repouso e o arco-íris acendendo
         * num arco da borda conforme o ponteiro passa. Nada se move sem o
         * ponteiro; no telefone fica igual ao `soft` de `tone="default"`. A
         * mecânica mora em `@utility brand-glow` e `useBrandGlow`. `isolate` é
         * obrigatório (sem ele o pseudo de `z` negativo some atrás do fundo de
         * um ancestral) e a máscara recorta só o anel, para não cobrir o texto.
         */
        brand: [
          "brand-rainbow-image brand-glow isolate",
          "border border-border bg-card bg-clip-padding text-card-foreground",
        ].join(" "),
      },
      size: {
        sm: "rounded-row px-3 py-2 text-xs [--alert-icon:--spacing(3.5)] has-[>svg]:gap-x-2 [&>svg]:translate-y-px",
        md: "rounded-row-lg px-4 py-3 text-sm [--alert-icon:--spacing(4)] has-[>svg]:gap-x-3 [&>svg]:translate-y-0.5",
      },
    },
    defaultVariants: {
      tone: "default",
      variant: "soft",
      size: "md",
    },
  }
)

/**
 * O `role` sai do tom em vez de ser sempre `"alert"`: `alert` é região viva
 * assertiva (certa para um erro novo, errada para um painel que já estava na
 * página); `status` é a educada. `{...props}` vem depois e sobrescreve.
 */
type AlertBase = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** O ícone. Padrão: o do tom (nenhum em `default`); `false` tira. */
    icon?: React.ReactNode | false
    /** Põe o × no canto; quem chama desmonta o aviso. */
    onDismiss?: () => void
    dismissLabel?: string
  }

/** Um por tom, todos `16/solid`. O destrutivo é o círculo com ×: com o triângulo igual, só a cor separaria "atenção" de "falhou". */
const TONE_ICON = {
  default: null,
  info: <InformationCircleIcon />,
  success: <CheckCircleIcon />,
  warning: <ExclamationTriangleIcon />,
  destructive: <XCircleIcon />,
  brand: <SparklesIcon />,
} as const

/**
 * `tone` e `variant="brand"` são excludentes (o precedente é o `Progress`): a
 * marca não tem gravidade, e juntos o `tailwind-merge` apagaria a superfície
 * tonal. `brand` também não aceita `size="sm"`: `sm` fala com um campo, e a
 * marca fala uma vez por tela, no corpo inteiro.
 */
type AlertProps =
  | (AlertBase & { variant?: "soft" })
  | (AlertBase & { variant: "brand"; tone?: never; size?: "md" })

function Alert({
  className,
  size,
  role,
  ref,
  children,
  icon,
  onDismiss,
  dismissLabel = "Dispensar aviso",
  ...props
}: AlertProps) {
  const { tone, variant, ...rest } = props as AlertBase
  const glowRef = useBrandGlow(variant === "brand")

  // Em `brand` a superfície é a neutra, e `data-tone` diz isso: é ele que faz o
  // cinza do `AlertDescription` seguir a superfície.
  const tomEfetivo = variant === "brand" ? "default" : (tone ?? "default")
  const iconNode =
    icon === false ? null : (icon ?? TONE_ICON[variant === "brand" ? "brand" : tomEfetivo])

  return (
    <div
      data-slot="alert"
      ref={composeRefs(glowRef, ref)}
      data-tone={tomEfetivo}
      data-size={size ?? "md"}
      role={
        // Só o destrutivo interrompe, como na `AnnouncementBar`.
        role ?? (tomEfetivo === "destructive" ? "alert" : "status")
      }
      className={cn(alertVariants({ tone, variant, size }), className)}
      {...rest}
    >
      {iconNode}
      {children}
      {onDismiss ? (
        <Button
          data-slot="alert-dismiss"
          type="button"
          variant="tertiary"
          size="icon-xs"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn(
            // Centrado na primeira linha: (respiro + entrelinha/2) − 12.
            "absolute end-2.5 top-2.5 group-data-[size=sm]/alert:end-1.5 group-data-[size=sm]/alert:top-1",
            // A receita do × da `AnnouncementBar` sem a borda do cursor: flor em
            // `currentColor`, tinta presa, alvo de 46 no dedo por pseudo-elemento.
            "text-current",
            "[--button-hover-fill:color-mix(in_oklab,currentColor_15%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,currentColor_15%,transparent)]",
            "hover:text-current active:text-current",
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
 * O resumo, a linha que o olho lê para decidir se continua. A coluna é
 * `--alert-text-col` (2 com ícone, 1 sem), declarada sempre para a terceira
 * coluna não capturar a peça por auto-posicionamento.
 */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        // `wrap-break-word`: a mensagem de erro do servidor pode ser uma palavra só.
        "font-heading font-medium tracking-tight text-balance wrap-break-word",
        "col-start-(--alert-text-col)",
        className
      )}
      {...props}
    />
  )
}

/**
 * O detalhe sob o resumo, na tinta do alerta a 85%. No tom `default` a
 * superfície é neutra e o cinza é a resposta certa.
 */
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-current/85 group-data-[tone=default]/alert:text-muted-foreground wrap-break-word",
        // O respiro sob o título.
        "[[data-slot=alert-title]~&]:mt-0.5",
        "col-start-(--alert-text-col)",
        "[&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

/**
 * A linha de ação no pé do alerta. É só a linha: quem veste o botão é o
 * `AlertAction`, porque alcançá-lo por seletor descendente só *pedia* a quem
 * chamava o `variant` certo.
 */
function AlertActions({
  className,
  placement = "block",
  ...props
}: React.ComponentProps<"div"> & {
  /** `block` no pé, sob o texto; `inline` à direita dele, descendo para o pé quando o alerta tem menos de 28rem. */
  placement?: "block" | "inline"
}) {
  return (
    <div
      data-slot="alert-actions"
      data-placement={placement}
      className={cn(
        "mt-3.5 flex flex-wrap items-center gap-2",
        "col-start-(--alert-text-col)",
        // Estreita, atravessa o texto e a coluna `auto` (que então mede 0);
        // larga, ocupa só a `auto`, ao lado do título e da descrição.
        "data-[placement=inline]:col-[var(--alert-text-col)/-1]",
        "@md/alert:data-[placement=inline]:col-[-2/-1] @md/alert:data-[placement=inline]:row-[1/span_2] @md/alert:data-[placement=inline]:mt-0 @md/alert:data-[placement=inline]:self-center @md/alert:data-[placement=inline]:ps-3",
        className
      )}
      {...props}
    />
  )
}

/**
 * A ação do alerta, um `Button` que não escolhe cor. A pele sai de
 * `currentColor`, então a mesma linha serve os cinco tons; só a cor da flor do
 * hover (`--button-hover-fill`) muda. O par `dark:` é defensivo, para um peso
 * que volte a declarar o realce sob `dark:`. `asChild` vale (um `<Link>`).
 */
function AlertAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-action"
      type="button"
      variant="tertiary"
      size="sm"
      className={cn(
        "border-current/25 bg-transparent text-current",
        // A cor do realce na pele do alerta: `currentColor` a 10%.
        "[--button-hover-fill:color-mix(in_oklab,currentColor_10%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,currentColor_10%,transparent)]",
        "hover:text-current active:text-current",
        className
      )}
      {...props}
    />
  )
}

export {
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
  alertVariants,
  // O ícone por tom, que a `AnnouncementBar` também veste.
  TONE_ICON,
}
