"use client"

import Link from "next/link"

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
              <DialogHeader>
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

      <DocSection
        title="Encostado e flutuante"
        description="flush cola nas três bordas e desenha só o gume que fica para dentro — é a navegação, e o padrão. floating abre uma calha de 8px, arredonda os quatro cantos e fecha a borda em volta, com a página aparecendo por baixo."
        code={`<EdgePanelContent side="left" variant="floating">…</EdgePanelContent>`}
        previewClassName="items-start"
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              { lado: "left", v: "flush", rotulo: "left · flush (padrão)" },
              { lado: "left", v: "floating", rotulo: "left · floating" },
              { lado: "bottom", v: "flush", rotulo: "bottom · flush" },
              { lado: "bottom", v: "floating", rotulo: "bottom · floating" },
            ] as const
          ).map((c) => (
            <EdgePanel key={c.rotulo}>
              <EdgePanelTrigger asChild>
                <Button variant="outline" size="sm">
                  {c.rotulo}
                </Button>
              </EdgePanelTrigger>
              <EdgePanelContent side={c.lado} variant={c.v}>
                <DialogHeader>
                  <DialogTitle>{c.rotulo}</DialogTitle>
                  <DialogDescription>
                    O <code>flush</code> encosta na tela; o{" "}
                    <code>floating</code> deixa a página aparecer em volta.
                  </DialogDescription>
                </DialogHeader>
                <DialogCloseButton />
              </EdgePanelContent>
            </EdgePanel>
          ))}
        </div>
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
          {
            prop: "variant",
            type: '"flush" | "floating"',
            default: '"flush"',
            description:
              "flush encosta na tela, com o gume do próprio lado; floating abre uma calha de 8px, arredonda os quatro cantos e fecha a borda em volta.",
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

      <DocNote title="Por que o material não muda entre as duas">
        A tentação é vestir a <code>@utility glass</code> no{" "}
        <code>floating</code>, como a placa flutuante da{" "}
        <Link href="/designsystem/sidebar">Sidebar</Link> faz. Ali é certo por um
        motivo que <strong>não vale aqui</strong>: aquela placa reserva a própria
        calha no fluxo, então nada passa por trás dela — borrar cor chapada não
        desenha nada, e a luz é <em>pintada</em>. Este painel é modal: há o véu a
        40% e a página inteira atrás. O flutuante tem <strong>mais</strong>{" "}
        conteúdo por baixo que o encostado, não menos, e o material borrado que a{" "}
        <Link href="/designsystem/dialog">placa modal</Link> já traz — 24px com{" "}
        <code>saturate(1.5)</code> — é a resposta certa nos dois. O eixo mexe em
        geometria, e em nada mais.
      </DocNote>

      <DocNote title="A calha conta a área segura — nas verticais">
        Oito pixels medidos a partir do <em>viewport</em> põem o canto de baixo
        do painel atrás do indicador de home num iPhone, e o telefone é onde vive
        o consumidor principal deste componente. As duas bordas verticais leem{" "}
        <code>max(calha, env(safe-area-inset-…))</code>. A horizontal fica de
        fora de propósito: <code>safe-area-inset-left/right</code> não aparece
        nenhuma vez no repositório — é lacuna conhecida do app inteiro, cujo dono
        é a casca, e fechá-la só aqui seria a segunda gramática para a mesma
        coisa.
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
