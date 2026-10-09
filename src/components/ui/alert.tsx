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
import { composeRefs, useBrandGlow } from "@/hooks/use-brand-glow"

/**
 * O aviso que mora dentro do conteúdo.
 *
 * A versão anterior tinha **um eixo com o nome errado e nenhum dos dois que
 * faltavam**. O eixo era `variant`, e carregava as cinco cores semânticas —
 * mas neste projeto essas cinco cores se chamam `tone` em todo lugar
 * (`StatCard`, `Progress`, `Timeline`, `AnnouncementBar`), e o `Alert` era o
 * único que dizia `variant`. Trocar de componente exigia reabrir o fonte para
 * lembrar qual das duas palavras valia — que é exatamente o motivo pelo qual o
 * `neutral` do `StatCard` virou `default` numa rodada anterior.
 *
 * O que faltava, e que as telas escreviam à mão:
 *
 * - **um tamanho**: o alerta compacto do formulário de cartão vem com
 *   `className="gap-2 px-3 py-2.5"`, título em `text-xs` e descrição em
 *   `text-2xs`, tudo escrito na tela;
 * - **um lugar para a ação**: o dashboard põe um `Button` dentro do
 *   `AlertDescription` com cinco classes de cor escritas à mão
 *   (`border-destructive/40 bg-transparent text-destructive-muted-foreground
 *   hover:bg-destructive/10`), e sem o par `active:` que o toque exige.
 *
 * Onze avisos tonais do app são feitos à mão contra quatro que usam este
 * componente. Isso não é desleixo das telas: é o componente não tendo as peças.
 *
 * ## A marca fala aqui, pelo brilho
 *
 * `variant="brand"` é a caixa neutra com o brilho de arco-íris na borda. Ela
 * existe porque este componente e a `AnnouncementBar` são as duas superfícies
 * onde o produto fala sobre **si mesmo**, e nenhuma das duas tinha voz: um
 * "temos novidade" só podia sair de `tone="info"`, o azul da rampa de
 * **estado**. `info` é fato sobre o dinheiro da pessoa; a novidade não é um
 * estado dela. **Nasce sem consumidor no app**, por decisão do dono.
 *
 * ## O ícone é do tom (rodada 186)
 *
 * Cada tom traz o seu (`TONE_ICON`), e a tela não escreve `<svg>` como filho:
 * seis telas escreviam o ícone à mão, cada uma escolhendo um — o destrutivo
 * saía triângulo em cinco e círculo com × no catálogo — e as telas de acesso
 * não tinham ícone nenhum. `icon={false}` tira; um nó troca.
 * `alert-icon.test.ts` impede o ícone de voltar como filho.
 */
