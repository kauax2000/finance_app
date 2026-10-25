/**
 * Os papéis da carteira (Bloco 7A, spec §12): o rótulo, quem gerencia, o
 * destino do insight de limite e a montagem do corpo do convite. Sem import de
 * valor: `edge-errors.ts` lê as mensagens daqui.
 */
import type { WorkspaceRole } from "@/lib/supabase"

const ROTULO: Record<WorkspaceRole, string> = { owner: "Dono", member: "Membro", guest: "Convidado" }

export function rotuloDoPapel(role: WorkspaceRole): string {
    return ROTULO[role] ?? "Membro"
}

/** Convites e membros: só o dono. */
export function podeGerenciarMembros(papel: WorkspaceRole | null | undefined): boolean {
    return papel === "owner"
}

/** Dono e membro; o convidado e o papel desconhecido não. */
export function ehAdulto(papel: WorkspaceRole | null | undefined): boolean {
    return papel === "owner" || papel === "member"
}

/** O "Ver limite" pelo papel de quem lê agora, nunca por um papel guardado no insight. */
export function destinoDoInsightDeLimite(papel: WorkspaceRole | null | undefined): string {
    return ehAdulto(papel) ? "/members#limites" : "/dashboard"
}

/** Os 400 da Edge `workspace-invites-create`, na frase da tela. */
export const ERRO_DO_CONVITE = {
    convidado_requer_email: "O convidado entra só por e-mail: o link de convite é sempre de membro.",
    consentimento_obrigatorio:
        "Para convidar um menor de idade, confirme que você é o responsável legal e autoriza o uso do app.",
    menor_requer_convidado: "Um menor de idade entra como convidado.",
    "role inválido": "Escolha o papel do convite: membro ou convidado.",
} as const

export type ErroDoConvite = keyof typeof ERRO_DO_CONVITE

export type CorpoDoConvite = {
    role: "member" | "guest"
    menor: boolean
    consentimento: boolean
} & ({ invited_email: string } | { invite_kind: "link" })

/**
 * O corpo do convite, com as mesmas recusas da Edge e na mesma ordem. Sem
 * e-mail é o link, e o link é sempre de membro.
 */
export function montarConvite(input: {
    role: string
    menor: boolean
    consentimento: boolean
    email: string | null
}): { ok: true; corpo: CorpoDoConvite } | { ok: false; erro: ErroDoConvite } {
    const { role, menor, consentimento } = input
    if (role !== "member" && role !== "guest") return { ok: false, erro: "role inválido" }
    const email = input.email?.trim().toLowerCase() || null
    if (role === "guest" && !email) return { ok: false, erro: "convidado_requer_email" }
    if (menor && role !== "guest") return { ok: false, erro: "menor_requer_convidado" }
    if (menor && !consentimento) return { ok: false, erro: "consentimento_obrigatorio" }
    const base = { role: role as CorpoDoConvite["role"], menor, consentimento: menor && consentimento }
    return { ok: true, corpo: email ? { ...base, invited_email: email } : { ...base, invite_kind: "link" } }
}
