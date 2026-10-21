"use client"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import type { CreditCard } from "@/lib/supabase"

const campo = "border border-dashed border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"

/**
 * Receita que é estorno no cartão: grava `credit_card` com o cartão e abate a
 * fatura do ciclo em que cai (Decisão 6). `value` é o cartão, ou `null`.
 */
export function EstornoWireframe({
    cards,
    value,
    onChange,
}: {
    cards: Pick<CreditCard, "id" | "name" | "last_four">[]
    value: string | null
    onChange: (cardId: string | null) => void
}) {
    return (
        <WireframeBox bloco={2} titulo="Estorno no cartão">
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={value != null}
                    disabled={cards.length === 0}
                    onChange={(e) => onChange(e.target.checked ? cards[0].id : null)}
                />
                É estorno no cartão
            </label>
            {cards.length === 0 ? <p>Nenhum cartão cadastrado.</p> : null}
            {value != null ? (
                <label className="flex flex-wrap items-center gap-2">
                    Cartão
                    <select className={campo} value={value} onChange={(e) => onChange(e.target.value)}>
                        {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} · •••• {c.last_four}
                            </option>
                        ))}
                    </select>
                </label>
            ) : null}
            {value != null ? <p>Abate a fatura do ciclo em que cai e não conta como receita no Painel.</p> : null}
        </WireframeBox>
    )
}
