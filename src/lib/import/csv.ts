import { lerData, lerValorBr, normalizarDescricao } from "./normalizar"
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

export type Deducao = {
    mapa: { data: number; descricao: number; valor: number; categoria: number | null }
    temCabecalho: boolean
    negativoEhDespesa: boolean
    /** false quando data ou valor não foram achados: o passo Colunas aparece. */
    certa: boolean
}

const NOMES = {
    data: /^(data|date|dt)\b|\bdata\b/,
    valor: /\b(valor|amount|value|quantia|montante)\b/,
    descricao: /descri|historico|lancamento|title|titulo|memo|estabelecimento|detalhe|name|nome/,
    categoria: /categor/,
}

/**
 * Deduz colunas, cabeçalho e sinal do CSV: pelos nomes do cabeçalho e, onde eles
 * não bastam, pelo conteúdo das colunas. Sem sinal claro no arquivo, vale o
 * padrão do destino (conta: negativo é despesa; cartão: positivo é despesa).
 */
export function deduzirMapeamento(linhas: string[][], destino: "cartao" | "conta"): Deducao {
    const primeira = linhas[0] ?? []
    const temCabecalho =
        primeira.length > 0 && !primeira.some((c) => lerData(c) != null || lerValorBr(c) != null)
    const corpo = temCabecalho ? linhas.slice(1) : linhas
    const colunas = Math.max(0, ...linhas.map((l) => l.length))
    const achada = (campo: keyof typeof NOMES, fora: number[] = []) => {
        if (!temCabecalho) return -1
        return primeira.findIndex((c, i) => !fora.includes(i) && NOMES[campo].test(normalizarDescricao(c)))
    }
    const preenchidas = (i: number) => corpo.filter((l) => (l[i] ?? "").trim() !== "").length
    // Fração das células preenchidas da coluna que o `le` entende.
    const fracao = (i: number, le: (s: string) => unknown) => {
        const cel = corpo.map((l) => (l[i] ?? "").trim()).filter(Boolean)
        return cel.length ? cel.filter((c) => le(c) != null).length / cel.length : 0
    }
    // Empate fica com a coluna mais à esquerda (o valor vem antes de saldo e id).
    const melhor = (livres: number[], le: (s: string) => unknown, piso: number) => {
        let alvo = -1
        let max = 0
        for (const i of livres) {
            const f = fracao(i, le)
            if (f >= piso && f > max) {
                alvo = i
                max = f
            }
        }
        return alvo
    }
    const todas = Array.from({ length: colunas }, (_, i) => i)
    let data = achada("data")
    // Sem nome, a data exige 80% das células preenchidas da coluna (a spec).
    if (data < 0) data = melhor(todas, (s) => lerData(s), 0.8)
    let valor = achada("valor")
    // Débito/Crédito/Saldo no lugar de Valor: deduzir por conteúdo descartaria débitos em silêncio.
    const dividido = temCabecalho && valor < 0 && primeira.some((c) => /\b(debito|credito|saldo)\b/.test(normalizarDescricao(c)))
    let porConteudo = false
    if (dividido) valor = -1
    else if (valor < 0 || valor === data) {
        valor = melhor(todas.filter((i) => i !== data), lerValorBr, 0.6)
        porConteudo = true
    }
    // Valor achado por conteúdo precisa estar preenchido quase tanto quanto a data.
    const valorRalo = porConteudo && valor >= 0 && data >= 0 && preenchidas(valor) < 0.8 * preenchidas(data)
    const categoria = achada("categoria")
    let descricao = achada("descricao", [categoria])
    if (descricao < 0 || descricao === data || descricao === valor) {
        descricao =
            todas.find(
                (i) =>
                    i !== data && i !== valor && i !== categoria && preenchidas(i) > 0 &&
                    fracao(i, lerValorBr) < 0.6 && fracao(i, (s) => lerData(s)) < 0.6,
            ) ?? -1
    }

    const valores = valor < 0 ? [] : corpo.map((l) => lerValorBr(l[valor] ?? "")).filter((v): v is number => v != null && v !== 0)
    const pos = valores.filter((v) => v > 0).length
    const neg = valores.length - pos
    const padrao = destino === "conta"
    let negativoEhDespesa = padrao
    // Poucos valores não bastam para contradizer o padrão do destino.
    if (valores.length >= 5) {
        // Maioria esmagadora de um sinal só: o arquivo diz de que lado está a despesa.
        if (padrao && pos / valores.length > 0.8) negativoEhDespesa = false
        else if (!padrao && neg / valores.length > 0.8) negativoEhDespesa = true
    }
    const papeis = [data, descricao, valor, ...(categoria >= 0 ? [categoria] : [])]

    return {
        mapa: { data, descricao, valor, categoria: categoria < 0 ? null : categoria },
        temCabecalho,
        negativoEhDespesa,
        certa: !valorRalo && papeis.every((i) => i >= 0) && new Set(papeis).size === papeis.length,
    }
}
