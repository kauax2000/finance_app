"use client"

import * as React from "react"

import {
    ArrowDownIcon,
    ArrowUpIcon,
    BoltIcon,
    CreditCardIcon,
    HeartIcon,
    HomeIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    TvIcon,
    WifiIcon,
} from "@heroicons/react/16/solid"

import { AppLogo } from "@/components/layout/app-logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AvatarGroup, AvatarGroupAdd, AvatarGroupItem, AvatarGroupSkeleton } from "@/components/ui/avatar-group"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { ChartSparkline } from "@/components/ui/chart"
import { ColorTile } from "@/components/ui/color-tile"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { useDeviceFrame, type DeviceFrameForm } from "@/components/ui/device-frame"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress, ProgressFooter, ProgressHeader, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { ShowcaseFlight, ShowcasePiece, ShowcaseSwap, useShowcase } from "@/components/ui/showcase"
import { Skeleton } from "@/components/ui/skeleton"
import { TopBar, TopBarActions, TopBarContent, TopBarSearch, TopBarStart, TopBarTitle } from "@/components/ui/top-bar"
import { Caption } from "@/components/ui/typography"
import { IDENTITY_TONES, identityToneFor } from "@/lib/avatar"
import { BUDGET_BANDS, CARD_LIMIT_BANDS } from "@/lib/budget-bands"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { cn, getInitials } from "@/lib/utils"
import type { HeroIcon } from "@/types/navigation"

/**
 * # O mundo comum do painel de marca: `AuthMiniApp`
 *
 * A mesma conta de outubro dentro do aparelho do palco, nas três formas do
 * `DeviceFrame` (lidas por `useDeviceFrame()`, nunca por container query de
 * viewport): o navegador desenhado para ~480px de largura (o navegador a
 * 1280×800), o tablet e o celular empilhados. Cada peça que existe em mais de
 * uma forma é uma `ShowcasePiece` (só translada na troca, o texto nunca estica);
 * o que existe numa forma ou numa tela só entra e sai por `ShowcaseSwap`. A
 * exceção, de propósito: as linhas de uma lista que a altura de uma forma não
 * comporta somem por classe e voltam esmaecendo (ver `comClasses`).
 *
 * **Dados de exemplo, e só.** "Hoje" é quinta-feira, 9 de outubro, 9:41 — todo
 * rótulo relativo deriva dessa data, escrita por extenso (sem `Date`, sem
 * acaso: o HTML do servidor é o quadro final). O selo "dados de exemplo" fica
 * no cabeçalho, nas três formas. O dinheiro fecha: entradas menos saídas é o
 * saldo, e o saldo sobre setembro (3.880) é o "+7,8%".
 *
 * **Peças sem quebra de viewport** (seção 4 do plano). O viewport real é
 * desktop, então os `sm:`/`md:` do DS valem dentro do mockup. Auditado em cada
 * peça usada no tablet e no celular:
 * - `Card`: o único `sm:` é do `orientation="horizontal"`, que aqui não entra;
 * - `DescriptionList`: os `sm:` são do `layout="inline"` e do `grid` sem
 *   `columns`; aqui é sempre `columns={3}` ou `columns={2}`, sem quebra;
 * - `Item`, `ItemGroup`, `MoneyDisplay`, `Badge`, `Avatar`, `ColorTile`,
 *   `Progress`, `Skeleton`, `Caption`: nenhum `sm:`/`md:`/`lg:`;
 * - `AvatarGroup`: nenhuma classe de viewport; o `useIsMobile` dele só decide a
 *   folha da lista do +N, que não existe aqui (sem `max`);
 * - `ChartSparkline`: o `ChartContainer` não tem quebra (os `sm:` do arquivo
 *   são da `ChartSplit` e da legenda);
 * - fora do tablet e do celular, de propósito: `TopBarSearch` (`hidden
 *   md:flex`) e o `TopBar` (os `max-md:` dele) moram só no navegador; nenhuma
 *   `BottomBar` (a barra de abas é do `DeviceFrame`) e nenhuma `Timeline`.
 */

/** As telas do mundo comum (as do celular de recuperação moram em `phone-screens.tsx`). */
export type MiniAppScreen = "dashboard" | "invoice" | "budget" | "wallet-loading" | "wallet"

/** O endereço da barra do navegador: breadcrumb, nunca domínio. */
export const MINI_APP_URL: Record<MiniAppScreen, string> = {
    dashboard: "Finance › Painel",
    budget: "Finance › Painel",
    invoice: "Finance › Fatura",
    "wallet-loading": "Finance › Carteiras",
    wallet: "Finance › Carteiras › Casa",
}

/**
 * A aba acesa do `DeviceFrame` em cada tela, na ordem do plano: painel,
 * cartão, orçamento, pessoas. Os ícones (`20/solid`, desenhados a 20px pelo
 * `DeviceFrame`) moram com quem monta o herói: aqui eles conviveriam com os
 * ícones das linhas (14px, `16/solid`), e um arquivo que desenha os dois
 * conjuntos por valor não se audita.
 */
