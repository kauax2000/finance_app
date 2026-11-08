"use client"

import { FieldRow } from "@/components/ui/field"
import { FormControl, FormField, FormSwitch } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { MapeamentoColunas } from "./use-importar-extrato"

const NENHUMA = "nenhuma"

type Papel = "data" | "descricao" | "valor" | "categoria"

// Dois campos por linha, a forma do `FieldRow`.
const PAPEIS: { papel: Papel; rotulo: string }[][] = [
    [
        { papel: "data", rotulo: "Data" },
        { papel: "descricao", rotulo: "Descrição" },
    ],
    [
        { papel: "valor", rotulo: "Valor" },
        { papel: "categoria", rotulo: "Categoria" },
    ],
]

/**
 * Um `Select` por papel do CSV, com o valor da primeira linha de dados embaixo.
 * As regras do `mapeamento-csv.tsx` continuam: a categoria é opcional, a 1ª
 * linha pode ser cabeçalho, e o sinal do valor segue o destino por padrão.
 */
export function MapearColunas({
    linhas,
    valor,
    onChange,
    disabled = false,
}: {
    linhas: string[][]
    valor: MapeamentoColunas
    onChange: (m: MapeamentoColunas) => void
    disabled?: boolean
}) {
    const largura = Math.max(0, ...linhas.slice(0, 5).map((l) => l.length))
    const cabecalho = valor.temCabecalho ? linhas[0] : undefined
    const primeira = linhas[valor.temCabecalho ? 1 : 0] ?? []
    const nomeDa = (i: number) => cabecalho?.[i]?.trim() || `Coluna ${i + 1}`

    return (
        <div className="flex flex-col gap-4">
            {PAPEIS.map((par) => (
                <FieldRow key={par[0].papel}>
                    {par.map(({ papel, rotulo }) => {
                        const coluna = valor[papel]
                        const exemplo = coluna == null ? "" : (primeira[coluna] ?? "").trim()
                        return (
                            <FormField
                                key={papel}
                                label={rotulo}
                                optional={papel === "categoria"}
                                description={`Primeira linha: ${exemplo || "vazia"}`}
                            >
                                <Select
                                    value={coluna == null ? NENHUMA : String(coluna)}
                                    disabled={disabled}
                                    onValueChange={(v) =>
                                        onChange({ ...valor, [papel]: v === NENHUMA ? null : Number(v) })
                                    }
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Array.from({ length: largura }, (_, i) => (
                                            <SelectItem key={i} value={String(i)}>
                                                {nomeDa(i)}
                                            </SelectItem>
                                        ))}
                                        {papel === "categoria" ? (
                                            <SelectItem value={NENHUMA} variant="none">
                                                O arquivo não traz
                                            </SelectItem>
                                        ) : null}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        )
                    })}
                </FieldRow>
            ))}
            <FormSwitch
                label="1ª linha é cabeçalho"
                checked={valor.temCabecalho}
                disabled={disabled}
                onCheckedChange={(temCabecalho) => onChange({ ...valor, temCabecalho })}
            />
            <FormSwitch
                label="Valor negativo é despesa"
                checked={valor.negativoEhDespesa}
                disabled={disabled}
                onCheckedChange={(negativoEhDespesa) => onChange({ ...valor, negativoEhDespesa })}
            />
        </div>
    )
}
