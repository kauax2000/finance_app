"use client"

import * as React from "react"

import { KeyIcon } from "@heroicons/react/16/solid"
import {
  ChartPieIcon,
  CreditCardIcon,
  HomeIcon,
  UsersIcon,
} from "@heroicons/react/20/solid"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DeviceFrame,
  DeviceFrameSkeleton,
  useDeviceFrame,
  type DeviceFrameForm,
  type DeviceFrameNavItem,
} from "@/components/ui/device-frame"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import {
  Controles,
  DocNote,
  DocSection,
  Eixo,
  Interruptor,
  Interruptores,
  PropsTable,
  Usage,
} from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

const FORMAS = ["browser", "tablet", "phone"] as const satisfies readonly DeviceFrameForm[]

const NAV: DeviceFrameNavItem[] = [
  { icon: HomeIcon, active: true },
  { icon: CreditCardIcon },
  { icon: ChartPieIcon },
  { icon: UsersIcon },
]

/** O painel de outubro, o mesmo mundo nas três formas; lê a forma por `useDeviceFrame`. */
function Painel() {
  const { form } = useDeviceFrame()
  const largo = form === "browser"
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Outubro</p>
        <Badge variant="soft" tone="neutral" size="xs">
          dados de exemplo
        </Badge>
      </div>
      <div className={cn("grid gap-3", largo ? "grid-cols-2" : "grid-cols-1")}>
        <Card padding="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">Saldo de outubro</p>
            <MoneyDisplay value={4182.6} size="xl" mono={false} />
          </CardContent>
        </Card>
        {largo ? (
          <Card padding="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">Entradas e saídas</p>
              <p className="flex flex-wrap gap-x-2 text-sm">
                <MoneyDisplay value={7850} tone="income" />
                <MoneyDisplay value={-3667.4} tone="expense" />
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
      <ItemGroup variant="divided">
        <Item size="sm">
          <ItemContent>
            <ItemTitle>Aluguel</ItemTitle>
            <ItemDescription>vence amanhã</ItemDescription>
          </ItemContent>
          <MoneyDisplay value={2150} size="sm" />
        </Item>
        <Item size="sm">
          <ItemContent>
            <ItemTitle>Fatura do cartão</ItemTitle>
            <ItemDescription>vence dia 12</ItemDescription>
          </ItemContent>
          <MoneyDisplay value={1284.6} size="sm" />
        </Item>
      </ItemGroup>
    </div>
  )
}

const AVISO = (
  <div className="flex items-start gap-2">
    <KeyIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    <div className="min-w-0">
      <p className="text-xs font-medium">Seu código de acesso chegou</p>
      <p className="text-xs text-muted-foreground">Use os 6 dígitos para continuar</p>
    </div>
  </div>
)

function DemoNaTela() {
  const [form, setForm] = React.useState<DeviceFrameForm>("browser")
  const [url, setUrl] = React.useState(true)
  const [aviso, setAviso] = React.useState(false)
  const [nav, setNav] = React.useState(true)
  const [repouso, setRepouso] = React.useState(true)

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        inicio={
          <Eixo
            rotulo="form"
            valores={FORMAS}
            valor={form}
            onChange={(f) => {
              setRepouso(false)
              setForm(f)
            }}
          />
        }
        fim={
          <Interruptores>
            <Interruptor id="df-url" rotulo="url" valor={url} onChange={setUrl} />
            <Interruptor id="df-aviso" rotulo="notification" valor={aviso} onChange={setAviso} />
            <Interruptor id="df-nav" rotulo="nav" valor={nav} onChange={setNav} />
          </Interruptores>
        }
      />
      <div className="flex h-136 w-full items-center justify-center perspective-distant">
        <DeviceFrame
          form={form}
          url={url ? "Finance › Painel" : undefined}
          notification={aviso ? AVISO : undefined}
          nav={nav ? NAV : undefined}
          turn={1}
          onSettled={() => setRepouso(true)}
        >
          <Painel />
        </DeviceFrame>
      </div>
      <Caption aria-live="polite">{repouso ? `Em repouso: ${form}.` : "Trocando de forma…"}</Caption>
    </div>
  )
}

