"use client"

import { Button } from "@/components/ui/button"
import {
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  EdgePanel,
  EdgePanelContent,
  EdgePanelTrigger,
} from "@/components/ui/edge-panel"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIDES = ["left", "right", "top", "bottom"] as const

export default function EdgePanelDoc() {
  return (
    <>
      <Usage>
        Um painel preso a uma borda — <strong>em qualquer largura de tela</strong>
        . É a navegação lateral do telefone: ela entra pelo lado, não sobe do
        rodapé. Para conteúdo — formulário, detalhe, filtros — o componente é o{" "}
        <code>Sheet</code>, que no telefone vira gaveta.
      </Usage>

      <DocSection
        title="Os quatro lados"
        description="As laterais tomam a altura inteira e param em 384px; topo e base tomam a largura e a altura do conteúdo. Cada lado desenha só o gume que fica para dentro — o painel encosta na tela."
        code={`<EdgePanel>
  <EdgePanelTrigger asChild><Button>Abrir</Button></EdgePanelTrigger>
  <EdgePanelContent side="left">…</EdgePanelContent>
</EdgePanel>`}
      >
        {SIDES.map((side) => (
          <EdgePanel key={side}>
            <EdgePanelTrigger asChild>
              <Button variant="outline">{side}</Button>
            </EdgePanelTrigger>
            <EdgePanelContent side={side}>
              <DialogHeader hideSeparator>
                <DialogTitle>Navegação</DialogTitle>
                <DialogDescription>
                  Entra de <code>{side}</code>, em qualquer largura.
                </DialogDescription>
              </DialogHeader>
              <DialogCloseButton />
            </EdgePanelContent>
          </EdgePanel>
        ))}
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"right"',
            description:
              "De onde ele entra — e vale em toda largura, ao contrário do Sheet, onde a prop é ignorada no telefone.",
          },
        ]}
      />

      <DocNote title="EdgePanel ou Sheet?">
        Duas coisas se chamavam <code>Sheet</code>, e elas respondem diferente à
        mesma pergunta sobre o telefone. <strong>Conteúdo</strong> — formulário,
        detalhe, filtros — vira gaveta no telefone, e o componente é o{" "}
        <code>Sheet</code>. <strong>Navegação presa a uma borda</strong>{" "}
        continua painel lateral em qualquer largura, e o componente é este.
        Enquanto a <code>Sidebar</code> pegava o <code>Sheet</code> emprestado
        para ter um painel, ela herdou a regra do outro e virou gaveta de baixo
        — com alça de arraste e canto arredondado no topo, para listar seis
        links.
      </DocNote>

      <DocNote title="A cromagem é a mesma dos outros">
        <code>DialogHeader</code>, <code>DialogTitle</code>,{" "}
        <code>DialogBody</code>, <code>DialogFooter</code> e{" "}
        <code>DialogCloseButton</code> funcionam aqui pelo mesmo motivo que
        funcionam na folha e na gaveta: todos são a mesma primitiva do Radix. O{" "}
        <code>Sheet</code> reusa este arquivo no desktop, então a moldura, a
        animação e o véu existem uma vez só.
      </DocNote>
    </>
  )
}
