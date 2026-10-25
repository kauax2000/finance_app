/**
 * O estado final do banco lido das migrações, em ordem, para os testes que
 * trancam RLS e funções pelo fonte (o pgTAP não roda aqui nem na CI). O `--`
 * do SQL sai antes, para a prosa das migrações não contar.
 */
import { readdirSync } from "node:fs"
import { resolve } from "node:path"
import { lerFonte } from "./fonte"

const MIGRACOES = readdirSync(resolve(process.cwd(), "supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((arquivo) => ({ arquivo, texto: lerFonte(`supabase/migrations/${arquivo}`).replace(/--.*$/gm, "") }))

/**
 * A última definição de cada função de `public`: quem vale no banco é o último
 * `create or replace`. O corpo vai até a mesma etiqueta de dólar que o abriu
 * (`$$`, `$function$`).
 */
export function ultimasFuncoes(): Map<string, { arquivo: string; texto: string }> {
    const ultima = new Map<string, { arquivo: string; texto: string }>()
    for (const { arquivo, texto } of MIGRACOES) {
        const re = /create\s+(?:or\s+replace\s+)?function\s+"?public"?\."?(\w+)"?\s*\([\s\S]*?\bas\s+(\$\w*\$)[\s\S]*?\2/gi
        for (const m of texto.matchAll(re)) ultima.set(m[1], { arquivo, texto: m[0] })
    }
    return ultima
}

/**
 * As políticas como o `pg_policies` depois de todas as migrações: `create
 * policy` põe, `drop policy` tira. O texto fica sem aspas, em minúsculas e com
 * um espaço só, para o `"public"."is_workspace_member"` do baseline ler como o
 * das migrações seguintes. A chave é `tabela|nome`.
 */
export type Politica = { tabela: string; nome: string; comando: string; texto: string; arquivo: string }

export function politicasFinais(): Map<string, Politica> {
    const politicas = new Map<string, Politica>()
    for (const { arquivo, texto } of MIGRACOES) {
        const re = /\b(create|drop)\s+policy\s+(?:if\s+exists\s+)?("[^"]+"|\w+)\s+on\s+((?:"?\w+"?\.)?"?\w+"?)([^;]*);/gi
        for (const m of texto.matchAll(re)) {
            const nome = m[2].replace(/"/g, "")
            const crua = m[3].replace(/"/g, "").toLowerCase()
            const tabela = crua.includes(".") ? crua : `public.${crua}`
            const chave = `${tabela}|${nome}`
            if (m[1].toLowerCase() === "drop") {
                politicas.delete(chave)
                continue
            }
            const corpo = m[4].replace(/"/g, "").toLowerCase().replace(/\s+/g, " ")
            const comando = corpo.match(/\bfor (select|insert|update|delete|all)\b/)?.[1] ?? "all"
            politicas.set(chave, { tabela, nome, comando, texto: corpo, arquivo })
        }
    }
    return politicas
}
