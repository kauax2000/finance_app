"use client"

import * as React from "react"
import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuHeader,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  contextMenuTargets,
} from "@/components/ui/context-menu"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

/** A área de clique das demonstrações: o alvo, e não um enfeite. */
const AREA =
  "flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"

const LANCAMENTOS = [
  { id: "1", nome: "Mercado", data: "12 set", valor: -42.9 },
  { id: "2", nome: "Farmácia", data: "11 set", valor: -18.5 },
  { id: "3", nome: "Salário", data: "05 set", valor: 5200 },
  { id: "4", nome: "Academia", data: "03 set", valor: -99.9 },
]

function PadraoDemo() {
  const [size, setSize] = React.useState<"auto" | "sm" | "md" | "lg" | "xl">(
    "lg"
  )
  return (
    <>
      <Controles
        inicio={
          <Eixo rotulo="size" valores={["auto", "sm", "md", "lg", "xl"] as const} valor={size} onChange={setSize} />
        }
      />
      <ContextMenu>
        <ContextMenuTrigger className={AREA}>
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent size={size}>
          <ContextMenuItem>
            <PencilIcon aria-hidden />
            Editar
          </ContextMenuItem>
          <ContextMenuItem>
            <DocumentDuplicateIcon aria-hidden />
            Duplicar
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            <TrashIcon aria-hidden />
            Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  )
}

function AlvoDemo() {
  const [forma, setForma] = React.useState<"header" | "detalhe">("header")
  return (
    <>
      <Controles
        fim={
          <Eixo
            rotulo="versão"
            valores={["header", "detalhe"] as const}
            valor={forma}
            onChange={setForma}
            rotulos={{ header: "Cabeçalho", detalhe: "Atalho e descrição" }}
          />
        }
      />
      <ContextMenu>
        <ContextMenuTrigger className={AREA}>
          Mercado · −R$ 42,90
        </ContextMenuTrigger>
        <ContextMenuContent
          size="xl"
          header={
            forma === "header" ? (
              <ContextMenuHeader
                title="Mercado"
                description="12 set · −R$ 42,90"
              />
            ) : undefined
          }
        >
          <ContextMenuItem shortcut={forma === "detalhe" ? "mod+o" : undefined}>
            <ArrowTopRightOnSquareIcon aria-hidden />
            Abrir
          </ContextMenuItem>
          <ContextMenuItem shortcut={forma === "detalhe" ? "mod+e" : undefined}>
            <PencilIcon aria-hidden />
            Editar
          </ContextMenuItem>
          <ContextMenuItem
            disabled
            description={
              forma === "detalhe" ? "A fatura deste cartão já fechou" : undefined
            }
          >
            <DocumentDuplicateIcon aria-hidden />
            Mover para a próxima fatura
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            description={
              forma === "detalhe" ? "Sai do saldo e das faturas" : undefined
            }
          >
            <TrashIcon aria-hidden />
            Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  )
}

