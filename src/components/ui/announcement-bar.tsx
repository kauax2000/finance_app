"use client"

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Faixa de largura total para um aviso que vale para a sessão inteira: modo
 * offline, convite pendente, manutenção programada.
 *
 * Não é um `Alert`. O Alert fica dentro do conteúdo e fala de uma coisa da tela;
 * este atravessa o topo do app e fala de estado global. Dispensável sempre que
 * o estado permitir (`onDismiss`), porque um aviso permanente que não se pode
 * fechar vira ruído em uma semana.
 *
 * ## O ícone não é enfeite
 *
 * Ela não tinha nenhum, em nenhum dos cinco tons — a gravidade era dita **só
 * pela cor**. Desde a rodada 187 cada tom traz o seu, com a API do `Alert`:
 * `icon` troca (o offline usa o sinal cortado), `icon={false}` tira, e a tela
 * não escreve o `svg` como filho.
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
    "group/announcement flex w-full items-center gap-3 text-sm",
    // A entrada (rodada 187): esmaece e desce — da altura inteira quando
    // presa ao topo, 4px em fluxo (ver `position`). Sem JS; o bloco global de
    // movimento reduzido encurta a transição.
    "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) starting:opacity-0",
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
      // Onde a faixa mora. Era o booleano `sticky`, e o `offline-banner`
      // montava o `fixed` à mão em quatro classes. A camada tem nome na
      // escala — `--z-banner`, 30 — e ela existe para isto.
      //
      // **O `relative` do `static` não é enfeite**: o véu de marca é um
      // pseudo `absolute` e precisa de um ancestral posicionado. Ele morava
      // na variante `brand`, e ali **vencia o `sticky` no `tailwind-merge`**
      // (mesmo grupo, último vence) — `variant="brand" sticky` nunca prendeu.
      // `sticky` e `fixed` já são posicionados.
      position: {
        static: "relative starting:-translate-y-1",
        // O fio de baixo herda o tom. Era `border-border/50` — cinza sobre
        // superfície colorida, a mesma família do texto cinza que o `Alert`
        // documenta e reverteu. `current/20` é uma linha só para os cinco tons,
        // e é a decisão que o `AlertActions` já registra.
        sticky:
          "sticky top-0 z-(--z-banner) border-b border-current/20 starting:-translate-y-full",
        // Presa à janela: o `top` é de quem chama quando há outra barra fixa
        // acima (o offline passa por baixo do cabeçalho do telefone).
        fixed:
          "fixed inset-x-0 top-0 z-(--z-banner) border-b border-current/20 starting:-translate-y-full",
      },
      // O anúncio de produto ("Nova versão · Ver novidades") centraliza; o
      // aviso de estado lê da borda. O × sai do fluxo e o recuo fica
      // simétrico, senão ele empurraria o miolo meio botão para o lado.
      align: {
        start: "",
        center:
          "justify-center text-center has-[>[data-slot=announcement-bar-dismiss]]:px-11",
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
      // `border-b-0`. E daí este eixo ser declarado **depois** do `position`
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

/** Os mesmos do `Alert`, e pela mesma razão: o destrutivo não é o triângulo. */
const TONE_ICON = {
  default: null,
  info: <InformationCircleIcon />,
  success: <CheckCircleIcon />,
  warning: <ExclamationTriangleIcon />,
  destructive: <XCircleIcon />,
  brand: <SparklesIcon />,
} as const

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

  // Em `brand` a superfície **é** a neutra, então `data-tone` diz `default` em
  // vez de repetir o `info` do `defaultVariants`: um atributo de diagnóstico
  // que mente sobre a cor pintada é pior que nenhum. E marca não interrompe —
  // o papel cai no `status` do tom neutro pela própria tabela.
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
            // `ms-auto` e não `flex-1` no texto: assim a barra funciona tanto
            // com `AnnouncementBarContent` quanto com um texto solto como
            // filho, que é como as chamadas mais curtas a escrevem.
            "relative -me-1 ms-auto shrink-0 text-current",
            // Centralizada, o × sai do fluxo e fica na borda, na mesma
            // distância (o `-me-1` sobre o `px-4` dá 12).
            "group-data-[align=center]/announcement:absolute group-data-[align=center]/announcement:end-3 group-data-[align=center]/announcement:me-0",
            // **O realce dele é mais forte que o do botão de ação, e não é
            // capricho.** Medido no escuro, `current/10` dá contraste 1,23–1,29
            // contra o fundo — o hover do `Button tertiary` do app dá 1,11 e o
            // do menu 1,14, então o delta já era maior que o da casa. O que
            // falta não é delta: é **área**. Um ícone de 12px numa caixa de 24
            // sem contorno tem um quarto da superfície de um botão de texto, e
            // a mesma diferença de cor lê como menos.
            //
            // Daí os 15% em vez de 10%. Havia uma segunda alavanca, o contorno
            // `current/25` no cursor, e ela saiu a pedido do dono (rodada 187),
            // junto com a do × do `Alert`.
            //
            // **O defeito que esta cor conserta é cromático**: herdando o
            // `--muted` do `tertiary`, os quatro tons convergiam no **mesmo**
            // cinza `235,235,235` no tema claro — o realce apagava o tom em
            // vez de realçá-lo —, e ninguém viu porque a razão de luminância é
            // 1,007–1,078. Com `currentColor`: 1,16–1,19 no claro e 1,26–1,30
            // no escuro.
            //
            // O `dark:` não é redundante: `.cls:is(.dark *)` é (0,2,0) contra
            // os (0,1,0) de `.cls`, então a cor da flor que o `tertiary`
            // declara sob `dark:` vence a classe simples no tema escuro.
            "[--button-bloom-fill:color-mix(in_oklab,currentColor_15%,transparent)] dark:[--button-bloom-fill:color-mix(in_oklab,currentColor_15%,transparent)]",
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
      className={cn(
        "min-w-0 flex-1 text-pretty",
        // Centralizada, o texto não ocupa a sobra: ele e as ações vão juntos
        // para o meio.
        "group-data-[align=center]/announcement:flex-none",
        className
      )}
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
 * A ação da barra — um `Button` que não escolhe cor nenhuma.
 *
 * Irmão do `AlertAction`, e o degrau é **outro de propósito**: `xs` contra o
 * `sm` do alerta, porque a barra é mais densa — ela atravessa o topo do app e
 * não pode empurrar o conteúdo para baixo.
 *
 * O realce é `current/10`, e não `foreground/10`: os dois são quase iguais no
 * escuro e visivelmente diferentes no claro, e o `AlertAction` — o precedente
 * documentado — usa `current`. O realce é a **flor** do `tertiary`
 * (`--button-bloom-fill`), e o par `dark:` é obrigatório pela mesma aritmética
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
        // A cor da flor na pele da barra — `currentColor` a 10%. O par
        // `dark:` é obrigatório por especificidade; as medições estão no ×.
        "[--button-bloom-fill:color-mix(in_oklab,currentColor_10%,transparent)] dark:[--button-bloom-fill:color-mix(in_oklab,currentColor_10%,transparent)]",
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
