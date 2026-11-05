import { beforeEach, describe, expect, it, vi } from "vitest"

const invokeEdgeJson = vi.fn()
vi.mock("@/lib/edge-invoke", () => ({
    invokeEdgeJson: (...args: unknown[]) => invokeEdgeJson(...args),
}))

import { fetchInviteLinks } from "@/lib/queries/fetch-invite-links"

describe("fetchInviteLinks", () => {
    beforeEach(() => invokeEdgeJson.mockReset())

    it("pede os links com action get", async () => {
        invokeEdgeJson.mockResolvedValue({ ok: true, links: { member: null, guest: null } })
        await fetchInviteLinks("w1")
        expect(invokeEdgeJson).toHaveBeenCalledWith("workspace-invites-create", {
            body: { workspace_id: "w1", invite_kind: "link", action: "get" },
        })
    })

    it("devolve os links como vieram", async () => {
        const member = { invite_id: "i1", expires_at: "2026-12-01", invite_url: "https://x/i1" }
        invokeEdgeJson.mockResolvedValue({ ok: true, links: { member, guest: null } })
        await expect(fetchInviteLinks("w1")).resolves.toEqual({ member, guest: null })
    })

    it("resposta sem links vira os dois nulos", async () => {
        invokeEdgeJson.mockResolvedValue({ ok: true })
        await expect(fetchInviteLinks("w1")).resolves.toEqual({ member: null, guest: null })
    })
})
