"use client"

import { ArrowDownIcon, ArrowTrendingUpIcon, BanknotesIcon, BarsArrowDownIcon, LanguageIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { Fragment } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

type Opcao = { value: CriterioDeOrdem; label: string; icon: typeof BanknotesIcon; sentidos: [string, string] }

const opcoesDeOrdem = (tipo: Tipo): Opcao[] => [
    { value: "maior", label: tipo === "income" ? "Receita" : "Gasto", icon: BanknotesIcon, sentidos: ["Maior primeiro", "Menor primeiro"] },
    { value: "nome", label: "Nome", icon: LanguageIcon, sentidos: ["A → Z", "Z → A"] },
    { value: "variacao", label: "Variação", icon: ArrowTrendingUpIcon, sentidos: ["Mais subiu", "Mais caiu"] },
]

/**
 * A ordem da grade: um menu com o título "Ordenar por" e o critério (rádio). A escolhida mostra
 * a seta do sentido no lugar do tique e o sentido por extenso sob o nome; tocar nela de novo
 * inverte e mantém o menu aberto. No desktop o gatilho é só o ícone, sem fundo, com a dica
 * "Ordenar"; no telefone (`compacta`), um botão de ícone.
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
    const nome = `Ordenar categorias: ${atual.label.toLocaleLowerCase("pt-BR")}, ${sentido.toLocaleLowerCase("pt-BR")}`
    return (
        <DropdownMenu>
            {compacta ? (
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="floating" size="icon-md" aria-label={nome}>
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
                                aria-label={nome}
                            >
                                <BarsArrowDownIcon aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Ordenar</TooltipContent>
                </Tooltip>
            )}
            <DropdownMenuContent align="end" size="lg">
                <DropdownMenuHeader title="Ordenar por" />
                {/* O Radix chama o onValueChange também ao tocar na já escolhida; só outra troca o critério. */}
                <DropdownMenuRadioGroup value={criterio} onValueChange={(v) => v !== criterio && onCriterioChange(v as CriterioDeOrdem)}>
                    {opcoes.map((o) => (
                        <DropdownMenuRadioItem
                            key={o.value}
                            value={o.value}
                            indicator="check"
                            indicatorIcon={
                                <ArrowDownIcon
                                    aria-hidden
                                    className={cn("text-foreground transition-transform duration-(--duration-fast)", invertida && "rotate-180")}
                                />
                            }
                            onSelect={(e) => {
                                if (o.value !== criterio) return
                                e.preventDefault()
                                onInvertidaChange(!invertida)
                            }}
                        >
                            <o.icon aria-hidden />
                            <span className="flex min-w-0 flex-col">
                                {o.label}
                                {o.value === criterio ? <span className="text-xs text-muted-foreground">{sentido}</span> : null}
                            </span>
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
