"use client"

import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Caption } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import { TILE_COLORS } from "@/lib/tile-palette"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CATEGORIAS = [
  ["Alimentação", 1284.6],
  ["Moradia", 2150],
  ["Transporte", 412.3],
  ["Assinaturas", 189.7],
  ["Lazer", 356.2],
  ["Saúde", 240],
  ["Educação", 520],
  ["Pets", 198.4],
  ["Presentes", 145],
  ["Viagens", 890],
  ["Vestuário", 310.5],
  ["Impostos", 95.8],
] as const

const CARTEIRAS = ["Nubank", "Itaú", "Inter", "C6 Bank", "Carteira física", "Santander", "Caixa", "Bradesco", "XP", "PicPay"]

const VARIANTES = [
  { variant: "plain", rotulo: "plain — só a barra" },
  { variant: "fade", rotulo: "fade — a máscara" },
  { variant: "blur", rotulo: "blur — máscara + borrão" },
  { variant: "material", rotulo: "material — sem máscara" },
] as const

/** Linhas com cor, porque o borrão precisa do que borrar: sobre texto cinza ele quase não lê. */
function Categorias() {
  return (
    <ul className="flex flex-col gap-2 p-3">
      {CATEGORIAS.map(([nome, valor], i) => (
        <li key={nome} className="flex items-center gap-2 text-sm">
          <ColorTile color={TILE_COLORS[i % TILE_COLORS.length]!} />
          <span className="min-w-0 truncate text-foreground">{nome}</span>
          <span className="nums ms-auto text-muted-foreground">{currencyBRL(valor)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ScrollAreaDoc() {
  return (
    <>
      <Usage>
        Uma região rolável dentro de outra coisa — a lista de um popover, o corpo de um cartão de altura fixa, uma fileira de filtros que transborda. A barra mostra <em>onde</em> a rolagem está; as variantes de borda mostram <em>que existe mais</em>, e no telefone, onde a barra some, são elas que comunicam. Nunca na página inteira: a rolagem do documento tem comportamento de sistema que não se imita.
      </Usage>

      <DocSection
        title="A barra e as bordas"
        description="As quatro variantes sobre a mesma lista. plain só desenha a barra; fade dissolve as pontas em que ainda há conteúdo; blur soma um borrão à dissolução; material a substitui — o conteúdo passa nítido por baixo e quem o esconde é o borrão. Role cada uma."
        code={`<ScrollArea className="h-44">…</ScrollArea>
<ScrollArea variant="fade" className="h-44">…</ScrollArea>
<ScrollArea variant="blur" className="h-44">…</ScrollArea>
<ScrollArea variant="material" className="h-44">…</ScrollArea>`}
        previewClassName="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {VARIANTES.map(({ variant, rotulo }) => (
          <div key={variant} className="flex flex-col gap-2">
            <Caption>{rotulo}</Caption>
            <ScrollArea variant={variant} className="h-44 w-full rounded-lg border border-border">
              <Categorias />
            </ScrollArea>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Na horizontal"
        description="Uma fileira que transborda na largura, como os filtros de categoria no telefone. orientation decide a barra e o eixo do fade juntos; sides=&quot;end&quot; dissolve só o fim, para a fileira que sempre começa do início."
        code={`<ScrollArea orientation="horizontal" variant="fade" sides="end">
  <div className="flex w-max gap-2">…</div>
</ScrollArea>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <ScrollArea orientation="horizontal" variant="fade" className="w-full rounded-lg border border-border">
          <div className="flex w-max gap-2 p-3">
            {CATEGORIAS.map(([nome]) => (
              <Badge key={nome} variant="outline">
                {nome}
              </Badge>
            ))}
          </div>
        </ScrollArea>
        <ScrollArea orientation="horizontal" variant="fade" sides="end" className="w-full rounded-lg border border-border">
          <div className="flex w-max gap-2 p-3">
            {CATEGORIAS.map(([nome]) => (
              <Badge key={nome} variant="outline">
                {nome}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </DocSection>

      <DocSection
        title="Sobre qualquer superfície"
        description="O fade é máscara, alfa e não cor: dentro de um popover ele dissolve sobre o --popover sem saber que cor é essa. E numa lista suspensa, arrows põe a seta de “tem mais” sobre a borda que dissolve — some quando a lista chega ao fim."
        code={`<PopoverContent padding="none">
  <ScrollArea variant="fade" arrows className="h-44">…</ScrollArea>
</PopoverContent>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">escolher carteira</Button>
          </PopoverTrigger>
          <PopoverContent padding="none" className="w-56">
            <PopoverTitle className="sr-only">Carteiras</PopoverTitle>
            <ScrollArea variant="fade" arrows className="h-44">
              <ul className="flex flex-col p-1.5">
                {CARTEIRAS.map((c) => (
                  <li key={c} className="rounded-md px-2.5 py-1.5 text-sm text-foreground">
                    {c}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="A tinta do material"
        description="Nasce transparent, e o padrão é o certo: cor cravada vira faixa errada sobre outra superfície. Quem sabe sobre que superfície está escreve a variável — aqui, a do card."
        code={`<ScrollArea
  variant="material"
  className="[--scroll-fade-blur-tint:var(--card)]"
/>`}
        previewClassName="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2"
      >
        {([undefined, "var(--card)"] as const).map((tinta) => (
          <div key={String(tinta)} className="flex flex-col gap-2">
            <Caption>{tinta ? "com a tinta do card" : "sem tinta (o padrão)"}</Caption>
            <ScrollArea
              variant="material"
              className="h-44 w-full rounded-lg border border-border"
              style={tinta ? ({ "--scroll-fade-blur-tint": tinta } as React.CSSProperties) : undefined}
            >
              <Categorias />
            </ScrollArea>
          </div>
        ))}
      </DocSection>

      <DocNote title="Um componente, e o fade é a variante">
        Até a rodada 170 eram dois átomos: o <code>ScrollArea</code>, só com a barra, e o <code>ScrollFade</code>, só com a dissolução — e esta página mandava somá-los. Hoje a máscara mora no <strong>viewport do Radix</strong>, que é quem rola e não pinta nada, e a barra continua irmã dele, fora da máscara. Quem já tem casca própria (o <code>Command</code>, um menu, o corpo do <code>Dialog</code>) não passa por aqui: compõe as classes de <code>lib/scroll-fade-classes</code> com <code>useScrollFade</code>, porque um <code>&lt;div&gt;</code> interposto quebraria o contexto do Radix ou do cmdk.
      </DocNote>

      <DocNote title="O borrão não mora no elemento mascarado">
        Um <code>backdrop-filter</code> no viewport seria recortado pela própria rampa e sumiria justo na ponta. As camadas são <strong>irmãs</strong> do viewport, dentro da raiz; como irmão não lê custom property de irmão, em <code>blur</code> e <code>material</code> o hook espelha as variáveis na raiz. São três camadas por ponta, cada uma borrando o que a de baixo compôs, com raio crescente — uma só faria um crossfade entre nítido e borrado. Sem rolagem, em alto contraste, com <code>prefers-reduced-transparency</code> ou sem <code>backdrop-filter</code>, elas saem do DOM pintado.
      </DocNote>

      <DocNote title="A tinta não herda --mobile-glass-bg">
        Ele muda de superfície entre os temas e é calibrado para uma folha sobre a página; uma borda de rolagem vive sobre card, popover, página ou <code>muted</code>. O que é herdado é a vibrância, <code>saturate(1.5)</code>, a do outro vidro da casa.
      </DocNote>

      <DocNote title="Um eixo de fade por vez">
        É um gradiente por elemento: duas máscaras com <code>mask-composite: intersect</code> dariam alfa zero, porque a spec trata <code>none</code> como camada transparente. Para o conteúdo passar <em>por trás</em> de um cabeçalho fixo, a casca publica a altura dele (<code>scrollFadeBandsClassName</code>), como no <code>Command</code>.
      </DocNote>

      <DocNote title="O polegar tem de ser visto">
        Ele era <code>bg-border</code>, a cor do fio, e sumia justo quando a barra aparece para dizer onde a rolagem está. Hoje é <code>--muted-foreground</code> a 70%, o primeiro degrau que passa 3:1 contra a página nos dois temas (3,06 e 4,24; a 45% eram 1,94 e 2,38) — o degrau da pega do <code>Resizable</code> —, e vai à tinta cheia ao pousar. A barra aparece ao passar o mouse e ao rolar (o <code>type=&quot;hover&quot;</code> do Radix), e fica acima das camadas de borrão.
      </DocNote>

      <DocNote title="Onde o app usa">
        Uma chamada: a grade do <code>ChartHeatmap</code>, que rola na horizontal com <code>variant=&quot;fade&quot;</code> e abre rolada até hoje. O viewport dela é achado por <code>[data-radix-scroll-area-viewport]</code>, porque o Radix põe um invólucro <code>display: table</code> entre o viewport e o conteúdo. Nenhuma tela usa o <code>ScrollArea</code> direto.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"plain" | "fade" | "blur" | "material"',
            default: '"plain"',
            description: "O que a borda faz. blur soma borrão à dissolução; material a substitui.",
          },
          {
            prop: "orientation",
            type: '"vertical" | "horizontal"',
            default: '"vertical"',
            description: "O eixo que rola: decide a barra e o eixo do fade. O outro eixo fica cortado.",
          },
          {
            prop: "sides",
            type: '"both" | "start" | "end"',
            default: '"both"',
            description: "Qual ponta dissolve. Só vale fora do plain.",
          },
          {
            prop: "viewportClassName",
            type: "string",
            description: "Classes do viewport — o nó que rola —, não da raiz. Nas variantes de borda ele não pode pintar nada.",
          },
          {
            prop: "arrows",
            type: "boolean",
            default: "false",
            description: "As setas de “tem mais” de uma lista suspensa. Só na vertical e nas variantes de borda. Select, menus, Combobox e o seletor de formulário já as trazem.",
          },
          {
            prop: "type · scrollHideDelay",
            type: '"hover" | "auto" | "always" | "scroll" · number',
            default: '"hover" · 600',
            description: "Quando a barra aparece, e quanto demora a sumir. São do Radix.",
          },
        ]}
      />
    </>
  )
}
