"use client"

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/16/solid"
import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTimeout } from "@/hooks/use-timeout"
import { slugifyCategory } from "./registry"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleMarker,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
  PageHeaderTitleRow,
  pageEyebrowClassName,
} from "@/components/ui/page-header"
import {
  PageSection,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/ui/page-section"

export type Category =
  | "Foundations"
  | "Atoms"
  | "Molecules"
  | "Organisms"
  // Objetos de nível de página: dispõem componentes, não são o conteúdo.
  | "Templates"

export type DocNeighbor = { slug: string; name: string; category?: Category }

/** A sobrancelha em versalete do catálogo; a régua mora em `PageHeaderEyebrow`. */
const EYEBROW = pageEyebrowClassName

/** `<code>` cru na prosa: mono, sem ladrilho (um chip por identificador pontilhava cada parágrafo). */
const PROSE_CODE = "[&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground"

/**
 * O casco de uma página de componente. A régua é o fio, não a caixa: só a moldura
 * do espécime tem borda. Estes primitivos moram na rota porque só o catálogo os usa.
 */
export function DocPage({
  name,
  category,
  description,
  source,
  importLine,
  previous,
  next,
  children,
}: {
  name: string
  category: Category
  description: string
  source?: string
  importLine?: string
  previous?: DocNeighbor
  next?: DocNeighbor
  children: React.ReactNode
}) {
  return (
    <article className="flex min-w-0 flex-col pb-16">
      {/* Sem trilha: a categoria fica na borda direita da linha do título. */}
      {/* A categoria é o `endAdornment`; `plain` porque o campo de import fecha o cabeçalho. */}
      <PageHeader>
        <PageHeaderTitleRow
          endAdornment={
            /* `h-auto p-0 align-baseline` pousa o link na linha de base do título; o `EYEBROW` vence o `text-sm` da base. */
            <Button asChild variant="link" className={cn(EYEBROW, "h-auto p-0 align-baseline")}>
              <Link href={`/designsystem#${slugifyCategory(category)}`}>
                {category}
              </Link>
            </Button>
          }
        >
          <PageHeaderTitle>{name}</PageHeaderTitle>
          {/* Nome sobre descrição: quem separa é a entrelinha, sem `gap`. */}
          <PageHeaderDescription className="max-w-none">
            {description}
          </PageHeaderDescription>
        </PageHeaderTitleRow>
      </PageHeader>

      <DocMeta importLine={importLine} source={source} />

      <div className="flex flex-col gap-8 pt-8">{children}</div>

      <DocPager previous={previous} next={next} category={category} />
    </article>
  )
}

/**
 * O campo de identificação: import e arquivo são um dado, par de identidade sem `gap`.
 * O botão de copiar tem coluna própria no topo, para o import quebrar antes de passar por baixo dele.
 */
function DocMeta({
  importLine,
  source,
}: {
  importLine?: string
  source?: string
}) {
  if (!importLine && !source) {
    return <div className="mt-6 border-b border-border" />
  }
  return (
    <Card padding="none" className="mt-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 py-3 ps-4 pe-2">
        <div className="flex min-w-0 flex-col">
          {importLine ? (
            <pre className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground">
              {importLine}
            </pre>
          ) : null}
          {source ? (
            <code className="font-mono text-2xs leading-relaxed break-all text-muted-foreground">
              {source}
            </code>
          ) : null}
        </div>
        {importLine ? (
          <div className="-mt-1">
            <CopyButton code={importLine} />
          </div>
        ) : null}
      </div>
    </Card>
  )
}

/** O par anterior/próximo no pé, na ordem da navegação lateral. O rótulo de direção é `sr-only` porque a seta já o diz ao olho. */
function DocPager({
  previous,
  next,
  category,
}: {
  previous?: DocNeighbor
  next?: DocNeighbor
  /** A categoria da página atual, para o vizinho só se anunciar quando muda. */
  category: Category
}) {
  if (!previous && !next) return null
  return (
    <nav
      aria-label="Páginas vizinhas"
      className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-4"
    >
      {previous ? (
        <DocPagerLink entry={previous} direction="previous" from={category} />
      ) : (
        <span />
      )}
      {next ? (
        <DocPagerLink entry={next} direction="next" from={category} />
      ) : null}
    </nav>
  )
}

function DocPagerLink({
  entry,
  direction,
  from,
}: {
  entry: DocNeighbor
  direction: "previous" | "next"
  from: Category
}) {
  const isNext = direction === "next"
  const Chevron = isNext ? ChevronRightIcon : ChevronLeftIcon
  // A categoria do vizinho só aparece quando muda (nas fronteiras entre categorias).
  const crossing = Boolean(entry.category && entry.category !== from)
  const chevron = (
    <Chevron
      aria-hidden
      className={cn(
        "size-4 shrink-0",
        "transition-transform duration-(--duration-fast) ease-(--ease-out)",
        isNext
          ? "group-hover:translate-x-0.5 group-active:translate-x-0.5"
          : "group-hover:-translate-x-0.5 group-active:-translate-x-0.5"
      )}
    />
  )
  return (
    <Button
      asChild
      variant="tertiary"
      size="md"
      className={cn(
        // `group-hover:` precisa da classe literal `group`; o `group/button` do Button é outra.
        "group",
        // O `shrink-0` da base impediria o `truncate` do nome de disparar.
        "shrink",
        // Muda a cor do realce (`--button-hover-fill`), não o fundo: a camada fica por cima dele.
        "[--button-hover-fill:var(--accent)] active:text-foreground",
        "min-w-0 px-2.5 text-muted-foreground",
        // Em ponteiro grosso, o alvo de 44px (touch-safe-area).
        "pointer-coarse:min-h-11",
        // O recuo alinha o nome com o texto acima.
        isNext ? "-mr-2.5" : "-ml-2.5"
      )}
    >
      <Link href={`/designsystem/${entry.slug}`}>
      {isNext ? null : chevron}
      <span className="truncate">
        <span className="sr-only">{isNext ? "Próximo: " : "Anterior: "}</span>
        {entry.name}
      </span>
      {crossing ? (
        <span className="hidden shrink-0 text-xs font-normal text-muted-foreground/70 sm:inline">
          {entry.category}
        </span>
      ) : null}
      {isNext ? chevron : null}
      </Link>
    </Button>
  )
}

/** O "quando usar": tese, não legenda — abertura sob régua de acento, sem `Alert` (que se reanunciava ao leitor de tela). */
export function Usage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col border-l-2 border-primary-accent/60 pl-4">
      <p className={cn(EYEBROW, "text-muted-foreground")}>Quando usar</p>
      <div
        className={cn(
          "text-sm leading-relaxed text-pretty text-foreground",
          PROSE_CODE
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Uma seção de variante ou estado: título, nota e demonstração ao vivo. */
export function DocSection({
  title,
  description,
  code,
  className,
  previewClassName,
  children,
}: {
  title: string
  description?: React.ReactNode
  code?: string
  className?: string
  previewClassName?: string
  children: React.ReactNode
}) {
  return (
    // `ruled`: a régua de uma seção é em cima e diz que começa outro bloco.
    <PageSection
      variant="ruled"
      size="lg"
      className={cn("scroll-mt-24", className)}
    >
      <PageSectionHeader>
        <PageSectionTitle>{title}</PageSectionTitle>
        {description ? (
          <PageSectionDescription className={PROSE_CODE}>
            {description}
          </PageSectionDescription>
        ) : null}
      </PageSectionHeader>
      <Preview code={code} previewClassName={previewClassName}>
        {children}
      </Preview>
    </PageSection>
  )
}

/** A moldura do espécime — a única caixa da página; a fonte abre dentro dela, sob um fio. */
export function Preview({
  code,
  className,
  previewClassName,
  children,
}: {
  code?: string
  className?: string
  previewClassName?: string
  children: React.ReactNode
}) {
  // O slot fica por fora da moldura; a demonstração o preenche por portal (`Controles`).
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={setSlot}
        data-slot="preview-controls"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 empty:hidden"
      />
      <Card padding="none" className={className}>
        {/* O layout fica nesta camada porque os `previewClassName` do catálogo o sobrescrevem. */}
        <div
          className={cn(
            "flex min-h-28 flex-wrap items-center gap-4 overflow-x-auto p-6",
            previewClassName
          )}
        >
          <PreviewControlsContext.Provider value={slot}>
            {children}
          </PreviewControlsContext.Provider>
        </div>
        {code ? <PreviewCode code={code} /> : null}
      </Card>
    </div>
  )
}

const PreviewControlsContext = React.createContext<HTMLDivElement | null | undefined>(undefined)

/**
 * Os controles de uma demonstração, acima da moldura: eixos à esquerda (`inicio`),
 * cenário e peças à direita (`fim`); levados por portal ao slot do `Preview` mais próximo.
 */
export function Controles({
  inicio,
  fim,
  empilhar = false,
}: {
  inicio?: React.ReactNode
  fim?: React.ReactNode
  empilhar?: boolean
}) {
  const slot = React.useContext(PreviewControlsContext)
  const conteudo = (
    <>
      {inicio ? (
        <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", empilhar && "basis-full")}>{inicio}</div>
      ) : null}
      {fim ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-2",
            empilhar ? "basis-full" : "ms-auto justify-end"
          )}
        >
          {fim}
        </div>
      ) : null}
    </>
  )
  if (slot === undefined) {
    return <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">{conteudo}</div>
  }
  return slot ? createPortal(conteudo, slot) : null
}

