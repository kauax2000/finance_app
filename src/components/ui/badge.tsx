"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { useBrandGlow } from "@/hooks/use-brand-glow"
import { cn } from "@/lib/utils"

/**
 * **A superfície tonal, e ela mora aqui.**
 *
 * Estas constantes viviam em `lib/tag-chip-classes.ts`, e as tintas `soft` do
 * `Badge` eram uma segunda cópia das mesmas sete strings — já divergente: o
 * `Badge` não tinha o par `dark:hover:`. Hoje as tintas abaixo leem daqui, e a
 * tela que precisa da superfície **fora** do componente (gatilho de menu, botão
 * de filtro, pílula de linha de tabela) importa as mesmas constantes do mesmo
 * arquivo. Os nomes ficaram, para a mudança nas telas ser só de caminho.
 */

/** Concluído, pago, ativo. */
export const tagChipSuccess =
  "bg-success-muted text-success-muted-foreground"

/** Atrasado, cancelado, falhou. */
export const tagChipDanger =
  "bg-destructive-muted text-destructive-muted-foreground"

/** Receita — os tokens de dinheiro, mais saturados que os de status. */
export const tagChipIncome =
  "bg-income-muted text-income-muted-foreground"

/** Despesa — os tokens de dinheiro, mais saturados que os de status. */
export const tagChipExpense =
  "bg-expense-muted text-expense-muted-foreground"

/** Pendente, rascunho, sem estado. */
export const tagChipNeutral =
  "bg-muted text-muted-foreground"

/** Vence hoje, perto do limite. */
export const tagChipWarning =
  "bg-warning-muted text-warning-muted-foreground"

/** Informativo, em análise. */
export const tagChipInfo =
  "bg-info-muted text-info-muted-foreground"

/** Só o `Badge` usa: a marca em tinta suave não tem chip fora dele. */
const tagChipPrimary =
  "bg-primary-muted text-primary-muted-foreground"

/** Apelido de `info`, do tempo em que a tela escolhia o tom. Não use em código novo. */
export const tagChipViolet =
  "bg-info-muted/80 text-info-muted-foreground hover:bg-info-muted dark:hover:bg-info-muted"

/** Apelido de `info`, idêntico a ele. Não use em código novo. */
export const tagChipSky = tagChipInfo

/** Contagem sobre um ícone. Sem hover, porque não é clicável. */
export const tagChipUnreadCount =
  "bg-success-muted text-success-muted-foreground dark:bg-success-muted/70"

/** Chip de filtro selecionado — tonal, não preenchido. */
export const tagChipFilterSelected =
  "bg-primary-muted text-primary-muted-foreground ring-1 ring-primary-accent/25 dark:ring-primary-accent/40"

/** Chip de filtro disponível. */
export const tagChipFilterIdle = tagChipNeutral

/** Gatilho de menu com período ativo, na paleta de success. */
export const tagChipSuccessMenuTrigger = cn(
  tagChipSuccess,
  "border-0 shadow-none hover:border-0",
  "aria-expanded:border-0 aria-expanded:bg-success-muted/90 aria-expanded:text-success-muted-foreground",
  "data-[state=open]:border-0 data-[state=open]:bg-success-muted/90 data-[state=open]:text-success-muted-foreground",
  "dark:border-0 dark:hover:border-0",
  // A tinta é a do par -muted: `success-foreground` sobre `success-muted` sumia no escuro.
  "dark:aria-expanded:bg-success-muted dark:aria-expanded:text-success-muted-foreground",
  "dark:data-[state=open]:bg-success-muted dark:data-[state=open]:text-success-muted-foreground"
)

/**
 * A pílula de linha do extrato e da prévia de pagamento. `text-[10px]` não é
 * degrau do `Badge` (o `xs` é 11px), e trocar mudaria pixel em cinco telas —
 * fica registrado em vez de convertido.
 */
export const transactionRowChipShell =
  "inline-flex h-5 shrink-0 items-center justify-center rounded-full border-0 px-2 text-[10px] font-semibold leading-none transition-colors"

