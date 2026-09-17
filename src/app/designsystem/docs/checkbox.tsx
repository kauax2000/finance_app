"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CheckboxDoc() {
  return (
    <>
      <Usage>
        Escolha booleana que só vale quando o formulário é enviado. Se a mudança vale no instante do toque — uma preferência, um filtro — o componente é o <code>Switch</code>.
      </Usage>

      <DocSection
        title="Estados"
        code={`<Checkbox />
<Checkbox defaultChecked />
<Checkbox disabled />
<Checkbox checked="indeterminate" />`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-1" />
          <Label htmlFor="ds-cb-1">Não marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-2" defaultChecked />
          <Label htmlFor="ds-cb-2">Marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-3" checked="indeterminate" />
          <Label htmlFor="ds-cb-3">Parcial</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-4" defaultChecked disabled />
          <Label htmlFor="ds-cb-4">Desabilitado</Label>
        </div>
      </DocSection>

      <DocNote title="O parcial é um terceiro estado, e não um marcado meio apagado">
        <code>checked=&quot;indeterminate&quot;</code> troca o tique por um traço, com o preenchimento do marcado: é o cabeçalho de uma lista com parte dos itens marcada, não um &ldquo;meio ligado&rdquo;. Ele só existe como valor de <code>checked</code>, então o controle passa a ser controlado.
      </DocNote>

      <DocSection
        title="Lista de seleção"
        description="Numa lista, o rótulo inteiro é o alvo do toque."
        code={`<Label className="flex items-center gap-3 rounded-lg border p-3">
  <Checkbox />
  <span>Mercado</span>
</Label>`}
        previewClassName="flex-col items-stretch gap-2"
      >
        {["Mercado", "Transporte", "Assinaturas"].map((cat) => (
          <Label
            key={cat}
            className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal hover:bg-accent/60 active:bg-accent/60"
          >
            <Checkbox />
            <span className="text-sm">{cat}</span>
          </Label>
        ))}
      </DocSection>
      <DocNote title="A área de toque é 44px, e ela cresce por pseudo-elemento">
        A caixa desenhada tem 16px; um <code>::after</code> com <code>-inset-3.5</code> leva o alvo a 44 sem mexer no layout, como no <code>Switch</code>. Ele soma ao rótulo clicável, não o substitui.
      </DocNote>

      <DocNote title="Switch e RadioGroup são outra escolha">
        A diferença para o <code>Switch</code> é quando o efeito acontece, não a aparência. Para uma opção entre várias, é <code>RadioGroup</code>: rádio é ponto, caixa é tique.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "checked",
            type: 'boolean | "indeterminate"',
            description:
              "O estado controlado; o parcial só entra por aqui.",
          },
          {
            prop: "defaultChecked",
            type: "boolean",
            default: "false",
            description:
              "O estado inicial, no modo não controlado. Não aceita o parcial.",
          },
          {
            prop: "onCheckedChange",
            type: '(checked: boolean | "indeterminate") => void',
            description: "Dispara na mudança, com o valor novo.",
          },
          {
            prop: "disabled",
            type: "boolean",
            default: "false",
            description:
              "Tira o controle do foco e do ponteiro, e baixa a opacidade.",
          },
          {
            prop: "required / name / value",
            type: "props de formulário",
            description:
              "Vão para o input espelho do Radix, que faz a caixa participar de um form nativo.",
          },
        ]}
      />
    </>
  )
}