/** A gaveta de código no pé da moldura. */
function PreviewCode({ code }: { code: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-t border-border bg-muted/30"
    >
      <div className="flex items-center gap-2 pr-2">
        <CollapsibleTrigger
          className={cn(
            "group flex min-h-10 flex-1 items-center gap-2 px-4 text-left",
            "text-xs font-medium text-muted-foreground",
            "transition-colors duration-(--duration-fast) ease-(--ease-out)",
            "hover:text-foreground active:text-foreground",
            "focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none",
            // Em ponteiro grosso, o alvo de 44px.
            "pointer-coarse:min-h-11"
          )}
        >
          <CollapsibleMarker className="size-3.5" />
          Código
        </CollapsibleTrigger>
        <CopyButton code={code} />
      </div>
      <CollapsibleContent>
        <pre className="overflow-x-auto border-t border-border px-4 py-3 font-mono text-xs leading-relaxed text-foreground">
          {code}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Copiar, com a confirmação ("Copiado") no próprio botão, que se abre para a esquerda e fecha em 1,5s. */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)
  // O hook limpa o timer no desmonte.
  const later = useTimeout()

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      later(() => setCopied(false), 1500)
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="tertiary"
        // `sm`, não `icon-sm`: a palavra precisa de largura livre; `gap-0` porque o respiro mora no `pr-1` do texto.
        size="sm"
        onClick={copy}
        aria-label="Copiar código"
        className={cn(
          "shrink-0 gap-0 px-1.5 text-muted-foreground",
          // `success` e não `income`: "deu certo" não é "entrou dinheiro". O claro mede 4,29/4,48 (aceito); a volta é `--success-muted-foreground`.
          // `hover:`/`active:` porque o `tertiary` declara `hover:text-foreground`, que vence um `text-success` solto.
          copied && "text-success hover:text-success active:text-success"
        )}
      >
        {/* A palavra vem antes do ícone para o botão crescer à esquerda e o ícone ficar parado; a largura anima pelo grid, e o `overflow-hidden` do filho zera o mínimo automático. */}
        <span
          className={cn(
            "grid grid-cols-[0fr]",
            "transition-[grid-template-columns] duration-(--duration-base) ease-(--ease-out)",
            copied && "grid-cols-[1fr]"
          )}
        >
          <span className="overflow-hidden">
            {/* `translate-x-2`: a palavra vem da direita; `whitespace-nowrap` evita quebra letra a letra com a faixa estreita. */}
            <span
              className={cn(
                "block pr-1 whitespace-nowrap",
                "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out)",
                copied ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
              )}
            >
              Copiado
            </span>
          </span>
        </span>
        {/* Sem tamanho cravado: o degrau `sm` desenha o ícone em 14, o que fecha o círculo em repouso. */}
        {copied ? <CheckIcon aria-hidden /> : <DocumentDuplicateIcon aria-hidden />}
      </Button>
      {/* Fora do botão: com `aria-label` o conteúdo dele não é anunciado. */}
      <span role="status" className="sr-only">
        {copied ? "Código copiado" : ""}
      </span>
    </>
  )
}

