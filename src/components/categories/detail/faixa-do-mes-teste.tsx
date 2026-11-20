"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Caption } from "@/components/ui/typography"
import { FaixaBarras } from "./faixa-barras"
import { FaixaMetricas, type FaixaDoMesProps } from "./faixa-metricas"

type Versao = "B" | "F"
const CHAVE = "detalhe-categoria:faixa"

/** Provisória: o dono alterna B e F no uso e escolhe; a escolha fica no aparelho. */
export function FaixaDoMesTeste(props: FaixaDoMesProps) {
    const [versao, setVersao] = React.useState<Versao>("B")

    React.useEffect(() => {
        try {
            if (localStorage.getItem(CHAVE) === "F") setVersao("F")
        } catch {
            // Sem armazenamento: abre em B e só não lembra.
        }
    }, [])

    const trocar = (v: string) => {
        if (v !== "B" && v !== "F") return
        setVersao(v)
        try {
            localStorage.setItem(CHAVE, v)
        } catch {
            // Sem armazenamento: troca, só não lembra.
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-end gap-3">
                <Caption id="faixa-teste-rotulo">Teste de layout</Caption>
                <ToggleGroup
                    type="single"
                    variant="segmented"
                    size="sm"
                    value={versao}
                    onValueChange={trocar}
                    aria-labelledby="faixa-teste-rotulo"
                >
                    <ToggleGroupItem value="B">B · Métricas</ToggleGroupItem>
                    <ToggleGroupItem value="F">F · Barras</ToggleGroupItem>
                </ToggleGroup>
            </div>
            {versao === "B" ? <FaixaMetricas {...props} /> : <FaixaBarras {...props} />}
        </div>
    )
}