function MarcarDemo() {
  const [colunas, setColunas] = React.useState({ categoria: true, cartao: false })
  const [ordem, setOrdem] = React.useState("data")
  return (
    <ContextMenu>
      <ContextMenuTrigger className={AREA}>
        Cabeçalho da tabela
      </ContextMenuTrigger>
      <ContextMenuContent size="lg">
        <ContextMenuLabel>Colunas</ContextMenuLabel>
        <ContextMenuCheckboxItem
          checked={colunas.categoria}
          onCheckedChange={(v) => setColunas((c) => ({ ...c, categoria: v }))}
        >
          Categoria
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={colunas.cartao}
          onCheckedChange={(v) => setColunas((c) => ({ ...c, cartao: v }))}
        >
          Cartão
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Ordenar por</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup value={ordem} onValueChange={setOrdem}>
              <ContextMenuRadioItem value="data">Data</ContextMenuRadioItem>
              <ContextMenuRadioItem value="valor">Valor</ContextMenuRadioItem>
              <ContextMenuRadioItem value="nome">Nome</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** O alvo é a linha, sem nó no meio; ela acende enquanto o menu está aberto. */
function LinhaDemo() {
  return (
    <ItemGroup className="w-full max-w-md">
      {LANCAMENTOS.slice(0, 3).map((l) => (
        <ContextMenu key={l.id}>
          <ContextMenuTrigger asChild>
            <Item variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>{l.nome}</ItemTitle>
                <ItemDescription>{l.data}</ItemDescription>
              </ItemContent>
              <MoneyDisplay value={l.valor} signed />
            </Item>
          </ContextMenuTrigger>
          <ContextMenuContent
            size="lg"
            header={<ContextMenuHeader title={l.nome} description={l.data} />}
          >
            <ContextMenuItem>
              <PencilIcon aria-hidden />
              Editar
            </ContextMenuItem>
            <ContextMenuItem variant="destructive">
              <TrashIcon aria-hidden />
              Excluir
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </ItemGroup>
  )
}

function SelecaoDemo() {
  const [selecionados, setSelecionados] = React.useState<Set<string>>(
    () => new Set(["1", "2"])
  )
  const [aviso, setAviso] = React.useState("")

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ItemGroup>
        {LANCAMENTOS.map((l) => {
          const alvos = contextMenuTargets(l.id, selecionados)
          const varios = alvos.length > 1
          return (
            <ContextMenu key={l.id}>
              <ContextMenuTrigger asChild>
                <Item variant="outline" size="sm">
                  <ItemMedia>
                    <Checkbox
                      aria-label={`Selecionar ${l.nome}`}
                      checked={selecionados.has(l.id)}
                      onCheckedChange={(v) =>
                        setSelecionados((prev) => {
                          const next = new Set(prev)
                          if (v === true) next.add(l.id)
                          else next.delete(l.id)
                          return next
                        })
                      }
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{l.nome}</ItemTitle>
                  </ItemContent>
                  <MoneyDisplay value={l.valor} signed />
                </Item>
              </ContextMenuTrigger>
              <ContextMenuContent
                size="xl"
                header={
                  <ContextMenuHeader
                    title={varios ? `${alvos.length} lançamentos` : l.nome}
                    description={varios ? "Selecionados" : l.data}
                  />
                }
              >
                {varios ? null : (
                  <ContextMenuItem>
                    <PencilIcon aria-hidden />
                    Editar
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  variant="destructive"
                  onSelect={() =>
                    setAviso(
                      varios
                        ? `Excluiria ${alvos.length} lançamentos.`
                        : `Excluiria ${l.nome}.`
                    )
                  }
                >
                  <TrashIcon aria-hidden />
                  {varios ? `Excluir ${alvos.length} lançamentos` : "Excluir"}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </ItemGroup>
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {aviso}
      </p>
    </div>
  )
}

function TecladoDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={`${AREA} gap-2`}>
        <Button type="button" variant="secondary" size="sm">
          foque aqui e tecle shift+f10
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent size="lg">
        <ContextMenuItem>
          <PencilIcon aria-hidden />
          Editar
        </ContextMenuItem>
        <ContextMenuItem variant="destructive">
          <TrashIcon aria-hidden />
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default function ContextMenuDoc() {
  return (
    <>
      <Usage>
        As ações do <code>DropdownMenu</code>, abertas pelo botão direito, pelo{" "}
        <strong>toque longo</strong> e por Shift+F10. É atalho,{" "}
        <strong>nunca</strong> o único caminho: nenhum desses gestos se vê na
        tela, e toda ação daqui precisa existir também num lugar visível — o
        menu de três pontos da linha, por exemplo.
      </Usage>

      <DocSection
        title="Padrão"
        description={
          <>
            A largura é a escada do <code>DropdownMenuContent</code>:{" "}
            <code>sm</code> 176 · <code>md</code> 192 · <code>lg</code> 208 ·{" "}
            <code>xl</code> 224, e <code>auto</code> pelo conteúdo. Nenhuma
            chamada escreve <code>w-52</code>.
          </>
        }
        code={`<ContextMenu>
  <ContextMenuTrigger>…</ContextMenuTrigger>
  <ContextMenuContent size="lg">
    <ContextMenuItem><PencilIcon aria-hidden />Editar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">…</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <PadraoDemo />
      </DocSection>

      <DocSection
        title="O alvo, o atalho e a descrição"
        description={
          <>
            O menu de contexto nasce longe do que foi clicado, então{" "}
            <code>header</code> diz sobre o que ele age — e o título nomeia o
            menu para o leitor de tela. <code>shortcut</code> desenha a tecla
            com o <code>Kbd</code> (⌘E no Mac, Ctrl+E no resto), e é a dica de
            um atalho que já existe na tela. <code>description</code> é a
            segunda linha: a consequência de um item, ou por que ele está
            desabilitado.
          </>
        }
        code={`<ContextMenuContent
  size="xl"
  header={<ContextMenuHeader title="Mercado" description="12 set · −R$ 42,90" />}
>
  <ContextMenuItem shortcut="mod+e">…Editar</ContextMenuItem>
  <ContextMenuItem disabled description="A fatura deste cartão já fechou">
    …
  </ContextMenuItem>
</ContextMenuContent>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <AlvoDemo />
      </DocSection>

      <DocSection
        title="Marcar, escolher e submenu"
        description="Caixa é tique, rádio é ponto — a diferença entre “quantas quiser” e “escolha uma”. O submenu abre pela seta, para o lado."
        previewClassName="items-stretch"
      >
        <MarcarDemo />
      </DocSection>

      <DocSection
        title="O alvo é a linha"
        description={
          <>
            Com <code>asChild</code> o gatilho é o próprio <code>Item</code>, a{" "}
            <code>TableRow</code> ou o <code>Card</code>, sem nó no meio, e ele
            acende enquanto o menu dele está aberto. Um menu por linha.
          </>
        }
        code={`<ContextMenu>
  <ContextMenuTrigger asChild>
    <Item>…</Item>
  </ContextMenuTrigger>
  <ContextMenuContent header={…}>…</ContextMenuContent>
</ContextMenu>`}
      >
        <LinhaDemo />
      </DocSection>

      <DocSection
        title="Ações da seleção"
        description={
          <>
            Sobre uma linha selecionada, o menu age em <strong>toda</strong> a
            seleção, e o cabeçalho diz quantas; fora dela, só na linha, e a
            seleção não muda. <code>contextMenuTargets(id, selecionados)</code>{" "}
            é a regra, para nenhuma tela decidir diferente.
          </>
        }
        code={`const alvos = contextMenuTargets(linha.id, selecionados)
// alvos.length > 1 → "Excluir 2 lançamentos"`}
      >
        <SelecaoDemo />
      </DocSection>

      <DocSection
        title="Teclado e toque"
        description={
          <>
            Shift+F10 e a tecla Menu abrem o menu sob o elemento focado — o
            alvo ou um botão dentro dele, e o foco volta a ele ao fechar. No
            toque, o Radix abre com o dedo parado por 700ms e já desliga o
            balão do iOS; ao soltar, a linha não recebe clique (medido no
            Chromium), então o detalhe não abre por baixo do menu.
          </>
        }
      >
        <TecladoDemo />
      </DocSection>

      <DocNote title="Por que o toque longo não basta">
        Ele abre, mas não se anuncia: ninguém descobre um gesto que a tela não
        mostra. Por isso a regra continua — o menu de contexto repete ações que
        já estão à vista, e nunca é o único caminho até elas.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "ContextMenuContent size",
            type: '"auto" | "sm" | "md" | "lg" | "xl"',
            default: '"auto"',
            description: "A largura, na escada do DropdownMenuContent.",
          },
          {
            prop: "ContextMenuContent header",
            type: "ReactNode",
            description:
              "A faixa do alvo (ContextMenuHeader), irmã do viewport, com o fio.",
          },
          {
            prop: "ContextMenuHeader title / description",
            type: "ReactNode",
            description:
              "O nome do alvo e a legenda. O título nomeia o menu (aria-labelledby).",
          },
          {
            prop: "ContextMenuItem shortcut",
            type: "string",
            description:
              'A tecla, na grafia do Kbd ("mod+e"). Só desenha: a tecla tem de existir na tela.',
          },
          {
            prop: "ContextMenuItem description",
            type: "ReactNode",
            description:
              "A segunda linha, alinhada com o rótulo. Também o porquê de um item desabilitado.",
          },
          {
            prop: "ContextMenuItem variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description: "O que não tem volta.",
          },
          {
            prop: "ContextMenuTrigger asChild",
            type: "boolean",
            description:
              "O alvo é o filho (linha, Item, Card). Acende com data-state=open.",
          },
          {
            prop: "contextMenuTargets",
            type: "(id, selecionados) => id[]",
            description:
              "A seleção inteira se a linha está nela; senão, só a linha.",
          },
        ]}
      />
    </>
  )
}
