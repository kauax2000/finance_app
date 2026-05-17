"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    SUBSCRIPTION_SELECT_NONE,
    type ExpenseCategoryOption,
} from "@/components/subscriptions/subscription-form-shared"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

function CategoryRows({
    categories,
    search,
    value,
    onPick,
}: {
    categories: ExpenseCategoryOption[]
    search: string
    value: string
    onPick: (id: string) => void
}) {
    const q = search.trim().toLowerCase()
    const filtered = useMemo(
        () =>
            q
                ? categories.filter((c) => c.name.toLowerCase().includes(q))
                : categories,
        [categories, q]
    )

    if (filtered.length === 0) {
        return (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada.
            </p>
        )
    }

    return (
        <ul className="flex flex-col gap-0.5 pr-1">
            {filtered.map((c) => {
                const selected = c.id === value
                return (
                    <li key={c.id}>
                        <button
                            type="button"
                            className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                selected
                                    ? "bg-muted font-medium text-foreground"
                                    : "hover:bg-muted/60"
                            )}
                            onClick={() => onPick(c.id)}
                        >
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{
                                    backgroundColor:
                                        c.color || "var(--muted-foreground)",
                                }}
                                aria-hidden
                            />
                            <span className="min-w-0 truncate">{c.name}</span>
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}

export function SubscriptionCategoryPicker({
    value,
    onChange,
    categories,
    categoriesHref,
    disabled,
}: {
    value: string
    onChange: (id: string) => void
    categories: ExpenseCategoryOption[]
    categoriesHref: string
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const handleOpenChange = (next: boolean) => {
        setOpen(next)
        if (!next) setSearch("")
    }

    const selected = useMemo(
        () =>
            value === SUBSCRIPTION_SELECT_NONE
                ? null
                : categories.find((c) => c.id === value),
        [value, categories]
    )

    return (
        <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={disabled}
                    className="w-full justify-between px-3 text-left text-sm font-normal"
                    aria-label="Categoria de despesa"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        {selected ? (
                            <>
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor:
                                            selected.color ||
                                            "var(--muted-foreground)",
                                    }}
                                    aria-hidden
                                />
                                <span className="truncate">{selected.name}</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">Nenhuma</span>
                        )}
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="start"
                sideOffset={6}
                collisionPadding={12}
                className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-1.5rem,22rem)] flex flex-col gap-0 overflow-hidden p-0"
            >
                <div className="shrink-0 border-b border-border/50 p-3 pb-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar categoria…"
                            className="pl-9 text-sm"
                            autoComplete="off"
                        />
                    </div>
                </div>
                <div
                    className="max-h-[min(45dvh,15rem)] touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-1 [-webkit-overflow-scrolling:touch]"
                    onWheel={(e) => e.stopPropagation()}
                >
                    <ul className="flex flex-col gap-0.5 pr-1">
                        <li>
                            <button
                                type="button"
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                    value === SUBSCRIPTION_SELECT_NONE
                                        ? "bg-muted font-medium text-foreground"
                                        : "hover:bg-muted/60"
                                )}
                                onClick={() => {
                                    onChange(SUBSCRIPTION_SELECT_NONE)
                                    setOpen(false)
                                }}
                            >
                                <span className="text-muted-foreground">
                                    Nenhuma
                                </span>
                            </button>
                        </li>
                    </ul>
                    <CategoryRows
                        categories={categories}
                        search={search}
                        value={value}
                        onPick={(id) => {
                            onChange(id)
                            setOpen(false)
                        }}
                    />
                </div>
                <div className="shrink-0 border-t border-border/50 bg-muted/25 p-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="w-full text-xs"
                        asChild
                    >
                        <Link href={categoriesHref}>Gerenciar categorias</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
