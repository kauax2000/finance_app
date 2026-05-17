"use client"

import type { ReactNode } from "react"
import { ArrowDownIcon, ArrowUpIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
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
                        <div
                            className={cn(
                                "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md",
                                "border border-white/20 shadow-sm ring-1 ring-black/5",
                                "backdrop-blur-md",
                                "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80",
                            )}
                            style={{ backgroundColor: accentColor }}
                            aria-hidden
                        >
                            <CategoryIconPreview
                                name={normalizeCategoryIcon(category.icon)}
                                className="relative z-10 h-4 w-4 text-white"
                            />
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                            <h2 className="min-w-0 shrink truncate text-base font-semibold leading-snug tracking-tight md:text-lg">
                                {category.name}
                            </h2>
                            <span
                                className={cn(
                                    "inline-flex h-5 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-2 text-[11px] font-medium leading-none",
                                    isExpense
                                        ? "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                                        : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
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
                            <div
                                className={cn(
                                    "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md",
                                    "border border-white/20 shadow-sm ring-1 ring-black/5",
                                    "backdrop-blur-md",
                                    "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/30 after:to-white/5 after:opacity-80",
                                )}
                                style={{ backgroundColor: accentColor }}
                                aria-hidden
                            >
                                <CategoryIconPreview
                                    name={normalizeCategoryIcon(category.icon)}
                                    className="relative z-10 h-4 w-4 text-white"
                                />
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <h2 className="min-w-0 shrink truncate text-base font-semibold leading-snug tracking-tight md:text-lg">
                                    {category.name}
                                </h2>
                                <span
                                    className={cn(
                                        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-2 text-[11px] font-medium leading-none",
                                        isExpense
                                            ? "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                                            : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
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
