import { lerData, lerValorBr } from "./normalizar"
import type { ItemBanco } from "./tipos"

/**
 * CSV com aspas RFC 4180 e `\r\n`. O delimitador é `;` ou `,`, o que mais
 * aparecer fora de aspas na 1ª linha (empate fica com `;`, o do Excel em pt-BR).
 */
export function lerCsv(texto: string): string[][] {
    const t = texto.replace(/^﻿/, "")
    const delim = delimitador(t)
    const linhas: string[][] = []
    let linha: string[] = []
    let campo = ""
    let aspas = false
    for (let i = 0; i < t.length; i++) {
        const c = t[i]
        if (aspas) {
            if (c !== '"') campo += c
            else if (t[i + 1] === '"') {
                campo += '"'
                i++
            } else aspas = false
        } else if (c === '"') aspas = true
        else if (c === delim) {
            linha.push(campo)
            campo = ""
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && t[i + 1] === "\n") i++
            linha.push(campo)
            linhas.push(linha)
            linha = []
            campo = ""
        } else campo += c
    }
    if (campo || linha.length) {
        linha.push(campo)
        linhas.push(linha)
    }
    return linhas.filter((l) => l.some((c) => c.trim() !== ""))
}

function delimitador(t: string): ";" | "," {
    let pv = 0
    let vg = 0
    let aspas = false
    for (const c of t) {
        if (c === '"') aspas = !aspas
        else if (!aspas && (c === "\n" || c === "\r")) break
        else if (!aspas && c === ";") pv++
        else if (!aspas && c === ",") vg++
    }
    return vg > pv ? "," : ";"
}

/**
 * Linhas do CSV em itens. A linha sem data ou valor legível é pulada e contada
 * em `ignoradas`. `negativoEhDespesa`: extrato de conta (saída é negativa);
 * sem ele, a planilha de fatura (compra positiva, crédito negativo).
 */
export function mapearCsv(
    linhas: string[][],
    mapa: { data: number; descricao: number; valor: number; categoria?: number },
    opcoes: { temCabecalho: boolean; negativoEhDespesa: boolean },
): { itens: ItemBanco[]; ignoradas: number } {
    const itens: ItemBanco[] = []
    let ignoradas = 0
    for (const linha of opcoes.temCabecalho ? linhas.slice(1) : linhas) {
        const data = lerData(linha[mapa.data] ?? "")
        const valor = lerValorBr(linha[mapa.valor] ?? "")
        if (!data || valor == null || valor === 0) {
            ignoradas++
            continue
        }
        const item: ItemBanco = {
            data,
            descricao: (linha[mapa.descricao] ?? "").trim(),
            valor: Math.abs(valor),
            estorno: opcoes.negativoEhDespesa ? valor > 0 : valor < 0,
            parcela: null,
        }
        const categoria = mapa.categoria == null ? "" : (linha[mapa.categoria] ?? "").trim()
        if (categoria) item.categoria = categoria
        itens.push(item)
    }
    return { itens, ignoradas }
}
