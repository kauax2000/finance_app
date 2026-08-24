"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Code } from "@/components/ui/code"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "@/components/ui/page-header"

export type Category =
  | "Fundações"
  | "Átomos"
  | "Moléculas"
  | "Organismos"
  | "Padrões"

/**
 * O casco de uma página de componente: cabeçalho, linha de import e o corpo.
 *
 * Estes primitivos de documentação vivem dentro da própria rota, e não em
 * `components/ui/`, de propósito. Eles só existem aqui: `Preview`, `PropsTable`
 * e companhia não têm sentido em nenhuma tela do produto, e promovê-los ao
 * design system só faria o catálogo descrever a si mesmo.
 */
export function DocPage({
  name,
  category,
  description,
  source,
  importLine,
  children,
}: {
  name: string
  category: Category
  description: string
  source?: string
  importLine?: string
  children: React.ReactNode
}) {
  return (
    <article className="flex min-w-0 flex-col gap-8 pb-16">
      <div className="flex flex-col gap-3">
        <PageHeader>
          <PageHeaderTitleRow>
            <span className="text-xs font-medium tracking-wide text-primary uppercase">
              {category}
            </span>
            <PageHeaderTitle className="page-title text-2xl sm:text-2xl">
              {name}
            </PageHeaderTitle>
            <PageHeaderDescription>{description}</PageHeaderDescription>
          </PageHeaderTitleRow>
        </PageHeader>
        {importLine ? (
          <div className="mt-1 flex flex-col gap-1.5">
            <CodeBlock code={importLine} />
            {source ? (
              <Code className="w-fit text-2xs">{source}</Code>
            ) : null}
          </div>
        ) : null}
      </div>
      {children}
    </article>
  )
}

/** O aviso de "quando usar" no topo do corpo. */
export function Usage({ children }: { children: React.ReactNode }) {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>Quando usar</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
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
    <section className="flex scroll-mt-24 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Preview
        code={code}
        className={className}
        previewClassName={previewClassName}
      >
        {children}
      </Preview>
    </section>
  )
}

/** A demonstração emoldurada, com a aba de código quando há código. */
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
  const frame = (
    <div
      className={cn(
        "flex min-h-28 flex-wrap items-center gap-4 overflow-x-auto rounded-xl border border-border bg-card p-6",
        previewClassName
      )}
    >
      {children}
    </div>
  )

  if (!code) {
    return <div className={className}>{frame}</div>
  }

  return (
    <Tabs defaultValue="preview" className={className}>
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Código</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">{frame}</TabsContent>
      <TabsContent value="code">
        <CodeBlock code={code} />
      </TabsContent>
    </Tabs>
  )
}

/** Bloco de código com botão de copiar. */
export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-muted/40">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        aria-label="Copiar código"
        className="absolute top-2 right-2 bg-background"
      >
        {copied ? (
          <CheckIcon className="text-success" aria-hidden />
        ) : (
          <CopyIcon aria-hidden />
        )}
      </Button>
      <pre className="overflow-x-auto p-4 pr-14 font-mono text-[13px] leading-relaxed text-foreground">
        {code}
      </pre>
    </div>
  )
}

export type PropRow = {
  prop: string
  type: string
  default?: string
  description: string
}

/**
 * A tabela de props é curada, não gerada: o que importa é o que o consumidor
 * precisa decidir, e uma extração automática lista as 300 props nativas de um
 * `<input>` junto com as três que interessam.
 */
export function PropsTable({
  title = "Props",
  rows,
}: {
  title?: string
  rows: PropRow[]
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[22%]">Prop</TableHead>
              <TableHead className="w-[30%]">Tipo</TableHead>
              <TableHead className="w-[14%]">Padrão</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.prop}>
                <TableCell>
                  <Code className="text-foreground">{r.prop}</Code>
                </TableCell>
                <TableCell>
                  <Code className="text-primary">{r.type}</Code>
                </TableCell>
                <TableCell>
                  {r.default ? (
                    <Code>{r.default}</Code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

/**
 * Nota de decisão. Serve para o "por quê" que não cabe numa descrição de prop e
 * que, sem um lugar, acabaria só no comentário do componente.
 */
export function DocNote({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border border-l-primary bg-muted/30 px-4 py-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-1 text-sm text-muted-foreground [&_code]:text-xs">
        {children}
      </div>
    </div>
  )
}
