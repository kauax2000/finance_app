"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DateTile, DateTileSkeleton, type DateTileSize, type DateTileTone } from "@/components/ui/date-tile"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

const TAMANHOS = ["md", "lg"] as const satisfies readonly DateTileSize[]
const TONS = ["default", "overdue"] as const satisfies readonly DateTileTone[]

/** O corpo do card da fatura no detalhe do lançamento, com números autorados. */
function Fatura({ tone = "default" }: { tone?: DateTileTone }) {
  return (
    <div className="flex items-center gap-3">
      <DateTile date="2026-12-10" caption="vence" tone={tone} />
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <MoneyDisplay value={897.09} size="lg" />
        <Caption>esta compra R$ 15,00 · fecha 26/nov</Caption>
      </div>
      <Badge tone={tone === "overdue" ? "destructive" : "success"}>{tone === "overdue" ? "Vencida" : "Aberta"}</Badge>
    </div>
  )
}

function DemoNaTela() {
  const [size, setSize] = React.useState<DateTileSize>("md")
  const [tone, setTone] = React.useState<DateTileTone>("default")
  const [legenda, setLegenda] = React.useState(true)
  const [esqueleto, setEsqueleto] = React.useState(false)

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        inicio={
          <>
            <Eixo rotulo="size" valores={TAMANHOS} valor={size} onChange={setSize} />
            <Eixo rotulo="tone" valores={TONS} valor={tone} onChange={setTone} rotulos={{ default: "padrão", overdue: "vencida" }} />
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="date-tile-legenda" rotulo="Legenda" valor={legenda} onChange={setLegenda} />
            <Interruptor id="date-tile-esqueleto" rotulo="Esqueleto" valor={esqueleto} onChange={setEsqueleto} />
          </Interruptores>
        }
      />
      <div className="flex items-center gap-3">
        {esqueleto ? (
          <DateTileSkeleton size={size} />
        ) : (
          <DateTile date="2026-12-10" size={size} tone={tone} caption={legenda ? "vence" : undefined} />
        )}
        <Caption>{tone === "overdue" ? "O vencimento passou e a fatura não foi paga." : "A fatura de dezembro vence no dia 10."}</Caption>
      </div>
    </div>
  )
}

export default function DateTileDoc() {
  return (
    <>
      <Usage>
        A folhinha de calendário: o mês abreviado, o dia grande e uma legenda curta. Use-a quando <strong>uma</strong> data é a âncora de um cartão — o vencimento de uma fatura — e a pessoa precisa achá-la de relance. Não a use numa lista de datas (isso é texto, por <code>formatDatePtBr</code>) nem para escolher uma data (isso é o <code>DatePicker</code>). Quem usa: o card da fatura no detalhe do lançamento, uma tela.
      </Usage>

      <DocSection
        title="Na tela"
        description="O mês em pt-BR sai dos helpers de transaction-date, sem o ponto do Intl. No tom vencida só o mês muda de tinta; o dia continua na do texto."
        code={`<DateTile date={estado.dueYmd} caption="vence" tone={vencida ? "overdue" : "default"} />`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A superfície é a do muted, no degrau da linha alta">
        <code>bg-muted</code> com <code>rounded-row-lg</code> (16px), o degrau da linha alta na escala de Shape &amp; Elevation; o mockup tinha 14px, fora da escala. Com legenda, o <code>md</code> mede 56 × 76 e o <code>lg</code> 64 × 84 (medido); o esqueleto guarda essas caixas. O mês é <code>text-2xs</code> em negrito com <code>tracking-wider</code>, o dia é <code>text-2xl</code> (md) ou <code>text-3xl</code> (lg) com algarismos tabulares, e a legenda é <code>text-2xs</code> no <code>muted-foreground</code>.
      </DocNote>

      <DocNote title="O vermelho é só do vencido">
        No tom padrão o mês fica no <code>muted-foreground</code>; o vermelho de calendário de papel foi guardado para <code>tone=&quot;overdue&quot;</code>, em <code>text-destructive</code>. Vermelho sempre aceso não diria nada quando a data passasse.
      </DocNote>

      <DocNote title="O leitor de tela ouve a data por extenso">
        O nó é um <code>&lt;time dateTime&gt;</code> com <code>role=&quot;img&quot;</code> e o nome &quot;vence em 10 de dezembro&quot; (a legenda abre a frase; sem legenda, só a data). Mês, dia e legenda são <code>aria-hidden</code>: &quot;DEZ 10 vence&quot; lido em sequência não é uma frase. Uma data inválida não desenha nada.
      </DocNote>

      <DocSection title="No telefone" description="O corpo do card da fatura, como o detalhe do lançamento o mostra: a folhinha à esquerda, o total e a compra no meio, o selo à direita.">
        <IphoneFrame title="A folhinha num iPhone">
          <div className="flex h-full flex-col justify-center gap-3 px-4">
            <Card padding="sm">
              <CardContent>
                <Fatura />
              </CardContent>
            </Card>
            <Card padding="sm">
              <CardContent>
                <Fatura tone="overdue" />
              </CardContent>
            </Card>
          </div>
        </IphoneFrame>
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="O osso na caixa da folhinha com legenda, nos dois degraus. group={false} dentro de um esqueleto de página."
        code={`<DateTileSkeleton />
<DateTileSkeleton size="lg" group={false} />`}
      >
        <DateTileSkeleton />
        <DateTileSkeleton size="lg" />
      </DocSection>

      <PropsTable
        title="Props de DateTile"
        rows={[
          { prop: "date", type: "string | Date", description: "YYYY-MM-DD (o resto da string é ignorado) ou um Date local. Inválida, a peça não desenha nada." },
          { prop: "caption", type: "string", description: "A legenda curta embaixo do dia (\"vence\"). Também abre o nome acessível." },
          { prop: "tone", type: '"default" | "overdue"', default: '"default"', description: "overdue pinta o mês em text-destructive." },
          { prop: "size", type: '"md" | "lg"', default: '"md"', description: "56 ou 64px de largura." },
          { prop: "className", type: "string", description: "Posição de quem monta; nunca cor nem tamanho." },
        ]}
      />

      <PropsTable
        title="Props de DateTileSkeleton"
        rows={[
          { prop: "size", type: '"md" | "lg"', default: '"md"', description: "O degrau da folhinha que ele guarda." },
          { prop: "group", type: "boolean", default: "true", description: "Embrulha o osso num SkeletonGroup com o rótulo “Carregando a data”. false é para quem já está dentro de um." },
          { prop: "className", type: "string", description: "Posição de quem monta." },
        ]}
      />
    </>
  )
}