export type PropRow = {
  prop: string
  type: string
  default?: string
  description: string
}

/**
 * Tabela de props curada, não gerada. A moldura é `bg-card`, como o espécime; sem ela a
 * última linha (sem fio) se dissolvia na página. Sem `table-fixed`: neste caminho a tabela deixa de pintar.
 */
export function PropsTable({
  title = "Props",
  rows,
}: {
  title?: string
  rows: PropRow[]
}) {
  return (
    <PageSection variant="ruled" size="lg">
      <PageSectionHeader>
        <PageSectionTitle>{title}</PageSectionTitle>
      </PageSectionHeader>
      {/* A moldura é `bg-card` com `overflow-hidden` para o cabeçalho respeitar os cantos; `variant="outline"` não pinta fundo. */}
      <Card padding="none">
        <Table size="sm">
          <TableHeader variant="muted">
            <TableRow>
              <TableHead className="w-3/12">Prop</TableHead>
              <TableHead className="w-4/12">Tipo</TableHead>
              <TableHead className="w-2/12">Padrão</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.prop}>
                <TableCell className="font-mono text-xs break-words text-foreground">
                  {r.prop}
                </TableCell>
                {/* Texto mono, não ladrilho: uma união longa quebra como texto. */}
                <TableCell className="font-mono text-xs break-words text-primary-accent">
                  {r.type}
                </TableCell>
                <TableCell className="font-mono text-xs break-words text-muted-foreground">
                  {r.default ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageSection>
  )
}

