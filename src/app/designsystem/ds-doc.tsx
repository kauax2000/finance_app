"use client"

import { CheckIcon, ChevronRightIcon, DocumentDuplicateIcon } from "@heroicons/react/16/solid"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { slugifyCategory } from "./registry"
import { Button } from "@/components/ui/button"
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
  | "Fundações"
  | "Átomos"
  | "Moléculas"
  | "Organismos"
  // O nível que faltava para o modelo ficar completo: objetos de nível de
  // página, que dispõem componentes num layout em vez de serem o conteúdo.
  | "Templates"
  | "Padrões"

export type DocNeighbor = { slug: string; name: string; category?: Category }

/**
 * A sobrancelha em versalete do catálogo.
 *
 * Ela era a mesma medida escrita **duas vezes** — aqui e no índice —, e agora é
 * uma: a régua mora em `PageHeaderEyebrow`, que é onde ela é usada como peça, e
 * o que resta aqui é o apelido local para os dois lugares deste arquivo que a
 * usam sem ser cabeçalho de página (a categoria e o "quando usar").
 */
const EYEBROW = pageEyebrowClassName

/**
 * `<code>` cru na prosa da documentação.
 *
 * Mono e na cor do texto forte, sem ladrilho: com 141 notas na casa, um chip de
 * fundo por identificador transformava cada parágrafo em pontilhado.
 */
const PROSE_CODE = "[&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground"

/**
 * O casco de uma página de componente.
 *
 * A régua desta página é o **fio**, não a caixa. Antes cada informação vinha
 * dentro do próprio cartão arredondado — import, "quando usar", espécime, aba
 * de código, nota, tabela de props e o par do rodapé, sete significados
 * diferentes usando a mesma borda —, e quando tudo está emoldurado nada está
 * em destaque: a página lia como painel de controle, não como especificação.
 *
 * Ficou uma caixa só, e ela é a moldura do espécime: o único lugar onde a borda
 * trabalha, separando a cromagem da documentação do componente de verdade que
 * está sendo medido. O resto se organiza por fio, versalete e ar — que é
 * exatamente o que o índice já fazia, e que estas 88 páginas contradiziam.
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
      {/* Sem trilha. Ela tinha três degraus para uma hierarquia de dois — o
          catálogo e a página —, e o terceiro degrau era o nome do componente,
          que o título repete dois centímetros abaixo. A categoria não era um
          degrau de caminho: é a classificação da peça, e voltou para onde uma
          classificação mora, na borda direita da linha do título. */}
      {/* `PageHeader` de verdade, e não a cópia à mão que estava aqui. A
          categoria é o `endAdornment` — a mesma peça, com o mesmo nome, que
          `DialogHeaderRow` e `HoverCardHeader` já têm; ela alinha pela linha de
          base do título, que é o que a prende à primeira linha quando o nome
          quebra em duas. `plain` porque quem fecha este cabeçalho é o campo de
          import logo abaixo, não uma régua. */}
      <PageHeader variant="plain">
        <PageHeaderTitleRow
          endAdornment={
            <Link
              href={`/designsystem#${slugifyCategory(category)}`}
              className={cn(
                EYEBROW,
                "rounded-sm text-muted-foreground underline-offset-4",
                "transition-colors duration-(--duration-fast) ease-(--ease-out)",
                "hover:text-foreground hover:underline active:text-foreground active:underline",
                "focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none"
              )}
            >
              {category}
            </Link>
          }
        >
          <PageHeaderTitle>{name}</PageHeaderTitle>
          {/* Nome sobre descrição é o mesmo dado em duas linhas: quem separa é
              a entrelinha, não um `gap` — e agora é o componente que garante
              isso, em vez de cada cabeçalho lembrar. A coluna do catálogo já
              tem a medida de leitura, então o teto de `max-w-2xl` sai. */}
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
 * O campo de identificação: o que se digita e onde a coisa mora.
 *
 * Ele voltou a ser um campo com moldura própria, e não uma faixa entre fios —
 * um import é para copiar, e o que se copia se anuncia como um campo. O botão
 * fica no topo, dentro dele.
 *
 * A diferença para a primeira versão é que agora é **uma caixa só**. Antes o
 * bloco de código era emoldurado e o caminho do arquivo vinha logo abaixo num
 * segundo ladrilho solto, o que dava duas molduras para um dado que é um só: o
 * componente e o arquivo em que ele está. Aqui o caminho é o rodapé do próprio
 * campo, sob um fio.
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
    <div className="relative mt-6 overflow-hidden rounded-xl border border-border bg-muted/40">
      {importLine ? (
        <>
          {/* Absoluto, e não uma linha própria: o botão não deve empurrar o
              código para baixo nem gastar altura quando o import cabe numa
              linha só — que é o caso de quase todas as 88 páginas. */}
          <div className="absolute top-2 right-2">
            <CopyButton code={importLine} />
          </div>
          {/* O `pr-14` reserva o território do botão em todas as linhas. Sem
              ele, um import longo passa por baixo do botão ao quebrar. */}
          <pre className="overflow-x-auto px-4 py-3.5 pr-14 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
            {importLine}
          </pre>
        </>
      ) : null}
      {source ? (
        <div
          className={cn(
            "px-4 py-2",
            importLine && "border-t border-border"
          )}
        >
          <code className="font-mono text-2xs break-all text-muted-foreground">
            {source}
          </code>
        </div>
      ) : null}
    </div>
  )
}

