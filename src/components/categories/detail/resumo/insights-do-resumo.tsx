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

/** Até três observações do mês; a parcela que termina leva à Previsão, e a sugestão de limite abre o diálogo dele. */
export function InsightsDoResumo({
    itens,
    onDefinirLimite,
}: {
    itens: Insight[]
    onDefinirLimite: () => void
}) {
    if (itens.length === 0) return null
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {itens.map((i) => {
                const { tone, Icone } = MIDIA[i.tom]
                return (
                    <Item key={i.id} variant="outline" className="items-start">
                        <ItemMedia variant="tile" tone={tone}>
                            <Icone aria-hidden />
                        </ItemMedia>
                        <ItemContent>
                            <ItemDescription className="line-clamp-none text-foreground">
                                {i.texto.map((p, n) =>
                                    p.forte ? (
                                        <strong key={n} className="nums font-semibold">
                                            {p.texto}
                                        </strong>
                                    ) : (
                                        <span key={n}>{p.texto}</span>
                                    ),
                                )}
                            </ItemDescription>
                            {i.acao ? (
                                <div className="mt-1">
                                    {i.acao === "previsao" ? (
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
            })}
        </div>
    )
}
