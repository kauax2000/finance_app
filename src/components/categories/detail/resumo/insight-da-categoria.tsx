"use client"

import Link from "next/link"
import { CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item"
import type { insights } from "@/lib/categoria-resumo"

type Insight = ReturnType<typeof insights>[number]

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
    const { tone, Icone } = MIDIA[insight.tom]
    return (
        <Item variant="outline" className="items-start">
            <ItemMedia variant="tile" tone={tone}>
                <Icone aria-hidden />
            </ItemMedia>
            <ItemContent>
                <ItemDescription className="line-clamp-none text-foreground">
                    {insight.texto.map((p, n) =>
                        p.forte ? (
                            <strong key={n} className="nums font-semibold">
                                {p.texto}
                            </strong>
                        ) : (
                            <span key={n}>{p.texto}</span>
                        ),
                    )}
                </ItemDescription>
                {insight.acao ? (
                    <div className="mt-1">
                        {insight.acao === "previsao" ? (
                            <Button asChild variant="link" size="sm" className="px-0">
                                <Link href="/previsao">ver na Previsão</Link>
                            </Button>
                        ) : (
                            <Button variant="link" size="sm" className="px-0" onClick={onDefinirLimite}>
                                definir limite
                            </Button>
                        )}
                    </div>
                ) : null}
            </ItemContent>
        </Item>
    )
}
