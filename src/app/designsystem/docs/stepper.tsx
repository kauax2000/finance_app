"use client"

import * as React from "react"
import {
  RectangleStackIcon,
  TagIcon,
  UserIcon,
  WalletIcon,
} from "@heroicons/react/16/solid"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Stepper,
  StepperActions,
  StepperContent,
  StepperItem,
  StepperNext,
  StepperPrevious,
} from "@/components/ui/stepper"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const ETAPAS = [
  { nome: "Conta", descricao: "Nome e e-mail", icone: UserIcon },
  { nome: "Carteiras", descricao: "Onde está o dinheiro", icone: WalletIcon },
  { nome: "Categorias", descricao: "Para onde ele vai", icone: TagIcon },
  { nome: "Pronto", descricao: "Revise e comece", icone: RectangleStackIcon },
]

const ORIENTACOES = ["horizontal", "vertical", "responsive"] as const
const FORMAS = ["default", "bar"] as const
const TAMANHOS = ["md", "sm"] as const


function DemoNaTela() {
  const [orientation, setOrientation] = React.useState<(typeof ORIENTACOES)[number]>("horizontal")
  const [variant, setVariant] = React.useState<(typeof FORMAS)[number]>("default")
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("md")
  const [icones, setIcones] = React.useState<"número" | "ícone">("número")
  const [passo, setPasso] = React.useState(1)

  return (
    <div className="flex w-full flex-col gap-4">
      <Controles
        inicio={
          <>
            <Eixo rotulo="orientation" valores={ORIENTACOES} valor={orientation} onChange={setOrientation} />
            <Eixo rotulo="variant" valores={FORMAS} valor={variant} onChange={setVariant} />
            <Eixo rotulo="size" valores={TAMANHOS} valor={size} onChange={setSize} />
          </>
        }
        fim={<Eixo rotulo="marcador" valores={["número", "ícone"] as const} valor={icones} onChange={setIcones} />}
      />
      <div className={orientation === "vertical" ? "w-full max-w-xs" : "w-full"}>
        <Stepper
          value={passo}
          onValueChange={setPasso}
          orientation={orientation}
          variant={variant}
          size={size}
        >
          {ETAPAS.map((e) => (
            <StepperItem
              key={e.nome}
              description={e.descricao}
              icon={icones === "ícone" ? <e.icone /> : undefined}
            >
              {e.nome}
            </StepperItem>
          ))}
          <StepperActions>
            <StepperPrevious />
            <StepperNext />
          </StepperActions>
        </Stepper>
      </div>
    </div>
  )
}

function DemoFluxo() {
  const [passo, setPasso] = React.useState(0)
  return (
    <Stepper value={passo} onValueChange={setPasso} orientation="responsive" className="w-full">
      <StepperItem>Conta</StepperItem>
      <StepperItem optional>Carteiras</StepperItem>
      <StepperItem>Pronto</StepperItem>
      <StepperContent value={0}>
        <Field>
          <FieldLabel htmlFor="ds-stepper-nome">Seu nome</FieldLabel>
          <Input id="ds-stepper-nome" placeholder="Ana Ribeiro" />
        </Field>
      </StepperContent>
      <StepperContent value={1}>
        <Field>
          <FieldLabel htmlFor="ds-stepper-carteira">Primeira carteira</FieldLabel>
          <Input id="ds-stepper-carteira" placeholder="Conta corrente" />
        </Field>
      </StepperContent>
      <StepperContent value={2}>
        <p className="text-sm text-muted-foreground">Tudo pronto. Conclua para começar.</p>
      </StepperContent>
      <StepperActions>
        <StepperPrevious />
        {/* Salvar o passo leva um instante: o botão mostra a roda e trava. */}
        <StepperNext onNext={() => new Promise((r) => window.setTimeout(r, 900))} />
      </StepperActions>
    </Stepper>
  )
}

