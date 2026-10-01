"use client"

import * as React from "react"
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  RectangleStackIcon,
} from "@heroicons/react/16/solid"
import { FormRadioGroup } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function RadioGroupDoc() {
  return (
    <>
      <Usage>
        Escolha única entre <strong>poucas</strong> opções, para comparar todas lado a lado antes de decidir. Passando de cinco, use <code>Select</code>. Dentro de um formulário, a forma curta é <code>FormRadioGroup</code>.
      </Usage>

      <DocSection
        title="Em linha"
        description="O padrão. Cada opção é um rótulo que contém o rádio, então o alvo é a linha e não o círculo. description põe a nota miúda sob o rótulo, com o rádio preso à primeira linha — a linha não precisa virar cartão para explicar."
        code={`<RadioGroup defaultValue="unica">
  <RadioGroupItem value="unica">Única</RadioGroupItem>
  <RadioGroupItem value="recorrente" description="Repete todo mês, no mesmo dia.">
    Recorrente
  </RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-wrap items-start gap-10"
      >
        <RadioGroup defaultValue="unica">
          <RadioGroupItem value="unica">Única</RadioGroupItem>
          <RadioGroupItem value="parcelada">Parcelada</RadioGroupItem>
          <RadioGroupItem value="recorrente">Recorrente</RadioGroupItem>
        </RadioGroup>
        <RadioGroup defaultValue="unica" className="max-w-xs">
          <RadioGroupItem value="unica" description="Entra uma vez, na data escolhida.">
            Única
          </RadioGroupItem>
          <RadioGroupItem value="recorrente" description="Repete todo mês, no mesmo dia.">
            Recorrente
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Em cartão, com o valor na ponta"
        description="Quando cada opção precisa de explicação. A caixa inteira acende, e a descrição vive dentro do rótulo para continuar clicável. trailing põe o número que se compara — a parcela, a taxa — alinhado ao fim, em algarismos tabulares."
        code={`<RadioGroup defaultValue="3" variant="card">
  <RadioGroupItem value="1" description="Sem juros." trailing="R$ 1.200,00">
    À vista
  </RadioGroupItem>
  <RadioGroupItem value="3" description="Sem juros." trailing="3× R$ 400,00">
    Em 3 vezes
  </RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="3" variant="card" className="w-full max-w-sm">
          <RadioGroupItem value="1" description="Sem juros." trailing="R$ 1.200,00">
            À vista
          </RadioGroupItem>
          <RadioGroupItem value="3" description="Sem juros." trailing="3× R$ 400,00">
            Em 3 vezes
          </RadioGroupItem>
          <RadioGroupItem
            value="12"
            description="Juros de 1,99% ao mês."
            trailing="12× R$ 113,40"
            disabled
          >
            Em 12 vezes
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Ladrilho, com ícone"
        description="icon põe o ícone antes do rótulo. Num grupo horizontal de cartões ele vai em cima, e o rádio sobe ao canto: o ladrilho de escolha. É o tipo do lançamento no formulário de transação. Escolhido, o ícone ganha a tinta do rótulo."
        code={`<RadioGroup defaultValue="expense" variant="card" orientation="horizontal">
  <RadioGroupItem value="expense" icon={<ArrowTrendingDownIcon />}>Despesa</RadioGroupItem>
  <RadioGroupItem value="installment" icon={<RectangleStackIcon />}>Parcelada</RadioGroupItem>
  <RadioGroupItem value="income" icon={<ArrowTrendingUpIcon />}>Receita</RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        <RadioGroup
          defaultValue="expense"
          variant="card"
          orientation="horizontal"
          className="w-full max-w-md"
          aria-label="Tipo de lançamento"
        >
          <RadioGroupItem value="expense" icon={<ArrowTrendingDownIcon />}>
            Despesa
          </RadioGroupItem>
          <RadioGroupItem value="installment" icon={<RectangleStackIcon />}>
            Parcelada
          </RadioGroupItem>
          <RadioGroupItem value="income" icon={<ArrowTrendingUpIcon />}>
            Receita
          </RadioGroupItem>
        </RadioGroup>
        <RadioGroup
          defaultValue="expense"
          variant="card"
          className="w-full max-w-sm"
          aria-label="Tipo"
        >
          <RadioGroupItem
            value="expense"
            icon={<ArrowTrendingDownIcon />}
            description="Sai da conta ou entra na fatura."
          >
            Despesa
          </RadioGroupItem>
          <RadioGroupItem
            value="income"
            icon={<ArrowTrendingUpIcon />}
            description="Salário, reembolso, venda."
          >
            Receita
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocSection
        title="Fichas"
        description="variant=&quot;chip&quot;: a escolha em pílulas, na superfície dos chips de filtro do Badge. A ficha é o indicador, e o rádio continua lá para o leitor de tela e as setas. deselectable deixa voltar a vazio tocando na escolhida — para a escolha opcional, como a forma de pagamento da transação."
        code={`<RadioGroup variant="chip" deselectable aria-label="Forma de pagamento">
  <RadioGroupItem value="pix">PIX</RadioGroupItem>
  <RadioGroupItem value="credit_card">Cartão de crédito</RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <FichasDemo />
      </DocSection>

      <DocSection
        title="O cartão de marca"
        description="O mesmo cartão, com o mesmo realce de seleção, e a borda que acende em arco-íris conforme o ponteiro se aproxima — o brilho do Card brand. Passe o mouse perto. Uma por tela."
        code={`<RadioGroup defaultValue="slice" variant="brandCard">
  <RadioGroupItem value="slice" description="Só o valor e a data desta.">
    Esta parcela
  </RadioGroupItem>
  <RadioGroupItem value="plan" description="Descrição, categoria e as parcelas futuras.">
    Plano da compra
  </RadioGroupItem>
</RadioGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="slice" variant="brandCard" className="w-full max-w-sm">
          <RadioGroupItem value="slice" description="Só o valor e a data desta.">
            Esta parcela
          </RadioGroupItem>
          <RadioGroupItem
            value="plan"
            description="Descrição, categoria e as parcelas futuras."
          >
            Plano da compra
          </RadioGroupItem>
        </RadioGroup>
      </DocSection>

      <DocNote title="O brilho soma, e o rádio de dentro não vira marca">
        Até a rodada 168 a marca era um contorno parado que acendia <strong>no lugar</strong> do realce de seleção. O brilho acende pelo ponteiro, e não pelo estado, então quem diz &ldquo;selecionado&rdquo; volta a ser o realce do <code>card</code> — e os dois não disputam: o arco vive na aresta, a lavagem no miolo, porque a máscara recorta só o anel. O <code>Radio</code> de dentro continua o do sistema, porque dois brilhos aninhados são dois anéis na mesma caixa, e o anel de foco continua sendo o do cartão.
      </DocNote>

      <DocSection
        title="Dentro de um formulário"
        description="FormRadioGroup monta o campo inteiro: o título que nomeia o grupo, a ajuda, o erro e a ligação de acessibilidade. Na horizontal as opções são colunas de largura igual — use no lugar de abas dentro de formulário. options aceita icon e trailing."
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

      <DocNote title="O rótulo embrulha o rádio">
        <code>RadioGroupItem</code> é um <code>&lt;label&gt;</code> que contém o <code>Radio</code>: sem <code>useId</code> nem <code>htmlFor</code>, a associação implícita do HTML resolve. O cartão depende disso — a caixa que acende precisa conter o rádio para ler o estado com <code>:has()</code> — e o <code>plain</code> usa o mesmo mecanismo, para as duas formas não divergirem.
      </DocNote>

      <DocNote title="A descrição entra no nome, não em aria-describedby">
        Dentro do rótulo, ela já compõe o nome acessível: &ldquo;Em 3 vezes, sem juros, 3× R$ 400,00&rdquo; — o <code>trailing</code> entra pelo mesmo caminho. Um <code>aria-describedby</code> para o mesmo texto o faria ser lido duas vezes.
      </DocNote>

      <DocNote title="O alvo do rádio já é 44px">
        O desenho tem 16px e o tocável, 44px (<code>after:-inset-3.5</code>), e a linha sobe a 44 no dedo. O cartão existe pela explicação, não pelo alvo de toque. A ficha tem 32px e sobe a 40 no dedo, o piso dos campos.
      </DocNote>

      <DocNote title="Ficha de escolha não é botão de alternar">
        A forma de pagamento era <code>role=&quot;group&quot;</code> com seis botões <code>aria-pressed</code>: o leitor de tela anunciava seis interruptores independentes para uma escolha única, e cada ficha era uma parada de Tab. Como rádio, é uma parada só, as setas trocam, e ouve-se &ldquo;1 de 6&rdquo;. Um filtro que liga e desliga várias coisas continua sendo <code>ToggleGroup</code> ou <code>aria-pressed</code>.
      </DocNote>

      <DocNote title="aria-invalid desce por contexto">
        Escrito no grupo, ele alcança cada <code>Radio</code> por contexto React, não por seletor <code>group-*</code> — o átomo não conhece o contêiner. No <code>FormRadioGroup</code>, quem o escreve é o <code>FieldControl</code> quando há erro.
      </DocNote>

      <DocNote title="Onde o app usa">
        No formulário de transação, e só lá: o tipo do lançamento (Despesa, Parcelada, Receita) e o tipo na edição em ladrilhos com ícone, o escopo da edição de parcela e o modo dos valores do parcelamento em cartões horizontais, e a forma de pagamento em fichas que voltam a vazio — os cinco por <code>FormRadioGroup</code>.
      </DocNote>

      <PropsTable
        title="Props do RadioGroup"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "card" | "brandCard" | "chip"',
            default: '"plain"',
            description:
              "A forma das opções. Desce por contexto até cada item, que pode sobrescrever.",
          },
          {
            prop: "deselectable",
            type: "boolean",
            default: "false",
            description:
              "Tocar na opção marcada a desmarca, e onValueChange recebe \"\". Só para escolha opcional.",
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
            description: "O rótulo. Obrigatório.",
          },
          {
            prop: "description",
            type: "ReactNode",
            description: "A nota sob o rótulo. Não vale na ficha.",
          },
          {
            prop: "icon",
            type: "ReactNode",
            description:
              "O ícone antes do rótulo, em 16px (16/solid); em cima, num grupo horizontal de cartões.",
          },
          {
            prop: "trailing",
            type: "ReactNode",
            description: "O valor na outra ponta. Não vale na ficha.",
          },
          {
            prop: "variant",
            type: '"plain" | "card" | "brandCard" | "chip"',
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

/** A ficha que volta a vazio: o valor à vista para ver o "" chegar. */
function FichasDemo() {
  const [valor, setValor] = React.useState("pix")
  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        variant="chip"
        deselectable
        value={valor}
        onValueChange={setValor}
        aria-label="Forma de pagamento"
      >
        <RadioGroupItem value="pix">PIX</RadioGroupItem>
        <RadioGroupItem value="debit_card">Cartão de débito</RadioGroupItem>
        <RadioGroupItem value="credit_card">Cartão de crédito</RadioGroupItem>
        <RadioGroupItem value="cash">Dinheiro</RadioGroupItem>
        <RadioGroupItem value="other" disabled>
          Outro
        </RadioGroupItem>
      </RadioGroup>
      <span className="text-xs text-muted-foreground">
        value: <code>{JSON.stringify(valor)}</code>
      </span>
    </div>
  )
}
