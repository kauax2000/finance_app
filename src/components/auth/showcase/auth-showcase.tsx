"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import {
    CheckIcon,
    ClockIcon,
    ComputerDesktopIcon,
    EnvelopeIcon,
    KeyIcon,
    LinkSlashIcon,
    LockClosedIcon,
    UserPlusIcon,
} from "@heroicons/react/16/solid"

import { AuthMiniApp, MINI_APP_NAV_ACTIVE, MINI_APP_URL, type MiniAppScreen } from "@/components/auth/showcase/mini-app"
import type { AuthSceneId, SceneFamily } from "@/components/auth/showcase/scene-context"
import {
    FAMILY_ORDER,
    SCENE_NAV_ICONS,
    SCENES,
    type SceneChip,
    type SceneCursor,
    type SceneOverlay,
    type SceneSpec,
} from "@/components/auth/showcase/scenes"
import { AuthTestimonialCard, testimonialsFor } from "@/components/auth/showcase/testimonials"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import type { DeviceFrameNavItem } from "@/components/ui/device-frame"
import {
    ShowcaseCaption,
    ShowcaseCursor,
    ShowcaseDots,
    ShowcaseFloat,
    ShowcaseHero,
    ShowcaseScatter,
    ShowcaseScatterItem,
    ShowcaseStage,
    useShowcase,
    type ShowcaseFloatAnchor,
    type ShowcaseSlotIndex,
} from "@/components/ui/showcase"
import { Timeline, TimelineItem, TimelineTitle } from "@/components/ui/timeline"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, TILE_PALETTE } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"
import type { HeroIcon } from "@/types/navigation"

/**
 * # O painel de marca das telas de acesso: a orquestração
 *
 * Lê a cena (`SCENES[id]`) e a desenha no palco do DS: a colagem da família, o
 * herói (`DeviceFrame` com a mini UI), o chip, os cursores, a paleta do roteiro
 * e a legenda com os capítulos. Nenhum `motion` aqui — quem anima é o
 * `Showcase`.
 *
 * **O painel responde 80ms depois da coluna** e, de propósito, num commit só
 * dele: a coluna troca (desliza, foca o `H1`, muda de altura) no commit da
 * rota; o palco re-renderiza depois, com a página já parada. Se os dois
 * mudassem juntos, a projeção de layout leria o deslocamento da página como
 * troca e a moldura voaria do lugar velho. Por isso `AuthShowcase` e o `Palco`
 * são `memo`: o re-render do frame (cada publicação de cena, cada troca de
 * rota) não desce ao palco, e a cena mostrada é um estado daqui, atrasado.
 */

/** O painel anda depois da coluna. */
const RESPOSTA_DO_PAINEL_MS = 80

/** A cena que o palco mostra: a publicada, 80ms depois (a primeira, na hora — é o quadro do servidor). */
function useCenaDoPalco(scene: AuthSceneId): AuthSceneId {
    const [mostrada, setMostrada] = React.useState(scene)
    React.useEffect(() => {
        if (scene === mostrada) return
        const t = setTimeout(() => setMostrada(scene), RESPOSTA_DO_PAINEL_MS)
        return () => clearTimeout(t)
    }, [scene, mostrada])
    return mostrada
}

/**
 * O sentido do giro na troca de forma, pela ordem das famílias: subir na ordem
 * gira para um lado (`1`), descer para o outro. Decidido no mesmo render em que
 * a forma muda — a moldura lê o `turn` no instante da troca.
 */
function useGiro(family: SceneFamily): 1 | -1 {
    const [ultimo, setUltimo] = React.useState<{ family: SceneFamily; turn: 1 | -1 }>({ family, turn: 1 })
    if (ultimo.family !== family) {
        const turn = FAMILY_ORDER[family] > FAMILY_ORDER[ultimo.family] ? 1 : -1
        setUltimo({ family, turn })
        return turn
    }
    return ultimo.turn
}

/* ── O foco que pula o roteiro ─────────────────────────────────────────── */

const CAMPO_DE_VERDADE = "input, textarea, select, button, a, [role=combobox]"

/**
 * O foco que pula o roteiro em execução: o de quem foi trabalhar na coluna —
 * um campo, um botão ou um link de `[data-slot=split-shell-main]`. O foco
 * programático no `H1` (`tabindex="-1"`) não conta: a coluna o faz a cada
 * troca de passo, e o roteiro não pode morrer por isso.
 */