const alertVariants = cva(
  [
    // Sem `gap-y`: o respiro entre título e descrição é margem da descrição
    // (ver `AlertDescription`), para a ação `inline` poder ocupar duas linhas
    // sem que uma linha vazia some 2px num aviso só de título.
    "group/alert relative grid w-full items-start",
    // A ação na linha (`AlertActions placement="inline"`) mora numa terceira
    // coluna, `auto`, que existe sempre que ela existe: uma container query
    // **não enxerga o próprio contêiner**, então quem pergunta a largura do
    // alerta são os filhos (medido: `@md/alert:grid-cols-*` no alerta nunca
    // casava). Estreita, a ação atravessa as duas colunas e a `auto` mede 0.
    // O contêiner só existe com ela: `inline-size` tira do conteúdo o poder
    // de medir a caixa, e um alerta num pai que encolhe ao conteúdo cairia a 0.
    "has-[>[data-placement=inline]]:@container/alert",
    "has-[>[data-placement=inline]]:grid-cols-[1fr_auto]",
    "has-[>svg]:has-[>[data-placement=inline]]:grid-cols-[var(--alert-icon)_1fr_auto]",
    // A coluna do texto, que as três peças leem. Com a terceira coluna, uma
    // peça sem coluna declarada cairia na `auto` por auto-posicionamento.
    "[--alert-text-col:1] has-[>svg]:[--alert-text-col:2]",
    // O × não ocupa célula (é `absolute`); o texto recua para não passar
    // por baixo dele — pela presença, como o título do `Dialog`.
    "has-[>[data-slot=alert-dismiss]]:pe-10 data-[size=sm]:has-[>[data-slot=alert-dismiss]]:pe-8",
    // A entrada (rodada 186): quem surge no meio de um formulário — o erro do
    // login, o sucesso num diálogo — esmaece subindo 4px, sem JS. O bloco
    // global de movimento reduzido encurta a transição, e ele aparece na hora.
    "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) starting:translate-y-1 starting:opacity-0",
    // A coluna do ícone deixou de ser um número fixo (`calc(var(--spacing)*4)`)
    // e virou a mesma medida que o ícone: uma variável, declarada pelo `size`,
    // que a grade e o `svg` leem. Antes, mudar o corpo do ícone exigia lembrar
    // de mudar a largura da coluna no outro extremo da string.
    "has-[>svg]:grid-cols-[var(--alert-icon)_1fr]",
    // O raio é do **componente**, não da variante: `variant` decide a moldura
    // (ter borda ou não), e canto não é moldura. Ele estava dentro dela, e o
    // resultado era medível — `soft` saía 14px e `plain` 10px, dois alertas
    // lado a lado com cantos diferentes.
    //
    // **Desde a rodada 241t ele desce com o `size`**, como o do campo e o da
    // dica: `md` veste a linha alta (16) e `sm` a linha (12). Com a
    // superfície (22), o `sm` de 34px saía cápsula, que o dono recusou. O
    // raio mora no eixo `size`, abaixo.
    // O deslocamento do ícone **é por degrau**, e a conta é `(entrelinha −
    // ícone) / 2`: no `md`, (20 − 16) / 2 = 2px; no `sm`, (16 − 14) / 2 = 1px.
    // Ele vivia aqui cravado em 2px e servia só o `md` — medido, todo alerta
    // `sm` saía com o ícone 1px abaixo do centro da primeira linha.
    "[&>svg]:size-(--alert-icon) [&>svg]:shrink-0 [&>svg]:text-current",
  ],
  {
    variants: {
      /**
       * A cor, e ela agora chega ao **texto**, não só ao ícone.
       *
       * Antes o tom pintava a superfície e a borda, e aí o `AlertTitle`
       * carimbava `text-foreground` e o `AlertDescription` carimbava
       * `text-muted-foreground` por cima — de modo que a tinta do tom só
       * alcançava o `svg`. Um alerta destrutivo tinha três cores de texto e
       * nenhuma delas era a do alerta.
       *
       * Medido: cinza sobre o tingido dá 5,1–5,7:1 (passa na norma, e por isso
       * não era um defeito de acessibilidade); a tinta tonal dá 6,9–10,8:1. O
       * problema era de coerência, não de contraste — cinza sobre superfície
       * colorida lê como texto que caiu ali por acidente.
       */
      tone: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/30 bg-info-muted text-info-muted-foreground",
        success:
          "border-success/30 bg-success-muted text-success-muted-foreground",
        warning:
          "border-warning/30 bg-warning-muted text-warning-muted-foreground",
        destructive:
          "border-destructive/35 bg-destructive-muted text-destructive-muted-foreground",
      },
      /**
       * A forma, e são duas. `soft` é o aviso com moldura própria — o padrão, e
       * o que se usa em qualquer lugar. `brand` é a caixa neutra com o brilho
       * de arco-íris na borda, para quando quem fala é o produto e não o dado
       * — e por isso ela não aceita `tone`.
       *
       * **Havia um `plain`**, tingido sem borda, para dentro de formulário ou
       * diálogo "onde a moldura já é de outro e mais uma só acrescenta um
       * retângulo". Ele tinha 8 chamadas em 4 telas de acesso e **saiu a pedido
       * do dono**: o custo é que esses avisos passaram a desenhar a própria
       * borda dentro do formulário, que é exatamente o que ele evitava. Se o
       * retângulo a mais incomodar, o caminho de volta é uma linha (`border-0`)
       * — e a razão de ele ter existido fica escrita aqui.
       */
      variant: {
        soft: "border",
        /**
         * **O brilho de marca**: a caixa neutra em repouso, e o arco-íris
         * acendendo num arco da borda conforme o ponteiro passa pela tela, com
         * um leve borrão. A referência é o `GlowingEffect` da Aceternity, e os
         * números são do dono: blur 2, spread 40, proximity 24, borda 2, zona
         * morta 0,01.
         *
         * **Isto não é o giro da rodada 100.** Lá o degradê rodava sozinho,
         * num laço de 12s/6s, e o dono o recusou inteiro ("péssimo, feio e
         * horrível"); aqui nada se move sem o ponteiro se mover — a forma que
         * a rodada 98 sancionou, a cor ancorada na ponta do mouse.
         *
         * **Ele substituiu a régua de 2px que esta variante tinha.** O custo
         * está dito e é real: sem ponteiro não há brilho, então no telefone o
         * `brand` fica visualmente igual ao `soft` de `tone="default"`.
         * Devolver a régua como repouso é uma linha, se isso incomodar.
         *
         * A mecânica e as quatro medições que a desenharam moram em
         * `@utility brand-glow`, no `globals.css` (e o ponteiro é `useBrandGlow`,
         * em `hooks/use-brand-glow.ts`, que o `Card` também veste). As duas que se veem daqui:
         * **`isolate` é obrigatório** (sem ele o pseudo de `z` negativo cai
         * atrás do fundo de um ancestral e some, medido), e a máscara que
         * recorta só o anel é o que impede o degradê de cobrir o texto, já que
         * numa raiz de empilhamento o filho de `z` negativo pinta **por cima**
         * do fundo do elemento.
         */
        brand: [
          "brand-rainbow-image brand-glow isolate",
          "border border-border bg-card text-card-foreground",
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
 * O `role` sai do tom em vez de ser sempre `"alert"`.
 *
 * `role="alert"` é uma região viva **assertiva**: o leitor de tela interrompe o
 * que estiver dizendo para anunciar o conteúdo. Isso é certo para um erro que
 * acabou de acontecer e errado para um painel explicativo que já estava na
 * página — e o catálogo usa exatamente esse painel em 87 páginas, o que fazia o
 * leitor interromper a cada carga. `status` é a região viva educada.
 *
 * Continua sobrescrevível: `{...props}` vem depois.
 */
type AlertBase = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** O ícone. Padrão: o do tom (nenhum em `default`); `false` tira. */
    icon?: React.ReactNode | false
    /** Põe o × no canto; quem chama desmonta o aviso. */
    onDismiss?: () => void
    dismissLabel?: string
  }

/**
 * Um por tom, todos `16/solid` (o alerta desenha a 14 e 16px). O destrutivo é
 * o círculo com ×, e não o triângulo do `warning`: com os dois iguais, só a
 * cor separava "atenção" de "falhou".
 */
const TONE_ICON = {
  default: null,
  info: <InformationCircleIcon />,
  success: <CheckCircleIcon />,
  warning: <ExclamationTriangleIcon />,
  destructive: <XCircleIcon />,
  brand: <SparklesIcon />,
} as const

/**
 * **`tone` e `variant="brand"` são excludentes**, e o tipo cobra — o precedente
 * é o `Progress`, que faz o mesmo com `tone`, `bands` e `brand`.
 *
 * Os dois respondem à mesma pergunta (que cor tem o aviso) por caminhos
 * diferentes: `tone` é a gravidade de um estado do dado da pessoa, e a marca
 * não tem gravidade nenhuma. Aceitar os dois juntos seria aceitar que um não
 * faz nada — e aqui seria literal, porque `variant` vem depois de `tone` no
 * `cva` e o `tailwind-merge` apaga a superfície tonal.
 *
 * **E `brand` também não aceita `size="sm"`.** Até a rodada 118 a razão era
 * geométrica — a régua de 2px precisava de 8px de recuo para não sair do
 * `rounded-xl` —, e ela saiu com a régua. Fica a semântica, que sempre foi a
 * mais forte: `sm` é o aviso que fala com um campo, e a marca fala uma vez por
 * tela, no corpo inteiro.
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

  // Em `brand` a superfície **é** a neutra, e `data-tone` diz isso: é ele que
  // manda o cinza do `AlertDescription` seguir a superfície em vez da tinta
  // tonal a 85%. Um atributo que mente sobre a cor pintada é pior que nenhum.
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
        // Só o destrutivo interrompe, como na `AnnouncementBar`. Marca não
        // interrompe, e cai no `status` pela mesma linha.
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
            // A receita do × da `AnnouncementBar` sem a borda do cursor (a
            // pedido do dono): flor em `currentColor`, tinta presa no cursor,
            // alvo de 46 no dedo por pseudo-elemento.
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
 * O resumo — a linha que o olho lê para decidir se continua, e a primeira que o
 * leitor de tela anuncia.
 *
 * A coluna é a do texto, `--alert-text-col` (2 com ícone, 1 sem), e ela é
 * declarada sempre: com a ação na linha a grade ganha uma terceira coluna, e
 * uma peça sem coluna cairia nela por auto-posicionamento. Antes era
 * `col-start-2` condicionado ao ícone — e antes disso incondicional, caindo
 * numa coluna implícita de largura zero, por acidente da especificação.
 */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        // `wrap-break-word`: a mensagem de erro do servidor pode ser uma
        // palavra só (um e-mail, um código); três telas o escreviam à mão.
        "font-heading font-medium tracking-tight text-balance wrap-break-word",
        "col-start-(--alert-text-col)",
        className
      )}
      {...props}
    />
  )
}

