"use client"

import {
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  SwatchIcon,
  WalletIcon,
} from "@heroicons/react/16/solid"
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
  CommandHighlight,
  CommandPage,
  CommandPages,
  CommandPreview,
  CommandSplit,
  useCommandPages,
} from "@/components/ui/command"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { useCommandRecents } from "@/hooks/use-command-recents"
import { useCommandSearch } from "@/hooks/use-command-search"
import { commandFilter } from "@/lib/command-filter"
import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
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
              <KbdGroup mode="either" keys={["up", "down"]} />
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
        description="A mesma pilha num diálogo: topo fixo, a lista que cresce e encolhe, e nenhuma sombra atrás do conjunto: o véu com borrão é que a separa da página. No telefone ela é uma gaveta de baixo, com a busca em cima do teclado — estreite a janela e abra de novo."
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
        title="Sub-páginas"
        description="CommandPages guarda a pilha e o campo a lê: Enter em Tema abre a lista dentro da paleta, a trilha aparece no campo, o texto esvazia, e o Backspace com o campo vazio volta em dois toques — o primeiro acende a trilha, o segundo sai. CommandPage mostra o que é da página atual; sem id, é a raiz."
        code={`<Command variant="panel">
  <CommandPages>
    <CommandInput placeholder="Buscar…" />
    <CommandList>
      <CommandPage>
        <ItemQueAbre />   {/* useCommandPages().push({ id: "tema", label: "Tema" }) */}
      </CommandPage>
      <CommandPage id="tema">
        <CommandItem>Claro</CommandItem>
      </CommandPage>
    </CommandList>
  </CommandPages>
</Command>`}
        previewClassName="items-stretch"
      >
        <SubPaginasDemo />
      </DocSection>

      <DocSection
        title="Destaque e contagem"
        description="CommandHighlight põe em negrito o trecho que casou, sem acento dos dois lados — digite saude. CommandGroup count diz no rótulo quantas linhas casaram, e atualiza com a busca."
        code={`<CommandGroup heading="Categorias" count>
  <CommandItem>
    <CommandHighlight>Saúde</CommandHighlight>
  </CommandItem>
</CommandGroup>`}
        previewClassName="items-stretch"
      >
        <DestaqueDemo />
      </DocSection>

      <DocSection
        title="Atalhos que executam"
        description="shortcut na linha mostra a tecla na ponta e dispara a ação com o foco na paleta, sem precisar achar a linha. Clique no campo e aperte a tecla. Evite as teclas que o navegador reserva (⌘N, ⌘T, ⌘W): o Chrome não deixa cancelá-las."
        code={`<CommandItem shortcut="mod+e" onSelect={exportar}>Exportar CSV</CommandItem>`}
        previewClassName="items-stretch"
      >
        <AtalhosDemo />
      </DocSection>

      <DocSection
        title="Pré-visualização ao lado"
        description="CommandSplit põe a lista e o CommandPreview lado a lado; a pré-visualização lê a linha realçada e mostra o detalhe dela. No CommandDialog, size=&quot;lg&quot; dá a largura. Abaixo de md ela some. Ande com as setas pela lista."
        code={`<CommandDialog size="lg">
  <CommandInput />
  <CommandSplit>
    <CommandList>…</CommandList>
    <CommandPreview empty="Escolha uma fatura">
      {(valor) => <DetalheDaFatura id={valor} />}
    </CommandPreview>
  </CommandSplit>
</CommandDialog>`}
        previewClassName="items-stretch"
      >
        <PreviaDemo />
      </DocSection>

      <DocSection
        title="Recentes com memória"
        description="useCommandRecents guarda as últimas escolhas por chave no localStorage — destinos, não termos — e devolve a lista para um grupo no topo com o campo vazio. Escolha algumas linhas e recarregue a página."
        code={`const { recents, add } = useCommandRecents("app:busca")
<CommandItem onSelect={(v) => { add(v); ir(v) }}>…</CommandItem>`}
        previewClassName="items-stretch"
      >
        <RecentesDemo />
      </DocSection>

      <DocSection
        title="Busca no servidor"
        description="useCommandSearch espera a digitação parar (250ms), mostra o carregando, cancela a consulta velha pelo signal e não deixa resposta atrasada sobrescrever a nova. A raiz vai com shouldFilter desligado: quem filtra é o servidor. Aqui o servidor é fingido, com 600ms de resposta."
        code={`const { query, setQuery, results, loading } = useCommandSearch(
  (q, signal) => fetch(\`/api/busca?q=\${q}\`, { signal }).then((r) => r.json())
)
<Command shouldFilter={false}>
  <CommandInput value={query} onValueChange={setQuery} />
  <CommandList>{loading ? <CommandLoading>…</CommandLoading> : …}</CommandList>
</Command>`}
        previewClassName="items-stretch"
      >
        <ServidorDemo />
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
        Em <code>variant=&quot;panel&quot;</code> — solta e no <code>CommandDialog</code> — a raiz é uma coluna que não pinta, e cada peça pinta a sua: em cima a <strong>pílula</strong> de busca (o <code>SearchInput surface=&quot;plate&quot;</code>, com o campo do cmdk dentro; na paleta sem anel de foco, porque ela nasce focada), no meio a <strong>placa</strong> com a lista, embaixo as <strong>cápsulas</strong> da legenda (<code>CommandDock</code>, o último filho), a 12px uma da outra e sem sombra própria. É o padrão novo do iOS. As peças sabem que estão na pilha por um contexto. A placa é um embrulho da lista, porque a lista é o elemento mascarado e a máscara recortaria a placa junto. E elas são irmãs porque um ancestral com <code>backdrop-filter</code> é raiz de fundo: o borrão de quem estivesse dentro não enxergaria a página. No diálogo não há sombra atrás do conjunto: a sombra de um retângulo do tamanho da pilha, que não é nenhuma das três formas, lia como mancha em volta delas — quem separa a paleta da página é o véu.
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
              "panel é a pilha — pílula, placa e legenda soltas; o CommandDialog e a paleta solta a montam. plain não pinta nada, para quem hospeda o Command numa superfície própria — o Combobox, desde a rodada 198.",
          },
          {
            prop: "density",
            type: '"palette" | "menu"',
            default: '"palette"',
            description:
              "Só em panel. palette é a paleta: pílula de 36, linhas de 36, respiro largo, 12px entre as peças. menu são as medidas de um dropdown — pílula de 32, linhas de 28, o recuo e o respiro dos menus, 4px entre as peças. Foi a do Combobox até ele sair da pilha; hoje não tem consumidor.",
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
          {
            prop: "CommandPages / CommandPage / useCommandPages",
            type: "onPageChange · id · { push, pop, reset, current, stack }",
            description:
              "As sub-páginas: a pilha, o conteúdo de cada página (sem id é a raiz) e o gancho que abre e volta. O campo lê a pilha sozinho.",
          },
          {
            prop: "CommandHighlight",
            type: "children: string",
            description: "O trecho que casou em negrito, sem acento dos dois lados.",
          },
          {
            prop: "CommandGroup count",
            type: "boolean",
            description: "Quantas linhas casaram, no rótulo do grupo.",
          },
          {
            prop: "CommandItem shortcut",
            type: "string",
            description: "A tecla na ponta, e a ação disparada por ela com o foco na paleta.",
          },
          {
            prop: "CommandSplit / CommandPreview",
            type: "div / children(valor) · empty",
            description: "A lista e o detalhe da linha realçada lado a lado; a pré-visualização some abaixo de md.",
          },
          {
            prop: "CommandDialog size",
            type: '"md" | "lg"',
            default: '"md"',
            description: "lg é a paleta larga, para a pré-visualização. No telefone o diálogo é gaveta, em qualquer tamanho.",
          },
          {
            prop: "useCommandRecents / useCommandSearch",
            type: "hooks/",
            description:
              "A memória das últimas escolhas (localStorage, por chave) e a busca no servidor que espera, cancela e descarta resposta velha.",
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
            <KbdGroup mode="either" keys={["up", "down"]} />
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

function ItemQueAbre({
  id,
  label,
  icon,
}: {
  id: string
  label: string
  icon: React.ReactNode
}) {
  const paginas = useCommandPages()
  return (
    <CommandItem onSelect={() => paginas.push({ id, label, icon })}>
      <CommandItemIcon>{icon}</CommandItemIcon>
      {label}…
      <CommandItemArrow />
    </CommandItem>
  )
}

function SubPaginasDemo() {
  const [escolha, setEscolha] = React.useState<string | null>(null)
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Command variant="panel" autoSelectFirst={false}>
        <CommandPages>
          <CommandInput placeholder="Buscar ação…" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandPage>
              <CommandGroup heading="Preferências">
                <ItemQueAbre id="tema" label="Tema" icon={<SwatchIcon />} />
                <ItemQueAbre id="carteira" label="Carteira" icon={<WalletIcon />} />
              </CommandGroup>
            </CommandPage>
            <CommandPage id="tema">
              <CommandGroup heading="Tema">
                {[
                  ["Claro", SunIcon],
                  ["Escuro", MoonIcon],
                ].map(([nome, Icone]) => {
                  const I = Icone as typeof SunIcon
                  return (
                    <CommandItem key={nome as string} onSelect={() => setEscolha(`Tema: ${nome as string}`)}>
                      <CommandItemIcon>
                        <I />
                      </CommandItemIcon>
                      {nome as string}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandPage>
            <CommandPage id="carteira">
              <CommandGroup heading="Carteira">
                {["Pessoal", "Casa", "Empresa"].map((nome) => (
                  <CommandItem key={nome} onSelect={() => setEscolha(`Carteira: ${nome}`)}>
                    <CommandItemIcon>
                      <WalletIcon />
                    </CommandItemIcon>
                    {nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandPage>
          </CommandList>
        </CommandPages>
      </Command>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {escolha ?? "Abra Tema ou Carteira, e volte com Backspace duas vezes."}
      </p>
    </div>
  )
}

const CATEGORIAS_BUSCA = [
  ["Saúde", "saude"],
  ["Saneamento", "saneamento"],
  ["Mercado", "mercado"],
  ["Educação", "educacao"],
  ["Lazer", "lazer"],
] as const

function DestaqueDemo() {
  return (
    // O filtro do projeto — substring sem acento —, que é o que o destaque
    // espelha. O padrão do cmdk é difuso: "sa" achava "Carteiras".
    <Command variant="panel" filter={commandFilter} autoSelectFirst={false} className="w-full max-w-md">
      <CommandInput placeholder="Tente saude ou ca…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Categorias" count>
          {CATEGORIAS_BUSCA.map(([nome, valor]) => (
            <CommandItem key={valor} value={valor} keywords={[nome]}>
              <CommandHighlight>{nome}</CommandHighlight>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Telas" count>
          {["Carteiras", "Cartões", "Configurações"].map((nome) => (
            <CommandItem key={nome}>
              <CommandHighlight>{nome}</CommandHighlight>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function AtalhosDemo() {
  const [feito, setFeito] = React.useState<string | null>(null)
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Command variant="panel" autoSelectFirst={false}>
        <CommandInput placeholder="Clique aqui e aperte a tecla…" />
        <CommandList>
          <CommandGroup heading="Ações">
            <CommandItem shortcut="mod+e" onSelect={() => setFeito("Exportou o CSV")}>
              <CommandItemIcon>
                <ArrowDownTrayIcon />
              </CommandItemIcon>
              Exportar CSV
            </CommandItem>
            <CommandItem shortcut="alt+n" onSelect={() => setFeito("Abriu a nova transação")}>
              <CommandItemIcon>
                <PlusIcon />
              </CommandItemIcon>
              Nova transação
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {feito ?? "Nenhuma ação ainda."}
      </p>
    </div>
  )
}

const FATURAS = [
  { id: "nubank", nome: "Nubank", valor: 1482.3, fecha: "3 de outubro", vence: "10 de outubro", compras: 23 },
  { id: "itau", nome: "Itaú Black", valor: 894.15, fecha: "28 de setembro", vence: "5 de outubro", compras: 12 },
  { id: "inter", nome: "Inter", valor: 320, fecha: "15 de outubro", vence: "22 de outubro", compras: 4 },
]

function PreviaDemo() {
  return (
    <Command variant="panel" autoSelectFirst className="w-full max-w-3xl">
      <CommandInput placeholder="Buscar fatura…" />
      <CommandSplit>
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Faturas abertas">
            {FATURAS.map((f) => (
              <CommandItem key={f.id} value={f.id} keywords={[f.nome]}>
                <CommandItemIcon>
                  <CreditCardIcon />
                </CommandItemIcon>
                {f.nome}
                <CommandItemArrow />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <CommandPreview empty={<p className="text-muted-foreground">Escolha uma fatura.</p>}>
          {(valor) => {
            const f = FATURAS.find((x) => x.id === valor)
            if (!f) return null
            return (
              <>
                <p className="font-medium">{f.nome}</p>
                <MoneyDisplay value={-f.valor} size="xl" tone="expense" />
                <DescriptionList>
                  <DescriptionListItem>
                    <DescriptionTerm>Fecha</DescriptionTerm>
                    <DescriptionDetails>{f.fecha}</DescriptionDetails>
                  </DescriptionListItem>
                  <DescriptionListItem>
                    <DescriptionTerm>Vence</DescriptionTerm>
                    <DescriptionDetails>{f.vence}</DescriptionDetails>
                  </DescriptionListItem>
                  <DescriptionListItem>
                    <DescriptionTerm>Compras</DescriptionTerm>
                    <DescriptionDetails>{f.compras}</DescriptionDetails>
                  </DescriptionListItem>
                </DescriptionList>
              </>
            )
          }}
        </CommandPreview>
      </CommandSplit>
    </Command>
  )
}

const TELAS = ["Dashboard", "Transações", "Categorias", "Cartões", "Contas a pagar", "Assinaturas"]

function RecentesDemo() {
  const { recents, add, clear } = useCommandRecents("ds:demo-command-recentes")
  const [busca, setBusca] = React.useState("")
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Command variant="panel" autoSelectFirst={false}>
        <CommandInput value={busca} onValueChange={setBusca} placeholder="Buscar tela…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          {!busca && recents.length > 0 ? (
            <CommandGroup heading="Recentes">
              {recents.map((tela) => (
                <CommandItem key={`recente-${tela}`} value={`recente:${tela}`} keywords={[tela]} onSelect={() => add(tela)}>
                  {tela}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Telas">
            {TELAS.map((tela) => (
              <CommandItem key={tela} onSelect={() => add(tela)}>
                {tela}
                <CommandItemArrow />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      <Button variant="tertiary" size="sm" className="self-start" onClick={clear} disabled={recents.length === 0}>
        esquecer os recentes
      </Button>
    </div>
  )
}

const TRANSACOES = [
  "Mercado Pão de Açúcar",
  "Uber para o aeroporto",
  "Netflix",
  "Farmácia São Paulo",
  "Aluguel de outubro",
  "Restaurante japonês",
  "Posto Shell",
  "Academia",
]

/** O servidor fingido: 600ms de resposta, e respeita o cancelamento. */
function buscarTransacoes(consulta: string, signal: AbortSignal): Promise<string[]> {
  return new Promise((resolver, rejeitar) => {
    const t = setTimeout(() => {
      const q = consulta.toLowerCase()
      resolver(TRANSACOES.filter((x) => x.toLowerCase().includes(q)))
    }, 600)
    signal.addEventListener("abort", () => {
      clearTimeout(t)
      rejeitar(new DOMException("cancelada", "AbortError"))
    })
  })
}

function ServidorDemo() {
  const { query, setQuery, results, loading } = useCommandSearch(buscarTransacoes)
  return (
    <Command variant="panel" shouldFilter={false} autoSelectFirst={false} className="w-full max-w-md">
      <CommandInput value={query} onValueChange={setQuery} placeholder="Buscar transação no servidor…" />
      <CommandList>
        {loading ? (
          <CommandLoading>
            <Spinner />
            Buscando…
          </CommandLoading>
        ) : query.trim() && results.length === 0 ? (
          <CommandEmpty>Nenhuma transação com esse nome.</CommandEmpty>
        ) : !query.trim() ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Digite para buscar.</p>
        ) : (
          <CommandGroup heading="Transações">
            {results.map((r) => (
              <CommandItem key={r} value={r}>
                <CommandHighlight>{r}</CommandHighlight>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