/**
 * O par anterior/próximo no pé.
 *
 * Sem ele, a única saída de uma página era voltar à lista e procurar de novo —
 * e o catálogo tem uma ordem de leitura real, categoria por categoria, que
 * ninguém conseguia seguir. É a mesma ordem da navegação lateral.
 *
 * Ele encolheu de rodapé de documento para navegação. Eram dois blocos de
 * 110px, cada um com uma sobrancelha em versalete, o nome e a categoria em três
 * linhas empilhadas, separados por um fio vertical: a forma de um livro, não a
 * de uma interface. Agora são dois controles de 36px numa linha só, sob a mesma
 * régua.
 *
 * O que sumiu da tela continua existindo para quem não a vê: o rótulo de
 * direção virou `sr-only`, porque a seta já diz para o olho o que a palavra
 * dizia — e sem ela um leitor de tela ouviria dois nomes sem saber qual é qual.
 */
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
  // A categoria do vizinho só aparece quando ela **muda**. Em 84 das 88 páginas
  // ela seria a mesma da página atual — informação que não informa, ocupando
  // uma linha inteira. Nas quatro fronteiras ela é exatamente o que interessa
  // saber antes de avançar.
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
    <Link
      href={`/designsystem/${entry.slug}`}
      className={cn(
        "group inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5",
        "text-sm font-medium text-muted-foreground",
        "transition-colors duration-(--duration-fast) ease-(--ease-out)",
        "hover:bg-accent hover:text-foreground active:bg-accent active:text-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none",
        // Em ponteiro grosso o alvo vai aos 44px que a própria página
        // /designsystem/mobile-toque exige. É a mesma cortesia da lateral.
        "pointer-coarse:min-h-11",
        // O recuo tira o padding do controle da margem do conteúdo: o nome
        // alinha com o texto acima, e a superfície de hover é que avança.
        isNext ? "-mr-2.5" : "-ml-2.5"
      )}
    >
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
  )
}

/**
 * O "quando usar" — a frase mais importante de cada uma das 88 páginas.
 *
 * Era um `Alert`, e por isso era uma caixa com fundo, borda e ícone: o mesmo
 * peso visual de um aviso de erro, para um texto que só explica a regra. Virou
 * o que sempre foi, uma abertura sob régua de acento, em `text-foreground` —
 * porque é tese, não legenda.
 *
 * De quebra some a região viva: como `Alert`, este painel estático se
 * reanunciava ao leitor de tela a cada carga de página.
 */
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
    // `size="lg"` porque é o corpo que estas 247 seções já renderizam, e
    // `ruled` porque a régua de uma seção é **em cima**: ela diz que começa
    // outro bloco. O `mt-4` que o espécime carregava saiu — o `gap` da seção é
    // o mesmo 16, e ele vale também entre o título e o espécime quando não há
    // descrição.
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

/**
 * A moldura do espécime — a única caixa da página.
 *
 * O código deixou de ser uma aba acima dela. A `TabsList` era um controle
 * emoldurado flutuando sobre uma moldura, uma vez em cada uma das 124 seções do
 * catálogo, e escolher "Código" trocava o espécime pela fonte: para comparar as
 * duas coisas era preciso ir e voltar. Agora a fonte abre **dentro** da mesma
 * moldura, sob um fio, com o espécime continuando à vista.
 */
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
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      {/* As classes de layout continuam nesta camada, e não na moldura: é o que
          os 85 `previewClassName` do catálogo sobrescrevem, `p-0` inclusive. */}
      <div
        className={cn(
          "flex min-h-28 flex-wrap items-center gap-4 overflow-x-auto p-6",
          previewClassName
        )}
      >
        {children}
      </div>
      {code ? <PreviewCode code={code} /> : null}
    </div>
  )
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
            "focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none",
            // A mesma cortesia da navegação lateral: em ponteiro grosso o alvo
            // vai aos 44px que a página /designsystem/mobile-toque exige.
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

