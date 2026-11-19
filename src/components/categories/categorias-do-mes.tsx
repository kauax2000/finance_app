"use client"

import Link from "next/link"
import { Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CriterioDeOrdem } from "@/lib/categoria-situacao"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

type Tipo = "expense" | "income"

/** "novembro" no ano corrente; "novembro de 2025" fora dele. */
export function mesNaFrase(ym: string, anoAtual: number): string {
    const [ano, mes] = ym.split("-").map(Number)
    const nome = formatMonthLongPtBr(new Date(ano, mes - 1, 1)).toLocaleLowerCase("pt-BR")
    return ano === anoAtual ? nome : `${nome} de ${ano}`
}

const mesDaFrase = (ym: string) => mesNaFrase(ym, new Date().getFullYear())

/** A linha acima da grade: quantas categorias tiveram movimento no mês e a ordem delas. */
export function CategoriasDoMesCabecalho({
    quantidade,
    mesYm,
    tipo,
    criterio,
    onCriterioChange,
}: {
    quantidade: number
    mesYm: string
    tipo: Tipo
    criterio: CriterioDeOrdem
    onCriterioChange: (c: CriterioDeOrdem) => void
}) {
    const movimento = tipo === "income" ? "receita" : "gasto"
    const categorias = quantidade === 1 ? "categoria" : "categorias"
    return (
        <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
                {quantidade} {categorias} com {movimento} em {mesDaFrase(mesYm)}
            </p>
            <Select value={criterio} onValueChange={(v) => onCriterioChange(v as CriterioDeOrdem)}>
                <SelectTrigger size="sm" aria-label="Ordenar categorias">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="maior">{tipo === "income" ? "Maior receita" : "Maior gasto"}</SelectItem>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="variacao">Variação</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

/** O rodapé da grade: as categorias sem movimento no mês, cada uma com o link para o detalhe. */
export function SemMovimentoNoMes({
    categorias,
    mesYm,
    tipo,
}: {
    categorias: { id: string; name: string; href: string }[]
    mesYm: string
    tipo: Tipo
}) {
    if (categorias.length === 0) return null
    return (
        <p className="text-sm text-muted-foreground">
            {tipo === "income" ? "Sem receita" : "Sem gasto"} em {mesDaFrase(mesYm)}:{" "}
            {categorias.map((c, i) => (
                <Fragment key={c.id}>
                    {i > 0 ? ", " : null}
                    <Button asChild variant="underline" className="h-auto px-0 text-sm">
                        <Link href={c.href}>{c.name}</Link>
                    </Button>
                </Fragment>
            ))}
        </p>
    )
}
