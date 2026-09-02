"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
import {
  FormPickerPopover,
  FormPickerPopoverContent,
  FormPickerPopoverEmpty,
  FormPickerPopoverFooter,
  FormPickerPopoverFooterAction,
  FormPickerPopoverItem,
  FormPickerPopoverList,
  FormPickerPopoverPlaceholder,
  FormPickerPopoverSearch,
  FormPickerPopoverTrigger,
} from "@/components/ui/form-picker-popover"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CARTOES = [
  { nome: "Nubank", fim: "4412" },
  { nome: "Itaú", fim: "8830" },
  { nome: "Inter", fim: "2091" },
  { nome: "C6", fim: "7745" },
  { nome: "BTG", fim: "1203" },
  { nome: "Will", fim: "6658" },
  { nome: "Neon", fim: "3317" },
]

export default function FormPickerPopoverDoc() {
  return (
    <>
      <Usage>
        Um seletor ancorado num campo, com a largura do gatilho, folga de
        colisão e altura limitada — e as três faixas que sempre vão dentro
        dele: busca, lista rolável e um pé com a saída para gerenciar o que a
        lista mostra. Quando a lista é curta e não precisa de busca, o certo é{" "}
        <code>Select</code>; quando ela é longa mas cabe numa palavra, é{" "}
        <code>Combobox</code>.
      </Usage>

      <DocSection
        title="Em uso"
        code={`<FormPickerPopover open={open} onOpenChange={setOpen}>
  <FormPickerPopoverTrigger id="cartao">
    {escolhido ? escolhido.nome : (
      <FormPickerPopoverPlaceholder>Selecione o cartão</FormPickerPopoverPlaceholder>
    )}
  </FormPickerPopoverTrigger>
  <FormPickerPopoverContent>
    <FormPickerPopoverSearch
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      placeholder="Buscar cartão…"
    />
    <FormPickerPopoverList>
      {filtrados.map((c) => (
        <FormPickerPopoverItem
          key={c.nome}
          selected={c.nome === escolhido?.nome}
          onClick={() => pick(c)}
        >
          {c.nome}
        </FormPickerPopoverItem>
      ))}
    </FormPickerPopoverList>
    <FormPickerPopoverFooter>
      <FormPickerPopoverFooterAction>
        <Link href="/settings/credit-cards">Cadastrar cartão</Link>
      </FormPickerPopoverFooterAction>
    </FormPickerPopoverFooter>
  </FormPickerPopoverContent>
</FormPickerPopover>`}
        previewClassName="items-stretch"
      >
        <PickerDemo />
      </DocSection>

      <DocNote title="A demo está dentro de um CustomForm, e é de propósito">
        Este seletor só existe dentro de formulário, e é lá que ele encontra o{" "}
        <code>Enter</code>. O popover é portalizado para fora do{" "}
        <code>&lt;form&gt;</code> no DOM, mas eventos de portal do React sobem
        pela árvore do <strong>React</strong> — então o teclado do campo de
        busca alcança o <code>CustomForm</code> assim mesmo. Demonstrar o
        componente fora de um formulário era esconder justamente o caso que
        importa.
      </DocNote>

      <DocNote title="O gatilho veste a superfície de campo">
        Ele era <code>Button variant=&quot;outline&quot;</code>, e a nota daqui
        dizia que &ldquo;parece um campo e não um botão&rdquo;. Parecia só sob{" "}
        <code>dark:</code>: no tema claro <code>outline</code> é{" "}
        <code>border-border</code> + <code>bg-background</code> <strong>opaco</strong>,
        enquanto <code>Input</code> e <code>SelectTrigger</code> são{" "}
        <code>border-input</code> + <code>bg-input-fill/30</code> translúcido —
        duas superfícies visivelmente diferentes fazendo o mesmo trabalho. Hoje
        ele compõe <code>field-classes</code>, como <code>Select</code>,{" "}
        <code>Combobox</code> e <code>DatePicker</code>. A altura não mudou:{" "}
        <code>xl</code> (40) é a que ele já tinha, e a conversão é de superfície.
      </DocNote>

      <DocNote title="O foco volta ao gatilho ao fechar">
        <code>onOpenAutoFocus</code> continua com <code>preventDefault()</code>:
        roubar o foco ao abrir fecha o teclado do telefone e faz a folha inteira
        saltar. <code>onCloseAutoFocus</code> <strong>não</strong> — ele vinha
        prevenido também, e como o campo de busca fica dentro do popover, fechar
        pelo teclado deixava o foco no <code>&lt;body&gt;</code>. A justificativa
        era o salto de rolagem, mas o Radix já devolve o foco com{" "}
        <code>preventScroll: true</code>: o <code>preventDefault</code> não
        comprava nada e custava a volta.
      </DocNote>

      <DocNote title="As faixas, e por que elas não moram na tela">
        Busca, lista e pé são as mesmas três faixas que o <code>Card</code> chama
        de <code>CardToolbar</code> / corpo / <code>CardFooter</code>. Antes
        desta revisão as três telas que usam o seletor escreviam cada faixa à
        mão — <code>shrink-0 border-t border-border/50 bg-muted/25 p-2</code>{" "}
        aparecia três vezes, idêntico. <code>FormPickerPopoverList</code> traz
        junto o <code>onWheel</code> que para a propagação, que uma string de
        classes nunca conseguiu carregar.
      </DocNote>

      <DocNote title="O vazio também é do componente">
        Três telas escrevem a mensagem de lista vazia à mão, em duas grafias —{" "}
        <code>px-1 py-6 text-center</code> nos seletores de categoria e{" "}
        <code>py-4 text-center</code> no de cartão —, e esta demonstração tinha
        inventado uma terceira. <code>FormPickerPopoverEmpty</code> fixa o
        respiro e a tinta; o texto continua de quem chama, porque
        &ldquo;nenhuma categoria encontrada&rdquo; (busca sem resultado) e
        &ldquo;nenhum cartão cadastrado&rdquo; (ausência de dado) não são a
        mesma frase.
      </DocNote>

      <DocNote title="A linha responde ao dedo">
        <code>FormPickerPopoverItem</code> tem <code>min-h-11</code> — os 44px de
        alvo — e o realce vem com o par <code>active:</code>. As linhas escritas
        à mão nas telas acendem no cursor e não respondem ao toque, num seletor
        que existe para o toque. É a regra <strong>H</strong> do auditor, e as
        quatro ocorrências continuam lá até as telas migrarem.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "FormPickerPopover",
            type: "ComponentProps<typeof Popover>",
            default: "modal={isMobile}",
            description:
              "A raiz. No telefone tranca a rolagem do documento, senão rolar a lista arrasta a folha que a contém.",
          },
          {
            prop: "FormPickerPopoverTrigger",
            type: "ComponentProps<typeof Button>",
            default: 'variant="outline" size="xl"',
            description:
              "O gatilho é o campo: altura da escada, peso normal, e o chevron que gira ao abrir.",
          },
          {
            prop: "FormPickerPopoverSearch",
            type: "ComponentProps<typeof InputGroupInput>",
            default: 'size="lg"',
            description:
              "Sobre InputGroup — a lupa é um rótulo de verdade, ligado ao campo por htmlFor, e não um ícone absolute com pl-9.",
          },
          {
            prop: "FormPickerPopoverList",
            type: 'ComponentProps<"div">',
            description:
              "A região rolável, com touch-pan-y, overscroll-contain e o onWheel que para a propagação.",
          },
          {
            prop: "FormPickerPopoverItem",
            type: 'ComponentProps<"button"> & { selected?: boolean }',
            default: "selected={false}",
            description:
              "A linha: 44px de alvo, par hover/active e aria-pressed.",
          },
          {
            prop: "FormPickerPopoverEmpty",
            type: 'ComponentProps<"p">',
            description:
              "A lista vazia: respiro e tinta fixos, texto de quem chama.",
          },
          {
            prop: "formPickerListScrollClassName",
            type: "string",
            description:
              "As classes soltas da região rolável. Sobrevive porque três telas ainda a importam; o destino é FormPickerPopoverList.",
          },
        ]}
      />
    </>
  )
}

