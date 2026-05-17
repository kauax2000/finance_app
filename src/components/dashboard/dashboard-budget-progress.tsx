"use client"

import { BanknotesIcon } from "@heroicons/react/24/outline"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

export function DashboardBudgetProgress({
    rows,
}: {
    rows: {
        budgetId: string
        categoryId: string
        name: string
        color: string | null
        spent: number
        cap: number
        pct: number
    }[]
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Orçamentos do mês</CardTitle>
                <CardDescription>
                    Gasto vs. teto no mês da data final do período
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                            <BanknotesIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Nenhum orçamento para este mês. Defina em Categorias.
                        </p>
                    </div>
                ) : (
                    rows.map((r) => {
                        const over = r.spent > r.cap
                        return (
                            <div key={r.budgetId} className="space-y-2">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="flex min-w-0 items-center gap-2 font-medium">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    r.color?.trim() ||
                                                    "color-mix(in oklch, var(--muted-foreground) 35%, transparent)",
                                            }}
                                            aria-hidden
                                        />
                                        <span className="truncate">{r.name}</span>
                                    </span>
                                    <span
                                        className={cn(
                                            "shrink-0 tabular-nums text-xs",
                                            over
                                                ? "font-semibold text-amber-700 dark:text-amber-300"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {currencyFmt.format(r.spent)} /{" "}
                                        {currencyFmt.format(r.cap)}
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(100, r.pct)}
                                    className={cn(
                                        "h-2",
                                        over && "[&>div]:bg-amber-600"
                                    )}
                                />
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}
