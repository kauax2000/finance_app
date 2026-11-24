"use client"

import Link from "next/link"
import { CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item"
import type { InsightDaCategoria as Insight } from "@/lib/insights-da-categoria"

// Verde a boa notícia, âmbar a atenção, azul a informação.
const MIDIA = {
    success: { tone: "success", Icone: CheckCircleIcon },
    warning: { tone: "warning", Icone: ExclamationTriangleIcon },
    info: { tone: "info", Icone: LightBulbIcon },
} as const

/**
 * O insight do mês, num cartão: a parcela que termina leva à Previsão, e a
 * sugestão de limite abre o diálogo dele. Sem `acao` (o convidado), o texto
 * fica sem o botão.
 */
export function InsightDaCategoria({
    insight,
    onDefinirLimite,
}: {
    insight: Insight
    onDefinirLimite: () => void
}) {
    const { tone, Icone } = MIDIA[insight.tom ?? "info"]
    return (
        // O insight é uma caixa solta entre cartões: o raio (`rounded-surface`) e o recuo (16, o do `Card`) são
        // os deles, para o texto começar na linha do título do cartão ao lado.
        <Item variant="outline" className="items-start rounded-surface p-4">
            <ItemMedia variant="tile" tone={tone}>
                <Icone aria-hidden />
            </ItemMedia>
            <ItemContent>
                <ItemDescription className="line-clamp-none text-foreground">
                    <strong className="nums font-semibold">{insight.numero}</strong> {insight.titulo}. {insight.linha}
                </ItemDescription>
                {insight.acao.tipo === "previsao" || insight.acao.tipo === "limite" ? (
                    <div className="mt-1">
                        {insight.acao.tipo === "previsao" ? (
                            <Button asChild variant="link" size="sm" className="px-0">
                                <Link href="/previsao">{insight.rotulo}</Link>
                            </Button>
                        ) : (
                            <Button variant="link" size="sm" className="px-0" onClick={onDefinirLimite}>
                                {insight.rotulo}
                            </Button>
                        )}
                    </div>
                ) : null}
            </ItemContent>
        </Item>
    )
}