function PickerDemo() {
  const [aberto, setAberto] = React.useState(false)
  const [busca, setBusca] = React.useState("")
  const [escolhido, setEscolhido] = React.useState<
    (typeof CARTOES)[number] | null
  >(null)
  const [enviou, setEnviou] = React.useState(0)

  const filtrados = CARTOES.filter((c) =>
    c.nome.toLowerCase().includes(busca.trim().toLowerCase())
  )

  return (
    <CustomForm
      id="ds-picker-form"
      className="flex w-full max-w-xs flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setEnviou((n) => n + 1)
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ds-picker">Cartão</Label>
        <FormPickerPopover
          open={aberto}
          onOpenChange={(o) => {
            setAberto(o)
            if (!o) setBusca("")
          }}
        >
          <FormPickerPopoverTrigger id="ds-picker">
            {escolhido ? (
              <span className="truncate">
                {escolhido.nome} · •••• {escolhido.fim}
              </span>
            ) : (
              <FormPickerPopoverPlaceholder>
                Selecione o cartão
              </FormPickerPopoverPlaceholder>
            )}
          </FormPickerPopoverTrigger>
          <FormPickerPopoverContent>
            <FormPickerPopoverSearch
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onClear={() => setBusca("")}
              placeholder="Buscar cartão…"
            />
            <FormPickerPopoverList>
              {filtrados.length > 0 ? (
                filtrados.map((c) => (
                  <FormPickerPopoverItem
                    key={c.nome}
                    selected={c.nome === escolhido?.nome}
                    onClick={() => {
                      setEscolhido(c)
                      setAberto(false)
                    }}
                  >
                    <span className="truncate">{c.nome}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground nums">
                      •••• {c.fim}
                    </span>
                  </FormPickerPopoverItem>
                ))
              ) : (
                <FormPickerPopoverEmpty>
                  Nenhum cartão com esse nome.
                </FormPickerPopoverEmpty>
              )}
            </FormPickerPopoverList>
            <FormPickerPopoverFooter>
              <FormPickerPopoverFooterAction>
                <Link href="/settings/credit-cards">Cadastrar cartão</Link>
              </FormPickerPopoverFooterAction>
            </FormPickerPopoverFooter>
          </FormPickerPopoverContent>
        </FormPickerPopover>
      </div>

      {/* O submit existe para o Enter ter um alvo — é ele que prova que o
          Enter na busca não salva o formulário.

          A ação fica à direita, como em todo `DialogFooter` do app
          (`sm:flex-row sm:justify-end`): uma página que demonstra o sistema não
          pode inverter o rodapé dele. E o contador vem antes porque é leitura
          sobre o que o botão faz, não uma segunda ação. */}
      <div className="flex items-center justify-end gap-3">
        <span
          aria-live="polite"
          className="text-xs text-muted-foreground"
          data-testid="ds-picker-submits"
        >
          {enviou === 0 ? "não enviado" : `enviado ${enviou}×`}
        </span>
        <Button type="submit" size="lg">
          Salvar
        </Button>
      </div>
    </CustomForm>
  )
}
