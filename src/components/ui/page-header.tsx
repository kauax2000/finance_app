import * as React from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/16/solid"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import { Caption, H1, Muted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

/**
 * O topo de uma tela.
 *
 * **Ele era uma linha de flex, e a trilha caía dentro dela.** Medido a 1280px,
 * na demonstração "Completo" da própria página do componente: `sm:flex-row` sem
 * `flex-wrap` punha `PageHeaderBreadcrumb` (618px) **à esquerda** do título, o
 * `PageHeaderTitleRow` saía com **largura 0** e 362px de altura — a descrição
 * quebrando uma palavra por linha — e o título passava por baixo do botão de
 * ação. O `sm:col-span-full` que a trilha carregava não era classe morta por
 * acaso: era o fóssil da implementação correta, escrita para uma grade que
 * nunca existiu.
 *
 * Hoje é grade. A trilha e a faixa de fatos atravessam as duas colunas; título
 * e ações dividem a linha do meio.
 *
 * **A escada desce por variável, e não por contexto React.** `--page-title` é
 * declarada aqui e lida lá embaixo — o mesmo mecanismo de `--toolbar-control` e
 * `--command-list-max-h`. Contexto exigiria `"use client"`, e este é um dos
 * poucos componentes de `ui/` que ainda é servidor; `in-*` e `group-*` compilam
 * com `:where()`, que não soma especificidade e perderia para a classe base no
 * mesmo elemento. Variável herda e não disputa.
 */
const pageHeaderVariants = cva(
  "grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start",
  {
    variants: {
      /**
       * O corpo do título, e com ele a caixa de linha que o controle de voltar
       * usa para se centrar.
       *
       * Os dois degraus do meio não foram inventados: são as duas medidas que o
       * catálogo já renderiza — `text-2xl sm:text-3xl` na página de componente
       * e `text-3xl sm:text-4xl` no índice. `sm` é o terceiro, para a tela de
       * detalhe, que a página deste componente demonstrava sem ter como
       * declarar.
       *
       * A entrelinha não entra aqui: `.page-title` declara `1.25` e vence, por
       * estar fora de `@layer` (verificado — o `font-heading` que três arquivos
       * escreviam ao lado dela nunca decidiu nada).
       */
      size: {
        sm: "[--page-title:1.25rem] sm:[--page-title:1.5rem]",
        md: "[--page-title:1.5rem] sm:[--page-title:1.875rem]",
        lg: "[--page-title:1.875rem] sm:[--page-title:2.25rem]",
      },
      /**
       * `ruled` é o padrão e mantém a régua embaixo. `plain` é para quando o
       * que fecha o cabeçalho é o próprio conteúdo logo abaixo — uma faixa de
       * fatos, um campo de import, um cartão.
       */
      variant: {
        ruled: "border-b border-border pb-6",
        plain: "",
      },
    },
    defaultVariants: { size: "md", variant: "ruled" },
  }
)

function PageHeader({
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<"header"> & VariantProps<typeof pageHeaderVariants>) {
  return (
    <header
      data-slot="page-header"
      data-size={size ?? "md"}
      className={cn(
        pageHeaderVariants({ size, variant }),
        // A caixa de linha do título, derivada uma vez. É o que o controle de
        // voltar usa para se centrar na primeira linha sem número mágico.
        "[--page-title-line:calc(var(--page-title)*1.25)]",
        className
      )}
      {...props}
    />
  )
}

/**
 * A trilha, acima de tudo e atravessando as duas colunas.
 *
 * `order-first` porque uma tela de detalhe costuma declarar o título antes da
 * trilha no JSX, e a ordem de leitura da tela é a inversa.
 */
function PageHeaderBreadcrumb({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-breadcrumb"
      className={cn("order-first col-span-full min-w-0", className)}
      {...props}
    />
  )
}

/**
 * A sobrancelha em versalete.
 *
 * Ela existia em duas cópias da mesma string — a constante `EYEBROW` de
 * `ds-doc.tsx` e a mesma medida escrita inline no índice do catálogo.
 *
 * **Não é enfeite acima de todo título.** Ela só se paga quando há um rótulo de
 * pai de verdade a dizer — a carteira de onde a tela veio, o mês de uma fatura,
 * a marca no índice. Um título que precisa de uma palavra pequena em cima para
 * se explicar está mal escrito.
 */
const pageEyebrowClassName =
  "text-2xs font-medium tracking-eyebrow uppercase"

function PageHeaderEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="page-header-eyebrow"
      className={cn(pageEyebrowClassName, className)}
      {...props}
    />
  )
}

/**
 * A linha do título: [voltar] · sobrancelha/título/descrição · [adorno].
 *
 * `back` e `endAdornment` são props, e não composição, porque as duas
 * demonstrações que o catálogo escrevia à mão provam a peça que faltava: a
 * página deste componente inventava `<div className="flex items-center gap-1">`
 * para o voltar, e `DocPage` inventa `flex items-baseline justify-between
 * gap-4` para a categoria. Duas linhas de título, duas gramáticas.
 *
 * **Os dois se alinham por mecânicas diferentes, de propósito.** O adorno é
 * texto, e texto alinha por linha de base — é o que prende o rótulo à primeira
 * linha do título mesmo quando ele quebra em duas. O voltar é um controle sem
 * texto: numa caixa de `items-baseline` ele teria a linha de base sintetizada
 * na borda de baixo e afundaria a fileira inteira. Ele sai do alinhamento com
 * `self-start` e se centra dentro de uma caixa de exatamente uma linha de
 * título (`--page-title-line`) — sem número mágico, e acompanhando o degrau.
 *
 * O par sobrancelha/título/descrição **não leva `gap`**: é o mesmo dado em
 * linhas, e quem o separa é a entrelinha. A documentação deste componente já
 * afirmava isso enquanto o código declarava `gap-1` — o mesmo defeito de
 * `ItemContent`, `StatCard` e `FieldContent`. O respiro existe só onde há
 * mudança de assunto, e é o contêiner que o declara.
 */
