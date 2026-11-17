"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ESCADA } from "./movimento"
import { Card } from "@/components/ui/card"
import { PageSection, PageSectionDescription, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { FormSwitch } from "@/components/ui/form"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { mapearCsv } from "@/lib/import/csv"
import { lerValorBr } from "@/lib/import/normalizar"
import { numberBR } from "@/lib/formatters"
import { formatDayHeadingPtBr } from "@/lib/transaction-date"

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

/** O que cada pergunta pede, no nome acessível do seletor. */
const O_QUE: Record<Papel, string> = {
    data: "a data",
    descricao: "a descrição",
    valor: "o valor",
    categoria: "a categoria",
}

/** O sinal de menos tipográfico, o que o app escreve nos valores. */
const MENOS = "−"

/**
 * No telefone (dono, 17/11/2026): em vez de pedir o papel de cada coluna, mostra
 * os dois primeiros lançamentos como vão entrar e pergunta de onde vem cada
 * informação, com os valores do próprio arquivo como opções.
 */
export function ConferirLeitura({ linhas, valor, onChange, disabled = false }: PropsDaLeitura & { linhas: string[][] }) {
    const largura = Math.max(0, ...linhas.slice(0, 6).map((l) => l.length))
    // As opções saem da 1ª linha de dados; sem ela (arquivo de uma linha com o cabeçalho ligado), da linha 0.
    const exemplo = linhas[valor.temCabecalho ? 1 : 0] ?? linhas[0] ?? []
    const dados = valor.temCabecalho ? linhas.slice(1) : linhas
    const legivel = valor.data >= 0 && valor.descricao >= 0 && valor.valor >= 0

    const previa = React.useMemo(
        () =>
            legivel
                ? mapearCsv(
                      linhas,
                      { data: valor.data, descricao: valor.descricao, valor: valor.valor, categoria: valor.categoria ?? undefined },
                      { temCabecalho: valor.temCabecalho, negativoEhDespesa: valor.negativoEhDespesa },
                  ).itens.slice(0, 2)
                : [],
        [linhas, legivel, valor],
    )

    // O exemplo do sinal é o primeiro valor não zero da coluna do valor; sem nenhum, 10,00.
    const amostra = valor.valor >= 0 ? dados.map((l) => lerValorBr(l[valor.valor] ?? "")).find((n) => n != null && n !== 0) : undefined
    const semSinal = numberBR(Math.abs(amostra ?? 10), { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const escolher = (papel: Papel, v: string) => {
        if (v !== IGNORAR) return onChange(comPapel(valor, Number(v), papel))
        onChange(papel === "categoria" ? { ...valor, categoria: null } : { ...valor, [papel]: -1 })
    }

    return (
        <div key="leitura" className={cn(ESCADA, "flex flex-col gap-4")}>
            <PageSection size="sm">
                <PageSectionHeader>
                    <PageSectionTitle>É assim que vai entrar?</PageSectionTitle>
                </PageSectionHeader>
                <Card variant="muted" padding="none">
                    <ItemGroup variant="divided">
                        {previa.length === 0 ? (
                            <Item>
                                <ItemContent>
                                    <ItemDescription>Nenhum lançamento legível com estas escolhas.</ItemDescription>
                                </ItemContent>
                            </Item>
                        ) : (
                            previa.map((item, i) => (
                                <Item key={i}>
                                    <ItemContent className="min-w-0">
                                        <ItemTitle className="truncate">{item.descricao}</ItemTitle>
                                        <ItemDescription>
                                            {formatDayHeadingPtBr(item.data)}
                                            {item.categoria ? ` · ${item.categoria}` : null}
                                        </ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <MoneyDisplay
                                            value={item.estorno ? item.valor : -item.valor}
                                            signed
                                            tone={item.estorno ? "income" : "expense"}
                                        />
                                    </ItemActions>
                                </Item>
                            ))
                        )}
                    </ItemGroup>
                </Card>
            </PageSection>
            <PageSection size="sm">
                <PageSectionHeader>
                    <PageSectionTitle>Algo fora do lugar?</PageSectionTitle>
                    <PageSectionDescription>Escolha de onde vem cada informação.</PageSectionDescription>
                </PageSectionHeader>
                <Card variant="muted" padding="none">
                    <ItemGroup variant="divided">
                        {PAPEIS.map(({ papel, rotulo }) => {
                            const atual = papel === "categoria" ? valor.categoria : valor[papel]
                            return (
                                <Item key={papel}>
                                    <ItemContent>
                                        <ItemTitle>{rotulo}</ItemTitle>
                                    </ItemContent>
                                    <ItemActions>
                                        <Select
                                            value={atual == null || atual < 0 ? IGNORAR : String(atual)}
                                            disabled={disabled}
                                            onValueChange={(v) => escolher(papel, v)}
                                        >
                                            <SelectTrigger className="w-40" aria-label={`Qual destes é ${O_QUE[papel]}?`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={IGNORAR} variant="none">
                                                    Nenhum destes
                                                </SelectItem>
                                                {/* O `value` é o índice: duas células com o mesmo texto continuam duas opções. */}
                                                {Array.from({ length: largura }, (_, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {(exemplo[i] ?? "").trim() || "(vazio)"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </ItemActions>
                                </Item>
                            )
                        })}
                        <Item>
                            <ItemContent>
                                <ItemTitle>Gastos aparecem como</ItemTitle>
                            </ItemContent>
                            <Tabs
                                value={valor.negativoEhDespesa ? "negativo" : "positivo"}
                                onValueChange={(v) => onChange({ ...valor, negativoEhDespesa: v === "negativo" })}
                            >
                                <TabsList aria-label="Gastos aparecem como">
                                    <TabsTrigger value="negativo" disabled={disabled}>
                                        {`${MENOS}${semSinal}`}
                                    </TabsTrigger>
                                    <TabsTrigger value="positivo" disabled={disabled}>
                                        {semSinal}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </Item>
                        <Item>
                            <ItemContent>
                                <FormSwitch
                                    label="Pular a 1ª linha"
                                    description="Ela tem os títulos, não um lançamento"
                                    checked={valor.temCabecalho}
                                    disabled={disabled}
                                    onCheckedChange={(temCabecalho) => onChange({ ...valor, temCabecalho })}
                                />
                            </ItemContent>
                        </Item>
                    </ItemGroup>
                </Card>
            </PageSection>
        </div>
    )
}
