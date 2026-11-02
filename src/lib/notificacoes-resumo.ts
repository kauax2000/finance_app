import type { WorkspaceMemberNotificationPrefs } from "@/lib/workspace-notification-prefs"

export const TEMAS_DE_NOTIFICACAO = [
    "notify_transactions",
    "notify_budget",
    "notify_bills",
    "notify_credit_cards",
    "notify_credit_card_calendar",
    "notify_review",
    "notify_insights",
] as const

export type TemaDeNotificacao = (typeof TEMAS_DE_NOTIFICACAO)[number]

// A leitura que a tela de configurações usa hoje: estes dois com `!!`, os outros com `!== false`.
const PEDEM_TRUE: readonly TemaDeNotificacao[] = ["notify_transactions", "notify_budget"]

export function temaLigado(prefs: WorkspaceMemberNotificationPrefs, tema: TemaDeNotificacao): boolean {
    return PEDEM_TRUE.includes(tema) ? !!prefs[tema] : prefs[tema] !== false
}
