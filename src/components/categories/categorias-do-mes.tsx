"use client"

import { BarsArrowDownIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { Fragment } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CriterioDeOrdem } from "@/lib/categoria-situacao"
import { cn } from "@/lib/utils"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

type Tipo = "expense" | "income"

/** "novembro" no ano corrente; "novembro de 2025" fora dele. */
export function mesNaFrase(ym: string, anoAtual: number): string {
    const [ano, mes] = ym.split("-").map(Number)
    const nome = formatMonthLongPtBr(new Date(ano, mes - 1, 1)).toLocaleLowerCase("pt-BR")
    return ano === anoAtual ? nome : `${nome} de ${ano}`
}

const mesDaFrase = (ym: string) => mesNaFrase(ym, new Date().getFullYear())

/** "10 categorias" / "1 categoria": a contagem que mora na barra, rente ao pé das abas. */
export function ContagemDoMes({ quantidade, className }: { quantidade: number; className?: string }) {
    return (
        <p className={cn("nums self-end text-sm text-muted-foreground", className)}>
            {quantidade} {quantidade === 1 ? "categoria" : "categorias"}
        </p>
    )
}

const opcoesDeOrdem = (tipo: Tipo): { value: CriterioDeOrdem; label: string }[] => [
    { value: "maior", label: tipo === "income" ? "Maior receita" : "Maior gasto" },
    { value: "nome", label: "Nome" },
    { value: "variacao", label: "Variação" },
]

/** A ordem da grade: o `Select` no desktop; no telefone (`compacta`), um botão de ícone com o menu. */
export function OrdemDasCategorias({
    tipo,
    criterio,
    onCriterioChange,
    compacta,
}: {
    tipo: Tipo
    criterio: CriterioDeOrdem
    onCriterioChange: (c: CriterioDeOrdem) => void
    compacta?: boolean
}) {
    const opcoes = opcoesDeOrdem(tipo)
    if (compacta) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="floating" size="icon-md" aria-label="Ordenar categorias">
                        <BarsArrowDownIcon aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={criterio} onValueChange={(v) => onCriterioChange(v as CriterioDeOrdem)}>
                        {opcoes.map((o) => (
                            <DropdownMenuRadioItem key={o.value} value={o.value}>
                                {o.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
    return (
        <Select value={criterio} onValueChange={(v) => onCriterioChange(v as CriterioDeOrdem)}>
            <SelectTrigger size="sm" aria-label="Ordenar categorias">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {opcoes.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
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
