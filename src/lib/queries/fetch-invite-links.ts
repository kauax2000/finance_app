import { invokeEdgeJson } from "@/lib/edge-invoke"

export type LinkAtivo = { invite_id: string; expires_at: string; invite_url: string | null }
export type LinksDeConvite = { member: LinkAtivo | null; guest: LinkAtivo | null }

/** Os links valem por 5 min no cache: o diálogo abre sem esperar a Edge. */
export const INVITE_LINKS_STALE_MS = 5 * 60_000

/** Um link ativo por papel (membro e convidado), como a Edge os guarda. */
export async function fetchInviteLinks(workspaceId: string): Promise<LinksDeConvite> {
    const res = await invokeEdgeJson<{
        links?: LinksDeConvite
        invite_id?: string
        role?: "member" | "guest"
        expires_at?: string
        invite_url?: string | null
    }>("workspace-invites-create", {
        body: { workspace_id: workspaceId, invite_kind: "link", action: "get" },
    })
    if (res.links) return res.links
    // A Edge de antes (um link só, no topo da resposta): sem isto, o link gerado
    // sumia ao reler, enquanto a Edge nova não está publicada.
    const vazio: LinksDeConvite = { member: null, guest: null }
    if (!res.invite_id || !res.expires_at) return vazio
    const papel = res.role === "guest" ? "guest" : "member"
    return { ...vazio, [papel]: { invite_id: res.invite_id, expires_at: res.expires_at, invite_url: res.invite_url ?? null } }
}
