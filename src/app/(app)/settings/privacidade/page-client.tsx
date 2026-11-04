"use client"

import { PrivacidadeWireframe } from "@/components/wireframe/privacidade-wireframe"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { useIsMobile } from "@/hooks/use-mobile"

/** A política para quem entrou: o mesmo texto da pública (`/privacidade`), dentro da casca. */
export default function PrivacidadePage() {
    const isMobile = useIsMobile()

    return (
        <div className="min-w-0 space-y-8">
            {/* No telefone o título é o da casca (`TituloDaTela`). */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitle asChild>
                        {/* O `<h1>` da página é o da barra do topo. */}
                        <p aria-hidden="true">Política de privacidade</p>
                    </PageHeaderTitle>
                </PageHeader>
            )}
            <PrivacidadeWireframe />
        </div>
    )
}
