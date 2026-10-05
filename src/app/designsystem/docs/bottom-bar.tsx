"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowsRightLeftIcon,
  ChartPieIcon,
  EllipsisHorizontalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"
import {
  ArrowsRightLeftIcon as ArrowsRightLeftSolid,
  ChartPieIcon as ChartPieSolid,
  Squares2X2Icon as Squares2X2Solid,
} from "@heroicons/react/24/solid"
import { PlusIcon } from "@heroicons/react/20/solid"

import {
  BottomBar,
  BottomBarAction,
  BottomBarSkeleton,
  BottomBarSlot,
  BottomBarTab,
} from "@/components/ui/bottom-bar"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

/** As três abas do app, para o espécime não inventar uma navegação própria. */
const ABAS = [
  { href: "/dashboard", label: "Início", icon: Squares2X2Icon, iconActive: Squares2X2Solid },
  { href: "/transactions", label: "Transações", icon: ArrowsRightLeftIcon, iconActive: ArrowsRightLeftSolid },
  { href: "/categories", label: "Categorias", icon: ChartPieIcon, iconActive: ChartPieSolid },
] as const

const ROTULOS = ["false", "true", "active"] as const


/** Conteúdo que rola por baixo — sem ele o vidro não tem o que borrar. */
function Conteudo({ titulo }: { titulo: string }) {
  return (
    // `pt-14`: a Dynamic Island cobre o topo da tela, e a área segura vale zero aqui.
    <div className="flex flex-col gap-2 px-4 pt-14 pb-40">
      <p className="text-lg font-semibold">{titulo}</p>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl bg-muted px-3 py-3">
          <span className="text-sm">Mercado</span>
          <MoneyDisplay value={-(i + 1) * 37.4} size="sm" />
        </div>
      ))}
    </div>
  )
}

/** O índice do slot da conta, que é o item depois das abas. */
const SLOT = ABAS.length

function DemoNaTela() {
  const [ativa, setAtiva] = React.useState(1)
  const [rotulos, setRotulos] = React.useState<(typeof ROTULOS)[number]>("false")
  const [acao, setAcao] = React.useState(true)
  const [rolar, setRolar] = React.useState(false)
  const [contagem, setContagem] = React.useState(false)
  const [carregando, setCarregando] = React.useState(false)
  const [vidro, setVidro] = React.useState(false)

  const labels = rotulos === "true" ? true : rotulos === "active" ? "active" : false
  const titulo = ativa === SLOT ? "Conta" : ABAS[ativa].label

  return (
    <div className="flex w-full flex-col items-center">
      <Controles
        inicio={<Eixo rotulo="labels" valores={ROTULOS} valor={rotulos} onChange={setRotulos} />}
        fim={
          <Interruptores>
            <Interruptor id="bb-glass" rotulo="glass" valor={vidro} onChange={setVidro} />
            <Interruptor id="bb-acao" rotulo="BottomBarAction" valor={acao} onChange={setAcao} />
            <Interruptor id="bb-rolar" rotulo="hideOnScroll" valor={rolar} onChange={setRolar} />
            <Interruptor id="bb-contagem" rotulo="count" valor={contagem} onChange={setContagem} />
            <Interruptor id="bb-esqueleto" rotulo="BottomBarSkeleton" valor={carregando} onChange={setCarregando} />
          </Interruptores>
        }
      />

      <IphoneFrame>
        <div className="h-full overflow-y-auto bg-background">
          <Conteudo titulo={titulo} />
        </div>
        {carregando ? (
          <BottomBarSkeleton tabs={ABAS.length + 1} action={acao} labels={labels === true} />
        ) : (
          <BottomBar
            labels={labels}
            glass={vidro}
            hideOnScroll={rolar}
            action={
              acao ? (
                <BottomBarAction label="Adicionar">
                  <PlusIcon className="size-5" aria-hidden />
                </BottomBarAction>
              ) : undefined
            }
          >
            {ABAS.map((aba, i) => (
              <BottomBarTab
                key={aba.href}
                // O espécime é **desligado do roteador**: o `href` fica, porque
                // é o que o trecho ensina, mas o clique não navega — a moldura
                // levaria a demonstração embora.
                href={aba.href}
                label={aba.label}
                icon={aba.icon}
                iconActive={aba.iconActive}
                active={i === ativa}
                count={contagem && i === 1 ? 3 : undefined}
                countLabel="novas"
                onClick={(e) => {
                  e.preventDefault()
                  setAtiva(i)
                }}
              />
            ))}
            <BottomBarSlot
              aria-label="Abrir menu da conta"
              label="Conta"
              active={ativa === SLOT}
              count={contagem ? true : undefined}
              onClick={() => setAtiva(SLOT)}
            >
              <EllipsisHorizontalIcon className="size-6 shrink-0" aria-hidden />
            </BottomBarSlot>
          </BottomBar>
        )}
      </IphoneFrame>
    </div>
  )
}

