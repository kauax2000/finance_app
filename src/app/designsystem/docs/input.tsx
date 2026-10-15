"use client"

import * as React from "react"

import { Code } from "@/components/ui/code"
import { FormInput } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoneyBrlTyping, normalizeMoneyBrlOnBlur } from "@/lib/money-brl"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** As teclas, na ordem em que a pessoa as aperta — cada uma é um centavo. */
const TECLAS = ["4", "42", "429", "4290", "123456"]

/** O que chega ao campo por colagem ou por código, e o que sai no `onBlur`. */
const COLADOS = [
  { cru: "250", por: "número inteiro: são reais, não centavos" },
  { cru: "1234.5", por: "ponto americano" },
  { cru: "R$ 99", por: "com o símbolo" },
  { cru: "12,345", por: "três casas: arredonda" },
  { cru: "abc", por: "sem número: esvazia" },
]

export default function InputDoc() {
  return (
    <>
      <Usage>
        Todo campo de uma linha e, com <code>money</code>, todo valor em reais
        que o app <strong>recebe</strong>. Sempre com <code>Label</code>:{" "}
        <code>placeholder</code> some ao digitar. Rótulo, ajuda e erro já
        ligados: <code>FormInput</code>.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="A escada do Button: sm 28, md 32, lg 36, xl 40. O padrão é lg, então Input e Button alinham sem declarar size. Num apontador grosso os três degraus de baixo sobem ao piso de 40 — abra esta página no telefone e os quatro medem o mesmo."
        code={`<Input size="sm" placeholder="sm · 28" />
<Input placeholder="md · 32" />
<Input size="lg" placeholder="lg · 36" />
<Input size="xl" placeholder="xl · 40" />`}
        previewClassName="flex-col items-stretch"
      >
        <Input size="sm" placeholder="sm · 28" aria-label="Exemplo sm" />
        <Input placeholder="md · 32" aria-label="Exemplo md" />
        <Input size="lg" placeholder="lg · 36" aria-label="Exemplo lg" />
        <Input size="xl" placeholder="xl · 40" aria-label="Exemplo xl" />
      </DocSection>

      <DocSection
        title="Estados"
        code={`<Input placeholder="Normal" />
<Input placeholder="Desabilitado" disabled />
<Input defaultValue="valor@invalido" aria-invalid />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-input-normal">Descrição</Label>
          <Input id="ds-input-normal" placeholder="Mercado" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-input-disabled">Desabilitado</Label>
          <Input id="ds-input-disabled" placeholder="Mercado" disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-input-invalid">Com erro</Label>
          <Input id="ds-input-invalid" defaultValue="nao-e-um-email" aria-invalid />
        </div>
      </DocSection>

      <DocNote title="O contorno quase não existe, e é decisão">
        Quem identifica o campo é o <strong>preenchimento</strong> (<code>bg-input-fill/50</code>), e não o fio (<code>--input</code>): os dois ficam entre 1,1 e 1,2:1, abaixo dos 3:1 da WCAG 1.4.11, por decisão consciente registrada no <code>AGENTS.md</code> — a referência é o <code>border-beam</code> do 21st. O foco é a borda na cor de <code>--ring</code> mais um anel suave, <code>ring-3</code> a 30% — mais claro que o dos outros controles, a pedido do dono, e também abaixo dos 3:1 (1,99 no claro, 2,53 no escuro, contra as sete superfícies em que um campo pode pousar). O caminho de volta é <code>/45</code>, que mede 3,05 e 4,10. A superfície, o anel e a altura moram em <code>lib/field-classes</code>, e os oito controles de campo leem de lá.
      </DocNote>

      <DocSection
        title="Dinheiro"
        description="money trabalha com dois valores: a string mascarada, que aparece no campo, e o número em reais, que vai para o banco. onValueChange entrega os dois; nas telas, ele vem dentro de FormInput."
        code={`const [texto, setTexto] = React.useState("")
const [reais, setReais] = React.useState<number | null>(null)

<FormInput
  money
  label="Valor"
  description={\`Em reais: \${reais}\`}
  value={texto}
  onValueChange={(masked, parsed) => {
    setTexto(masked)
    setReais(parsed)
  }}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <MoneyDemo />
      </DocSection>

      <DocSection
        title="A máscara, tecla a tecla"
        description="Cada tecla entra como centavo, da direita para a esquerda — como app bancário, e ninguém pergunta onde fica a vírgula. As linhas saem de formatMoneyBrlTyping, a função que o campo usa."
        code={`import { formatMoneyBrlTyping } from "@/lib/money-brl"

formatMoneyBrlTyping("4290") // "42,90"`}
        previewClassName="flex-col items-stretch gap-2"
      >
        {TECLAS.map((t) => (
          <div key={t} className="flex flex-wrap items-center gap-3">
            <Code className="w-20 shrink-0">{t}</Code>
            <span className="text-2xs text-muted-foreground">→</span>
            <Code variant="inline" className="nums">{formatMoneyBrlTyping(t)}</Code>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Ao sair do campo"
        description="Valor colado ou posto por código não passa pela digitação, e o onBlur o renormaliza. Não é a máscara de digitação: 250 é lido como reais, e não como 2,50. As linhas saem de normalizeMoneyBrlOnBlur."
        code={`import { normalizeMoneyBrlOnBlur } from "@/lib/money-brl"

normalizeMoneyBrlOnBlur("250") // "250,00"`}
        previewClassName="flex-col items-stretch gap-2"
      >
        {COLADOS.map(({ cru, por }) => {
          const final = normalizeMoneyBrlOnBlur(cru)
          return (
            <div key={cru} className="flex flex-wrap items-center gap-3">
              <Code className="w-20 shrink-0">{cru}</Code>
              <span className="text-2xs text-muted-foreground">→</span>
              <Code variant="inline" className="nums w-20 shrink-0">
                {final === "" ? "vazio" : final}
              </Code>
              <span className="text-xs text-muted-foreground">{por}</span>
            </div>
          )
        })}
      </DocSection>

      <DocNote title="A figura tabular é obrigatória; a Geist Mono é opcional">
        Com largura de dígito variável, o número se desloca a cada centavo e o
        olho perde o dígito que conferia. <code>mono</code> liga a Geist Mono,
        para o registro de livro-caixa, e vem desligado.
      </DocNote>

      <DocNote title="Três armadilhas que money já resolve">
        <code>type=&quot;text&quot;</code> e nunca <code>number</code>, que
        aceita <code>e</code> e <code>+</code> e briga com a vírgula pt-BR;{" "}
        <code>inputMode=&quot;decimal&quot;</code>, ou o telefone abre o teclado
        de texto; e renormalização no <code>onBlur</code>, para valor colado ou
        meio digitado sair limpo. Não escreva campo de dinheiro à mão.
      </DocNote>

      <DocNote title="money é uma união discriminada">
        Com <code>money</code>, <code>value</code> e <code>onValueChange</code>{" "}
        são obrigatórios e <code>onChange</code> não existe. O literal é
        obrigatório: <code>&lt;Input money={"{"}x{"}"}&gt;</code> com um booleano
        não compila. <code>InputGroupInput</code> e <code>SidebarInput</code>{" "}
        ficam no ramo base por <code>InputBaseProps</code>.
      </DocNote>

      <DocNote title="No telefone os quatro degraus medem o mesmo, e é de propósito">
        A demo acima mostra uma altura só num apontador grosso, porque os três
        degraus de baixo sobem ao <strong>piso de toque de 40px</strong>. Medido
        antes da regra existir: <code>sm</code> era uma caixa de 28px carregando
        uma linha de 24, e três dos quatro degraus ficavam abaixo do alvo que o
        dedo acerta. No dedo a hierarquia de altura não é usável — ela só produz
        alvos pequenos de tamanhos diferentes. A pergunta é sobre o{" "}
        <strong>apontador</strong> (<code>pointer-coarse:</code>) e não sobre a
        largura da janela, pela mesma razão que <code>hover: hover</code> é. O
        piso vale para os oito controles de campo, e 40 é o degrau que a{" "}
        <code>Toolbar</code> publica e o <code>Tabs</code> aplica.
      </DocNote>

      <DocNote title="No telefone o campo é 16px, e não é escolha de design">
        Safari do iOS dá zoom em campo com fonte abaixo de 16px, e o zoom costuma não voltar. Uma regra em <code>@layer base</code> força <code>1rem</code> abaixo de 768px.
      </DocNote>

      <DocNote title="Com ícone ou botão acoplado, é InputGroup">
        Lupa, prefixo, botão de limpar, unidade: tudo que encosta no campo mora no <code>InputGroup</code>, que veste a mesma superfície e o mesmo anel. Um ícone posicionado por cima de um <code>Input</code> não recebe o foco nem o recuo, e a busca com <code>type=&quot;search&quot;</code> desenharia o × azul do sistema — lá ele é suprimido e o botão é nosso.
      </DocNote>

      <DocNote title="Onde o app usa">
        <code>FormInput</code> é a forma das telas: 41 chamadas em 15 arquivos. O <code>Input</code> cru aparece 19 vezes em 13, onde o rótulo já vem de fora (filtros, busca, linhas de tabela). O modo <code>money</code> está em 16 campos de 10 arquivos — lançamento, filtros por valor, cartão, assinatura, categoria e o pagamento e o valor estimado das contas a pagar. O valor estimado era o último campo de dinheiro escrito à mão (<code>inputMode=&quot;decimal&quot;</code> sem máscara nem renormalização) e virou <code>money</code> na rodada 161.
      </DocNote>

      <DocNote title="size aqui não é o size do HTML">
        O <code>size</code> nativo de <code>&lt;input&gt;</code> é largura em
        caracteres; o tipo o remove com <code>Omit</code> para não colidir com o{" "}
        <code>size</code> de design.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"lg"',
            description:
              "Altura: sm 28, md 32, lg 36, xl 40 — a mesma escada do Button. Em apontador grosso, 40 nos quatro.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta a borda e o anel de destructive.",
          },
          {
            prop: "money",
            type: "true",
            description: "Liga o modo dinheiro. Literal, nunca variável: é o discriminante da união.",
          },
          {
            prop: "value",
            type: "string",
            description: "Com money, a string já mascarada — não é o número. Obrigatória.",
          },
          {
            prop: "onValueChange",
            type: "(raw: string, parsedReais: number | null) => void",
            description: "Só com money. Entrega a máscara e o valor em reais; null quando o campo está vazio.",
          },
          {
            prop: "mono",
            type: "boolean",
            default: "false",
            description: "Só com money. Geist Mono nas figuras; a figura tabular é sempre ligada.",
          },
          {
            prop: "…props de <input>",
            type: 'ComponentProps<"input">',
            description: "Vão para o elemento, menos o size nativo. Com money, type, defaultValue e onChange não existem.",
          },
          {
            prop: "inputMode",
            type: "string",
            default: '"decimal" com money',
            description: "O teclado que o telefone abre.",
          },
        ]}
      />
    </>
  )
}

function MoneyDemo() {
  const [texto, setTexto] = React.useState("42,90")
  const [reais, setReais] = React.useState<number | null>(42.9)

  return (
    <FormInput
      money
      label="Valor"
      description={`Em reais: ${String(reais)}`}
      fieldClassName="max-w-xs"
      value={texto}
      onValueChange={(masked, parsed) => {
        setTexto(masked)
        setReais(parsed)
      }}
    />
  )
}
