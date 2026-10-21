"use client"

import { useState } from "react"

import { mapearCsv } from "@/lib/import/csv"
import type { ItemBanco } from "@/lib/import/tipos"

const campo = "border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"
const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

type Coluna = "data" | "descricao" | "valor" | "categoria"

/**
 * As colunas de um CSV, com a prévia das 5 primeiras linhas. A fatura do cartão
 * (o padrão) tem compra positiva e não traz categoria; `extrato` abre a coluna
 * da categoria e o "valor negativo é despesa" (a conta e a planilha).
 */
export function MapeamentoCsv({
    linhas,
    extrato = false,
    disabled = false,
    onLer,
}: {
    linhas: string[][]
    extrato?: boolean
    disabled?: boolean
    onLer: (r: { itens: ItemBanco[]; ignoradas: number }) => void
}) {
    const [mapa, setMapa] = useState<Record<Coluna, string>>({ data: "0", descricao: "1", valor: "2", categoria: "" })
    const [temCabecalho, setTemCabecalho] = useState(true)
    const [negativoEhDespesa, setNegativoEhDespesa] = useState(true)
    const largura = Math.max(0, ...linhas.slice(0, 5).map((l) => l.length))

    function ler() {
        onLer(
            mapearCsv(
                linhas,
                {
                    data: Number(mapa.data),
                    descricao: Number(mapa.descricao),
                    valor: Number(mapa.valor),
                    categoria: extrato && mapa.categoria !== "" ? Number(mapa.categoria) : undefined,
                },
                { temCabecalho, negativoEhDespesa: extrato && negativoEhDespesa },
            ),
        )
    }

    const coluna = (nome: Coluna, rotulo: string) => (
        <label className="flex items-center gap-1">
            {rotulo}
            <input
                type="number"
                min={0}
                className={`${campo} w-16`}
                placeholder={nome === "categoria" ? "—" : undefined}
                value={mapa[nome]}
                onChange={(e) => setMapa((m) => ({ ...m, [nome]: e.target.value }))}
            />
        </label>
    )

    return (
        <div className="space-y-2">
            <div className="overflow-x-auto">
                <table className="border-collapse text-left">
                    <caption className="text-left">Prévia (5 primeiras linhas)</caption>
                    <thead>
                        <tr>
                            {Array.from({ length: largura }, (_, i) => (
                                <th key={i} className="border border-dashed border-muted-foreground/60 px-1">
                                    [{i}]
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.slice(0, 5).map((l, n) => (
                            <tr key={n}>
                                {Array.from({ length: largura }, (_, i) => (
                                    <td key={i} className="border border-dashed border-muted-foreground/60 px-1">
                                        {l[i] ?? ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {coluna("data", "Data na coluna")}
                {coluna("descricao", "Descrição na coluna")}
                {coluna("valor", "Valor na coluna")}
                {extrato ? coluna("categoria", "Categoria na coluna (opcional)") : null}
                <label className="flex items-center gap-1">
                    <input type="checkbox" checked={temCabecalho} onChange={(e) => setTemCabecalho(e.target.checked)} />
                    1ª linha é cabeçalho
                </label>
                {extrato ? (
                    <label className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={negativoEhDespesa}
                            onChange={(e) => setNegativoEhDespesa(e.target.checked)}
                        />
                        Valor negativo é despesa
                    </label>
                ) : null}
                <button type="button" className={botao} disabled={disabled} onClick={ler}>
                    Ler colunas
                </button>
            </div>
        </div>
    )
}