/** O palco mínimo: o container `showcase` e o herói com `data-form`. O `Showcase` monta o mesmo. */
function DemoNoPalco() {
  const [form, setForm] = React.useState<DeviceFrameForm>("phone")
  return (
    <div className="flex w-full flex-col gap-3">
      <Controles inicio={<Eixo rotulo="form" valores={FORMAS} valor={form} onChange={setForm} />} />
      <div className="showcase-stage flex h-176 w-full items-center justify-center overflow-clip rounded-surface bg-muted perspective-distant">
        <div data-slot="showcase-hero" data-form={form}>
          <DeviceFrame form={form} url="Finance › Painel" nav={NAV}>
            <Painel />
          </DeviceFrame>
        </div>
      </div>
    </div>
  )
}

function NoTelefone() {
  return (
    <IphoneFrame title="A moldura num iPhone">
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
        <DeviceFrame form="browser" url="Finance › Painel" nav={NAV}>
          <Painel />
        </DeviceFrame>
        <Caption>No app o palco não existe aqui: o campo vira só o wordmark.</Caption>
      </div>
    </IphoneFrame>
  )
}

export default function DeviceFrameDoc() {
  return (
    <>
      <Usage>
        A janela desenhada que mostra o app dentro de outra tela: um navegador, um tablet ou um celular feitos só de tokens, com a mini UI de verdade dentro. Use-a quando a forma do aparelho conta a história (a mesma conta no computador e no bolso) e a troca entre elas é o movimento. Não é moldura de captura de tela nem de imagem — não há <code>&lt;img&gt;</code> —, e não é a prévia de viewport do catálogo (essa é o <code>IphoneFrame</code>, um iframe). Nenhuma tela do app a usa ainda: o <code>Showcase</code> do painel das telas de acesso vai montá-la.
      </Usage>

      <DocSection
        title="Na tela"
        description="Troque a forma: a caixa, o raio, o trilho e a barra de endereço andam juntos numa mola só (~650ms), e a moldura gira até 6° no caminho. A barra de endereço vira a ilha; o trilho vira a barra de abas; a barra de status entra a partir de 40% da troca. Com o aviso ligado, no celular a ilha se abre num cartão; no navegador e no tablet, ele pousa no canto da tela."
        code={`<DeviceFrame
  form={form}
  url="Finance › Painel"
  nav={[{ icon: HomeIcon, active: true }, { icon: CreditCardIcon }]}
  notification={aviso}
  turn={indiceSubindo ? 1 : -1}
  onSettled={medirAncoras}
>
  <Painel />
</DeviceFrame>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="As bolinhas do navegador são neutras, de propósito">
        A referência pinta as três de vermelho, amarelo e verde. Aqui elas são <code>bg-foreground/15</code>: com os tokens de estado a semântica seria a errada (perigo, aviso e sucesso numa janela que não diz nada disso), e com as cores da marca haveria uma segunda peça de marca na tela, que já tem o campo arco-íris.
      </DocNote>

      <DocNote title="O raio vem das sondas, em px, e anima">
        Três <code>&lt;span hidden&gt;</code> com <code>rounded-surface</code>, <code>rounded-modal</code> e <code>concentric</code> resolvem os tokens no navegador; o valor da forma atual vai a <code>style.borderRadius</code>, o único que o <code>motion</code> corrige durante a projeção. Medido: navegador <strong>22px</strong>, tablet e celular <strong>28px</strong>; a tela concêntrica sai <strong>22px</strong> no navegador (recuo 0), <strong>20px</strong> no tablet (recuo 8) e <strong>22px</strong> no celular (recuo 6). Com o raio só na classe, o canto vira elipse no voo; sem animar o valor, ele salta para o degrau novo no primeiro quadro.
      </DocNote>

      <DocNote title="O tamanho: o palco manda, e fora dele a moldura tem o seu">
        Dentro de <code>[data-slot=&quot;showcase-hero&quot;]</code> a moldura preenche o herói, que a <code>@utility showcase-stage</code> mede por <code>data-form</code>. Fora do palco: o navegador ocupa a largura até 576px (<code>max-w-xl</code>) em 16/10, o tablet tem 384px de altura em 3/4 e o celular 480px em 9/19,5. Nos dois casos a troca é projeção de layout — nunca <code>scale()</code>, que quebra a medição do <code>motion</code> por baixo.
      </DocNote>

      <DocNote title="O giro é curva, não mola">
        <code>rotateY</code> faz 0 → −6° → 0 (ou +6°, com <code>turn={"{-1}"}</code>) em 0,65s <code>easeInOut</code>, sobre um <code>useMotionValue</code>: o <code>motion</code> 13 não aceita mola com três quadros. Só gira durante a troca; em repouso tudo é 2D, e o <code>will-change</code> existe só no voo. A perspectiva é de quem contém (<code>perspective-distant</code>, como o palco).
      </DocNote>

      <DocNote title="A tinta é declarada em toda superfície">
        No painel de acesso a moldura pousa sobre o <code>brand-field</code>, que herda texto quase branco. Por isso a tela é <code>bg-background text-foreground</code>, a barra do navegador <code>bg-muted text-muted-foreground</code>, a barra de status e o aviso <code>text-foreground</code>. A moldura do celular e do tablet é <code>--device-bezel</code>, quase preta nos dois temas, com o fio <code>--device-bezel-edge</code>.
      </DocNote>

      <DocNote title="Movimento reduzido">
        Com <code>prefers-reduced-motion</code>, a caixa e o raio trocam na hora e o giro não acontece; ficam as opacidades (a barra de endereço que some, a barra de status que entra, o aviso). <code>onSettled</code> dispara logo depois da troca.
      </DocNote>

      <DocSection
        title="Dentro do palco"
        description="O herói tem o tamanho do palco (container showcase, por data-form) e a moldura o preenche: a mesma projeção anima a troca, agora no tamanho que o palco decide."
        code={`<div className="showcase-stage …">
  <div data-slot="showcase-hero" data-form={form}>
    <DeviceFrame form={form} url="Finance › Painel" nav={nav}>…</DeviceFrame>
  </div>
</div>`}
        previewClassName="items-stretch"
      >
        <DemoNoPalco />
      </DocSection>

      <DocSection
        title="No telefone"
        description="No app, abaixo de 48rem o campo vira só o wordmark e o palco não existe — a moldura nunca chega ao telefone. Ela continua funcionando numa coluna estreita: o navegador ocupa a largura e a mini UI lê a forma, não a largura."
      >
        <NoTelefone />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="A mesma caixa e o mesmo cromo, com ossos no lugar da tela. group={false} dentro de um esqueleto de página."
        code={`<DeviceFrameSkeleton form="phone" />`}
        previewClassName="items-center justify-center"
      >
        <DeviceFrameSkeleton form="browser" />
        <DeviceFrameSkeleton form="tablet" />
        <DeviceFrameSkeleton form="phone" />
      </DocSection>

      <PropsTable
        title="Props de DeviceFrame"
        rows={[
          { prop: "form", type: '"browser" | "tablet" | "phone"', description: "A forma do aparelho. Trocar anima: caixa, raio, barra ↔ ilha, trilho ↔ abas e o giro." },
          { prop: "url", type: "string", description: "O endereço da barra do navegador, como breadcrumb (“Finance › Painel”), nunca domínio. Com o cadeado." },
          { prop: "notification", type: "ReactNode", description: "O aviso: no celular a ilha se abre num cartão; no navegador e no tablet, um cartão no canto superior direito da tela." },
          { prop: "nav", type: "{ icon: HeroIcon; active?: boolean }[]", description: "Os ícones (20/solid): trilho à esquerda no navegador e no tablet, barra de abas no celular. Cada um voa de um lugar ao outro." },
          { prop: "turn", type: "1 | -1", default: "1", description: "O sentido do giro: 1 vai a −6°, −1 a +6°. Quem decide é o palco, pela ordem das cenas." },
          { prop: "onSettled", type: "() => void", description: "Ao montar e quando uma troca de forma assenta. O palco mede as âncoras dos cursores aqui." },
          { prop: "children", type: "ReactNode", description: "A tela. Lê a forma por useDeviceFrame()." },
        ]}
      />

      <PropsTable
        title="DeviceFrameScreen, DeviceFrameSkeleton e useDeviceFrame"
        rows={[
          { prop: "DeviceFrameScreen", type: "motion.div", description: "A tela que o DeviceFrame monta: bg-background text-foreground, concentric, @container/screen; corrige a distorção dos filhos na projeção." },
          { prop: "DeviceFrameSkeleton form", type: '"browser" | "tablet" | "phone"', default: '"browser"', description: "A moldura esperando, na caixa da forma." },
          { prop: "DeviceFrameSkeleton group", type: "boolean", default: "true", description: "O SkeletonGroup em volta (role=status); false dentro de um esqueleto de página." },
          { prop: "useDeviceFrame()", type: "{ form }", description: "A forma atual, para a mini UI se reorganizar. Fora de um DeviceFrame, lança." },
        ]}
      />
    </>
  )
}