export const MINI_APP_NAV_ACTIVE: Record<MiniAppScreen, 0 | 1 | 2 | 3> = {
    dashboard: 0,
    budget: 0,
    invoice: 1,
    "wallet-loading": 3,
    wallet: 3,
}

/* ── Os dados de outubro ──────────────────────────────────────────────────── */

const SALDO = 4182.6
const ENTRADAS = 7850
const SAIDAS = 3667.4

/** O saldo de cada um dos últimos 12 meses, de novembro a outubro. */
const SALDO_DOS_MESES = [1020, 1480, 1310, 2150, 2040, 2690, 2580, 3120, 3460, 3390, 3880, SALDO].map((saldo) => ({
    saldo,
}))
const FAISCA = { saldo: { label: "Saldo", color: "var(--chart-1)" } }

const cor = (nome: (typeof TILE_PALETTE)[number]["nome"]) => TILE_PALETTE.find((p) => p.nome === nome)!.hex

type Linha = {
    icon: HeroIcon
    cor: string
    titulo: string
    descricao: string
    valor: number
    selo?: { tom: "warning" | "success"; texto: string }
    ancora?: string
    className?: string
}

const CONTAS: Linha[] = [
    { icon: HomeIcon, cor: cor("índigo"), titulo: "Aluguel", descricao: "vence amanhã", valor: 2150 },
    {
        icon: CreditCardIcon,
        cor: cor("violeta"),
        titulo: "Fatura do cartão",
        descricao: "vence dia 12",
        valor: 1284.6,
        selo: { tom: "warning", texto: "em 3 dias" },
    },
    { icon: BoltIcon, cor: cor("âmbar"), titulo: "Energia", descricao: "vence dia 18", valor: 186.4 },
]

/**
 * Quantas linhas cabem é da altura de cada forma, e a linha que não cabe some
 * por classe: ela fica na árvore em todas as formas (a troca não a remonta) e,
 * ao voltar, esmaece (`starting:` no `Linhas`). Um `ShowcaseSwap` em volta de
 * uma linha não serve aqui: o fio do `ItemGroup divided` é dos filhos diretos.
 *
 * No navegador a janela é baixa: a terceira linha só no navegador largo (a
 * janela de 1440, tela de 512px ou mais), e a segunda some no XS (abaixo de
 * 448px), onde só cabe uma.
 */
const comClasses = (linhas: Linha[], classes: (string | undefined)[]): Linha[] =>
    linhas.map((linha, i) => ({ ...linha, className: classes[i] }))
const NO_NAVEGADOR = [undefined, "@max-md/screen:hidden", "@max-lg/screen:hidden"]
/** O tablet tem as três, menos no palco baixo (a janela de 1024×700); o celular, duas. */
const CONTAS_POR_FORMA: Record<DeviceFrameForm, Linha[]> = {
    browser: comClasses(CONTAS, NO_NAVEGADOR),
    tablet: comClasses(CONTAS, [undefined, undefined, "showcase-short:hidden"]),
    phone: comClasses(CONTAS, [undefined, undefined, "hidden"]),
}

/** As compras da fatura de outubro (fechou dia 5), da mais nova para a mais antiga. */
const COMPRAS: Linha[] = [
    { icon: HeartIcon, cor: cor("coral"), titulo: "Farmácia", descricao: "02/10", valor: 72.15 },
    { icon: ShoppingCartIcon, cor: cor("lima"), titulo: "Mercado do bairro", descricao: "28/09", valor: 186.32 },
    { icon: TvIcon, cor: cor("magenta"), titulo: "Streaming", descricao: "22/09", valor: 39.9 },
]
const COMPRAS_POR_FORMA: Record<DeviceFrameForm, Linha[]> = {
    browser: comClasses(COMPRAS, NO_NAVEGADOR),
    tablet: COMPRAS,
    phone: COMPRAS,
}

/**
 * As despesas da carteira "Casa". Somam R$ 2.484,80 — R$ 828,27 a sua parte (a
 * divisão já conta com você, na porta do convite e depois de aceitar). O
 * aluguel o Rafael pagou, a feira a Ana; a internet ainda vai vencer.
 */
const DESPESAS_DA_CASA: Linha[] = [
    { icon: HomeIcon, cor: cor("índigo"), titulo: "Aluguel", descricao: "dividido por 3", valor: 2150 },
    {
        icon: WifiIcon,
        cor: cor("azul"),
        titulo: "Internet",
        descricao: "vence dia 15",
        valor: 119.9,
        ancora: "row-internet",
    },
    { icon: ShoppingBagIcon, cor: cor("teal"), titulo: "Feira de sábado", descricao: "Ana C. lançou", valor: 214.9 },
]

/**
 * As pessoas da casa, na identidade do cursor de cada uma (Ana 1, Rafael 5,
 * você 3). `color` é o que o perfil teria gravado; um valor fora da lista
 * legada vira semente de `identityToneFor`, e estas três caem nessas
 * identidades (o teste confere).
 */
export const MINI_APP_PEOPLE = {
    ana: { name: "Ana C.", color: "ana-5" },
    rafael: { name: "Rafael T.", color: "rafael-4" },
    // "VC", como o avatar do cabeçalho: as iniciais saem da primeira letra de cada palavra.
    voce: { name: "Você C.", color: "voce-2" },
} as const

