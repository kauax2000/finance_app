"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { Button, ButtonSizeContext } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleMarker,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { useStickyBar } from "@/components/ui/toolbar"
import { H2, Muted } from "@/components/ui/typography"
import { barSurfaceClassName } from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * O bloco que dá ritmo vertical a uma tela. `ruled` é a régua em cima ("começa
 * outro bloco"); `lg` é o corpo de uso comum. A escada desce por variável, como
 * no `PageHeader`. O respiro dos dois degraus de cima é `--space-block`.
 * O `min-w-0` é da seção, não do conteúdo: uma seção usada como item de uma
 * **linha** de flex estoura para o próprio min-content e some com a rolagem
 * interna; numa coluna o `min-width: auto` já resolve para zero.
 */
const pageSectionVariants = cva("flex min-w-0 flex-col", {
  variants: {
    /**
     * Encolhe o título e o respiro juntos, como o `size` do `Alert`. A entrelinha
     * vem em par com o corpo porque `text-(length:…)` declara só o tamanho.
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
    /**
     * A cascata de entrada, a do `PageHeader`. Desligada por padrão: uma tela tem
     * várias seções, e todas subindo juntas é ruído.
     */
    reveal: {
      true: "page-section-reveal",
      false: "",
    },
  },
  defaultVariants: { size: "md", variant: "plain", reveal: false },
})

type PageSectionState = {
  /** 1 na seção de fora; a de dentro soma um, e o título desce um nível. */
  depth: number
  titleId: string
  registerTitle: (id: string | null) => void
  collapsible: boolean
  sticky: boolean
}

const PageSectionContext = React.createContext<PageSectionState | null>(null)

/** O estado guardado do `collapsible`, lido depois de montar (o servidor não tem `localStorage`). */
function useGuardado(chave: string | undefined, inicial: boolean) {
  const [aberto, setAberto] = React.useState(inicial)
  React.useEffect(() => {
    if (!chave) return
    try {
      const v = window.localStorage.getItem(chave)
      if (v === "1" || v === "0") setAberto(v === "1")
    } catch {}
  }, [chave])
  const trocar = React.useCallback(
    (proximo: boolean) => {
      setAberto(proximo)
      if (!chave) return
      try {
        window.localStorage.setItem(chave, proximo ? "1" : "0")
      } catch {}
    },
    [chave]
  )
  return [aberto, trocar] as const
}

/**
 * A seção: região nomeada pelo título (`aria-labelledby` para o
 * `PageSectionTitle`), sabe a própria profundidade (uma seção dentro de outra
 * rende o título um nível abaixo) e tem `collapsible` (o título vira o gatilho e
 * o resto recolhe na mola do `Collapsible`) e `sticky` (o cabeçalho prende sob a
 * barra do topo).
 */
function PageSection({
  className,
  size,
  variant,
  reveal,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  storageKey,
  sticky = false,
  children,
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof pageSectionVariants> & {
    /** O título vira o gatilho, e o que vem depois do primeiro filho (o cabeçalho) recolhe. */
    collapsible?: boolean
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /** Guarda o aberto/fechado no `localStorage`, por esta chave. */
    storageKey?: string
    /** O cabeçalho prende sob a barra do topo enquanto a seção rola. */
    sticky?: boolean
  }) {
  const pai = React.useContext(PageSectionContext)
  const idGerado = React.useId()
  const [titulo, setTitulo] = React.useState<string | null>(null)
  const [guardado, setGuardado] = useGuardado(storageKey, defaultOpen)
  const aberto = openProp ?? guardado
  const trocar = React.useCallback(
    (proximo: boolean) => {
      if (openProp === undefined) setGuardado(proximo)
      onOpenChange?.(proximo)
    },
    [openProp, onOpenChange, setGuardado]
  )

  const estado = React.useMemo<PageSectionState>(
    () => ({
      depth: (pai?.depth ?? 0) + 1,
      titleId: `${idGerado}-title`,
      registerTitle: setTitulo,
      collapsible,
      sticky,
    }),
    [pai?.depth, idGerado, collapsible, sticky]
  )

  // O nome só aponta para um título que existe: apontar para um `id` ausente
  // deixa a região sem nome, que é pior que não ser região.
  const nome =
    props["aria-label"] || props["aria-labelledby"] ? undefined : (titulo ?? undefined)

  // No `collapsible`, o primeiro filho (o cabeçalho) fica de fora e o resto
  // recolhe. É pela posição, não por `child.type === PageSectionHeader`: o Fast
  // Refresh troca a função a cada edição e a identidade deixa de bater calada
  // (trancado em `table-versions.test.ts`).
  const filhos = collapsible
    ? (() => {
        const [cabeca, ...resto] = React.Children.toArray(children)
        return (
          <>
            {cabeca}
            <CollapsibleContent className="flex min-w-0 flex-col gap-[inherit]">
              {resto}
            </CollapsibleContent>
          </>
        )
      })()
    : children

  const secao = (
    <section
      data-slot="page-section"
      data-size={size ?? "md"}
      data-collapsible={collapsible || undefined}
      aria-labelledby={nome}
      className={cn(pageSectionVariants({ size, variant, reveal }), className)}
      {...props}
    >
      {filhos}
    </section>
  )

  return (
    <PageSectionContext value={estado}>
      {collapsible ? (
        <Collapsible asChild open={aberto} onOpenChange={trocar}>
          {secao}
        </Collapsible>
      ) : (
        secao
      )}
    </PageSectionContext>
  )
}

/**
 * Os botões da ação descem ao degrau `sm` sozinhos; no dedo sobem a 40, e no
 * telefone o de ícone fica quadrado com o rótulo como nome (regra do
 * `PageHeader`). Um `size` no botão vence.
 */
const pageSectionButtonsClassName = [
  "pointer-coarse:[&>[data-slot=button]]:min-h-10",
  "max-sm:[&>[data-slot=button]:has(>svg)]:aspect-square max-sm:[&>[data-slot=button]:has(>svg)]:px-0",
  "max-sm:[&>[data-slot=button]:has(>svg)>[data-slot=button-label]]:sr-only",
].join(" ")

/**
 * A placa do cabeçalho preso: a tinta de barra do `TopBar` com o fio de baixo,
 * só presa. Sobra 8px acima e abaixo, para a altura não mudar ao prender, e
 * atravessa `--page-section-bleed` dos lados (a calha, de quem monta a tela).
 * A mesma da `Toolbar sticky`.
 */
const pageSectionPlateClassName = cn(
  barSurfaceClassName,
  "pointer-events-none absolute -inset-y-2 -inset-x-(--page-section-bleed,0px) -z-1 border-b border-border opacity-0",
  "transition-opacity duration-(--duration-base) ease-(--ease-out) group-data-stuck/page-section-header:opacity-100"
)

/**
 * Título, descrição e, quando existe, a ação da seção. `actions` é prop porque
 * sobrescrever o cabeçalho por `className` desmonta o empilhamento dele.
 * A ação se centra na linha do título, não no bloco (com descrição de duas
 * linhas, o botão desceria ao meio do parágrafo). O cabeçalho é uma grade: título
 * e ação dividem a primeira linha, que mede o maior dos dois (um controle é mais
 * alto que uma linha de título), e a descrição desce para a segunda.
 * Título e descrição não levam `gap`: par de identidade.
 */
function PageSectionHeader({
  className,
  actions,
  children,
  ...props
}: React.ComponentProps<"div"> & { actions?: React.ReactNode }) {
  const secao = React.useContext(PageSectionContext)
  const preso = Boolean(secao?.sticky)
  const ref = React.useRef<HTMLDivElement>(null)
  useStickyBar(ref, preso, false)
  return (
    <div
      ref={ref}
      data-slot="page-section-header"
      data-sticky={preso || undefined}
      className={cn(
        "grid min-w-0 items-center",
        actions ? "grid-cols-[minmax(0,1fr)_auto] gap-x-4" : "grid-cols-1",
        preso &&
          "group/page-section-header sticky top-[calc(var(--toolbar-top,var(--top-bar-bottom))+--spacing(2))] z-(--z-sticky) isolate",
        className
      )}
      {...props}
    >
      {preso ? <span aria-hidden data-slot="page-section-plate" className={pageSectionPlateClassName} /> : null}
      {/* `contents`: título e descrição viram itens da grade, sempre na primeira coluna. */}
      <div className="contents *:col-start-1 *:min-w-0">{children}</div>
      {actions ? (
        <div
          data-slot="page-section-actions"
          className={cn("col-start-2 row-start-1 flex shrink-0 items-center gap-2", pageSectionButtonsClassName)}
        >
          <ButtonSizeContext value="sm">{actions}</ButtonSizeContext>
        </div>
      ) : null}
    </div>
  )
}

/**
 * O nome da seção. O nível é da profundidade: `h2` na seção de fora, `h3` na de
 * dentro, até `h6`; `asChild` existe para o caso raro e o estilo nunca muda com
 * o nível. O `id` nomeia a região; um `id` passado aqui vence.
 * `icon` é o glifo `16/solid` antes do nome; `count` é a contagem depois, tabular
 * e com espaço real antes (senão o nome acessível sai "Membros4"). Em seção
 * `collapsible` o conteúdo vira um botão com a seta; no cursor só o nome sublinha.
 */
function PageSectionTitle({
  className,
  asChild = false,
  icon,
  count,
  id: idProp,
  children,
  ...props
}: React.ComponentProps<"h2"> & {
  asChild?: boolean
  icon?: React.ReactNode
  count?: React.ReactNode
}) {
  const secao = React.useContext(PageSectionContext)
  // Com `asChild`, o `id` do elemento de quem chama é o que a região aponta.
  const idDoFilho =
    asChild && React.isValidElement<{ id?: string }>(children) ? children.props.id : undefined
  const id = idProp ?? idDoFilho ?? secao?.titleId
  const registrar = secao?.registerTitle
  React.useLayoutEffect(() => {
    if (!registrar || !id) return
    registrar(id)
    return () => registrar(null)
  }, [registrar, id])

  const nivel = Math.min((secao?.depth ?? 1) + 1, 6)
  const Tag = `h${nivel}` as "h2"

  const miolo = (
    <>
      {icon ? (
        <span data-slot="page-section-title-icon" className="flex shrink-0 text-muted-foreground [&>svg]:size-4" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span data-slot="page-section-title-text" className="min-w-0">
        <span data-slot="page-section-title-label">{children}</span>
        {count != null ? (
          <>
            {" "}
            <span data-slot="page-section-count" className="nums font-normal text-muted-foreground">
              {count}
            </span>
          </>
        ) : null}
      </span>
    </>
  )

  const conteudo = secao?.collapsible ? (
    <CollapsibleTrigger className="-mx-1 flex min-w-0 items-center gap-2 rounded-md px-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/45 hover:[&_[data-slot=page-section-title-label]]:underline hover:[&_[data-slot=page-section-title-label]]:underline-offset-4">
      {miolo}
      <CollapsibleMarker />
    </CollapsibleTrigger>
  ) : (
    miolo
  )

  return (
    // O `H2` dá família, peso e tracking; corpo e entrelinha vêm do degrau do `PageSection`.
    <H2
      asChild
      data-slot="page-section-title"
      className={cn(
        "text-(length:--page-section-title) leading-(--page-section-title-line)",
        (icon || secao?.collapsible) && "flex min-w-0 items-center gap-2",
        className
      )}
    >
      {asChild ? (
        // Quem passa o próprio elemento manda nele.
        <Slot.Root id={id} {...props}>
          {children}
        </Slot.Root>
      ) : (
        <Tag id={id} {...props}>
          {conteudo}
        </Tag>
      )}
    </H2>
  )
}

function PageSectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="page-section-description"
      className={cn("leading-relaxed text-pretty", className)}
      {...props}
    />
  )
}

/** O "Ver todas" da seção: link `tertiary` com a seta que anda 2px no cursor. */
function PageSectionLink({
  href,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Button asChild variant="tertiary" className={cn("group/section-link", className)}>
      <Link data-slot="page-section-link" href={href} {...props}>
        {children}
        <ArrowRightIcon
          data-icon="inline-end"
          aria-hidden
          className="transition-transform duration-(--duration-base) ease-(--ease-out) group-hover/section-link:translate-x-0.5"
        />
      </Link>
    </Button>
  )
}

/** O texto miúdo do lado da ação ("Limite R$ 800"); vai no `actions` do cabeçalho. */
function PageSectionMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-section-meta"
      className={cn("nums text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

/** O rodapé da seção: a nota ou o "Mostrar mais" embaixo do conteúdo. Os botões descem a `sm` como na ação. */
function PageSectionFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-section-footer"
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground",
        pageSectionButtonsClassName,
        className
      )}
      {...props}
    >
      <ButtonSizeContext value="sm">{children}</ButtonSizeContext>
    </div>
  )
}