export function focoPulaORoteiro(alvo: EventTarget | null): boolean {
    const el = alvo as Element | null
    if (!el || typeof el.matches !== "function") return false
    return (
        el.closest("[data-slot=split-shell-main]") != null &&
        el.matches(CAMPO_DE_VERDADE) &&
        !el.matches('[tabindex="-1"]')
    )
}

/** A paleta do ⌘K só é pedida com o palco na tela: no telefone o cmdk nunca é baixado. */
const PaletteDemo = dynamic(
    () => import("@/components/auth/showcase/palette-demo").then((m) => m.PaletteDemo),
    { ssr: false }
)

/**
 * O lugar da paleta: pede o pedaço na primeira vez que o palco fica à vista e
 * conta os focos que pulam o roteiro. O estado mora aqui para que um foco re-
 * renderize só esta subárvore — nunca a moldura.
 */
function PaletaDoRoteiro({ script }: { script: SceneSpec["script"] }) {
    const { active } = useShowcase()
    const [pedida, setPedida] = React.useState(active)
    if (active && !pedida) setPedida(true)
    const [pulos, setPulos] = React.useState(0)
    React.useEffect(() => {
        const ouvir = (e: FocusEvent) => {
            if (focoPulaORoteiro(e.target)) setPulos((n) => n + 1)
        }
        document.addEventListener("focusin", ouvir)
        return () => document.removeEventListener("focusin", ouvir)
    }, [])
    return pedida ? <PaletteDemo script={script} skip={pulos} /> : null
}

/* ── O herói ───────────────────────────────────────────────────────────── */

/** As telas do celular de recuperação (`lock`, `new-password`, `link-checking`) entram com o `phone-screens` da recuperação; até lá, o painel. */
function telaDaMiniApp(screen: SceneSpec["screen"]): MiniAppScreen {
    return screen === "lock" || screen === "new-password" || screen === "link-checking" ? "dashboard" : screen
}

function navDa(tela: MiniAppScreen): DeviceFrameNavItem[] {
    const ativa = MINI_APP_NAV_ACTIVE[tela]
    return SCENE_NAV_ICONS.map((icon, i) => ({ icon, active: i === ativa }))
}

const cor = (nome: (typeof TILE_PALETTE)[number]["nome"]) => TILE_PALETTE.find((p) => p.nome === nome)!.hex