const VOCE = IDENTITY_TONES[2]

const nada = () => {}

/* ── As peças ─────────────────────────────────────────────────────────────── */

/** "VC", o dono do aparelho. */
function AvatarVoce() {
    return (
        <Avatar size="xs">
            <AvatarFallback tint="soft" className={cn(VOCE.surface, VOCE.ink)}>
                VC
            </AvatarFallback>
        </Avatar>
    )
}

function SeloDeExemplo() {
    return (
        <Badge variant="soft" tone="neutral" size="xs" className="shrink-0">
            dados de exemplo
        </Badge>
    )
}

const TITULO_DA_BARRA: Record<MiniAppScreen, string> = {
    dashboard: "Painel",
    budget: "Painel",
    invoice: "Fatura",
    "wallet-loading": "Carteiras",
    wallet: "Carteiras",
}

const TITULO_DO_CABECALHO: Record<MiniAppScreen, string> = {
    dashboard: "Outubro",
    budget: "Outubro",
    invoice: "Fatura",
    "wallet-loading": "Casa",
    wallet: "Casa",
}

/**
 * O estado da pílula de busca do cabeçalho no roteiro do login: parada,
 * apertada pelo clique do cursor (encolhe a 97% e volta) ou voando para a
 * paleta (o lugar fica ocupado, o conteúdo some e o fantasma voa).
 */
export type MiniAppSearch = "rest" | "pressed" | "palette"

/**
 * O cabeçalho do navegador: o `TopBar` do app, estático, com a pílula de busca
 * (a âncora do cursor e o ponto de partida do voo da paleta — o
 * `ShowcaseFlight` "auth-search", cujo outro ponto é o campo da paleta). O
 * título é um `div`, e não o `<h1>` do `TopBarTitle`: o palco é `aria-hidden`,
 * mas um segundo `<h1>` na página não ajuda ninguém.
 */
function BarraDoNavegador({ screen, search }: { screen: MiniAppScreen; search: MiniAppSearch }) {
    return (
        <TopBar position="static" size="sm" className="gap-3">
            {/* O logo só a partir de 512px de tela (a janela de 1440): abaixo, logo, título, selo, pílula e avatar
                não cabem com folga — e o endereço da barra já diz "Finance". */}
            <TopBarStart className="@max-lg/screen:hidden">
                <AppLogo size="sm" />
            </TopBarStart>
            <TopBarContent className="gap-2">
                {/* No XS (tela abaixo de 448px) o título sai também: o endereço da barra já diz onde se está. */}
                <TopBarTitle asChild className="relative flex-none @max-md/screen:hidden">
                    <div>
                        <ShowcaseSwap swapKey={TITULO_DA_BARRA[screen]}>{TITULO_DA_BARRA[screen]}</ShowcaseSwap>
                    </div>
                </TopBarTitle>
                <SeloDeExemplo />
            </TopBarContent>
            <TopBarActions className="gap-3">
                <div data-showcase-anchor="search" className="w-40 @lg/screen:w-44">
                    <ShowcaseFlight
                        layoutId="auth-search"
                        active={search !== "palette"}
                        className={cn(
                            "rounded-full transition-transform duration-(--duration-fast) ease-(--ease-out)",
                            search === "pressed" && "scale-97"
                        )}
                    >
                        <TopBarSearch listen={false} onOpen={nada} slash={false} />
                    </ShowcaseFlight>
                </div>
                {/* No XS (tela abaixo de 448px) a pílula precisa do lugar do avatar para dizer "Buscar…" inteira. */}
                <span className="contents @max-md/screen:hidden">
                    <AvatarVoce />
                </span>
            </TopBarActions>
        </TopBar>
    )
}

/** O cabeçalho do tablet e do celular: o mês (ou a tela), o selo e você. */
function CabecalhoDeBolso({ screen, compacto }: { screen: MiniAppScreen; compacto: boolean }) {
    return (
        <div className="flex h-11 shrink-0 items-center gap-2 px-3">
            <div className="relative min-w-0 flex-1 truncate text-sm font-medium">
                <ShowcaseSwap swapKey={TITULO_DO_CABECALHO[screen]}>{TITULO_DO_CABECALHO[screen]}</ShowcaseSwap>
            </div>
            <SeloDeExemplo />
            {/* No celular do palco baixo (213px) o título, o selo e o avatar não cabem juntos: fica o selo. */}
            <span className={cn("contents", compacto && "showcase-short:hidden")}>
                <AvatarVoce />
            </span>
        </div>
    )
}

/**
 * O saldo do mês. No navegador o cabeçalho diz "Painel", e o rótulo diz o mês;
 * no tablet e no celular o cabeçalho já é "Outubro", e o rótulo encurta (o
 * selo da variação não cabe ao lado de "Saldo de outubro" em 200px).
 */
