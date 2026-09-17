"use client"

import * as React from "react"
import Link from "next/link"

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
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Kbd } from "@/components/ui/kbd"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const VARIANTES = [
  {
    valor: "outline",
    quando: "Sobre a página, sem moldura em volta — ela se sustenta sozinha.",
  },
  {
    valor: "plain",
    quando: "Dentro de um cabeçalho que já tem a própria borda.",
  },
  {
    valor: "solid",
    quando: "Bandeja preenchida, como a do Tabs. O gatilho aberto sobe dela.",
  },
] as const

const TAMANHOS = [
  { valor: "sm", gatilho: "28" },
  { valor: "md", gatilho: "32" },
  { valor: "lg", gatilho: "36" },
] as const

/**
 * O único espécime em que o material da fileira aparece: sobre cor chapada o
 * borrão não desenha nada. O `sticky` é da demonstração, não um eixo — quem
 * gruda a barra é o contêiner.
 */
function FileiraSobreConteudo() {
  return (
    <div className="h-64 overflow-y-auto p-6">
      <Menubar className="sticky top-0">
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Exportar CSV</MenubarItem>
            <MenubarItem>Importar extrato</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Ocultar valores</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
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

export default function MenubarDoc() {
  return (
    <>
      <Usage>
        Uma fileira de menus percorrida com a seta, para <strong>dezenas de comandos agrupados por assunto</strong>. Para as ações de um objeto use <code>DropdownMenu</code>; para navegar, a <code>Sidebar</code>.
      </Usage>

      <DocSection
        title="Completo"
        code={`<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Exportar CSV<MenubarShortcut><Kbd keys="mod+e" /></MenubarShortcut></MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>Exportar como</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem>OFX</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Apagar rascunho</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}
        previewClassName="items-start"
      >
        <MenubarCompleto />
      </DocSection>

      <DocSection
        title="Superfícies"
        code={`<Menubar variant="outline" />   // se sustenta sozinha
<Menubar variant="plain" />     // dentro de um cabeçalho
<Menubar variant="solid" />     // bandeja, como o Tabs`}
        previewClassName="items-start"
      >
        <div className="flex flex-col gap-5">
          {VARIANTES.map((v) => (
            <div key={v.valor} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <code className="text-xs font-medium text-foreground">
                  {v.valor}
                </code>
                <span className="text-xs text-muted-foreground">
                  {v.quando}
                </span>
              </div>
              <Menubar variant={v.valor}>
                <MenubarMenu>
                  <MenubarTrigger>Arquivo</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Exportar CSV</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Exibir</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Ocultar valores</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Sobre conteúdo que rola"
        description="A fileira outline veste a régua de barra: opaca de base, abrindo a 60% onde há backdrop-filter. Role a região: o texto passa borrado por baixo dela."
        code={`<div className="h-64 overflow-y-auto">
  <Menubar className="sticky top-0">…</Menubar>
  {/* o conteúdo passa por baixo */}
</div>`}
        previewClassName="block p-0"
      >
        <FileiraSobreConteudo />
      </DocSection>

      <DocSection
        title="Tamanhos"
        code={`<Menubar size="sm" />   // gatilho 28
<Menubar size="md" />   // gatilho 32 — o padrão
<Menubar size="lg" />   // gatilho 36`}
        previewClassName="items-start"
      >
        <div className="flex flex-col gap-5">
          {TAMANHOS.map((t) => (
            <div key={t.valor} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <code className="text-xs font-medium text-foreground">
                  {t.valor}
                </code>
                <span className="text-xs text-muted-foreground nums">
                  gatilho {t.gatilho}px
                </span>
              </div>
              <Menubar size={t.valor}>
                <MenubarMenu>
                  <MenubarTrigger>Arquivo</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Exportar CSV</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Exibir</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Ocultar valores</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Marca e escolha"
        code={`<MenubarCheckboxItem checked={denso} onCheckedChange={setDenso}>
  Modo denso
</MenubarCheckboxItem>

<MenubarRadioGroup value={periodo} onValueChange={setPeriodo}>
  <MenubarRadioItem value="mes">Este mês</MenubarRadioItem>
</MenubarRadioGroup>`}
        previewClassName="items-start"
      >
        <MenubarEstado />
      </DocSection>

      <DocNote title="Ela se paga a partir de três grupos">
        Uma barra de menus serve o que não cabe num botão nem num menu único: dezenas de comandos, agrupados por assunto, com atalhos e submenus. Abaixo de uns três grupos e doze comandos ela cobra aprender uma fileira inteira e devolve o que um{" "}
        <Link href="/designsystem/dropdown-menu">DropdownMenu</Link> já dava. Ações de um objeto (editar, duplicar, excluir) são <code>DropdownMenu</code>; navegar é a{" "}
        <Link href="/designsystem/sidebar">Sidebar</Link>.
      </DocNote>

      <DocNote title="O tamanho mede o gatilho, não a barra">
        Os degraus 28 · 32 · 36 são a altura do gatilho, e a barra cresce em volta dele. Ancorar no contêiner espreme o gatilho para o degrau <code>xs</code> (24), que é para dentro de outro controle.
      </DocNote>

      <DocNote title="Só a fileira outline é vidro">
        A <code>outline</code> veste <code>barSurfaceClassName</code>, a régua de barra do cabeçalho deste catálogo: <code>--background</code> a 95%, abrindo a 60% onde há <code>backdrop-filter</code>, nos dois temas, com guarda de transparência reduzida. <code>solid</code> fica opaca porque translúcida deixa de ler como bandeja; <code>plain</code> fica transparente porque mora dentro de um cabeçalho que já é o vidro.
      </DocNote>

      <DocNote title="Na bandeja, o realce sobe em vez de tingir">
        <code>--accent</code> e <code>--muted</code> são praticamente a mesma cor, então acender com <code>accent</code> sobre a bandeja não desenharia nada. No <code>solid</code> o gatilho aberto ganha <code>bg-background</code>, um fio e uma sombra, como o <code>TabsTrigger</code>.
      </DocNote>

      <DocNote title="O painel é o mesmo dos outros dois menus">
        Casca, linha, rótulo, fio e atalho vêm de <code>lib/menu-classes</code>, os mesmos do{" "}
        <Link href="/designsystem/dropdown-menu">DropdownMenu</Link> e do{" "}
        <Link href="/designsystem/context-menu">ContextMenu</Link> — com teto de altura, animação de saída e linha de 44px no toque. Só a fileira e os gatilhos são daqui.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"outline" | "plain" | "solid"',
            default: '"outline"',
            description: "A superfície da barra; desce por contexto até o gatilho, porque o realce depende de sobre o que ele acende.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "A altura do gatilho: 28, 32, 36. O piso é 28 — xs (24) é para dentro de outro controle.",
          },
          {
            prop: "MenubarItem variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description: "A mesma variant dos outros dois menus.",
          },
          {
            prop: "MenubarItem inset",
            type: "boolean",
            description:
              "Alinha o rótulo à coluna de quem tem ícone, num menu que mistura os dois.",
          },
        ]}
      />
    </>
  )
}

function MenubarCompleto() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Arquivo</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Exportar CSV
            <MenubarShortcut>
              <Kbd keys="mod+e" />
            </MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Exportar como</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>OFX</MenubarItem>
              <MenubarItem>QIF</MenubarItem>
              <MenubarItem disabled>PDF (em breve)</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem>
            Importar extrato
            <MenubarShortcut>
              <Kbd keys="mod+i" />
            </MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem variant="destructive">Apagar rascunho</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Editar</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>Seleção</MenubarLabel>
          <MenubarItem>
            Selecionar tudo
            <MenubarShortcut>
              <Kbd keys="mod+a" />
            </MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>Desfazer</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Exibir</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Ocultar valores</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

function MenubarEstado() {
  const [denso, setDenso] = React.useState(true)
  const [ocultar, setOcultar] = React.useState(false)
  const [periodo, setPeriodo] = React.useState("mes")

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Exibir</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>Densidade</MenubarLabel>
          <MenubarCheckboxItem checked={denso} onCheckedChange={setDenso}>
            Modo denso
          </MenubarCheckboxItem>
          <MenubarCheckboxItem checked={ocultar} onCheckedChange={setOcultar}>
            Ocultar valores
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarLabel>Período</MenubarLabel>
          <MenubarRadioGroup value={periodo} onValueChange={setPeriodo}>
            <MenubarRadioItem value="mes">Este mês</MenubarRadioItem>
            <MenubarRadioItem value="trimestre">Trimestre</MenubarRadioItem>
            <MenubarRadioItem value="ano">Ano</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
