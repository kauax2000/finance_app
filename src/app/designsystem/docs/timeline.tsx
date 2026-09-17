"use client"

import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@heroicons/react/16/solid"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  TIMELINE_TONES,
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineSeparator,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const EVENTOS = [
  {
    tone: "income" as const,
    icon: <BanknotesIcon />,
    titulo: "Fatura paga",
    desc: "R$ 1.482,30 debitados da conta corrente",
    tempo: "05/04 · 09:12",
    dateTime: "2026-04-05T09:12",
  },
  {
    tone: "default" as const,
    icon: <LockClosedIcon />,
    titulo: "Fatura fechada",
    desc: "12 transações no período",
    tempo: "28/03 · 00:00",
    dateTime: "2026-03-28T00:00",
  },
  {
    tone: "warning" as const,
    icon: <ExclamationTriangleIcon />,
    titulo: "Limite em 85%",
    desc: "Alerta enviado por push",
    tempo: "22/03 · 14:40",
    dateTime: "2026-03-22T14:40",
  },
  {
    tone: "default" as const,
    icon: <CreditCardIcon />,
    titulo: "Fatura aberta",
    desc: "Início do ciclo de março",
    tempo: "28/02 · 00:00",
    dateTime: "2026-02-28T00:00",
  },
]

const PAPEL: Record<(typeof TIMELINE_TONES)[number], string> = {
  default: "o que só aconteceu",
  primary: "ação do próprio produto",
  success: "deu certo",
  warning: "perto de um limite",
  destructive: "não completou",
  income: "dinheiro que entrou",
  expense: "dinheiro que saiu",
}

