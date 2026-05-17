export function describeWorkspaceSupabaseError(error: unknown): string | null {
    const o = error as { code?: string } | null
    if (o?.code === "PGRST205") {
        return "Este Supabase ainda não expõe as tabelas de carteiras. No SQL Editor, execute por ordem: workspaces.sql, workspaces-rls.sql, workspaces-project-appearance.sql, workspaces-delete.sql e workspaces-handle-new-user.sql (pasta supabase/). No painel: Settings → API → Reload schema, se as tabelas já existirem."
    }
    return null
}
