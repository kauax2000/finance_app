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
        description="Três abas, o slot da conta e a ação primária, flutuando sobre o conteúdo que rola. É a forma que o app renderiza hoje — toque nas abas: os espécimes desta página selecionam em vez de navegar, e o realce viaja em vez de piscar."
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
        description="O eixo labels liga o nome sob o ícone e leva a barra de 56 para 64. O padrão é desligado: nenhuma tela do app pede rótulo hoje, e o eixo existe para a decisão ser uma prop em vez de uma rodada."
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
        O realce não mora mais em cada item: é <strong>um</strong> nó que corre
        pela pílula — o mecanismo do marcador do <code>Tabs</code> e da pílula da{" "}
        <code>Sidebar</code> flutuante. A pílula publica a caixa do item ativo em
        quatro variáveis, lidas por <code>offsetLeft</code>/<code>offsetTop</code>,
        e o marcador transiciona para ela em <code>--duration-base</code> com{" "}
        <code>--ease-out</code>. Cada item pintando o próprio fundo{" "}
        <em>teleporta</em>; um marcador que se move diz de onde veio.
        <br />
        <br />
        Duas razões mecânicas, as duas medidas nas peças-irmãs: o item é{" "}
        <code>relative</code>, senão o marcador posicionado pintaria por cima do
        ícone; e não há <code>-z-10</code>, porque <code>relative</code> com{" "}
        <code>z-index: auto</code> não cria contexto de empilhamento e o marcador
        escaparia para trás da pílula. Antes de medir — no HTML do servidor e sem
        JavaScript — o próprio item pinta o realce, no mesmo alfa, e a troca não
        pisca.
      </DocNote>

      <DocNote title="A aba ativa preenche, e isso não contraria a regra do conjunto">
        <code>iconActive</code> é o par sólido, e a aba o troca quando está
        ativa — a convenção de tab bar do iOS. A{" "}
        <Link href="/designsystem/iconografia">regra do conjunto</Link> não é ferida:
        ela existe porque 24, 20 e 16 são <em>redesenhos</em> para tamanhos
        diferentes, e aqui a grade é a mesma dos dois lados — 24 —, mudando só o
        preenchimento. O auditor concorda, porque compara o número do conjunto e
        não o traço.
        <br />
        <br />
        Ele é <strong>prop</strong> e não derivação: a peça não tem como saber o
        sólido de um ícone qualquer, e adivinhar por nome quebraria no build de
        produção, onde o nome da função é mangled. Quem não passa o par continua
        de contorno.
      </DocNote>

      <DocNote title="O alvo é a caixa, e não um pseudo-elemento">
        Numa fileira de alvos adjacentes um <code>::after</code> de 44px em cada
        item engoliria o vizinho — é a ressalva que a <code>Pagination</code> e o{" "}
        <code>Carousel</code> registram. Aqui o padrão é o da{" "}
        <code>Pagination</code>: o controle <strong>é</strong> a área, e o glifo
        é o filho centralizado. Medido a 375px, cada item sai com ~67×52 — folgado
        sobre os 44 que a Fundação{" "}
        <Link href="/designsystem/mobile-toque">Toque e área segura</Link> define.
      </DocNote>

      <DocNote title="O vidro é o da folha, e não o da barra">
        A casa tem três réguas de vidro em <code>lib/</code>, e esta não veste
        nenhuma. <code>barSurfaceClassName</code> é <code>--background</code> a
        95/60 e serve barra <strong>rente</strong> à borda; esta ilha{" "}
        <strong>flutua com margem</strong>, e <code>--mobile-glass-bg</code>{" "}
        (55/45) é calibrado para uma folha sobre a página — que é exatamente o
        que ela é. Trocar deixaria a pílula quase opaca e mataria o efeito que
        justifica o borrão: numa ilha você <em>quer</em> ver a lista correndo por
        baixo.
      </DocNote>

      <DocNote title="A ação lê a altura da barra, porque 56 não é degrau">
        A escada do <code>Button</code> termina em <code>icon-xl</code> (40).{" "}
        <code>bottomBarActionClassName</code> lê <code>--bottom-bar-h</code>, então
        a ação é a altura da barra por construção — e ligar <code>labels</code> a
        leva a 64 junto, sem ninguém dizer nada. Ela <strong>não declara cor</strong>:
        quem pinta é o <code>variant</code> do <code>Button</code>. A classe que
        ela substitui tinha <strong>seis <code>!important</code></strong>, e eles
        anulavam a tecla que o primário virou na rodada 78 — o FAB era um quadrado
        verde chapado e inerte ao cursor.
      </DocNote>

      <DocNote title="A área segura vale zero nesta moldura">
        O <code>PhoneFrame</code> troca o viewport do CSS e mais nada:{" "}
        <code>env(safe-area-inset-bottom)</code> resolve para <strong>0</strong>{" "}
        lá dentro, porque não há aparelho. Num iPhone a barra desce mais 34px, e
        a reserva de conteúdo (<code>--bottom-bar-pad</code>) acompanha.
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
              "Flutua com margem nos quatro lados. Um valor só, de propósito: é ele que dá dono a --bottom-bar-margin. A faixa rente à borda entra quando houver caso.",
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
              "Uma aba. active escreve aria-current=\"page\" para o leitor de tela e data-active para a tinta — uma prop, dois atributos. Com iconActive, o glifo troca para o sólido quando ela é a página.",
          },
          {
            prop: "BottomBarSlot",
            type: 'ComponentProps<"button"> & { label?, active?, asChild? }',
            description:
              "A mesma caixa, sem href — para hospedar o gatilho de um popover. Não recebe aria-current: um botão que abre painel não é a página atual.",
          },
          {
            prop: "bottom-bar-marker",
            type: "data-slot",
            description:
              "O realce que viaja. A pílula o monta sozinha depois de medir, como primeiro filho e sem z-index; ninguém o escreve.",
          },
          {
            prop: "BottomBarTabs",
            type: 'ComponentProps<"div">',
            description:
              "A pílula de vidro e a grade. As colunas derivam da contagem de filhos; o grid-cols-4 cravado era o defeito.",
          },
          {
            prop: "BottomBarRow",
            type: 'ComponentProps<"div">',
            description:
              "A linha que recebe os eventos. A casca é pointer-events-none, senão a faixa invisível engoliria o toque na base da tela.",
          },
          {
            prop: "bottomBarActionClassName",
            type: "string",
            description:
              "O quadrado da altura da barra, para vestir um Button. Sem cor e sem !important.",
          },
        ]}
      />
    </>
  )
}
