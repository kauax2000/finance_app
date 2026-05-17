"use client"

import { useEffect, useMemo, useState } from "react"
import { ExclamationTriangleIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { CustomForm } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoneyBrlTyping } from "@/lib/money-brl"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    deleteCreditCardCategorySpendAlert,
    fetchCreditCardCategorySpendAlerts,
    insertCreditCardCategorySpendAlert,
    migrateLegacyLocalStorageAlertsIfEmpty,
    type CategorySpendAlert,
} from "@/lib/credit-card-category-alerts"
import type { CategoryComparisonRow } from "@/lib/credit-card-invoice-analytics"
import { supabase } from "@/lib/supabase"
import { toastError } from "@/lib/toast"

export type { CategorySpendAlert } from "@/lib/credit-card-category-alerts"

const selectTriggerClass =
    "h-8 w-full min-w-0 justify-between gap-2 px-2.5 py-0 text-sm font-normal shadow-none data-[size=default]:h-8 [&>svg]:size-4"

export function CreditCardCategoryAlerts({
    workspaceId,
    cardId,
    comparison,
}: {
    workspaceId: string
    cardId: string
    comparison: CategoryComparisonRow[]
}) {
    const { user, loading: authLoading } = useAuth()
    const [alerts, setAlerts] = useState<CategorySpendAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [mutating, setMutating] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [catKey, setCatKey] = useState("")
    const [threshold, setThreshold] = useState("500")

    useEffect(() => {
        if (authLoading) return

        let cancelled = false

        async function run() {
            setLoading(true)
            setLoadError(null)

            const { data, error: fetchErr } =
                await fetchCreditCardCategorySpendAlerts(supabase, cardId)
            if (cancelled) return

            if (fetchErr) {
                setLoadError(fetchErr.message)
                setAlerts([])
                setLoading(false)
                return
            }

            let list = data

            if (user?.id && list.length === 0) {
                await migrateLegacyLocalStorageAlertsIfEmpty({
                    supabase,
                    workspaceId,
                    creditCardId: cardId,
                    userId: user.id,
                    serverAlerts: list,
                })
                const again = await fetchCreditCardCategorySpendAlerts(supabase, cardId)
                if (!cancelled && !again.error) {
                    list = again.data
                }
            }

            if (!cancelled) {
                setAlerts(list)
                setLoading(false)
            }
        }

        void run()
        return () => {
            cancelled = true
        }
    }, [authLoading, workspaceId, cardId, user?.id])

    const categoryOptions = useMemo(() => {
        return comparison.map((c) => ({
            value: c.categoryId ?? "__none__",
            label: c.name,
        }))
    }, [comparison])

    const triggered = useMemo(() => {
        return alerts.filter((a) => {
            const row = comparison.find(
                (c) => (c.categoryId ?? "__none__") === a.categoryKey
            )
            return row != null && row.total >= a.thresholdBrl
        })
    }, [alerts, comparison])

    const parsedThreshold = parseFloat(threshold.replace(",", "."))
    const thresholdValid = !Number.isNaN(parsedThreshold) && parsedThreshold > 0
    const duplicateCategory = alerts.some((a) => a.categoryKey === catKey)
    const canSubmit =
        Boolean(catKey) && thresholdValid && !duplicateCategory && !loading && !mutating

    const addAlert = async () => {
        if (!user?.id) {
            toastError("Entre na conta para criar alertas.")
            return
        }
        if (!canSubmit) return

        setMutating(true)
        const { data, error } = await insertCreditCardCategorySpendAlert(supabase, {
            creditCardId: cardId,
            categoryKey: catKey,
            thresholdBrl: parsedThreshold,
            createdBy: user.id,
        })
        setMutating(false)

        if (error) {
            if (error.code === "23505") {
                toastError("Já existe um alerta para esta categoria.")
            } else {
                toastError("Não foi possível criar o alerta.")
            }
            return
        }
        if (data) {
            setAlerts((prev) => [...prev, data])
            setCatKey("")
        }
    }

    const remove = async (alertId: string) => {
        setMutating(true)
        const { error } = await deleteCreditCardCategorySpendAlert(supabase, alertId)
        setMutating(false)
        if (error) {
            toastError("Não foi possível remover o alerta.")
            return
        }
        setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    }

    const disabledFields = loading || mutating

    return (
        <div className="space-y-5 border-t border-border/50 pt-5">
            <div className="min-w-0 space-y-1">
                <h4 className="text-sm font-semibold tracking-tight text-foreground">
                    Alertas por categoria
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Aviso quando o gasto na fatura aberta ultrapassa o limite. As regras ficam no
                    workspace e sincronizam entre dispositivos.
                </p>
            </div>

            {loadError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {loadError}
                </p>
            ) : null}

            {loading ? (
                <div
                    className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4"
                    aria-busy
                >
                    <div className="h-3 w-2/5 animate-pulse rounded-md bg-muted-foreground/15" />
                    <div className="h-9 w-full animate-pulse rounded-lg bg-muted-foreground/10" />
                </div>
            ) : null}

            {!loading && triggered.length > 0 ? (
                <div
                    className="rounded-xl border border-amber-500/35 bg-amber-500/[0.08] p-4 dark:bg-amber-500/10"
                    role="status"
                >
                    <div className="mb-3 flex items-center gap-2 text-amber-950 dark:text-amber-100">
                        <ExclamationTriangleIcon className="size-4 shrink-0 opacity-90" aria-hidden />
                        <span className="text-sm font-semibold">Limite atingido nesta fatura</span>
                    </div>
                    <ul className="space-y-2 text-sm text-amber-950/90 dark:text-amber-50/95">
                        {triggered.map((a) => {
                            const row = comparison.find(
                                (c) => (c.categoryId ?? "__none__") === a.categoryKey
                            )
                            const name = row?.name ?? a.categoryKey
                            return (
                                <li
                                    key={a.id}
                                    className="flex flex-col gap-0.5 border-t border-amber-500/20 pt-2 first:border-t-0 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                                >
                                    <span className="font-medium">{name}</span>
                                    <span className="tabular-nums text-amber-950/80 dark:text-amber-100/85">
                                        Limite{" "}
                                        {a.thresholdBrl.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })}{" "}
                                        · Total{" "}
                                        {row?.total.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ) : null}

            {!loading && alerts.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Regras ativas</p>
                    <ul
                        className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm"
                        role="list"
                    >
                        {alerts.map((a, i) => {
                            const row = comparison.find(
                                (c) => (c.categoryId ?? "__none__") === a.categoryKey
                            )
                            const name = row?.name ?? a.categoryKey
                            return (
                                <li key={a.id}>
                                    {i > 0 ? <Separator className="bg-border/80" /> : null}
                                    <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Avisar a partir de{" "}
                                                <span className="tabular-nums font-medium text-foreground">
                                                    {a.thresholdBrl.toLocaleString("pt-BR", {
                                                        style: "currency",
                                                        currency: "BRL",
                                                    })}
                                                </span>
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                            disabled={mutating}
                                            aria-label={`Remover alerta de ${name}`}
                                            onClick={() => void remove(a.id)}
                                        >
                                            <TrashIcon className="size-4" />
                                        </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ) : null}

            <CustomForm
                className="rounded-xl border border-border/70 bg-muted/15 p-4 shadow-sm dark:bg-muted/25"
                onSubmit={(e) => {
                    e.preventDefault()
                    void addAlert()
                }}
            >
                <p className="mb-4 text-sm font-medium text-foreground">Nova regra</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(9.5rem,11rem)_auto] sm:items-end sm:gap-x-3 sm:gap-y-2">
                    <div className="flex flex-col gap-2 sm:contents">
                        <Label
                            htmlFor="cc-alert-cat"
                            className="text-xs sm:col-start-1 sm:row-start-1"
                        >
                            Categoria
                        </Label>
                        <div className="min-w-0 sm:col-start-1 sm:row-start-2">
                            <Select
                                value={catKey === "" ? undefined : catKey}
                                onValueChange={setCatKey}
                                disabled={disabledFields}
                            >
                                <SelectTrigger
                                    id="cc-alert-cat"
                                    size="default"
                                    className={selectTriggerClass}
                                >
                                    <SelectValue placeholder="Escolha uma categoria" />
                                </SelectTrigger>
                                <SelectContent
                                    position="popper"
                                    align="start"
                                    className="z-[100] min-w-[var(--radix-select-trigger-width)] max-h-72 p-1"
                                    sideOffset={6}
                                    collisionPadding={12}
                                >
                                    {categoryOptions.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                            className="cursor-pointer py-2 pl-2 pr-8"
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:contents">
                        <Label
                            htmlFor="cc-alert-th"
                            className="text-xs sm:col-start-2 sm:row-start-1"
                        >
                            Limite na fatura aberta
                        </Label>
                        <div className="w-full sm:col-start-2 sm:row-start-2">
                            <Input
                                id="cc-alert-th"
                                inputMode="decimal"
                                placeholder="500,00"
                                value={threshold}
                                disabled={disabledFields}
                                onChange={(e) => setThreshold(formatMoneyBrlTyping(e.target.value))}
                                className="h-8 tabular-nums"
                            />
                        </div>
                    </div>
                    <div className="flex sm:col-start-3 sm:row-start-2 sm:justify-start sm:pt-0">
                        <Button
                            type="submit"
                            variant="default"
                            size="default"
                            className="h-8 w-full gap-1.5 sm:w-auto"
                            disabled={!canSubmit}
                        >
                            <PlusIcon className="size-4" aria-hidden />
                            Adicionar
                        </Button>
                    </div>
                </div>
            </CustomForm>
        </div>
    )
}
