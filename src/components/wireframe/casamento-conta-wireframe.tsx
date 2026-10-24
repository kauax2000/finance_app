"use client"

import { useState } from "react"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { ignorarCasamento, type Casamento } from "@/lib/bills/casamento"
import { currencyBRL } from "@/lib/formatters"

const ddmm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`

/**
 * "Isso pagou a conta {nome}?" (Bloco 6A, spec §11): um lançamento recente que
 * parece o pagamento de uma conta pendente. "Sim, ligar" liga os dois sem
 * lançar de novo; "Não" guarda o par neste aparelho e a pergunta não volta.
 */
export function CasamentoContaWireframe({
    casamento,
    onLigar,
    onIgnorar,
}: {
    casamento: Casamento
    onLigar: () => void | Promise<void>
    onIgnorar: () => void
}) {
    const [pendente, setPendente] = useState(false)
    return (
        <WireframeBox bloco={6} titulo="Isso pagou a conta?">
            <p>
                Isso pagou a conta {casamento.contaNome}? {casamento.descricao} · {currencyBRL(casamento.valor)} em{" "}
                {ddmm(casamento.dataYmd)}
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={pendente}
                    aria-busy={pendente}
                    className="border border-dashed border-muted-foreground/60 px-2 py-1 disabled:opacity-50"
                    onClick={async () => {
                        setPendente(true)
                        try {
                            await onLigar()
                        } finally {
                            setPendente(false)
                        }
                    }}
                >
                    Sim, ligar
                </button>
                <button
                    type="button"
                    disabled={pendente}
                    className="border border-dashed border-muted-foreground/60 px-2 py-1 disabled:opacity-50"
                    onClick={() => {
                        ignorarCasamento(casamento)
                        onIgnorar()
                    }}
                >
                    Não
                </button>
            </div>
        </WireframeBox>
    )
}
