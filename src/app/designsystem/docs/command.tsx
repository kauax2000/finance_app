"use client"

import { Cog6ToothIcon, CreditCardIcon, PlusIcon, WalletIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandFooter,
  CommandHint,
  CommandItemContent,
  CommandItemDescription,
  CommandItemTitle,
  CommandLoading,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CommandDoc() {
  return (
    <>
      <Usage>
        A paleta de comandos: uma busca que encontra telas, ações e registros ao mesmo tempo. Para escolher o valor de um campo, use <code>Combobox</code>; para as ações de um objeto, <code>DropdownMenu</code>.
      </Usage>

      <DocSection
        title="Inline"
        description="A mesma lista, sem o diálogo. Serve dentro de um popover ou de uma folha."
        code={`<Command>
  <CommandInput placeholder="Buscar…" />
  <CommandList>
    <CommandEmpty>Nada encontrado.</CommandEmpty>
    <CommandGroup heading="Ir para">
      <CommandItem>Carteiras</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`}
        previewClassName="items-stretch"
      >
        <Command variant="panel" autoSelectFirst={false} className="w-full max-w-md">
          <CommandInput placeholder="Buscar tela, ação ou transação…" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Ir para">
              <CommandItem>
                <WalletIcon aria-hidden />
                Carteiras
              </CommandItem>
              <CommandItem>
                <CreditCardIcon aria-hidden />
                Cartões
              </CommandItem>
              <CommandItem>
                <Cog6ToothIcon aria-hidden />
                Configurações
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Ações">
              <CommandItem>
                <PlusIcon aria-hidden />
                Nova transação
                <CommandShortcut>
                  <Kbd keys="mod+n" />
                </CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DocSection>

      <DocSection
        title="Como diálogo (⌘K ou Ctrl+K)"
        code={`const [open, setOpen] = React.useState(false)

React.useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((v) => !v)
    }
  }
  document.addEventListener("keydown", onKey)
  return () => document.removeEventListener("keydown", onKey)
}, [])

<CommandDialog open={open} onOpenChange={setOpen}>…</CommandDialog>`}
      >
        <CommandDialogDemo />
      </DocSection>

      <DocSection
        title="Linha de duas linhas"
        code={`<CommandItem>
  <CommandItemContent>
    <CommandItemTitle>Nova transação</CommandItemTitle>
    <CommandItemDescription>Lança uma despesa ou receita</CommandItemDescription>
  </CommandItemContent>
  <CommandShortcut><Kbd keys="mod+n" /></CommandShortcut>
</CommandItem>`}
      >
        <Command variant="panel" autoSelectFirst={false} className="max-w-sm">
          <CommandList>
            <CommandGroup heading="Ações">
              {[
                ["Nova transação", "Lança uma despesa ou receita", "mod+n"],
                ["Nova fatura", "Registra uma conta a pagar", "mod+f"],
              ].map(([t, d, k]) => (
                <CommandItem key={t}>
                  <CommandItemContent>
                    <CommandItemTitle>{t}</CommandItemTitle>
                    <CommandItemDescription>{d}</CommandItemDescription>
                  </CommandItemContent>
                  <CommandShortcut>
                    <Kbd keys={k} />
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DocSection>

      <DocSection
        title="Vazio e carregando"
        code={`<CommandEmpty>
  <CommandEmptyTitle>Nada encontrado para "xyz".</CommandEmptyTitle>
  <CommandEmptyDescription>A busca cobre nome e descrição.</CommandEmptyDescription>
</CommandEmpty>

<CommandLoading><Spinner /> Buscando…</CommandLoading>`}
      >
        <div className="flex w-full flex-col gap-4">
          <Command variant="panel" className="max-w-sm">
            <CommandList>
              <CommandEmpty>
                <CommandEmptyTitle>
                  Nada encontrado para &quot;xyz&quot;.
                </CommandEmptyTitle>
                <CommandEmptyDescription>
                  A busca cobre o nome e a descrição de cada página.
                </CommandEmptyDescription>
              </CommandEmpty>
            </CommandList>
          </Command>
          <Command variant="panel" className="max-w-sm">
            <CommandList>
              <CommandLoading>
                <Spinner />
                Buscando no servidor…
              </CommandLoading>
            </CommandList>
          </Command>
        </div>
      </DocSection>

      <DocNote title="Grupos se separam por respiro e rótulo, nunca por fio">
        O rótulo é caixa alta com <code>tracking-wider</code>, como o cabeçalho da <code>Table</code>, e fica mais perto da lista que encima. A folga é margem no grupo e pula o primeiro grupo <em>visível</em>: o cmdk esconde grupos sem resultado com <code>hidden</code>, sem tirá-los do DOM.
      </DocNote>

      <DocNote title="O corpo é o dos menus, os estados não">
        A geometria vem de <code>menuItemGeometryClassName</code>. Os estados ficam aqui porque o cmdk os escreve diferente: a linha ativa é <code>data-selected</code>, e <code>data-disabled=&quot;false&quot;</code> está sempre presente, então a regra por presença dos menus apagaria toda linha.
      </DocNote>

      <DocSection
        title="As três faixas"
        code={`<Command variant="panel">
  <CommandInput placeholder="Buscar…" />   {/* rente, sem fio: o conteúdo dissolve */}
  <CommandList>…</CommandList>             {/* o recuo é daqui */}
  <CommandFooter>                          {/* sangra, tinta mais quieta */}
    <CommandHint><Kbd>↵</Kbd> abrir</CommandHint>
  </CommandFooter>
</Command>`}
      >
        <Command variant="panel" autoSelectFirst={false} className="max-w-sm">
          <CommandInput placeholder="Buscar…" />
          <CommandList>
            <CommandGroup heading="Ir para">
              <CommandItem>Carteiras</CommandItem>
              <CommandItem>Cartões</CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandFooter>
            <CommandHint>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navegar
            </CommandHint>
            <CommandHint>
              <Kbd>↵</Kbd>
              abrir
            </CommandHint>
          </CommandFooter>
        </Command>
      </DocSection>

      <DocNote title="Uma superfície só, pintada pela casca">
        O <code>CommandDialog</code> veste a placa e o <code>Command</code> de dentro é transparente; só <code>panel</code> pinta a própria. Nenhuma faixa pinta nem borra: o limite é o conteúdo se dissolvendo sob a <code>mask-image</code> da lista. Tinta numa faixa vira uma segunda superfície, um retângulo mais claro no tema escuro.
      </DocNote>

      <DocNote title="A dissolução cresce com a rolagem">
        Cada ponta dá <strong>44px</strong> de dissolução com a mesma curva sigmoide, e a zona cresce à medida que a rolagem consome o conteúdo — ligada de uma vez, o item da ponta saltaria de nítido a degradê.
      </DocNote>

      <DocNote title="O rodapé mede só a legenda">
        A pista de dissolução é <code>--command-foot-fade</code>, máscara que não ocupa espaço. A altura depende da presença do rodapé, nunca da rolagem: depender de <code>data-scrollable</code> soma recuo ao conteúdo e a lista fica presa como rolável. <code>scroll-pb</code> cobre a zona inteira, senão a seta deixa o item ativo dentro da dissolução.
      </DocNote>

      <DocNote title="O campo é o mesmo do cabeçalho do catálogo">
        Mesmas medidas do gatilho de busca: quem abre a paleta vem daquele campo, e outro desenho do outro lado do gesto quebra a continuidade.
      </DocNote>

      <DocNote title="O topo fica fixo; a base desliza">
        O topo é fixado onde a caixa <em>cheia</em> começaria, senão o campo pula sob o cursor a cada tecla. A base desliza pela <code>--cmdk-list-height</code> que o cmdk publica, e a transição só liga depois da primeira medida, para a paleta não abrir deslizando.
      </DocNote>

      <DocNote title="A paleta abre sem nada selecionado">
        <code>autoSelectFirst={"{false}"}</code>, que o <code>CommandDialog</code> liga sozinho: a seta para baixo entra na primeira linha e a de cima vai para a última. Não esconda o realce com CSS — o leitor de tela anunciaria uma linha que ninguém vê. O <code>Combobox</code> abre com o primeiro realçado, como um select.
      </DocNote>

      <DocNote title="plain herda a moldura; panel desenha a própria">
        <code>plain</code> não tem borda nem canto e herda o raio de quem o contém (<code>Popover</code>, <code>CommandDialog</code>). <code>panel</code> é a paleta solta numa página. Não crave o raio do contêiner dentro do componente.
      </DocNote>

      <DocNote title="A busca deste catálogo é a referência">
        O cabeçalho usa um <code>CommandDialog</code> (<Kbd keys="mod+k" />); <code>src/app/designsystem/ds-search.tsx</code> decide o que entra na lista e como filtrar. O filtro padrão do cmdk é difuso — &ldquo;cor&rdquo; devolve Carousel —, então passe um <code>filter</code> por substring, sem acentos dos dois lados.
      </DocNote>

      <DocNote title="O atalho precisa de um gatilho visível">
        Atalho só de teclado não existe no telefone e ninguém descobre. O botão torna a paleta encontrável, e o <Kbd keys="mod+k" /> dentro dele ensina o atalho — ⌘K no Apple, Ctrl+K no resto.
      </DocNote>
      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"plain" | "panel"',
            default: '"plain"',
            description:
              "plain não desenha moldura e herda o canto de quem o contém; panel traz borda e sombra próprias, para a paleta solta numa página.",
          },
          {
            prop: "autoSelectFirst",
            type: "boolean",
            default: "true",
            description:
              "false abre sem seleção (o CommandDialog já liga); não combine com um value controlado por fora.",
          },
          {
            prop: "CommandItemContent",
            type: 'ComponentProps<"span">',
            description:
              "A pilha de nome sobre descrição — sem gap, porque é o mesmo dado em duas linhas.",
          },
          {
            prop: "CommandEmptyTitle / Description",
            type: 'ComponentProps<"p">',
            description:
              "As duas linhas do vazio: o que não foi achado, e o que tentar em vez disso.",
          },
          {
            prop: "CommandFooter / CommandHint",
            type: 'ComponentProps<"div"> / <"span">',
            description:
              "A faixa do rodapé, com tinta quieta; Hint é o par tecla + o que ela faz.",
          },
          {
            prop: "CommandLoading",
            type: "ComponentProps<typeof Command.Loading>",
            description:
              "O estado de busca assíncrona.",
          },
        ]}
      />
    </>
  )
}

function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Buscar
        {/* Um acorde é **uma** pastilha, e `keys` resolve a tecla por
            plataforma: escrito como sequência, com o `⌘` literal, isto ensinava
            dois passos e a tecla errada em Windows — enquanto o atalho acima
            aceita `metaKey || ctrlKey`. */}
        <Kbd keys="mod+k" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar tela, ação ou transação…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ir para">
            <CommandItem onSelect={() => setOpen(false)}>
              <WalletIcon aria-hidden />
              Carteiras
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <CreditCardIcon aria-hidden />
              Cartões
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandFooter>
          <CommandHint>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navegar
          </CommandHint>
          <CommandHint>
            <Kbd>↵</Kbd>
            abrir
          </CommandHint>
        </CommandFooter>
      </CommandDialog>
    </>
  )
}
