"use client"

import Link from "next/link"
import { Card, CardAction, CardContent, CardHeader, CardLink, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Progress, ProgressFooter, ProgressHeader, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { deltaTone } from "@/lib/delta-tone"
import { currencyBRL } from "@/lib/formatters"
import { TILE_EXPENSE_DEFAULT } from "@/lib/tile-palette"

function stopLinkNavigation(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
}

const currency = (n: number) =>
    currencyBRL(n)

function isMomFlat(now: number, prev: number): boolean {
    if (prev <= 0) return false
    const rel = Math.abs(now - prev) / prev
    return rel <= 0.05
}

function MomComparisonBadge({ now, prev }: { now: number; prev: number }) {
    const base = "max-w-full min-w-0 shrink-0 px-2 py-0.5 text-2xs font-medium"

    if (prev <= 0 && now <= 0) {
        const label = "Sem gasto"
        return (
            <Badge tone="neutral" className={base}>
                {label}
            </Badge>
        )
    }

    if (prev <= 0 && now > 0) {
        const full = "Novo gasto"
        return (
            <Badge tone="expense" title={full} aria-label={full} className={base}>
                Novo
            </Badge>
        )
    }

    if (isMomFlat(now, prev)) {
        const full = "Estável vs mês anterior"
        return (
            <Badge tone={deltaTone("flat", "expense")} title={full} aria-label={full} className={base}>
                Estável
            </Badge>
        )
    }

    if (now < prev) {
        const drop = prev - now
        const pct = ((drop / prev) * 100).toFixed(0)
        const full = `−${pct}% vs mês anterior`
        return (
            <Badge tone={deltaTone("down", "expense")} title={full} aria-label={full} className={base}>
                −{pct}%
            </Badge>
        )
    }

    if (now > prev) {
        const rise = now - prev
        const pct = ((rise / prev) * 100).toFixed(0)
        const full = `+${pct}% vs mês anterior`
        return (
            <Badge tone={deltaTone("up", "expense")} title={full} aria-label={full} className={base}>
                +{pct}%
            </Badge>
        )
    }

    const full = "Igual ao mês anterior"
    return (
        <Badge tone="neutral" title={full} aria-label={full} className={base}>
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
    const color = category.color || TILE_EXPENSE_DEFAULT
    const hasBudget = limit > 0
    const over = hasBudget && spent > limit
    // O número ao lado da barra carrega o que o desenho não carrega: a barra
    // satura em 100% e o `Progress` só marca que passou, então quem diz **o
    // quanto** passou é este número. Ele era limitado a 100 junto com a barra,
    // e aí 104% e 400% liam igual nos dois lugares.
    const budgetPctReal = hasBudget
        ? Math.max(0, Math.round((spent / limit) * 100))
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
        ? `Uso do orçamento na categoria ${category.name}: ${budgetPctReal}% de ${currency(limit)}${over ? ", acima do limite" : ""}`
        : undefined

    const shareBarLabel =
        totalMonthSpend > 0
            ? `Participação da categoria ${category.name} nas despesas do mês: ${sharePct.toFixed(
                  0
              )}%`
            : `Participação da categoria ${category.name} nas despesas do mês: 0%`


    return (
        // O cartão inteiro é clicável pelo `CardLink` no título (o link
        // esticado do sistema, rodada 204), e não por um <a> em volta de tudo:
        // o menu ficava dentro de um link, e o aria-label do link apagava o
        // conteúdo do cartão. O casco acende com o cursor e o foco do link, e
        // sobe o menu acima da película.
        <CategoryCardContextMenu
            name={category.name}
            description={`${currency(spent)} no mês`}
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
                    <CardTitle
                        className={cn(
                            "min-w-0 self-center leading-snug",
                            "line-clamp-2 text-balance @min-[360px]/card-header:line-clamp-1 @min-[360px]/card-header:truncate",
                        )}
                    >
                        <CardLink asChild>
                            <Link href={href}>{category.name}</Link>
                        </CardLink>
                    </CardTitle>

                    <CardAction className="flex items-center gap-1.5">
                        <MomComparisonBadge now={spent} prev={previousSpent} />
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
                                    <TrashIcon aria-hidden />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardAction>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
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
                                <Progress
                                    value={spent}
                                    max={limit}
                                    bands={BUDGET_BANDS}
                                    size="sm"
                                    aria-label={budgetBarLabel}
                                    header={
                                        <ProgressHeader>
                                            <span className="min-w-0 truncate text-muted-foreground">
                                                {shareInsight}
                                            </span>
                                            <ProgressValue />
                                        </ProgressHeader>
                                    }
                                />
                            </>
                        ) : (
                            <>
                                <Progress
                                    value={sharePct}
                                    size="sm"
                                    aria-label={shareBarLabel}
                                    header={
                                        <ProgressHeader>
                                            <span className="min-w-0 truncate text-muted-foreground">
                                                <ProgressLabel>Sem orçamento</ProgressLabel> · Participação
                                            </span>
                                            <ProgressValue />
                                        </ProgressHeader>
                                    }
                                    footer={
                                        <ProgressFooter>
                                            <span>{shareInsight}</span>
                                        </ProgressFooter>
                                    }
                                />
                            </>
                        )}
                    </div>

                </CardContent>
        </Card>
        </CategoryCardContextMenu>
    )
}
