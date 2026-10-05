"use client"

import * as React from "react"
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShoppingCartIcon,
} from "@heroicons/react/16/solid"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  TIMELINE_TONES,
  Timeline,
  TimelineActions,
  TimelineCard,
  TimelineCollapsed,
  TimelineDescription,
  TimelineDetail,
  TimelineGroup,
  TimelineHeader,
  TimelineItem,
  TimelineLink,
  TimelineSeparator,
  TimelineSkeleton,
  TimelineTime,
  TimelineTitle,
  type TimelineMarker,
} from "@/components/ui/timeline"
import { IDENTITY_TONES } from "@/lib/avatar"
import { formatDayHeadingPtBr, groupByLocalDay } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

type Evento = {
  tone: (typeof TIMELINE_TONES)[number]
  icon: React.ReactNode
  titulo: string
  desc: string
  tempo: string
  hora: string
  dateTime: string
}

const EVENTOS: Evento[] = [
  {
    tone: "income",
    icon: <BanknotesIcon />,
    titulo: "Fatura paga",
    desc: "R$ 1.482,30 debitados da conta corrente",
    tempo: "05/04 · 09:12",
    hora: "09:12",
    dateTime: "2026-04-05T09:12",
  },
  {
    tone: "default",
    icon: <LockClosedIcon />,
    titulo: "Fatura fechada",
    desc: "12 transações no período",
    tempo: "28/03 · 00:00",
    hora: "00:00",
    dateTime: "2026-03-28T00:00",
  },
  {
    tone: "warning",
    icon: <ExclamationTriangleIcon />,
    titulo: "Limite em 85%",
    desc: "Alerta enviado por push",
    tempo: "22/03 · 14:40",
    hora: "14:40",
    dateTime: "2026-03-22T14:40",
  },
  {
    tone: "default",
    icon: <CreditCardIcon />,
    titulo: "Fatura aberta",
    desc: "Início do ciclo de março",
    tempo: "28/02 · 00:00",
    hora: "00:00",
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

const MARCADORES = ["dot", "icon", "avatar", "none"] as const
const DEGRAUS = ["sm", "md", "lg"] as const
const ORIENTACOES = ["vertical", "horizontal"] as const
const LAYOUTS = ["stack", "split"] as const


function avatarDe(iniciais: string, tom: number) {
  return (
    <Avatar size="sm">
      <AvatarFallback className={cn(IDENTITY_TONES[tom].surface, IDENTITY_TONES[tom].ink)}>
        {iniciais}
      </AvatarFallback>
    </Avatar>
  )
}

const PESSOAS = [avatarDe("MA", 0), avatarDe("DP", 3), avatarDe("LS", 2), avatarDe("RC", 4)]

/** Os eixos da lista numa demonstração só: forma, degrau, orientação e layout. */
function DemoNaTela() {
  const [marker, setMarker] = React.useState<TimelineMarker>("icon")
  const [size, setSize] = React.useState<(typeof DEGRAUS)[number]>("md")
  const [orientation, setOrientation] = React.useState<(typeof ORIENTACOES)[number]>("vertical")
  const [layout, setLayout] = React.useState<(typeof LAYOUTS)[number]>("stack")
  const deitada = orientation === "horizontal"

  return (
    <div className="flex w-full flex-col gap-5">
      <Controles
        inicio={
          <>
            <Eixo rotulo="marker" valores={MARCADORES} valor={marker} onChange={setMarker} />
            <Eixo rotulo="size" valores={DEGRAUS} valor={size} onChange={setSize} />
            <Eixo rotulo="orientation" valores={ORIENTACOES} valor={orientation} onChange={setOrientation} />
            <Eixo rotulo="layout" valores={LAYOUTS} valor={layout} onChange={setLayout} />
          </>
        }
      />
      <Timeline
        key={`${orientation}-${layout}`}
        marker={marker}
        size={size}
        orientation={orientation}
        layout={layout}
        reveal
        className="w-full"
      >
        {EVENTOS.slice(0, deitada ? 3 : 4).map((e, i) => (
          <TimelineItem
            key={e.titulo}
            tone={e.tone}
            icon={e.icon}
            avatar={PESSOAS[i]}
            opposite={<time dateTime={e.dateTime}>{e.tempo}</time>}
          >
            <TimelineTitle>{e.titulo}</TimelineTitle>
            <TimelineDescription>{deitada ? e.tempo : e.desc}</TimelineDescription>
            {layout === "stack" && !deitada ? (
              <TimelineTime dateTime={e.dateTime}>{e.tempo}</TimelineTime>
            ) : null}
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  )
}

const CICLO = [
  { t: "Fatura aberta", curto: "Aberta", d: "28/02", state: "done" as const },
  { t: "Fatura fechada", curto: "Fechada", d: "28/03", state: "done" as const },
  { t: "Vence", curto: "Vence", d: "05/04", state: "current" as const, tone: "warning" as const },
  { t: "Próximo ciclo", curto: "Próximo", d: "28/04", state: "upcoming" as const },
]

function DemoEstado() {
  return (
    <div className="flex w-full flex-col gap-8">
      <Timeline className="w-full">
        {CICLO.map((e) => (
          <TimelineItem key={e.t} state={e.state} tone={e.tone}>
            <TimelineTitle>{e.t}</TimelineTitle>
            <TimelineDescription>{e.d}</TimelineDescription>
          </TimelineItem>
        ))}
      </Timeline>
      <Timeline orientation="horizontal" marker="icon" className="w-full">
        {CICLO.slice(0, 3).map((e) => (
          <TimelineItem
            key={e.t}
            state={e.state}
            tone={e.tone ?? "primary"}
            icon={e.state === "done" ? <CheckIcon /> : <CreditCardIcon />}
          >
            <TimelineTitle>{e.curto}</TimelineTitle>
            <TimelineDescription>{e.d}</TimelineDescription>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  )
}

/** O feed ao vivo: um evento novo entra no topo e empurra a trilha. */
function DemoChegada() {
  const [eventos, setEventos] = React.useState<(Evento & { id: number })[]>(() =>
    EVENTOS.slice(0, 3).map((e, i) => ({ ...e, id: i }))
  )
  const proximo = React.useRef(3)
  return (
    <div className="flex w-full flex-col gap-4">
      <Controles
        fim={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const id = proximo.current++
              setEventos((atual) => [
                {
                  tone: "expense",
                  icon: <CreditCardIcon />,
                  titulo: `Compra aprovada #${id}`,
                  desc: "R$ 42,90 · Padaria Central",
                  tempo: "agora",
                  hora: "agora",
                  dateTime: new Date().toISOString(),
                  id,
                },
                ...atual,
              ])
            }}
          >
            simular evento
          </Button>
        }
      />
      <Timeline live reveal marker="icon" className="w-full">
        {eventos.map((e) => (
          <TimelineItem key={e.id} tone={e.tone} icon={e.icon}>
            <TimelineHeader
              end={
                <TimelineTime dateTime={e.dateTime} relative>
                  {e.tempo}
                </TimelineTime>
              }
            >
              <TimelineTitle>{e.titulo}</TimelineTitle>
            </TimelineHeader>
            <TimelineDescription>{e.desc}</TimelineDescription>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  )
}

/**
 * Uma semana de movimentações, agrupada pelo dia local, com o saldo do dia na
 * faixa. Ela mora num cartão, então declara a superfície dele.
 */
function DemoDias() {
  const [eventos] = React.useState(() => {
    const agora = Date.now()
    const h = 3_600_000
    return [
      { id: "a", t: "Padaria Central", d: "Débito · Nubank", valor: -18.9, quando: agora - 0.2 * h, tone: "expense" as const, icon: <ShoppingCartIcon /> },
      { id: "b", t: "Uber", d: "Crédito · Nubank", valor: -27.4, quando: agora - 1.5 * h, tone: "expense" as const, icon: <CreditCardIcon /> },
      { id: "c", t: "Salário", d: "Pix · Conta corrente", valor: 6200, quando: agora - 3 * h, tone: "income" as const, icon: <BanknotesIcon /> },
      { id: "d", t: "Pão de Açúcar", d: "Crédito · Nubank", valor: -312.55, quando: agora - 26 * h, tone: "expense" as const, icon: <ShoppingCartIcon /> },
      { id: "e", t: "Limite em 85%", d: "Alerta enviado por push", valor: null, quando: agora - 28 * h, tone: "warning" as const, icon: <ExclamationTriangleIcon /> },
      { id: "f", t: "Pix de Ana", d: "Conta corrente", valor: 150, quando: agora - 33 * h, tone: "income" as const, icon: <BanknotesIcon /> },
      { id: "g", t: "Spotify", d: "Assinatura renovada", valor: -21.9, quando: agora - 75 * h, tone: "expense" as const, icon: <ArrowPathIcon /> },
      { id: "h", t: "Meta atingida", d: "Reserva de emergência", valor: null, quando: agora - 78 * h, tone: "success" as const, icon: <CheckIcon /> },
      { id: "i", t: "Drogasil", d: "Débito · Conta corrente", valor: -48.3, quando: agora - 100 * h, tone: "expense" as const, icon: <ShoppingCartIcon /> },
    ].map((e) => ({ ...e, iso: new Date(e.quando).toISOString() }))
  })
  return (
    <Card padding="none" className="w-full overflow-hidden">
      <div className="h-80 overflow-y-auto px-4 pb-4" tabIndex={0} aria-label="Movimentações da semana">
        <Timeline marker="icon" className="[--tl-surface:var(--color-card)]">
          {groupByLocalDay(eventos, (e) => e.iso).map((g) => {
            const saldo = g.itens.reduce((soma, e) => soma + (e.valor ?? 0), 0)
            const comValor = g.itens.some((e) => e.valor != null)
            return (
              <TimelineGroup
                key={g.chave}
                sticky
                label={formatDayHeadingPtBr(g.data)}
                end={comValor ? <MoneyDisplay value={saldo} signed size="sm" tone={saldo > 0 ? "income" : "muted"} /> : null}
              >
                {g.itens.map((e) => (
                <TimelineItem key={e.id} tone={e.tone} icon={e.icon}>
                  <TimelineHeader
                    end={e.valor != null ? <MoneyDisplay value={e.valor} signed size="sm" tone={e.valor > 0 ? "income" : "default"} /> : null}
                  >
                    <TimelineTitle>{e.t}</TimelineTitle>
                  </TimelineHeader>
                  <TimelineDescription>
                    {e.d} ·{" "}
                    <TimelineTime dateTime={e.iso} relative className="inline mt-0 text-xs">
                      {"…"}
                    </TimelineTime>
                  </TimelineDescription>
                </TimelineItem>
                ))}
              </TimelineGroup>
            )
          })}
        </Timeline>
      </div>
    </Card>
  )
}

export default function TimelineDoc() {
  return (
    <>
      <Usage>
          Histórico em ordem cronológica, do mais recente para o mais antigo: quem abre um histórico quer saber o que mudou agora. Para progresso em etapas que a pessoa percorre é o <code>Stepper</code>; para eventos com valores comparados lado a lado, a <code>Table</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="A forma do marcador, o degrau, a orientação e a coluna de data são da lista: uma trilha tem uma calha só. O ponto tem um halo do próprio tom, e o poço, um fio de 1px na tinta dele."
        code={`<Timeline marker="icon" reveal>
  <TimelineItem tone="income" icon={<BanknotesIcon />}>
    <TimelineTitle>Fatura paga</TimelineTitle>
    <TimelineDescription>R$ 1.482,30</TimelineDescription>
    <TimelineTime dateTime="2026-04-05T09:12">05/04 · 09:12</TimelineTime>
  </TimelineItem>
</Timeline>

<Timeline layout="split">
  <TimelineItem opposite={<time dateTime="…">05/04 · 09:12</time>}>…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocSection
        title="Estado na trilha"
        description="Concluído é a cor forte, no ponto e no fio até o próximo; o atual tem um anel que pulsa e aria-current; o previsto é vazado, com o fio tracejado e o título apagado. É o ciclo da fatura com datas — passos que a pessoa percorre continuam no Stepper."
        code={`<Timeline>
  <TimelineItem state="done">…</TimelineItem>
  <TimelineItem state="current" tone="warning">…</TimelineItem>
  <TimelineItem state="upcoming">…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <DemoEstado />
      </DocSection>

      <DocSection
        title="Linha compacta"
        description="O evento de sistema numa linha só, entre eventos ricos — ponto pequeno, texto miúdo, a hora na ponta. O strong volta à cor do texto."
        code={`<TimelineItem density="compact">
  <TimelineTitle><strong>Marina</strong> mudou a categoria para Mercado</TimelineTitle>
  <TimelineTime dateTime="…">há 2 h</TimelineTime>
</TimelineItem>`}
        previewClassName="items-stretch"
      >
        <Timeline marker="avatar" className="w-full">
          <TimelineItem avatar={PESSOAS[0]}>
            <TimelineHeader end={<TimelineTime dateTime="2026-04-05T09:12">09:12</TimelineTime>}>
              <TimelineTitle>Marina Alves</TimelineTitle>
            </TimelineHeader>
            <TimelineCard>Dividi a conta do mercado — metade fica no cartão do Diego.</TimelineCard>
          </TimelineItem>
          <TimelineItem density="compact">
            <TimelineTitle>
              <strong>Marina</strong> mudou a categoria para <strong>Mercado</strong>
            </TimelineTitle>
            <TimelineTime dateTime="2026-04-05T09:14">09:14</TimelineTime>
          </TimelineItem>
          <TimelineItem density="compact">
            <TimelineTitle>
              <strong>Diego</strong> marcou como dividida
            </TimelineTitle>
            <TimelineTime dateTime="2026-04-05T10:02">10:02</TimelineTime>
          </TimelineItem>
          <TimelineItem avatar={PESSOAS[1]}>
            <TimelineHeader end={<TimelineTime dateTime="2026-04-05T10:05">10:05</TimelineTime>}>
              <TimelineTitle>Diego Prado</TimelineTitle>
            </TimelineHeader>
            <TimelineDescription>Pagou a parte dele por Pix</TimelineDescription>
          </TimelineItem>
        </Timeline>
      </DocSection>

      <DocSection
        title="Cabeçalho, ações e detalhe"
        description="TimelineHeader põe a hora ou o valor na ponta da linha do título; TimelineActions entrega o degrau sm aos botões; TimelineDetail abre na mola da divulgação."
        code={`<TimelineItem tone="warning" state="current">
  <TimelineHeader end={<MoneyDisplay value={-189.9} size="sm" />}>
    <TimelineTitle>05/04 · em 2 dias</TimelineTitle>
    <Badge tone="warning" size="xs">Pendente</Badge>
  </TimelineHeader>
  <TimelineActions>
    <Button>Pagar</Button>
    <Button variant="tertiary">Ignorar</Button>
  </TimelineActions>
</TimelineItem>`}
        previewClassName="items-stretch"
      >
        <Timeline className="w-full">
          <TimelineItem tone="warning" state="current">
            <TimelineHeader end={<MoneyDisplay value={-189.9} size="sm" />}>
              <TimelineTitle>05/04 · em 2 dias</TimelineTitle>
              <Badge tone="warning" size="xs">Pendente</Badge>
            </TimelineHeader>
            <TimelineDescription>Energia elétrica</TimelineDescription>
            <TimelineActions>
              <Button type="button">pagar</Button>
              <Button type="button" variant="tertiary">ignorar</Button>
            </TimelineActions>
          </TimelineItem>
          <TimelineItem tone="success" state="done">
            <TimelineHeader end={<MoneyDisplay value={-174.32} size="sm" />}>
              <TimelineTitle>05/03</TimelineTitle>
              <Badge tone="success" size="xs">Paga</Badge>
            </TimelineHeader>
            <TimelineDescription>Pago em 04/03 · Pix</TimelineDescription>
            <TimelineDetail>
              <TimelineCard>Consumo de 212 kWh, 8% abaixo de fevereiro. Bandeira verde.</TimelineCard>
            </TimelineDetail>
          </TimelineItem>
          <TimelineItem tone="success" state="done">
            <TimelineHeader end={<MoneyDisplay value={-161.07} size="sm" />}>
              <TimelineTitle>05/02</TimelineTitle>
              <Badge tone="success" size="xs">Paga</Badge>
            </TimelineHeader>
            <TimelineDescription>Pago em 05/02 · Débito automático</TimelineDescription>
          </TimelineItem>
        </Timeline>
      </DocSection>

      <DocSection
        title="Clicável"
        description="O título leva o TimelineLink, e o ::after dele cobre o evento inteiro — o padrão do CardLink. Ações e detalhe ficam por cima."
        code={`<TimelineTitle>
  <TimelineLink asChild><Link href="/transactions?id=…">Fatura paga</Link></TimelineLink>
</TimelineTitle>`}
        previewClassName="items-stretch"
      >
        <Timeline marker="icon" className="w-full">
          {EVENTOS.slice(0, 3).map((e) => (
            <TimelineItem key={e.titulo} tone={e.tone} icon={e.icon}>
              <TimelineTitle>
                <TimelineLink href="#timeline-clicavel">{e.titulo}</TimelineLink>
              </TimelineTitle>
              <TimelineDescription>{e.desc}</TimelineDescription>
            </TimelineItem>
          ))}
        </Timeline>
      </DocSection>

      <DocSection
        title="Recolhidos"
        description="Os eventos do meio numa linha só. Ao mostrar, eles crescem no lugar e o foco vai ao primeiro deles."
        code={`<Timeline>
  <TimelineItem>…</TimelineItem>
  <TimelineCollapsed>
    {meio.map((e) => <TimelineItem key={e.id}>…</TimelineItem>)}
  </TimelineCollapsed>
  <TimelineItem>…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline className="w-full">
          <TimelineItem tone="income">
            <TimelineTitle>Fatura paga</TimelineTitle>
            <TimelineDescription>05/04</TimelineDescription>
          </TimelineItem>
          <TimelineCollapsed>
            {["Compra aprovada", "Estorno", "Compra aprovada", "Ajuste de limite"].map((t, i) => (
              <TimelineItem key={i}>
                <TimelineTitle>{t}</TimelineTitle>
                <TimelineDescription>{`${20 - i * 3}/03`}</TimelineDescription>
              </TimelineItem>
            ))}
          </TimelineCollapsed>
          <TimelineItem>
            <TimelineTitle>Fatura aberta</TimelineTitle>
            <TimelineDescription>28/02</TimelineDescription>
          </TimelineItem>
        </Timeline>
      </DocSection>

      <DocSection
        title="Faixa de dia, presa ao rolar"
        description="groupByLocalDay agrupa uma lista ordenada pelo dia local, e formatDayHeadingPtBr diz Hoje, Ontem, 12 de março; end põe o saldo do dia na ponta da faixa. Cada dia é um TimelineGroup, e com sticky a faixa fica no topo enquanto o dia rola, numa pílula flutuante — e a do dia seguinte a empurra para cima, em vez de pousar sobre ela. Presa, ela ganha por trás um véu na cor da superfície (--tl-surface — aqui, o cartão) que se desfaz em rampa, e o evento rolado dissolve embaixo dela."
        code={`<Timeline className="[--tl-surface:var(--color-card)]">
  {groupByLocalDay(eventos, (e) => e.criadoEm).map((g) => (
    <TimelineGroup
      key={g.chave}
      sticky
      label={formatDayHeadingPtBr(g.data)}
      end={<MoneyDisplay value={saldoDoDia} signed />}
    >
      {g.itens.map((e) => <TimelineItem key={e.id}>…</TimelineItem>)}
    </TimelineGroup>
  ))}
</Timeline>`}
        previewClassName="items-stretch"
      >
        <DemoDias />
      </DocSection>

      <DocSection
        title="Feed ao vivo"
        description="Com live, um evento que chega depois da montagem cresce no lugar e empurra a trilha, na mola; os da primeira pintura não animam. reveal faz a cascata de entrada."
        code={`<Timeline live reveal marker="icon">{eventos.map(…)}</Timeline>`}
        previewClassName="items-stretch"
      >
        <DemoChegada />
      </DocSection>

      <DocSection
        title="Fio que se desenha"
        description="progress=&quot;scroll&quot;: o traço enche do primeiro ao último marcador conforme a trilha passa pela tela. Role a página."
        code={`<Timeline progress="scroll" marker="icon">…</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline progress="scroll" marker="icon" size="lg" className="w-full">
          {[...EVENTOS, ...EVENTOS].map((e, i) => (
            <TimelineItem key={i} tone={e.tone} icon={e.icon}>
              <TimelineTitle>{e.titulo}</TimelineTitle>
              <TimelineDescription>{e.desc}</TimelineDescription>
              <TimelineTime dateTime={e.dateTime}>{e.tempo}</TimelineTime>
            </TimelineItem>
          ))}
        </Timeline>
      </DocSection>

      <DocSection
        title="Carregando"
        description="A trilha esperando dado, na forma e no degrau da lista que vem."
        code={`<TimelineSkeleton marker="icon" count={3} />`}
        previewClassName="items-stretch"
      >
        <TimelineSkeleton marker="icon" count={3} className="w-full" />
      </DocSection>

      <DocSection
        title="Faixa de data e formas misturadas"
        description="O fio continua através da faixa — a data rotula a cronologia, não a interrompe. Um item pode fugir da forma da lista."
        code={`<Timeline marker="icon">
  <TimelineSeparator>Hoje</TimelineSeparator>
  <TimelineItem tone="income" icon={<BanknotesIcon />}>…</TimelineItem>
  <TimelineItem marker="avatar" avatar={<Avatar …/>}>…</TimelineItem>
  <TimelineSeparator>Março</TimelineSeparator>
  <TimelineItem marker="dot" tone="warning">…</TimelineItem>
</Timeline>`}
        previewClassName="items-stretch"
      >
        <Timeline marker="icon" className="w-full">
          <TimelineSeparator>Hoje</TimelineSeparator>
          <TimelineItem tone="income" icon={<BanknotesIcon />}>
            <TimelineTitle>Fatura paga</TimelineTitle>
            <TimelineDescription>R$ 1.482,30 debitados da conta corrente</TimelineDescription>
            <TimelineTime dateTime="2026-04-05T09:12">09:12</TimelineTime>
          </TimelineItem>
          <TimelineItem marker="avatar" avatar={PESSOAS[2]}>
            <TimelineTitle>Luísa Souza</TimelineTitle>
            <TimelineDescription>Comentou na fatura</TimelineDescription>
          </TimelineItem>
          <TimelineSeparator>Março</TimelineSeparator>
          <TimelineItem marker="dot" tone="warning">
            <TimelineTitle>Limite em 85%</TimelineTitle>
            <TimelineDescription>Alerta enviado por push</TimelineDescription>
          </TimelineItem>
          <TimelineItem tone="default" icon={<ArrowPathIcon />}>
            <TimelineTitle>Ciclo reaberto</TimelineTitle>
            <TimelineDescription>Início do período de março</TimelineDescription>
          </TimelineItem>
          <TimelineItem tone="primary" icon={<ChatBubbleLeftIcon />}>
            <TimelineTitle>Lembrete criado</TimelineTitle>
            <TimelineDescription>Pagar até 05/04</TimelineDescription>
          </TimelineItem>
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

      <DocNote title="A lista sabe o fim pelo CSS">
          O último evento não desenha conector nem reserva respiro por <code>:last-child</code>, e a forma e o layout descem por contexto — sem <code>cloneElement</code>. Por isso um fragmento ou um <code>TimelineCollapsed</code> no meio não confundem a trilha. Passe <code>isLast={"{false}"}</code> só na lista que continua além do último item renderizado.
      </DocNote>

      <DocNote title="O relevo não supõe a superfície">
          O halo do ponto é a superfície <code>-muted</code> do próprio tom, e o fio do poço é a tinta dele a 16%. Nenhum dos dois é o <code>ring-background</code> que furava o fio com a cor da página.
      </DocNote>

      <DocNote title="Estado não é Stepper">
          <code>state</code> conta onde um processo com datas está — a fatura que fechou, vence e reabre. Quando a pessoa percorre as etapas e volta a elas, é o <code>Stepper</code>.
      </DocNote>

      <DocNote title="O marcador alinha por fórmula, nunca por mt ou justify">
          O deslocamento é <code>(entrelinha − marcador) / 2</code> com <code>max(0px, …)</code>, derivado do degrau e da medida do marcador renderizado — um item que troca de forma alinha pela dele, e a linha compacta pela entrelinha miúda.
      </DocNote>

      <DocNote title="A hora relativa nasce do servidor">
          No HTML do servidor o <code>TimelineTime relative</code> mostra os filhos; o relativo entra no cliente e se recalcula a cada minuto, com a data completa no <code>title</code>. Passe sempre <code>dateTime</code>.
      </DocNote>


      <PropsTable
        title="Timeline"
        rows={[
          { prop: "marker", type: '"dot" | "icon" | "avatar" | "none"', default: '"dot"', description: "A forma do marcador e a largura da calha; o item pode sobrescrever." },
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Ponto 8/10/12, poço 24/32/40, ícone 14/16/20 — Heroicons 16/solid até md e 20/solid em lg." },
          { prop: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Deitada, o marcador ganha linha própria e o texto se centra nele." },
          { prop: "layout", type: '"stack" | "split"', default: '"stack"', description: "split põe o opposite de cada item numa coluna à esquerda; no telefone ele desce para baixo do conteúdo. Só na vertical." },
          { prop: "reveal", type: "boolean", default: "false", description: "Os eventos sobem em cascata ao montar." },
          { prop: "live", type: "boolean", default: "false", description: "Um evento que chega depois da montagem cresce e empurra a trilha; um que sai, recolhe." },
          { prop: "progress", type: '"scroll"', default: "—", description: "O fio se desenha com a rolagem. Só na vertical; cheio com movimento reduzido." },
        ]}
      />

      <PropsTable
        title="TimelineItem"
        rows={[
          { prop: "tone", type: '"default" | "primary" | "success" | "warning" | "destructive" | "income" | "expense"', default: '"default"', description: "A cor. default para eventos do sistema." },
          { prop: "state", type: '"done" | "current" | "upcoming"', default: "—", description: "Concluído (cor forte no ponto e no fio), atual (anel e aria-current) ou previsto (vazado e tracejado)." },
          { prop: "density", type: '"default" | "compact"', default: '"default"', description: "compact é o evento de sistema numa linha, com ponto pequeno." },
          { prop: "marker", type: '"dot" | "icon" | "avatar" | "none"', default: "o da lista", description: "Foge da forma da lista neste item." },
          { prop: "icon", type: "ReactNode", default: "—", description: 'O glifo do poço, com marker="icon".' },
          { prop: "avatar", type: "ReactNode", default: "—", description: 'Um <Avatar> de quem chama, com marker="avatar".' },
          { prop: "opposite", type: "ReactNode", default: "—", description: 'A coluna de data do layout="split".' },
          { prop: "isLast", type: "boolean", default: "o CSS decide", description: "false na lista que continua além do último item renderizado." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "TimelineHeader end", type: "ReactNode", default: "—", description: "A hora ou o valor na ponta da linha do título." },
          { prop: "TimelineTime relative", type: "boolean", default: "false", description: "Há 5 min, Ontem, Em 3 dias — a partir do dateTime, atualizado a cada minuto." },
          { prop: "TimelineSeparator sticky / end", type: "boolean / ReactNode", default: "false / —", description: "Presa no topo (--tl-sticky-top) numa pílula, com o véu na cor de --tl-surface; end é o resumo do dia." },
          { prop: "TimelineGroup label / end / sticky", type: "ReactNode / ReactNode / boolean", default: "— / — / false", description: "Um dia num contêiner próprio: a faixa presa é empurrada pela do grupo seguinte." },
          { prop: "TimelineCollapsed label / action", type: "(n) => ReactNode / ReactNode", default: '"N eventos ocultos" / "Mostrar"', description: "Os filhos são os itens escondidos." },
          { prop: "TimelineDetail label / openLabel", type: "ReactNode", default: '"Detalhes" / "Ocultar detalhes"', description: "O conteúdo que se abre dentro do evento." },
          { prop: "TimelineLink asChild", type: "boolean", default: "false", description: "O link esticado sobre o evento inteiro." },
          { prop: "TimelineActions", type: "—", default: "—", description: "Os botões do evento, no degrau sm." },
          { prop: "TimelineCard", type: "—", default: "—", description: "O conteúdo numa placa muted." },
          { prop: "TimelineSkeleton", type: "count · lines · marker · size · label", default: "3 · 2 · dot", description: "A trilha esperando dado." },
        ]}
      />
    </>
  )
}
