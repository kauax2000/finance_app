"use client"

import { ArrowTrendingUpIcon, CalendarDaysIcon, ScaleIcon } from "@heroicons/react/16/solid"
import { ColorTile } from "@/components/ui/color-tile"
import { Item, ItemActions, ItemChevron, ItemContent, ItemDescription, ItemLink, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import type { TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { fatosDoMes } from "@/lib/categoria-resumo"
import { TILE_EXPENSE_DEFAULT, TILE_INCOME_DEFAULT, TILE_PALETTE, tileColorFor } from "@/lib/tile-palette"

type Fato = ReturnType<typeof fatosDoMes>[number]

const AZUL = TILE_PALETTE.find((p) => p.nome === "azul")?.hex ?? null

/** Os fatos do mês em minicartões lado a lado (empilham no telefone): o que puxou, o já previsto e o total. */
export function FatosDoMes({
    fatos,
    tipo,
    cor,
    onAbrirLancamento,
    onVerComprometido,
}: {
    fatos: Fato[]
    tipo: TipoDaCategoria
    cor: string | null
    onAbrirLancamento: (() => void) | null
    /** Rola até "Já comprometido"; null quando a seção não aparece. */
    onVerComprometido: (() => void) | null
}) {
    if (fatos.length === 0) return null
    const corDaCategoria = tileColorFor(cor) ?? (tipo === "expense" ? TILE_EXPENSE_DEFAULT : TILE_INCOME_DEFAULT)
    const midia = {
        puxou: { color: corDaCategoria, Icone: ArrowTrendingUpIcon },
        previsto: { color: AZUL, Icone: CalendarDaysIcon },
        total: { color: null, Icone: ScaleIcon },
    } as const
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {fatos.map((f) => {
                const { color, Icone } = midia[f.id]
                const abrir = f.acao === "lancamento" ? onAbrirLancamento : f.acao === "comprometido" ? onVerComprometido : null
                return (
                    <Item key={f.id} variant="outline" interactive={abrir != null}>
                        <ItemMedia>
                            <ColorTile size="md" tint="tonal" color={color}>
                                <Icone aria-hidden />
                            </ColorTile>
                        </ItemMedia>
                        <ItemContent>
                            <ItemDescription className="text-xs">{f.rotulo}</ItemDescription>
                            <ItemTitle className="w-full">
                                {abrir ? (
                                    <ItemLink onClick={abrir} aria-label={`${f.rotulo}: ${f.titulo}`} className="min-w-0 truncate">
                                        {f.titulo}
                                    </ItemLink>
                                ) : (
                                    <span className="min-w-0 truncate">{f.titulo}</span>
                                )}
                            </ItemTitle>
                        </ItemContent>
                        <ItemActions>
                            <MoneyDisplay value={f.valor} className="font-semibold" />
                            {abrir ? <ItemChevron /> : null}
                        </ItemActions>
                    </Item>
                )
            })}
        </div>
    )
}
