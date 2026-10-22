import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

/**
 * O que o compartilhar do Android não leva ao formulário: o PDF (a fatura se
 * confere no cartão) e o arquivo que já saiu do cache (lido ou vencido).
 */
export function CompartilhadoAvisoWireframe({
    aviso,
    onFechar,
}: {
    aviso: "pdf" | "indisponivel"
    onFechar: () => void
}) {
    return (
        <WireframeBox bloco="3" titulo="Compartilhar">
            <p role="status">
                {aviso === "pdf"
                    ? "Para conferir a fatura, abra o cartão e use Conferir fatura."
                    : "O arquivo compartilhado não está mais disponível."}
            </p>
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
