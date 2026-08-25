import { notFound } from "next/navigation"

import { DocPage } from "../ds-doc"
import { DOCS } from "../docs-map"
import { REGISTRY, getEntry, getNeighbors } from "../registry"

/**
 * Uma rota para todas as páginas do catálogo. O registry decide o que existe; o
 * mapa de docs decide o que cada slug renderiza. Um slug listado no registry sem
 * documento correspondente é erro de build, não uma página vazia em produção
 * (ver a checagem em `docs-map.ts`).
 */
export function generateStaticParams() {
    return REGISTRY.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const entry = getEntry(slug)
    if (!entry) return {}
    return {
        title: `${entry.name} · Design system`,
        description: entry.description,
        robots: { index: false, follow: false },
    }
}

export default async function DesignSystemDocPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const entry = getEntry(slug)
    const Doc = DOCS[slug]
    if (!entry || !Doc) notFound()
    const { previous, next } = getNeighbors(slug)

    return (
        <DocPage
            name={entry.name}
            category={entry.category}
            description={entry.description}
            source={entry.source}
            importLine={entry.importLine}
            // A categoria do vizinho vai junto: numa ordem de leitura de 88
            // páginas, o que se precisa saber ao avançar é se o próximo passo
            // ainda é da mesma categoria ou se a leitura mudou de capítulo.
            previous={
                previous
                    ? {
                          slug: previous.slug,
                          name: previous.name,
                          category: previous.category,
                      }
                    : undefined
            }
            next={
                next
                    ? { slug: next.slug, name: next.name, category: next.category }
                    : undefined
            }
        >
            <Doc />
        </DocPage>
    )
}
