"use client"

import { useId } from "react"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import type { SubscriptionKind } from "@/lib/supabase"

const opcoes: { value: SubscriptionKind; label: string }[] = [
    { value: "expense", label: "Despesa" },
    { value: "income", label: "Receita" },
]

/**
 * Despesa ou receita numa assinatura (Bloco 5). Receita recorrente entra
 * sozinha no dia, como o salário; quem tira o cartão das formas de pagamento é
 * o formulário que a monta.
 */
export function ReceitaRecorrenteWireframe({
    kind,
    onChange,
    disabled,
}: {
    kind: SubscriptionKind
    onChange: (kind: SubscriptionKind) => void
    disabled?: boolean
}) {
    const name = useId()
    return (
        <WireframeBox bloco={5} titulo="Receita recorrente">
            <fieldset className="flex flex-wrap items-center gap-4" disabled={disabled}>
                <legend className="sr-only">Tipo da assinatura</legend>
                {opcoes.map((o) => (
                    <label key={o.value} className="flex items-center gap-2">
                        <input
                            type="radio"
                            name={name}
                            value={o.value}
                            checked={kind === o.value}
                            onChange={() => onChange(o.value)}
                        />
                        {o.label}
                    </label>
                ))}
            </fieldset>
            {kind === "income" ? <p>Receita recorrente entra sozinha no dia, como o salário.</p> : null}
        </WireframeBox>
    )
}

/** O marcador de texto da assinatura de receita na lista (dentro da célula do nome). */
export function ReceitaRecorrenteMarcador() {
    return (
        <span className="mr-1 border border-dashed border-muted-foreground/60 bg-muted/40 px-1 font-mono text-2xs text-muted-foreground">
            Receita
        </span>
    )
}
