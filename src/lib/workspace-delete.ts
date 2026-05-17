import type { WorkspaceDeleteImpact } from "@/lib/supabase"

function jsonCount(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string") {
        const p = parseInt(v, 10)
        return Number.isFinite(p) ? p : 0
    }
    return 0
}

export function parseWorkspaceDeleteImpactJson(
    raw: unknown
): WorkspaceDeleteImpact | null {
    if (!raw || typeof raw !== "object") return null
    const o = raw as Record<string, unknown>
    const n = (k: string) => jsonCount(o[k])
    return {
        transactions: n("transactions"),
        budgets: n("budgets"),
        categories: n("categories"),
        members: n("members"),
        other_members: n("other_members"),
    }
}

export function workspaceDeleteRpcErrorMessage(error: unknown): string {
    const msg = String((error as { message?: string })?.message ?? "")
    if (msg.includes("WORKSPACE_PERSONAL_IMMUTABLE")) {
        return "A carteira pessoal não pode ser excluída — ela é obrigatória para a sua conta."
    }
    if (msg.includes("WORKSPACE_NOT_OWNER")) {
        return "Só o dono da carteira pode excluí-la."
    }
    if (msg.includes("WORKSPACE_NOT_FOUND")) {
        return "Carteira não encontrada ou já foi removida."
    }
    if (msg.includes("PGRST202") || msg.includes("Could not find the function")) {
        return "Função de exclusão indisponível. No Supabase SQL Editor, execute supabase/workspaces-delete.sql e recarregue o schema da API."
    }
    if (
        msg.includes("42703") ||
        (msg.includes("workspace_id") && msg.includes("does not exist"))
    ) {
        return "O banco ainda não tem a coluna workspace_id em orçamentos ou tabelas ligadas. No Supabase SQL Editor, execute de novo o ficheiro supabase/workspaces-delete.sql (a secção inicial adiciona as colunas) ou supabase/workspaces-core-migration.sql."
    }
    return "Não foi possível concluir a exclusão. Tente novamente."
}
