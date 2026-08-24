"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Stepper, StepperItem } from "@/components/ui/stepper"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const ETAPAS = ["Conta", "Carteiras", "Categorias", "Pronto"]

export default function StepperDoc() {
  return (
    <>
      <Usage>
        Um fluxo com começo e fim conhecidos: onboarding, importação de extrato.
        Ele responde &ldquo;quanto falta&rdquo;, que é a pergunta que faz alguém
        desistir no meio. Se o número de etapas varia, ele mente — e aí não use.
      </Usage>

      <DocSection
        title="Interativo"
        code={`<Stepper>
  {ETAPAS.map((label, i) => (
    <StepperItem
      key={label}
      step={i + 1}
      label={label}
      state={i < atual ? "complete" : i === atual ? "current" : "upcoming"}
      isLast={i === ETAPAS.length - 1}
    />
  ))}
</Stepper>`}
        previewClassName="items-stretch"
      >
        <StepperDemo />
      </DocSection>

      <DocNote title="No telefone o rótulo some">
        Quatro palavras lado a lado não cabem em 360px sem encolher a ponto de
        não se ler. Abaixo de <code>sm</code>{" "}
        ficam só os marcadores, e a etapa
        atual continua nomeada no título acima do componente — o que o leitor de
        tela sempre teve, via <code>aria-current=&quot;step&quot;</code>.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "step", type: "number", description: "O número exibido enquanto a etapa não foi concluída." },
          { prop: "state", type: '"complete" | "current" | "upcoming"', default: '"upcoming"', description: "current recebe aria-current=\"step\"." },
          { prop: "label", type: "string", description: "O nome da etapa. Some abaixo de sm." },
          { prop: "isLast", type: "boolean", default: "false", description: "Remove o conector à direita." },
        ]}
      />
    </>
  )
}

function StepperDemo() {
  const [atual, setAtual] = React.useState(1)

  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper>
        {ETAPAS.map((label, i) => (
          <StepperItem
            key={label}
            step={i + 1}
            label={label}
            state={i < atual ? "complete" : i === atual ? "current" : "upcoming"}
            isLast={i === ETAPAS.length - 1}
          />
        ))}
      </Stepper>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAtual((v) => Math.max(0, v - 1))}
          disabled={atual === 0}
        >
          Voltar
        </Button>
        <Button
          size="sm"
          onClick={() => setAtual((v) => Math.min(ETAPAS.length - 1, v + 1))}
          disabled={atual === ETAPAS.length - 1}
        >
          Avançar
        </Button>
      </div>
    </div>
  )
}
