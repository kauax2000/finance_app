"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  PresenceCursor,
  type PresenceCursorFrom,
  type PresenceCursorTone,
} from "@/components/ui/presence-cursor"
import { Progress } from "@/components/ui/progress"
import { Caption } from "@/components/ui/typography"
import {
  Controles,
  DocNote,
  DocSection,
  Eixo,
  Interruptor,
  Interruptores,
  PropsTable,
  Usage,
} from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

const TONS = ["1", "2", "3", "4", "5", "6"] as const
const ENTRADAS = ["end", "bottom", "top", "start"] as const satisfies readonly PresenceCursorFrom[]
const ALVOS = ["fatura", "orçamento", "convidar"] as const

/** Uma pessoa por família, como o app as encontraria numa carteira dividida. */
const NOMES: Record<PresenceCursorTone, string> = { 1: "Rafael", 2: "Bia", 3: "Você", 4: "Ana", 5: "Caio", 6: "Lia" }

type Alvo = (typeof ALVOS)[number]
type Ponto = { x: number; y: number }

/**
 * Mede cada alvo em relação ao palco (o pai posicionado) e devolve o ponto onde a seta pousa: 60% para dentro
 * do alvo, como um clique de verdade. Remede quando o palco muda de tamanho.
 */
function usePontos(palco: React.RefObject<HTMLDivElement | null>, alvos: React.RefObject<Record<Alvo, HTMLElement | null>>) {
  const [pontos, setPontos] = React.useState<Record<Alvo, Ponto> | null>(null)
  React.useLayoutEffect(() => {
    const el = palco.current
    if (!el) return
    const medir = () => {
      const base = el.getBoundingClientRect()
      const novo = {} as Record<Alvo, Ponto>
      for (const a of ALVOS) {
        const r = alvos.current[a]?.getBoundingClientRect()
        novo[a] = r ? { x: Math.round(r.left - base.left + r.width * 0.6), y: Math.round(r.top - base.top + r.height * 0.6) } : { x: 0, y: 0 }
      }
      setPontos(novo)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [palco, alvos])
  return pontos
}

function DemoNaTela() {
  const [tom, setTom] = React.useState<(typeof TONS)[number]>("3")
  const [from, setFrom] = React.useState<PresenceCursorFrom>("end")
  const [alvo, setAlvo] = React.useState<Alvo>("fatura")
  const [pressed, setPressed] = React.useState(false)
  const palco = React.useRef<HTMLDivElement>(null)
  const alvos = React.useRef<Record<Alvo, HTMLElement | null>>({ fatura: null, orçamento: null, convidar: null })
  const pontos = usePontos(palco, alvos)
  const tone = Number(tom) as PresenceCursorTone

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        inicio={<Eixo rotulo="tone" valores={TONS} valor={tom} onChange={setTom} />}
        fim={
          <>
            <Eixo rotulo="entra de" valores={ENTRADAS} valor={from} onChange={setFrom} />
            <Eixo rotulo="alvo" valores={ALVOS} valor={alvo} onChange={setAlvo} />
            <Interruptores>
              <Interruptor id="pc-pressed" rotulo="pressed" valor={pressed} onChange={setPressed} />
            </Interruptores>
          </>
        }
      />
      <div ref={palco} className="relative h-80 w-full overflow-clip rounded-surface bg-muted">
        <Card
          ref={(el) => {
            alvos.current.fatura = el
          }}
          padding="sm"
          className="absolute start-6 top-6 w-56"
        >
          <CardContent>
            <p className="text-xs text-muted-foreground">Fatura de outubro</p>
            <MoneyDisplay value={1284.6} size="lg" />
          </CardContent>
        </Card>
        <Card
          ref={(el) => {
            alvos.current.orçamento = el
          }}
          padding="sm"
          className="absolute end-6 top-1/3 w-60"
        >
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm font-medium">Orçamento · Casa</p>
            <Progress value={62} size="sm" aria-label="Orçamento da casa usado" />
          </CardContent>
        </Card>
        <Button
          ref={(el) => {
            alvos.current.convidar = el
          }}
          variant="secondary"
          className="absolute start-1/3 bottom-8"
          tabIndex={-1}
        >
          convidar para a carteira
        </Button>
        {pontos ? (
          <PresenceCursor key={`${tom}-${from}`} name={NOMES[tone]} tone={tone} at={pontos[alvo]} from={from} pressed={pressed} />
        ) : null}
      </div>
      <Caption>Trocar a família ou a entrada remonta o cursor e ele entra de novo; trocar o alvo anda na mola.</Caption>
    </div>
  )
}

function SobreOCampo() {
  return (
    <div className="brand-field grid h-72 w-full grid-cols-3 grid-rows-2 rounded-modal">
      {([1, 2, 3, 4, 5, 6] as const).map((tone) => (
        <div key={tone} className="relative">
          <PresenceCursor name={NOMES[tone]} tone={tone} at={{ x: 32, y: 40 }} />
        </div>
      ))}
    </div>
  )
}

function NoTelefone() {
  return (
    <IphoneFrame title="O cursor num iPhone">
      <div className="relative flex h-full flex-col justify-center gap-4 overflow-clip px-4">
        <Card padding="sm">
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm font-medium">Orçamento · Casa</p>
            <Progress value={62} size="sm" aria-label="Orçamento da casa usado" />
          </CardContent>
        </Card>
        <PresenceCursor name="Ana" tone={4} at={{ x: 220, y: 380 }} from="bottom" />
      </div>
    </IphoneFrame>
  )
}

export default function PresenceCursorDoc() {
  return (
    <>
      <Usage>
        O ponteiro de outra pessoa: uma seta desenhada com o nome numa pílula, na cor de identidade dela, pousado num ponto de uma tela desenhada. Use-o para contar que alguém está na mesma tela — a carteira dividida, o clique de uma demonstração. É decorativo (<code>aria-hidden</code>, sem ponteiro) e não é presença em tempo real: quem decide onde ele pousa é quem o monta. Nenhuma tela do app o usa ainda: o <code>Showcase</code> do painel das telas de acesso vai posicioná-lo pelas âncoras.
      </Usage>

      <DocSection
        title="Na tela"
        description="A família pinta a seta e a pílula; o cursor entra da borda escolhida, anda até o alvo na mola e, com pressed, encolhe e volta — o clique."
        code={`<PresenceCursor
  name="Você"
  tone={3}
  at={{ x: 412, y: 96 }}
  from="end"
  pressed={clicando}
/>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A cor é da pessoa; o par é do sistema">
        <code>tone</code> veste a <code>@utility identity-N</code> (a mesma família do <code>Avatar</code>), e a pílula pinta <code>--identity-surface</code> com a tinta <code>--identity-foreground</code> — o par viva que o <code>scripts/identity-contrast.mjs</code> mede. A seta usa a mesma superfície, contornada na tinta, para não sumir sobre uma superfície da mesma claridade. Nenhuma cor entra crua.
      </DocNote>

      <DocNote title="A seta é desenhada">
        Uma exceção nomeada em <code>DRAWN_SVG_FILES</code> do auditor, como o logo e a roda do <code>Spinner</code>: a ponta da seta é a posição, e o <code>CursorArrowRaysIcon</code> desenha um clique, não um ponteiro. A ponta pousa exatamente em <code>at</code>.
      </DocNote>

      <DocNote title="Movimento">
        Mudar <code>at</code> anda pela projeção de layout do <code>motion</code> (<code>layout=&quot;position&quot;</code>) na <code>MOLA</code>; <code>from</code> faz a entrada ao montar, da borda do pai posicionado até o ponto, na mesma mola; <code>pressed</code> encolhe a 85% e volta na mola. Sem laço: ele chega e para. Com <code>prefers-reduced-motion</code>, aparece já pousado e troca de ponto na hora, sem deslocamento; o clique encolhe e volta sem mola.
      </DocNote>

      <DocSection
        title="Sobre o campo de marca"
        description="A exceção D2: a pílula pode pousar sobre o brand-field porque é uma superfície opaca com tinta medida — o nome não depende do arco-íris embaixo. As seis famílias, espalhadas pelo campo."
        code={`<aside className="brand-field relative …">
  <PresenceCursor name="Ana" tone={4} at={ancora} />
</aside>`}
        previewClassName="items-stretch"
      >
        <SobreOCampo />
      </DocSection>

      <DocNote title="Contraste medido">
        O nome sobre a pílula, nos dois temas (o par é um valor só), medido por <code>scripts/identity-contrast.mjs</code> nas seis pílulas desta página: de <strong>7,44:1</strong> (iris) a <strong>8,95:1</strong> (grove), o mesmo par do <code>Avatar</code> vivo, com piso 4,5. Posta sobre o ponto mais claro e o mais escuro do <code>brand-field</code>, em cada tema, a razão do texto não muda (ember 7,65, ocean 8,33): a pílula é opaca. A borda dela contra o campo não é texto — vai de 1,0:1 no ponto claro a 4,2:1 no escuro —, e quem a separa ali é a sombra.
      </DocNote>

      <DocSection
        title="No telefone"
        description="No app o palco não chega ao telefone (o campo vira só o wordmark), e o cursor não tem alvo de toque — não é controle. Dentro de uma moldura estreita ele entra e pousa igual."
      >
        <NoTelefone />
      </DocSection>

      <DocNote title="Sem esqueleto, de propósito">
        O cursor não carrega dado: é a presença de alguém sobre uma tela que já está desenhada. Enquanto a tela espera, quem monta simplesmente não o monta — o esqueleto é o da tela.
      </DocNote>

      <PropsTable
        title="Props de PresenceCursor"
        rows={[
          { prop: "name", type: "string", description: "O nome na pílula (“Você”, “Ana”)." },
          { prop: "tone", type: "1 | 2 | 3 | 4 | 5 | 6", description: "A família de identidade: ember, gold, grove, ocean, iris, bloom. Pinta a seta e a pílula com o par do sistema." },
          { prop: "at", type: "{ x: number; y: number }", description: "A ponta da seta, em px a partir do canto superior esquerdo do pai posicionado. Mudar anda na mola." },
          { prop: "from", type: '"end" | "bottom" | "top" | "start"', description: "A borda do pai de onde o cursor entra ao montar. Sem ela, aparece já pousado." },
          { prop: "pressed", type: "boolean", default: "false", description: "O clique: encolhe a 85% enquanto verdadeiro e volta na mola." },
          { prop: "className", type: "string", description: "Camada e ordem de quem monta (z-index); nunca cor." },
        ]}
      />
    </>
  )
}