/**
 * O esqueleto da seção. `group={false}` dentro de um esqueleto de página, que
 * já anuncia (dois `role="status"` aninhados falam duas vezes).
 */
function PageSectionSkeleton({
  size = "md",
  description = false,
  actions = false,
  group = true,
  className,
  children,
}: {
  size?: "sm" | "md" | "lg"
  description?: boolean
  actions?: boolean
  group?: boolean
  className?: string
  /** O esqueleto do conteúdo; sem ele, um bloco de 160px. */
  children?: React.ReactNode
}) {
  const miolo = (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
        <div className="flex h-(--page-section-title-line) items-center">
          <Skeleton className="h-[calc(var(--page-section-title)*0.8)] w-40 max-w-full" />
        </div>
        {actions ? <Skeleton className="h-7 w-24 rounded-full" /> : null}
        {description ? <Skeleton shape="text" className="col-start-1 w-72 max-w-full" /> : null}
      </div>
      {children ?? <Skeleton className="h-40 w-full rounded-surface" />}
    </>
  )
  const classes = cn(pageSectionVariants({ size }), className)
  return group ? (
    <SkeletonGroup data-slot="page-section-skeleton" label="Carregando a seção…" className={classes}>
      {miolo}
    </SkeletonGroup>
  ) : (
    <div data-slot="page-section-skeleton" aria-hidden className={classes}>
      {miolo}
    </div>
  )
}

export {
  PageSection,
  PageSectionDescription,
  PageSectionFooter,
  PageSectionHeader,
  PageSectionLink,
  PageSectionMeta,
  PageSectionSkeleton,
  PageSectionTitle,
  pageSectionVariants,
}
