"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsUpDownIcon,
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  PencilIcon,
  PrinterIcon,
  Square2StackIcon,
  TrashIcon,
} from "@heroicons/react/16/solid"

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

const VARIANTES = ["floating", "outline", "plain", "solid"] as const
const TAMANHOS = ["sm", "md", "lg"] as const

export default function MenubarDoc() {
  return (
    <>
      <Usage>
        Uma fileira de menus percorrida com a seta, para <strong>dezenas de comandos agrupados por assunto</strong>. Para as ações de um objeto use <code>DropdownMenu</code>; para navegar, a <code>Sidebar</code>.
      </Usage>

      <DocSection
        title="Completo"
        description={
          <>
            O realce viaja de gatilho em gatilho na mola; com um menu aberto, passar ao vizinho faz o painel deslizar até ele. As linhas sobem em cascata, a tecla de cada uma funciona com a barra na tela (experimente <code>⌘⇧E</code>), <strong>F10</strong> foca a barra e <strong>Alt</strong> mostra as letras de acesso — Alt+A abre Arquivo. A busca procura entre as linhas de todos os menus.
          </>
        }
        code={`<Menubar search>
  <MenubarMenu>
    <MenubarTrigger mnemonic="a">Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem icon={<ArrowDownTrayIcon />} shortcut="mod+shift+e" onSelect={exportar}>
        Exportar CSV
      </MenubarItem>
      <MenubarItem icon={<ArrowUpTrayIcon />} description="OFX ou CSV do banco">Importar extrato</MenubarItem>
      <MenubarSeparator />
      <MenubarItem icon={<TrashIcon />} variant="destructive" confirm="toque de novo para apagar">
        Apagar rascunho
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}
        previewClassName="flex-col items-start gap-3"
      >
        <MenubarCompleto />
      </DocSection>

      <DocSection
        title="Superfícies e tamanhos"
        description="floating, o padrão, é a pílula que paira sobre o conteúdo; outline se sustenta sozinha, sobre a página, sem sombra; plain mora dentro de um cabeçalho que já tem moldura; solid é bandeja, e ali o realce sobe em vez de tingir. size mede o gatilho: 28, 32, 36."
        code={`<Menubar size="md">…</Menubar>   // floating, o padrão
<Menubar variant="outline">…</Menubar>`}
        previewClassName="flex-col items-start gap-4"
      >
        <SuperficiesDemo />
      </DocSection>

      <DocSection
        title="Sobre conteúdo que rola"
        description="A pílula flutuante, presa no topo de uma região: o texto passa borrado por baixo dela."
        code={`<div className="h-64 overflow-y-auto">
  <Menubar className="sticky top-0">…</Menubar>
  {/* o conteúdo passa por baixo */}
</div>`}
        previewClassName="block p-0"
      >
        <FileiraSobreConteudo />
      </DocSection>

      <DocSection
        title="Estado à vista"
        description={
          <>
            A caixa não fecha o menu: marcar uma é para marcar outra. O gatilho conta as caixas marcadas, e o título do painel diz o rádio escolhido — o estado se lê sem abrir o menu, nem procurar o ponto na lista. Os ícones, a contagem e a seta são do gatilho.
          </>
        }
        code={`<MenubarTrigger icon={<FunnelIcon />} chevron>Filtrar</MenubarTrigger>
<MenubarContent title="Filtrar">
  <MenubarCheckboxItem checked={a} onCheckedChange={setA}>Só despesas</MenubarCheckboxItem>
</MenubarContent>

<MenubarTrigger icon={<ArrowsUpDownIcon />} chevron>Ordenar</MenubarTrigger>
<MenubarContent title="Ordenar">
  <MenubarRadioGroup value={ordem} onValueChange={setOrdem}>…</MenubarRadioGroup>
</MenubarContent>`}
        previewClassName="items-start"
      >
        <MenubarEstado />
      </DocSection>

      <DocSection
        title="No telefone, a folha de ações"
        description={
          <>
            <code>mobile=&quot;sheet&quot;</code>: abaixo de 768px a fileira — que não cabe em 375px — vira um botão &ldquo;Menu&rdquo; que abre a gaveta com os menus em grupos, as marcas e os mesmos comandos. A caixa não fecha a folha.
          </>
        }
        code={`<Menubar mobile="sheet" mobileLabel="Comandos">…</Menubar>`}
        previewClassName="justify-center"
      >
        <IphoneFrame title="A barra de menus num iPhone">
          <div className="flex h-full items-start justify-center px-4 pt-16">
            <MenubarEstado mobile />
          </div>
        </IphoneFrame>
      </DocSection>

      <DocNote title="O realce que viaja é da fileira, não das linhas">
        O movimento veio de uma referência do dono: a mola do realce (0,28s), a entrada do painel descendo 6px de 97%, as linhas em cascata, o tique que estala e o submenu que entra de lado. O que <strong>não</strong> veio é o realce correndo entre as linhas do painel — ele foi recusado na rodada 137, e as linhas continuam acendendo no esmaecer de 300ms dos menus irmãos.
      </DocNote>

      <DocNote title="A barra sabe o que tem dentro sem abrir">
        O Radix só monta as linhas do menu aberto. Para a tecla funcionar, a busca achar, a folha listar e o gatilho contar, cada painel renderiza os filhos também num índice que nunca pinta: ali cada linha só se registra. Uma fonte só — não há lista de comandos paralela. Por isso os filhos de um <code>MenubarContent</code> são peças do menu; um <code>div</code> solto ali dentro apareceria na fileira.
      </DocNote>

      <DocNote title="Ela se paga a partir de dois grupos de escolha">
        Com dois menus de escolha lado a lado — filtrar e ordenar — a barra já devolve o que dois <Link href="/designsystem/dropdown-menu">DropdownMenu</Link> soltos não davam: a seta passa de um ao outro, e o estado de cada um fica à vista. Ações de um objeto continuam sendo <code>DropdownMenu</code>; navegar é a <Link href="/designsystem/sidebar">Sidebar</Link>.
      </DocNote>

      <DocNote title="O painel é o mesmo dos outros dois menus">
        Casca, linha, rótulo, fio e atalho vêm de <code>lib/menu-classes</code>, os do <Link href="/designsystem/dropdown-menu">DropdownMenu</Link> e do <Link href="/designsystem/context-menu">ContextMenu</Link>. Só a fileira, os gatilhos, o realce, a busca e o movimento são daqui.
      </DocNote>

      <PropsTable
        title="Menubar"
        rows={[
          {
            prop: "variant",
            type: '"floating" | "outline" | "plain" | "solid"',
            default: '"floating"',
            description:
              "A superfície. floating — o padrão — é a pílula com sombra, na tinta flutuante dos menus; outline se sustenta sobre a página, plain mora num cabeçalho, solid é bandeja.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "A altura do gatilho: 28, 32, 36.",
          },
          {
            prop: "search",
            type: "boolean | string",
            description:
              "A busca de comandos ao lado da fileira, pelas linhas de todos os menus; a string é o placeholder.",
          },
          {
            prop: "mobile / mobileLabel",
            type: '"bar" | "sheet" / string',
            default: '"bar" / "Menu"',
            description:
              "sheet troca a fileira, abaixo de 768px, por um botão que abre a folha de ações.",
          },
        ]}
      />

      <PropsTable
        title="MenubarTrigger e MenubarContent"
        rows={[
          {
            prop: "MenubarTrigger icon",
            type: "React.ReactNode",
            description: "O ícone antes do rótulo (16/solid).",
          },
          {
            prop: "MenubarTrigger count",
            type: "number",
            description:
              "A contagem no gatilho. Sem ela, ele conta as caixas marcadas do menu.",
          },
          {
            prop: "MenubarTrigger chevron",
            type: "boolean",
            description: "A seta que gira ao abrir.",
          },
          {
            prop: "MenubarTrigger mnemonic",
            type: "string",
            description:
              "A letra de Alt + letra; sublinhada com o Alt descido. Ela tem de estar no rótulo.",
          },
          {
            prop: "MenubarContent title / description",
            type: "React.ReactNode",
            description:
              "O cabeçalho do painel; nomeia o menu. Sem description, ela diz os rádios marcados.",
          },
        ]}
      />

      <PropsTable
        title="MenubarItem e as linhas com marca"
        rows={[
          {
            prop: "icon",
            type: "React.ReactNode",
            description:
              "O ícone à esquerda; num menu com ícones, as linhas sem ele recuam sozinhas.",
          },
          {
            prop: "shortcut",
            type: "string",
            description:
              "A tecla, na grafia do Kbd: desenhada e ligada enquanto a barra está na tela.",
          },
          {
            prop: "description",
            type: "React.ReactNode",
            description: "A segunda linha.",
          },
          {
            prop: "confirm",
            type: "boolean | string",
            description:
              "O primeiro toque só arma; pela tecla, pela busca ou pela folha, executa direto.",
          },
          {
            prop: "onSelect",
            type: "(e) => void | Promise<unknown>",
            description:
              "Devolvendo Promise, a linha carrega e o menu espera.",
          },
          {
            prop: "variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description: "A mesma dos outros dois menus.",
          },
          {
            prop: "MenubarCheckboxItem closeOnSelect",
            type: "boolean",
            default: "false",
            description: "A caixa não fecha o menu; true devolve o padrão do Radix.",
          },
        ]}
      />
    </>
  )
}

function MenubarCompleto() {
  const [ultimo, setUltimo] = React.useState<string | null>(null)
  const fez = (o: string) => () => setUltimo(o)
  return (
    <>
      <Menubar search>
        <MenubarMenu>
          <MenubarTrigger mnemonic="a">Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              icon={<ArrowDownTrayIcon />}
              shortcut="mod+shift+e"
              onSelect={() =>
                new Promise<void>((r) =>
                  setTimeout(() => {
                    setUltimo("Exportar CSV")
                    r()
                  }, 1200)
                )
              }
            >
              Exportar CSV
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Exportar como</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onSelect={fez("OFX")}>OFX</MenubarItem>
                <MenubarItem onSelect={fez("QIF")}>QIF</MenubarItem>
                <MenubarItem disabled>PDF (em breve)</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarItem
              icon={<ArrowUpTrayIcon />}
              description="OFX ou CSV do banco"
              onSelect={fez("Importar extrato")}
            >
              Importar extrato
            </MenubarItem>
            <MenubarItem icon={<PrinterIcon />} shortcut="mod+p" onSelect={fez("Imprimir")}>
              Imprimir
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              icon={<TrashIcon />}
              variant="destructive"
              confirm="toque de novo para apagar"
              onSelect={fez("Apagar rascunho")}
            >
              Apagar rascunho
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger mnemonic="e">Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Seleção</MenubarLabel>
            <MenubarItem icon={<Square2StackIcon />} shortcut="mod+shift+d" onSelect={fez("Duplicar")}>
              Duplicar
            </MenubarItem>
            <MenubarItem icon={<PencilIcon />} onSelect={fez("Editar em lote")}>
              Editar em lote
            </MenubarItem>
            <MenubarItem disabled>Desfazer</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger mnemonic="x">Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarItem icon={<EyeSlashIcon />} shortcut="mod+shift+h" onSelect={fez("Ocultar valores")}>
              Ocultar valores
            </MenubarItem>
            <MenubarItem icon={<DocumentIcon />} onSelect={fez("Abrir relatório")}>
              Abrir relatório
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {ultimo ? `Executado: ${ultimo}` : ""}
      </p>
    </>
  )
}

function FileiraDeExemplo(props: React.ComponentProps<typeof Menubar>) {
  return (
    <Menubar {...props}>
      <MenubarMenu>
        <MenubarTrigger>Arquivo</MenubarTrigger>
        <MenubarContent>
          <MenubarItem icon={<ArrowDownTrayIcon />}>Exportar CSV</MenubarItem>
          <MenubarItem icon={<ArrowUpTrayIcon />}>Importar extrato</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Editar</MenubarTrigger>
        <MenubarContent>
          <MenubarItem icon={<Square2StackIcon />}>Duplicar</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Exibir</MenubarTrigger>
        <MenubarContent>
          <MenubarItem icon={<EyeIcon />}>Mostrar valores</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

function SuperficiesDemo() {
  const [variant, setVariant] = React.useState<(typeof VARIANTES)[number]>("floating")
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("md")
  return (
    <>
      <Controles
        inicio={
          <>
            <Eixo rotulo="variant" valores={VARIANTES} valor={variant} onChange={setVariant} />
            <Eixo rotulo="size" valores={TAMANHOS} valor={size} onChange={setSize} />
          </>
        }
      />
      <FileiraDeExemplo variant={variant} size={size} />
    </>
  )
}

/**
 * O único espécime em que o material aparece: sobre cor chapada o borrão não
 * desenha nada. O `sticky` é da demonstração — quem gruda a barra é o
 * contêiner.
 */
function FileiraSobreConteudo() {
  return (
    <div className="h-64 overflow-y-auto p-6">
      <FileiraDeExemplo className="sticky top-0 z-10" />
      <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
        {Array.from({ length: 10 }, (_, i) => (
          <p key={i}>
            Mercado · Transporte · Restaurantes · Assinaturas · Saúde ·
            Educação · Lazer · Casa — linha {i + 1} de um extrato qualquer, só
            para haver o que passar por baixo da fileira.
          </p>
        ))}
      </div>
    </div>
  )
}

function MenubarEstado({ mobile = false }: { mobile?: boolean }) {
  const [despesas, setDespesas] = React.useState(true)
  const [parceladas, setParceladas] = React.useState(false)
  const [ordem, setOrdem] = React.useState("data-desc")

  return (
    <Menubar mobile={mobile ? "sheet" : "bar"} mobileLabel="Filtrar e ordenar">
      <MenubarMenu>
        <MenubarTrigger icon={<FunnelIcon />} chevron>
          Filtrar
        </MenubarTrigger>
        <MenubarContent title="Filtrar">
          <MenubarCheckboxItem checked={despesas} onCheckedChange={setDespesas}>
            Só despesas
          </MenubarCheckboxItem>
          <MenubarCheckboxItem checked={parceladas} onCheckedChange={setParceladas}>
            Só parceladas
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger icon={<ArrowsUpDownIcon />} chevron>
          Ordenar
        </MenubarTrigger>
        <MenubarContent title="Ordenar">
          <MenubarRadioGroup value={ordem} onValueChange={setOrdem}>
            <MenubarRadioItem value="data-desc">Mais recentes</MenubarRadioItem>
            <MenubarRadioItem value="data-asc">Mais antigas</MenubarRadioItem>
            <MenubarRadioItem value="valor-desc">Maior valor</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
