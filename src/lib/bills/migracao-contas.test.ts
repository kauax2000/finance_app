import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

// O `semComentarios` corta comentário de JS; o `--` do SQL sai aqui, para as
// asserções de ausência não lerem a prosa da migração.
const sql = semComentarios(lerFonte("supabase/migrations/20261027120000_contas.sql")).replace(/--.*$/gm, "")

function funcao(nome: string): string {
    const fn = sql.match(new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`))
    expect(fn, nome).not.toBeNull()
    return fn![0]
}

const PROXIMA =
    /insert into public\.bill_instances \(workspace_id, user_id, bill_id, due_date, status, amount\)\s+values \(v_inst\.workspace_id, \(select auth\.uid\(\)\), v_inst\.bill_id, p_next_due_date, 'pending', null\)\s+on conflict do nothing;/

describe("migração contas", () => {
    it("a conta ganha valor_variavel, falso por padrão", () => {
        expect(sql).toMatch(
            /alter table public\.bills\s+add column if not exists valor_variavel boolean not null default false;/,
        )
    })

    it("media_da_conta: média das 3 últimas pagas com valor, a centavo, dentro da carteira", () => {
        const fn = funcao("media_da_conta")
        expect(fn).toMatch(/returns trigger/)
        expect(fn).toMatch(/set search_path = ''/)
        expect(fn).toMatch(/update public\.bills b\s+set amount_estimated = coalesce\(/)
        expect(fn).toMatch(/round\(avg\(u\.paid_amount\), 2\)/)
        expect(fn).toMatch(
            /where i\.bill_id = v_bill\s+and i\.workspace_id = v_ws\s+and i\.status = 'paid'\s+and i\.paid_amount is not null/,
        )
        expect(fn).toMatch(/order by i\.due_date desc\s+limit 3/)
        // Sem paga com valor, o estimado atual fica: nunca vira nulo.
        expect(fn).toMatch(/\), b\.amount_estimated\)/)
        expect(fn).toMatch(/where b\.id = v_bill\s+and b\.workspace_id = v_ws\s+and b\.valor_variavel;/)
        // A conta e a carteira vêm de `new`, ou de `old` no delete.
        expect(fn).toMatch(/v_bill uuid := coalesce\(new\.bill_id, old\.bill_id\);/)
        expect(fn).toMatch(/v_ws uuid := coalesce\(new\.workspace_id, old\.workspace_id\);/)
    })

    it("a média recalcula quando uma paga entra, sai, muda de valor ou é apagada", () => {
        expect(sql).toMatch(
            /create trigger media_da_conta after update of status, paid_amount on public\.bill_instances\s+for each row\s+when \(old\.status = 'paid' or new\.status = 'paid'\)\s+execute function public\.media_da_conta\(\);/,
        )
        expect(sql).toMatch(
            /create trigger media_da_conta_ao_apagar after delete on public\.bill_instances\s+for each row\s+when \(old\.status = 'paid'\)\s+execute function public\.media_da_conta\(\);/,
        )
    })

    it("a instância só aponta para conta da própria carteira", () => {
        expect(sql).toMatch(
            /create trigger same_ws_bill_id\s+before insert or update of bill_id, workspace_id on public\.bill_instances\s+for each row execute function public\.assert_same_workspace_ref\('bill_id', 'bills'\);/,
        )
    })

    it("pular_instancia_da_conta: atômico, só da pendente, abre a próxima sem duplicar", () => {
        const fn = funcao("pular_instancia_da_conta")
        expect(fn).toMatch(/^create or replace function public\.pular_instancia_da_conta\(p_instance_id uuid, p_next_due_date date\)\s+returns void/)
        expect(fn).toMatch(/security invoker\s+set search_path = public/)
        expect(fn).toMatch(/set status = 'skipped'\s+where id = p_instance_id\s+and status = 'pending'/)
        expect(fn).toMatch(/if not found then\s+raise exception 'BILL_INSTANCE_NOT_PENDING' using errcode = 'P0001';/)
        expect(fn).toMatch(PROXIMA)
        expect(sql).toMatch(/revoke all on function public\.pular_instancia_da_conta\(uuid, date\) from public, anon;/)
        expect(sql).toMatch(/grant execute on function public\.pular_instancia_da_conta\(uuid, date\) to authenticated, service_role;/)
    })

    it("ligar_pagamento_da_conta: confere o lançamento, marca paga com os dados dele e abre a próxima", () => {
        const fn = funcao("ligar_pagamento_da_conta")
        expect(fn).toMatch(
            /^create or replace function public\.ligar_pagamento_da_conta\(p_instance_id uuid, p_transaction_id uuid, p_next_due_date date\)\s+returns void/,
        )
        expect(fn).toMatch(/security invoker\s+set search_path = public/)
        expect(fn).toMatch(/for update/)
        expect(fn).toMatch(/v_tx\.type <> 'expense'/)
        expect(fn).toMatch(/i\.transaction_id = p_transaction_id/)
        expect(fn).toMatch(/i\.workspace_id is distinct from v_tx\.workspace_id/)
        expect(fn).toMatch(/raise exception 'TRANSACTION_ALREADY_LINKED' using errcode = 'P0001';/)
        const update = fn.match(/update public\.bill_instances\s+set status = 'paid',[\s\S]*?returning \* into v_inst;/)
        expect(update).not.toBeNull()
        for (const trecho of [
            "paid_at = v_tx.date",
            "paid_amount = v_tx.amount",
            "amount = v_tx.amount",
            "payment_method = v_tx.payment_method",
            "payment_credit_card_id = v_tx.payment_credit_card_id",
            "transaction_id = v_tx.id",
            "and status = 'pending'",
        ]) {
            expect(update![0]).toContain(trecho)
        }
        expect(fn).toMatch(/raise exception 'BILL_INSTANCE_NOT_PENDING' using errcode = 'P0001';/)
        // A ordem: confere o lançamento, marca a paga, abre a próxima.
        const ordem = [
            fn.indexOf("TRANSACTION_ALREADY_LINKED"),
            fn.indexOf("set status = 'paid'"),
            fn.indexOf("BILL_INSTANCE_NOT_PENDING"),
            fn.search(PROXIMA),
        ]
        for (const p of ordem) expect(p).toBeGreaterThan(-1)
        expect([...ordem].sort((a, b) => a - b)).toEqual(ordem)
        expect(fn).not.toMatch(/insert into public\.transactions/)
        expect(sql).toMatch(
            /revoke all on function public\.ligar_pagamento_da_conta\(uuid, uuid, date\) from public, anon;/,
        )
        expect(sql).toMatch(
            /grant execute on function public\.ligar_pagamento_da_conta\(uuid, uuid, date\) to authenticated, service_role;/,
        )
    })

    it("apagar o lançamento reabre a instância paga, antes do delete e devolvendo old", () => {
        const fn = funcao("reabrir_instancia_ao_apagar")
        expect(fn).toMatch(/returns trigger/)
        expect(fn).toMatch(/security definer\s+set search_path = ''/)
        expect(fn).toMatch(
            /update public\.bill_instances\s+set status = 'pending',\s+paid_at = null,\s+paid_amount = null,\s+amount = null,\s+transaction_id = null\s+where transaction_id = old\.id\s+and workspace_id = old\.workspace_id;/,
        )
        expect(fn).toMatch(/return old;/)
        expect(sql).toMatch(
            /create trigger reabrir_instancia_ao_apagar before delete on public\.transactions\s+for each row execute function public\.reabrir_instancia_ao_apagar\(\);/,
        )
    })

    it("mudar o valor do lançamento acompanha o paid_amount da instância paga", () => {
        const fn = funcao("acompanhar_valor_pago")
        expect(fn).toMatch(/returns trigger/)
        expect(fn).toMatch(
            /update public\.bill_instances\s+set paid_amount = new\.amount,\s+amount = new\.amount\s+where transaction_id = new\.id\s+and workspace_id = new\.workspace_id\s+and status = 'paid';/,
        )
        expect(sql).toMatch(
            /create trigger acompanhar_valor_pago after update of amount on public\.transactions\s+for each row\s+when \(new\.amount is distinct from old\.amount\)\s+execute function public\.acompanhar_valor_pago\(\);/,
        )
    })

    it("as funções de gatilho não ficam expostas como RPC", () => {
        for (const nome of ["media_da_conta", "reabrir_instancia_ao_apagar", "acompanhar_valor_pago"]) {
            expect(sql, nome).toMatch(new RegExp(`revoke all on function public\\.${nome}\\(\\) from public, anon, authenticated;`))
        }
    })

    it("pay_bill_instance fica intocado, e a migração só acrescenta", () => {
        expect(sql).not.toMatch(/pay_bill_instance/)
        expect(sql).not.toMatch(/drop column/i)
        expect(sql).not.toMatch(/alter column \w+ (set data )?type/i)
        expect(sql).not.toMatch(/drop table|drop function/i)
    })
})