/**
 * Nota de decisão: o "por quê" que não cabe na descrição de uma prop. Régua à esquerda, sem caixa;
 * sem teto de medida, que só vale onde algo divide a linha pela direita.
 */
export function DocNote({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col border-l-2 border-border pl-4">
      <p className="text-sm font-medium text-balance text-foreground">
        {title}
      </p>
      <div
        className={cn(
          "text-sm leading-relaxed text-pretty text-muted-foreground",
          PROSE_CODE
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Os controles de "Na tela", dentro de `Controles`: o eixo é um valor escolhido na pílula `floating`,
 * o interruptor um `Toggle` fantasma. O eixo não mostra o nome da prop: `rotulo` é o nome acessível;
 * `rotulos` troca o texto de um valor (e ele deixa de ser mono).
 */
export function Eixo<T extends string>({
  rotulo,
  valores,
  valor,
  onChange,
  rotulos,
}: {
  rotulo: string
  valores: readonly T[]
  valor: T
  onChange: (v: T) => void
  rotulos?: Partial<Record<T, React.ReactNode>>
}) {
  return (
    <div className="flex items-center" title={rotulo}>
      <ToggleGroup
        type="single"
        variant="floating"
        size="sm"
        value={valor}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={rotulo}
      >
        {valores.map((v) => (
          <ToggleGroupItem key={v} value={v} className={rotulos?.[v] == null ? "font-mono" : undefined}>
            {rotulos?.[v] ?? v}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

type InterruptorProps = {
  id: string
  rotulo: string
  valor: boolean
  onChange: (v: boolean) => void
}

/** Os interruptores de "Na tela": `Toggle` fantasmas soltos; só agrupam para o leitor de tela. */
export function Interruptores({ children, rotulo = "peças" }: { children: React.ReactNode; rotulo?: string }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-1">
      {children}
    </div>
  )
}

export function Interruptor({ id, rotulo, valor, onChange }: InterruptorProps) {
  return (
    <Toggle
      id={id}
      variant="plain"
      size="md"
      pressed={valor}
      onPressedChange={onChange}
      className="px-3 font-mono text-control-sm"
    >
      {rotulo}
    </Toggle>
  )
}
