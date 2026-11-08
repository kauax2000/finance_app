import type { Project } from "@/lib/supabase"

/** As opções do seletor: os ativos, mais o escolhido se ele foi arquivado depois. */
export function opcoesDoProjeto(lista: Project[], valor: string): Project[] {
    return lista.filter((p) => !p.archived_at || p.id === valor)
}