/** Receita — coluna "Tipo" da tabela de transações. */
export const transactionIncomeTypeRowChip = cn(transactionRowChipShell, tagChipIncome)

/** Despesa — coluna "Tipo" da tabela de transações. */
export const transactionExpenseTypeRowChip = cn(transactionRowChipShell, tagChipExpense)

/** "Parcelada" — a paleta de warning, a mesma do calendário de pagamentos. */
export const transactionParceladaRowChip = cn(transactionRowChipShell, tagChipWarning)

export const tagChipIncomeIconColor = "text-income-muted-foreground"
export const tagChipExpenseIconColor = "text-expense-muted-foreground"

const badgeVariants = cva(
  // `gap-1` e o contrato de ícone entraram na rodada 89, e vieram de contagem:
  // sete telas já desenhavam um glifo aqui dentro à mão — `dashboard-kpi-cards`
  // (2×), `category-detail-summary-section` (3×), o painel de fatura e o
  // `sync-status-chip`. Uma oitava, `bill-pending-card`, escrevia `mr-1 inline`
  // **porque o Badge não declarava gap nenhum**, o que é o sintoma na sua forma
  // mais crua: a tela inventando o respiro que o componente devia dar.
  //
  // O `gap` é seguro na base porque sem segundo filho ele não pinta, e os
  // sítios que já declaravam `gap-1.5` vencem no `tailwind-merge`.
  //
  // O corpo do glifo desce por degrau, no eixo `size`. `:not([class*='size-'])`
  // é a mesma trava que `Button`, `Select`, `Tabs` e `Menubar` usam: quem passa
  // um corpo explícito continua mandando nele.
  "inline-flex items-center justify-center gap-1 rounded-full border border-transparent text-center font-medium transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /**
       * A **forma**, e só ela.
       *
       * Este eixo carregava três coisas ao mesmo tempo: peso (`primary`,
       * `secondary`), forma (`outline`) e **tom** (`success`, `warning`,
       * `income`, `expense`). Tom é o que `Alert`, `StatCard`, `Timeline`,
       * `Progress`, `Separator` e `AnnouncementBar` chamam de `tone` — o
       * `Badge` era o único a discordar, que é palavra por palavra a correção
       * que a rodada do `Alert` já tinha feito quando ele era o único.
       *
       * Com os dois eixos separados, uma combinação que antes não existia
       * passa a existir: contorno **na cor do tom**. Antes, `outline` só sabia
       * ser cinza.
       */
      variant: {
        // Vazio: a base já declara `border border-transparent`, então o valor
        // que morava aqui era a mesma classe escrita duas vezes.
        soft: "",
        outline: "bg-transparent",
        // A pílula grave, e ela é **escura nos dois temas** — não inverte.
        //
        // Nenhum token novo: os dois valores que ela quer já existem. No claro
        // `--primary` é a tecla preta, `oklch(0.205 0 0)`. No escuro a tecla
        // fica branca, então a pílula troca para `--secondary`,
        // `oklch(0.269 0 0)` — que é o mesmo cinza de `--muted` e `--accent`, a
        // superfície levantada padrão do tema escuro. Um par `--badge-*` daria
        // os mesmos dois números e não cairia em grupo nenhum do `ds:catalog`,
        // cujos predicados são fechados por prefixo.
        //
        // **Aqui o `tone` não pinta a superfície.** Ele fica só no dot, que é o
        // que a referência faz: chip grave, ponto aceso.
        contrast:
          "bg-primary text-primary-foreground dark:bg-secondary dark:text-secondary-foreground",
        // **A família do brilho, reduzida à escala do chip** (a do `Alert` e
        // do `Card`): em repouso é um chip neutro — `muted` com a tinta do
        // texto e o fio do sistema —, e o arco-íris acende num arco da borda
        // conforme o ponteiro se aproxima. Até esta rodada ele era a família do
        // contorno, a tecla preta do `primary` com o degradê em 1px e um halo
        // borrado sempre aceso; o dono o quis neutro, com a borda acendendo só
        // de perto.
        //
        // `--brand-glow-core` é o `--muted`: o núcleo chapado do anel tem de
        // ser a cor que está atrás dele, senão a região que a máscara apaga
        // aparece como outra superfície. `brand-rainbow-image` declara
        // `--brand-rainbow` no elemento, e `isolate` é o que impede o pseudo de
        // `z` negativo de cair atrás do fundo de um ancestral — as duas
        // medições do `Alert`.
        //
        // A intensidade é cheia (`--brand-glow-opacity: 1`, contra 0,5 no
        // alerta e no cartão): num chip de 22px o arco tem poucos pixels, e a
        // meia força lia como sujeira na borda. O volume se mexe no
        // multiplicador, nunca nas paradas.
        //
        // O texto nunca pousa no degradê: o arco vive 2px **fora** da caixa.
        // Sem ponteiro fino (telefone) não há brilho, e ele fica o chip neutro.
        // Uma por tela, como toda peça de marca.
        brand:
          "brand-rainbow-image brand-glow relative isolate border-border bg-muted text-foreground [--brand-glow-core:var(--muted)] [--brand-glow-opacity:1]",
      },
      /**
       * A **cor**, com o mesmo nome e os mesmos valores do resto do sistema.
       *
       * `primary` é a marca em tinta suave. Ela rendia `bg-info-muted`, ou seja
       * **azul**, num sistema em que `primary` é o verde em todo o resto —
       * medido, 4/44/67 em RGB. O par `--primary-muted` foi criado para isto.
       *
       * **`info` entrou na rodada 89, e ele já era usado sem existir.** A
       * constante `tagChipInfo` estava aqui desde sempre, mas não havia tom
       * para ela — então `plans/page-client.tsx` e `members/page-client.tsx`
       * escreviam `tone="neutral"` e sobrescreviam a tinta por `className`.
       * Declarar um tom e anular a tinta dele é o buraco pedindo a peça.
       *
       * **Cada tom publica `--badge-dot`, e é só o que ele faz sozinho.** A
       * tinta continua saindo do cruzamento com a `variant`; a variável é a
       * cor cheia do tom, para o `BadgeDot` ler. A indireção é a mesma de
       * `--brand-fill` no `Button` e `--tl-ink` no `Timeline`, e ela atravessa
       * a `variant` — por isso o dot funciona igual nas quatro, inclusive na
       * `contrast`, onde o tom **não** pinta superfície nenhuma.
       */
      tone: {
        primary: "[--badge-dot:var(--primary-accent)]",
        neutral: "[--badge-dot:var(--muted-foreground)]",
        success: "[--badge-dot:var(--success)]",
        info: "[--badge-dot:var(--info)]",
        warning: "[--badge-dot:var(--warning)]",
        destructive: "[--badge-dot:var(--destructive)]",
        income: "[--badge-dot:var(--income)]",
        expense: "[--badge-dot:var(--expense)]",
      },
      // Cada degrau tem entrelinha própria porque é ela, não o padding, que
      // manda na altura de um rótulo desta escala: `leading-tight` na base
      // resolvia para 16px tanto no texto de 11px quanto no de 12px, e por isso
      // `xs` e `sm` saíam com a mesma altura — três nomes, duas alturas.
      //
      // Altura = entrelinha + 2×py + 2 (a borda transparente da base, que fica
      // para o `outline` ter contorno sem mudar a geometria dos outros).
      //
      // `default` saiu do tipo: o nome dizia *o padrão* em vez de dizer a
      // medida, e é o mesmo que já saiu de `Button`, `Input`, `SelectTrigger`,
      // `NativeSelect` e `Container`.
      size: {
        xs: "px-1.5 py-0 text-2xs leading-3 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "px-2 py-0 text-xs leading-4 [&_svg:not([class*='size-'])]:size-3",
        md: "px-2.5 py-0.5 text-xs leading-4 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    /**
     * A tinta sai do cruzamento dos dois eixos.
     *
     * `soft` preenche com a tinta suave do tom — **as mesmas constantes** que as
     * telas usam fora do componente, declaradas no topo; `outline` desenha o
     * contorno e o texto **na cor do tom**, sem preencher. É por isso que os
     * valores de `tone` acima são vazios: sozinho, um tom não sabe se pinta
     * fundo ou borda.
     */
    compoundVariants: [
      { variant: "soft", tone: "primary", class: tagChipPrimary },
      { variant: "soft", tone: "neutral", class: tagChipNeutral },
      { variant: "soft", tone: "success", class: tagChipSuccess },
      { variant: "soft", tone: "info", class: tagChipInfo },
      { variant: "soft", tone: "warning", class: tagChipWarning },
      { variant: "soft", tone: "destructive", class: tagChipDanger },
      { variant: "soft", tone: "income", class: tagChipIncome },
      { variant: "soft", tone: "expense", class: tagChipExpense },

      { variant: "outline", tone: "primary", class: "border-primary-accent/40 text-primary-accent" },
      { variant: "outline", tone: "neutral", class: "border-border text-foreground" },
      { variant: "outline", tone: "success", class: "border-success/40 text-success-muted-foreground" },
      { variant: "outline", tone: "info", class: "border-info/40 text-info-muted-foreground" },
      { variant: "outline", tone: "warning", class: "border-warning/40 text-warning-muted-foreground" },
      { variant: "outline", tone: "destructive", class: "border-destructive/40 text-destructive-muted-foreground" },
      { variant: "outline", tone: "income", class: "border-income/40 text-income-muted-foreground" },
      { variant: "outline", tone: "expense", class: "border-expense/40 text-expense-muted-foreground" },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "primary",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * O ponto de estado, e ele tem duas formas: **pulsando e parado**.
 *
 * A cor não é dele — ele lê `--badge-dot`, que o `tone` do `Badge` publica.
 * Por isso funciona igual nas quatro variants, inclusive na `contrast`, onde a
 * superfície é sempre grave e o dot é a única coisa colorida do chip. Foi
 * assim que a referência que originou a peça se comportava.
 *
 * **`animate-ping`, e não `animate-pulse` — a razão é movimento reduzido.** O
 * bloco de `@layer base` isenta `.animate-spin` e `.animate-pulse` do corte:
 * eles continuam rodando para sempre, porque um spinner parado é um componente
 * quebrado e um esqueleto parado não diz que está carregando. Um ponto
 * decorativo não tem essa desculpa. `animate-ping` cai no seletor, então ele
 * para sozinho para quem pede menos movimento — sem nenhum `motion-reduce:`
 * escrito à mão —, e o que fica é o núcleo sólido, que é o estado certo.
 *
 * O padrão do anel sobre o núcleo veio de `plans/page-client.tsx`, onde estava
 * escrito à mão dentro de uma rota. O `ring-2 ring-background` de lá **não**
 * veio junto: ali ele separava o ponto do ícone atrás dele, e dentro de um
 * chip não há o que separar.
 *
 * `aria-hidden` porque o ponto nunca é a informação — quem diz o estado é o
 * texto do badge ao lado.
 */
function BadgeDot({
  pulse,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { pulse?: boolean }) {
  return (
    <span
      data-slot="badge-dot"
      aria-hidden
      className={cn("relative flex size-1.5 shrink-0", className)}
      {...props}
    >
      {pulse ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--badge-dot) opacity-75" />
      ) : null}
      <span className="relative inline-flex size-full rounded-full bg-(--badge-dot)" />
    </span>
  )
}

function Badge({ className, variant, tone, size, ...props }: BadgeProps) {
  const glowRef = useBrandGlow<HTMLSpanElement>(variant === "brand")
  return (
    // <span>, e não <div>: o chip mora dentro de parágrafo e de linha de texto,
    // e um <div> dentro de <p> é HTML inválido (o React avisa na hidratação).
    <span
      ref={glowRef}
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  )
}

export { Badge, BadgeDot, badgeVariants }
