"use client"

import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { RadioGroup } from "@/components/ui/radio-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TIPOS = [
  ["expense", "Despesa"],
  ["installment", "Parcelada"],
  ["income", "Receita"],
] as const

export default function RadioDoc() {
  return (
    <>
      <Usage>
        O anel e o ponto de uma escolha única — o controle e nada mais. O rótulo é do <code>RadioGroupItem</code>, e o campo inteiro é o <code>FormRadioGroup</code>; use este átomo só para compor a opção à mão, como uma linha com conteúdo próprio. Para marcar quantas quiser, é o <code>Checkbox</code>: rádio é ponto, caixa é tique.
      </Usage>

      <DocSection
        title="Estados"
        description="Não marcado, marcado, desabilitado e inválido, todos dentro de um RadioGroup — fora dele o componente não renderiza."
        code={`<RadioGroup defaultValue="b">
  <Label className="flex items-center gap-2">
    <Radio value="a" /> Não marcado
  </Label>
  <Label className="flex items-center gap-2">
    <Radio value="b" /> Marcado
  </Label>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="marcado" className="gap-3">
          {(
            [
              ["nao-marcado", "Não marcado", {}],
              ["marcado", "Marcado", {}],
              ["desabilitado", "Desabilitado", { disabled: true }],
              ["invalido", "Inválido", { "aria-invalid": true }],
            ] as const
          ).map(([v, rotulo, extra]) => (
            <Label key={v} className="flex w-fit items-center gap-2 font-normal">
              <Radio value={v} {...extra} />
              {rotulo}
            </Label>
          ))}
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Marcar acende o anel e faz o ponto nascer"
        description="O anel passa do fio do campo para --primary-accent, e o ponto cresce do nada na mola da casa — a mesma entrada do tique do Checkbox. Troque a escolha."
        code={`<Radio value="expense" />`}
        previewClassName="gap-6"
      >
        <RadioGroup defaultValue="expense" orientation="horizontal" className="w-fit gap-6">
          {TIPOS.map(([v, rotulo]) => (
            <Label key={v} className="flex w-fit items-center gap-2 font-normal">
              <Radio value={v} />
              {rotulo}
            </Label>
          ))}
        </RadioGroup>
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="A borda acende em arco-íris conforme o ponteiro se aproxima — o brilho do Checkbox, do Alert, do Card, do Badge e do Button brand. Passe o mouse perto, marcado ou não. Longe do ponteiro, e no toque, ele é o anel do sistema, pixel a pixel. Uma por tela."
        code={`<Radio variant="brand" value="expense" />`}
        previewClassName="gap-6"
      >
        <RadioGroup defaultValue="installment" orientation="horizontal" className="w-fit gap-6">
          {TIPOS.map(([v, rotulo]) => (
            <Label key={v} className="flex w-fit items-center gap-2 font-normal">
              <Radio variant="brand" value={v} />
              {rotulo}
            </Label>
          ))}
        </RadioGroup>
      </DocSection>

      <DocNote title="O brilho só pinta a borda">
        O arco mora no <code>::before</code> e é recortado na máscara da <code>brand-glow</code>: o meio do anel nunca é pintado, então o ponto, o fundo e o realce do cursor aparecem intactos sob ele. O <code>::after</code> continua sendo o alvo de toque de 44px, e o brilho não precisa dele. Até a rodada 168 a marca daqui era um contorno parado que só acendia marcado; saiu para o rádio e a caixa falarem a mesma marca. Dentro de um cartão, a marca é do cartão (<code>RadioGroupItem variant=&quot;brandCard&quot;</code>) e não do anel — dois brilhos aninhados são dois anéis na mesma caixa.
      </DocNote>

      <DocNote title="Ele exige o RadioGroup">
        O <code>Item</code> do Radix lança fora de um <code>RadioGroup</code>, e reimplementar papel, foco itinerante e input espelho à mão seria trocar uma primitiva testada por uma cópia pior. Contexto de primitiva não é composição: o anel continua sendo o átomo.
      </DocNote>

      <DocNote title="O alvo tem 44px, e não 16">
        O desenho tem 16px e um <code>after:-inset-3.5</code> expande o toque a 44 sem mexer no layout, como no <code>Checkbox</code> e no <code>Switch</code>. Isso soma a embrulhar a opção num rótulo clicável, não o substitui. Nos cartões ele é desligado, porque a caixa inteira já é o alvo.
      </DocNote>

      <DocNote title="O ponto é --primary-accent, por currentColor">
        O ponto não carrega texto por cima: ele precisa ser visto contra a página, que é a definição de <code>--primary-accent</code> (7,34:1 no claro, 6,78:1 no escuro). O anel declara <code>text-primary-accent</code> e o ponto usa <code>bg-current</code>, então <code>&lt;Radio className=&quot;text-destructive&quot;&gt;</code> retinge o ponto. O anel marcado pinta a borda com o mesmo token.
      </DocNote>

      <DocNote title="O estado é data-state, e não data-checked">
        Para ler o estado de fora, use <code>data-[state=checked]</code>, que é o atributo que o Radix escreve. A variante <code>data-checked:</code> do Tailwind também casa, mas procurar <code>data-checked</code> no DOM não acha nada.
      </DocNote>

      <DocNote title="Onde o app usa">
        Sempre por dentro do <code>FormRadioGroup</code>: quatro campos em dois arquivos — o tipo da transação (despesa, parcelada, receita) e o filtro de tipo, no <code>transaction-type-segment</code>, e &ldquo;O que editar&rdquo; e &ldquo;Como informar os valores?&rdquo;, em cartão, no formulário de transação. Nenhuma tela escreve o <code>Radio</code> à mão, e a versão de marca ainda não tem tela.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "value",
            type: "string",
            description: "O valor da opção. Obrigatório — é como o grupo a identifica.",
          },
          {
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description:
              "A aparência. `brand` acende a borda em arco-íris conforme o ponteiro se aproxima.",
          },
          {
            prop: "disabled",
            type: "boolean",
            description: "Desliga o controle: cursor not-allowed e opacidade a 50%.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta borda e anel de destructive. Dentro de um RadioGroup desce por contexto.",
          },
          {
            prop: "className",
            type: "string",
            description: "Veste o anel; text-* aqui retinge o ponto, que é currentColor.",
          },
        ]}
      />
    </>
  )
}
