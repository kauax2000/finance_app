import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

/** A IA do app (Bloco 3B) em Configurações: quem lê, o limite do dia e a política de privacidade. */
export function IaConfiguracoesWireframe() {
    return (
        <WireframeBox bloco="3" titulo="IA">
            <p className="text-foreground">IA: Groq e Cloudflare, grátis, sem treino</p>
            <p>Até 30 chamadas por dia (frase, foto do recibo e fatura; uma fatura longa gasta várias). Tudo que a IA preenche fica a conferir.</p>
            <Link href={ROUTES.PRIVACY} className="text-foreground underline">
                Política de privacidade
            </Link>
        </WireframeBox>
    )
}
