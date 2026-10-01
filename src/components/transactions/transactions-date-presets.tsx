"use client"

import { localYmdFromDate } from "@/lib/transaction-date"
import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

export type TransactionsDatePresetKey =
    | "last7"
    | "last15"
    | "last30"
    | "monthToToday"

function pad2(x: number) {
    return String(x).padStart(2, "0")
}

function startOfCurrentMonth(now: Date) {
    return new Date(now.getFullYear(), now.getMonth(), 1)
}

function startOfLastNDays(now: Date, days: number) {
    const d = new Date(now)
    d.setDate(d.getDate() - Math.max(0, days - 1))
    return d
}

export function getTransactionsPresetRange(
    preset: TransactionsDatePresetKey,
    now: Date = new Date()
): { from: string; to: string } {
    const to = localYmdFromDate(now)
    if (preset === "monthToToday") {
        return { from: localYmdFromDate(startOfCurrentMonth(now)), to }
    }

    const days = preset === "last7" ? 7 : preset === "last15" ? 15 : 30
    return { from: localYmdFromDate(startOfLastNDays(now, days)), to }
}

const PRESETS: Array<{
    key: TransactionsDatePresetKey
    label: string
    sheetLabel: string
}> = [
    { key: "last7", label: "7d", sheetLabel: "Últimos 7 dias" },
    { key: "last15", label: "15d", sheetLabel: "Últimos 15 dias" },
    { key: "last30", label: "30d", sheetLabel: "Últimos 30 dias" },
    { key: "monthToToday", label: "Mês", sheetLabel: "Mês atual" },
]

export function transactionsPresetSummaryLabel(
    preset: TransactionsDatePresetKey
): string {
    const row = PRESETS.find((p) => p.key === preset)
    return row?.sheetLabel ?? preset
}

export function TransactionsDatePresets({
    value,
    onChange,
    className,
    variant = "compact",
}: {
    value: TransactionsDatePresetKey | null
    onChange: (next: {
        preset: TransactionsDatePresetKey
        from: string
        to: string
    }) => void
    className?: string
    variant?: "compact" | "comfortable"
}) {
    const now = React.useMemo(() => new Date(), [])

    const applyPreset = (key: TransactionsDatePresetKey) => {
        const { from, to } = getTransactionsPresetRange(key, now)
        onChange({ preset: key, from, to })
    }

    // Escolha única de período: `ToggleGroup`, com setas e o escolhido
    // anunciado (rodada 199). Eram botões de alternar escritos à mão nas duas
    // formas, com as cores do chip e uma sombra crua. Nenhum aceso é um estado válido — o
    // intervalo personalizado —, e tocar no aceso não desmarca.
    const comum = {
        type: "single" as const,
        value: value ?? "",
        onValueChange: (next: string) =>
            applyPreset(next as TransactionsDatePresetKey),
        "aria-label": "Filtros rápidos de período",
    }

    if (variant === "comfortable") {
        return (
            <ToggleGroup
                {...comum}
                variant="chip"
                size="sm"
                className={cn("flex-wrap justify-start gap-1.5", className)}
            >
                {PRESETS.map((p) => (
                    <ToggleGroupItem key={p.key} value={p.key}>
                        {p.sheetLabel}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        )
    }

    // A bandeja da barra: o segmentado, com o marcador que desliza.
    return (
        <ToggleGroup
            {...comum}
            variant="segmented"
            size="sm"
            className={cn("shrink-0", className)}
        >
            {PRESETS.map((p) => (
                <ToggleGroupItem key={p.key} value={p.key} title={p.sheetLabel}>
                    {p.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

