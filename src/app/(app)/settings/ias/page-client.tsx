"use client"

import { IasSecao } from "@/components/account/ias-secao"
import { SecaoSozinha } from "@/components/settings/settings-section"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { useIsMobile } from "@/hooks/use-mobile"

export default function IasPage() {
    const isMobile = useIsMobile()

    return (
        <div className="min-w-0 space-y-8">
            {/* No telefone o nome fica fixo na barra (`TituloDaTela`). */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitle asChild>
                        {/* O `<h1>` da página é o da barra do topo. */}
                        <p aria-hidden="true">IAs conectadas</p>
                    </PageHeaderTitle>
                </PageHeader>
            )}
            <div className="min-w-0 space-y-5">
                <SecaoSozinha>
                    <IasSecao />
                </SecaoSozinha>
            </div>
        </div>
    )
}