/**
 * O detalhe sob o resumo.
 *
 * A tinta é a do próprio alerta a 85% — dois níveis dentro de **um** matiz, em
 * vez de um cinza que não pertence à superfície. No tom `default` a superfície
 * é neutra, e aí o cinza é a resposta certa: é a única exceção, e ela está
 * escrita.
 */
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-current/85 group-data-[tone=default]/alert:text-muted-foreground wrap-break-word",
        // O respiro sob o título (era o `gap-y-0.5` do alerta).
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
 * A linha de ação no pé do alerta.
 *
 * Ela existe porque a ação **herda a tinta do aviso**, e sem um lugar isso
 * vira paleta reimportada na tela: o dashboard escrevia
 * `border-destructive/40 bg-transparent text-destructive-muted-foreground
 * hover:bg-destructive/10` num `Button` dentro do `AlertDescription` — cinco
 * classes que só valiam para um dos cinco tons, e um `hover:` sem `active:`.
 *
 * **Ela é só a linha.** Quem veste o botão é o `AlertAction`, logo abaixo — e
 * essa divisão é a correção desta rodada. Antes, esta peça alcançava o botão
 * por **seletor descendente** (`[&_[data-slot=button]]:` cinco vezes) e o
 * JSDoc *pedia* que quem chamasse escrevesse `variant="tertiary"`. Pedir não é
 * garantir, e "compensar geometria por seletor é sintoma de que falta uma
 * peça" — a peça era o botão.
 */
