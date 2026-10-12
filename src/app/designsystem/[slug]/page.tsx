import { notFound } from "next/navigation"

import { DocPage } from "../ds-doc"
import { DOCS } from "../docs-map"
import { REGISTRY, getEntry, getNeighbors } from "../registry"

/**
 * Uma rota para todas as páginas do catálogo: o registry decide o que existe e o mapa de docs o que cada slug
 * renderiza. Slug sem arquivo em `docs/` reprova no `doc-pages.test.ts`; slug fora do mapa cai no `notFound()`.
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
            // A categoria do vizinho vai junto, para saber se o próximo passo ainda é da mesma categoria.
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
