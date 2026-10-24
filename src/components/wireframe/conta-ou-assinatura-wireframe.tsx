"use client"

import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

const TEXTO = {
    conta: {
        frase: "Conta a pagar: você paga, e o app lembra e confirma. Se é cobrado sozinho no cartão ou no Pix Automático, cadastre como assinatura.",
        href: `${ROUTES.SUBSCRIPTIONS}?new=1`,
        link: "Nova assinatura",
    },
    assinatura: {
        frase: "Assinatura: é cobrada sozinha, e o app lança. Se você paga por boleto ou Pix, cadastre como conta a pagar.",
        href: `${ROUTES.BILLS}?new=1`,
        link: "Nova conta a pagar",
    },
} as const

/**
 * Conta a pagar ou assinatura (Bloco 6A, spec §11): a linha que explica a
 * diferença, com o link para o outro cadastro. O link de dentro do diálogo o
 * fecha antes de abrir a outra tela (o `DialogContent` cuida).
 */
export function ContaOuAssinaturaWireframe({ onde }: { onde: "conta" | "assinatura" }) {
    const t = TEXTO[onde]
    return (
        <WireframeBox bloco={6} titulo="Conta ou assinatura">
            <p>{t.frase}</p>
            <Link href={t.href} className="underline">
                {t.link}
            </Link>
        </WireframeBox>
    )
}
