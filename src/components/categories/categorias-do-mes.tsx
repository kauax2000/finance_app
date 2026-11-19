"use client"

import { ArrowTrendingUpIcon, BanknotesIcon, BarsArrowDownIcon, LanguageIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { Fragment } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
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

type Opcao = { value: CriterioDeOrdem; label: string; icon: typeof BanknotesIcon; sentidos: [string, string] }

const opcoesDeOrdem = (tipo: Tipo): Opcao[] => [
    { value: "maior", label: tipo === "income" ? "Receita" : "Gasto", icon: BanknotesIcon, sentidos: ["Maior primeiro", "Menor primeiro"] },
    { value: "nome", label: "Nome", icon: LanguageIcon, sentidos: ["A → Z", "Z → A"] },
    { value: "variacao", label: "Variação", icon: ArrowTrendingUpIcon, sentidos: ["Mais subiu", "Mais caiu"] },
]

/**
 * A ordem da grade: um menu com o título "Ordenar por", o critério (rádio com tique) e o
 * sentido numa segunda lista, "Sentido". No desktop o gatilho é só o ícone, sem fundo, com a
 * dica "Ordenar"; no telefone (`compacta`), um botão de ícone. O sentido é um segundo grupo de
 * rádio, e não um `ToggleGroup` no pé: o Radix prende o Tab no menu e só as setas andam, entre
 * itens do menu, então o trilho ficaria fora do alcance do teclado.
 */
export function OrdemDasCategorias({
    tipo,
    criterio,
    onCriterioChange,
    invertida,
    onInvertidaChange,
    compacta,
}: {
    tipo: Tipo
    criterio: CriterioDeOrdem
    onCriterioChange: (c: CriterioDeOrdem) => void
    invertida: boolean
    onInvertidaChange: (invertida: boolean) => void
    compacta?: boolean
}) {
    const opcoes = opcoesDeOrdem(tipo)
    const atual = opcoes.find((o) => o.value === criterio) ?? opcoes[0]
    const sentido = atual.sentidos[invertida ? 1 : 0]
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
                                aria-label={`Ordenar categorias: ${atual.label.toLocaleLowerCase("pt-BR")}, ${sentido.toLocaleLowerCase("pt-BR")}`}
                            >
                                <BarsArrowDownIcon aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Ordenar</TooltipContent>
                </Tooltip>
            )}
            <DropdownMenuContent align="end">
                <DropdownMenuHeader title="Ordenar por" />
                <DropdownMenuRadioGroup value={criterio} onValueChange={(v) => onCriterioChange(v as CriterioDeOrdem)}>
                    {opcoes.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={o.value} indicator="check">
                            <o.icon aria-hidden />
                            {o.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sentido</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={invertida ? "inverter" : "normal"} onValueChange={(v) => onInvertidaChange(v === "inverter")}>
                    {atual.sentidos.map((rotulo, i) => (
                        <DropdownMenuRadioItem key={rotulo} value={i === 1 ? "inverter" : "normal"} indicator="check">
                            {rotulo}
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
