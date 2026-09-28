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
  CommandShortcut,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandItemArrow,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandLoading,
  CommandScope,
  CommandDock,
  CommandDockItem,
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
        title="Paleta solta"
        description="A pilha sem o diálogo: pílula de busca, placa e legenda, soltas numa página, no mesmo plano."
        code={`<Command variant="panel">
  <CommandInput placeholder="Buscar…" />
  <CommandList>
    <CommandGroup heading="Ir para">
      <CommandItem>
        <CommandItemIcon><WalletIcon /></CommandItemIcon>
        Carteiras
        <CommandItemArrow />
      </CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandDock>…</CommandDock>
</Command>`}
        previewClassName="items-stretch"
      >
        <Command variant="panel" autoSelectFirst={false} className="w-full max-w-md">
          <CommandInput placeholder="Buscar tela, ação ou transação…" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Ir para">
              {[
                ["Carteiras", WalletIcon],
                ["Cartões", CreditCardIcon],
                ["Configurações", Cog6ToothIcon],
              ].map(([nome, Icone]) => {
                const I = Icone as typeof WalletIcon
                return (
                  <CommandItem key={nome as string}>
                    <CommandItemIcon>
                      <I />
                    </CommandItemIcon>
                    {nome as string}
                    <CommandItemArrow />
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandGroup heading="Ações">
              <CommandItem>
                <CommandItemIcon>
                  <PlusIcon />
                </CommandItemIcon>
                Nova transação
                <CommandShortcut>
                  <Kbd keys="mod+n" />
                </CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandDock>
            <CommandDockItem>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navegar
            </CommandDockItem>
            <CommandDockItem>
              <Kbd>↵</Kbd>
              abrir
            </CommandDockItem>
          </CommandDock>
        </Command>
      </DocSection>

      <DocSection
        title="Como diálogo (⌘K ou Ctrl+K)"
        description="A mesma pilha num diálogo: topo fixo, a lista que cresce e encolhe, uma sombra só atrás do conjunto."
        code={`<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Buscar…" />
  <CommandList>…</CommandList>
  <CommandDock>…</CommandDock>
</CommandDialog>`}
      >
        <CommandDialogDemo />
      </DocSection>

      <DocSection
        title="A linha"
        description="Uma linha de 36: o ícone numa caixa de 24, o nome, e na ponta a meta — uma contagem, uma descrição, a seta de ir."
        code={`<CommandItem>
  <CommandItemIcon><RectangleGroupIcon /></CommandItemIcon>
  <CommandItemTitle>Organisms</CommandItemTitle>
  <CommandItemMeta>
    <CommandItemDescription>30 páginas</CommandItemDescription>
    <CommandItemArrow />
  </CommandItemMeta>
</CommandItem>`}
        previewClassName="items-stretch"
      >
        <Command variant="panel" className="w-full max-w-md">
          <CommandList>
            <CommandGroup heading="Contas">
              {[
                ["Nubank", "Conta corrente", WalletIcon],
                ["Itaú Black", "Fatura fecha dia 3", CreditCardIcon],
                ["Configurações", "Perfil, tema e alertas", Cog6ToothIcon],
              ].map(([nome, meta, Icone]) => {
                const I = Icone as typeof WalletIcon
                return (
                  <CommandItem key={nome as string}>
                    <CommandItemIcon>
                      <I />
                    </CommandItemIcon>
                    <CommandItemTitle className="shrink-0">{nome as string}</CommandItemTitle>
                    <CommandItemMeta>
                      <CommandItemDescription>{meta as string}</CommandItemDescription>
                      <CommandItemArrow />
                    </CommandItemMeta>
                  </CommandItem>
                )
              })}
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

      <DocSection
        title="Escopo"
        description="O escopo antes do texto restringe a busca: o nome pintado como o destinatário de um e-mail depois de digitado. Sem ×: com o campo vazio, o primeiro Backspace acende o fundo e o segundo remove o escopo. Quem conta os toques é quem tem o estado."
        code={`<CommandInput
  leading={scope ? <CommandScope icon={<Icon />} armed={armado}>{scope}</CommandScope> : null}
  placeholder={scope ? \`Buscar em \${scope}…\` : "Buscar…"}
  onKeyDown={(e) => {
    if (e.key === "Backspace" && !query && scope) {
      e.preventDefault()
      armado ? setScope(null) : setArmado(true)
    } else if (e.key !== "Shift") setArmado(false)
  }}
/>`}
        previewClassName="items-stretch"
      >
        <CommandScopeDemo />
      </DocSection>

      <DocNote title="Três superfícies no mesmo plano">
        Em <code>variant=&quot;panel&quot;</code> — solta, no <code>CommandDialog</code> e no <code>Combobox</code> — a raiz é uma coluna que não pinta, e cada peça pinta a sua: em cima a <strong>pílula</strong> de busca, no meio a <strong>placa</strong> com a lista, embaixo as <strong>cápsulas</strong> da legenda (<code>CommandDock</code>, o último filho), a 12px uma da outra e sem sombra própria. É o padrão novo do iOS. As peças sabem que estão na pilha por um contexto. A placa é um embrulho da lista, porque a lista é o elemento mascarado e a máscara recortaria a placa junto. E elas são irmãs porque um ancestral com <code>backdrop-filter</code> é raiz de fundo: o borrão de quem estivesse dentro não enxergaria a página. No diálogo uma sombra só fica atrás do conjunto.
      </DocNote>

      <DocNote title="Grupos se separam por respiro e rótulo, nunca por fio">
        O rótulo é caixa alta com <code>tracking-wider</code>, como o cabeçalho da <code>Table</code>, e fica mais perto da lista que encima. Na pilha são 16px entre grupos e 6px entre o rótulo e a primeira linha. A folga é margem no grupo e pula o primeiro grupo <em>visível</em>: o cmdk esconde grupos sem resultado com <code>hidden</code>, sem tirá-los do DOM.
      </DocNote>

      <DocNote title="A linha tem 36 na pilha">
        Nos menus a linha tem 28; na paleta, 36, porque ela é um destino de busca, lido uma linha por vez. <code>CommandItemIcon</code> põe o ícone numa caixa de 24 e alinha o nome na mesma coluna em qualquer grupo; <code>CommandItemMeta</code> empurra a contagem ou a descrição para a ponta; <code>CommandItemArrow</code> é a seta de ir, que só aparece na linha selecionada. A geometria continua a de <code>menuItemGeometryClassName</code>, e os estados ficam aqui porque o cmdk os escreve diferente: a linha ativa é <code>data-selected</code>, e <code>data-disabled=&quot;false&quot;</code> está sempre presente.
      </DocNote>

      <DocNote title="O feixe espera a primeira tecla">
        Na pílula, uma luz viaja pela borda de baixo enquanto o campo está vazio, e apaga no primeiro caractere (<code>data-waiting</code>). É o preset <code>line</code> do <code>border-beam</code> (Jakub Antalík, MIT), pelo <code>BeamSearch</code> do 21st, portado para a <code>@utility command-beam</code> em vez de instalado: a biblioteca injeta estilo por instância e pinta com paletas próprias. A cor é o arco-íris da marca parado, e a janela anda. Só o <code>CommandDialog</code> o acende: na paleta solta e no <code>Combobox</code> a pílula fica quieta, porque ali a busca é uma peça entre outras da tela. O campo de formulário continua sem marca, por decisão registrada. Com movimento reduzido ele não aparece.
      </DocNote>

      <DocNote title="Movimento">
        O <code>CommandDialog</code> abre em <code>--ease-spring</code> e fecha curto em <code>--ease-out</code>, e a legenda entra 80ms depois. Na pilha toda, cada linha que o cmdk <em>monta</em> — as que passam a casar a busca, e o miolo inteiro numa troca de vista com <code>key</code> — sobe 6px na mola, escalonada (<code>command-reveal</code>). A altura da lista só anima no diálogo: num popover ela faria o painel perseguir o gatilho.
      </DocNote>

      <DocNote title="A dissolução cresce com a rolagem">
        Cada ponta dá <strong>44px</strong> de dissolução com a mesma curva sigmoide, e a zona cresce à medida que a rolagem consome o conteúdo — ligada de uma vez, o item da ponta saltaria de nítido a degradê.
      </DocNote>

      <DocNote title="O topo fica fixo; a base desliza">
        No diálogo o topo é fixado onde a pilha <em>cheia</em> — pílula, placa no teto e legenda — fica centrada na tela, senão o campo pula sob o cursor a cada tecla. A base desliza pela <code>--cmdk-list-height</code> que o cmdk publica, e a transição só liga depois da primeira medida, para a paleta não abrir deslizando.
      </DocNote>

      <DocNote title="A paleta abre sem nada selecionado">
        <code>autoSelectFirst={"{false}"}</code>, que o <code>CommandDialog</code> liga sozinho: a seta para baixo entra na primeira linha e a de cima vai para a última. Não esconda o realce com CSS — o leitor de tela anunciaria uma linha que ninguém vê. O <code>Combobox</code> abre com o primeiro realçado, como um select.
      </DocNote>

      <DocNote title="plain é para quem já tem superfície">
        <code>plain</code> não pinta nada e herda o raio de quem o contém: é o <code>Command</code> dentro de uma superfície própria. Quem quer a paleta como ela é na casa usa <code>panel</code>.
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
              "panel é a pilha — pílula, placa e legenda soltas; o CommandDialog e o Combobox a montam. plain não pinta nada, para quem hospeda o Command numa superfície própria.",
          },
          {
            prop: "density",
            type: '"palette" | "menu"',
            default: '"palette"',
            description:
              "Só em panel. palette é a paleta: pílula de 36, linhas de 36, respiro largo, 12px entre as peças. menu são as medidas de um dropdown — pílula de 32, linhas de 28, o recuo e o respiro dos menus, 4px entre as peças —, e é o que o Combobox usa.",
          },
          {
            prop: "autoSelectFirst",
            type: "boolean",
            default: "true",
            description:
              "false abre sem seleção (o CommandDialog já liga); não combine com um value controlado por fora.",
          },
          {
            prop: "CommandInput size",
            type: '"md" | "lg"',
            default: 'lg na pilha, md fora dela',
            description:
              "md (32) é o gatilho do cabeçalho; lg (36) é a pílula da paleta. A faixa de dissolução acompanha.",
          },
          {
            prop: "CommandInput leading",
            type: "ReactNode",
            description:
              "O que fica entre a lupa e o texto — o CommandScope da busca por camada.",
          },
          {
            prop: "CommandScope",
            type: "{ icon?, armed?, tint?, children }",
            description:
              "O escopo pintado como o destinatário de um e-mail: texto e ícone na cor que tint passar (uma parada do arco-íris; violeta por padrão), sem ×. armed acende o fundo — o primeiro Backspace com o campo vazio; o segundo remove.",
          },
          {
            prop: "CommandItemIcon / Meta / Arrow",
            type: 'ComponentProps<"span"> × 2 / props do ícone',
            description:
              "As peças da linha: o ícone numa caixa de 24 que acende com a seleção, o lado direito empurrado para a ponta, e a seta de ir que só aparece na linha selecionada.",
          },
          {
            prop: "CommandItemContent",
            type: 'ComponentProps<"span">',
            description:
              "A pilha de nome sobre descrição, para a linha de duas linhas fora da paleta.",
          },
          {
            prop: "CommandDock / CommandDockItem",
            type: 'ComponentProps<"div"> / <"span">',
            description:
              "A legenda de teclado da pilha, como último filho: cápsulas de vidro soltas, com a tecla sem pastilha. São legendas, não botões, e somem no toque.",
          },
          {
            prop: "CommandEmptyTitle / Description",
            type: 'ComponentProps<"p">',
            description:
              "As duas linhas do vazio: o que não foi achado, e o que tentar em vez disso.",
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

function CommandScopeDemo() {
  const [scope, setScope] = React.useState<string | null>("Carteiras")
  const [query, setQuery] = React.useState("")
  const [armado, setArmado] = React.useState(false)
  const itens = scope === "Carteiras"
    ? ["Nubank", "Itaú", "Dinheiro"]
    : ["Carteiras", "Cartões", "Configurações"]

  return (
    <Command variant="panel" autoSelectFirst={false} className="w-full max-w-md">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={scope ? `Buscar em ${scope}…` : "Buscar…"}
        leading={
          scope ? (
            <CommandScope icon={<WalletIcon aria-hidden />} armed={armado}>
              {scope}
            </CommandScope>
          ) : null
        }
        onKeyDown={(e) => {
          if (e.key === "Backspace" && !query && scope) {
            e.preventDefault()
            if (armado) {
              setScope(null)
              setArmado(false)
            } else setArmado(true)
            return
          }
          if (armado && e.key !== "Shift") setArmado(false)
        }}
      />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading={scope ?? "Ir para"}>
          {itens.map((item) => (
            <CommandItem
              key={item}
              onSelect={() => {
                if (!scope && item === "Carteiras") {
                  setScope(item)
                  setQuery("")
                  setArmado(false)
                }
              }}
            >
              <CommandItemIcon>
                <WalletIcon />
              </CommandItemIcon>
              {item}
              <CommandItemArrow />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
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
              <CommandItemIcon>
                <WalletIcon />
              </CommandItemIcon>
              Carteiras
              <CommandItemArrow />
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <CommandItemIcon>
                <CreditCardIcon />
              </CommandItemIcon>
              Cartões
              <CommandItemArrow />
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandDock>
          <CommandDockItem>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navegar
          </CommandDockItem>
          <CommandDockItem>
            <Kbd>↵</Kbd>
            abrir
          </CommandDockItem>
        </CommandDock>
      </CommandDialog>
    </>
  )
}
