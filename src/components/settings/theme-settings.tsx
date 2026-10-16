"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { ThemeToggle } from "@/components/ui/theme-toggle"

/** O tema do app neste aparelho. No telefone é o único lugar dele (rodada 278). */
export function ThemeSettings() {
    return (
        <PageSection>
            <PageSectionHeader>
                <PageSectionTitle>Aparência</PageSectionTitle>
            </PageSectionHeader>
            <Card padding="none">
                <CardContent className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">Tema</p>
                        <p className="text-xs text-muted-foreground">Vale só neste aparelho.</p>
                    </div>
                    <ThemeToggle className="shrink-0" />
                </CardContent>
            </Card>
        </PageSection>
    )
}
