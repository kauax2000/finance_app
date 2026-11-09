"use client"

import { useCountUp } from "@/hooks/use-count-up"

// A curva de `--ease-out` e o tempo de `--duration-slow` (300ms): o hook pede números, não variáveis.
const CURVA = [0.16, 1, 0.3, 1] as const
const TROCA = 0.3

/** O número que conta do valor de antes ao novo, sem partir do 0 ao montar. */
export function ContagemQueAnda({ value, formatar }: { value: number; formatar: (v: number) => string }) {
    const final = formatar(value)
    const ref = useCountUp(value, formatar, { chave: "importar", entrada: 0, troca: TROCA, ease: CURVA })
    return (
        <span className="inline-grid">
            {/* Quem escreve aqui é só o hook, como no `ChartNumber`: o React não disputa o texto. */}
            <span ref={ref} aria-hidden className="col-start-1 row-start-1" />
            <span aria-hidden className="invisible col-start-1 row-start-1">
                {final}
            </span>
            <span className="sr-only">{final}</span>
        </span>
    )
}
