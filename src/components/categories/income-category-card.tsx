"use client"

import Link from "next/link"
import { Card, CardAction, CardContent, CardHeader, CardLink, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { CategoryCardContextMenu } from "@/components/categories/category-card-context-menu"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { ColorTile } from "@/components/ui/color-tile"
import { TILE_INCOME_DEFAULT } from "@/lib/tile-palette"

function stopLinkNavigation(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
}

export function IncomeCategoryCard({
    category,
    href,
    onEdit,
    onDelete,
}: {
    category: { id: string; name: string; icon: string | null; color: string | null }
    href: string
    onEdit: () => void
    onDelete: () => void
}) {
    const color = category.color || TILE_INCOME_DEFAULT

    return (
        // O cartão inteiro é clicável pelo `CardLink` no título (rodada 204),
        // e não por um <a> em volta de tudo: o menu ficava dentro de um link.
        <CategoryCardContextMenu
            name={category.name}
            description="Categoria de receita"
            href={href}
            onEdit={onEdit}
            onDelete={onDelete}
        >
        <Card padding="sm" className="group h-full">
                <CardHeader
                    media={
                        <ColorTile size="lg" color={color}>
                            <CategoryIconPreview name={normalizeCategoryIcon(category.icon)} />
                        </ColorTile>
                    }
                >
                    <CardTitle className="min-w-0 self-center truncate font-semibold leading-tight @min-[360px]/card-header:max-w-none">
                        <CardLink asChild>
                            <Link href={href}>{category.name}</Link>
                        </CardLink>
                    </CardTitle>
                    <CardAction>
                        <DropdownMenu mobile="sheet">
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="icon-md"
                                    className="text-muted-foreground hover:text-foreground active:text-foreground"
                                    aria-label={`Opções da categoria ${category.name}`}
                                    onClick={(e) => stopLinkNavigation(e)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <EllipsisVerticalIcon className="size-4" aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                size="sm"
                                header={
                                    <DropdownMenuHeader
                                        title={category.name}
                                        description="Categoria de receita"
                                    />
                                }
                            >
                                <DropdownMenuItem onSelect={() => onEdit()}>
                                    <PencilIcon aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive"
                                    onSelect={() => onDelete()}
                                >
                                    <TrashIcon aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardAction>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                    <div
                        className={cn(
                            "inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors",
                            "group-hover:text-foreground group-active:text-foreground",
                            "mt-auto",
                        )}
                        aria-hidden
                    >
                        Ver categoria
                        <ChevronRightIcon
                            className="size-3.5 shrink-0 opacity-85 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                            aria-hidden
                        />
                    </div>
                </CardContent>
        </Card>
        </CategoryCardContextMenu>
    )
}
