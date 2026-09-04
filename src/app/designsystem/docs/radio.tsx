"use client"

import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { RadioGroup } from "@/components/ui/radio-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function RadioDoc() {
  return (
    <>
      <Usage>
        O anel e o ponto de uma escolha única — o controle, e nada além dele.
        Quem carrega o rótulo é o <code>RadioGroupItem</code>, e quem monta o
        campo inteiro é o <code>FormRadioGroup</code>. Este átomo é para quem
        precisa compor a opção à mão: um cartão com conteúdo próprio, uma linha
        de tabela.
      </Usage>

      <DocSection
        title="Estados"
        description="As quatro condições do controle. Todas dentro de um RadioGroup, porque fora dele o componente não existe — ver a nota abaixo."
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
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="nao-marcado" />
            Não marcado
          </Label>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="marcado" />
            Marcado
          </Label>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="desabilitado" disabled />
            Desabilitado
          </Label>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Radio value="invalido" aria-invalid />
            Inválido
          </Label>
        </RadioGroup>
      </DocSection>

      <DocNote title="Ele exige o grupo, e é limite da primitiva">
        Este é o <strong>primeiro átomo do sistema que não renderiza
        sozinho</strong>. O Radix não exporta rádio independente: o{" "}
        <code>Item</code> chama <code>useRadioGroupContext</code>, que{" "}
        <strong>lança</strong> fora de um <code>RadioGroup</code> — verificado no
        fonte, não deduzido do tipo. Reimplementar o <code>role=&quot;radio&quot;</code>,
        o foco itinerante e o <code>&lt;input&gt;</code> espelho à mão para
        ganhar independência seria trocar uma primitiva testada por uma cópia
        pior.
        <br />
        <br />
        Contexto de primitiva <strong>não é composição</strong>: é a mesma conta
        que faz o <code>Slider</code> ser átomo com quatro peças Radix por
        dentro. O anel é a unidade; quem compõe é o grupo.
      </DocNote>

      <DocNote title="O alvo tem 44px, e não 16">
        O desenho tem 16px e o <strong>tocável tem 44</strong>: um{" "}
        <code>after:-inset-3.5</code> expande a área sem mexer no layout — 16 +
        2 × 14, medido. É a mesma técnica do <code>Checkbox</code> e do{" "}
        <code>Switch</code>. Ela <strong>não</strong> substitui embrulhar a
        opção num rótulo clicável: soma a ela, e é o rótulo que dá o alvo em
        forma de linha em vez de um círculo invisível de 44px que se sobrepõe ao
        vizinho.
      </DocNote>

      <DocNote title="O ponto é currentColor, e a tinta do anel era declaração morta">
        O anel declara <code>text-primary-accent</code> e o ponto usa{" "}
        <code>bg-current</code> — antes ele era <code>bg-primary</code>, e{" "}
        <strong>nada lia a cor do texto</strong>. Medido contra a página: no tema
        claro os dois tokens dão <strong>7,34:1</strong> (ali eles são a mesma
        cor); no escuro, <code>--primary</code> dá <strong>3,64:1</strong> e{" "}
        <code>--primary-accent</code> dá <strong>6,78:1</strong>.
        <br />
        <br />
        Nenhum dos dois reprova os 3:1 de traço não-textual, e é por isso que
        quem decide é a régua e não a norma: o ponto não carrega texto por cima,
        ele precisa ser enxergado <em>contra a página</em> — e essa é a definição
        de <code>--primary-accent</code>. Como bônus,{" "}
        <code>&lt;Radio className=&quot;text-destructive&quot;&gt;</code> retinge
        o ponto sem tocar no componente.
      </DocNote>

      <DocNote title="O estado é data-state, e não data-checked">
        Quem for ler o estado deste átomo de fora escreve{" "}
        <code>data-[state=checked]</code>: é o atributo que o Radix escreve.{" "}
        <code>data-checked:</code> do Tailwind também casa — medido, o variante
        cobre as duas grafias —, mas procurar no DOM por{" "}
        <code>data-checked</code> não acha nada.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "value",
            type: "string",
            description: "O valor da opção. Obrigatório — é como o grupo a identifica.",
          },
          {
            prop: "disabled",
            type: "boolean",
            description: "Desliga o controle. O cursor vira not-allowed e a opacidade cai a 50%.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description:
              "Pinta a borda e o anel de destructive. Dentro de um RadioGroup ele desce por contexto — não precisa ser escrito opção a opção.",
          },
          {
            prop: "className",
            type: "string",
            description:
              "Veste o anel. A cor do ponto vem de currentColor, então text-* aqui retinge o ponto.",
          },
        ]}
      />
    </>
  )
}
