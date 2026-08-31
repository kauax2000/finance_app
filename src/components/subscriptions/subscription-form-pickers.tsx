"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    FormPickerPopoverContent,
    FormPickerPopoverFooter,
    FormPickerPopoverFooterAction,
    FormPickerPopoverList,
    FormPickerPopoverSearch,
} from "@/components/ui/form-picker-popover"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    SUBSCRIPTION_SELECT_NONE,
    type ExpenseCategoryOption,
} from "@/components/subscriptions/subscription-form-shared"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "@heroicons/react/16/solid"
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
    const isMobile = useIsMobile()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const handleOpenChange = (next: boolean) => {
        setOpen(next)
        if (next) {
            setSearch("")
            requestAnimationFrame(() => {
                document
                    .getElementById("subscription-category-picker")
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            })
        }
    }

    const selected = useMemo(
        () =>
            value === SUBSCRIPTION_SELECT_NONE
                ? null
                : categories.find((c) => c.id === value),
        [value, categories]
    )

    return (
        <Popover modal={isMobile} open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    id="subscription-category-picker"
                    type="button"
                    variant="outline"
                    size="xl"
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
            <FormPickerPopoverContent>
                <FormPickerPopoverSearch
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    placeholder="Buscar categoria…"
                />
                <FormPickerPopoverList>
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
                </FormPickerPopoverList>
                <FormPickerPopoverFooter>
                    <FormPickerPopoverFooterAction className="text-xs">
                        <Link href={categoriesHref}>Gerenciar categorias</Link>
                    </FormPickerPopoverFooterAction>
                </FormPickerPopoverFooter>
            </FormPickerPopoverContent>
        </Popover>
    )
}
