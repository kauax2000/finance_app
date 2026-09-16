"use client"

import Link from "next/link"
import { Card, CardContent, CardTitle, CardToolbar } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { ColorTile } from "@/components/ui/color-tile"

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
    const color = category.color || "#10B981"

    return (
        // O cartão inteiro é clicável por um link esticado (::after) no título, e
        // não por um <a> em volta de tudo: o botão de menu ficava dentro de um
        // link, e o aria-label do link apagava o conteúdo do cartão.
        <div
            className={cn(
                "group relative block h-full rounded-xl",
                "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background",
            )}
        >
            <Card
                padding="none"
                className={cn(
                    "h-full transition-shadow",
                    "group-hover:shadow-md group-active:shadow-md",
                )}
            >
                <CardToolbar className="px-3">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
                        <ColorTile color={color}>
                            <CategoryIconPreview name={normalizeCategoryIcon(category.icon)} />
                        </ColorTile>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pr-1">
                            <CardTitle
                                className={cn(
                                    "min-w-0 text-base font-semibold leading-tight",
                                    "truncate @min-[360px]/card-header:max-w-none",
                                )}
                            >
                                <Link
                                    href={href}
                                    className="no-underline after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                                >
                                    {category.name}
                                </Link>
                            </CardTitle>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="icon-lg"
                                    className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
                                    aria-label={`Opções da categoria ${category.name}`}
                                    onClick={(e) => stopLinkNavigation(e)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <EllipsisVerticalIcon className="size-4" aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end" size="sm"
                            >
                                <DropdownMenuItem onSelect={() => onEdit()}>
                                    <PencilIcon className="h-4 w-4" aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive"
                                    onSelect={() => onDelete()}
                                >
                                    <TrashIcon className="h-4 w-4" aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardToolbar>

                <CardContent className="flex flex-1 flex-col gap-3 bg-card px-3 pt-3 pb-3">
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
        </div>
    )
}
