import { ChartPieIcon, CreditCardIcon, HomeIcon, UsersIcon } from "@heroicons/react/20/solid"

import type { MiniAppSearch } from "@/components/auth/showcase/mini-app"
import type { AuthSceneId, SceneFamily } from "@/components/auth/showcase/scene-context"
import type { DeviceFrameForm } from "@/components/ui/device-frame"
import type { SceneScriptId, ScriptBeat } from "@/lib/scene-script"
import type { HeroIcon } from "@/types/navigation"

/**
 * # As cenas do painel de marca — a única tabela a editar
 *
 * Cada id que um formulário publica (`useAuthScene`) vira uma `SceneSpec`, e o
 * `AuthShowcase` só a desenha. Mudar o que uma tela de acesso mostra no painel
 * é mudar uma linha daqui; o contrato é o da seção 8 do plano do painel, com a
 * legenda por família (11.2) e o tablet no convite (11.1).
 *
 * A família decide a forma e a colagem: login no navegador, convite no tablet
 * da casa, cadastro e recuperação no celular (o fim da recuperação volta ao
 * navegador). A ordem do giro é a da família: login(0) → convite(1) →
 * cadastro(2) → recuperação(3).
 */

export type SceneScreen =
    | "dashboard" | "invoice" | "budget" | "lock" | "new-password" | "link-checking"
    | "wallet-loading" | "wallet"

export type SceneOverlay =
    | "none" | "notice-confirm" | "notice-confirm-invite" | "notice-code"
    | "notice-expired" | "invite-error" | "dim"

export type SceneChip =
    | "none" | "session-expired" | "success" | "synced" | "timeline" | "invite-accepted"

export type SceneCursor = {
    name: "Você" | "Ana" | "Rafael"
    tone: 1 | 3 | 5
    anchor: "search" | "budget" | "avatar-add" | "row-internet"
    /** A borda de onde entra; sem ela, aparece já pousado. */
    from?: "end" | "bottom" | "top" | "start"
    /** Depois da troca de cena, em ms. */
    delay: number
    click?: boolean
}

export type SceneCaption = { title: string; description: string }

export type SceneSpec = {
    family: SceneFamily
    form: DeviceFrameForm
    screen: SceneScreen
    /** A carteira depois de aceitar o convite: o "+" vira o "VC". */
    member?: boolean
    overlay: SceneOverlay
    chip: SceneChip
    timeline?: { current: 0 | 1 | 2 | 3; expired?: boolean }
    /** O cursor do roteiro do login é dirigido pelo script, não daqui. */
    cursors: SceneCursor[]
    dots: { chapter: 0 | 1 | 2; fill: 0.25 | 0.5 | 0.75 | 1 }
    script: SceneScriptId | null
    celebrate?: boolean
    caption: SceneCaption
}

/**
 * A navegação do aparelho, na ordem do mundo comum (painel, cartão, orçamento,
 * pessoas): trilho no navegador e no tablet, barra de abas no celular. Do
 * `20/solid` — o `DeviceFrame` os desenha a 20px.
 */
export const SCENE_NAV_ICONS: HeroIcon[] = [HomeIcon, CreditCardIcon, ChartPieIcon, UsersIcon]

/** A ordem do giro: subir na lista gira para um lado, descer para o outro. */
export const FAMILY_ORDER: Record<SceneFamily, 0 | 1 | 2 | 3> = { login: 0, invite: 1, register: 2, recovery: 3 }

/** A legenda de cada família (seção 11.2): sem dígitos, sem promessa de resultado. */
export const FAMILY_CAPTION: Record<SceneFamily, SceneCaption> = {
    login: { title: "Seu mês num relance", description: "A mesma conta no computador e no celular." },
    register: { title: "Comece pela casa", description: "Orçamentos e contas divididas desde o primeiro dia." },
    recovery: { title: "Acesso de volta em segundos", description: "Um código no seu e-mail e uma senha nova." },
    invite: { title: "Uma carteira para a casa toda", description: "Cada pessoa lança do próprio aparelho." },
}

const LOGIN = {
    family: "login",
    form: "browser",
    screen: "dashboard",
    overlay: "none",
    cursors: [],
    dots: { chapter: 0, fill: 1 },
    caption: FAMILY_CAPTION.login,
} as const satisfies Partial<SceneSpec>

const REGISTER = {
    family: "register",
    form: "phone",
    screen: "budget",
    caption: FAMILY_CAPTION.register,
} as const satisfies Partial<SceneSpec>

const RECOVERY = {
    family: "recovery",
    form: "phone",
    cursors: [],
    script: null,
    caption: FAMILY_CAPTION.recovery,
} as const satisfies Partial<SceneSpec>

const INVITE = {
    family: "invite",
    form: "tablet",
    dots: { chapter: 0, fill: 1 },
    script: null,
    caption: FAMILY_CAPTION.invite,
} as const satisfies Partial<SceneSpec>

const ANA_NO_CONVITE: SceneCursor = { name: "Ana", tone: 1, anchor: "avatar-add", from: "end", delay: 200 }
const RAFAEL_NA_INTERNET: SceneCursor = { name: "Rafael", tone: 5, anchor: "row-internet", delay: 0 }

