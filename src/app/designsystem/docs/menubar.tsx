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

/**
 * O único espécime em que o material da fileira aparece.
 *
 * `backdrop-filter` sobre cor chapada não desenha nada, e o `Preview` é um
 * cartão liso: nas outras seções a fileira `outline` sai idêntica à opaca. Aqui
 * ela gruda no topo de um rolável e o texto passa por baixo — que é a forma do
 * cabeçalho fixo, e a única em que há o que borrar.
 *
 * O `sticky` é da demonstração, e não um eixo do componente: quem gruda a barra
 * é o contêiner. O `sticky` da `Toolbar` já foi reprovado por contagem zero, e
 * o `Menubar` não tem consumidor nenhum no app.
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
        title="Sobre conteúdo que rola"
        description="A fileira outline veste a régua de barra — a mesma receita do cabeçalho deste catálogo: --background opaco de base, abrindo a 60% onde o backdrop-filter existe. Role a região: o texto passa borrado por baixo dela. É o único espécime da página em que o material aparece, porque sobre um cartão liso não há o que borrar."
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

      <DocNote title="A fileira é vidro, e só a que se sustenta sozinha">
        A <code>outline</code> veste <code>barSurfaceClassName</code>, a régua
        de barra da casa — a mesma do cabeçalho deste catálogo:{" "}
        <code>--background</code> a 95% de base, abrindo a 60% onde o{" "}
        <code>backdrop-filter</code> existe, <strong>nos dois temas</strong>, com
        o guarda de <code>prefers-reduced-transparency</code>. Não é a régua do
        painel: aquela é <code>--popover</code> e só abre no escuro.
        <br />
        <br />
        As outras duas ficam opacas, e cada uma por um motivo medido.{" "}
        <code>solid</code> é bandeja: a 60% no escuro ela cai de rgb 38 para{" "}
        <strong>27</strong> sobre a página, enfraquece e deixa de ler como
        bandeja — e divergiria da <code>TabsList solid</code>, com quem é
        idêntica hoje. <code>plain</code> vive dentro de um cabeçalho que{" "}
        <em>já é</em> o vidro, e uma segunda placa sobre a primeira empilha
        borrão sem desenhar nada.
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
