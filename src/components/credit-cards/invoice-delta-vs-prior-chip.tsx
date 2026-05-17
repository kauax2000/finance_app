"use client"

import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    MinusIcon,
} from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

const pctFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
})

export type InvoiceDeltaDirection = "up" | "down" | "flat"

export type InvoiceDeltaVsPriorMeta = {
    direction: InvoiceDeltaDirection
    pctDisplay: string
    title: string
    ariaLabel: string
}

function deltaPctLabelFromValues(current: number, prior: number): string {
    if (prior === 0 && current === 0) return "—"
    if (prior === 0) return "—"
    const d = ((current - prior) / prior) * 100
    const sign = d > 0 ? "+" : ""
    return `${sign}${pctFmt.format(d)}%`
}

function ariaContextLabel(context: "fatia" | "category"): string {
    if (context === "fatia") {
        return "Variação da fatia em relação à fatura anterior"
    }
    return "Variação em relação à fatura anterior"
}

export function getInvoiceDeltaVsPriorMetaFromValues(
    current: number,
    prior: number,
    options?: { ariaContext?: "fatia" | "category" }
): InvoiceDeltaVsPriorMeta {
    const ariaContext = options?.ariaContext ?? "category"
    const pctDisplay = deltaPctLabelFromValues(current, prior)
    const text = `${pctDisplay} vs. ant.`
    const ariaPrefix = ariaContextLabel(ariaContext)

    if (prior === 0) {
        return {
            direction: current > 0 ? "up" : "flat",
            pctDisplay,
            title: text,
            ariaLabel: `${ariaPrefix}: ${text}`,
        }
    }

    const pct = ((current - prior) / prior) * 100
    if (Math.abs(pct) < 0.05) {
        return {
            direction: "flat",
            pctDisplay,
            title: text,
            ariaLabel: `${ariaPrefix}: ${text}`,
        }
    }

    return {
        direction: current > prior ? "up" : "down",
        pctDisplay,
        title: text,
        ariaLabel: `${ariaPrefix}: ${text}`,
    }
}

export function getInvoiceDeltaVsPriorMetaFromPct(
    deltaPct: number,
    options?: { ariaContext?: "fatia" | "category" }
): InvoiceDeltaVsPriorMeta {
    const ariaContext = options?.ariaContext ?? "category"
    const pctDisplay = formatDeltaPctDisplay(deltaPct)
    const text = `${pctDisplay} vs. ant.`
    const ariaPrefix = ariaContextLabel(ariaContext)

    return {
        direction: deltaDirectionFromPct(deltaPct),
        pctDisplay,
        title: text,
        ariaLabel: `${ariaPrefix}: ${text}`,
    }
}

export function formatDeltaPctDisplay(pct: number): string {
    const sign = pct > 0 ? "+" : ""
    return `${sign}${pctFmt.format(pct)}%`
}

export function deltaDirectionFromPct(pct: number): InvoiceDeltaDirection {
    if (Math.abs(pct) < 0.05) return "flat"
    return pct > 0 ? "up" : "down"
}

export type InvoiceDeltaVsPriorChipProps = {
    deltaPct?: number | null
    /** Raw values for slice-style comparisons (prev === 0 edge cases). */
    current?: number
    prior?: number
    ariaContext?: "fatia" | "category"
    className?: string
}

export function InvoiceDeltaVsPriorChip({
    deltaPct,
    current,
    prior,
    ariaContext = "category",
    className,
}: InvoiceDeltaVsPriorChipProps) {
    const meta =
        current != null && prior != null
            ? getInvoiceDeltaVsPriorMetaFromValues(current, prior, { ariaContext })
            : deltaPct != null
              ? getInvoiceDeltaVsPriorMetaFromPct(deltaPct, { ariaContext })
              : null

    if (!meta) {
        return <span className={cn("tabular-nums", className)}>—</span>
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums",
                meta.direction === "down" &&
                    "text-emerald-700 dark:text-emerald-400",
                meta.direction === "up" && "text-rose-700 dark:text-rose-400",
                meta.direction === "flat" && "text-muted-foreground",
                className
            )}
            title={meta.title}
            aria-label={meta.ariaLabel}
        >
            {meta.direction === "up" ? (
                <ArrowTrendingUpIcon className="size-3 shrink-0" aria-hidden />
            ) : meta.direction === "down" ? (
                <ArrowTrendingDownIcon className="size-3 shrink-0" aria-hidden />
            ) : (
                <MinusIcon className="size-3 shrink-0" aria-hidden />
            )}
            {meta.pctDisplay}
        </span>
    )
}
