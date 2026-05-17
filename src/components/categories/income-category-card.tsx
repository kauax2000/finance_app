"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"

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
        <Link
            href={href}
            className={cn(
                "group block h-full rounded-xl no-underline",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label={`Abrir categoria ${category.name}. Ver detalhes.`}
        >
            <Card
                size="sm"
                className={cn(
                    "flex h-full flex-col gap-0 overflow-hidden !py-0 transition-shadow",
                    "group-hover:shadow-md group-active:shadow-md",
                )}
            >
                <CardHeader className="border-b border-border/60 bg-muted/25 !py-3">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
                        <div
                            className={cn(
                                "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md",
                                "border border-white/20 shadow-sm ring-1 ring-black/5",
                                "backdrop-blur-md",
                                "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80",
                            )}
                            style={{ backgroundColor: color }}
                            aria-hidden
                        >
                            <CategoryIconPreview
                                name={normalizeCategoryIcon(category.icon)}
                                className="relative z-10 h-4 w-4 text-white"
                            />
                        </div>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pr-1">
                            <CardTitle
                                className={cn(
                                    "min-w-0 text-base font-semibold leading-tight",
                                    "truncate @min-[360px]/card-header:max-w-none",
                                )}
                            >
                                {category.name}
                            </CardTitle>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-foreground"
                                    aria-label={`Opções da categoria ${category.name}`}
                                    onClick={(e) => stopLinkNavigation(e)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <EllipsisVerticalIcon className="size-4" aria-hidden />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-44"
                                onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                                <DropdownMenuItem onSelect={() => onEdit()}>
                                    <PencilIcon className="h-4 w-4" aria-hidden />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => onDelete()}
                                >
                                    <TrashIcon className="h-4 w-4" aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3 bg-card pb-3 pt-3">
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
        </Link>
    )
}
