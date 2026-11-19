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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

const opcoesDeOrdem = (tipo: Tipo): { value: CriterioDeOrdem; label: string }[] => [
    { value: "maior", label: tipo === "income" ? "Maior receita" : "Maior gasto" },
    { value: "nome", label: "Nome" },
    { value: "variacao", label: "Variação" },
]

/** A ordem da grade: um menu de rádio. No desktop o gatilho é só o ícone, sem fundo, com a dica "Ordenar"; no telefone (`compacta`), um botão de ícone. */
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
    const atual = opcoes.find((o) => o.value === criterio) ?? opcoes[0]
    return (
        <DropdownMenu>
            {compacta ? (
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="floating" size="icon-md" aria-label="Ordenar categorias">
                        <BarsArrowDownIcon aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
            ) : (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="tertiary"
                                size="icon-lg"
                                aria-label={`Ordenar categorias: ${atual.label}`}
                            >
                                <BarsArrowDownIcon aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Ordenar</TooltipContent>
                </Tooltip>
            )}
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
