"use client"

import {
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const EVENTOS = [
  { tone: "income" as const, titulo: "Fatura paga", desc: "R$ 1.482,30 debitados da conta corrente", tempo: "05/04 · 09:12" },
  { tone: "default" as const, titulo: "Fatura fechada", desc: "12 transações no período", tempo: "28/03 · 00:00" },
  { tone: "warning" as const, titulo: "Limite em 85%", desc: "Alerta enviado por push", tempo: "22/03 · 14:40" },
  { tone: "default" as const, titulo: "Fatura aberta", desc: "Início do ciclo de março", tempo: "28/02 · 00:00" },
]

const TONS = [
  ["default", "Neutro", "o que só aconteceu"],
  ["primary", "Marca", "ação do próprio produto"],
  ["success", "Concluído", "deu certo"],
  ["warning", "Atenção", "perto de um limite"],
  ["destructive", "Falhou", "não completou"],
  ["income", "Entrada", "dinheiro que entrou"],
  ["expense", "Saída", "dinheiro que saiu"],
] as const

export default function TimelineDoc() {
  return (
    <>
      <Usage>
        Histórico em ordem cronológica, do mais recente para o mais antigo: quem abre um histórico quer saber o que mudou agora.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Timeline>
  <TimelineItem tone="income">
    <TimelineTitle>Fatura paga</TimelineTitle>
    <TimelineDescription>R$ 1.482,30</TimelineDescription>
    <TimelineTime>05/04 · 09:12</TimelineTime>
  </TimelineItem>
  <TimelineItem isLast>…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline className="w-full">
          {EVENTOS.map((e, i) => (
            <TimelineItem
              key={e.titulo}
              tone={e.tone}
              isLast={i === EVENTOS.length - 1}
            >
              <TimelineTitle>{e.titulo}</TimelineTitle>
              <TimelineDescription>{e.desc}</TimelineDescription>
              <TimelineTime>{e.tempo}</TimelineTime>
            </TimelineItem>
          ))}
        </Timeline>
      </DocSection>

      <DocSection
        title="Tons"
        description="Sete tons e cinco cores: no marcador, income repete success e expense repete destructive, porque --income e --expense são alias dos tokens de status na força cheia. A distinção de dinheiro mora na família -muted, que o Badge usa. Escolha pelo papel mesmo assim — o dia em que os tokens se separarem, o código já estará dizendo a coisa certa."
        previewClassName="items-stretch"
      >
        <Timeline className="w-full">
          {TONS.map(([tone, titulo, desc], i) => (
            <TimelineItem
              key={tone}
              tone={tone}
              isLast={i === TONS.length - 1}
            >
              <TimelineTitle>{titulo}</TimelineTitle>
              <TimelineDescription>{desc}</TimelineDescription>
              <TimelineTime>tone=&quot;{tone}&quot;</TimelineTime>
            </TimelineItem>
          ))}
        </Timeline>
      </DocSection>

      <DocNote title="Cinco cores para sete tons">
        <code>--income</code> é declarado como <code>var(--success)</code> e{" "}
        <code>--expense</code> como <code>var(--destructive)</code>, nos dois
        temas. No marcador, que usa a cor na força cheia, os dois pares saem
        idênticos — medido: <code>oklch(0.542 0.14 152)</code> nos dois verdes.
        A saturação extra que o AGENTS.md promete para dinheiro está na família{" "}
        <code>-muted</code>, e por isso aparece no <code>Badge</code> mas não
        aqui.
      </DocNote>

      <DocNote title="isLast corta o conector">
        Sem ele a linha continua para baixo do último evento e o histórico parece
        truncado. O conector é responsabilidade do item, não do consumidor: por
        isso a prop é um booleano e não um nó que se remove.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"default" | "primary" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"default"',
            description: "A cor do ponto. default para eventos do sistema.",
          },
          {
            prop: "isLast",
            type: "boolean",
            default: "false",
            description: "Remove o conector e o espaço abaixo.",
          },
        ]}
      />
    </>
  )
}