export default function TimelineDoc() {
  return (
    <>
      <Usage>
          Histórico em ordem cronológica, do mais recente para o mais antigo: quem abre um histórico quer saber o que mudou agora. Para progresso em etapas é o <code>Stepper</code>; para eventos com valores e ações por linha, a <code>Table</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="A lista deriva o índice: quem escreve um evento não sabe, e não precisa saber, se ele é o último."
        code={`<Timeline>
  <TimelineItem tone="income">
    <TimelineTitle>Fatura paga</TimelineTitle>
    <TimelineDescription>R$ 1.482,30</TimelineDescription>
    <TimelineTime dateTime="2026-04-05T09:12">05/04 · 09:12</TimelineTime>
  </TimelineItem>
  <TimelineItem tone="default">…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline className="w-full">
          {EVENTOS.map((e) => (
            <TimelineItem key={e.titulo} tone={e.tone}>
              <TimelineTitle>{e.titulo}</TimelineTitle>
              <TimelineDescription>{e.desc}</TimelineDescription>
              <TimelineTime dateTime={e.dateTime}>{e.tempo}</TimelineTime>
            </TimelineItem>
          ))}
        </Timeline>
      </DocSection>

      <DocSection
        title="Marcador"
        description="A forma é da lista, não do evento: uma trilha tem uma calha só, e é ela que alinha a faixa de data com os eventos."
        code={`<Timeline marker="icon">
  <TimelineItem tone="income" icon={<BanknotesIcon />}>…</TimelineItem>
</Timeline>

<Timeline marker="avatar">
  <TimelineItem avatar={<Avatar size="sm" glass identity={0}>…</Avatar>}>…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full flex-col gap-8">
          <Timeline marker="icon">
            {EVENTOS.slice(0, 3).map((e) => (
              <TimelineItem key={e.titulo} tone={e.tone} icon={e.icon}>
                <TimelineTitle>{e.titulo}</TimelineTitle>
                <TimelineDescription>{e.desc}</TimelineDescription>
                <TimelineTime dateTime={e.dateTime}>{e.tempo}</TimelineTime>
              </TimelineItem>
            ))}
          </Timeline>

          <Timeline marker="avatar">
            {[
              ["Marina Alves", "MA", 0, "Criou a categoria Mercado"],
              ["Diego Prado", "DP", 3, "Editou o limite do Nubank"],
            ].map(([nome, iniciais, tom, acao]) => (
              <TimelineItem
                key={nome as string}
                avatar={
                  <Avatar size="sm" glass identity={tom as number}>
                    <AvatarFallback>{iniciais as string}</AvatarFallback>
                  </Avatar>
                }
              >
                <TimelineTitle>{nome as string}</TimelineTitle>
                <TimelineDescription>{acao as string}</TimelineDescription>
                <TimelineTime dateTime="2026-04-05T09:12">
                  05/04 · 09:12
                </TimelineTime>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </DocSection>

      <DocSection
        title="Vidro"
        description="O acabamento é da lista inteira: se é vidro, é vidro em todo marcador — ponto, poço e avatar."
        code={`<Timeline glass marker="icon">
  <TimelineItem tone="income" icon={<BanknotesIcon />}>…</TimelineItem>
  {/* mesmo trocando de forma, o acabamento acompanha */}
  <TimelineItem marker="avatar" avatar={<Avatar size="sm">…</Avatar>}>…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full flex-col gap-8">
          <Timeline glass marker="icon">
            {EVENTOS.slice(0, 3).map((e) => (
              <TimelineItem key={e.titulo} tone={e.tone} icon={e.icon}>
                <TimelineTitle>{e.titulo}</TimelineTitle>
                <TimelineDescription>{e.desc}</TimelineDescription>
                <TimelineTime dateTime={e.dateTime}>{e.tempo}</TimelineTime>
              </TimelineItem>
            ))}
          </Timeline>

          <Timeline glass marker="dot">
            {EVENTOS.slice(0, 3).map((e) => (
              <TimelineItem key={e.titulo} tone={e.tone}>
                <TimelineTitle>{e.titulo}</TimelineTitle>
                <TimelineDescription>{e.desc}</TimelineDescription>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </DocSection>

      <DocSection
        title="Vidro, com as formas misturadas"
        description="Um evento de avatar numa trilha de ícone: a forma pode variar por item, o material não."
        code={`<Timeline glass marker="icon">
  <TimelineItem tone="income" icon={<BanknotesIcon />}>…</TimelineItem>
  <TimelineItem marker="avatar" avatar={<Avatar …/>}>…</TimelineItem>
  <TimelineItem marker="dot" tone="warning">…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline glass marker="icon" className="w-full">
          <TimelineItem tone="income" icon={<BanknotesIcon />}>
            <TimelineTitle>Fatura paga</TimelineTitle>
            <TimelineDescription>Poço de ícone</TimelineDescription>
          </TimelineItem>
          <TimelineItem
            marker="avatar"
            avatar={
              <Avatar size="sm" glass identity={2}>
                <AvatarFallback>MA</AvatarFallback>
              </Avatar>
            }
          >
            <TimelineTitle>Marina Alves</TimelineTitle>
            <TimelineDescription>
              Bisel de vidro em volta da foto
            </TimelineDescription>
          </TimelineItem>
          <TimelineItem marker="dot" tone="warning">
            <TimelineTitle>Limite em 85%</TimelineTitle>
            <TimelineDescription>Conta de vidro</TimelineDescription>
          </TimelineItem>
        </Timeline>
      </DocSection>

      <DocSection
        title="Escada"
        description="Três degraus: ponto de 8 a 12, poço de 24 a 40. O deslocamento do marcador deriva da entrelinha do título, nunca de um mt cravado."
        code={`<Timeline size="sm" marker="icon">…</Timeline>`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full flex-col gap-8 sm:flex-row sm:gap-6">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Timeline key={size} size={size} marker="icon" className="flex-1">
              {EVENTOS.slice(0, 2).map((e) => (
                <TimelineItem key={e.titulo} tone={e.tone} icon={e.icon}>
                  <TimelineTitle>{e.titulo}</TimelineTitle>
                  <TimelineDescription>size=&quot;{size}&quot;</TimelineDescription>
                </TimelineItem>
              ))}
            </Timeline>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Faixa de data"
        description="Hoje, ontem, março. O fio continua através dela — a data rotula a cronologia, não a interrompe — e quem separa é o respiro, sem traço nem tinta."
        code={`<Timeline marker="icon">
  <TimelineSeparator>Hoje</TimelineSeparator>
  <TimelineItem tone="income" icon={<BanknotesIcon />}>…</TimelineItem>
  <TimelineSeparator>Março</TimelineSeparator>
  <TimelineItem tone="warning" icon={<ExclamationTriangleIcon />}>…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline marker="icon" className="w-full">
          <TimelineSeparator>Hoje</TimelineSeparator>
          <TimelineItem tone="income" icon={<BanknotesIcon />}>
            <TimelineTitle>Fatura paga</TimelineTitle>
            <TimelineDescription>
              R$ 1.482,30 debitados da conta corrente
            </TimelineDescription>
            <TimelineTime dateTime="2026-04-05T09:12">09:12</TimelineTime>
          </TimelineItem>
          <TimelineSeparator>Março</TimelineSeparator>
          <TimelineItem tone="warning" icon={<ExclamationTriangleIcon />}>
            <TimelineTitle>Limite em 85%</TimelineTitle>
            <TimelineDescription>Alerta enviado por push</TimelineDescription>
            <TimelineTime dateTime="2026-03-22T14:40">22/03 · 14:40</TimelineTime>
          </TimelineItem>
          <TimelineItem tone="default" icon={<ArrowPathIcon />}>
            <TimelineTitle>Ciclo reaberto</TimelineTitle>
            <TimelineDescription>Início do período de março</TimelineDescription>
            <TimelineTime dateTime="2026-02-28T00:00">28/02 · 00:00</TimelineTime>
          </TimelineItem>
        </Timeline>
      </DocSection>

      <DocSection
        title="Horizontal"
        description="A mesma trilha deitada, com o texto centrado no marcador. O último item é flex-none, para não reservar a largura de um evento inteiro."
        code={`<Timeline orientation="horizontal" marker="icon">…</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline orientation="horizontal" marker="icon" className="w-full">
          {[
            { icon: <CreditCardIcon />, t: "Aberta", d: "28/02" },
            { icon: <LockClosedIcon />, t: "Fechada", d: "28/03" },
            { icon: <CheckIcon />, t: "Paga", d: "05/04", tone: "income" as const },
          ].map((e) => (
            <TimelineItem key={e.t} tone={e.tone} icon={e.icon}>
              <TimelineTitle>{e.t}</TimelineTitle>
              <TimelineDescription>{e.d}</TimelineDescription>
            </TimelineItem>
          ))}
        </Timeline>
      </DocSection>

      <DocSection
        title="Tons"
        description="Sete tons. No ponto eles rendem cinco cores; no poço, sete."
        previewClassName="items-stretch"
      >
        <div className="flex w-full flex-col gap-8 sm:flex-row sm:gap-6">
          <Timeline className="flex-1">
            {TIMELINE_TONES.map((tone) => (
              <TimelineItem key={tone} tone={tone}>
                <TimelineTitle>{tone}</TimelineTitle>
                <TimelineDescription>{PAPEL[tone]}</TimelineDescription>
              </TimelineItem>
            ))}
          </Timeline>
          <Timeline marker="icon" className="flex-1">
            {TIMELINE_TONES.map((tone) => (
              <TimelineItem key={tone} tone={tone} icon={<BanknotesIcon />}>
                <TimelineTitle>{tone}</TimelineTitle>
                <TimelineDescription>{PAPEL[tone]}</TimelineDescription>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </DocSection>

      <DocNote title="No poço, os sete tons viram sete cores">
          <code>--income</code> e <code>--expense</code> apontam para <code>--success</code> e <code>--destructive</code>, então no ponto, em cor cheia, os pares saem idênticos. O marcador <code>icon</code> lê a família <code>-muted</code>, onde eles divergem — use-o quando entrada e saída precisarem se distinguir.
      </DocNote>

      <DocNote title="A lista deriva o fim">
          A <code>Timeline</code> injeta <code>isLast</code> a partir do índice, como o <code>Stepper</code> e a <code>BreadcrumbList</code>. Passe a prop à mão só na lista que continua depois do último item renderizado.
      </DocNote>

      <DocNote title="O marcador alinha por fórmula, nunca por mt ou justify">
          O deslocamento é <code>(entrelinha − marcador) / 2</code> com <code>max(0px, …)</code>, derivado do degrau e da medida do marcador renderizado — um item que troca de forma alinha pela dele, e a calha continua da lista. A calha é <code>justify-start</code>: no último evento, sem conector, um <code>center</code> desalinharia o marcador.
      </DocNote>

      <DocNote title="Na horizontal o texto se centra no marcador">
          O primeiro texto passa ~7px da borda esquerda da lista: deixe respiro no contêiner, ou uma trilha rente à borda o corta.
      </DocNote>

      <DocNote title="Passe dateTime">
          Um <code>&lt;time&gt;</code> sem <code>dateTime</code> não é data para máquina nenhuma.
      </DocNote>

      <DocNote title="O vidro é da trilha, e acrescenta só aresta">
          O clone da raiz <strong>sobrescreve</strong> o <code>glass</code> do item: não há poço de vidro ao lado de avatar chapado. Com tom opaco entram o aro cônico e o especular, e o corpo e o contraste não mudam; o avatar não declara tom, porque a cor dele é a identidade da pessoa.
      </DocNote>

      <PropsTable
        title="Timeline"
        rows={[
          {
            prop: "marker",
            type: '"dot" | "icon" | "avatar" | "none"',
            default: '"dot"',
            description:
              "A forma do marcador e a largura da calha; o item pode sobrescrever.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "Ponto 8/10/12, poço 24/32/40, e o ícone dentro dele 14/16/20 — use Heroicons 16/solid até md e 20/solid em lg.",
          },
          {
            prop: "glass",
            type: "boolean",
            default: "false",
            description:
              "Vidro em todo marcador da trilha; sobrescreve o item.",
          },
          {
            prop: "orientation",
            type: '"vertical" | "horizontal"',
            default: '"vertical"',
            description: "Deitada, o marcador ganha linha própria e o conector corre à direita.",
          },
        ]}
      />

      <PropsTable
        title="TimelineItem"
        rows={[
          {
            prop: "tone",
            type: '"default" | "primary" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"default"',
            description: "A cor. default para eventos do sistema.",
          },
          {
            prop: "icon",
            type: "ReactNode",
            default: "—",
            description: 'O glifo do poço. Só aparece com marker="icon".',
          },
          {
            prop: "avatar",
            type: "ReactNode",
            default: "—",
            description:
              'Um <Avatar> de quem chama. Só aparece com marker="avatar".',
          },
          {
            prop: "isLast",
            type: "boolean",
            default: "derivado",
            description:
              "Derivado do índice; passe à mão só quando a lista continua além do renderizado.",
          },
        ]}
      />
    </>
  )
}
