import type { ReactNode } from "react"
import { Muted } from "@/components/ui/typography"
import {
    PageSection,
    PageSectionDescription,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"

/** A seção de Configurações: título, o alcance ("Vale para …") e a ação à direita. */
export function SettingsSection({
    id,
    className,
    titulo,
    alcance,
    actions,
    children,
}: {
    id?: string
    className?: string
    titulo: string
    alcance: string
    actions?: ReactNode
    children?: ReactNode
}) {
    return (
        <PageSection id={id} className={className}>
            <PageSectionHeader actions={actions}>
                <PageSectionTitle>{titulo}</PageSectionTitle>
                <PageSectionDescription>{alcance}</PageSectionDescription>
            </PageSectionHeader>
            {children}
        </PageSection>
    )
}

/** A linha de uma seção: texto à esquerda, controle à direita. */
export function SettingsRow({
    titulo,
    descricao,
    children,
}: {
    titulo: ReactNode
    descricao?: ReactNode
    children?: ReactNode
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
                {titulo ? <p className="text-sm font-medium">{titulo}</p> : null}
                {descricao ? <Muted>{descricao}</Muted> : null}
            </div>
            {children}
        </div>
    )
}

/** Rola até o elemento do `#hash`; sem hash ou sem elemento, nada. */
export function rolarAteAncora(hash: string, doc: Document) {
    doc.getElementById(hash.slice(1))?.scrollIntoView()
}
