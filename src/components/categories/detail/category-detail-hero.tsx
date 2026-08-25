"use client"

import type { ReactNode } from "react"
import { ArrowDownIcon, ArrowUpIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import type { Category } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type CategoryDetailHeroProps = {
    category: Category
    accentColor: string
    onEdit: () => void
    onDelete: () => void
    /** Mês: em telas pequenas fica abaixo do título; a partir de `md`, na mesma faixa. */
    monthToolbar?: ReactNode
}

export function CategoryDetailHero({
    category,
    accentColor,
    onEdit,
    onDelete,
    monthToolbar,
}: CategoryDetailHeroProps) {
    const isExpense = category.type === "expense"

    return (
        <div className="w-full min-w-0 max-w-full space-y-2">
            <div className="flex w-full min-w-0 items-center justify-between gap-2 md:hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 overflow-hidden">
                        <ColorTile size="sm" color={accentColor}>
                            <CategoryIconPreview name={normalizeCategoryIcon(category.icon)} />
                        </ColorTile>

                        <div className="flex min-w-0 items-center gap-2">
                            <h2 className="min-w-0 shrink truncate text-base font-semibold leading-snug tracking-tight md:text-lg">
                                {category.name}
                            </h2>
                            <span
                                className={cn(
                                    "inline-flex h-5 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-2 text-2xs font-medium leading-none",
                                    isExpense
                                        ? "bg-expense-muted text-expense-muted-foreground"
                                        : "bg-income-muted text-income-muted-foreground",
                                )}
                            >
                                {isExpense ? (
                                    <ArrowDownIcon className="size-3 shrink-0 stroke-[2.25]" aria-hidden />
                                ) : (
                                    <ArrowUpIcon className="size-3 shrink-0 stroke-[2.25]" aria-hidden />
                                )}
                                {isExpense ? "Despesa" : "Receita"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label={`Opções da categoria ${category.name}`}
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
            </div>

            <div
                className={cn(
                    "hidden md:grid md:min-h-10 md:w-full md:min-w-0 md:max-w-full md:grid-rows-1 md:items-center md:gap-x-3",
                    monthToolbar
                        ? "md:grid-cols-[minmax(0,1fr)_minmax(0,min(100%,24rem))_auto]"
                        : "md:grid-cols-[minmax(0,1fr)_auto]",
                )}
            >
                <div className="min-w-0">
                    <div className="flex min-h-10 min-w-0 items-center gap-2.5">
                        <div className="flex min-w-0 max-w-full flex-1 items-center gap-2 overflow-hidden">
                            <ColorTile size="sm" color={accentColor}>
                                <CategoryIconPreview name={normalizeCategoryIcon(category.icon)} />
                            </ColorTile>
                            <div className="flex min-w-0 items-center gap-2">
                                <h2 className="min-w-0 shrink truncate text-base font-semibold leading-snug tracking-tight md:text-lg">
                                    {category.name}
                                </h2>
                                <span
                                    className={cn(
                                        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-2 text-2xs font-medium leading-none",
                                        isExpense
                                            ? "bg-expense-muted text-expense-muted-foreground"
                                            : "bg-income-muted text-income-muted-foreground",
                                    )}
                                >
                                    {isExpense ? (
                                        <ArrowDownIcon className="size-3 shrink-0 stroke-[2.25]" aria-hidden />
                                    ) : (
                                        <ArrowUpIcon className="size-3 shrink-0 stroke-[2.25]" aria-hidden />
                                    )}
                                    {isExpense ? "Despesa" : "Receita"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {monthToolbar ? (
                    <div className="flex min-h-10 min-w-0 max-w-[min(100%,24rem)] items-center justify-end">
                        {monthToolbar}
                    </div>
                ) : null}

                <div className="flex min-h-10 shrink-0 items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label={`Opções da categoria ${category.name}`}
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
            </div>
        </div>
    )
}
