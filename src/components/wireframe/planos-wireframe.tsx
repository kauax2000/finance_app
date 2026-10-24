"use client"

import Link from "next/link"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { ROUTES } from "@/config/navigation"
import { doze, fundadoresAbertos, precoDoDia, resumoDoPlano, usePlano } from "@/lib/planos/plano"

/**
 * O plano da pessoa (Bloco 4): o que ela tem hoje e o preço do dia. O "Assinar"
 * fica desabilitado até o gateway do Bloco 8.
 */
export function PlanosWireframe() {
    const { plano, carregando } = usePlano()
    const agora = new Date()
    const resumo = plano ? resumoDoPlano(plano, agora) : null
    const fundador = fundadoresAbertos(agora)

    return (
        <WireframeBox bloco={4} titulo="Planos">
            {carregando ? <p>Carregando…</p> : null}
            {!carregando && !resumo ? <p>Não foi possível carregar o plano. Tente de novo.</p> : null}
            {resumo ? (
                <div className="space-y-1">
                    <h1 className="text-base font-bold text-foreground">{resumo.titulo}</h1>
                    {resumo.linhas.map((linha) => (
                        <p key={linha}>{linha}</p>
                    ))}
                </div>
            ) : null}

            <p>
                {`Preço de hoje: ${doze(precoDoDia(agora))}`}
                {fundador ? " (fundadores, congelado enquanto ativo)" : ""}
            </p>

            {resumo?.podeAssinar ? (
                <div className="space-y-1">
                    <button type="button" disabled className="border border-dashed border-muted-foreground/60 px-3 py-1 disabled:opacity-60">
                        Assinar
                    </button>
                    <p>A assinatura abre no lançamento.</p>
                </div>
            ) : null}

            <Link href={ROUTES.PRECOS} className="text-foreground underline">
                Ver preços e garantias
            </Link>
        </WireframeBox>
    )
}
