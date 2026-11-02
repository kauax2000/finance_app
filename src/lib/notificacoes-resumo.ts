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

// Mesma leitura de isTypeAllowedForPrefs: estes dois só ligam com true; os outros só caem com false.
const PEDEM_TRUE: readonly TemaDeNotificacao[] = ["notify_transactions", "notify_budget"]

export function temaLigado(prefs: WorkspaceMemberNotificationPrefs, tema: TemaDeNotificacao): boolean {
    return PEDEM_TRUE.includes(tema) ? !!prefs[tema] : prefs[tema] !== false
}

export function resumoDosCanais(prefs: WorkspaceMemberNotificationPrefs): string {
    const ligados = [
        prefs.notify_push && "push",
        prefs.notify_email && "email",
        prefs.notify_in_app && "app",
    ].filter((c): c is string => !!c)
    if (ligados.length === 0) return "Nenhum canal"
    const texto = new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(ligados)
    return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function resumoDosTemas(prefs: WorkspaceMemberNotificationPrefs): string {
    const ligados = TEMAS_DE_NOTIFICACAO.filter((t) => temaLigado(prefs, t)).length
    return ligados === 0 ? "Nenhum tema" : `${ligados} de ${TEMAS_DE_NOTIFICACAO.length} temas`
}

export function semCanal(prefs: WorkspaceMemberNotificationPrefs): boolean {
    return !prefs.notify_email && !prefs.notify_in_app && !prefs.notify_push
}
