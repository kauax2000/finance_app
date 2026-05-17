"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const currency = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function isMomFlat(now: number, prev: number): boolean {
    if (prev <= 0) return false
    const rel = Math.abs(now - prev) / prev
    return rel <= 0.05
}

function MomComparisonBadge({ now, prev }: { now: number; prev: number }) {
    const base = "max-w-full min-w-0 shrink-0 px-2 py-0.5 text-[11px] font-medium"

    if (prev <= 0 && now <= 0) {
        const label = "Sem gasto"
        return (
            <Badge variant="secondary" className={base}>
                {label}
            </Badge>
        )
    }

    if (prev <= 0 && now > 0) {
        const full = "Novo gasto"
        return (
            <Badge variant="expense" title={full} aria-label={full} className={base}>
                Novo
            </Badge>
        )
    }

    if (isMomFlat(now, prev)) {
        const full = "Estável vs mês anterior"
        return (
            <Badge variant="warning" title={full} aria-label={full} className={base}>
                Estável
            </Badge>
        )
    }

    if (now < prev) {
        const drop = prev - now
        const pct = ((drop / prev) * 100).toFixed(0)
        const full = `−${pct}% vs mês anterior`
        return (
            <Badge variant="success" title={full} aria-label={full} className={base}>
                −{pct}%
            </Badge>
        )
    }

    if (now > prev) {
        const rise = now - prev
        const pct = ((rise / prev) * 100).toFixed(0)
        const full = `+${pct}% vs mês anterior`
        return (
            <Badge variant="expense" title={full} aria-label={full} className={base}>
                +{pct}%
            </Badge>
        )
    }

    const full = "Igual ao mês anterior"
    return (
        <Badge variant="secondary" title={full} aria-label={full} className={base}>
            Igual
        </Badge>
    )
}

export function ExpenseCategoryCard({
    category,
    spent,
    posted,
    projectedInstallments,
    projectedSubscriptions,
    previousSpent,
    limit,
    totalMonthSpend,
    spendRank,
    categoriesWithPositiveSpend,
    href,
    onEdit,
    onDelete,
}: {
    category: { id: string; name: string; icon: string | null; color: string | null }
    spent: number
    posted: number
    projectedInstallments: number
    projectedSubscriptions: number
    previousSpent: number
    limit: number
    totalMonthSpend: number
    spendRank: number
    categoriesWithPositiveSpend: number
    href: string
    onEdit: () => void
    onDelete: () => void
}) {
    const color = category.color || "#EF4444"
    const hasBudget = limit > 0
    const over = hasBudget && spent > limit
    const near = hasBudget && !over && limit > 0 && spent / limit >= 0.85
    const budgetPctRounded = hasBudget
        ? Math.min(100, Math.max(0, Math.round((spent / limit) * 100)))
        : 0

    const sharePct = totalMonthSpend > 0 ? Math.min(100, (spent / totalMonthSpend) * 100) : 0

    const shareInsight = (() => {
        if (totalMonthSpend <= 0) {
            return "Nenhuma despesa no mês"
        }
        const base = `${sharePct.toFixed(0)}% das despesas do mês`
        if (spent <= 0) return base
        if (categoriesWithPositiveSpend > 1) {
            return `${base} · ${spendRank}ª maior`
        }
        return `${base} · única com gasto`
    })()

    const projectedTotal = projectedInstallments + projectedSubscriptions
    const showBreakdown = projectedTotal > 0

    const breakdownTitle = showBreakdown
        ? [
              `Registrado ${currency(posted)}`,
              `Previsto ${currency(projectedTotal)}`,
              projectedInstallments > 0 ? `Parcelas ${currency(projectedInstallments)}` : null,
              projectedSubscriptions > 0 ? `Assinaturas ${currency(projectedSubscriptions)}` : null,
          ]
              .filter(Boolean)
              .join(" · ")
        : undefined

    const budgetBarLabel = hasBudget
        ? `Uso do orçamento na categoria ${category.name}: ${budgetPctRounded}% de ${currency(limit)}${over ? ", acima do limite" : ""}`
        : undefined

    const shareBarLabel =
        totalMonthSpend > 0
            ? `Participação da categoria ${category.name} nas despesas do mês: ${sharePct.toFixed(
                  0
              )}%`
            : `Participação da categoria ${category.name} nas despesas do mês: 0%`

    const budgetFillColor = over
        ? "var(--destructive)"
        : near
          ? "#F59E0B"
          : "#10B981"

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
                                "relative col-start-1 row-start-1 flex h-9 w-9 shrink-0 items-center justify-center self-start overflow-hidden rounded-md",
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

                        <div className="col-start-2 row-start-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 self-center pr-1">
                            <CardTitle
                                className={cn(
                                    "min-w-0 text-base leading-snug",
                                    "line-clamp-2 text-balance @min-[360px]/card-header:line-clamp-1 @min-[360px]/card-header:truncate",
                                )}
                            >
                                {category.name}
                            </CardTitle>
                        </div>

                        <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-1.5 self-start">
                            <MomComparisonBadge now={spent} prev={previousSpent} />
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
                    </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3 bg-card pb-3 pt-3">
                    <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-2xl font-bold tabular-nums tracking-tight">{currency(spent)}</p>
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
                    {showBreakdown ? (
                        <p
                            className="-mt-2 text-xs leading-relaxed text-muted-foreground"
                            title={breakdownTitle}
                        >
                            Registrado{" "}
                            <span className="tabular-nums">{currency(posted)}</span>{" "}
                            <span className="text-muted-foreground/70">·</span>{" "}
                            +{" "}
                            <span className="tabular-nums">{currency(projectedTotal)}</span>{" "}
                            previstos
                        </p>
                    ) : (
                        <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
                            Sem previsões no mês
                        </p>
                    )}
                    <div className="space-y-1">
                        {hasBudget ? (
                            <>
                                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                    <span className="min-w-0 truncate">{shareInsight}</span>
                                    <span className="shrink-0 tabular-nums font-medium text-foreground">
                                        {budgetPctRounded}%
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={budgetPctRounded}
                                    aria-label={budgetBarLabel}
                                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                >
                                    <div
                                        className="h-full max-w-full rounded-full transition-[width] duration-300 ease-out"
                                        style={{
                                            width: `${budgetPctRounded}%`,
                                            backgroundColor: budgetFillColor,
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                    <span className="min-w-0 truncate">
                                        <span className="font-medium text-foreground/80">
                                            Sem orçamento
                                        </span>{" "}
                                        · Participação
                                    </span>
                                    <span className="shrink-0 tabular-nums font-medium text-foreground">
                                        {sharePct.toFixed(0)}%
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(sharePct)}
                                    aria-label={shareBarLabel}
                                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                >
                                    <div
                                        className="h-full max-w-full rounded-full bg-muted-foreground/35 transition-[width] duration-300 ease-out"
                                        style={{ width: `${sharePct}%` }}
                                    />
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    {shareInsight}
                                </p>
                            </>
                        )}
                    </div>

                </CardContent>
            </Card>
        </Link>
    )
}
