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
          Um seletor ancorado num campo, com a largura do gatilho e altura limitada, e três faixas: busca, lista rolável e um pé com a saída para gerenciar o que a lista mostra. Lista curta sem busca é <code>Select</code>; longa mas que cabe numa palavra é <code>Combobox</code>.
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
        <Link href="/credit-cards">Cadastrar cartão</Link>
      </FormPickerPopoverFooterAction>
    </FormPickerPopoverFooter>
  </FormPickerPopoverContent>
</FormPickerPopover>`}
        previewClassName="items-stretch"
      >
        <PickerDemo />
      </DocSection>

      <DocNote title="Ele vive dentro de formulário, e o Enter o alcança">
          O popover é portalizado para fora do <code>&lt;form&gt;</code> no DOM, mas eventos de portal sobem pela árvore do React: o teclado da busca chega ao formulário. Por isso a demonstração fica dentro de um <code>CustomForm</code>, e a regra do Enter para a busca mora em <code>form.tsx</code>.
      </DocNote>

      <DocNote title="O gatilho veste a superfície de campo">
          Ele compõe <code>field-classes</code>, como <code>Input</code>, <code>Select</code> e <code>DatePicker</code>, na altura <code>xl</code>. Não o troque por <code>Button variant=&quot;outline&quot;</code>: no tema claro seria uma superfície diferente fazendo o mesmo trabalho.
      </DocNote>

      <DocNote title="Não rouba o foco ao abrir; devolve ao fechar">
          Abrir sem roubar o foco evita fechar o teclado do telefone e saltar a folha. Ao fechar o foco volta ao gatilho — o Radix já usa <code>preventScroll</code> —, senão quem fecha pelo teclado fica no <code>&lt;body&gt;</code>.
      </DocNote>

      <DocNote title="Use as faixas, não escreva a anatomia na tela">
          Busca, lista e pé são as faixas do <code>Card</code>. <code>FormPickerPopoverList</code> traz junto o <code>onWheel</code> que para a propagação, que uma string de classes não carrega.
      </DocNote>

      <DocNote title="O vazio é do componente; o texto, de quem chama">
          <code>FormPickerPopoverEmpty</code> fixa respiro e tinta. A frase muda: &ldquo;nenhuma categoria encontrada&rdquo; é busca sem resultado, &ldquo;nenhum cartão cadastrado&rdquo; é ausência de dado.
      </DocNote>

      <DocNote title="A linha responde ao dedo">
          <code>FormPickerPopoverItem</code> tem 44px de alvo e o par <code>active:</code> junto do realce. Linha escrita à mão que só acende no cursor fica inerte no toque.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "FormPickerPopover",
            type: "ComponentProps<typeof Popover>",
            default: "modal={isMobile}",
            description:
              "A raiz; no telefone tranca a rolagem para a lista não arrastar a folha.",
          },
          {
            prop: "FormPickerPopoverTrigger",
            type: 'Omit<ComponentProps<"button">, "size"> & { size?: "sm" | "md" | "lg" | "xl" }',
            default: 'size="xl"',
            description:
              "O gatilho é o campo: field-classes, altura da escada e chevron que gira.",
          },
          {
            prop: "FormPickerPopoverSearch",
            type: "ComponentProps<typeof InputGroupInput>",
            default: 'size="lg"',
            description:
              "Sobre InputGroup, com a lupa como rótulo ligado ao campo.",
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
              "As classes soltas da região rolável; prefira FormPickerPopoverList.",
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
                <Link href="/credit-cards">Cadastrar cartão</Link>
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
