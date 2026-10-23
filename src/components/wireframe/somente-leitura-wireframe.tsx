"use client"

import Link from "next/link"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { usePlano } from "@/lib/planos/plano"

/** A faixa de "só leitura" (Bloco 4): nada enquanto carrega ou quando o plano é família. */
export function SomenteLeituraWireframe() {
    const { plano } = usePlano()
    if (plano?.plano !== "leitura") return null

    return (
        <WireframeBox bloco={4} titulo="Só leitura">
            <p>Sua conta está em só leitura. Tudo continua visível; exportar e apagar seguem liberados.</p>
            <Link href="/plans" className="text-foreground underline">
                Ver planos
            </Link>
        </WireframeBox>
    )
}
