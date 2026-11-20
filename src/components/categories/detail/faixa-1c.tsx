"use client"

import { currencyBRL } from "@/lib/formatters"
import { FatosDoMes, ReguaDoMes, type FaixaDoMesProps } from "./regua-do-mes"

/** 1C — os fatos sobem para a linha do valor; a média por lançamento fecha o veredito. */
export function Faixa1C(props: FaixaDoMesProps) {
    const { lancado, quantidade } = props
    return (
        <ReguaDoMes
            {...props}
            fatosNaLinha={<FatosDoMes {...props} layout="linha" />}
            sufixo={quantidade > 0 ? `média por lançamento ${currencyBRL(lancado / quantidade)}` : null}
        />
    )
}
