import type { ReactNode } from "react"
import {
    PageSection,
    PageSectionDescription,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"

/** A seção de Configurações: título, o alcance ("Vale para …") e a ação à direita. */
export function SettingsSection({
    titulo,
    alcance,
    actions,
    children,
}: {
    titulo: string
    alcance: string
    actions?: ReactNode
    children?: ReactNode
}) {
    return (
        <PageSection>
            <PageSectionHeader actions={actions}>
                <PageSectionTitle>{titulo}</PageSectionTitle>
                <PageSectionDescription>{alcance}</PageSectionDescription>
            </PageSectionHeader>
            {children}
        </PageSection>
    )
}
