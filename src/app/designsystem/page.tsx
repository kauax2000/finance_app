import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import {
    PageHeader,
    PageHeaderDescription,
    PageHeaderTitle,
    PageHeaderTitleRow,
} from "@/components/ui/page-header"
import { CATEGORY_ORDER, REGISTRY, groupedRegistry } from "./registry"

const CATEGORY_BLURB: Record<string, string> = {
    Fundações: "As decisões que todo o resto herda: cor, tipo, forma, movimento, camada.",
    Átomos: "Um controle, uma responsabilidade. Não compõem outros componentes.",
    Moléculas: "Alguns átomos resolvendo uma tarefa completa.",
    Organismos: "Blocos grandes, com estado e layout próprios.",
    Padrões: "Não são componentes: são as decisões que atravessam telas.",
}

export default function DesignSystemIndexPage() {
    const groups = groupedRegistry()

    return (
        <div className="flex flex-col gap-8 pb-16">
            <PageHeader>
                <PageHeaderTitleRow>
                    <PageHeaderTitle className="page-title text-2xl sm:text-2xl">
                        Design system
                    </PageHeaderTitle>
                    <PageHeaderDescription>
                        {REGISTRY.length} itens em {CATEGORY_ORDER.length} categorias. Os
                        componentes vivem em <Code>src/components/ui/</Code> e os tokens em{" "}
                        <Code>src/app/globals.css</Code>.
                    </PageHeaderDescription>
                </PageHeaderTitleRow>
            </PageHeader>

            {groups.map((group) => (
                <section key={group.category} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
                            {group.category}
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {group.items.length}
                            </span>
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {CATEGORY_BLURB[group.category]}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {group.items.map((item) => (
                            <Link
                                key={item.slug}
                                href={`/designsystem/${item.slug}`}
                                className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/70"
                            >
                                <Card className="h-full transition-colors hover:border-primary/40 active:border-primary/40">
                                    <CardHeader>
                                        <CardTitle className="text-sm">{item.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
