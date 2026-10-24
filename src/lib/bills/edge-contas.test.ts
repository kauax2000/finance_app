import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const f = semComentarios(lerFonte("supabase/functions/evaluate-bills-reminders/index.ts"))

describe("Edge evaluate-bills-reminders", () => {
    it("o passo 0 gera as pendências que faltam antes do laço de lembretes", () => {
        const passo0 = f.indexOf("vencimentosQueFaltam(")
        expect(passo0).toBeGreaterThan(-1)
        expect(f.indexOf(".from('bill_instances')")).toBeGreaterThan(passo0)
        expect(f.indexOf(".eq('status', 'pending')")).toBeGreaterThan(passo0)
        expect(f).toContain("onConflict: 'bill_id,due_date', ignoreDuplicates: true")
        expect(f).toContain(".neq('frequency', 'one_time')")
        expect(f).toContain(".eq('is_active', true)")
        expect(f).toContain("user_id: conta.user_id")
        expect(f).toContain("workspace_id: conta.workspace_id")
        expect(f).toContain("geradas")
    })

    it("o lembrete é por janela, não pelo dia exato", () => {
        expect(f).toContain("offsetDaJanela(")
        expect(f).not.toContain("o === daysUntil")
    })

    it("a instância depois do end_date não avisa", () => {
        expect(f).toMatch(/billMini\.end_date && dueStr > billMini\.end_date\.slice\(0, 10\)\) continue/)
    })

    it("o releaseDedupe filtra também pelo sent_on", () => {
        const rel = f.slice(f.indexOf("async function releaseDedupe"), f.indexOf("type ReminderEvent"))
        expect(rel).toContain(".eq('sent_on', row.sent_on)")
    })
})
