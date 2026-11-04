"use client"

import * as React from "react"

import { AppLogo } from "@/components/layout/app-logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Seal, SealSkeleton, type SealTone } from "@/components/ui/seal"
import { Muted } from "@/components/ui/typography"
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

const TONS = ["silver", "gold"] as const satisfies readonly SealTone[]

/** A linha de identidade de Minha conta, com o selo entre o texto e o botão. */
function Identidade({ tone, icone }: { tone: SealTone; icone: boolean }) {
  return (
    <div className="flex w-full items-center gap-3">
      <Avatar size="lg" className="shrink-0">
        <AvatarFallback tint="vivid" className="identity-5 font-semibold">
          AL
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium">Ana Lima</p>
        <Muted className="truncate">ana.lima@gmail.com</Muted>
      </div>
      <Seal
        tone={tone}
        label="Membro desde março de 2026"
        ring="MEMBRO DESDE · MAR 2026 · FINANCE APP · "
        icon={icone ? <AppLogo /> : undefined}
      />
      <Button type="button" variant="secondary" className="shrink-0">
        editar perfil
      </Button>
    </div>
  )
}

function DemoNaTela() {
  const [tone, setTone] = React.useState<SealTone>("silver")
  const [icone, setIcone] = React.useState(true)
  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        inicio={<Eixo rotulo="tone" valores={TONS} valor={tone} onChange={setTone} rotulos={{ silver: "prata", gold: "ouro" }} />}
        fim={
          <Interruptores>
            <Interruptor id="seal-icon" rotulo="ícone no miolo" valor={icone} onChange={setIcone} />
          </Interruptores>
        }
      />
      <div className="w-full rounded-surface bg-card p-4 ring-1 ring-border">
        <Identidade tone={tone} icone={icone} />
      </div>
    </div>
  )
}

export default function SealDoc() {
  return (
    <>
      <Usage>
        Um selo de metal estampado, como o adesivo holográfico de &quot;original&quot; de um produto: um marco da pessoa no app que vale mais como objeto do que como texto. Pequeno (40px) na linha onde o marco caberia como frase, ele abre grande num véu ao toque, com a frase como legenda. Use-o para um marco de verdade, um por tela; nunca como enfeite de lista nem no lugar de um <code>Badge</code> de estado. No app, Minha conta o usa no lugar de &quot;Membro desde&quot;.
      </Usage>

      <DocSection
        title="Na tela"
        description="Passe o cursor: o selo inclina e o reflexo segue o ponteiro; sem cursor ele balança devagar. Clique para abrir grande, e clique no grande para girar."
        code={`<Seal
  label="Membro desde março de 2026"
  ring="MEMBRO DESDE · MAR 2026 · FINANCE APP · "
  icon={<AppLogo />}
/>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O metal é físico, não tema">
        As paradas da prata e do ouro moram nas <code>@utility seal-silver</code> e <code>seal-gold</code>, e valem nos dois temas: um selo de prata é prata no claro e no escuro. O metal é um cônico que gira com a inclinação (o reflexo de uma moeda), com o fio concêntrico do estampado por cima; a tinta impressa (<code>--seal-ink</code>) desenha o anel, os fios, o texto e o ícone, por <code>currentColor</code>.
      </DocNote>

      <DocNote title="A exceção ao arco-íris">
        O holográfico é arco-íris sob texto, e a regra o proíbe. A exceção é nomeada (rodada 361): o reflexo é o do papel metalizado, com as paradas da marca, o volume em <code>--seal-holo-opacity</code> (0,5) e só num círculo em volta do ponteiro. O texto do anel é textura: o que se lê é o nome acessível e a legenda do selo aberto, sobre o <code>--scrim</code>, fora do metal. O selo conta como a peça de marca da tela.
      </DocNote>

      <DocNote title="Movimento">
        Até 18° de inclinação com o cursor, escrita em variáveis no próprio nó, sem render por evento. Parado, o balanço <code>seal-sway</code> (±10°, 7s). Aberto, ele brota na mola e inclina com o cursor ou, no telefone, com o giroscópio (o iOS pede permissão no toque que abre o selo; ±30° do aparelho viram a inclinação inteira, a partir de onde ele estava). Cada toque no grande dá uma volta inteira em 1,1s, saindo rápido e assentando devagar. Com movimento reduzido não há balanço nem volta; a inclinação continua, porque segue a mão da pessoa.
      </DocNote>

      <DocSection
        title="No telefone"
        description="O mesmo selo de 40px, com o alvo de toque ampliado a 48 pelo ::after. O toque abre o selo grande, que inclina com o aparelho."
      >
        <IphoneFrame title="O selo num iPhone">
          <div className="flex h-full flex-col justify-center px-4">
            <Identidade tone="silver" icone />
          </div>
        </IphoneFrame>
      </DocSection>

      <DocSection title="Esqueleto" description="O círculo de 40, no pulso, enquanto o marco não chegou.">
        <div className="flex items-center gap-3">
          <SealSkeleton />
          <Muted>Carregando o perfil…</Muted>
        </div>
      </DocSection>

      <PropsTable
        title="Props de Seal"
        rows={[
          { prop: "label", type: "string", description: "O nome do selo: o leitor de tela o lê no botão, e o selo aberto o escreve como legenda." },
          { prop: "ring", type: "string", description: "O texto gravado no anel. Ocupa uma volta inteira (textLength); termine com o separador para a emenda não colar." },
          { prop: "icon", type: "ReactNode", description: "O desenho do miolo, pintado na tinta do selo por currentColor e ocupando o terço do meio." },
          { prop: "tone", type: '"silver" | "gold"', default: '"silver"', description: "O metal." },
          { prop: "description", type: "string", description: "A segunda linha da legenda do selo aberto. Sem ela, a dica de girar e fechar." },
          { prop: "className", type: "string", description: "Posição de quem monta; nunca cor nem tamanho." },
        ]}
      />
      <PropsTable
        title="Props de SealSkeleton"
        rows={[{ prop: "className", type: "string", description: "Posição de quem monta." }]}
      />
    </>
  )
}