/** Um aviso do aparelho: o ladrilho, o título, a linha e o "agora". */
function Aviso({
    icon: Icon,
    color,
    title,
    description,
}: {
    icon: HeroIcon
    color: string
    title: string
    description: string
}) {
    return (
        <div className="flex items-start gap-2.5">
            <ColorTile tint="soft" size="md" color={color}>
                <Icon />
            </ColorTile>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs leading-snug font-medium text-pretty">{title}</p>
                    <span className="shrink-0 text-2xs text-muted-foreground">agora</span>
                </div>
                <p className="text-xs leading-snug text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

const AVISOS: Partial<Record<SceneOverlay, React.ReactNode>> = {
    "notice-confirm": (
        <Aviso icon={EnvelopeIcon} color={cor("índigo")} title="Confirme seu e-mail" description="Toque no link para ativar sua conta." />
    ),
    "notice-confirm-invite": (
        <Aviso icon={UserPlusIcon} color={cor("índigo")} title="Confirme e entre na Casa" description="Ana C. convidou você para a carteira." />
    ),
    "notice-code": (
        <Aviso icon={KeyIcon} color={cor("violeta")} title="Seu código de acesso chegou" description="Use os 6 dígitos para continuar." />
    ),
    "notice-expired": (
        <Aviso icon={ClockIcon} color={TILE_EXPENSE_DEFAULT} title="Este link expirou" description="Peça um novo código." />
    ),
}

/** O que cobre a tela: o véu atrás do aviso do cadastro, a tela apagada e o cartão do convite indisponível. */
function Cobertura({ overlay, children }: { overlay: SceneOverlay; children: React.ReactNode }) {
    const apagada = overlay === "dim" || overlay === "invite-error" || overlay === "notice-expired"
    const veu = overlay === "notice-confirm" || overlay === "notice-confirm-invite"
    return (
        <div className="relative size-full">
            <div className={cn("size-full transition-opacity duration-(--duration-slow) ease-(--ease-out)", apagada && "opacity-60")}>
                {children}
            </div>
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-0 bg-overlay transition-opacity duration-(--duration-base)",
                    veu ? "opacity-100" : "opacity-0"
                )}
            />
            {overlay === "invite-error" ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Card variant="elevated" padding="sm" className="w-full max-w-64 starting:opacity-0 transition-opacity duration-(--duration-slow)">
                        <CardContent>
                            <Aviso
                                icon={LinkSlashIcon}
                                color={TILE_EXPENSE_DEFAULT}
                                title="Convite indisponível"
                                description="Peça um link novo a quem convidou."
                            />
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    )
}

/* ── O chip ────────────────────────────────────────────────────────────── */

function ChipSimples({
    icon: Icon,
    color,
    title,
    description,
    estreito = false,
}: {
    icon: HeroIcon
    color: string
    title: string
    /** A segunda linha: a frase, ou um selo. */
    description: React.ReactNode
    /** Ao lado do celular sobra pouco palco: o título quebra em duas linhas. */
    estreito?: boolean
}) {
    return (
        <Card variant="elevated" padding="sm" className="shadow-lg">
            <CardContent className="flex items-center gap-3">
                <ColorTile tint="soft" size="lg" color={color}>
                    <Icon />
                </ColorTile>
                <div className={cn("flex min-w-0 flex-col items-start", estreito && "max-w-36")}>
                    <p className="text-sm leading-snug font-medium text-balance">{title}</p>
                    {typeof description === "string" ? <p className="text-xs text-muted-foreground">{description}</p> : description}
                </div>
            </CardContent>
        </Card>
    )
}

const PASSOS_DA_RECUPERACAO = [
    { icon: EnvelopeIcon, titulo: "Código enviado" },
    { icon: KeyIcon, titulo: "Código conferido" },
    { icon: LockClosedIcon, titulo: "Nova senha" },
] as const

function ChipDaLinhaDoTempo({ timeline }: { timeline: NonNullable<SceneSpec["timeline"]> }) {
    const estado = (i: number) =>
        timeline.expired
            ? i === 0
                ? "current"
                : "upcoming"
            : i < timeline.current
              ? "done"
              : i === timeline.current
                ? "current"
                : "upcoming"
    return (
        <Card variant="elevated" padding="sm" className="w-48 shadow-lg">
            <CardContent>
                <Timeline marker="icon" size="sm">
                    {PASSOS_DA_RECUPERACAO.map(({ icon: Icon, titulo }, i) => (
                        <TimelineItem key={titulo} state={estado(i)} icon={<Icon />}>
                            <TimelineTitle>{titulo}</TimelineTitle>
                        </TimelineItem>
                    ))}
                </Timeline>
            </CardContent>
        </Card>
    )
}

/**
 * Onde o chip pousa. No navegador, montado na borda de baixo, um pouco à
 * esquerda do meio: as laterais do navegador caem fora do palco, e o canto de
 * baixo à direita é da colagem. No celular, na beirada esquerda, logo acima do
 * meio — entre os dois cartões da esquerda; a direita é do cursor que pousa no
 * orçamento —, puxado para fora do aparelho (três quintos do chip além da
 * borda) para cobrir só a beirada da tela. No tablet não há borda livre: o chip
 * vira o aviso do próprio aparelho (`AVISO_DO_CHIP`).
 */
function pousoDoChip(form: SceneSpec["form"]): { anchor: ShowcaseFloatAnchor; className: string } {
    return form === "phone"
        ? { anchor: "start", className: "-translate-x-3/5 -translate-y-full" }
        : { anchor: "hero-bottom", className: "-translate-x-2/3" }
}

/** O chip que, no tablet, vira o aviso no canto da tela. */
const AVISO_DO_CHIP: Partial<Record<SceneChip, React.ReactNode>> = {
    "invite-accepted": (
        <Aviso icon={CheckIcon} color={TILE_INCOME_DEFAULT} title="Você entrou na Casa" description="Agora são três na carteira." />
    ),
}

function Chip({ spec }: { spec: SceneSpec }) {
    // O chip espera a moldura assentar: na troca de forma ele sai com a cena velha e entra no lugar novo.
    // O "Você entrou na Casa" não passa por aqui: no tablet ele é o aviso do aparelho.
    const { settled } = useShowcase()
    const { chip } = spec
    const conteudo =
        chip === "session-expired" ? (
            <ChipSimples icon={LockClosedIcon} color={cor("índigo")} title="Sessão encerrada" description="Seus dados continuam aqui." />
        ) : chip === "success" ? (
            <ChipSimples icon={CheckIcon} color={TILE_INCOME_DEFAULT} title="Senha atualizada" description="Sessões antigas encerradas." />
        ) : chip === "synced" ? (
            <ChipSimples
                icon={ComputerDesktopIcon}
                color={cor("índigo")}
                title="Mesmo painel no computador"
                estreito
                description={
                    <Badge variant="soft" tone="success" size="xs">
                        sincronizado
                    </Badge>
                }
            />
        ) : chip === "timeline" && spec.timeline ? (
            <ChipDaLinhaDoTempo timeline={spec.timeline} />
        ) : null
    return (
        <ShowcaseFloat
            {...pousoDoChip(spec.form)}
            open={conteudo != null && settled}
            layoutId={chip === "success" ? "auth-success-chip" : undefined}
        >
            {conteudo}
        </ShowcaseFloat>
    )
}

/* ── Os cursores ───────────────────────────────────────────────────────── */

const NOMES: SceneCursor["name"][] = ["Você", "Ana", "Rafael"]

/**
 * Os cursores de presença da cena. Cada pessoa tem um cursor só, montado o
 * tempo todo: quem sai da cena fecha (`open`) e sai em 150ms, com a última
 * âncora em que estava; quem entra espera o próprio `delay`.
 */
function Cursores({ cursors }: { cursors: SceneCursor[] }) {
    const [ultimos, setUltimos] = React.useState<Partial<Record<SceneCursor["name"], SceneCursor>>>(() =>
        Object.fromEntries(cursors.map((c) => [c.name, c]))
    )
    const mudou = cursors.some((c) => ultimos[c.name] !== c)
    if (mudou) setUltimos((u) => ({ ...u, ...Object.fromEntries(cursors.map((c) => [c.name, c])) }))
    return NOMES.map((nome) => {
        const cursor = cursors.find((c) => c.name === nome) ?? ultimos[nome]
        return cursor ? <ShowcaseCursor key={nome} {...cursor} open={cursors.some((c) => c.name === nome)} /> : null
    })
}

/* ── O palco ───────────────────────────────────────────────────────────── */

const Palco = React.memo(function Palco({ scene }: { scene: AuthSceneId }) {
    const spec = SCENES[scene]
    const turn = useGiro(spec.family)
    const tela = telaDaMiniApp(spec.screen)
    return (
        <ShowcaseStage parallax className="absolute inset-0 rounded-modal">
            <ShowcaseScatter clear={spec.form} ripple={spec.celebrate}>
                {testimonialsFor(spec.family).map((t, i) => (
                    <ShowcaseScatterItem key={i} slot={i as ShowcaseSlotIndex} itemKey={t.id}>
                        <AuthTestimonialCard testimonial={t} />
                    </ShowcaseScatterItem>
                ))}
            </ShowcaseScatter>
            <ShowcaseHero
                form={spec.form}
                turn={turn}
                url={MINI_APP_URL[tela]}
                nav={navDa(tela)}
                notification={AVISOS[spec.overlay] ?? (spec.form === "tablet" ? AVISO_DO_CHIP[spec.chip] : undefined)}
            >
                <Cobertura overlay={spec.overlay}>
                    <AuthMiniApp screen={tela} member={spec.member} />
                </Cobertura>
            </ShowcaseHero>
            <Chip spec={spec} />
            <Cursores cursors={spec.cursors} />
            <PaletaDoRoteiro script={spec.script} />
            <ShowcaseCaption
                title={spec.caption.title}
                description={spec.caption.description}
                dots={<ShowcaseDots count={3} active={spec.dots.chapter} fill={spec.dots.fill} />}
            />
        </ShowcaseStage>
    )
})

/**
 * O que o painel de marca mostra para a cena publicada pelo formulário. Monta
 * uma vez no layout de `(auth)` e troca de cena sem remontar.
 */
export const AuthShowcase = React.memo(function AuthShowcase({ scene }: { scene: AuthSceneId }) {
    return <Palco scene={useCenaDoPalco(scene)} />
})
