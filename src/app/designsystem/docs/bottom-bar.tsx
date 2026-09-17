"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowsRightLeftIcon,
  ChartPieIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"
import {
  ArrowsRightLeftIcon as ArrowsRightLeftSolid,
  ChartPieIcon as ChartPieSolid,
  Squares2X2Icon as Squares2X2Solid,
} from "@heroicons/react/24/solid"
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline"
import { PlusIcon } from "@heroicons/react/20/solid"

import {
  BottomBar,
  BottomBarSlot,
  BottomBarTab,
  bottomBarActionClassName,
} from "@/components/ui/bottom-bar"
import { Button } from "@/components/ui/button"
import { Muted, Small } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { PhoneFrame } from "../ds-frame"

/** As três abas do app, para o espécime não inventar uma navegação própria. */
const ABAS = [
  {
    href: "/dashboard",
    label: "Início",
    icon: Squares2X2Icon,
    iconActive: Squares2X2Solid,
  },
  {
    href: "/transactions",
    label: "Transações",
    icon: ArrowsRightLeftIcon,
    iconActive: ArrowsRightLeftSolid,
  },
  {
    href: "/categories",
    label: "Categorias",
    icon: ChartPieIcon,
    iconActive: ChartPieSolid,
  },
] as const

/** Conteúdo que rola por baixo — sem ele o vidro não tem o que borrar. */
function Conteudo() {
  return (
    <div className="flex flex-col gap-2 p-4 pb-40">
      <Small className="font-medium">Transações</Small>
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg bg-primary/15 px-3 py-2.5"
        >
          <span className="text-xs">Mercado</span>
          <span className="nums text-xs">−R$ {(i + 1) * 37},40</span>
        </div>
      ))}
    </div>
  )
}

/** O índice do slot da conta, que é o item depois das abas. */
const SLOT = ABAS.length

function Barra({
  labels = false,
  ativa = 0,
  onSelecionar,
  comAcao = true,
}: {
  labels?: boolean
  ativa?: number
  onSelecionar?: (indice: number) => void
  comAcao?: boolean
}) {
  return (
    <BottomBar
      labels={labels}
      action={
        comAcao ? (
          <Button
            variant="primary"
            className={bottomBarActionClassName}
            aria-label="Adicionar"
          >
            <PlusIcon className="size-5 shrink-0" />
          </Button>
        ) : undefined
      }
    >
      {ABAS.map((aba, i) => (
        <BottomBarTab
          key={aba.href}
          href={aba.href}
          label={aba.label}
          icon={aba.icon}
          iconActive={aba.iconActive}
          active={i === ativa}
          // O espécime é **desligado do roteador**: o `href` fica, porque é o
          // que o trecho de código ensina e é o que dá o menu de contexto e o
          // "abrir em nova aba" ao link. O que não pode acontecer é a moldura
          // navegar e levar a demonstração embora — daí o `preventDefault`.
          onClick={(e) => {
            e.preventDefault()
            onSelecionar?.(i)
          }}
        />
      ))}
      <BottomBarSlot
        aria-label="Abrir menu da conta"
        label="Conta"
        active={ativa === SLOT}
        onClick={() => onSelecionar?.(SLOT)}
      >
        <EllipsisHorizontalIcon className="size-6 shrink-0" aria-hidden />
      </BottomBarSlot>
    </BottomBar>
  )
}

