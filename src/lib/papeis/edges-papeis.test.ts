import { readdirSync, existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(`supabase/functions/${caminho}`))

// As Edges que avisam a carteira: cada uma tira o convidado pelo helper.
const AVISOS = [
    "_shared/process-transaction-notification.ts",
    "evaluate-budgets/index.ts",
    "credit-card-calendar-alerts/index.ts",
    "evaluate-credit-card-alerts/index.ts",
    "evaluate-bills-reminders/index.ts",
    "insights-daily/index.ts",
]

// Leem `workspace_members` e avisam, mas não a casa: cada uma diz por quê.
const FORA_DO_HELPER: Record<string, string> = {
    // Lembra cada pessoa dos próprios itens a conferir; o convidado lança e confere os dele.
    "review-reminder": "a pessoa recebe só os itens dela",
}

describe("Edges: avisos só aos adultos", () => {
    it.each(AVISOS)("%s lê o papel e filtra por adultosDaCarteira", (caminho) => {
        const f = fonte(caminho)
        expect(f).toContain("adultosDaCarteira(")
        expect(f).toMatch(/from '\.{1,2}\/(_shared\/)?destinatarios\.ts'/)
        expect(f).toMatch(/\.from\('workspace_members'\)\s*\.select\('user_id, ?role'\)/)
    })

    it("o lançamento exclui só o autor: a despesa do convidado avisa os adultos", () => {
        const f = fonte("_shared/process-transaction-notification.ts")
        expect(f).toContain("adultosDaCarteira(members")
        expect(f).toContain("tx.user_id)")
        expect(f).not.toContain(".neq('user_id', tx.user_id)")
    })

    it("toda Edge que lê workspace_members e chama deliverNotification usa o helper", () => {
        const dir = "supabase/functions"
        const nomes = readdirSync(dir).filter((n) => existsSync(`${dir}/${n}/index.ts`))
        const avisam = nomes.filter((n) => {
            const f = fonte(`${n}/index.ts`)
            return f.includes("deliverNotification(") && f.includes("workspace_members")
        })
        expect(avisam.length).toBeGreaterThan(0)
        for (const n of avisam) {
            if (n in FORA_DO_HELPER) continue
            expect(fonte(`${n}/index.ts`), n).toContain("adultosDaCarteira(")
        }
    })
})

describe("Edges chamadas pelo convidado não respondem dado da casa", () => {
    it.each(["evaluate-budgets", "evaluate-credit-card-alerts"])("%s: avalia e avisa, e ao convidado responde só ok", (n) => {
        const f = fonte(`${n}/index.ts`)
        expect(f).toMatch(
            /\.from\('workspace_members'\)\s*\.select\('user_id, role'\)\s*\.eq\('workspace_id', workspaceId\)\s*\.eq\('user_id', userId\)/,
        )
        expect(f).toContain("ctx.convidado = membership.role === 'guest'")
        expect(f).toContain("const res = await avaliar(req, ctx)")
        expect(f).toContain("return ctx.convidado ? json(200, { ok: true }) : res")
        expect(f.match(/Deno\.serve\(/g)).toHaveLength(1)
        expect(f).toMatch(/Deno\.serve\(async \(req: Request\) => \{\s*const ctx = \{ convidado: false \}/)
    })
})

describe("Edge workspace-invites-create: o convite com papel", () => {
    const f = fonte("workspace-invites-create/index.ts")

    it("o corpo sem role é membro", () => {
        expect(f).toMatch(/body\.role \?\? 'member'/)
    })

    it("recusa convidado sem e-mail e menor sem consentimento", () => {
        expect(f).toMatch(/role === 'guest' && isLink\) return json\(400, \{ error: 'convidado_requer_email' \}\)/)
        expect(f).toMatch(/menor && body\.consentimento !== true\) return json\(400, \{ error: 'consentimento_obrigatorio' \}\)/)
    })

    it("grava role, menor e consentimento_em nos dois caminhos, sem 'member' fixo", () => {
        expect(f).not.toContain("role: 'member' as const")
        expect(f).toMatch(/role,\s*menor,\s*consentimento_em: menor \? new Date\(\)\.toISOString\(\) : null/)
    })

    it("o e-mail leva o menor", () => {
        expect(f).toMatch(/renderInviteHtml\(\{[\s\S]*?menor,[\s\S]*?\}\)/)
    })
})

describe("Edge workspace-invites-resend e o e-mail", () => {
    it("o reenvio lê o menor do convite e o repassa", () => {
        const f = fonte("workspace-invites-resend/index.ts")
        expect(f).toMatch(/\.select\('[^']*\bmenor\b[^']*'\)/)
        expect(f).toContain("menor: invite.menor === true")
    })

    it("o responsável do reenvio é quem criou o convite, não quem reenvia", () => {
        const f = fonte("workspace-invites-resend/index.ts")
        expect(f).toMatch(/\.select\('[^']*\bcreated_by\b[^']*'\)/)
        expect(f).toMatch(/\.from\('profiles'\)\s*\.select\('email'\)\s*\.eq\('id', invite\.created_by\)/)
        expect(f).toContain("inviterName: responsavel,")
        expect(f).not.toContain("inviterName: caller.email")
    })

    it("o parágrafo da LGPD só entra com menor", () => {
        const f = fonte("_shared/workspace-invite-email.ts")
        expect(f).toContain(
            "${inviter} criou este convite como responsável legal e autorizou o uso do app por você, como pede a LGPD (art. 14).",
        )
        expect(f).toMatch(/args\.menor\s*\?/)
    })
})

describe("Edge capture: o histórico do convidado", () => {
    it("lê o papel e filtra o histórico pelo dono do token quando ele é guest", () => {
        const f = fonte("capture/index.ts")
        expect(f).toMatch(/\.from\('workspace_members'\)\s*\.select\('workspace_id, ?role'\)/)
        expect(f).toMatch(/\.filter\(\(m: \{ role: string \}\) => m\.role === 'guest'\)/)
        expect(f).toContain("convidadoEm.has(w) ? q.eq('user_id', userId) : q")
    })
})
