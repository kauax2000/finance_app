"use client"

import { cn } from "@/lib/utils"
import { ESCADA } from "./movimento"
import { Card } from "@/components/ui/card"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { FormSwitch } from "@/components/ui/form"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { lerValorBr } from "@/lib/import/normalizar"

import type { MapeamentoColunas } from "./use-importar-extrato"

type Papel = "data" | "descricao" | "valor" | "categoria"
const IGNORAR = "ignorar"

const PAPEIS: { papel: Papel; rotulo: string }[] = [
    { papel: "data", rotulo: "Data" },
    { papel: "descricao", rotulo: "Descrição" },
    { papel: "valor", rotulo: "Valor" },
    { papel: "categoria", rotulo: "Categoria" },
]

/** A cor do valor conforme o sinal e o que o negativo significa neste arquivo. */
function tomDoValor(texto: string, negativoEhDespesa: boolean): "expense" | "income" | null {
    const n = lerValorBr(texto)
    if (n === null || n === 0) return null
    return (n < 0) === negativoEhDespesa ? "expense" : "income"
}

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
    // A prévia mostra sempre as 6 primeiras linhas do arquivo: ligar o cabeçalho só muda o papel da 1ª, a tabela não encolhe.
    const dados = linhas.slice(valor.temCabecalho ? 1 : 0, 6)
    const colunas = Array.from({ length: largura }, (_, i) => i)
    const nomeDa = (i: number) => cabecalho?.[i]?.trim() || `Coluna ${i + 1}`

    return (
        <div key="colunas" className={cn(ESCADA, "flex flex-col gap-6")}>
            <Table size="md" variant="outline" className="[--table-head-h:--spacing(12)]">
                <TableHeader>
                    <TableRow>
                        {colunas.map((i) => (
                            <TableHead key={i} className={i === valor.valor ? "text-right" : undefined}>
                                <Select
                                    value={papelDa(valor, i)}
                                    disabled={disabled}
                                    onValueChange={(v) => onChange(comPapel(valor, i, v as Papel | typeof IGNORAR))}
                                >
                                    <SelectTrigger className="w-full" aria-label={`Papel da coluna ${nomeDa(i)}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* A ausência abre a lista: o `variant="none"` traz o fio embaixo dele. */}
                                        <SelectItem value={IGNORAR} variant="none">
                                            Ignorar
                                        </SelectItem>
                                        {PAPEIS.map(({ papel, rotulo }) => (
                                            <SelectItem key={papel} value={papel}>
                                                {rotulo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cabecalho ? (
                        <TableRow className="bg-muted/50">
                            {colunas.map((i) => (
                                <TableCell key={i} className={cn("font-medium", i === valor.valor && "nums text-right")}>
                                    {nomeDa(i)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ) : null}
                    {dados.map((linha, r) => (
                        <TableRow key={r}>
                            {colunas.map((i) => {
                                const texto = (linha[i] ?? "").trim()
                                const tom = i === valor.valor ? tomDoValor(texto, valor.negativoEhDespesa) : null
                                return (
                                    <TableCell
                                        key={i}
                                        className={cn(
                                            "max-w-48 truncate",
                                            i === valor.valor && "nums text-right",
                                            tom === "expense" ? "text-expense" : tom === "income" ? "text-income" : "text-muted-foreground",
                                        )}
                                    >
                                        {texto}
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <AjustesDaLeitura valor={valor} onChange={onChange} disabled={disabled} />
        </div>
    )
}

type PropsDaLeitura = {
    valor: MapeamentoColunas
    onChange: (m: MapeamentoColunas) => void
    disabled?: boolean
}

/** O cabeçalho e o sinal: as duas perguntas que valem para o arquivo inteiro. */
function AjustesDaLeitura({ valor, onChange, disabled = false }: PropsDaLeitura) {
    return (
        <Card variant="muted" padding="none">
            <ItemGroup variant="divided">
                <Item>
                    <ItemContent>
                        <FormSwitch
                            label="1ª linha é cabeçalho"
                            checked={valor.temCabecalho}
                            disabled={disabled}
                            onCheckedChange={(temCabecalho) => onChange({ ...valor, temCabecalho })}
                        />
                    </ItemContent>
                </Item>
                <Item>
                    <ItemContent>
                        <ItemTitle>Valor negativo é</ItemTitle>
                    </ItemContent>
                    <Tabs
                        value={valor.negativoEhDespesa ? "gasto" : "entrada"}
                        onValueChange={(v) => onChange({ ...valor, negativoEhDespesa: v === "gasto" })}
                    >
                        <TabsList aria-label="Valor negativo é">
                            <TabsTrigger value="gasto" disabled={disabled}>
                                Gasto
                            </TabsTrigger>
                            <TabsTrigger value="entrada" disabled={disabled}>
                                Entrada
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </Item>
            </ItemGroup>
        </Card>
    )
}

/**
 * No telefone (dono, 16/11/2026): uma linha por coluna do arquivo, com o nome,
 * dois exemplos e o papel, em vez da tabela larga que rolava para o lado.
 */
export function MapearColunasEmLista({ linhas, valor, onChange, disabled = false }: PropsDaLeitura & { linhas: string[][] }) {
    const largura = Math.max(0, ...linhas.slice(0, 6).map((l) => l.length))
    const cabecalho = valor.temCabecalho ? linhas[0] : undefined
    const dados = linhas.slice(valor.temCabecalho ? 1 : 0, 6)
    const nomeDa = (i: number) => cabecalho?.[i]?.trim() || `Coluna ${i + 1}`

    return (
        <div key="colunas" className={cn(ESCADA, "flex flex-col gap-4")}>
            {/* A frase que era a descrição do cabeçalho é o título da seção (dono, 17/11/2026), como os grupos de Configurações. */}
            <PageSection size="sm">
                <PageSectionHeader>
                    <PageSectionTitle>Diga o que é cada coluna do arquivo.</PageSectionTitle>
                </PageSectionHeader>
                <Card variant="muted" padding="none">
                    <ItemGroup variant="divided">
                        {Array.from({ length: largura }, (_, i) => (
                            <Item key={i}>
                                <ItemContent className="min-w-0">
                                    <ItemTitle>{nomeDa(i)}</ItemTitle>
                                    <ItemDescription className="truncate">
                                        {dados
                                            .slice(0, 2)
                                            .map((l) => (l[i] ?? "").trim())
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <Select
                                        value={papelDa(valor, i)}
                                        disabled={disabled}
                                        onValueChange={(v) => onChange(comPapel(valor, i, v as Papel | typeof IGNORAR))}
                                    >
                                        <SelectTrigger className="w-32" aria-label={`Papel da coluna ${nomeDa(i)}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={IGNORAR} variant="none">
                                                Ignorar
                                            </SelectItem>
                                            {PAPEIS.map(({ papel, rotulo }) => (
                                                <SelectItem key={papel} value={papel}>
                                                    {rotulo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </ItemActions>
                            </Item>
                        ))}
                    </ItemGroup>
                </Card>
            </PageSection>
            <AjustesDaLeitura valor={valor} onChange={onChange} disabled={disabled} />
        </div>
    )
}
