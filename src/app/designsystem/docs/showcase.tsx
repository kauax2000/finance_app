"use client"

import * as React from "react"

import { CreditCardIcon as CreditCardMicro } from "@heroicons/react/16/solid"
import { ChartPieIcon, CreditCardIcon, HomeIcon, UsersIcon } from "@heroicons/react/20/solid"
import { AuthShowcase } from "@/components/auth/showcase/auth-showcase"
import type { AuthSceneId } from "@/components/auth/showcase/scene-context"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemContent,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandList,
} from "@/components/ui/command"
import { useDeviceFrame, type DeviceFrameNavItem } from "@/components/ui/device-frame"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  SHOWCASE_SLOTS,
  ShowcaseCaption,
  ShowcaseCursor,
  ShowcaseDots,
  ShowcaseFlight,
  ShowcaseFloat,
  ShowcaseHero,
  ShowcasePiece,
  ShowcaseScatter,
  ShowcaseScatterItem,
  ShowcaseSkeleton,
  ShowcaseStage,
  ShowcaseSwap,
  useShowcase,
  type ShowcaseForm,
  type ShowcaseSlotIndex,
} from "@/components/ui/showcase"
import { TopBarSearch } from "@/components/ui/top-bar"
import { Caption } from "@/components/ui/typography"
import { identityToneFor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"
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

const FORMAS = ["browser", "tablet", "phone"] as const satisfies readonly ShowcaseForm[]
/** A ordem do giro: subir na lista gira para um lado, descer para o outro. */
const ORDEM: Record<ShowcaseForm, number> = { browser: 0, tablet: 1, phone: 2 }

const PALCOS = ["xs", "s", "m", "l", "baixo"] as const
type Palco = (typeof PALCOS)[number]
/**
 * O tamanho do palco de demonstração, por extenso: um por nível, na proporção de um painel lateral (em pé, como
 * o campo das telas de acesso — S, M e L são os campos de 1280×800, 1440×900 e 1920×1080; o baixo, o de 1024×700).
 */
const PALCO: Record<Palco, string> = {
  xs: "w-82.5 h-176",
  s: "w-140.5 h-190",
  m: "w-158.75 h-215",
  l: "w-213.25 h-260",
  baixo: "w-111.25 h-165",
}
const ROTULO_DO_PALCO: Record<Palco, string> = {
  xs: "XS · 330",
  s: "S · 562",
  m: "M · 635",
  l: "L · 853",
  baixo: "baixo · 445×660",
}

const NAV: DeviceFrameNavItem[] = [
  { icon: HomeIcon, active: true },
  { icon: CreditCardIcon },
  { icon: ChartPieIcon },
  { icon: UsersIcon },
]

/** Depoimentos ilustrativos, um por lugar — o selo "exemplo" diz que não são de ninguém. */
const DEPOIMENTOS = [
  { nome: "Marina S.", frase: "Quitei o cartão sem pressa. Ver a fatura crescer dia a dia mudou meu mês." },
  { nome: "Juliana M.", frase: "Agora sei o dia em que a fatura fecha e compro depois dele." },
  { nome: "Diego F.", frase: "Primeira vez que chego no fim do mês sabendo para onde foi cada real." },
  { nome: "Camila R.", frase: "Achei três assinaturas que eu nem lembrava. Cancelei todas no mesmo dia." },
  { nome: "Beatriz N.", frase: "Parcelo menos desde que vi todas as parcelas juntas numa tela só." },
  { nome: "Lúcia F.", frase: "O aviso chega antes do vencimento. Nunca mais paguei multa na conta de luz." },
  { nome: "André V.", frase: "Separei a reserva de emergência aos poucos e não mexi mais nela." },
  { nome: "Lucas P.", frase: "Dividir o aluguel com a Bia virou um clique. Acabou a planilha no grupo." },
  { nome: "Caio R.", frase: "Coloquei um teto pro mercado e cheguei no fim do mês com folga." },
  { nome: "Thiago N.", frase: "Eu e minha esposa vemos a mesma carteira. Ninguém mais pergunta quem pagou." },
  { nome: "Gabriel O.", frase: "Uso no computador no trabalho e no celular no mercado. É a mesma conta." },
  { nome: "Patrícia O.", frase: "Troquei de celular e entrei de novo em segundos. Estava tudo lá." },
] as const

/** O selo do lado de dentro: o cartão lê o `data-edge` que o lugar publica (classes por extenso). */
const SELO_NO_TOPO =
  "ms-auto group-data-[edge=end]/showcase-item:order-first group-data-[edge=end]/showcase-item:ms-0 group-data-[edge=end]/showcase-item:me-auto group-data-[edge=top]/showcase-item:hidden"
const SELO_EMBAIXO = "hidden self-start group-data-[edge=top]/showcase-item:inline-flex"

function Depoimento({ nome, frase }: { nome: string; frase: string }) {
  const tom = identityToneFor(null, nome)
  return (
    <Card variant="elevated" padding="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Avatar size="xs">
            <AvatarFallback tint="soft" className={cn(tom.surface, tom.ink)}>
              {getInitials(nome)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{nome}</span>
          <Badge variant="soft" tone="neutral" size="xs" data-slot="showcase-doc-selo" className={SELO_NO_TOPO}>
            exemplo
          </Badge>
        </div>
        <p className="line-clamp-3 text-xs leading-snug text-pretty @xl/showcase:text-sm">“{frase}”</p>
        <Badge variant="soft" tone="neutral" size="xs" data-slot="showcase-doc-selo" className={SELO_EMBAIXO}>
          exemplo
        </Badge>
      </CardContent>
    </Card>
  )
}

const nada = () => {}

/** A mini UI do herói: lê a forma, e cada peça só translada na troca. A pílula de busca é um ponto do voo. */
function Tela({ voo }: { voo: boolean }) {
  const { form } = useDeviceFrame()
  const largo = form !== "phone"
  return (
    <div className="flex flex-col gap-3 p-4">
      <ShowcasePiece className="relative flex min-h-8 items-center justify-between gap-2">
        <p className="text-sm font-medium">Outubro</p>
        <ShowcaseSwap swapKey={form === "browser" ? "busca" : "selo"} className="flex justify-end">
          {form === "browser" ? (
            <ShowcaseFlight layoutId="showcase-doc-busca" active={!voo} className="rounded-full">
              <TopBarSearch listen={false} onOpen={nada} />
            </ShowcaseFlight>
          ) : (
            <Badge variant="soft" tone="neutral" size="xs">
              dados de exemplo
            </Badge>
          )}
        </ShowcaseSwap>
      </ShowcasePiece>
      <div className={cn("grid gap-3", largo ? "grid-cols-2" : "grid-cols-1")}>
        <ShowcasePiece>
          <Card padding="sm" data-showcase-anchor="saldo">
            <CardContent>
              <p className="text-xs text-muted-foreground">Saldo de outubro</p>
              <MoneyDisplay value={4182.6} size="xl" mono={false} />
            </CardContent>
          </Card>
        </ShowcasePiece>
        {largo ? (
          <ShowcasePiece>
            <Card padding="sm">
              <CardContent>
                <p className="text-xs text-muted-foreground">Entradas e saídas</p>
                <p className="flex flex-wrap gap-x-2 text-sm">
                  <MoneyDisplay value={7850} tone="income" />
                  <MoneyDisplay value={-3667.4} tone="expense" />
                </p>
              </CardContent>
            </Card>
          </ShowcasePiece>
        ) : null}
      </div>
      <ShowcasePiece>
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
      </ShowcasePiece>
    </div>
  )
}

/** A paleta que a pílula vira: o segundo ponto do voo, no topo da placa. */
function Paleta() {
  return (
    <Command variant="panel" shouldFilter={false} value="Fatura de outubro" className="w-full">
      <ShowcaseFlight layoutId="showcase-doc-busca" active className="rounded-full">
        <CommandInput caret value="fatura" placeholder="" />
      </ShowcaseFlight>
      <CommandList>
        <CommandGroup heading="Faturas">
          <CommandItem value="Fatura de outubro">
            <CommandItemIcon>
              <CreditCardMicro />
            </CommandItemIcon>
            <CommandItemContent>
              <CommandItemTitle>Fatura de outubro</CommandItemTitle>
              <CommandItemDescription>cartão final 4821 · vence dia 12</CommandItemDescription>
            </CommandItemContent>
            <CommandItemMeta>
              <MoneyDisplay value={1284.6} size="sm" />
            </CommandItemMeta>
          </CommandItem>
          <CommandItem value="Fatura de setembro">
            <CommandItemIcon>
              <CreditCardMicro />
            </CommandItemIcon>
            <CommandItemContent>
              <CommandItemTitle>Fatura de setembro</CommandItemTitle>
              <CommandItemDescription>paga</CommandItemDescription>
            </CommandItemContent>
            <CommandItemMeta>
              <MoneyDisplay value={1102.35} size="sm" />
            </CommandItemMeta>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

const LEGENDA: Record<ShowcaseForm, { title: string; description: string; chapter: number; fill: number }> = {
  browser: { title: "Seu mês num relance", description: "A mesma conta no computador e no celular.", chapter: 0, fill: 1 },
  tablet: { title: "Uma carteira para a casa toda", description: "Cada pessoa lança do próprio aparelho.", chapter: 0, fill: 0.5 },
  phone: { title: "Comece pela casa", description: "Orçamentos e contas divididas desde o primeiro dia.", chapter: 1, fill: 0.5 },
}

type EstadoDoPalco = { active: boolean; settled: boolean }

/** Guarda o estado do palco sem renderizar de novo quando nada mudou (o objeto novo do relato não conta). */
function useEstadoDoPalco(inicial: EstadoDoPalco) {
  const [estado, setEstado] = React.useState(inicial)
  const relatar = React.useCallback(
    (e: EstadoDoPalco) => setEstado((p) => (p.active === e.active && p.settled === e.settled ? p : e)),
    []
  )
  return [estado, relatar] as const
}

/** Conta para fora o estado do palco (`useShowcase` só vale dentro dele). */
function Relato({ onChange }: { onChange: (estado: EstadoDoPalco) => void }) {
  const { active, settled } = useShowcase()
  React.useEffect(() => onChange({ active, settled }), [active, settled, onChange])
  return null
}

function DemoNaTela() {
  const [form, setForm] = React.useState<ShowcaseForm>("browser")
  const [turn, setTurn] = React.useState<1 | -1>(1)
  const [palco, setPalco] = React.useState<Palco>("l")
  const [colagem, setColagem] = React.useState(true)
  const [legenda, setLegenda] = React.useState(true)
  const [paralaxe, setParalaxe] = React.useState(true)
  const [cursor, setCursor] = React.useState(true)
  const [voo, setVoo] = React.useState(false)
  const [estado, setEstado] = useEstadoDoPalco({ active: false, settled: true })
  const legendaDaForma = LEGENDA[form]

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Controles
        empilhar
        inicio={
          <>
            <Eixo
              rotulo="form"
              valores={FORMAS}
              valor={form}
              onChange={(f) => {
                setTurn(ORDEM[f] > ORDEM[form] ? 1 : -1)
                setForm(f)
              }}
            />
            <Eixo rotulo="palco" valores={PALCOS} valor={palco} onChange={setPalco} rotulos={ROTULO_DO_PALCO} />
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="sc-colagem" rotulo="colagem" valor={colagem} onChange={setColagem} />
            <Interruptor id="sc-legenda" rotulo="legenda" valor={legenda} onChange={setLegenda} />
            <Interruptor id="sc-paralaxe" rotulo="paralaxe" valor={paralaxe} onChange={setParalaxe} />
            <Interruptor id="sc-cursor" rotulo="cursor" valor={cursor} onChange={setCursor} />
            <Interruptor id="sc-voo" rotulo="voo" valor={voo} onChange={setVoo} />
          </Interruptores>
        }
      />
      <div data-slot="showcase-doc-campo" className={cn("brand-field relative max-w-full shrink-0 rounded-modal", PALCO[palco])}>
        <ShowcaseStage parallax={paralaxe} className="rounded-modal">
          <Relato onChange={setEstado} />
          {colagem ? (
            <ShowcaseScatter clear={form}>
              {SHOWCASE_SLOTS.map((_, i) => (
                <ShowcaseScatterItem key={i} slot={i as ShowcaseSlotIndex} itemKey={DEPOIMENTOS[i].nome}>
                  <Depoimento {...DEPOIMENTOS[i]} />
                </ShowcaseScatterItem>
              ))}
            </ShowcaseScatter>
          ) : null}
          <ShowcaseHero form={form} turn={turn} url="Finance › Painel" nav={NAV}>
            <Tela voo={voo} />
          </ShowcaseHero>
          <ShowcaseFloat anchor="center" open={voo}>
            <Paleta />
          </ShowcaseFloat>
          <ShowcaseCursor name="Ana" tone={1} anchor="saldo" from="end" delay={300} click open={cursor && !voo} />
          {legenda ? (
            <ShowcaseCaption
              title={legendaDaForma.title}
              description={legendaDaForma.description}
              dots={<ShowcaseDots count={3} active={legendaDaForma.chapter} fill={legendaDaForma.fill} />}
            />
          ) : null}
        </ShowcaseStage>
      </div>
      <Caption aria-live="polite">
        {`Palco ${ROTULO_DO_PALCO[palco]} · ${estado.active ? "na tela" : "fora da tela"} · ${estado.settled ? `em repouso: ${form}` : "trocando de forma…"}`}
      </Caption>
    </div>
  )
}

/** As 17 cenas das telas de acesso, na ordem das famílias. */
const CENAS = [
  "login",
  "login.session-expired",
  "login.password-updated",
  "invite.loading",
  "invite.idle",
  "invite.gate",
  "invite.accepted",
  "invite.error",
  "register",
  "register.confirm",
  "register.confirm-invite",
  "recovery.email",
  "recovery.code",
  "recovery.password",
  "recovery.link-checking",
  "recovery.link-expired",
  "recovery.done",
] as const satisfies readonly AuthSceneId[]

const JANELAS = ["1024", "1280", "1440", "1920"] as const
type Janela = (typeof JANELAS)[number]
/** O campo de marca naquela janela (o aside de 5/11 da largura, menos as margens), por extenso. */
const CAMPO_DA_JANELA: Record<Janela, string> = {
  "1024": "w-111.25 h-165",
  "1280": "w-140.5 h-190",
  "1440": "w-158.75 h-215",
  "1920": "w-213.25 h-260",
}
const ROTULO_DA_JANELA: Record<Janela, string> = {
  "1024": "1024×700",
  "1280": "1280×800",
  "1440": "1440×900",
  "1920": "1920×1080",
}

function DemoNoApp() {
  const [cena, setCena] = React.useState<AuthSceneId>("login")
  const [janela, setJanela] = React.useState<Janela>("1440")
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Controles
        empilhar
        inicio={
          <>
            <Eixo rotulo="cena" valores={CENAS} valor={cena} onChange={setCena} />
            <Eixo rotulo="janela" valores={JANELAS} valor={janela} onChange={setJanela} rotulos={ROTULO_DA_JANELA} />
          </>
        }
      />
      <div
        data-slot="showcase-doc-app"
        className={cn("brand-field relative isolate max-w-full shrink-0 overflow-clip rounded-modal", CAMPO_DA_JANELA[janela])}
      >
        {/* O wordmark onde o SplitShellAside o põe (px-8 py-10), acima do palco. */}
        <div className="absolute start-8 top-10 z-10 flex">
          <AppWordmark size="lg" />
        </div>
        <AuthShowcase scene={cena} />
      </div>
    </div>
  )
}

function NoTelefone() {
  const [estado, setEstado] = useEstadoDoPalco({ active: true, settled: true })
  return (
    <IphoneFrame title="O palco num iPhone">
      <div className="flex h-full flex-col justify-center gap-3 px-6">
        <AppWordmark size="lg" rainbow />
        {/* O aside do telefone: `display: none`, como no `SplitShell` com asideMobile="logo". */}
        <div className="hidden">
          <ShowcaseStage>
            <Relato onChange={setEstado} />
          </ShowcaseStage>
        </div>
        <Caption>
          {`O campo vira só o wordmark e o palco fica escondido: useShowcase().active = ${estado.active}. Nada toca, nada mede, e a paleta nem é baixada.`}
        </Caption>
      </div>
    </IphoneFrame>
  )
}

export default function ShowcaseDoc() {
  return (
    <>
      <Usage>
        O palco onde o app se apresenta sozinho, num campo: o herói (um <code>DeviceFrame</code> que muda de forma), a colagem de cartões cortados pelas bordas, o que flutua à frente (a paleta, um chip, os cursores de outras pessoas), o voo de uma pílula de um lugar ao outro e a legenda com os capítulos. É decorativo: <code>inert</code> e <code>aria-hidden</code>, e quem não o vê não perde nada. Use-o num painel lateral grande; não é carrossel (o <code>Carousel</code> é o que a pessoa navega) nem prévia de componente. No app, é o painel de marca das telas de acesso (a seção No app, abaixo).
      </Usage>

      <DocSection
        title="Na tela"
        description="Troque a forma: o herói anda numa mola só e cada cartão anda até o pouso que a forma deixa livre — ou sai pela borda —, cada lugar no seu atraso. Troque o palco: os níveis liberam os lugares pela largura do próprio palco (3, 6, 9, 12) e o palco baixo esconde três. O voo leva a pílula do cabeçalho para a paleta e de volta; o cursor acha o saldo onde quer que ele esteja; a paralaxe responde só ao mouse."
        code={`<ShowcaseStage parallax>
  <ShowcaseScatter clear={form}>
    {SHOWCASE_SLOTS.map((_, i) => (
      <ShowcaseScatterItem key={i} slot={i} itemKey={frase.id}>
        <Depoimento {...frase} />
      </ShowcaseScatterItem>
    ))}
  </ShowcaseScatter>
  <ShowcaseHero form={form} url="Finance › Painel" nav={nav}>
    <Tela />
  </ShowcaseHero>
  <ShowcaseFloat anchor="center" open={aberta}>
    <Paleta />
  </ShowcaseFloat>
  <ShowcaseCursor name="Ana" tone={1} anchor="saldo" from="end" click open={!aberta} />
  <ShowcaseCaption title="Seu mês num relance" dots={<ShowcaseDots count={3} active={0} />} />
</ShowcaseStage>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="Os níveis são do palco, não da janela">
        O palco é o container <code>showcase</code> (<code>size</code>), e tudo se mede nele. <strong>XS</strong> abaixo de 28rem libera 3 lugares (s0–s2), de 176px; <strong>S</strong> de 28 a 36rem, 6 (até s5), de 192px; <strong>M</strong> de 36 a 48rem, 9, de 224px com a frase em <code>text-sm</code>; <strong>L</strong> a partir de 48rem, os 12. Quantos aparecem é do pouso da forma: nos campos das telas de acesso, o navegador mostra 2, 3, 3 e 5; o tablet, 2; o celular, 3, 5, 5 e 6. Abaixo de 44rem de altura (<code>showcase-short</code>) somem s5, s6 e s9, e o celular cai para 70cqh. No XS o chip some e a legenda perde a descrição.
      </DocNote>

      <DocNote title="Profundidade é sombra e ordem — nunca escala, desfoque ou opacidade">
        Longe e meio (<code>z-0</code>, <code>shadow-sm</code> e <code>shadow-md</code>), o herói (<code>z-10</code>), perto (<code>z-20</code>, <code>shadow-lg</code>), o que flutua (<code>z-30</code>). Sem escala de profundidade o selo &quot;exemplo&quot; fica sempre no corpo dele, e o cartão põe o selo do lado de dentro pelo <code>data-edge</code> que o lugar publica: <code>end</code> à esquerda, <code>start</code> à direita, <code>top</code> embaixo, <code>bottom</code> em cima.
      </DocNote>

      <DocNote title="O pouso por forma: dois invólucros, um movimento cada">
        Cada lugar tem um pouso por forma do herói (<code>at</code>, o centro em % do palco): o navegador é largo e baixo e deixa as faixas de cima e de baixo, o celular é alto e estreito e deixa as laterais, o tablet deixa só os cantos — um lugar fixo que serve a uma forma cairia sob o herói na outra. O de fora anda até o pouso por <code>left</code>/<code>top</code>, na mola de CSS com o <code>--slot-delay</code> do lugar; sem pouso (<code>null</code>), sai pela borda que o corta e publica <code>data-away</code>. A entrada <code>showcase-enter</code> é o <code>translate</code>, no mesmo atraso. O de dentro inclina, respira (<code>ripple</code>) e troca o cartão (<code>itemKey</code>): o velho sai em 160ms, o novo entra de 8px para fora, na mola. A tabela foi medida nos campos de 1024×700 a 1920×1080: nenhum cartão cobre a legenda nem a zona da marca, dois cartões se cruzam em até 12% do menor, os de perto cobrem até 8% do herói, e todo selo fica à vista.
      </DocNote>

      <DocNote title="O voo da pílula não estica texto">
        Os pontos de pouso com o mesmo <code>layoutId</code> dividem um fantasma opaco e sem texto (<code>bg-popover</code>, o raio da pílula lido em px). Só o ponto ativo o desenha; o conteúdo do inativo fica transparente e ocupa o lugar, e o do ativo aparece aos 450ms — antes da cauda da mola, que assenta em ~830ms. O ponto que nasce ativo com o palco já nasce pousado.
      </DocNote>

      <DocNote title="A paralaxe: só mouse, só em repouso, sem quadro próprio">
        O ouvinte mora no pai do palco (o palco é <code>inert</code>), nunca no <code>document</code> — lá o único é o brilho da marca. Responde a <code>ehCursor</code> com <code>(hover: hover)</code>, e desliga sob o dedo, a moldura do iPhone, o movimento reduzido e o palco fora da tela. O ponteiro vira x/y em −1…1 numa mola (<code>MOLA</code>), e cada plano anda até longe 2px, meio 4px, herói 6px, perto e o que flutua 8px, ao contrário do ponteiro. Durante a troca de forma o alvo volta a 0 e o ponteiro é ignorado. Nenhum <code>requestAnimationFrame</code> e nenhum <code>setState</code> por evento.
      </DocNote>

      <DocNote title="O cursor acha o alvo">
        <code>ShowcaseCursor</code> mede o <code>[data-showcase-anchor]</code> em relação ao palco depois do repouso do herói e a cada mudança de tamanho do palco, e pousa um <code>PresenceCursor</code> no centro dele, andando com o herói na paralaxe. Trocar de forma reorganiza a tela e o cursor anda até o saldo de novo. <code>open</code> decide a presença: fechado, ou com o palco fora da tela, ele sai em 150ms, e ao reabrir espera o <code>delay</code> de novo — a tela não importa <code>motion</code>.
      </DocNote>

      <DocNote title="Decorativo e opaco">
        O palco é <code>inert</code> e <code>aria-hidden</code>: nenhum Tab entra, nenhum leitor de tela lê. Ele declara <code>data-opaque</code>, e dentro dele o vidro vira placa sólida (o escopo opaco do <code>globals.css</code>): a paleta pousa sobre o arco-íris sem deixá-lo atravessar o texto. Com movimento reduzido (<code>MotionConfig reducedMotion=&quot;user&quot;</code>) o layout e os deslocamentos pulam e ficam as opacidades.
      </DocNote>

      <DocSection
        title="No telefone"
        description="O palco não aparece no telefone: abaixo de 48rem o campo das telas de acesso vira só o wordmark e o aside fica display: none. É a medida que desliga tudo — o palco mede a própria presença (useInView), e escondido ele nunca fica ativo."
      >
        <NoTelefone />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="O herói em ossos, no mesmo lugar e tamanho, sem colagem nem flutuantes. group={false} dentro de um esqueleto de página."
        code={`<ShowcaseSkeleton form="browser" />`}
        previewClassName="items-center justify-center"
      >
        <div className="h-120 w-160 max-w-full rounded-modal bg-muted">
          <ShowcaseSkeleton form="browser" />
        </div>
        <div className="h-120 w-90 max-w-full rounded-modal bg-muted">
          <ShowcaseSkeleton form="phone" />
        </div>
      </DocSection>

      <DocSection
        title="No app"
        description="O painel de marca das telas de acesso monta este palco, com a cena que o formulário publica: login no navegador, convite no tablet da casa, cadastro e recuperação no celular. Cada estado é um id em SCENES (components/auth/showcase/scenes.ts); escolha a cena e a janela — o campo tem o tamanho do painel naquela janela, e o wordmark mora no canto, onde a colagem nunca pousa."
        code={`// src/components/layout/auth-frame.tsx
<AuthBrandPanel>
  <AuthShowcase scene={cena} />
</AuthBrandPanel>`}
        previewClassName="items-stretch"
      >
        <DemoNoApp />
      </DocSection>

      <PropsTable
        title="Props de ShowcaseStage"
        rows={[
          { prop: "parallax", type: "boolean", default: "false", description: "A paralaxe no mouse: cada plano até 2–8px, oposto ao cursor. Só com cursor, (hover: hover), o palco na tela e em repouso." },
          { prop: "className", type: "string", description: "O palco preenche quem o contém (size-full); o painel o põe absolute inset-0." },
          { prop: "useShowcase()", type: "{ active, settled, anchorRect(id) }", description: "active: o palco está na tela (falso com display: none). settled: o herói em repouso. anchorRect: a caixa de um [data-showcase-anchor] em relação ao palco." },
        ]}
      />

      <PropsTable
        title="As peças"
        rows={[
          { prop: "ShowcaseHero form", type: '"browser" | "tablet" | "phone"', description: "O DeviceFrame no centro (52% da altura), no tamanho que a @utility showcase-stage dá por data-form. Aceita as props do DeviceFrame." },
          { prop: "ShowcaseScatter clear", type: '"browser" | "tablet" | "phone"', description: "A forma do herói, que decide o pouso de cada lugar. ripple faz a colagem respirar uma vez." },
          { prop: "ShowcaseScatterItem slot itemKey", type: "0…11, Key", description: "Um dos 12 lugares de SHOWCASE_SLOTS (at por forma, rot, depth, edge, level, short, delay); trocar itemKey troca o cartão. Publica data-edge, e data-away quando a forma não lhe dá pouso." },
          { prop: "ShowcaseFloat anchor open", type: '"center" | "top-start" | … | "hero-bottom", boolean', default: "open: true", description: "À frente do herói (z-30): center é a paleta (80% da largura, até 28rem); as outras âncoras, um chip na borda, escondido no XS. Entra na mola, sai em 150ms. layoutId mantém o chip parado entre cenas." },
          { prop: "ShowcaseFlight layoutId active", type: "string, boolean", description: "Um ponto de pouso do voo: o fantasma sem texto anda de um ponto ao outro; o conteúdo do ativo aparece aos 450ms. className dá a forma (rounded-full)." },
          { prop: "ShowcasePiece", type: "motion.div", description: "Uma peça da mini UI que só translada na troca de forma (layout=\"position\")." },
          { prop: "ShowcaseSwap swapKey effect", type: 'Key, "fade" | "rise"', default: 'effect: "fade"', description: "O que existe numa forma ou cena só: o velho sai em 150ms, o novo entra na mola (popLayout; o pai é posicionado)." },
          { prop: "ShowcaseCursor name tone anchor open", type: "string, 1…6, string, boolean", default: "open: true", description: "O cursor de outra pessoa pousado no centro do [data-showcase-anchor]. from (a borda de onde entra), delay (ms, com o palco na tela), click (aperta ao chegar); open fechado sai em 150ms." },
          { prop: "ShowcaseDots count active fill", type: "number, number, 0…1", default: "fill: 1", description: "Os capítulos: a pílula ativa viaja (layoutId) e se preenche até fill." },
          { prop: "ShowcaseCaption title description dots", type: "string, string, ReactNode", description: "A legenda no pé, à esquerda, num Card elevated; o texto troca subindo. Sem descrição no XS. Os lugares do pé (s5, s9, s10) sobem 6cqh." },
          { prop: "ShowcaseSkeleton form group", type: '"browser" | "tablet" | "phone", boolean', default: 'form: "browser", group: true', description: "O palco esperando: o herói em ossos." },
        ]}
      />
    </>
  )
}
