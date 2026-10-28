"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FormSwitch } from "@/components/ui/form"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { useLancamentoInteligente } from "@/hooks/use-lancamento-inteligente"

/** Como o "+ Adicionar" cria um lançamento neste aparelho. */
export function LancamentoSettings() {
    const [ligado, definir] = useLancamentoInteligente()
    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Lançamento</PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
                <CardContent className="px-4 py-3 sm:py-3.5">
                    <FormSwitch
                        label="Lançamento inteligente"
                        description="Escreva ou fotografe e o app preenche tudo. Desligado, o + Adicionar abre o formulário."
                        checked={ligado}
                        onCheckedChange={definir}
                    />
                </CardContent>
            </Card>
        </PageSection>
    )
}