export default function BottomBarDoc() {
  return (
    <>
      <Usage>
        A navegação primária do telefone. No desktop quem navega é a{" "}
        <code>Sidebar</code>, e quem fica no topo é o <code>TopBar</code> — esta
        barra <strong>não existe</strong> acima de <code>md</code>, e é o CSS que
        a esconde, não um hook de largura.
      </Usage>

      <DocSection
        title="A barra"
        description="Três abas, o slot da conta e a ação, flutuando sobre a lista. A referência é o Tabs: a pílula com o anel de 1px, o marcador em relevo e a viagem líquida. Arraste o dedo (ou o cursor) pela pílula e solte numa aba; toque na aba ativa e a lista volta ao topo."
        code={`<BottomBar
  labels="active"
  hideOnScroll
  action={<BottomBarAction label="Adicionar"><PlusIcon /></BottomBarAction>}
>
  {abas.map((aba) => (
    <BottomBarTab key={aba.href} href={aba.href} label={aba.label}
      icon={aba.icon} iconActive={aba.iconActive}
      active={aba.href === pathname} count={aba.count} countLabel="a vencer" />
  ))}
  <BottomBarSlot aria-label="Abrir menu da conta" count>…</BottomBarSlot>
</BottomBar>

// enquanto a casca carrega
<BottomBarSkeleton tabs={4} />`}
        previewClassName="justify-center"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O marcador é o do Tabs">
        Ele corre pela receita do alternador de tema (<code>viajarLiquido</code>, o trajeto macio das abas): inércia, um esticão proporcional às abas andadas e o pouso. Em repouso é a tecla em relevo — <code>--muted</code>, anel e <code>shadow-xs</code>, 2px para dentro do item. Antes de medir, o próprio item pinta a mesma tecla, e a troca não pisca.
      </DocNote>

      <DocNote title="A tecla tem tom próprio, e o vidro é opcional">
        O marcador era <code>--muted</code> — o mesmo fundo das linhas que passam por trás —, e sobre uma linha ele empatava com a pílula: ~1,09:1. Hoje a pílula é a tinta dos flutuantes a 82% e a tecla é <code>--bottom-bar-key</code>, a tinta do texto misturada ao <code>--popover</code> (12% no claro, 18% no escuro), que nenhum conteúdo usa — 1,32:1 e 1,52:1 sobre uma linha. Com <code>glass</code> a tecla veste o vidro do <code>TabsList glass</code> sobre esse mesmo tom: muda o material, não o contraste.
      </DocNote>

      <DocNote title="Um anel, nos dois temas">
        A pílula tinha borda <strong>e</strong> anel porque cada um só aparecia num tema. O anel em <code>--foreground</code> a 10% (o das <code>Tabs</code>) escurece no claro e clareia no escuro, e substituiu os dois. A ação veste o mesmo anel e a mesma sombra: as duas peças são uma família.
      </DocNote>

      <DocNote title="Rótulo só na ativa">
        <code>labels=&quot;active&quot;</code> abre o nome ao lado do ícone na aba ativa, como uma aba de <code>Tabs</code>, e as outras dividem o resto. A barra continua com 56 — o rótulo embaixo (<code>labels</code>) a leva a 64.
      </DocNote>

      <DocNote title="O arraste e o toque">
        O dedo desliza pela pílula e o marcador segue o item sob ele; soltar num item diferente o clica — o link navega, o slot abre o menu. Só começa depois de 8px de lado, antes disso é um toque. No toque o ícone afunda a 88% e volta na mola, e quando a aba passa a ativa o sólido entra com um estalo (não na montagem).
      </DocNote>

      <DocNote title="Some ao rolar, com a ação junto">
        Com <code>hideOnScroll</code>, rolar para baixo afunda a pílula e a ação juntas — uma ação sozinha no canto lê como botão esquecido e cobre a lista — e rolar para cima as traz de volta. A saída encolhe da base e apaga em <code>--ease-in-out</code>, e a volta sobe na mola — as duas em <code>--duration-gentle</code> (700ms). No topo e com o foco dentro da barra, ela nunca some. A barra ouve a rolagem em captura e guarda quem rolou por último — é essa a lista que a aba ativa leva ao topo.
      </DocNote>

      <DocNote title="Link ou botão sai da rota, e não de uma escolha">
        Ninguém escolhe o elemento: com <code>href</code> a aba é link (<code>aria-current=&quot;page&quot;</code>, abre em nova aba, pré-carrega), e sem <code>href</code> é botão (<code>aria-pressed</code>). Quem passa o <code>href</code> é o mapa de rotas — no app as abas saem de <code>config/mobile-navigation</code> e são todas links; o &quot;+&quot; é o <code>BottomBarAction</code> e a conta é o <code>BottomBarSlot</code>, botões que abrem uma gaveta. A aba sem <code>href</code> existe para a tela que troca de vista sem mudar de rota.
      </DocNote>

      <DocNote title="A contagem entra no nome">
        <code>count</code> põe o número (até 99+) ou, com <code>true</code>, o ponto no canto do ícone; ele é <code>aria-hidden</code>, e o leitor de tela ouve o nome: &quot;Transações, 3 novas&quot;. <code>countLabel</code> diz o que se conta.
      </DocNote>

      <DocNote title="A aba ativa preenche, e isso não contraria a regra do conjunto">
        <code>iconActive</code> é o par sólido, a convenção de tab bar do iOS. Não fere a <Link href="/designsystem/iconography">regra do conjunto</Link>: a grade é 24 dos dois lados, e muda só o preenchimento.
      </DocNote>

      <DocNote title="A tela é uma viewport de verdade, e a área segura vale zero">
        O iPhone é o mesmo de <Link href="/designsystem/touch-safe-area">Touch & safe area</Link>, desenhado a 85%, com uma viewport de 375px dentro — o <code>zoom</code> encolhe o desenho, e as media queries continuam lendo o telefone. <code>env(safe-area-inset-bottom)</code> vale 0 aqui: num aparelho a barra ganha mais 34px de folga embaixo, e <code>--bottom-bar-pad</code> acompanha.
      </DocNote>

      <PropsTable
        title="Eixos de BottomBar"
        rows={[
          { prop: "labels", type: 'boolean | "active"', default: "false", description: "O nome sob o ícone (64), ou só na ativa, ao lado do ícone (56)." },
          { prop: "glass", type: "boolean", default: "false", description: "O marcador de vidro, como o glass do TabsList — o aro e o reflexo sobre o mesmo tom da tecla." },
          { prop: "hideOnScroll", type: "boolean", default: "false", description: "Rolando para baixo a pílula e a ação afundam juntas; rolando para cima, voltam." },
          { prop: "action", type: "ReactNode", description: "A ação primária, à direita da pílula — um BottomBarAction." },
          { prop: "shape", type: '"island"', default: '"island"', description: "Flutua com margem nos quatro lados." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "BottomBarTab", type: "label, icon, iconActive?, active?, href?, count?, countLabel?", description: "Uma aba. Com href é link (aria-current=\"page\"); sem, é botão (aria-pressed). Tocar na ativa sobe ao topo." },
          { prop: "BottomBarSlot", type: 'ComponentProps<"button"> & { label?, active?, count?, asChild? }', description: "A mesma caixa para o gatilho de um menu ou gaveta; não recebe aria-current." },
          { prop: "BottomBarAction", type: "Button & { label }", default: 'variant="primary"', description: "A ação redonda na altura da barra, com o anel e a sombra da pílula; o nome é obrigatório." },
          { prop: "BottomBarSkeleton", type: "tabs?, action?, labels?", description: "A barra enquanto a casca carrega, no mesmo lugar e na mesma altura." },
          { prop: "bottom-bar-marker", type: "data-slot", description: "O marcador que viaja, montado pela pílula; ninguém o escreve." },
          { prop: "bottomBarActionClassName", type: "string", description: "A régua da ação, para quem não usa o BottomBarAction." },
        ]}
      />
    </>
  )
}
