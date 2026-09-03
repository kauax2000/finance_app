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

export default function MenubarDoc() {
  return (
    <>
      <Usage>
        Uma fileira de menus percorrida com a seta: abre um, arrasta o cursor
        para o vizinho e ele abre também. É o formato certo para{" "}
        <strong>dezenas de comandos agrupados por assunto</strong> — o que este
        app ainda não tem em lugar nenhum.
      </Usage>

      <DocSection
        title="Completo"
        code={`<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Exportar CSV<MenubarShortcut>⌘E</MenubarShortcut></MenubarItem>
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

      <DocNote title="Quando ela se paga — e a conta deste app">
        Uma barra de menus existe para o que não cabe num botão nem num menu
        único: <strong>dezenas de comandos, agrupados por assunto</strong>, com
        atalhos e submenus. A régua prática são três grupos e algo como doze
        comandos — abaixo disso ela cobra a mordida de aprender uma fileira
        inteira e devolve o que um <Link href="/designsystem/dropdown-menu">
        DropdownMenu</Link> já dava.
        <br />
        <br />
        <strong>A superfície mais densa deste app tem 4 comandos.</strong> São
        47 no total, espalhados por 18 arquivos, e nenhum agrupado por assunto —
        são ações de um objeto (editar, duplicar, excluir), que é exatamente o
        caso do <code>DropdownMenu</code>. Enquanto essa conta não virar, o
        componente está aqui completo e correto, e a resposta certa continua
        sendo a <Link href="/designsystem/sidebar">Sidebar</Link> para navegar e
        o <code>DropdownMenu</code> para agir.
      </DocNote>

      <DocNote title="O tamanho mede o gatilho, não a barra">
        O <Link href="/designsystem/tabs">TabsList</Link> ancora a escada no
        contêiner, e pode: as abas dele esticam, então a altura da lista
        determina a do gatilho. Aqui não — os gatilhos são do tamanho do próprio
        rótulo, e a barra cresce em volta deles. Ancorar no contêiner foi
        justamente o que produziu o defeito que esta revisão corrigiu: a barra
        era <code>h-8</code> com 3px de recuo e uma borda, e o que
        sobrava para o gatilho eram <strong>24px</strong> — o degrau{" "}
        <code>xs</code>, que o projeto reserva para dentro de outro controle.
      </DocNote>

      <DocNote title="Na bandeja, o realce sobe em vez de tingir">
        <code>--accent</code> e <code>--muted</code> são quase a mesma cor no
        tema claro e <strong>exatamente</strong> a mesma no escuro
        (<code>oklch(0.269 0 0)</code>). Acender com <code>accent</code> sobre
        uma bandeja <code>muted</code> não desenharia nada. Por isso o{" "}
        <code>solid</code> segue o <code>TabsTrigger</code>: o gatilho aberto
        ganha <code>bg-background</code>, um fio e uma sombra, e se separa por
        altura.
      </DocNote>

      <DocNote title="O painel é o mesmo dos outros dois menus">
        Casca, linha, rótulo, fio e atalho vêm de{" "}
        <code>lib/menu-classes</code> — os mesmos do{" "}
        <Link href="/designsystem/dropdown-menu">DropdownMenu</Link> e do{" "}
        <Link href="/designsystem/context-menu">ContextMenu</Link>. Só a fileira
        e os gatilhos são daqui. Junto vieram o teto de altura (o painel não
        tinha e um menu longo saía da tela), a animação de saída (ele sumia seco
        enquanto o próprio submenu desvanecia) e a linha de 44px no toque.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"outline" | "plain" | "solid"',
            default: '"outline"',
            description:
              "A superfície da barra. Desce por contexto até o gatilho, porque o realce depende de sobre o que ele acende.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "A altura do gatilho: 28, 32, 36. O piso é 28 — xs (24) é para dentro de outro controle.",
          },
          {
            prop: "MenubarItem variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description:
              "A mesma variant dos outros dois menus, com o realce e o par escuro juntos.",
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
            <MenubarShortcut>⌘E</MenubarShortcut>
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
            <MenubarShortcut>⌘I</MenubarShortcut>
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
            <MenubarShortcut>⌘A</MenubarShortcut>
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
