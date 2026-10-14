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

import {
    AuthMiniApp,
    MINI_APP_NAV_ACTIVE,
    MINI_APP_PEOPLE,
    MINI_APP_URL,
    type MiniAppScreen,
} from "@/components/auth/showcase/mini-app"
import { AuthPhoneScreens, AuthRecoveryTimeline, type PhoneScreen } from "@/components/auth/showcase/phone-screens"
import { sceneFamily, type AuthSceneId, type SceneFamily } from "@/components/auth/showcase/scene-context"
import {
    FAMILY_ORDER,
    focoPulaORoteiro,
    SCENE_NAV_ICONS,
    SCENES,
    SCRIPT_STAGE_REST,
    type SceneCursor,
    type SceneOverlay,
    type SceneSpec,
    type ScriptStage,
} from "@/components/auth/showcase/scenes"

export { focoPulaORoteiro } from "@/components/auth/showcase/scenes"
import { AuthTestimonialCard, testimonialsFor } from "@/components/auth/showcase/testimonials"
import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
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
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, TILE_PALETTE } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"
import type { SceneScriptId } from "@/lib/scene-script"
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

/** O orçamento da casa entra 250ms depois da troca de cena (seção 7): o celular já está a caminho, e o bloco sobe nele. */
const ENTRADA_DO_ORCAMENTO_MS = 250
/**
 * O bloqueio da recuperação desce 350ms depois da troca (seção 7) quando o celular chega de outra família: no meio
 * da troca de forma, com o celular quase pousado. Dentro da recuperação (o link conferido que venceu) o celular
 * já está ali, e ele desce na hora.
 */
const DESCIDA_DO_BLOQUEIO_MS = 350
/** O bloqueio leva `--duration-slow` (300ms) para descer: assentado, a tela de baixo já não aparece e sai. */
const ASSENTO_DO_BLOQUEIO_MS = 300

/**
 * O que entra atrasado e sai na hora (o orçamento do cadastro, o bloqueio da recuperação). A primeira cena entra
 * já com ele — é o quadro do servidor, e a tela aberta por link direto nasce pronta.
 */
function useEntradaAtrasada(ligado: boolean, atraso: number): boolean {
    const [mostrado, setMostrado] = React.useState(ligado)
    if (!ligado && mostrado) setMostrado(false)
    React.useEffect(() => {
        if (!ligado || mostrado) return
        const t = setTimeout(() => setMostrado(true), atraso)
        return () => clearTimeout(t)
    }, [ligado, mostrado, atraso])
    return ligado && mostrado
}

/** A paleta do ⌘K só é pedida com o palco na tela: no telefone o cmdk nunca é baixado. */
const PaletteDemo = dynamic(
    () => import("@/components/auth/showcase/palette-demo").then((m) => m.PaletteDemo),
    { ssr: false }
)

/**
 * O lugar da paleta: pede o pedaço na primeira vez que o palco fica à vista e
 * conta os focos que pulam o roteiro. O estado mora aqui para que um foco re-
 * renderize só esta subárvore — nunca a moldura. O que o roteiro muda fora da
 * paleta sobe pelo `onStage` e desce de volta como `stage`.
 */
function PaletaDoRoteiro({
    script,
    stage,
    onStage,
}: {
    script: SceneSpec["script"]
    stage: ScriptStage
    onStage: (script: SceneScriptId | null, stage: ScriptStage) => void
}) {
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
    return pedida ? <PaletteDemo script={script} skip={pulos} stage={stage} onStage={onStage} /> : null
}

/* ── O herói ───────────────────────────────────────────────────────────── */

/** As telas do celular da recuperação (`lock`, `new-password`, `link-checking`) são camadas sobre o painel (`phone-screens`): embaixo, o painel. */
function telaDaMiniApp(screen: SceneSpec["screen"]): MiniAppScreen {
    return screen === "lock" || screen === "new-password" || screen === "link-checking" ? "dashboard" : screen
}

