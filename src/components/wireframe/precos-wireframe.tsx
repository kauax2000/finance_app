import Link from "next/link"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
// Direto do `_shared`: `lib/planos/plano` traz o hook do cliente, e esta página é de servidor.
import { FIM_FUNDADORES } from "../../../supabase/functions/_shared/plano"

/**
 * Os preços, públicos (Bloco 4): pessoa sem conta vê o que custa antes de
 * entrar. Estático; a oferta de fundadores some sozinha depois de `FIM_FUNDADORES` .
 */
export function PrecosWireframe() {
    const fundadores = new Date() < new Date(FIM_FUNDADORES)

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <WireframeBox bloco={4} titulo="Preços">
                <h1 className="text-base font-bold text-foreground">Plano Família, até 6 pessoas</h1>
                <p>12x de R$ 29,90 no cartão (R$ 358,80/ano)</p>
                {fundadores ? <p>Fundadores: 12x de R$ 19,90, congelado enquanto ativo, até 31/01/2027</p> : null}
                <p>14 dias grátis, sem cartão</p>

                <h2 className="font-bold text-foreground">Garantias</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>7 dias de arrependimento.</li>
                    <li>Aviso 7 dias antes de renovar.</li>
                    <li>Cancelar em 1 toque.</li>
                    <li>Sem plano, nada se apaga: exportar e apagar seguem liberados.</li>
                </ul>

                <p className="space-x-4">
                    <Link href="/register" className="text-foreground underline">
                        Começar o teste grátis
                    </Link>
                    <Link href="/login" className="text-foreground underline">
                        Já tenho conta
                    </Link>
                </p>
            </WireframeBox>
        </main>
    )
}
