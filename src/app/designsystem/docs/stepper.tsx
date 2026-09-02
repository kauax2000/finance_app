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
        Um fluxo com começo e fim conhecidos. Ele responde &ldquo;quanto
        falta&rdquo;, que é a pergunta que faz alguém desistir no meio. Se o
        número de etapas varia, ele mente.
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
        description="A forma que serve o telefone sem esconder nada. Na horizontal o rótulo some abaixo de sm porque quatro palavras lado a lado não cabem em 360px — aqui ele fica."
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
        <code>StepperItem</code> recebia <code>step</code> e{" "}
        <code>isLast</code> como props, com <code>Omit&lt;…, &quot;children&quot;&gt;</code>.
        Os dois são exatamente o que o <strong>pai</strong> sabe e o filho não —
        o índice e o fim da lista —, e quem chamava tinha de escrever{" "}
        <code>isLast=&#123;i === ETAPAS.length - 1&#125;</code> toda vez. Errar
        isso desenhava um conector para lugar nenhum. É a mesma correção que a{" "}
        <code>BreadcrumbList</code> recebeu ao assumir os separadores.
      </DocNote>

      <DocNote title="A trilha alcança a borda">
        Todos os itens eram <code>flex-1</code>, inclusive o último — que não
        desenha conector. Medido: quatro itens de 218px, com o último ocupando os
        mesmos 218 para mostrar um marcador de 24. Sobravam{" "}
        <strong>~192px de vão morto</strong>, e a trilha parava a{" "}
        <strong>78%</strong> da largura. Hoje o último é <code>flex-none</code>{" "}
        e os conectores absorvem a sobra.
      </DocNote>

      <DocNote title="O rótulo é centrado no marcador">
        Ele era <code>block</code> e ocupava a <strong>célula inteira</strong> —
        278px medidos — com o texto rente à esquerda: flush com a borda do
        marcador, mas com o centro da caixa a <strong>127px</strong> do centro
        dele. Hoje é <code>w-max</code> deslocado por meia largura do marcador,
        que é variável para não virar um número repetido em dois lugares.
        <br />
        <br />
        <strong>A primeira etapa é a exceção</strong>, e é geometria: o marcador
        dela encosta na borda esquerda da trilha, então centrar a palavra a faria
        sair para fora. A última não precisa da exceção — ali a trilha deixa
        folga.
      </DocNote>

      <DocNote title="Na vertical, o mesmo defeito nos dois eixos">
        O rótulo fica ao lado do marcador com <code>items-start</code>, e o
        marcador (24) é mais alto que a caixa de uma linha de texto (20): os
        topos coincidiam e os <strong>centros ficavam a 2px</strong> um do outro
        — igual nos quatro degraus, que é a assinatura de um desalinhamento
        sistemático. E o conector recuava por meia largura escrita à mão por
        degrau, sem descontar a espessura do próprio fio, então o traço de 1px
        caía <strong>1px à direita</strong> do centro do marcador. Hoje os dois
        derivam de <code>--stepper-marker</code>: medido, 0 e 0.
      </DocNote>

      <DocNote title="O estado deixou de existir só em cor">
        <code>data-state</code> não é lido por tecnologia assistiva, e o tique é{" "}
        <code>aria-hidden</code>: uma etapa concluída e uma futura soavam
        idênticas. Cada item passa a carregar &ldquo;concluída&rdquo;,
        &ldquo;etapa atual&rdquo; ou &ldquo;não iniciada&rdquo; em{" "}
        <code>sr-only</code>, ao lado do <code>aria-current=&quot;step&quot;</code>.
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
