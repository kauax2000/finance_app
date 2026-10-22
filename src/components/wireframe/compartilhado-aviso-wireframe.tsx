import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

/**
 * O que o compartilhar do Android não leva ao formulário: o PDF (a fatura se
 * confere no cartão), o arquivo que já saiu do cache (lido ou vencido) e o
 * recusado pelo service worker (grande, vazio ou de outro tipo).
 */
const TEXTO = {
    pdf: "Para conferir a fatura, abra o cartão e use Conferir fatura.",
    indisponivel: "O arquivo compartilhado não está mais disponível.",
    recusado: "Não foi possível receber o arquivo (até 10 MB, foto ou PDF).",
} as const

export function CompartilhadoAvisoWireframe({
    aviso,
    onFechar,
}: {
    aviso: keyof typeof TEXTO
    onFechar: () => void
}) {
    return (
        <WireframeBox bloco="3" titulo="Compartilhar">
            <p role="status">{TEXTO[aviso]}</p>
            <div className="flex flex-wrap gap-3">
                {aviso === "pdf" ? (
                    <Link href={ROUTES.CREDIT_CARDS} className="text-foreground underline">
                        Abrir cartões
                    </Link>
                ) : null}
                <button type="button" onClick={onFechar} className="underline">
                    Fechar
                </button>
            </div>
        </WireframeBox>
    )
}
