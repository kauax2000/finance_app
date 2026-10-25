import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * Ruling 8 do 7B: o front 2.0 roda contra um banco sem a migração do bloco
 * (o dev usa produção). Uma coluna que ainda não existe num `select` de
 * colunas explícitas, num filtro ou numa tabela nova derruba a consulta
 * (`42703`/`PGRST204`/`PGRST205`): ela só entra por `*`, ou pelos leitores
 * tolerantes abaixo, que só consultam quando já há uma privada na mão. As
 * colunas do 7C (projeto, propósito e modo da carteira, quem pagou e as
 * partes) seguem a mesma regra. As tabelas e as RPCs novas do 7C só entram em
 * arquivo que trata a ausência delas (`PGRST205` da tabela, `PGRST202` da RPC).
 */
const COLUNAS = "is_private|holder_user_id|project_id|purpose|starts_on|ends_on|budget_total|split_mode|paid_by|shares_manual|split_since|split_weights"
const NOVAS = new RegExp(`\\b(${COLUNAS})\\b`)
const TABELAS_NOVAS = /\.from\(\s*["'`](projects|transaction_shares|settlements|workspace_split_weights)["'`]/g
const RPCS_NOVAS = /\.rpc\(\s*["'`](criar_carteira_de_modelo|definir_partes|saldos_da_carteira)["'`]/g
const TOLERANTES = new Set(["src/lib/privado/detalhes.ts", "src/lib/cofre/exportar.ts"])

function fontes(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) return fontes(caminho)
        return /\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : []
    })
}

const arquivos = fontes("src").filter((f) => f !== join("src", "types", "database.ts"))

function achadosDe(arquivo: string): string[] {
    const texto = semComentarios(lerFonte(arquivo))
    const achados: string[] = []
    // Uma lista de colunas (string com vírgula) que cita a coluna nova.
    for (const m of texto.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
        if (NOVAS.test(m[0]) && m[0].includes(",")) achados.push(m[0])
    }
    // Um filtro ou um select de uma coluna só.
    for (const m of texto.matchAll(new RegExp(`\\.(select|eq|neq|is|in|not|or|order|filter|match)\\(\\s*["'\`](${COLUNAS})\\b`, "g"))) {
        achados.push(m[0])
    }
    if (!texto.includes("PGRST205")) {
        for (const m of texto.matchAll(TABELAS_NOVAS)) achados.push(m[0])
    }
    if (!texto.includes("PGRST202")) {
        for (const m of texto.matchAll(RPCS_NOVAS)) achados.push(m[0])
    }
    if (!TOLERANTES.has(arquivo)) {
        for (const m of texto.matchAll(/\.from\(\s*["'`]transacoes_privadas/g)) achados.push(m[0])
    }
    return achados
}

describe("Ruling 8: as colunas, as tabelas e as RPCs do 7B e do 7C não entram sem tolerância", () => {
    it("nenhum arquivo cita as colunas do 7B e do 7C numa consulta explícita", () => {
        const ofensores = Object.fromEntries(
            arquivos.map((a) => [a, achadosDe(a)] as const).filter(([, x]) => x.length),
        )
        expect(ofensores).toEqual({})
    })

    it("os tolerantes só leem transacoes_privadas depois de achar uma privada", () => {
        for (const arquivo of TOLERANTES) {
            const texto = semComentarios(lerFonte(arquivo))
            expect(texto, arquivo).toMatch(/if \(!(linhas|ids)\.(some\(\(\w\) => \w\.is_private\)|length)\) return/)
        }
    })
})
