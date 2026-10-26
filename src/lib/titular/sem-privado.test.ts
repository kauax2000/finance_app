import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

/**
 * Bloco 9, Decisão 1: a carteira é pública entre adultos, e o gasto privado do
 * 7B saiu (quem quer privacidade cria outra carteira). Fica o titular do
 * cartão. Esta varredura lê o código e o SQL inteiros, comentário incluído:
 * nenhum resto do privado sobra em `src/` nem em `supabase/`. Os roteiros
 * (`.md`) são histórico, e ficam com a Tarefa 7.
 */
const RESTOS =
    /is_private|transacoes_privadas|guardar_privado|PRIVADO_NAO_PERMITIDO|PRIVADO_SEM_DETALHE|Gasto pessoal|comDetalhesPrivados|rotuloDaTransacao|podeSerPrivado|juntarDetalhesPrivados|privadaAlheia|privadaPresa|privadoDoSalvar|recusar_conta_na_privada|isPrivate|lib\/privado|PrivadoWireframe/gi

const ESTE = join("src", "lib", "titular", "sem-privado.test.ts")

function fontes(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
        const caminho = join(dir, nome)
        if (statSync(caminho).isDirectory()) return fontes(caminho)
        return /\.(tsx?|sql)$/.test(nome) && caminho !== ESTE ? [caminho] : []
    })
}

describe("a carteira é pública entre adultos: nada do gasto privado sobra (Bloco 9)", () => {
    it("nenhum arquivo de src/ ou supabase/ cita o privado", () => {
        const achados = Object.fromEntries(
            [...fontes("src"), ...fontes("supabase")]
                .map((f) => [f, [...new Set(lerFonte(f).match(RESTOS) ?? [])]] as const)
                .filter(([, x]) => x.length),
        )
        expect(achados).toEqual({})
    })

    it("a pasta do privado saiu", () => {
        expect(existsSync("src/lib/privado")).toBe(false)
    })
})