function CartaoDoSaldo({ largo, compacto }: { largo: boolean; compacto: boolean }) {
    return (
        <Card padding="sm" className="h-full">
            <CardContent className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                    <div className={cn("relative min-w-0 flex-1", compacto && "showcase-short:hidden")}>
                        <ShowcaseSwap swapKey={largo ? "saldo-do-mes" : "saldo"}>
                            <Caption className="truncate">{largo ? "Saldo de outubro" : "Saldo"}</Caption>
                        </ShowcaseSwap>
                    </div>
                    <Badge variant="soft" tone="income" size="xs" className="shrink-0">
                        +7,8% vs setembro
                    </Badge>
                </div>
                <MoneyDisplay value={SALDO} size="2xl" mono={false} className="leading-tight tracking-tight" />
                {/* Entradas e saídas: a seta e a tinta de dinheiro dizem qual é qual, sem a palavra (não cabe). */}
                <div className="flex flex-wrap items-center gap-x-3">
                    <span className="flex items-center gap-0.5 text-income">
                        <ArrowUpIcon aria-hidden className="size-3" />
                        <MoneyDisplay value={ENTRADAS} size="sm" tone="income" />
                    </span>
                    <span className="flex items-center gap-0.5 text-expense">
                        <ArrowDownIcon aria-hidden className="size-3" />
                        <MoneyDisplay value={SAIDAS} size="sm" tone="expense" />
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * A faísca do saldo dos 12 meses. Monta só com o palco na tela: escondido (o
 * telefone, `display: none`) o `ResponsiveContainer` nasceria com largura 0. A
 * caixa tem a altura dela antes de o gráfico chegar, para nada saltar. O
 * gráfico é o mesmo elemento entre renders: cada render do palco (a paleta do
 * login abrindo e fechando) chega aqui pelo contexto do `Showcase`, e no
 * navegador XS — o cartão escondido por classe — cada render do
 * `ResponsiveContainer` avisaria no console a largura -1.
 */
function Faisca({ alta }: { alta: boolean }) {
    const { active } = useShowcase()
    const altura = alta ? "h-20" : "h-12"
    const grafico = React.useMemo(
        () => (
            <ChartSparkline
                variant="area"
                y="saldo"
                data={SALDO_DOS_MESES}
                config={FAISCA}
                label="Saldo dos últimos 12 meses"
                className={altura}
            />
        ),
        [altura]
    )
    return active ? grafico : <div className={altura} />
}

function CartaoDaFaisca({ alta }: { alta: boolean }) {
    return (
        <Card padding="sm" className="h-full">
            <CardContent className="flex h-full flex-col justify-between gap-1">
                <Caption>Últimos 12 meses</Caption>
                <Faisca alta={alta} />
            </CardContent>
        </Card>
    )
}

/**
 * As linhas de uma lista. No navegador (`emLinha`) cada uma cabe numa linha só
 * — a janela é larga e baixa —, com o selo antes do valor; no tablet e no
 * celular o título fica sobre a descrição, e o selo desce para baixo do valor
 * (a linha não alarga, e o título não quebra em 200px). O selo mora num lugar
 * só da árvore e muda de lado por `order`: trocar de forma não o remonta.
 */
function Linhas({
    linhas,
    emLinha,
    compacto = false,
    className,
}: {
    linhas: Linha[]
    emLinha: boolean
    /** O celular: no palco baixo (213px) a linha perde o ladrilho e o título desce a `text-xs`. */
    compacto?: boolean
    className?: string
}) {
    return (
        // O fio desce para o topo de cada linha que não é a primeira: a linha
        // escondida por classe (a 3ª conta do celular) leva o próprio fio, e a
        // última visível termina sem fio solto. O `:not(:last-child)` repete o
        // seletor do DS para o `cn` trocar o `border-b-border` pelo transparente.
        <ItemGroup
            variant="divided"
            className={cn(
                "[&>[data-slot=item]:not(:last-child)]:border-b-transparent [&>[data-slot=item]:not(:first-child)]:border-t-border",
                className
            )}
        >
            {linhas.map(({ icon: Icon, cor: tom, titulo, descricao, valor, selo, ancora, className: linha }) => {
                return (
                    <Item
                        key={titulo}
                        size="sm"
                        variant="flush"
                        data-showcase-anchor={ancora}
                        className={cn(
                            "px-0 transition-opacity duration-(--duration-base) starting:opacity-0",
                            emLinha && "py-1.5",
                            linha
                        )}
                    >
                        <ItemMedia className={cn(emLinha && "translate-y-0 self-center", compacto && "showcase-short:hidden")}>
                            <ColorTile tint="soft" size="xs" color={tom}>
                                <Icon />
                            </ColorTile>
                        </ItemMedia>
                        <ItemContent className={cn(emLinha && "flex-row items-baseline gap-2")}>
                            <ItemTitle className={cn("shrink-0", compacto && "showcase-short:text-xs")}>{titulo}</ItemTitle>
                            <ItemDescription className="truncate">{descricao}</ItemDescription>
                        </ItemContent>
                        <ItemActions className={cn(!emLinha && "flex-col items-end gap-0.5")}>
                            <MoneyDisplay value={valor} size="sm" />
                            {selo ? (
                                <Badge variant="soft" tone={selo.tom} size="xs" className={cn(emLinha && "order-first")}>
                                    {selo.texto}
                                </Badge>
                            ) : null}
                        </ItemActions>
                    </Item>
                )
            })}
        </ItemGroup>
    )
}

/** As próximas contas: duas no navegador e no celular, três no tablet e no navegador largo. */
function ProximasContas({ form, linhas = CONTAS_POR_FORMA[form] }: { form: DeviceFrameForm; linhas?: Linha[] }) {
    return (
        <section className="flex flex-col gap-1">
            <Caption className="font-medium text-foreground">Próximas contas</Caption>
            <Linhas linhas={linhas} emLinha={form === "browser"} compacto={form === "phone"} />
        </section>
    )
}

const TETOS = [
    { nome: "Mercado", gasto: 612, teto: 900 },
    { nome: "Contas da casa", gasto: 1430, teto: 1600 },
] as const

/**
 * Onde o cursor do cadastro pousa no "Mercado" (a seta aponta para cima e a
 * pílula do nome cai 12px à direita e 14px abaixo da ponta):
 * - com o rodapé, na barra, além do fim do preenchimento (76%), a meia altura
 *   do bloco — que, com o rótulo e o rodapé da mesma altura, é a da barra: a
 *   pílula cai no rodapé, à direita do "R$ 612,00 de R$ 900,00", sem cobri-lo
 *   (12px de folga no celular de 241px, a janela de 1280);
 * - no palco baixo (1024×700) o rodapé some e a linha de baixo fica a 12px da
 *   barra: a ponta sobe à linha do rótulo (4px abaixo do topo), no vão entre
 *   "Mercado" e "68%" (40%), e a pílula pousa sobre a barra — à esquerda da
 *   coluna das porcentagens, sem tocar o "68%" nem o "89%".
 */
const PONTA_NO_MERCADO =
    "start-[76%] inset-y-0 showcase-short:start-[40%] showcase-short:bottom-auto showcase-short:h-2"

/**
 * O orçamento da casa: dois tetos (68% e 89%, a escada `BUDGET_BANDS`) e quem
 * divide. O "Mercado" é a âncora do cursor do cadastro.
 */
function Orcamento({ compacto }: { compacto: boolean }) {
    const { ana, rafael, voce } = MINI_APP_PEOPLE
    return (
        <Card padding="sm">
            <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                        Orçamento<span className={cn(compacto && "showcase-short:hidden")}> · Casa</span>
                    </p>
                    <AvatarGroup label="Quem divide a casa" size="xs" tint="soft">
                        <AvatarGroupItem {...ana} />
                        <AvatarGroupItem {...rafael} />
                        <AvatarGroupItem {...voce} />
                    </AvatarGroup>
                </div>
                {TETOS.map(({ nome, gasto, teto }) => (
                    <div key={nome} className="relative">
                        {nome === "Mercado" ? (
                            <span
                                aria-hidden
                                data-showcase-anchor="budget"
                                className={cn("pointer-events-none absolute w-0", PONTA_NO_MERCADO)}
                            />
                        ) : null}
                        <Progress
                            value={gasto}
                            max={teto}
                            size="sm"
                            bands={BUDGET_BANDS}
                            header={
                                <ProgressHeader>
                                    <ProgressLabel>{nome}</ProgressLabel>
                                    <ProgressValue />
                                </ProgressHeader>
                            }
                            footer={
                                <ProgressFooter className={cn("justify-start gap-1", compacto && "showcase-short:hidden")}>
                                    <MoneyDisplay value={gasto} size="sm" tone="muted" /> de{" "}
                                    <MoneyDisplay value={teto} size="sm" tone="muted" />
                                </ProgressFooter>
                            }
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

/** O painel de outubro; no cadastro, o orçamento da casa entra depois da troca de forma. */
function Painel({ form, budget }: { form: DeviceFrameForm; budget: boolean }) {
    const largo = form === "browser"
    const compacto = form === "phone"
    return (
        <div
            className={cn(
                "flex flex-col",
                largo ? "gap-2.5 px-4 pt-2.5 @max-md/screen:gap-2 @max-md/screen:pt-2" : "gap-3 px-3 pt-1"
            )}
        >
            <div className={cn("flex", largo ? "flex-row gap-2.5" : "flex-col gap-3")}>
                <ShowcasePiece className="min-w-0 flex-1">
                    <CartaoDoSaldo largo={largo} compacto={compacto} />
                </ShowcasePiece>
                {/* A faísca some onde não cabe: o navegador XS, o celular do palco baixo (a janela de 1024×700) e, com o
                orçamento, o celular de menos de 16rem (a janela de 1280) — ali saldo, faísca e orçamento passavam da
                barra de abas, e o orçamento é a cena do cadastro. */}
                <ShowcasePiece
                    className={cn(
                        largo && "w-36 shrink-0 @max-md/screen:hidden",
                        compacto && "showcase-short:hidden",
                        compacto && budget && "@max-[16rem]/screen:hidden"
                    )}
                >
                    <CartaoDaFaisca alta={!largo} />
                </ShowcasePiece>
            </div>
            {/* No cadastro o orçamento da casa entra no lugar das contas, depois da troca de forma. */}
            <div className="relative">
                <ShowcaseSwap swapKey={budget ? "orcamento" : "contas"} effect="rise">
                    <ShowcasePiece>
                        {budget ? (
                            <div className="flex flex-col gap-3">
                                <Orcamento compacto={compacto} />
                                {/* No celular sem faísca (abaixo de 16rem) sobra a altura de uma conta sob o orçamento:
                                    a próxima, o aluguel — a tela não acaba no meio. O palco baixo não tem essa altura. */}
                                {compacto ? (
                                    <div className="showcase-short:hidden">
                                        <div className="hidden @max-[16rem]/screen:block">
                                            <ProximasContas form={form} linhas={CONTAS.slice(0, 1)} />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <ProximasContas form={form} />
                        )}
                    </ShowcasePiece>
                </ShowcaseSwap>
            </div>
        </div>
    )
}

const FECHOU_E_VENCE = (
    <>
        <DescriptionListItem>
            <DescriptionTerm>Fechou</DescriptionTerm>
            <DescriptionDetails>05/10</DescriptionDetails>
        </DescriptionListItem>
        <DescriptionListItem>
            <DescriptionTerm>Vence</DescriptionTerm>
            <DescriptionDetails>12/10</DescriptionDetails>
        </DescriptionListItem>
    </>
)

/** No navegador: as datas e o limite usado numa linha de três colunas. */
function DatasEmLinha() {
    return (
        <DescriptionList columns={3} size="sm">
            {FECHOU_E_VENCE}
            <DescriptionListItem>
                <DescriptionTerm>Limite usado</DescriptionTerm>
                <DescriptionDetails className="flex items-center gap-2">
                    38%
                    <Progress value={38} size="sm" bands={CARD_LIMIT_BANDS} aria-label="Limite usado" />
                </DescriptionDetails>
            </DescriptionListItem>
        </DescriptionList>
    )
}

/** No bolso: as datas em duas colunas, e o limite usado desce para uma barra inteira. */
function DatasEBarra() {
    return (
        <div className="flex flex-col gap-3">
            <DescriptionList columns={2} size="sm">
                {FECHOU_E_VENCE}
            </DescriptionList>
            <Progress
                value={38}
                size="sm"
                bands={CARD_LIMIT_BANDS}
                header={
                    <ProgressHeader>
                        <ProgressLabel className="font-normal text-muted-foreground">Limite usado</ProgressLabel>
                        <ProgressValue />
                    </ProgressHeader>
                }
            />
        </div>
    )
}

/**
 * A fatura de outubro: o que o ⌘K do login abre (e o que o celular da ida e
 * volta mostra). O limite usado é a escada do cartão (`CARD_LIMIT_BANDS`): 38%
 * já é âmbar. No navegador ele cabe na linha das datas; no bolso, desce para
 * uma barra inteira. A legenda e o bloco das datas são de uma forma só, e
 * trocam por `ShowcaseSwap` (a ida e volta navegador → celular da D8).
 */
function Fatura({ form }: { form: DeviceFrameForm }) {
    const largo = form === "browser"
    return (
        <div className={cn("flex flex-col", largo ? "gap-2.5 px-4 pt-2.5" : "gap-3 px-3 pt-1")}>
            <ShowcasePiece className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                    <div className="relative min-w-0 flex-1">
                        <ShowcaseSwap swapKey={largo ? "fatura-do-mes" : "cartao"}>
                            <Caption className="truncate">{largo ? "Fatura de outubro · final 4821" : "Cartão final 4821"}</Caption>
                        </ShowcaseSwap>
                    </div>
                    <Badge variant="soft" tone="warning" size="xs" className="shrink-0">
                        em 3 dias
                    </Badge>
                </div>
                <MoneyDisplay value={1284.6} size="2xl" mono={false} className="leading-tight tracking-tight" />
            </ShowcasePiece>
            <ShowcasePiece className="relative">
                <ShowcaseSwap swapKey={largo ? "datas-em-linha" : "datas-e-barra"}>
                    {largo ? <DatasEmLinha /> : <DatasEBarra />}
                </ShowcaseSwap>
            </ShowcasePiece>
            <ShowcasePiece>
                <Linhas linhas={COMPRAS_POR_FORMA[form]} emLinha={largo} compacto={form === "phone"} />
            </ShowcasePiece>
        </div>
    )
}

/**
 * A âncora do "+" (e do "VC" que entra no lugar dele): o `AvatarGroupAdd` não
 * repassa atributos, então a âncora mora na última vaga da pilha — 32px, o
 * `sm`, no fim do grupo sem resumo. O cursor pousa no **centro** da âncora, e
 * a seta desce para a direita a partir da ponta: a âncora é o quarto de baixo
 * à direita da vaga (16px), para a ponta tocar o círculo perto da borda e o
 * "+" ficar à vista, em vez de a seta cobri-lo.
 */
function AncoraDoConvite() {
    return <span aria-hidden data-showcase-anchor="avatar-add" className="pointer-events-none absolute end-0 bottom-0 size-4" />
}

/**
 * O que só o tablet mostra (a tela alta da família convite). Entra e sai por
 * `ShowcaseSwap`.
 */
function SoNoTablet({ form, children }: { form: DeviceFrameForm; children: React.ReactNode }) {
    const tablet = form === "tablet"
    return (
        <div className="relative">
            <ShowcaseSwap swapKey={tablet ? "tablet" : "outra"}>{tablet ? children : null}</ShowcaseSwap>
        </div>
    )
}

const PAGAMENTOS = [
    { pessoa: MINI_APP_PEOPLE.rafael, oque: "pagou o aluguel", valor: 2150 },
    { pessoa: MINI_APP_PEOPLE.ana, oque: "pagou a feira", valor: 214.9 },
] as const

/**
 * O bloco do tablet conta pela altura da tela (a do tablet acompanha a
 * largura): no palco médio (a janela de 1280, tela de 394px) quem pagou; no
 * grande (1440, 448px) também a barra do que já foi pago; no palco baixo
 * (1024×700) só a barra. O corte de 26rem cai entre as duas larguras medidas.
 */
const SO_NO_GRANDE = "@max-[26rem]/screen:hidden showcase-short:flex"
const FORA_DO_BAIXO = "showcase-short:hidden"

/**
 * Quem pagou o quê em outubro: a casa contada pelas pessoas. R$ 2.364,90 dos
 * R$ 2.484,80 já pagos (95%); falta a internet, que vence dia 15.
 */
function QuemPagou() {
    return (
        <section className="flex flex-col gap-1">
            <Caption className={cn("font-medium text-foreground", FORA_DO_BAIXO)}>Quem pagou em outubro</Caption>
            <ItemGroup variant="divided" className={FORA_DO_BAIXO}>
                {PAGAMENTOS.map(({ pessoa, oque, valor }) => {
                    const tom = identityToneFor(pessoa.color, pessoa.name)
                    return (
                        <Item key={pessoa.name} size="sm" variant="flush" className="px-0">
                            <ItemMedia>
                                <Avatar size="xs">
                                    <AvatarFallback tint="soft" className={cn(tom.surface, tom.ink)}>
                                        {getInitials(pessoa.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>{pessoa.name}</ItemTitle>
                                <ItemDescription className="truncate">{oque}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                                <MoneyDisplay value={valor} size="sm" />
                            </ItemActions>
                        </Item>
                    )
                })}
            </ItemGroup>
            <Progress
                value={2364.9}
                max={2484.8}
                size="sm"
                tone="success"
                className={cn("pt-2 showcase-short:pt-0", SO_NO_GRANDE)}
                header={
                    <ProgressHeader>
                        <ProgressLabel className="font-normal text-muted-foreground">Já pago</ProgressLabel>
                        <ProgressValue />
                    </ProgressHeader>
                }
                footer={<ProgressFooter className="justify-start">Falta a internet, que vence dia 15</ProgressFooter>}
            />
        </section>
    )
}

function QuemPagouEsqueleto() {
    return (
        <div className="flex flex-col gap-1">
            <Skeleton shape="text" className={cn("w-36 text-xs", FORA_DO_BAIXO)} />
            {[0, 1].map((i) => (
                <div key={i} className={cn("flex items-center gap-2 py-2", FORA_DO_BAIXO)}>
                    <Skeleton shape="circle" size="xs" />
                    <div className="flex flex-1 flex-col">
                        <Skeleton shape="text" className="w-20 text-sm" />
                        <Skeleton shape="text" className="w-24 text-xs" />
                    </div>
                    <Skeleton shape="text" className="w-16 text-xs" />
                </div>
            ))}
            <div className={cn("flex flex-col gap-2 pt-2 showcase-short:pt-0", SO_NO_GRANDE)}>
                <div className="flex justify-between">
                    <Skeleton shape="text" className="w-14 text-xs" />
                    <Skeleton shape="text" className="w-8 text-xs" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton shape="text" className="w-44 text-xs" />
            </div>
        </div>
    )
}

/**
 * A carteira compartilhada "Casa": a porta do convite (`member` falso) e depois de aceitar.
 *
 * A fileira de pessoas (os rostos e a contagem) espera a moldura assentar: no meio de uma troca de forma, a saída
 * de um `ShowcaseSwap` refaz a projeção, e cada vaga do `AvatarGroup` (`layout="position"` na `MOLA`) voa por conta
 * própria, fora da `MOLA_PALCO` do cartão — os rostos descolavam 25–30px para cima, sobre o título. Escondida no voo,
 * a fileira acende no repouso.
 */
function Carteira({ member, form }: { member: boolean; form: DeviceFrameForm }) {
    const { ana, rafael, voce } = MINI_APP_PEOPLE
    const { settled } = useShowcase()
    return (
        <div className="flex flex-col gap-3">
            <ShowcasePiece>
                <DescriptionList columns={2} size="sm">
                    <DescriptionListItem>
                        <DescriptionTerm>Gastos de outubro</DescriptionTerm>
                        <DescriptionDetails size="lg">
                            <MoneyDisplay value={2484.8} size="lg" />
                        </DescriptionDetails>
                    </DescriptionListItem>
                    <DescriptionListItem>
                        <DescriptionTerm>Sua parte</DescriptionTerm>
                        <DescriptionDetails size="lg">
                            <MoneyDisplay value={828.27} size="lg" />
                        </DescriptionDetails>
                    </DescriptionListItem>
                </DescriptionList>
            </ShowcasePiece>
            <ShowcasePiece>
                <Card padding="none" data-showcase-anchor="carteira-casa">
                    <CardToolbar variant="title">Carteira compartilhada · Casa</CardToolbar>
                    <div
                        data-showcase-anchor="carteira-pessoas"
                        className={cn(
                            "flex items-center justify-between gap-3 px-4 pb-1",
                            settled ? "transition-opacity duration-(--duration-base) ease-(--ease-out)" : "opacity-0"
                        )}
                    >
                        <div className="relative">
                            <AvatarGroup
                                label="Quem está na Casa"
                                size="sm"
                                tint="soft"
                                add={member ? undefined : <AvatarGroupAdd label="Convidar para a Casa" />}
                            >
                                <AvatarGroupItem {...ana} />
                                <AvatarGroupItem {...rafael} />
                                {member ? <AvatarGroupItem {...voce} /> : null}
                            </AvatarGroup>
                            <AncoraDoConvite />
                        </div>
                        <Caption>{member ? "3 pessoas" : "2 pessoas"}</Caption>
                    </div>
                    <Linhas linhas={DESPESAS_DA_CASA} emLinha={false} compacto={form === "phone"} className="px-4" />
                </Card>
            </ShowcasePiece>
            <SoNoTablet form={form}>
                <QuemPagou />
            </SoNoTablet>
        </div>
    )
}

/** A carteira esperando: a mesma geometria, em ossos. */
function CarteiraEsqueleto({ form }: { form: DeviceFrameForm }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <Skeleton shape="text" className="w-24 text-xs" />
                        <Skeleton shape="text" className="w-20 text-base" />
                    </div>
                ))}
            </div>
            <Card padding="none">
                <div className="px-4 py-3">
                    <Skeleton shape="text" className="w-48 text-sm" />
                </div>
                <div className="flex items-center justify-between px-4 pb-1">
                    <AvatarGroupSkeleton count={3} size="sm" group={false} />
                    <Skeleton shape="text" className="w-16 text-xs" />
                </div>
                <div className="flex flex-col px-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2 py-2">
                            <Skeleton shape="tile" size="xs" />
                            <div className="flex flex-1 flex-col">
                                <Skeleton shape="text" className="w-24 text-sm" />
                                <Skeleton shape="text" className="w-16 text-xs" />
                            </div>
                            <Skeleton shape="text" className="w-16 text-xs" />
                        </div>
                    ))}
                </div>
            </Card>
            <SoNoTablet form={form}>
                <QuemPagouEsqueleto />
            </SoNoTablet>
        </div>
    )
}

function TelaDaCarteira({ form, loading, member }: { form: DeviceFrameForm; loading: boolean; member: boolean }) {
    return (
        <div className={cn("relative", form === "browser" ? "px-4 pt-3" : "px-3 pt-1")}>
            <ShowcaseSwap swapKey={loading ? "esqueleto" : "carteira"}>
                {loading ? <CarteiraEsqueleto form={form} /> : <Carteira member={member} form={form} />}
            </ShowcaseSwap>
        </div>
    )
}

/** As telas que dividem um corpo: o painel e o orçamento são a mesma tela; a carteira e o esqueleto também. */
const CORPO: Record<MiniAppScreen, "painel" | "fatura" | "carteira"> = {
    dashboard: "painel",
    budget: "painel",
    invoice: "fatura",
    "wallet-loading": "carteira",
    wallet: "carteira",
}

type AuthMiniAppProps = {
    screen: MiniAppScreen
    /** Na carteira: você já entrou (o "+" vira o "VC"). */
    member?: boolean
    /** A pílula de busca do navegador, no roteiro do login. */
    search?: MiniAppSearch
}

/**
 * A tela do aparelho do palco. Em `memo`: quem digita a paleta renderiza 14
 * vezes por segundo, e nada disso chega aqui.
 */
export const AuthMiniApp = React.memo(function AuthMiniApp({ screen, member = false, search = "rest" }: AuthMiniAppProps) {
    const { form } = useDeviceFrame()
    const corpo = CORPO[screen]
    return (
        <div data-slot="auth-mini-app" data-screen={screen} className="flex size-full min-h-0 flex-col">
            <div className="relative shrink-0">
                <ShowcaseSwap swapKey={form === "browser" ? "barra" : "cabecalho"}>
                    {form === "browser" ? <BarraDoNavegador screen={screen} search={search} /> : <CabecalhoDeBolso screen={screen} compacto={form === "phone"} />}
                </ShowcaseSwap>
            </div>
            <div className="relative min-h-0 flex-1">
                <ShowcaseSwap swapKey={corpo} effect="rise">
                    {corpo === "painel" ? (
                        <Painel form={form} budget={screen === "budget"} />
                    ) : corpo === "fatura" ? (
                        <Fatura form={form} />
                    ) : (
                        <TelaDaCarteira form={form} loading={screen === "wallet-loading"} member={member} />
                    )}
                </ShowcaseSwap>
            </div>
        </div>
    )
})
