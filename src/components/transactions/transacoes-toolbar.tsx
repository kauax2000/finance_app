"use client"

import * as React from "react"
import { ArrowDownTrayIcon, ArrowUpTrayIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid"

import { usePageChromeFilter } from "@/components/layout/page-chrome-provider"
import { TransactionTypeSegment } from "@/components/transactions/transaction-type-segment"
import type { TelaDeTransacoes } from "@/components/transactions/use-transacoes-da-tela"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterBar, type FilterField } from "@/components/ui/filter-bar"
import { Toolbar, ToolbarActions, ToolbarSearch } from "@/components/ui/toolbar"

const ESPERA_DA_BUSCA_MS = 300

/**
 * A busca grava `q` 300ms depois da última tecla. Quando o `q` muda por fora
 * (Limpar, voltar), o campo acompanha — menos quando é o eco do que já se digitou.
 */
function useBuscaComEspera(q: string, gravar: (q: string) => void) {
    const [busca, setBusca] = React.useState(q)
    const [qVisto, setQVisto] = React.useState(q)
    if (q !== qVisto) {
        setQVisto(q)
        if (q !== busca.trim()) setBusca(q)
    }
    const gravarRef = React.useRef(gravar)
    React.useLayoutEffect(() => {
        gravarRef.current = gravar
    })
    React.useEffect(() => {
        const alvo = busca.trim()
        if (alvo === q) return
        const t = window.setTimeout(() => gravarRef.current(alvo), ESPERA_DA_BUSCA_MS)
        return () => window.clearTimeout(t)
    }, [busca, q])
    return [busca, setBusca] as const
}

export function TransacoesToolbar({
    tela,
    campos,
    onImportar,
    onExportar,
}: {
    tela: TelaDeTransacoes
    campos: FilterField[]
    onImportar: () => void
    onExportar: () => void
}) {
    const { estado, setEstado, pagina, carregando, workspaceAux } = tela
    const [busca, setBusca] = useBuscaComEspera(estado.q, (q) => setEstado({ q }))
    const raizDosFiltros = React.useRef<HTMLDivElement>(null)

    const semDados = !carregando && workspaceAux?.workspaceHasTransactions === false
    const desligado = carregando || semDados
    const n = estado.filtros.length

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
        <div className="flex flex-col gap-3">
            <Toolbar>
                <TransactionTypeSegment
                    value={estado.type}
                    onChange={(type) => setEstado({ type })}
                    className="min-w-0 flex-1 shrink md:max-w-fit md:shrink-0"
                />
                {/* Só no telefone: no desktop Importar e Exportar moram no cabeçalho da página. */}
                <ToolbarActions className="hidden max-md:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="tertiary" size="icon-md" aria-label="Mais ações">
                                <EllipsisHorizontalIcon aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onImportar}>
                                <ArrowUpTrayIcon aria-hidden />
                                Importar extrato
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onExportar}>
                                <ArrowDownTrayIcon aria-hidden />
                                Exportar CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ToolbarActions>
                <ToolbarSearch
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar descrição"
                    aria-label="Buscar descrição"
                    disabled={semDados}
                    className="max-md:basis-full"
                />
            </Toolbar>
            <div ref={raizDosFiltros}>
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
