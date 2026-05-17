"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { cn } from "@/lib/utils"

export type TransactionFilterType = "all" | "income" | "expense"

/** Shared chrome for filter + form type segments (matches transaction toolbar). */
export const transactionSegmentContainerClassName =
    "inline-flex h-10 w-full items-stretch rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 md:h-8 md:w-auto dark:bg-muted/40"

export function transactionSegmentTabClassName(selected: boolean) {
    return cn(
        "h-full min-h-0 min-w-0 flex-1 px-2 text-xs font-medium shadow-none md:min-w-[4.25rem] md:flex-none md:px-2.5",
        selected
            ? "relative z-[1] border border-border/80 bg-background text-foreground shadow-sm dark:bg-card dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.35)]"
            : "border border-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
    )
}

const FILTER_TABS: { value: TransactionFilterType; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "expense", label: "Despesas" },
    { value: "income", label: "Receitas" },
]

const FORM_TYPE_TABS: { value: "expense" | "income"; label: string }[] = [
    { value: "expense", label: "Despesas" },
    { value: "income", label: "Receitas" },
]

export type TransactionFormKind = "expense" | "installment" | "income"

const FORM_KIND_TABS: { value: TransactionFormKind; label: string }[] = [
    { value: "expense", label: "Despesa" },
    { value: "installment", label: "Parcelada" },
    { value: "income", label: "Receita" },
]

/** Create flow: despesa simples, compra parcelada, receita. */
export function TransactionFormKindSegment({
    value,
    onChange,
    className,
}: {
    value: TransactionFormKind
    onChange: (next: TransactionFormKind) => void
    className?: string
}) {
    return (
        <div
            className={cn(transactionSegmentContainerClassName, className)}
            role="tablist"
            aria-label="Tipo de lançamento"
        >
            <ButtonGroup className="h-full min-h-0 w-full gap-0.5 md:w-auto">
                {FORM_KIND_TABS.map((tab) => {
                    const selected = value === tab.value
                    return (
                        <Button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            size="sm"
                            variant="ghost"
                            className={transactionSegmentTabClassName(selected)}
                            onClick={() => onChange(tab.value)}
                        >
                            {tab.label}
                        </Button>
                    )
                })}
            </ButtonGroup>
        </div>
    )
}

export function TransactionFormTypeSegment({
    value,
    onChange,
    className,
    disabled = false,
    /** Fill parent width at all breakpoints (e.g. dialogs); default matches toolbar chip width. */
    fullWidth = false,
}: {
    value: "income" | "expense"
    onChange: (next: "income" | "expense") => void
    className?: string
    disabled?: boolean
    fullWidth?: boolean
}) {
    return (
        <div
            className={cn(
                fullWidth
                    ? "flex h-9 w-full min-w-0 items-stretch rounded-lg bg-muted/60 p-0.5 ring-1 ring-border/60 md:h-8 dark:bg-muted/40"
                    : transactionSegmentContainerClassName,
                className,
            )}
            role="tablist"
            aria-label="Tipo de lançamento"
        >
            <ButtonGroup
                className={cn(
                    "h-full min-h-0 gap-0.5",
                    fullWidth ? "flex w-full min-w-0 md:w-full" : "w-full md:w-auto",
                )}
            >
                {FORM_TYPE_TABS.map((tab) => {
                    const selected = value === tab.value
                    return (
                        <Button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            size="sm"
                            variant="ghost"
                            className={cn(
                                transactionSegmentTabClassName(selected),
                                fullWidth && "md:min-w-0 md:flex-1",
                            )}
                            disabled={disabled}
                            onClick={() => onChange(tab.value)}
                        >
                            {tab.label}
                        </Button>
                    )
                })}
            </ButtonGroup>
        </div>
    )
}

export function TransactionTypeSegment({
    value,
    onChange,
    className,
    includeAll = true,
}: {
    value: TransactionFilterType
    onChange: (next: TransactionFilterType) => void
    className?: string
    includeAll?: boolean
}) {
    const tabs = includeAll ? FILTER_TABS : FILTER_TABS.filter((tab) => tab.value !== "all")
    return (
        <div
            className={cn(transactionSegmentContainerClassName, className)}
            role="tablist"
            aria-label="Filtrar por tipo de lançamento"
        >
            <ButtonGroup className="h-full min-h-0 w-full gap-0.5 md:w-auto">
                {tabs.map((tab) => {
                    const selected = value === tab.value
                    return (
                        <Button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            size="sm"
                            variant="ghost"
                            className={transactionSegmentTabClassName(selected)}
                            onClick={() => onChange(tab.value)}
                        >
                            {tab.label}
                        </Button>
                    )
                })}
            </ButtonGroup>
        </div>
    )
}