/** A tela do celular da recuperação que cobre o painel; o bloqueio é à parte (desce atrasado). */
function telaDoCelular(screen: SceneSpec["screen"]): PhoneScreen | null {
    return screen === "new-password" || screen === "link-checking" ? screen : null
}

/**
 * A tela do celular à vista. Sob o bloqueio fica a última da recuperação: do link conferido ao vencido, o
 * bloqueio desce **sobre a tela da senha**, e não sobre o painel que ela cobria (sem isso o painel e as abas
 * piscavam entre a tela que sai e o bloqueio que chega). Vindo de outra família não há última, e o bloqueio
 * desce sobre o painel, como o plano pede.
 */
function useTelaDoCelular(spec: SceneSpec, assentado: boolean): PhoneScreen | null {
    const atual = telaDoCelular(spec.screen)
    const [ultima, setUltima] = React.useState(atual)
    const proxima = spec.family === "recovery" ? (atual ?? ultima) : null
    if (proxima !== ultima) setUltima(proxima)
    return telaSobOBloqueio(spec.screen === "lock", atual, proxima, assentado)
}

/**
 * A tela à vista: sem o bloqueio, a atual; com ele, a última **só enquanto ele desce**. Assentado, nada fica
 * embaixo — senão a roda do "conferindo" giraria escondida no link vencido (e no e-mail e no código que vêm dele,
 * pelo "Pedir novo código"), um laço que nunca deixa a página ociosa.
 */
export function telaSobOBloqueio(
    travado: boolean,
    atual: PhoneScreen | null,
    ultima: PhoneScreen | null,
    assentado: boolean
): PhoneScreen | null {
    if (!travado) return atual
    return assentado ? null : ultima
}

/** A cena de antes da atual (a mesma, na primeira). */
function useCenaAnterior(scene: AuthSceneId): AuthSceneId {
    const [par, setPar] = React.useState({ atual: scene, anterior: scene })
    if (par.atual !== scene) {
        setPar({ atual: scene, anterior: par.atual })
        return par.atual
    }
    return par.anterior
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
    app,
    title,
    description,
    children,
}: {
    icon: HeroIcon
    color: string
    /**
     * O app que avisa ("Mail"): ganha uma linha em cima, com o "agora" na ponta, como a notificação do celular —
     * e o título fica com a largura toda (ao lado do "Mail · agora" ele quebraria em três linhas na tela de 201px).
     */
    app?: string
    title: string
    description: string
    /** O que fecha a linha da frase, à direita (quem já está na Casa): na mesma linha, o aviso não cresce. */
    children?: React.ReactNode
}) {
    const agora = <span className="shrink-0 text-2xs text-muted-foreground">agora</span>
    return (
        <div className="flex items-start gap-2.5">
            <ColorTile tint="soft" size="md" color={color}>
                <Icon />
            </ColorTile>
            <div className="min-w-0 flex-1">
                {app ? (
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-2xs font-medium text-muted-foreground">{app}</span>
                        {agora}
                    </div>
                ) : null}
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs leading-snug font-medium text-pretty">{title}</p>
                    {app ? null : agora}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-xs leading-snug text-muted-foreground">{description}</p>
                    {children}
                </div>
            </div>
        </div>
    )
}

const AVISOS: Partial<Record<SceneOverlay, React.ReactNode>> = {
    "notice-confirm": (
        <Aviso icon={EnvelopeIcon} color={cor("índigo")} title="Confirme seu e-mail" description="Toque no link para ativar sua conta." />
    ),
    "notice-confirm-invite": (
        <Aviso icon={UserPlusIcon} color={cor("índigo")} title="Confirme e entre na Casa" description={"Convite da Ana\u00a0C."}>
            {/*
             * Quem já está lá, na identidade do cursor de cada um, na linha da frase: o aviso fica na altura dos
             * outros e não corta o saldo. A frase é curta para caber ao lado deles na tela de 201px (1024).
             */}
            <AvatarGroup label="Quem está na Casa" size="xs" tint="soft" className="shrink-0">
                <AvatarGroupItem {...MINI_APP_PEOPLE.ana} />
                <AvatarGroupItem {...MINI_APP_PEOPLE.rafael} />
            </AvatarGroup>
        </Aviso>
    ),
    "notice-code": (
        <Aviso
            icon={KeyIcon}
            color={cor("violeta")}
            app="Mail"
            title="Seu código de acesso chegou"
            description="Use os 6 dígitos para continuar."
        />
    ),
    "notice-expired": (
        <Aviso icon={ClockIcon} color={TILE_EXPENSE_DEFAULT} title="Este link expirou" description="Peça um novo código." />
    ),
}

