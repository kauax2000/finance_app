"use client"

import * as React from "react"
import { ArrowDownTrayIcon, ArrowUpTrayIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid"

import { usePageChromeFilter } from "@/components/layout/page-chrome-provider"
import { TransactionTypeSegment } from "@/components/transactions/transaction-type-segment"
import { podarCategoriasDoTipo } from "@/components/transactions/use-campos-de-filtro"
import type { TelaDeTransacoes } from "@/components/transactions/use-transacoes-da-tela"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterBar, type FilterField, type FilterValue } from "@/components/ui/filter-bar"

/** O período que a tela põe sozinha não conta como filtro no cabeçalho. */
export function filtrosDaPessoa(filtros: FilterValue[]): number {
    return filtros.filter((f) => !(f.field === "periodo" && f.values.length === 1 && f.values[0] === "este-mes")).length
}

export function TransacoesToolbar({
    tela,
    campos,
    onImportar,
    onExportar,
    exportando = false,
}: {
    tela: TelaDeTransacoes
    campos: FilterField[]
    /** Sem ele (o convidado), o item some do ⋯; sem os dois, some o ⋯. */
    onImportar?: () => void
    onExportar?: () => void
    /** Exportando: o item fica desligado até o arquivo sair. */
    exportando?: boolean
}) {
    const { estado, setEstado, pagina, carregando, workspaceAux, categories } = tela
    const raizDosFiltros = React.useRef<HTMLDivElement>(null)

    const semDados = !carregando && workspaceAux?.workspaceHasTransactions === false
    const desligado = carregando || semDados
    const n = filtrosDaPessoa(estado.filtros)

    usePageChromeFilter({
        label: n ? `Filtros: ${n} ${n === 1 ? "ativo" : "ativos"}` : "Filtros",
        active: n > 0,
        disabled: desligado,
        onOpen: () => {
            window.scrollTo({ top: 0 })
            // shortcut: clica no "+ Filtro" pelo data-slot; trocar por uma prop open quando o FilterBar ganhar uma
            requestAnimationFrame(() =>
                raizDosFiltros.current?.querySelector<HTMLButtonElement>("[data-slot=filter-bar-add]")?.click(),
            )
        },
    })

    return (
        // Uma linha só sobre a tabela: abas, filtros e, na ponta (do DataTable), a contagem e o Exibir.
        // No telefone o FilterBar desce para a linha de baixo.
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <TransactionTypeSegment
                    value={estado.type}
                    onChange={(type) => setEstado({ type, filtros: podarCategoriasDoTipo(estado.filtros, type, categories) })}
                    className="min-w-0 flex-1 shrink md:max-w-fit md:flex-none md:shrink-0"
                />
                {/* Só no telefone: no desktop Importar e Exportar moram no cabeçalho da página. */}
                {onImportar || onExportar ? (
                    <div className="hidden shrink-0 max-md:flex">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="tertiary" size="icon-md" aria-label="Mais ações">
                                    <EllipsisHorizontalIcon aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onImportar ? (
                                    <DropdownMenuItem onSelect={onImportar}>
                                        <ArrowUpTrayIcon aria-hidden />
                                        Importar extrato
                                    </DropdownMenuItem>
                                ) : null}
                                {onExportar ? (
                                    <DropdownMenuItem onSelect={onExportar} disabled={exportando}>
                                        <ArrowDownTrayIcon aria-hidden />
                                        Exportar CSV
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : null}
            <div ref={raizDosFiltros} className="min-w-0 flex-1 max-md:order-last max-md:basis-full">
                <FilterBar
                    fields={campos}
                    value={estado.filtros}
                    onValueChange={(filtros) => setEstado({ filtros })}
                    // Sem `total`: a tela não tem a contagem da carteira inteira, e "N de N" mentiria.
                    count={pagina.isLoading ? undefined : pagina.totalCount}
                    noun={["lançamento", "lançamentos"]}
                    mobile="scroll"
                    disabled={desligado}
                />
            </div>
        </div>
    )
}
