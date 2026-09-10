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
        <code>checked=&quot;indeterminate&quot;</code>{" "}
        troca o tique por um traço, com o mesmo preenchimento e o mesmo
        contorno do marcado. Ele é o cabeçalho de uma lista em que{" "}
        <strong>parte</strong>{" "}
        dos itens está marcada — quem o desenha como um marcado mais claro está
        dizendo &ldquo;meio ligado&rdquo;, que não é o que ele significa.
        <br />
        <br />
        Ele não sai de <code>defaultChecked</code>: é um valor de{" "}
        <code>checked</code>, ou seja o controle passa a ser{" "}
        <strong>controlado</strong>, e quem o usa gerencia o estado.
      </DocNote>

      <DocSection
        title="Lista de seleção"
        description="Numa lista, o rótulo inteiro é o alvo do toque. O checkbox sozinho tem 16px, muito abaixo dos 44px que um dedo pede."
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
        O controle desenhado tem <strong>16px</strong>{" "}
        — muito abaixo dos 44 que um dedo pede. Um{" "}
        <code>::after</code> com <code>-inset-3.5</code>{" "}
        leva o alvo aos 44 <strong>sem mexer no layout</strong>: crescer de
        verdade mudaria a caixa que a linha de formulário posiciona. É a mesma
        técnica do <code>Switch</code>.
        <br />
        <br />
        <strong>E ela não substitui o rótulo clicável — soma a ele.</strong>{" "}
        Numa lista, quem deve receber o toque é a linha inteira, e é por isso
        que a seção acima envolve cada item num <code>Label</code>.
      </DocNote>

      <DocNote title="Se a mudança vale no instante do toque, o componente é outro">
        A caixa de marcar existe para escolha que só se efetiva quando o
        formulário é <strong>enviado</strong>. Uma preferência que liga na hora,
        um filtro que já aplica — isso é <code>Switch</code>, e a diferença não
        é de aparência: é de quando o efeito acontece.
        <br />
        <br />
        Para escolher <strong>uma</strong>{" "}
        opção entre várias, o componente é o <code>RadioGroup</code>: rádio é
        ponto, caixa é tique, e o par diz sozinho se dá para marcar mais de uma.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "checked",
            type: 'boolean | "indeterminate"',
            description:
              "O estado, no modo controlado. É por aqui que entra o parcial — ele não existe como valor inicial.",
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
              "Vão para o input espelho que o Radix renderiza, e é o que faz a caixa participar de um <form> nativo.",
          },
        ]}
      />
    </>
  )
}
