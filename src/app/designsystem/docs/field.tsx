"use client"

import Link from "next/link"
import * as React from "react"

import {
  Field,
  FieldContent,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldRow,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Radio } from "@/components/ui/radio"
import { RadioGroup } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function FieldDoc() {
  const [primeiraEm, setPrimeiraEm] = React.useState<Date | undefined>(
    new Date(2026, 3, 5)
  )

  return (
    <>
      <Usage>
        A estrutura de um campo — e a ligação entre as peças dele.{" "}
        <code>htmlFor</code>, <code>aria-describedby</code> e{" "}
        <code>aria-invalid</code> saem do <code>FieldControl</code>, não da
        memória de quem escreve a tela. O campo em que alguém esquecer é o campo
        que o leitor de tela não explica.
      </Usage>

      <DocSection
        title="Um campo ligado"
        description="Nenhum id nesta demonstração — nem aqui, nem no código ao lado. O Field gera, o FieldControl injeta, o FieldLabel aponta."
        code={`<Field>
  <FieldLabel>Descrição</FieldLabel>
  <FieldControl>
    <Input placeholder="Mercado" />
  </FieldControl>
  <FieldDescription>Aparece no extrato e na busca.</FieldDescription>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel>Descrição</FieldLabel>
          <FieldControl>
            <Input placeholder="Mercado" />
          </FieldControl>
          <FieldDescription>
            Aparece no extrato e na busca.
          </FieldDescription>
        </Field>
      </DocSection>

      <DocNote title="O que este componente prometia e não fazia">
        Três lugares do repositório diziam que o <code>Field</code> entregava os
        três atributos &quot;já ligados&quot;: o <code>AGENTS.md</code>, o índice
        de busca e esta página. Um quarto — <code>lib/field-classes.ts</code> —
        dizia o contrário, e era o que estava certo. A prova estava aqui mesmo:{" "}
        <strong>19 <code>htmlFor</code> escritos à mão</strong> em 313 linhas que
        anunciavam os três como automáticos. No app, 24{" "}
        <code>aria-invalid</code> contra 5 <code>aria-describedby</code> —
        campos marcados como inválidos cujo texto de erro nunca chegava ao
        leitor de tela.
      </DocNote>

      <DocSection
        title="O erro liga o campo inteiro"
        description="Renderizar um FieldError carimba data-invalid no Field e aria-invalid no controle, e soma o id do erro ao aria-describedby. Antes eram três fatos escritos à mão, e o terceiro quase nunca era."
        code={`<Field>
  <FieldLabel>Valor</FieldLabel>
  <FieldControl>
    <Input money value={valor} onValueChange={setValor} />
  </FieldControl>
  <FieldError>Informe um valor maior que zero.</FieldError>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel>Valor</FieldLabel>
          <FieldControl>
            <Input money value="0,00" onValueChange={() => {}} />
          </FieldControl>
          <FieldError>Informe um valor maior que zero.</FieldError>
        </Field>
      </DocSection>

      <DocNote title="O erro substitui a descrição">
        Duas linhas abaixo do campo, uma cinza e uma vermelha, competem pela
        mesma atenção. Quando as duas existem, o <code>aria-describedby</code>{" "}
        lista as duas — na ordem em que devem ser lidas —, mas a forma que se
        recomenda é trocar uma pela outra.
      </DocNote>

      <DocSection
        title="Vários erros de uma vez"
        description="FieldError aceita a lista errors em vez de children. Com um erro só ele escreve a frase; com vários vira lista, e mensagens repetidas são removidas — validação costuma disparar a mesma regra duas vezes."
        code={`<FieldError
  errors={[
    { message: "Informe um valor maior que zero." },
    { message: "A data não pode estar no passado." },
  ]}
/>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-sm">
          <FieldLabel>Valor</FieldLabel>
          <FieldControl>
            <Input money value="0,00" onValueChange={() => {}} />
          </FieldControl>
          <FieldError
            errors={[
              { message: "Informe um valor maior que zero." },
              { message: "A data não pode estar no passado." },
            ]}
          />
        </Field>
      </DocSection>

      <DocSection
        title="Os dois degraus"
        description="size mede o texto do andaime — rótulo, descrição e erro —, e nunca a altura do controle. Os nomes são os da escada de propósito: Field size=&quot;sm&quot; se escreve ao lado de Input size=&quot;sm&quot;."
        code={`<FieldGroup size="sm">
  <Field>
    <FieldLabel>Valor</FieldLabel>
    <FieldControl><Input size="sm" /></FieldControl>
    <FieldDescription>O rótulo e a ajuda encolhem juntos.</FieldDescription>
  </Field>
</FieldGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <FieldGroup size="md">
            <Field>
              <FieldLabel>Valor (md)</FieldLabel>
              <FieldControl>
                <Input size="md" placeholder="0,00" />
              </FieldControl>
              <FieldDescription>O degrau padrão.</FieldDescription>
            </Field>
          </FieldGroup>
          <FieldGroup size="sm">
            <Field>
              <FieldLabel>Valor (sm)</FieldLabel>
              <FieldControl>
                <Input size="sm" placeholder="0,00" />
              </FieldControl>
              <FieldDescription>O rótulo e a ajuda encolhem.</FieldDescription>
            </Field>
          </FieldGroup>
        </div>
      </DocSection>

      <DocNote title="O degrau existia sem nome">
        <strong>29 <code>&lt;Label className=&quot;text-xs&quot;&gt;</code></strong>{" "}
        no app — os formulários novos reduzem o rótulo, os antigos não — e{" "}
        <strong>73 textos de ajuda</strong> em <code>text-xs</code>/
        <code>text-2xs</code> enquanto o <code>FieldDescription</code> era{" "}
        <code>text-sm</code>. O eixo não inventou escala: deu nome à que já
        existia. Ele desce por <strong>contexto</strong>, e não por{" "}
        <code>in-data-[size=…]</code>: esse variante compila com{" "}
        <code>:where()</code>, que não soma especificidade, e perderia para a
        classe base no mesmo elemento.
      </DocNote>

      <DocSection
        title="Uma linha de dois campos"
        description="FieldRow empilha no telefone e divide em duas colunas a partir de sm. O app a escreve 8 vezes em 4 grafias, e em cinco delas os campos não empilham: dois selects de 160px num aparelho de 375."
        code={`<FieldRow>
  <Field>…</Field>
  <Field>…</Field>
</FieldRow>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldRow className="w-full max-w-md">
          <Field>
            <FieldLabel>Fecha dia</FieldLabel>
            <FieldControl>
              <Input defaultValue="28" inputMode="numeric" />
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel>Vence dia</FieldLabel>
            <FieldControl>
              <Input defaultValue="5" inputMode="numeric" />
            </FieldControl>
          </Field>
        </FieldRow>
      </DocSection>

      <DocSection
        title="Orientação"
        description="vertical empilha rótulo e controle. horizontal põe lado a lado, para uma chave ou caixa de seleção. responsive é vertical no estreito e vira horizontal quando o grupo em volta passa de 28rem — a virada é por container, não por viewport, então funciona dentro de um sheet estreito."
        code={`<FieldGroup>
  <Field orientation="responsive">
    <FieldContent>
      <FieldLabel>Lembrete</FieldLabel>
      <FieldDescription>Um aviso um dia antes.</FieldDescription>
    </FieldContent>
    <FieldControl><Switch /></FieldControl>
  </Field>
</FieldGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Lembrete</FieldLabel>
              <FieldDescription>Um aviso um dia antes.</FieldDescription>
            </FieldContent>
            <FieldControl>
              <Switch defaultChecked />
            </FieldControl>
          </Field>
          <FieldSeparator />
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel>Repetir todo mês</FieldLabel>
              <FieldDescription>
                Estreite a janela para vê-la empilhar.
              </FieldDescription>
            </FieldContent>
            <FieldControl>
              <Switch />
            </FieldControl>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocNote title="responsive precisa de um grupo em volta">
        Um contêiner não consulta a si mesmo: uma <em>container query</em> vale
        para os <strong>descendentes</strong> do contêiner, e a direção do flex
        é declarada no próprio <code>Field</code>. Por isso{" "}
        <code>orientation=&quot;responsive&quot;</code> exige um{" "}
        <code>FieldGroup</code>, <code>FieldSet</code> ou <code>FieldRow</code>{" "}
        em volta — sem um deles ela se comporta como <code>vertical</code>. Está
        dito aqui porque ela passou a existir sem nunca ter sido vista
        funcionando: <code>FieldGroup</code> tinha zero usos, inclusive neste
        catálogo.
      </DocNote>

      <DocSection
        title="Escolha em cartão"
        description="Um FieldLabel que envolve outro Field vira alvo inteiro: ganha contorno, cresce para a largura toda e acende quando a opção está marcada. O clique vale no cartão inteiro — e o ganho não é o alvo de toque, que o Radio já resolve com 44px: é a explicação caber junto da opção."
        code={`<FieldLabel htmlFor="mensal">
  <Field orientation="horizontal">
    <FieldContent>
      <FieldTitle>Mensal</FieldTitle>
      <FieldDescription>Cobrado todo dia 5.</FieldDescription>
    </FieldContent>
    <Radio value="mensal" id="mensal" />
  </Field>
</FieldLabel>`}
        previewClassName="flex-col items-stretch"
      >
        <RadioGroup defaultValue="mensal" className="w-full max-w-sm gap-3">
          {[
            ["mensal", "Mensal", "Cobrado todo dia 5."],
            ["anual", "Anual", "Dois meses de desconto."],
          ].map(([value, titulo, desc]) => (
            <FieldLabel key={value} htmlFor={`ds-field-plano-${value}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{titulo}</FieldTitle>
                  <FieldDescription>{desc}</FieldDescription>
                </FieldContent>
                <Radio value={value} id={`ds-field-plano-${value}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </DocSection>

      <DocNote title="O contorno do cartão é acento a 60%, e os dois números foram medidos">
        Ele era <code>border-primary/30</code>, e as duas metades estavam
        erradas. <strong>O token</strong>: no tema claro{" "}
        <code>--primary</code> e <code>--primary-accent</code> são a mesma cor,
        mas no escuro divergem — a 30% o antigo dava 1,32:1 contra 1,64:1 do
        acento. <strong>O alfa</strong>: 30% não bastava em tema nenhum.
        Varrendo os degraus contra o fundo real do cartão, 60% é o primeiro que
        alcança a norma de traço não-textual —{" "}
        <strong>3,01:1 no claro e 2,99:1 no escuro</strong>, contra 1,35 e 1,32
        do cartão não selecionado. E o realce ganhou par <code>active:</code> —
        sem ele, num alvo que é para o dedo, o toque não responde, porque{" "}
        <code>hover:</code> compila dentro de{" "}
        <code>@media (hover: hover)</code>: verificado no CSS emitido, onde a
        regra de <code>:hover</code> aninha a media query e a de{" "}
        <code>:active</code> não tem nenhuma.
      </DocNote>

      <DocSection
        title="Conjunto de campos"
        description="FieldSet com FieldLegend agrupa campos que só fazem sentido juntos. É um <fieldset> de verdade, então o leitor de tela anuncia a legenda antes de cada campo do grupo."
        code={`<FieldSet size="sm">
  <FieldLegend variant="label">Parcelamento</FieldLegend>
  <FieldGroup>
    <Field>…</Field>
  </FieldGroup>
</FieldSet>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldSet className="w-full max-w-sm">
          <FieldLegend>Parcelamento</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Parcelas</FieldLabel>
              <FieldControl>
                <Input defaultValue="12" inputMode="numeric" />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel optional>Primeira em</FieldLabel>
              <FieldControl>
                <DatePicker
                  value={primeiraEm}
                  onChange={setPrimeiraEm}
                  displayStyle="numeric"
                />
              </FieldControl>
            </Field>
          </FieldGroup>
        </FieldSet>
      </DocSection>

      <DocNote title="Marca-se o opcional, não o obrigatório">
        A convenção deste app é invertida, e é a que <code>optional</code>{" "}
        codifica: <code>bill-form-fields</code> escreve
        &quot;(opcional)&quot; dentro do texto do rótulo três vezes, e{" "}
        <code>edit-profile-dialog</code> mais uma. Não existe{" "}
        <strong>nenhum</strong> marcador de obrigatório no app — inventar um
        asterisco seria criar uma segunda convenção para o mesmo eixo.
      </DocNote>

      <DocSection
        title="Separador"
        description="FieldSeparator corta um grupo em dois assuntos. Com texto, o rótulo fica centrado por cima do fio."
        code={`<FieldSeparator />
<FieldSeparator>ou</FieldSeparator>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel>Descrição</FieldLabel>
            <FieldControl>
              <Input placeholder="Mercado" />
            </FieldControl>
          </Field>
          <FieldSeparator>ou</FieldSeparator>
          <Field>
            <FieldLabel>Colar do extrato</FieldLabel>
            <FieldControl>
              <Input placeholder="Cole a linha aqui" />
            </FieldControl>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocSection
        title="Valor fixo no começo e no fim"
        description="Unidade que nunca muda não se digita: vira addon. O addon é alvo de clique — tocar nele foca o campo, então ele não vira uma zona morta ao lado do que se quer escrever."
        code={`<Field>
  <FieldLabel>Juros</FieldLabel>
  <InputGroup>
    <FieldControl><InputGroupInput placeholder="1,5" /></FieldControl>
    <InputGroupAddon align="inline-end">
      <InputGroupText>% a.m.</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel>Juros</FieldLabel>
            <InputGroup>
              <FieldControl>
                <InputGroupInput placeholder="1,5" />
              </FieldControl>
              <InputGroupAddon align="inline-end">
                <InputGroupText>% a.m.</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </DocSection>

      <DocNote title="FieldControl embrulha o controle, nunca o invólucro">
        <code>Select.Root</code> e companhia não renderizam nó nenhum, então{" "}
        <code>&lt;FieldControl&gt;&lt;Select&gt;…&lt;/Select&gt;&lt;/FieldControl&gt;</code>{" "}
        clona um componente que não vira DOM: o <code>id</code> não chega a
        lugar algum e o rótulo passa a apontar para o vazio — o defeito que este
        componente existe para eliminar. O embrulho vai no gatilho:{" "}
        <code>
          &lt;Select&gt;&lt;FieldControl&gt;&lt;SelectTrigger/&gt;&lt;/FieldControl&gt;…&lt;/Select&gt;
        </code>
        . Vale igual para o <code>InputGroup</code>: o embrulho vai no{" "}
        <code>InputGroupInput</code>, senão o <code>id</code> pousa na{" "}
        <code>div</code> do grupo e o <code>&lt;label for&gt;</code> aponta para
        um elemento que não é rotulável — existe, e não faz nada. A
        demonstração desta casa errou os dois primeiro, e foi a medição que
        apontou.
      </DocNote>

      <DocNote title="Para dinheiro o modo é <Input money>">
        O addon acima é exemplo de unidade, não de como se pede um valor em
        reais. <code>&lt;Input money&gt;</code> resolve máscara, teclado numérico
        e conversão; um <code>InputGroup</code> com <code>R$</code> na frente
        deixa isso tudo para a tela. A forma curta, com rótulo e erro já
        ligados, é <code>&lt;FormInput money&gt;</code>.
      </DocNote>

      <DocNote title="Field não é o formulário">
        Quem cuida do envio e do comportamento do <kbd>Enter</kbd> é o{" "}
        <code>Form</code>. <code>Field</code> cuida de um campo. Os dois se
        compõem, e o padrão inteiro está em{" "}
        <Link href="/designsystem/formularios" className="underline">
          Formulários e Enter
        </Link>
        .
      </DocNote>

      <PropsTable
        title="Field"
        rows={[
          {
            prop: "orientation",
            type: '"vertical" | "horizontal" | "responsive"',
            default: '"vertical"',
            description:
              "responsive exige FieldGroup / FieldSet / FieldRow em volta — um contêiner não consulta a si mesmo.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: "herdado, ou md",
            description:
              "O texto do andaime. Nunca a altura do controle: um Field não sabe que controle carrega.",
          },
          {
            prop: "invalid",
            type: "boolean",
            description:
              "Só para validação que mora fora do campo. Com um FieldError renderizado, é desnecessário.",
          },
          {
            prop: "disabled",
            type: "boolean",
            description: "Apaga rótulo e título. Não desabilita o controle.",
          },
          {
            prop: "role",
            type: "string",
            description:
              "Opcional, e agora não vem de fábrica. Passe-o quando o Field de fato agrupa (um RadioGroup, uma grade); o aria-labelledby aponta para o FieldLabel sozinho.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "FieldControl",
            type: "{ children: ReactElement }",
            description:
              "Injeta id, aria-describedby e aria-invalid no filho único. Compõe o aria-describedby em vez de substituí-lo — é por isso que ele não é um Slot.",
          },
          {
            prop: "FieldLabel",
            type: "Label & { optional?: boolean }",
            description:
              "htmlFor sai sozinho, e só quando existe um FieldControl. Apontar para um id ausente deixa o rótulo órfão.",
          },
          {
            prop: "FieldError",
            type: "{ errors?: { message?: string }[] }",
            description:
              "Renderizá-lo é o que torna o campo inválido. Com errors, deduplica e vira lista.",
          },
          {
            prop: "FieldRow",
            type: "div",
            description: "Dois campos lado a lado a partir de sm. Empilha antes.",
          },
          {
            prop: "FieldSet / FieldLegend",
            type: "fieldset / legend",
            description:
              "O grupo de verdade. FieldLegend variant=\"label\" segue o degrau — é o que faltava para ela servir aos ~50 cabeçalhos de seção do app.",
          },
        ]}
      />
    </>
  )
}