function PageHeaderTitleRow({
  className,
  back,
  backLabel,
  endAdornment,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** O destino do voltar. Rende o controle compacto na linha do título. */
  back?: string
  backLabel?: string
  /** Um `Badge` de estado, um rótulo de categoria — alinhado à linha de base. */
  endAdornment?: React.ReactNode
}) {
  return (
    <div
      data-slot="page-header-title-row"
      className={cn("flex min-w-0 items-baseline gap-4", className)}
      {...props}
    >
      {back ? (
        // O `-me-2` não é compensação de gosto: o `gap` é a distância mínima
        // entre **caixas**, e a caixa do voltar é 10px mais larga que o glifo
        // desse lado. Devolvendo 8 deles, a distância seta→título cai nos
        // mesmos 18px que o cabeçalho do app renderiza.
        <span className="-me-2 flex h-(--page-title-line) shrink-0 items-center self-start">
          <PageHeaderBack href={back} label={backLabel} />
        </span>
      ) : null}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          // A sobrancelha é a única que abre um bloco: o contêiner diz qual
          // filho muda de assunto, como o `StatCard` faz com a variação.
          "[&>[data-slot=page-header-eyebrow]]:mb-3"
        )}
      >
        {children}
      </div>
      {endAdornment ? (
        // `flex` e não `block`: um filho de flex é blocado, e é isso que faz
        // um `<a>` de 11px medir a caixa de linha inteira (16) em vez dos 14
        // de uma caixa em linha. Dois pixels de alvo, num controle de 60×16.
        <span data-slot="page-header-adornment" className="flex shrink-0">
          {endAdornment}
        </span>
      ) : null}
    </div>
  )
}

function PageHeaderTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h1"> & { asChild?: boolean }) {
  return (
    <H1
      asChild={asChild}
      data-slot="page-header-title"
      // Era `text-lg sm:text-xl` — 18/20px. Nenhuma tela tinha momento de
      // display, e por isso a serifa não teria onde aparecer. O `H1` traz a
      // família de display, o peso, o tracking e a entrelinha; o corpo vem do
      // degrau declarado pelo `PageHeader` — e `cn()` apaga o `text-3xl` do
      // átomo, verificado.
      className={cn("text-(length:--page-title)", className)}
      {...props}
    />
  )
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="page-header-description"
      // `leading-relaxed` e `text-pretty` são as duas coisas que as descrições
      // do catálogo já traziam e esta não: sem elas a última linha do parágrafo
      // sai com uma palavra órfã, e o corpo fica apertado sob um título de
      // display.
      className={cn("max-w-2xl leading-relaxed text-pretty", className)}
      {...props}
    />
  )
}

/**
 * A faixa de fatos sob o título.
 *
 * É o `dl` que o índice do catálogo escrevia à mão, e a forma que um app de
 * finanças pede: *342 transações · R$ 12.480,00 · março de 2026*. Ela traz 8px
 * do próprio respiro em cima porque o espaço **acima** de uma régua tem que ser
 * maior que o de baixo — 24 contra 16, com o `gap` da grade contando junto.
 */
function PageHeaderMeta({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  // `asChild` porque o elemento certo depende do que a faixa carrega: um `dl`
  // quando são pares termo/valor — que é o caso comum num app de finanças —, e
  // uma `div` quando são só rótulos soltos.
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="page-header-meta"
      className={cn(
        "col-span-full mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * O voltar compacto.
 *
 * Ele era a segunda cópia de um controle que o app já tinha: `MobileHeaderBack`
 * em `app-header.tsx` renderiza `icon-lg` (36) com `-ml-1`, e este renderizava
 * `icon-md` (32) com `-ml-2`. Duas medidas e dois recuos para o mesmo botão.
 * Ficou a medida do app.
 *
 * O recuo é `-ms-2.5` porque o ícone tem 16 dentro de uma caixa de 36: 10px de
 * folga de cada lado. Puxando exatamente isso, **o ícone alinha com o texto** e
 * é a superfície de realce que avança para fora da margem — a mesma conta e o
 * mesmo número do par anterior/próximo do catálogo.
 *
 * O `group-active:bg-accent` que ele carregava não tinha `group` ancestral
 * nenhum, e o rótulo era cravado.
 */
function PageHeaderBack({
  href,
  label = "Voltar",
  className,
}: {
  href: string
  label?: string
  className?: string
}) {
  return (
    <Button
      variant="tertiary"
      size="icon-lg"
      className={cn(
        "-ms-2.5 relative shrink-0 active:bg-accent",
        // 36 é a medida do controle, e 44 é a do dedo. O alvo cresce por
        // pseudo-elemento porque crescer de verdade mudaria a caixa que
        // `--page-title-line` centraliza — a mesma saída do × da
        // `AnnouncementBar` e dos degraus do `Breadcrumb`.
        "pointer-coarse:after:absolute pointer-coarse:after:-inset-1 pointer-coarse:after:content-['']",
        className
      )}
      asChild
    >
      <Link href={href} aria-label={label}>
        <ArrowLeftIcon className="size-4" aria-hidden />
      </Link>
    </Button>
  )
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderBack,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderMeta,
  PageHeaderTitle,
  PageHeaderTitleRow,
  pageEyebrowClassName,
  pageHeaderVariants,
}
