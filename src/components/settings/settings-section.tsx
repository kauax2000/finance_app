import Link from "next/link"
import type { ReactNode } from "react"
import { Item, ItemChevron, ItemContent, ItemTitle } from "@/components/ui/item"
import { Muted } from "@/components/ui/typography"
import {
    PageSection,
    PageSectionDescription,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"

/** A seção de Configurações: título, o alcance opcional ("Vale para …") e a ação à direita. */
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
    alcance?: string
    actions?: ReactNode
    children?: ReactNode
}) {
    return (
        <PageSection id={id} className={className}>
            <PageSectionHeader actions={actions}>
                <PageSectionTitle>{titulo}</PageSectionTitle>
                {alcance ? <PageSectionDescription>{alcance}</PageSectionDescription> : null}
            </PageSectionHeader>
            {children}
        </PageSection>
    )
}

/** A linha de uma seção: a mídia opcional e o texto à esquerda, controle à direita. */
export function SettingsRow({
    titulo,
    descricao,
    media,
    children,
}: {
    titulo: ReactNode
    descricao?: ReactNode
    media?: ReactNode
    children?: ReactNode
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
            {media}
            <div className="min-w-0 flex-1">
                {titulo ? <p className="text-sm font-medium">{titulo}</p> : null}
                {descricao ? <Muted>{descricao}</Muted> : null}
            </div>
            {children}
        </div>
    )
}

/** O ladrilho do ícone de uma linha, na medida do ícone do app ao lado. */
export function SettingsTile({ children }: { children: ReactNode }) {
    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-row bg-muted text-foreground">
            {children}
        </span>
    )
}

/**
 * A linha que abre um ajuste, com o valor de hoje à direita (opcional): o
 * botão de um diálogo, ou, com `href`, o link de uma tela.
 */
export function SettingsLink({
    titulo,
    valor,
    onClick,
    href,
    "aria-label": rotulo,
}: {
    titulo: string
    valor?: string
    "aria-label"?: string
    onClick?: () => void
    href?: string
}) {
    const corpo = (
        <>
            {/* Com valor, o título não cede: sem o `flex-none`, um e-mail longo o zeraria. */}
            <ItemContent className={valor ? "flex-none" : undefined}>
                <ItemTitle>{titulo}</ItemTitle>
            </ItemContent>
            {valor ? <Muted className="ml-auto min-w-0 truncate">{valor}</Muted> : null}
            <ItemChevron />
        </>
    )
    return (
        <Item variant="flush" interactive asChild className="px-4">
            {href ? (
                <Link href={href} aria-label={rotulo}>
                    {corpo}
                </Link>
            ) : (
                <button type="button" aria-label={rotulo} onClick={onClick}>
                    {corpo}
                </button>
            )}
        </Item>
    )
}

/** Rola até o elemento do `#hash`; sem hash ou sem elemento, nada. */
export function rolarAteAncora(hash: string, doc: Document) {
    doc.getElementById(hash.slice(1))?.scrollIntoView()
}
