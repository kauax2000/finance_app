"use client"

/*
 * Cliente de propósito. Como server component, esta página passava `<Link>`
 * por `asChild` a componentes cliente (`Button`, `PageHeaderMeta`), e o
 * elemento chegava ao `Slot` como referência preguiçosa do RSC: a linha
 * "Brand" saía vazia já no HTML do servidor e o cabeçalho quebrava a
 * hidratação. É a medição que o `EmptyState` já registrou no AGENTS.
 */

import {
    ArrowUturnLeftIcon,
    BanknotesIcon,
    CursorArrowRaysIcon,
    SwatchIcon,
} from "@heroicons/react/16/solid"
import Link from "next/link"
import { AppLogo } from "@/components/layout/app-logo"
import {
    Card,
    CardDescription,
    CardHeader,
    CardLink,
    CardTitle,
} from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import {
    Item,
    ItemChevron,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import {
    PageHeader,
    PageHeaderDescription,
    PageHeaderMeta,
    PageHeaderStat,
    PageHeaderTitle,
    PageHeaderTitleRow,
} from "@/components/ui/page-header"
import {
    PageSection,
    PageSectionDescription,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { CATEGORY_META } from "./category-meta"
import { REGISTRY, getEntry, groupedRegistry, slugifyCategory } from "./registry"

/**
 * Por onde se começa: a marca, e as quatro páginas que mudam o que alguém vai
 * escrever nas outras — a cor, o valor em reais, o formulário e o toque.
 */
const BRAND_SLUG = "brand"
const START_HERE = [
    { slug: "colors", Icon: SwatchIcon },
    { slug: "money-display", Icon: BanknotesIcon },
    // A própria glifa da tecla Enter: o contrato dela mora no Form.
    { slug: "form", Icon: ArrowUturnLeftIcon },
    { slug: "touch-safe-area", Icon: CursorArrowRaysIcon },
]
const START_HERE_COUNT = START_HERE.length + 1

const CATEGORY_BLURB: Record<string, string> = {
    Foundations: "As decisões que todo o resto herda: cor, tipo, forma, movimento, camada.",
    Atoms: "Indivisíveis: um controle, um elemento, uma casca. A anatomia interna não é composição.",
    Molecules: "Feitas de átomos: um grupo pequeno que resolve uma tarefa e lê como uma unidade.",
    Organisms: "Feitos de moléculas: seções com faixas, grupos, submenus ou linhas próprias.",
    Templates: "O que estrutura a página, e não o que ela contém.",
}

export default function DesignSystemIndexPage() {
    const groups = groupedRegistry()
    const foundations = REGISTRY.filter((item) => item.category === "Foundations").length
    const brand = getEntry(BRAND_SLUG)

    return (
        <div className="flex flex-col gap-12 pb-24">
            <PageHeader size="lg">
                <PageHeaderTitleRow>
                    <PageHeaderTitle>Design system</PageHeaderTitle>
                    <PageHeaderDescription className="max-w-none">
                        Uma página por componente e por padrão, com o espécime vivo ao
                        lado da regra. Os componentes vivem em{" "}
                        <Code variant="inline">src/components/ui/</Code> e os tokens em{" "}
                        <Code variant="inline">src/app/globals.css</Code>.
                    </PageHeaderDescription>
                </PageHeaderTitleRow>
                <PageHeaderMeta>
                    <PageHeaderStat label="Componentes">
                        {REGISTRY.length - foundations}
                    </PageHeaderStat>
                    <PageHeaderStat label="Fundações">{foundations}</PageHeaderStat>
                </PageHeaderMeta>
            </PageHeader>

            <PageSection size="lg">
                <PageSectionHeader>
                    <PageSectionTitle>Comece aqui</PageSectionTitle>
                    <PageSectionDescription>
                        Cinco páginas antes das outras {REGISTRY.length - START_HERE_COUNT}.
                        Elas não descrevem um componente: descrevem a decisão que os
                        componentes obedecem.
                    </PageSectionDescription>
                </PageSectionHeader>

                {/* A peça de marca da tela: a marca é o que se lê primeiro. */}
                {brand ? (
                    <Card variant="brand">
                        <CardHeader media={<AppLogo size="md" />}>
                            <CardTitle>
                                <CardLink asChild>
                                    <Link href={`/designsystem/${brand.slug}`}>
                                        {brand.name}
                                    </Link>
                                </CardLink>
                            </CardTitle>
                            <CardDescription>
                                A marca é preta, branca no escuro, e o arco-íris é a
                                única cor dela.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : null}

                <ItemGroup role="list" className="grid gap-2 sm:grid-cols-2">
                    {START_HERE.map(({ slug, Icon }) => {
                        const item = getEntry(slug)
                        if (!item) return null
                        return (
                            <Item key={item.slug} role="listitem" interactive asChild>
                                <Link href={`/designsystem/${item.slug}`}>
                                    <ItemMedia variant="icon">
                                        <Icon aria-hidden className="text-muted-foreground" />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>{item.name}</ItemTitle>
                                        <ItemDescription>{item.description}</ItemDescription>
                                    </ItemContent>
                                    <ItemChevron />
                                </Link>
                            </Item>
                        )
                    })}
                </ItemGroup>
            </PageSection>

            {groups.map((group) => {
                const Icon = CATEGORY_META[group.category].Icon
                return (
                    <PageSection
                        key={group.category}
                        id={slugifyCategory(group.category)}
                        size="lg"
                        variant="ruled"
                        className="scroll-mt-20"
                    >
                        <PageSectionHeader>
                            <PageSectionTitle icon={<Icon />} count={group.items.length}>
                                {group.category}
                            </PageSectionTitle>
                            <PageSectionDescription>
                                {CATEGORY_BLURB[group.category]}
                            </PageSectionDescription>
                        </PageSectionHeader>

                        {/* Um sumário: os nomes numa coluna e as descrições em
                            outra, numa linha só, para a lista continuar varrível. */}
                        <ItemGroup role="list" variant="divided">
                            {group.items.map((item) => (
                                <Item
                                    key={item.slug}
                                    role="listitem"
                                    size="sm"
                                    interactive
                                    asChild
                                >
                                    <Link href={`/designsystem/${item.slug}`}>
                                        <ItemContent className="grid items-baseline gap-x-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                                            <ItemTitle className="w-auto min-w-0">
                                                <span className="min-w-0 truncate">{item.name}</span>
                                            </ItemTitle>
                                            <ItemDescription
                                                title={item.description}
                                                className="truncate"
                                            >
                                                {item.description}
                                            </ItemDescription>
                                        </ItemContent>
                                        <ItemChevron />
                                    </Link>
                                </Item>
                            ))}
                        </ItemGroup>
                    </PageSection>
                )
            })}
        </div>
    )
}
