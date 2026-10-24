"use client"

import { WireframeBox } from "@/components/wireframe/wireframe-box"

/** A conta de valor variável (Bloco 6A): o estimado vira a média das 3 últimas pagas. */
export function ContaValorVariavelWireframe({
    valorVariavel,
    onChange,
}: {
    valorVariavel: boolean
    onChange: (valorVariavel: boolean) => void
}) {
    return (
        <WireframeBox bloco={6} titulo="Valor variável">
            <label className="flex items-center gap-2">
                <input type="checkbox" checked={valorVariavel} onChange={(e) => onChange(e.target.checked)} />
                O valor muda todo mês (luz, água)
            </label>
            <p>O valor estimado passa a ser a média dos 3 últimos pagamentos. Ao pagar, você confirma o valor real.</p>
        </WireframeBox>
    )
}
