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
        Histórico em ordem cronológica, do mais recente para o mais antigo: quem
        abre um histórico quer saber o que mudou agora.
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
        description="A forma é da lista, não do evento: uma trilha tem uma calha só, e é ela que faz a faixa de data alinhar com os eventos. O poço de md mede 32px — a medida que a tela de atividade já renderiza à mão."
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
        description="O acabamento é da lista inteira, e não do evento. Se é vidro, é vidro em todo marcador — ponto, poço e avatar. Não há como escrever a trilha com metade de cada."
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
        description="A trilha é de ícone e um dos eventos é de avatar. O acabamento não se parte: o eixo é da raiz e sobrescreve o item, então a forma pode variar e o material não."
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
        description="Três degraus. O ponto vai de 8 a 12, o poço de 24 a 40, e o deslocamento do marcador deriva da entrelinha do título em cada um — não é um mt cravado."
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
        description="Hoje, ontem, março. O fio continua através dela — a data rotula a cronologia, não a interrompe — e ela não desenha traço nem tinta próprios: quem separa é o respiro."
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
        description="A mesma trilha deitada, com o texto centrado no marcador. O último item é flex-none: com todos esticando, ele reservaria a largura de um evento inteiro para mostrar um marcador — foi o vão morto que o Stepper mediu."
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
        description="Sete tons. No ponto eles rendem cinco cores; no poço, sete — e é por isso que o poço não é enfeite."
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

      <DocNote title="O poço é onde os sete tons viram sete cores">
        <code>--income</code> é declarado como <code>var(--success)</code> e{" "}
        <code>--expense</code> como <code>var(--destructive)</code>, nos dois
        temas. No <strong>ponto</strong>, que usa a cor na força cheia, os dois
        pares saem idênticos — medido: <code>oklch(0.542 0.14 152)</code> nos
        dois verdes. Na família <code>-muted</code> eles divergem —{" "}
        <code>oklch(0.93 0.07 152)</code> contra <code>oklch(0.96 0.03 152)</code>{" "}
        —, e o comentário do <code>globals.css</code> chama essa família, com
        estas palavras, de &ldquo;chips, badges, <strong>icon wells</strong>
        &rdquo;. O marcador <code>icon</code> lê dela.
      </DocNote>

      <DocNote title="A lista deriva o fim, e o catálogo afirmava isso sem que fosse verdade">
        Esta página dizia que &ldquo;o conector é responsabilidade do item, não
        do consumidor&rdquo; — enquanto a demonstração logo acima escrevia{" "}
        <code>isLast=&#123;i === EVENTOS.length - 1&#125;</code> em toda chamada.
        Hoje a <code>Timeline</code> deriva do índice e injeta por clone, como o{" "}
        <code>Stepper</code> e a <code>BreadcrumbList</code>. A prop continua
        existindo para a exceção: a lista que continua depois do último item
        renderizado.
      </DocNote>

      <DocNote title="O ponto está no centro da primeira linha, e não estava">
        Era <code>mt-0.5</code> — 2px — mais metade de <code>size-2.5</code>:
        centro a 7px do topo, contra os 11,375 do centro de uma caixa de 22,75px.{" "}
        <strong>4,4px de desalinho.</strong> A conta é{" "}
        <code>(entrelinha − marcador) / 2</code>, deriva do degrau, e o{" "}
        <code>max(0px, …)</code> é o que faz o poço — maior que uma linha —
        alinhar pelo topo do bloco em vez de subir para fora dele.
      </DocNote>

      <DocNote title="Na horizontal o texto se centra no marcador">
        Rente à esquerda, o centro da caixa de texto ficava a{" "}
        <strong>161,4px</strong> do centro do marcador — o olho lia a palavra
        pendurada na trilha em vez de presa ao evento. Hoje a caixa é{" "}
        <code>max-content</code> e se desloca meia medida do marcador:
        desalinho <strong>0</strong> nos três.
        <br />
        <br />
        <strong>Isto inverte a escolha do <code>Stepper</code></strong> para a
        mesma geometria — lá o primeiro rótulo fica rente à esquerda, porque
        centrá-lo o levaria para fora da trilha. Aqui os três se centram, e o
        custo está medido: o texto do primeiro passa 6,62px da borda esquerda
        da lista. Qualquer contêiner com respiro absorve — no catálogo sobram
        18,4px dos 25 —, mas uma trilha rente à borda corta ~7px.
      </DocNote>

      <DocNote title="Todo marcador alinha pelo topo, inclusive o último">
        A calha é <code>justify-start</code>, e nunca <code>center</code>. O
        conector é <code>flex-1</code>, então com ele não sobra espaço livre e o
        <code>justify</code> não decide nada — mas no <strong>último</strong>{" "}
        evento não há conector, e ali um <code>center</code> centrava o marcador
        sozinho na altura da calha: <strong>23,44px</strong> abaixo do centro do
        título, contra 0 nos outros. Quem alinha é a fórmula do deslocamento, e
        um <code>justify</code> que só age quando falta um irmão a sobrescreve
        pelas costas.
      </DocNote>

      <DocNote title="O item que troca de forma alinha pela forma dele">
        A largura da calha é da <strong>lista</strong> — é ela que faz a faixa
        de data alinhar com os eventos. Já o deslocamento usa a medida do
        marcador <strong>renderizado</strong>: sem isso, um ponto de 10px numa
        trilha de poço lia os 32 da calha e saía 6,38px acima do centro. Cada
        forma republica a própria medida, então a calha continua uniforme e o
        alinhamento acompanha a exceção.
      </DocNote>

      <DocNote title="Passe dateTime">
        Um <code>&lt;time&gt;</code> sem <code>dateTime</code> não é data para
        máquina nenhuma. Esta página demonstrava <code>&ldquo;05/04 ·
        09:12&rdquo;</code> como texto puro; hoje toda demonstração escreve o
        atributo.
      </DocNote>

      <DocNote title="O vidro é da trilha, e não do evento">
        Numa <code>Timeline</code> o estilo é um só. Como <code>marker</code> é
        sobrescrevível por item, um eixo por evento deixaria escrever a lista
        inconsistente — um poço de vidro ao lado de um avatar chapado. Por isso
        o clone da raiz <strong>sobrescreve</strong> o <code>glass</code> do
        item em vez de preenchê-lo: a uniformidade é mecânica, não uma regra que
        alguém precisa lembrar.
      </DocNote>

      <DocNote title="O corpo não muda; o que entra é aresta">
        Com um tom <strong>opaco</strong> a lâmina e as duas nuvens ficam por
        baixo dele e não pintam nada. O que o vidro acrescenta ao ponto e ao
        poço é o <strong>aro cônico</strong> e o especular — o corpo continua
        sendo exatamente <code>--{"{tom}"}-muted</code>, e o contraste da tinta
        não se move. O <strong>avatar é a exceção</strong>: ele não declara tom,
        porque a cor daquele marcador é a identidade da pessoa e mora dentro do
        avatar. Sem tom a lâmina volta a pintar, e é isso que dá corpo de vidro
        ao bisel.
      </DocNote>

      <PropsTable
        title="Timeline"
        rows={[
          {
            prop: "marker",
            type: '"dot" | "icon" | "avatar" | "none"',
            default: '"dot"',
            description:
              "A forma do marcador e a largura da calha. É da lista porque uma trilha tem uma calha só; o item pode sobrescrever para a exceção.",
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
              "Veste a lâmina de vidro do sistema em todo marcador da trilha. Sobrescreve o item — o acabamento é da lista. Não aparece no ds:catalog porque o eixo mora no cva do marcador, a mesma lacuna do glass do Tabs.",
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
              'Um <Avatar> de quem chama — vem como nó para não acoplar a camada. Só aparece com marker="avatar".',
          },
          {
            prop: "isLast",
            type: "boolean",
            default: "derivado",
            description:
              "Preenchido pela Timeline a partir do índice. Passe à mão só na lista que continua depois do último item renderizado.",
          },
        ]}
      />
    </>
  )
}