export const SCENES: Record<AuthSceneId, SceneSpec> = {
    login: { ...LOGIN, chip: "none", script: "palette-login" },
    "login.session-expired": { ...LOGIN, chip: "session-expired", script: "palette-session" },
    "login.password-updated": { ...LOGIN, chip: "success", script: "palette-security" },

    register: {
        ...REGISTER,
        overlay: "none",
        chip: "synced",
        cursors: [{ name: "Você", tone: 3, anchor: "budget", from: "bottom", delay: 450 }],
        dots: { chapter: 1, fill: 0.5 },
        script: null,
    },
    "register.confirm": {
        ...REGISTER,
        overlay: "notice-confirm",
        chip: "none",
        cursors: [],
        dots: { chapter: 1, fill: 1 },
        script: null,
    },
    "register.confirm-invite": {
        ...REGISTER,
        overlay: "notice-confirm-invite",
        chip: "none",
        cursors: [],
        dots: { chapter: 1, fill: 1 },
        script: null,
    },

    "recovery.email": {
        ...RECOVERY,
        screen: "lock",
        overlay: "none",
        chip: "timeline",
        timeline: { current: 0 },
        dots: { chapter: 2, fill: 0.25 },
    },
    "recovery.code": {
        ...RECOVERY,
        screen: "lock",
        overlay: "notice-code",
        chip: "timeline",
        timeline: { current: 1 },
        dots: { chapter: 2, fill: 0.5 },
    },
    "recovery.password": {
        ...RECOVERY,
        screen: "new-password",
        overlay: "none",
        chip: "timeline",
        timeline: { current: 2 },
        dots: { chapter: 2, fill: 0.75 },
        script: "masked-password",
    },
    "recovery.link-checking": {
        ...RECOVERY,
        screen: "link-checking",
        overlay: "none",
        chip: "timeline",
        timeline: { current: 1 },
        dots: { chapter: 2, fill: 0.5 },
    },
    "recovery.link-expired": {
        ...RECOVERY,
        screen: "lock",
        overlay: "notice-expired",
        chip: "timeline",
        timeline: { current: 0, expired: true },
        dots: { chapter: 2, fill: 0.25 },
    },
    "recovery.done": {
        ...RECOVERY,
        form: "browser",
        screen: "dashboard",
        overlay: "none",
        chip: "success",
        timeline: { current: 3 },
        dots: { chapter: 2, fill: 1 },
        celebrate: true,
    },

    "invite.loading": { ...INVITE, screen: "wallet-loading", overlay: "none", chip: "none", cursors: [] },
    "invite.idle": { ...INVITE, screen: "wallet", overlay: "dim", chip: "none", cursors: [] },
    "invite.gate": {
        ...INVITE,
        screen: "wallet",
        overlay: "none",
        chip: "none",
        cursors: [ANA_NO_CONVITE, RAFAEL_NA_INTERNET],
    },
    "invite.accepted": {
        ...INVITE,
        screen: "wallet",
        member: true,
        overlay: "none",
        chip: "invite-accepted",
        // A Ana sai do "+": quem pousa ali agora é você.
        cursors: [RAFAEL_NA_INTERNET, { name: "Você", tone: 3, anchor: "avatar-add", from: "bottom", delay: 150 }],
    },
    "invite.error": { ...INVITE, screen: "wallet", overlay: "invite-error", chip: "none", cursors: [] },
}

/**
 * O que o roteiro da paleta muda **fora** dela, no palco: a pílula do cabeçalho
 * (parada, apertada pelo clique ou voando para a paleta), a tela da mini UI
 * depois do Enter e a ida e volta ao celular (D8). Muda umas seis vezes por
 * roteiro — a digitação, 14 quadros por segundo, fica só na paleta.
 */
export type ScriptStage = {
    search: MiniAppSearch
    screen: "dashboard" | "invoice"
    phone: boolean
}

export const SCRIPT_STAGE_REST: ScriptStage = { search: "rest", screen: "dashboard", phone: false }

const BATIDAS_DA_PALETA: readonly ScriptBeat[] = ["open", "type", "select"]
const BATIDAS_DA_FATURA: readonly ScriptBeat[] = ["swap", "morph", "morph-back", "done"]

/**
 * O palco de um quadro do roteiro. Com movimento reduzido o quadro é um só (o
 * plano, seção 5): a paleta aberta, com a consulta e a linha escolhida, sobre o
 * painel — sem fatura e sem ida ao celular.
 */
export function scriptStage(script: SceneScriptId | null, beat: ScriptBeat, reduced: boolean): ScriptStage {
    if (!script || script === "masked-password") return SCRIPT_STAGE_REST
    if (reduced) return { search: "palette", screen: "dashboard", phone: false }
    const login = script === "palette-login"
    return {
        search: beat === "press" ? "pressed" : BATIDAS_DA_PALETA.includes(beat) ? "palette" : "rest",
        screen: login && BATIDAS_DA_FATURA.includes(beat) ? "invoice" : "dashboard",
        phone: login && beat === "morph",
    }
}
