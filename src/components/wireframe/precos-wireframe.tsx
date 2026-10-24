import Link from "next/link"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { ROUTES } from "@/config/navigation"
// `lib/planos/precos`, e não `lib/planos/plano`: aquele traz o hook do cliente, e esta página é de servidor.
import { doze, porAno, ultimoDiaDosFundadores } from "@/lib/planos/precos"
import {
    FIM_FUNDADORES,
    PRECO_FAMILIA_CENTAVOS,
    PRECO_FUNDADOR_CENTAVOS,
    TESTE_DIAS,
} from "../../../supabase/functions/_shared/plano"

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
                <p>
                    {doze(PRECO_FAMILIA_CENTAVOS)} no cartão ({porAno(PRECO_FAMILIA_CENTAVOS)})
                </p>
                {fundadores ? (
                    <p>
                        Fundadores: {doze(PRECO_FUNDADOR_CENTAVOS)}, congelado enquanto ativo, até {ultimoDiaDosFundadores()}
                    </p>
                ) : null}
                <p>{TESTE_DIAS} dias grátis, sem cartão</p>

                <h2 className="font-bold text-foreground">Garantias</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>7 dias de arrependimento.</li>
                    <li>Aviso 7 dias antes de renovar.</li>
                    <li>Cancelar em 1 toque.</li>
                    <li>Sem plano, nada se apaga: exportar e apagar seguem liberados.</li>
                </ul>

                <p className="space-x-4">
                    <Link href={ROUTES.REGISTER} className="text-foreground underline">
                        Começar o teste grátis
                    </Link>
                    <Link href={ROUTES.LOGIN} className="text-foreground underline">
                        Já tenho conta
                    </Link>
                </p>
            </WireframeBox>
        </main>
    )
}
