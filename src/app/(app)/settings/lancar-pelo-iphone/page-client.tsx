"use client"

import { AtalhoSecao } from "@/components/account/atalho-secao"
import { SecaoSozinha } from "@/components/settings/settings-section"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { useIsMobile } from "@/hooks/use-mobile"

export default function LancarPage() {
    const isMobile = useIsMobile()

    return (
        <div className="min-w-0 space-y-8">
            {/* No telefone o título é o da casca (`TituloDaTela`). */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitle asChild>
                        {/* O `<h1>` da página é o da barra do topo. */}
                        <p aria-hidden="true">Lançar pelo iPhone</p>
                    </PageHeaderTitle>
                </PageHeader>
            )}
            <div className="min-w-0 space-y-5">
                <SecaoSozinha>
                    <AtalhoSecao />
                </SecaoSozinha>
            </div>
        </div>
    )
}