/**
 * Copiar, com a confirmação no próprio botão.
 *
 * Um só peso nos dois lugares onde ele aparece. Chegou a ser `outline` sobre a
 * superfície tingida do campo de import, para se anunciar como controle — mas
 * com o mesmo `icon-sm` do outro, o contorno não mudava o tamanho, só fazia
 * parecer que mudava. Dois botões que fazem a mesma coisa não têm por que ter
 * pesos diferentes.
 */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Button
      type="button"
      variant="tertiary"
      size="icon-sm"
      onClick={copy}
      aria-label="Copiar código"
      className="shrink-0 text-muted-foreground"
    >
      {copied ? (
        <CheckIcon className="text-success" aria-hidden />
      ) : (
        <DocumentDuplicateIcon aria-hidden />
      )}
    </Button>
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
 * campo de texto junto com as três que interessam.
 *
 * Ela tem moldura, e a moldura é `bg-card`, a mesma do espécime.
 *
 * Chegou a ficar sem preenchimento, sob o argumento de que o espécime é uma
 * superfície e a tabela é uma região. A distinção não sobrevive à pergunta de
 * se alguém lendo a página a formularia: quando o leitor não consegue nomear a
 * diferença, ela não é distinção, é inconsistência. E no app tabela mora dentro
 * de cartão — deixá-la sobre o fundo da página era mostrá-la de um jeito que o
 * produto nunca mostra.
 *
 * O que sobra é um sistema de dois preenchimentos: `card` para superfície de
 * conteúdo, `muted` para código. O campo de import é o único do segundo tipo.
 *
 * Sem a moldura, a tabela não tinha fim: o `Table` remove o fio da última linha
 * (`[&_tr:last-child]:border-0`), o que é certo quando existe uma borda externa
 * fechando embaixo e errado quando não existe — a última linha se dissolvia na
 * página. E a região de rolagem horizontal não tinha margem: numa tela estreita
 * a tabela deslizava por baixo de nada.
 *
 * A faixa de cabeçalho tingida é o sinal mais legível de "isto é uma tabela", e
 * ela sozinha já resolveria metade da questão.
 *
 * As larguras saíram de porcentagem arbitrária para a escala de doze
 * colunas — as mesmas proporções, no vocabulário do resto do app.
 *
 * Sem `table-fixed`: com ele a tabela inteira deixa de pintar neste caminho de
 * renderização — fio, cabeçalho e células —, embora continue no DOM, com as
 * medidas certas e respondendo ao ponteiro. Em `auto`, a largura declarada é a
 * dica que sempre foi, que é como as porcentagens anteriores já funcionavam.
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
      {/* `Table` já traz o próprio contêiner de rolagem horizontal; esta camada
          é a moldura, e o `overflow-hidden` é o que faz o tingido do cabeçalho
          respeitar os cantos arredondados. */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            {/* O hover de linha vem do componente `Table` e é certo lá: uma
                tabela de dados costuma ter linha selecionável. Aqui é tabela de
                referência, e nada acontece ao clicar — a linha acender ao passar
                o cursor é promessa falsa. `cn` resolve o conflito e a classe de
                cá vence. */}
            <TableRow className="bg-muted/40 hover:bg-muted/40 active:bg-muted/40">
              <TableHead className="w-3/12">Prop</TableHead>
              <TableHead className="w-4/12">Tipo</TableHead>
              <TableHead className="w-2/12">Padrão</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.prop}
                className="hover:bg-transparent active:bg-transparent"
              >
                <TableCell className="font-mono text-xs break-words text-foreground">
                  {r.prop}
                </TableCell>
                {/* Uma união de oito literais é o conteúdo mais longo da
                    tabela. Em ladrilho ela quebrava em três retângulos
                    desalinhados; em texto mono ela quebra como texto. */}
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
      </div>
    </PageSection>
  )
}

/**
 * Nota de decisão. Serve para o "por quê" que não cabe numa descrição de prop e
 * que, sem um lugar, acabaria só no comentário do componente.
 *
 * Régua à esquerda, sem preenchimento e sem caixa: são 141 delas no catálogo, e
 * emolduradas faziam a metade de baixo de toda página virar pilha de cartão.
 *
 * A régua tem a mesma espessura da abertura de "quando usar" — a 1px ela
 * sumia —, e o que distingue as duas é a cor: acento lá, fio comum aqui.
 *
 * O corpo ocupa a largura da coluna, como toda a prosa daqui. A regra: teto de
 * medida só onde alguma coisa divide a linha pela direita, porque aí a folga
 * tem dono. Um parágrafo sozinho na linha, com o teto, só produzia um degrau
 * entre onde o texto termina e onde termina o conteúdo logo abaixo dele.
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