function Palco({
  ativa: ativaInicial = 0,
  ...props
}: Omit<React.ComponentProps<typeof Barra>, "onSelecionar">) {
  const [ativa, setAtiva] = React.useState(ativaInicial)

  return (
    <PhoneFrame>
      <div className="h-full overflow-y-auto bg-background">
        <Conteudo />
      </div>
      <Barra {...props} ativa={ativa} onSelecionar={setAtiva} />
    </PhoneFrame>
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
        title="A barra do app"
        description="Três abas, o slot da conta e a ação primária, flutuando sobre o conteúdo que rola. Os espécimes selecionam em vez de navegar, e o realce viaja em vez de piscar."
        code={`<BottomBar action={<Button variant="primary" className={bottomBarActionClassName}><PlusIcon /></Button>}>
  {abas.map((aba) => (
    <BottomBarTab key={aba.href} href={aba.href} label={aba.label}
      icon={aba.icon} active={aba.href === pathname} />
  ))}
  <BottomBarSlot aria-label="Abrir menu da conta">
    {/* avatar, ícone da rota ativa, esqueleto — quem sabe é o app */}
  </BottomBarSlot>
</BottomBar>`}
        previewClassName="justify-center"
      >
        <Palco />
      </DocSection>

      <DocSection
        title="Com rótulo"
        description="labels põe o nome sob o ícone e leva a barra de 56 para 64. Desligado por padrão."
        code={`<BottomBar labels>…</BottomBar>`}
        previewClassName="justify-center gap-8"
      >
        <div className="flex flex-col items-center gap-2">
          <Muted className="text-2xs uppercase">padrão — 56</Muted>
          <Palco ativa={1} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Muted className="text-2xs uppercase">labels — 64</Muted>
          <Palco labels ativa={1} />
        </div>
      </DocSection>

      <DocSection
        title="Sem ação"
        description="A ação é um slot, e ele é opcional: sem ela a pílula ocupa a linha inteira."
        code={`<BottomBar>…</BottomBar>`}
        previewClassName="justify-center"
      >
        <Palco comAcao={false} ativa={2} />
      </DocSection>

      <DocNote title="O marcador viaja, e o item cede o fundo">
        O realce é <strong>um</strong> nó que corre pela pílula até o item ativo, em <code>--duration-base</code> com <code>--ease-out</code> — o mecanismo do <code>Tabs</code>. Item que pinta o próprio fundo <em>teleporta</em>. O item é <code>relative</code> e o marcador não tem <code>z-index</code>, para não cobrir o ícone nem escapar para trás da pílula; antes de medir, o próprio item pinta o realce, e a troca não pisca.
      </DocNote>

      <DocNote title="A aba ativa preenche, e isso não contraria a regra do conjunto">
        <code>iconActive</code> é o par sólido, a convenção de tab bar do iOS. Não fere a <Link href="/designsystem/iconography">regra do conjunto</Link>: a grade é 24 dos dois lados, e muda só o preenchimento. É prop porque a peça não tem como adivinhar o sólido de um ícone.
      </DocNote>

      <DocNote title="O alvo é a caixa, e não um pseudo-elemento">
        O controle <strong>é</strong> a área, com o glifo centralizado: um <code>::after</code> de 44px em cada item engoliria o vizinho. Cada item fica acima dos 44px de <Link href="/designsystem/touch-safe-area">Touch & safe area</Link>.
      </DocNote>

      <DocNote title="O vidro é o da folha, e não o da barra">
        A ilha flutua com margem, e veste <code>--mobile-glass-bg</code> (55/45), calibrado para uma folha sobre a página. <code>barSurfaceClassName</code> (95/60) é para barra <strong>rente</strong> à borda, e deixaria a pílula quase opaca.
      </DocNote>

      <DocNote title="A ação lê a altura da barra, porque 56 não é degrau">
        A escada do <code>Button</code> termina em 40; <code>bottomBarActionClassName</code> lê <code>--bottom-bar-h</code>, então com <code>labels</code> a ação vai a 64 junto. Ela <strong>não declara cor</strong>: quem pinta é o <code>variant</code> do <code>Button</code>.
      </DocNote>

      <DocNote title="A área segura vale zero nesta moldura">
        O <code>PhoneFrame</code> não é aparelho: <code>env(safe-area-inset-bottom)</code> vale 0 aqui. Num iPhone a barra ganha mais 34px de folga embaixo, e <code>--bottom-bar-pad</code> acompanha.
      </DocNote>

      <PropsTable
        title="Eixos de BottomBar"
        rows={[
          {
            prop: "labels",
            type: "boolean",
            default: "false",
            description:
              "O nome sob o ícone. Ligado, a barra vai de 56 para 64 e a ação acompanha.",
          },
          {
            prop: "shape",
            type: '"island"',
            default: '"island"',
            description:
              "Flutua com margem nos quatro lados; a faixa rente à borda entra quando houver caso.",
          },
          {
            prop: "action",
            type: "ReactNode",
            description:
              "A ação primária, à direita da pílula. Quem a pinta é quem a passa.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "BottomBarTab",
            type: "ComponentProps<typeof Link> & { label, icon, iconActive?, active? }",
            description:
              "Uma aba; active escreve aria-current=\"page\" e data-active, e com iconActive o glifo troca para o sólido.",
          },
          {
            prop: "BottomBarSlot",
            type: 'ComponentProps<"button"> & { label?, active?, asChild? }',
            description:
              "A mesma caixa sem href, para o gatilho de um popover; não recebe aria-current.",
          },
          {
            prop: "bottom-bar-marker",
            type: "data-slot",
            description:
              "O realce que viaja, montado pela pílula; ninguém o escreve.",
          },
          {
            prop: "BottomBarTabs",
            type: 'ComponentProps<"div">',
            description:
              "A pílula de vidro; as colunas saem da contagem de filhos.",
          },
          {
            prop: "BottomBarRow",
            type: 'ComponentProps<"div">',
            description:
              "A linha que recebe eventos; a casca é pointer-events-none para não engolir o toque na base da tela.",
          },
          {
            prop: "bottomBarActionClassName",
            type: "string",
            description:
              "A ação na altura da barra, para vestir um Button; sem cor.",
          },
        ]}
      />
    </>
  )
}
