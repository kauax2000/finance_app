import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * O bloco que dá ritmo vertical a uma tela.
 *
 * Ele tinha zero consumidores no app — e **269 cópias dentro do próprio
 * catálogo**: `DocSection` (247 usos) e `Group` (22), dois arquivos declarando
 * a mesma string de cabeçalho de seção, com um corpo de título um degrau acima
 * do que este componente oferecia.
 *
 * Os eixos saem dessa contagem. `ruled` é a régua **em cima**, que é onde as
 * 269 já a punham: ela diz "começa outro bloco", e não "este bloco tem um
 * rodapé". `lg` é o corpo que elas usam.
 *
 * A escada desce por variável, e não por contexto nem por `in-*` — o mesmo
 * mecanismo e a mesma razão do `PageHeader`.
 *
 * O respiro dos dois degraus de cima é `--space-block` — o token que nomeia a
 * distância entre blocos. `sm` fica em `gap-3` porque ali o degrau é mais
 * apertado que a regra geral, e um token que se aplica a dois de três casos é
 * mais honesto que um quarto token para o terceiro.
 *
 * **O `min-w-0` é dele, e não do conteúdo.** Havia um `PageSectionContent` que
 * era um `<div>` com string de classe vazia, e a primeira versão desta rodada
 * tentou justificá-lo dando-lhe o `min-w-0` — "a tabela larga estoura a página
 * em vez de rolar". Medido, isso é falso: o tamanho mínimo automático de um
 * item de flex vale no **eixo principal**, e numa coluna o eixo principal é o
 * vertical, então `min-width: auto` já resolve para zero ali. Com e sem o
 * `min-w-0` no conteúdo, os mesmos 400px.
 *
 * O defeito real é um nível acima: uma seção usada como item de uma **linha**
 * de flex estoura para o próprio min-content — medido, **5241px** dentro de um
 * pai de 400 —, e some com a rolagem interna junto. Com `min-w-0` na seção:
 * 400px, e a região de dentro volta a rolar. A peça sem trabalho foi apagada, e
 * o trabalho ficou onde ele é.
 */
const pageSectionVariants = cva("flex min-w-0 flex-col", {
  variants: {
    /**
     * Encolhe o título e o respiro **juntos**, como o `size` do `Alert`.
     *
     * A entrelinha vem em par com o corpo porque `text-(length:…)` declara só
     * o tamanho: sem a segunda variável o título herdaria a entrelinha do
     * parágrafo em volta, e um `text-lg` a 1,5 lê diferente de um `text-lg` a
     * 1,555 — que é a medida que o catálogo renderiza hoje (18/28).
     */
    size: {
      sm: "gap-3 [--page-section-title:0.875rem] [--page-section-title-line:1.25rem]",
      md: "gap-(--space-block) [--page-section-title:1rem] [--page-section-title-line:1.5rem]",
      lg: "gap-(--space-block) [--page-section-title:1.125rem] [--page-section-title-line:1.75rem]",
    },
    variant: {
      plain: "",
      ruled: "border-t border-border pt-8",
    },
  },
  defaultVariants: { size: "md", variant: "plain" },
})

function PageSection({
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof pageSectionVariants>) {
  return (
    <section
      data-slot="page-section"
      data-size={size ?? "md"}
      className={cn(pageSectionVariants({ size, variant }), className)}
      {...props}
    />
  )
}

/**
 * Título, descrição e — quando existe — a ação da seção.
 *
 * `actions` é prop porque a peça estava faltando e a demonstração da própria
 * página a inventava por `className`: `<PageSectionHeader className="flex-row
 * items-center justify-between">` desmontava o empilhamento do cabeçalho para
 * caber um "Ver todas". É o precedente de `FormPickerPopoverEmpty` e de
 * `HoverCardBody` — quando o catálogo escreve a anatomia, falta uma peça.
 *
 * A ação se centra numa caixa de **exatamente uma linha de título**, e não com
 * `items-center` no bloco todo: com uma descrição de duas linhas, centrar no
 * bloco desce o botão para o meio do parágrafo. É a mesma conta do voltar do
 * `PageHeader`, com a variável do degrau em vez de um número.
 *
 * Título e descrição **não levam `gap`** — par de identidade.
 */
function PageSectionHeader({
  className,
  actions,
  children,
  ...props
}: React.ComponentProps<"div"> & { actions?: React.ReactNode }) {
  return (
    <div
      data-slot="page-section-header"
      className={cn("flex items-start gap-4", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {actions ? (
        <div
          data-slot="page-section-actions"
          className="flex h-(--page-section-title-line) shrink-0 items-center gap-2"
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}

/**
 * O nome da seção.
 *
 * `asChild` existe para o nível, e não para o estilo: um bloco dentro de outro
 * bloco é `h3`, e pular do `h1` da tela para um `h3` deixa um degrau vazio para
 * quem navega por cabeçalhos.
 */
function PageSectionTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h2"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "h2"
  return (
    <Comp
      data-slot="page-section-title"
      className={cn(
        "font-heading text-(length:--page-section-title) leading-(--page-section-title-line) font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function PageSectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-section-description"
      className={cn(
        "text-sm leading-relaxed text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  PageSection,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
  pageSectionVariants,
}
