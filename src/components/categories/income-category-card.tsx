"use client"

import Link from "next/link"
import { Card, CardAction, CardContent, CardHeader, CardLink, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { CategoryCardContextMenu } from "@/components/categories/category-card-context-menu"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { ColorTile } from "@/components/ui/color-tile"
import { TILE_INCOME_DEFAULT } from "@/lib/tile-palette"
import { currencyBRL } from "@/lib/formatters"
import type { ReceitaDoMes } from "@/lib/categoria-receitas-do-mes"

function stopLinkNavigation(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
}

export function IncomeCategoryCard({
    category,
    href,
    onEdit,
    onDelete,
    month,
}: {
    category: { id: string; name: string; icon: string | null; color: string | null }
    href: string
    /** Sem eles (o convidado, Bloco 7A), o cartão é só leitura: sem o menu. */
    onEdit?: () => void
    onDelete?: () => void
    /** Recebido e previsto do mês. Sem ele, o cartão é só o nome. */
    month?: ReceitaDoMes
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
                        {onEdit && onDelete ? (
                            <DropdownMenu>
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
                                        <EllipsisVerticalIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    size="sm"
                                >
                                    <DropdownMenuItem onSelect={onEdit}>
                                        <PencilIcon aria-hidden />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive"
                                        onSelect={onDelete}
                                    >
                                        <TrashIcon aria-hidden />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </CardAction>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                    {month ? (
                        <>
                            <div className="flex items-start justify-between gap-2">
                                <p className="min-w-0 text-2xl font-bold tabular-nums tracking-tight">
                                    {currencyBRL(month.recebido + month.previsto)}
                                </p>
                                <div
                                    className={cn(
                                        "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors",
                                        "group-hover:text-foreground group-active:text-foreground",
                                    )}
                                    aria-hidden
                                >
                                    Ver categoria
                                    <ChevronRightIcon
                                        className="size-3.5 shrink-0 opacity-85 transition-transform group-hover:translate-x-0.5 group-active:translate-x-0.5"
                                        aria-hidden
                                    />
                                </div>
                            </div>
                            {month.previsto > 0 ? (
                                <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
                                    Recebido <span className="tabular-nums">{currencyBRL(month.recebido)}</span>{" "}
                                    <span className="text-muted-foreground/70">·</span> +{" "}
                                    <span className="tabular-nums">{currencyBRL(month.previsto)}</span> previstos
                                </p>
                            ) : (
                                <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
                                    Sem previsões no mês
                                </p>
                            )}
                        </>
                    ) : (
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
                    )}
                </CardContent>
        </Card>
        </CategoryCardContextMenu>
    )
}
