"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Stepper, StepperItem } from "@/components/ui/stepper"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const ETAPAS = ["Conta", "Carteiras", "Categorias", "Pronto"]

const estadoDe = (i: number, atual: number) =>
  i < atual ? "complete" : i === atual ? "current" : "upcoming"

export default function StepperDoc() {
  return (
    <>
      <Usage>
        Um fluxo com começo e fim conhecidos: ele responde &ldquo;quanto falta&rdquo;. Se o número de etapas varia, ele mente. Histórico de eventos é <code>Timeline</code>.
      </Usage>

      <DocSection
        title="Interativo"
        description="A lista preenche o número e o fim: quem chama passa só o estado e o rótulo."
        code={`<Stepper>
  {ETAPAS.map((label, i) => (
    <StepperItem key={label} state={estadoDe(i, atual)}>
      {label}
    </StepperItem>
  ))}
</Stepper>`}
        previewClassName="items-stretch"
      >
        <StepperDemo />
      </DocSection>

      <DocSection
        title="Vertical"
        description="A forma do telefone, sem esconder nada: na horizontal o rótulo some abaixo de sm, e aqui ele fica."
        code={`<Stepper orientation="vertical">…</Stepper>`}
        previewClassName="items-start"
      >
        <div className="w-full max-w-xs">
          <Stepper orientation="vertical">
            {ETAPAS.map((label, i) => (
              <StepperItem key={label} state={estadoDe(i, 1)}>
                {label}
              </StepperItem>
            ))}
          </Stepper>
        </div>
      </DocSection>

      <DocSection
        title="Etapa que volta"
        description="Uma etapa concluída costuma ser navegável. asChild torna a linha o próprio botão, com o par de toque e o anel de foco."
        code={`<StepperItem state="complete" asChild>
  <button type="button" onClick={() => irPara(0)}>Conta</button>
</StepperItem>`}
        previewClassName="items-stretch"
      >
        <VoltarDemo />
      </DocSection>

      <DocSection
        title="Escada"
        description="sm encolhe o marcador de 24 para 20 — para o passo que acompanha um formulário em vez de encabeçá-lo."
        code={`<Stepper size="sm">…</Stepper>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        {(["sm", "md"] as const).map((s) => (
          <Stepper key={s} size={s}>
            {ETAPAS.map((label, i) => (
              <StepperItem key={label} state={estadoDe(i, 2)}>
                {label}
              </StepperItem>
            ))}
          </Stepper>
        ))}
      </DocSection>

      <DocNote title="A lista assume o número e o fim">
        A <code>Stepper</code> deriva <code>step</code> e <code>isLast</code> do índice; quem chama passa só o estado e o rótulo. Escrever <code>isLast</code> à mão é o que desenha um conector para lugar nenhum.
      </DocNote>

      <DocNote title="A trilha alcança a borda">
        O último item é <code>flex-none</code> e não desenha conector, então os conectores absorvem a sobra. Com todos <code>flex-1</code>, a trilha pararia antes da borda.
      </DocNote>

      <DocNote title="O rótulo é centrado no marcador">
        Ele é <code>w-max</code>, deslocado por meia largura do marcador (<code>--stepper-marker</code>). A primeira etapa é a exceção: o marcador dela encosta na borda, e centrar a palavra a faria sair da trilha.
      </DocNote>

      <DocNote title="Na vertical, rótulo e conector derivam do marcador">
        O rótulo tem a altura mínima do marcador com <code>items-center</code>, e o conector recua <code>(--stepper-marker − 1px) / 2</code>. Com meia largura escrita à mão, o fio de 1px sai do centro.
      </DocNote>

      <DocNote title="O estado não existe só em cor">
        <code>data-state</code> não é lido por tecnologia assistiva e o tique é <code>aria-hidden</code>. Cada item carrega &ldquo;concluída&rdquo;, &ldquo;etapa atual&rdquo; ou &ldquo;não iniciada&rdquo; em <code>sr-only</code>, junto do <code>aria-current=&quot;step&quot;</code>.
      </DocNote>

      <PropsTable
        title="Props de Stepper"
        rows={[
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description:
              "vertical é a forma do telefone: mostra o nome de cada etapa em vez de escondê-lo.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "O marcador: 20 ou 24.",
          },
        ]}
      />

      <PropsTable
        title="Props de StepperItem"
        rows={[
          {
            prop: "state",
            type: '"complete" | "current" | "upcoming"',
            default: '"upcoming"',
            description:
              'current recebe aria-current="step"; os três vão para sr-only.',
          },
          {
            prop: "children / label",
            type: "React.ReactNode / string",
            description: "O nome da etapa. label é o atalho para texto puro.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "A linha vira o botão ou o link que volta à etapa.",
          },
          {
            prop: "step / isLast",
            type: "number / boolean",
            default: "da lista",
            description:
              "Preenchidos pela Stepper a partir do índice. Só passe à mão numa lista que não começa em 1.",
          },
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
          <StepperItem key={label} state={estadoDe(i, atual)}>
            {label}
          </StepperItem>
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

function VoltarDemo() {
  const [atual, setAtual] = React.useState(2)

  return (
    <Stepper>
      {ETAPAS.map((label, i) => {
        const state = estadoDe(i, atual)
        if (state !== "complete") {
          return (
            <StepperItem key={label} state={state}>
              {label}
            </StepperItem>
          )
        }
        return (
          <StepperItem key={label} state={state} asChild>
            <button type="button" onClick={() => setAtual(i)}>
              {label}
            </button>
          </StepperItem>
        )
      })}
    </Stepper>
  )
}
