"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Caption } from "@/components/ui/typography"
import { FaixaBarras } from "./faixa-barras"
import { FaixaMetricas, type FaixaDoMesProps } from "./faixa-metricas"

export type VersaoDaFaixa = "B" | "F"
const CHAVE = "detalhe-categoria:faixa"

/** Provisória: o dono alterna B e F no uso e escolhe; a escolha fica no aparelho. */
export function useVersaoDaFaixa() {
    const [versao, setVersao] = React.useState<VersaoDaFaixa>("B")

    React.useEffect(() => {
        try {
            if (localStorage.getItem(CHAVE) === "F") setVersao("F")
        } catch {
            // Sem armazenamento: abre em B e só não lembra.
        }
    }, [])

    const trocar = React.useCallback((v: string) => {
        if (v !== "B" && v !== "F") return
        setVersao(v)
        try {
            localStorage.setItem(CHAVE, v)
        } catch {
            // Sem armazenamento: troca, só não lembra.
        }
    }, [])

    return [versao, trocar] as const
}

/** A chave do teste, no cabeçalho, à esquerda da pílula do mês. */
export function ChaveDaFaixa({ versao, onTrocar }: { versao: VersaoDaFaixa; onTrocar: (v: string) => void }) {
    return (
        <div className="flex items-center gap-3">
            <Caption id="faixa-teste-rotulo">Teste de layout</Caption>
            <ToggleGroup
                type="single"
                variant="segmented"
                size="sm"
                value={versao}
                onValueChange={onTrocar}
                aria-labelledby="faixa-teste-rotulo"
            >
                <ToggleGroupItem value="B">B · Métricas</ToggleGroupItem>
                <ToggleGroupItem value="F">F · Barras</ToggleGroupItem>
            </ToggleGroup>
        </div>
    )
}

export function FaixaDoMesTeste({ versao, ...props }: FaixaDoMesProps & { versao: VersaoDaFaixa }) {
    return versao === "B" ? <FaixaMetricas {...props} /> : <FaixaBarras {...props} />
}
