/**
 * O fundo do painel de notificações em avaliação no `/laboratorio/notificacoes`.
 * Cada quadro do laboratório é um iframe com `name="notificacoes:<versão>"`, e o
 * `window.name` sobrevive à navegação dentro do quadro. Fora do laboratório o
 * nome é vazio e vale a de hoje (`vidro`). Temporário: sai quando uma versão
 * vencer.
 */
export const NOTIFICATIONS_LAB_VERSIONS = ["vidro", "chapada"] as const

export type NotificationsLabVersion = (typeof NOTIFICATIONS_LAB_VERSIONS)[number]

export function notificationsLabVersion(nome: string): NotificationsLabVersion {
    const versao = nome.startsWith("notificacoes:") ? nome.slice("notificacoes:".length) : ""
    return (NOTIFICATIONS_LAB_VERSIONS as readonly string[]).includes(versao)
        ? (versao as NotificationsLabVersion)
        : "vidro"
}