function AlertActions({
  className,
  placement = "block",
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * `block` no pé, sob o texto; `inline` à direita dele, para o aviso curto —
   * e desce para o pé quando o **alerta** tem menos de 28rem.
   */
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
 * A ação do alerta — um `Button` que não escolhe cor nenhuma.
 *
 * **Ele existe porque as seis chamadas escreviam a mesma string**:
 * `type="button" variant="tertiary" size="sm"`, nas três demonstrações do
 * catálogo, na página da folha e no dashboard. Quando o catálogo escreve a
 * anatomia, falta uma peça — e aqui faltava a de baixo: `alert.tsx` importava
 * **zero** componentes e se dizia molécula.
 *
 * **A pele sai de `currentColor`**, então a mesma linha serve os cinco tons sem
 * nomear nenhum. `tertiary` é o degrau certo porque ele já não preenche nada em
 * repouso, e o que se corrige aqui é só a **cor** da flor do hover
 * (`--button-hover-fill`): `currentColor` a 10%, em vez do cinza de `--muted`.
 * O toque vem da própria variante.
 *
 * **O par `dark:` é defensivo desde a rodada 241**: até ali o `tertiary`
 * declarava a cor do realce também sob `dark:`, que vence a classe simples no
 * tema escuro, e sem o par o hover do alerta saía no cinza de `--muted`. Hoje
 * só o `destructive` tem esse par, e o daqui fica para um peso que volte a
 * tê-lo.
 *
 * `asChild` continua valendo: uma das seis chamadas é um `<Link>` dentro do
 * botão, e o tipo o carrega.
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
        // A cor do realce do `tertiary` na pele do alerta: `currentColor` a
        // 10%. O par `dark:` é obrigatório por especificidade (ver acima).
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
}