/**
 * O que cobre a tela: o véu atrás do aviso do cadastro, a tela apagada e o cartão do convite indisponível. (O
 * véu da paleta cobre a janela inteira: `VEU_DA_JANELA`.)
 */
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
    /** Na coluna ao lado do celular o chip tem a largura de um cartão: o título quebra em duas linhas. */
    estreito?: boolean
}) {
    return (
        <Card variant="elevated" padding="sm" className="shadow-lg">
            <CardContent className="flex items-center gap-3">
                <ColorTile tint="soft" size="lg" color={color}>
                    <Icon />
                </ColorTile>
                <div className={cn("flex min-w-0 flex-col items-start", estreito && "max-w-28")}>
                    <p className="text-sm leading-snug font-medium text-balance">{title}</p>
                    {typeof description === "string" ? <p className="text-xs text-muted-foreground">{description}</p> : description}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Onde o chip pousa — **nunca sobre texto da mini UI** (um rótulo coberto deixa o valor órfão):
 * - navegador: pendurado abaixo da borda de baixo (o topo do chip 12px abaixo do herói), à esquerda do meio —
 *   o canto de baixo à direita é da colagem;
 * - celular: na coluna da colagem, colado à direita do aparelho, à meia altura — no lugar do s3, que cede a
 *   vaga (`VAGA_DO_CHIP`);
 * - tablet: sobre a borda de cima, à direita do meio, onde a barra de status só tem a bateria — dois terços
 *   acima do aparelho, no canto do s0, que cede a vaga.
 */
function pousoDoChip(form: SceneSpec["form"]): { anchor: ShowcaseFloatAnchor; className: string } {
    if (form === "phone") return { anchor: "end", className: "translate-x-5" }
    if (form === "tablet") return { anchor: "hero-top", className: "translate-x-0 -translate-y-2/3" }
    return { anchor: "hero-bottom", className: "-translate-x-3/4 translate-y-3" }
}

/** O lugar da colagem que o chip toma, por forma: o cartão sai enquanto o chip está ali. */
const VAGA_DO_CHIP: Partial<Record<SceneSpec["form"], ShowcaseSlotIndex>> = { phone: 3, tablet: 0 }

function conteudoDoChip({ chip, timeline }: SceneSpec): React.ReactNode {
    if (chip === "session-expired")
        return <ChipSimples icon={LockClosedIcon} color={cor("índigo")} title="Sessão encerrada" description="Seus dados continuam aqui." />
    if (chip === "success")
        return <ChipSimples icon={CheckIcon} color={TILE_INCOME_DEFAULT} title="Senha atualizada" description="Sessões antigas encerradas." />
    if (chip === "synced")
        return (
            <ChipSimples
                icon={ComputerDesktopIcon}
                color={cor("índigo")}
                title="Mesmo painel no computador"
                estreito
                description={
                    <Badge variant="soft" tone="success" size="xs" className="mt-1">
                        sincronizado
                    </Badge>
                }
            />
        )
    if (chip === "timeline" && timeline) return <AuthRecoveryTimeline timeline={timeline} />
    if (chip === "invite-accepted")
        return <ChipSimples icon={CheckIcon} color={TILE_INCOME_DEFAULT} title="Você entrou na Casa" description="Agora são três na carteira." />
    return null
}

/**
 * O chip espera a moldura assentar: na troca de forma ele sai com a cena velha **no lugar velho** e entra no
 * lugar novo. Por isso o chip à vista é o da última cena na forma em que ele está (`mostrado`): numa cena da
 * mesma forma ele troca no lugar (a linha do tempo anda sozinha do e-mail ao código); numa forma nova o
 * `mostrado` só muda depois que a moldura assenta — sem isso, o quadro em que a cena muda (ainda "em repouso",
 * antes de a moldura sair dele) poria o chip novo na âncora da forma nova medida na caixa velha, e é esse quadro
 * que a saída levaria. Com movimento reduzido a moldura nunca sai do repouso, e o `mostrado` muda no tique
 * seguinte.
 *
 * **A linha do tempo sai com os três passos feitos**: no quadro em que a recuperação termina (`celebrate`, a
 * forma já mudando), ela ainda está aberta, com o `current` 3 da cena nova, e é esse quadro que a saída leva.
 */
function Chip({ spec }: { spec: SceneSpec }) {
    const { settled } = useShowcase()
    const [mostrado, setMostrado] = React.useState(spec)
    const mesmaForma = spec.form === mostrado.form
    if (mesmaForma && spec !== mostrado) setMostrado(spec)
    React.useEffect(() => {
        if (!settled || mesmaForma) return
        const t = setTimeout(() => setMostrado(spec), 0)
        return () => clearTimeout(t)
    }, [settled, mesmaForma, spec])

    const saiFeita = !mesmaForma && spec.celebrate === true && mostrado.chip === "timeline"
    const conteudo = conteudoDoChip(saiFeita ? { ...mostrado, timeline: spec.timeline } : mostrado)
    return (
        <ShowcaseFloat
            {...pousoDoChip(mostrado.form)}
            open={conteudo != null && settled && (mesmaForma || saiFeita)}
            layoutId={mostrado.chip === "success" ? "auth-success-chip" : undefined}
        >
            {conteudo}
        </ShowcaseFloat>
    )
}

/* ── Os cursores ───────────────────────────────────────────────────────── */

const NOMES: SceneCursor["name"][] = ["Você", "Ana", "Rafael"]
const SEM_CURSORES: SceneCursor[] = []

/**
 * Os cursores de presença da cena. Cada pessoa tem um cursor só: quem sai da cena fecha (`open`) e sai em
 * 150ms, com a última âncora em que estava; quem entra espera o próprio `delay`. **Cada abertura remonta o
 * cursor** (a chave leva a época): a medida da abertura anterior pode ser de outro tamanho de palco — numa
 * cena sem a âncora o observador não acha o alvo e a medida velha ficaria —, e o cursor novo só aparece depois
 * de medir de novo, com a âncora na tela.
 */
function Cursores({ cursors }: { cursors: SceneCursor[] }) {
    const [ultimos, setUltimos] = React.useState<Partial<Record<SceneCursor["name"], SceneCursor>>>(() =>
        Object.fromEntries(cursors.map((c) => [c.name, c]))
    )
    const mudou = cursors.some((c) => ultimos[c.name] !== c)
    if (mudou) setUltimos((u) => ({ ...u, ...Object.fromEntries(cursors.map((c) => [c.name, c])) }))

    const abertos = NOMES.filter((nome) => cursors.some((c) => c.name === nome))
    const [epocas, setEpocas] = React.useState<{ abertos: string; de: Partial<Record<SceneCursor["name"], number>> }>({
        abertos: abertos.join(),
        de: {},
    })
    if (epocas.abertos !== abertos.join()) {
        const antes = epocas.abertos.split(",")
        const de = { ...epocas.de }
        for (const nome of abertos) if (!antes.includes(nome)) de[nome] = (de[nome] ?? 0) + 1
        setEpocas({ abertos: abertos.join(), de })
    }

    return NOMES.map((nome) => {
        const cursor = cursors.find((c) => c.name === nome) ?? ultimos[nome]
        return cursor ? (
            <ShowcaseCursor key={`${nome}:${epocas.de[nome] ?? 0}`} {...cursor} open={abertos.includes(nome)} />
        ) : null
    })
}

/* ── O palco ───────────────────────────────────────────────────────────── */

/**
 * O véu da paleta, sobre a **janela inteira** — barra, trilho e conteúdo —, como o véu de um diálogo sobre o app.
 * O `DeviceFrame` não tem lugar para uma camada por cima da tela toda (a `Cobertura` mora no conteúdo), e um
 * `::after` esticado na caixa do herói é o padrão do link esticado, que só o `ui/` escreve: o véu é um filtro na
 * caixa do herói, `brightness-60` — os mesmos 40% de escuro do `--overlay` (preto a 40% no escuro, quase preto
 * a 40% no claro). Entra e sai na duração do véu dos diálogos.
 */
const VEU_DA_JANELA = "transition-[filter] duration-(--duration-base) ease-(--ease-out)"

/**
 * O véu do aviso do cadastro sobre a barra de abas do celular. A `Cobertura` vela a área de conteúdo com o
 * `bg-overlay`, mas a barra de abas é do `DeviceFrame`, fora dela: ali o mesmo escuro é o filtro do véu da
 * paleta (`brightness-60`, os 40% do `--overlay`), e o aviso, na ilha, fica aceso. A barra é transparente
 * (o fundo é o da tela) e o filtro só escurece o que ela pinta: por isso ela veste o próprio `bg-background`,
 * igual ao da tela em repouso. A barra de status não precisa: o aviso aberto a cobre.
 */
const VEU_NAS_ABAS =
    "[&_[data-slot=device-frame-nav]]:bg-background [&_[data-slot=device-frame-nav]]:transition-[filter,opacity] [&_[data-slot=device-frame-nav]]:duration-(--duration-base) [&_[data-slot=device-frame-nav]]:ease-(--ease-out)"
const VEU_NAS_ABAS_LIGADO = "[&_[data-slot=device-frame-nav]]:brightness-60"

/**
 * As telas do celular da recuperação (o bloqueio, a nova senha, o link conferido) não são o app: a barra de abas
 * do `DeviceFrame` esmaece por baixo delas, e por trás dela fica a tela, `background` — a cor do pé de cada uma.
 * A barra inteira, e não os ícones: os ícones voam por `layoutId`, e o `motion` lhes escreve a opacidade em
 * linha. Ela esmaece quando o bloqueio desce (+350ms): até lá, os ícones voaram do trilho para a barra.
 */
const ABAS_COBERTAS = "[&_[data-slot=device-frame-nav]]:opacity-0"

/**
 * A barra de status sob o bloqueio: o `muted` do topo do bloqueio (o degradê desce dele ao `background`), sem
 * costura. No link vencido a tela vai a 60%, e o `muted/60` sobre o `background` é a mesma cor que o topo do
 * bloqueio apagado.
 */
const STATUS_DO_BLOQUEIO =
    "[&_[data-slot=device-frame-status]]:bg-muted [&_[data-slot=device-frame-status]]:transition-colors [&_[data-slot=device-frame-status]]:duration-(--duration-slow)"
const STATUS_DO_BLOQUEIO_APAGADO =
    "[&_[data-slot=device-frame-status]]:bg-muted/60 [&_[data-slot=device-frame-status]]:transition-colors [&_[data-slot=device-frame-status]]:duration-(--duration-slow)"

/**
 * O palco que o roteiro da paleta pede, guardado com o roteiro de quem o calculou: na troca de cena o palco
 * velho não vale nem por um commit (a fatura do login não pisca na recuperação).
 */
function useEtapaDoRoteiro(script: SceneScriptId | null) {
    const [etapa, setEtapa] = React.useState<{ script: SceneScriptId | null; stage: ScriptStage }>({
        script,
        stage: SCRIPT_STAGE_REST,
    })
    const onStage = React.useCallback((de: SceneScriptId | null, stage: ScriptStage) => {
        setEtapa((e) =>
            e.script === de && e.stage.search === stage.search && e.stage.screen === stage.screen && e.stage.phone === stage.phone
                ? e
                : { script: de, stage }
        )
    }, [])
    return [etapa.script === script ? etapa.stage : SCRIPT_STAGE_REST, onStage] as const
}

const Palco = React.memo(function Palco({ scene }: { scene: AuthSceneId }) {
    const spec = SCENES[scene]
    const [etapa, onStage] = useEtapaDoRoteiro(spec.script)
    const giro = useGiro(spec.family)
    // A ida e volta do login (D8) gira como o login ↔ cadastro: para o celular de um lado, de volta do outro.
    const turn = spec.family === "login" ? (etapa.phone ? 1 : -1) : giro
    const form = etapa.phone ? "phone" : spec.form
    const orcamento = useEntradaAtrasada(spec.screen === "budget", ENTRADA_DO_ORCAMENTO_MS)
    const anterior = useCenaAnterior(scene)
    const bloqueio = useEntradaAtrasada(
        spec.screen === "lock",
        sceneFamily(anterior) === "recovery" ? 0 : DESCIDA_DO_BLOQUEIO_MS
    )
    const assentado = useEntradaAtrasada(bloqueio, ASSENTO_DO_BLOQUEIO_MS)
    const celular = useTelaDoCelular(spec, assentado)
    const tela: MiniAppScreen =
        etapa.screen === "invoice"
            ? "invoice"
            : spec.screen === "budget" && !orcamento
              ? "dashboard"
              : telaDaMiniApp(spec.screen)
    const veuNoAviso = spec.overlay === "notice-confirm" || spec.overlay === "notice-confirm-invite"
    const vaga = spec.chip !== "none" ? VAGA_DO_CHIP[form] : undefined
    return (
        <ShowcaseStage parallax className="absolute inset-0 rounded-modal">
            <ShowcaseScatter clear={form} ripple={spec.celebrate}>
                {testimonialsFor(spec.family).map((t, i) =>
                    // O lugar que o chip toma fica vazio: o cartão sai (a saída da colagem) e volta quando o chip sai.
                    i === vaga ? (
                        <ShowcaseScatterItem key={i} slot={i as ShowcaseSlotIndex} itemKey="vaga" />
                    ) : (
                        <ShowcaseScatterItem key={i} slot={i as ShowcaseSlotIndex} itemKey={t.id}>
                            <AuthTestimonialCard testimonial={t} />
                        </ShowcaseScatterItem>
                    )
                )}
            </ShowcaseScatter>
            <ShowcaseHero
                form={form}
                className={cn(
                    VEU_DA_JANELA,
                    VEU_NAS_ABAS,
                    etapa.search === "palette" && "brightness-60",
                    veuNoAviso && VEU_NAS_ABAS_LIGADO,
                    (bloqueio || celular) && ABAS_COBERTAS,
                    bloqueio && (spec.overlay === "notice-expired" ? STATUS_DO_BLOQUEIO_APAGADO : STATUS_DO_BLOQUEIO)
                )}
                turn={turn}
                url={MINI_APP_URL[tela]}
                nav={navDa(tela)}
                notification={AVISOS[spec.overlay]}
            >
                <Cobertura overlay={spec.overlay}>
                    <AuthMiniApp screen={tela} member={spec.member} search={etapa.search} />
                    <AuthPhoneScreens tela={celular} bloqueio={bloqueio} rapido={spec.family !== "recovery"} />
                </Cobertura>
            </ShowcaseHero>
            <Chip spec={spec} />
            {/* O cursor do cadastro pousa no orçamento: abre com ele, e não antes — aberto antes, mediria um alvo
                que ainda não está na tela (no movimento reduzido nada o faria medir de novo). */}
            <Cursores cursors={spec.screen === "budget" && !orcamento ? SEM_CURSORES : spec.cursors} />
            <PaletaDoRoteiro script={spec.script} stage={etapa} onStage={onStage} />
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