export default function StepperDoc() {
  return (
    <>
      <Usage>
        Um fluxo com começo e fim conhecidos: ele responde &ldquo;quanto falta&rdquo;. Se o número de etapas varia, ele mente. Histórico de eventos é <code>Timeline</code>; a barra de passos dentro de um diálogo é o <code>DialogSteps</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="Com value e onValueChange a lista é o estado do fluxo: cada etapa deriva o próprio estado do índice, a trilha enche na mola ao concluir, e as concluídas voltam ao clique. Troque a orientação, a forma, o degrau e o marcador."
        code={`<Stepper value={passo} onValueChange={setPasso}>
  <StepperItem description="Nome e e-mail" icon={<UserIcon />}>Conta</StepperItem>
  …
  <StepperActions>
    <StepperPrevious />
    <StepperNext />
  </StepperActions>
</Stepper>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A trilha enche, o tique estala, a atual tem um anel">
        O conector é o trilho cinza com a trilha por cima, que enche da esquerda (ou de cima) na mola quando a etapa conclui e esvazia ao voltar. O tique entra crescendo, e a etapa atual ganha um anel suave em volta do marcador. Com <code>prefers-reduced-motion</code> o bloco global corta as transições, e tudo troca no lugar.
      </DocNote>

      <DocNote title="responsive é a forma do telefone">
        A fila horizontal some abaixo de <code>sm</code> e no lugar dela entra a contagem — &ldquo;Passo 2 de 4 · Carteiras&rdquo; — com a barra fina. Os números soltos, sem o nome, não diziam nada; a lista continua na árvore para o leitor de tela.
      </DocNote>

      <DocSection
        title="O fluxo inteiro"
        description="StepperContent é o painel de cada etapa: só o atual monta, e ele desliza do lado para onde o fluxo andou. StepperNext espera a Promise do onNext com a roda, e vira Concluir na última. optional escreve “Opcional” ao lado do nome."
        code={`<Stepper value={passo} onValueChange={setPasso} orientation="responsive">
  <StepperItem>Conta</StepperItem>
  <StepperItem optional>Carteiras</StepperItem>
  <StepperItem>Pronto</StepperItem>
  <StepperContent value={0}>…</StepperContent>
  …
  <StepperActions>
    <StepperPrevious />
    <StepperNext onNext={salvarPasso} />
  </StepperActions>
</Stepper>`}
        previewClassName="items-stretch"
      >
        <DemoFluxo />
      </DocSection>

      <DocSection
        title="Erro e etapa fixa"
        description="state vence o que a lista deriva: é como uma etapa fica error. Sem value, os estados continuam escritos à mão, como antes."
        code={`<StepperItem state="error" description="O cartão foi recusado">Pagamento</StepperItem>`}
        previewClassName="items-stretch"
      >
        <Stepper className="w-full">
          <StepperItem state="complete">Conta</StepperItem>
          <StepperItem state="complete">Plano</StepperItem>
          <StepperItem state="error" description="O cartão foi recusado">
            Pagamento
          </StepperItem>
          <StepperItem state="upcoming">Pronto</StepperItem>
        </Stepper>
      </DocSection>

      <DocNote title="Voltar clicando, e as setas">
        Com <code>onValueChange</code>, as etapas concluídas viram botão sozinhas; com <code>linear={"{false}"}</code>, as futuras também. Entre elas, ← e → (↑ e ↓ na vertical) movem o foco, como numa lista de abas, e Home e End vão às pontas. Uma região viva anuncia &ldquo;Passo 3 de 4, Categorias&rdquo; a cada troca.
      </DocNote>

      <DocNote title="O estado não existe só em cor">
        Cada item carrega &ldquo;concluída&rdquo;, &ldquo;etapa atual&rdquo;, &ldquo;não iniciada&rdquo; ou &ldquo;com erro&rdquo; em <code>sr-only</code>, depois do nome, junto do <code>aria-current=&quot;step&quot;</code>.
      </DocNote>

      <DocNote title="A lista assume o número e o fim">
        A <code>Stepper</code> deriva <code>step</code> e <code>isLast</code> do índice; o último item não estica, e os conectores absorvem a sobra. O rótulo é centrado no marcador, menos o da primeira etapa, que encosta na borda.
      </DocNote>

      <PropsTable
        title="Props de Stepper"
        rows={[
          {
            prop: "value / defaultValue / onValueChange",
            type: "number / number / (value) => void",
            description: "O passo atual, a partir de 0. Com ele os itens derivam o estado, e as concluídas voltam ao clique.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical" | "responsive"',
            default: '"horizontal"',
            description: "responsive é a fila a partir de sm e a contagem compacta no telefone.",
          },
          {
            prop: "variant",
            type: '"default" | "bar"',
            default: '"default"',
            description: "bar: segmentos que acendem, com “Passo N de M · Nome” em cima.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "O marcador: 20 ou 24.",
          },
          {
            prop: "linear",
            type: "boolean",
            default: "true",
            description: "false: as etapas futuras também clicam.",
          },
        ]}
      />

      <PropsTable
        title="Props de StepperItem"
        rows={[
          {
            prop: "state",
            type: '"complete" | "current" | "upcoming" | "error"',
            description: "Vence o que a lista deriva de value.",
          },
          {
            prop: "children / label",
            type: "React.ReactNode / string",
            description: "O nome da etapa.",
          },
          {
            prop: "description / optional",
            type: "React.ReactNode / boolean",
            description: "A segunda linha; “Opcional” ao lado do nome.",
          },
          {
            prop: "icon",
            type: "React.ReactNode",
            description: "Um ícone 16/solid no lugar do número, até a etapa concluir.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "A linha vira o seu botão ou link — para quem navega sem onValueChange.",
          },
        ]}
      />

      <PropsTable
        title="Peças do fluxo"
        rows={[
          {
            prop: "StepperContent",
            type: "{ value: number }",
            description: "O painel de uma etapa; desliza do lado para onde o fluxo andou.",
          },
          {
            prop: "StepperActions",
            type: "ComponentProps<'div'>",
            description: "A linha dos botões.",
          },
          {
            prop: "StepperPrevious / StepperNext",
            type: "Button / { onNext?, pending? }",
            description: "Voltar e Continuar (Concluir na última). onNext pode devolver Promise e false para não avançar.",
          },
          {
            prop: "useStepper()",
            type: "{ value, total, irPara, … }",
            description: "O estado do fluxo, para quem está fora da lista.",
          },
        ]}
      />
    </>
  )
}
