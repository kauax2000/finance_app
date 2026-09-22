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
        title="A versão de marca"
        description="O arco-íris da marca por contorno, e só quando marcada. Uma por tela."
        code={`<Checkbox variant="brand" />
<Checkbox variant="brand" defaultChecked />`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-brand-1" variant="brand" />
          <Label htmlFor="ds-cb-brand-1">Não marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-brand-2" variant="brand" defaultChecked />
          <Label htmlFor="ds-cb-brand-2">Marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="ds-cb-brand-3"
            variant="brand"
            checked="indeterminate"
          />
          <Label htmlFor="ds-cb-brand-3">Parcial</Label>
        </div>
      </DocSection>

      <DocNote title="Desmarcada ela é a caixa do sistema, pixel a pixel">
        O arco-íris só acende marcado, e isso é decisão. A passagem do fio cinza para o degradê <em>é</em> a comemoração — cinco caixas desmarcadas numa lista com cinco anéis de acento deixam de ter acento nenhum. O contorno esmaece por opacidade (<code>--duration-fast</code>) e não por troca de camada: <code>background-image</code> não interpola entre um degradê e <code>none</code>, então trocar a pintura faria o contorno estalar.
      </DocNote>

      <DocNote title="Sem halo, porque o ::after já é o alvo de toque">
        O <code>Button</code> e o <code>Badge</code> desenham a marca em duas camadas: o contorno no <code>::before</code> e um halo borrado no <code>::after</code>. Aqui o <code>::after</code> é o alvo de 44px, e ele não se move — sobra o contorno, que é o precedente do <code>brandOutline</code>. Nesta escala é o certo de qualquer forma: um halo a <code>-inset-1</code> sangra 4px e encosta na linha vizinha de uma lista com <code>gap-3</code>. E o tique continua <code>--primary-foreground</code> sobre <code>--primary</code>: o miolo marcado é chapado, o degradê só aparece por 1px de borda, e o contraste do conteúdo é <strong>o mesmo da caixa do sistema</strong>. Arco-íris sob texto continua proibido.
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
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description:
              "A aparência. `brand` acende o arco-íris da marca por contorno, e só quando marcada.",
          },
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
