import { invokeEdgeJson } from "@/lib/edge-invoke"

export type LinkAtivo = { invite_id: string; expires_at: string; invite_url: string | null }
export type LinksDeConvite = { member: LinkAtivo | null; guest: LinkAtivo | null }

/** Os links valem por 5 min no cache: o diálogo abre sem esperar a Edge. */
export const INVITE_LINKS_STALE_MS = 5 * 60_000

/** Um link ativo por papel (membro e convidado), como a Edge os guarda. */
export async function fetchInviteLinks(workspaceId: string): Promise<LinksDeConvite> {
    const res = await invokeEdgeJson<{ links?: LinksDeConvite }>("workspace-invites-create", {
        body: { workspace_id: workspaceId, invite_kind: "link", action: "get" },
    })
    return res.links ?? { member: null, guest: null }
}
