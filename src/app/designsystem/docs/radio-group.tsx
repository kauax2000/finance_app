"use client"

import { FormRadioGroup } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function RadioGroupDoc() {
  return (
    <>
      <Usage>
        Escolha única entre <strong>poucas</strong> opções — ele existe para
        comparar todas lado a lado antes de decidir. Passando de cinco, o
        componente é o <code>Select</code>. Dentro de um formulário, a forma
        curta é <code>FormRadioGroup</code>.
      </Usage>

      <DocSection
        title="Em linha"
        description="O padrão. Cada opção é um rótulo que contém o rádio, então o alvo é a linha e não o círculo."
        code={`<RadioGroup defaultValue="unica">
  <RadioGroupItem value="unica">Única</RadioGroupItem>
  <RadioGroupItem value="parcelada">Parcelada</RadioGroupItem>
  <RadioGroupItem value="recorrente">Recorrente</RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="unica">
          <RadioGroupItem value="unica">Única</RadioGroupItem>
          <RadioGroupItem value="parcelada">Parcelada</RadioGroupItem>
          <RadioGroupItem value="recorrente">Recorrente</RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Em cartão"
        description="Quando cada opção precisa de uma explicação. A caixa inteira acende, e a descrição vive dentro do rótulo — é o que a mantém clicável."
        code={`<RadioGroup defaultValue="pix" variant="card">
  <RadioGroupItem value="pix" description="Cai na hora, sem taxa.">
    Pix
  </RadioGroupItem>
  <RadioGroupItem value="cartao" description="Entra na fatura do mês seguinte.">
    Cartão de crédito
  </RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="pix" variant="card" className="w-full max-w-sm">
          <RadioGroupItem value="pix" description="Cai na hora, sem taxa.">
            Pix
          </RadioGroupItem>
          <RadioGroupItem
            value="cartao"
            description="Entra na fatura do mês seguinte."
          >
            Cartão de crédito
          </RadioGroupItem>
          <RadioGroupItem value="boleto" description="Compensa em até 3 dias." disabled>
            Boleto
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Na horizontal"
        description="Colunas de largura igual. É a forma que substitui os trilhos segmentados que o app escrevia como abas dentro de formulário."
        code={`<RadioGroup
  defaultValue="total"
  variant="card"
  orientation="horizontal"
>
  <RadioGroupItem value="total">Total e parcelas</RadioGroupItem>
  <RadioGroupItem value="per_installment">Valor da parcela</RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup
          defaultValue="total"
          variant="card"
          orientation="horizontal"
          className="w-full max-w-md"
        >
          <RadioGroupItem value="total">Total e parcelas</RadioGroupItem>
          <RadioGroupItem value="per_installment">
            Valor da parcela
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Dentro de um formulário"
        description="FormRadioGroup monta o campo inteiro: o título que nomeia o grupo, a ajuda, o erro e a ligação de acessibilidade."
        code={`<FormRadioGroup
  label="Como informar os valores?"
  description="Dá para trocar depois."
  variant="card"
  orientation="horizontal"
  defaultValue="total"
  options={[
    { value: "total", label: "Total e parcelas" },
    { value: "per_installment", label: "Valor da parcela" },
  ]}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <FormRadioGroup
          label="Como informar os valores?"
          description="Dá para trocar depois."
          variant="card"
          orientation="horizontal"
          defaultValue="total"
          fieldClassName="w-full max-w-md"
          options={[
            { value: "total", label: "Total e parcelas" },
            { value: "per_installment", label: "Valor da parcela" },
          ]}
        />
      </DocSection>

      <DocNote title="O rótulo embrulha o rádio, e o cartão exige isso">
        `RadioGroupItem` <strong>é</strong> um <code>&lt;label&gt;</code> que
        contém o <code>Radio</code>. Não há <code>useId</code> nem{" "}
        <code>htmlFor</code>: a associação implícita do HTML resolve, e o
        controle rotulado é o <code>&lt;button role=&quot;radio&quot;&gt;</code>{" "}
        — que é elemento rotulável, e que o Radix emite antes do{" "}
        <code>&lt;input&gt;</code> espelho.
        <br />
        <br />
        O <code>variant=&quot;card&quot;</code> não teria como funcionar de outro
        jeito: a caixa que acende é a mesma que precisa <em>conter</em> o rádio
        para ler o estado dele com <code>:has()</code>. Um irmão com{" "}
        <code>htmlFor</code> não pinta um retângulo em volta do que está fora
        dele. Como o <code>plain</code> fica correto com o mesmo mecanismo, os
        dois usam um só — duas mecânicas para a mesma associação é como uma
        delas envelhece sozinha.
      </DocNote>

      <DocNote title="A descrição entra no nome, e não em aria-describedby">
        Ela vive <strong>dentro</strong> do <code>&lt;label&gt;</code>, porque é
        isso que mantém a caixa inteira clicável — e por isso já compõe o{" "}
        <strong>nome acessível</strong> da opção: o leitor de tela anuncia
        &ldquo;Pix, cai na hora, sem taxa&rdquo;. Apontar um{" "}
        <code>aria-describedby</code> para o mesmo texto o faria dizer duas
        vezes. O custo é um nome mais longo, e para uma opção de escolha o nome
        longo <em>é</em> o texto da opção.
      </DocNote>

      <DocNote title="O alvo já é 44px, e a página dizia o contrário">
        Esta página afirmava que o cartão existe para resolver o alvo de toque,
        &ldquo;porque um radio sozinho tem 16px&rdquo;. <strong>É falso</strong>{" "}
        desde que o <code>after:-inset-3.5</code> entrou no controle: o desenho
        tem 16 e o tocável tem <strong>44</strong>, medido. O cartão existe pela
        <em>explicação</em> — e porque um alvo em forma de linha é melhor que um
        círculo invisível de 44px que se sobrepõe ao vizinho.
      </DocNote>

      <DocNote title="aria-invalid desce por contexto">
        Escrito no grupo, ele alcança cada <code>Radio</code> por contexto React
        — não por seletor descendente. O átomo não lê <code>group-*</code> de
        quem o contém: seria o átomo conhecendo o contêiner, que é o defeito que
        apagou o degrau <code>xs</code> do <code>Item</code>. Dentro de um{" "}
        <code>FormRadioGroup</code>, quem o escreve é o <code>FieldControl</code>,
        e renderizar um erro é o que o liga.
      </DocNote>

      <PropsTable
        title="Props do RadioGroup"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "card"',
            default: '"plain"',
            description:
              "A forma das opções. Desce por contexto até cada item, que pode sobrescrever.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            description:
              "Colunas iguais em horizontal. Sem valor, as quatro setas navegam — que é o que a APG pede.",
          },
          {
            prop: "value / defaultValue / onValueChange",
            type: "string / string / (v: string) => void",
            description: "O valor escolhido. Controlado ou não, como no Radix.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Marca o grupo, e desce por contexto até cada Radio.",
          },
        ]}
      />

      <PropsTable
        title="Props do RadioGroupItem"
        rows={[
          {
            prop: "value",
            type: "string",
            description: "O valor da opção. Obrigatório.",
          },
          {
            prop: "children",
            type: "ReactNode",
            description: "O rótulo. Obrigatório — é o que o item passou a carregar.",
          },
          {
            prop: "description",
            type: "ReactNode",
            description:
              "A explicação. Só tem lugar em variant=\"card\"; numa linha não há onde ela caber sem virar cartão.",
          },
          {
            prop: "variant",
            type: '"plain" | "card"',
            description: "Sobrescreve o do grupo, para a opção que foge do padrão.",
          },
          {
            prop: "radioClassName",
            type: "string",
            description:
              "Veste o controle. className veste a caixa — o rótulo inteiro.",
          },
        ]}
      />
    </>
  )
}
