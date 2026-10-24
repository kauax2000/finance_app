"use client"

import { WireframeBox } from "@/components/wireframe/wireframe-box"

/** Se o orçamento da categoria é copiado para o mês seguinte (Bloco 5). */
export function OrcamentoRepeteWireframe({
    repeats,
    onChange,
}: {
    repeats: boolean
    onChange: (repeats: boolean) => void
}) {
    return (
        <WireframeBox bloco={5} titulo="Orçamento que se repete">
            <label className="flex items-center gap-2">
                <input type="checkbox" checked={repeats} onChange={(e) => onChange(e.target.checked)} />
                Repetir todo mês
            </label>
            <p>Desligue para encerrar este orçamento depois deste mês.</p>
        </WireframeBox>
    )
}
