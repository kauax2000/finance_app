"use client"

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { labelYearMonthPt } from "@/lib/budget-month"
import type { InstallmentEndingSoon } from "@/lib/credit-card-invoice-analytics"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

/** Matches :root --primary; Bar fill cannot use var() in SVG. */
const primaryBarFill = "#1f6a59"

export function DashboardInstallmentsProjection({
    budgetReleaseByMonth,
    endingSoon,
}: {
    budgetReleaseByMonth: { monthKey: string; amount: number }[]
    endingSoon: InstallmentEndingSoon[]
}) {
    const chartData = budgetReleaseByMonth.map((r) => ({
        ...r,
        label: labelYearMonthPt(r.monthKey),
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Liberação por fim de parcelas</CardTitle>
                <CardDescription>
                    Valor estimado “liberado” quando parcelamentos encerram (próximos
                    meses)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-border/60"
                            />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                className="text-[10px] text-muted-foreground"
                            />
                            <YAxis
                                tickLine={false}
                                className="text-[10px] text-muted-foreground"
                                tickFormatter={(v) =>
                                    Number(v).toLocaleString("pt-BR", {
                                        notation: "compact",
                                        maximumFractionDigits: 0,
                                    })
                                }
                            />
                            <Tooltip
                                formatter={(value) =>
                                    currencyFmt.format(Number(value ?? 0))
                                }
                            />
                            <Bar
                                dataKey="amount"
                                name="Liberado"
                                fill={primaryBarFill}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        Sem parcelamentos ativos com projeção.
                    </p>
                )}

                <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Encerrando em breve
                    </p>
                    {endingSoon.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhum plano com poucas parcelas restantes.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {endingSoon.map((p) => (
                                <li
                                    key={p.planId}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                                >
                                    <span className="min-w-0 flex-1 truncate font-medium">
                                        {p.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {p.remainingCount} rest. · próx.{" "}
                                        {p.nextBilling
                                            .split("-")
                                            .reverse()
                                            .join("/")}
                                    </span>
                                    <span className="tabular-nums text-sm font-semibold">
                                        {currencyFmt.format(p.monthlyAmount)}
                                        /mês
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
