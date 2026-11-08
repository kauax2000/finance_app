"use client"

import { FormRadioGroup, FormSwitch } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { MapeamentoColunas } from "./use-importar-extrato"

type Papel = "data" | "descricao" | "valor" | "categoria"
const IGNORAR = "ignorar"

const PAPEIS: { papel: Papel; rotulo: string }[] = [
    { papel: "data", rotulo: "Data" },
    { papel: "descricao", rotulo: "Descrição" },
    { papel: "valor", rotulo: "Valor" },
    { papel: "categoria", rotulo: "Categoria" },
]

/** O papel que a coluna `i` tem no mapeamento (ou nenhum). */
const papelDa = (m: MapeamentoColunas, i: number) => PAPEIS.find(({ papel }) => m[papel] === i)?.papel ?? IGNORAR

/** Dar um papel a uma coluna tira o papel de quem o tinha, e tira dela o papel antigo: cada papel, uma coluna. */
export function comPapel(m: MapeamentoColunas, coluna: number, papel: Papel | typeof IGNORAR): MapeamentoColunas {
    const novo = { ...m }
    const antigo = papelDa(m, coluna)
    if (antigo === "categoria") novo.categoria = null
    else if (antigo !== IGNORAR) novo[antigo] = -1
    if (papel !== IGNORAR) novo[papel] = coluna
    return novo
}

/**
 * A prévia do arquivo com o papel no topo de cada coluna (a versão A do
 * comparativo) e a pergunta do sinal. Aparece só quando a dedução falha, ou
 * quando a pessoa pede Ajustar na conferência.
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
    const largura = Math.max(0, ...linhas.slice(0, 6).map((l) => l.length))
    const cabecalho = valor.temCabecalho ? linhas[0] : undefined
    const dados = linhas.slice(valor.temCabecalho ? 1 : 0, (valor.temCabecalho ? 1 : 0) + 5)
    const colunas = Array.from({ length: largura }, (_, i) => i)
    const nomeDa = (i: number) => cabecalho?.[i]?.trim() || `Coluna ${i + 1}`

    return (
        <div className="flex flex-col gap-4">
            <Table size="sm" variant="outline">
                <TableHeader>
                    <TableRow>
                        {colunas.map((i) => (
                            <TableHead key={i}>
                                <Select
                                    value={papelDa(valor, i)}
                                    disabled={disabled}
                                    onValueChange={(v) => onChange(comPapel(valor, i, v as Papel | typeof IGNORAR))}
                                >
                                    <SelectTrigger size="sm" aria-label={`Papel da coluna ${nomeDa(i)}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAPEIS.map(({ papel, rotulo }) => (
                                            <SelectItem key={papel} value={papel}>
                                                {rotulo}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value={IGNORAR} variant="none">
                                            Ignorar
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cabecalho ? (
                        <TableRow>
                            {colunas.map((i) => (
                                <TableCell key={i} className="font-medium">
                                    {nomeDa(i)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ) : null}
                    {dados.map((linha, r) => (
                        <TableRow key={r}>
                            {colunas.map((i) => (
                                <TableCell key={i} className="max-w-48 truncate text-muted-foreground">
                                    {(linha[i] ?? "").trim()}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <FormSwitch
                label="1ª linha é cabeçalho"
                checked={valor.temCabecalho}
                disabled={disabled}
                onCheckedChange={(temCabecalho) => onChange({ ...valor, temCabecalho })}
            />
            <FormRadioGroup
                label="Neste arquivo, −12,34 é:"
                variant="chip"
                orientation="horizontal"
                disabled={disabled}
                value={valor.negativoEhDespesa ? "gasto" : "entrada"}
                onValueChange={(v) => onChange({ ...valor, negativoEhDespesa: v === "gasto" })}
                options={[
                    { value: "gasto", label: "um gasto" },
                    { value: "entrada", label: "uma entrada" },
                ]}
            />
        </div>
    )
}
