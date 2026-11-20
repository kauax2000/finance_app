"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Caption } from "@/components/ui/typography"
import { Faixa1A } from "./faixa-1a"
import { Faixa1C } from "./faixa-1c"
import type { FaixaDoMesProps } from "./regua-do-mes"

export type VersaoDaFaixa = "A" | "C"
// Chave nova: a antiga guardava "B"/"F".
const CHAVE = "detalhe-categoria:faixa-regua"

/** Provisória: o dono alterna 1A e 1C no uso e escolhe; a escolha fica no aparelho. */
export function useVersaoDaFaixa() {
    const [versao, setVersao] = React.useState<VersaoDaFaixa>("A")

    React.useEffect(() => {
        try {
            if (localStorage.getItem(CHAVE) === "C") setVersao("C")
        } catch {
            // Sem armazenamento: abre em 1A e só não lembra.
        }
    }, [])

    const trocar = React.useCallback((v: string) => {
        if (v !== "A" && v !== "C") return
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
            {/* Abaixo de 1280px o rótulo sairia por cima do título; o leitor de tela ainda o lê. */}
            <Caption id="faixa-teste-rotulo" className="hidden xl:block">
                Teste de layout
            </Caption>
            <ToggleGroup
                type="single"
                variant="segmented"
                size="sm"
                value={versao}
                onValueChange={onTrocar}
                aria-labelledby="faixa-teste-rotulo"
            >
                <ToggleGroupItem value="A">1A · Fatos embaixo</ToggleGroupItem>
                <ToggleGroupItem value="C">1C · Fatos no topo</ToggleGroupItem>
            </ToggleGroup>
        </div>
    )
}

export function FaixaDoMesTeste({ versao, ...props }: FaixaDoMesProps & { versao: VersaoDaFaixa }) {
    return versao === "A" ? <Faixa1A {...props} /> : <Faixa1C {...props} />
}
