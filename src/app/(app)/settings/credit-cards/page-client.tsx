"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CreditCard } from "@/lib/supabase"
import {
    formatSupabasePostgrestError,
    isPostgrestRelationMissingError,
} from "@/lib/supabase-errors"
import { toastError, toastSuccess, toastWarning } from "@/lib/toast"
import { ROUTES } from "@/config/navigation"
import { CustomForm } from "@/components/ui/form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { CreditCardFormFields } from "@/components/credit-cards/credit-card-form-fields"
import { parseExpiryFields } from "@/components/credit-cards/credit-card-form-shared"
import { Button } from "@/components/ui/button"
import { resolveCreditCardForSave } from "@/lib/credit-card-number"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline"

export default function CreditCardsPageClient() {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const [cards, setCards] = useState<CreditCard[]>([])
    const [loading, setLoading] = useState(true)
    const [creditCardsTableMissing, setCreditCardsTableMissing] =
        useState(false)
    const [saving, setSaving] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<CreditCard | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [createFormKey, setCreateFormKey] = useState(0)
    const [name, setName] = useState("")
    const [cardNumber, setCardNumber] = useState("")
    const [closingDay, setClosingDay] = useState("")
    const [dueDay, setDueDay] = useState("")
    const [creditLimit, setCreditLimit] = useState("")
    const [expiryMonth, setExpiryMonth] = useState("")
    const [expiryYear, setExpiryYear] = useState("")

    const load = useCallback(async () => {
        if (!user || !currentWorkspaceId) return
        setLoading(true)
        const { data, error } = await supabase
            .from("credit_cards")
            .select("*")
            .eq("workspace_id", currentWorkspaceId)
            .order("name")
        if (error) {
            if (isPostgrestRelationMissingError(error)) {
                setCreditCardsTableMissing(true)
                setCards([])
            } else {
                setCreditCardsTableMissing(false)
                toastError(
                    formatSupabasePostgrestError(error) ??
                        "Não foi possível carregar os cartões."
                )
                setCards([])
            }
        } else {
            setCreditCardsTableMissing(false)
            setCards(data ?? [])
        }
        setLoading(false)
    }, [user, currentWorkspaceId])

    useEffect(() => {
        if (authLoading || workspaceLoading) return
        if (!user || !currentWorkspaceId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync loading when workspace unavailable
            setLoading(false)
            return
        }
        void load()
    }, [authLoading, workspaceLoading, user, currentWorkspaceId, load])

    const resetForm = () => {
        setCreateFormKey((k) => k + 1)
        setName("")
        setCardNumber("")
        setClosingDay("")
        setDueDay("")
        setCreditLimit("")
        setExpiryMonth("")
        setExpiryYear("")
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !currentWorkspaceId) return

        const resolved = resolveCreditCardForSave({
            digits: cardNumber,
            mode: "create",
        })
        if (!resolved.ok) {
            toastError(resolved.message)
            return
        }
        if (resolved.luhnWarning) {
            toastWarning(
                "O número informado pode estar incorreto. Verifique os dígitos."
            )
        }
        const closeN = parseInt(closingDay, 10)
        const dueN = parseInt(dueDay, 10)
        if (
            Number.isNaN(closeN) ||
            closeN < 1 ||
            closeN > 31 ||
            Number.isNaN(dueN) ||
            dueN < 1 ||
            dueN > 31
        ) {
            toastError("Dia de fechamento e vencimento devem ser entre 1 e 31.")
            return
        }

        const exp = parseExpiryFields(expiryMonth, expiryYear)
        if (!exp.ok) {
            toastError(exp.message)
            return
        }

        setSaving(true)
        const limitVal = creditLimit.trim()
            ? parseFloat(creditLimit.replace(",", "."))
            : null
        const { error } = await supabase.from("credit_cards").insert({
            workspace_id: currentWorkspaceId,
            user_id: user.id,
            name: name.trim(),
            last_four: resolved.lastFour,
            brand: resolved.brand,
            closing_day: closeN,
            due_day: dueN,
            credit_limit:
                limitVal !== null && !Number.isNaN(limitVal) ? limitVal : null,
            is_active: true,
            ...(exp.month != null && exp.year != null
                ? { expiry_month: exp.month, expiry_year: exp.year }
                : {}),
        })
        setSaving(false)

        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível cadastrar o cartão."
            )
            return
        }

        toastSuccess("Cartão cadastrado.")
        resetForm()
        void load()
    }

    const confirmDelete = async () => {
        if (!pendingDelete) return
        setDeleting(true)
        const { error } = await supabase
            .from("credit_cards")
            .delete()
            .eq("id", pendingDelete.id)
        setDeleting(false)
        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível excluir o cartão."
            )
            return
        }
        toastSuccess("Cartão removido.")
        setPendingDelete(null)
        void load()
    }

    if (authLoading || workspaceLoading || loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
                <div className="h-32 animate-pulse rounded-xl bg-muted/60" />
            </div>
        )
    }

    if (!user || !currentWorkspaceId) {
        return (
            <p className="text-sm text-muted-foreground">
                Escolha uma carteira para gerenciar cartões.
            </p>
        )
    }

    if (creditCardsTableMissing) {
        return (
            <div className="space-y-4">
                <div className="hidden items-center gap-2 md:flex">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={ROUTES.SETTINGS} aria-label="Voltar às configurações">
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Cartões de crédito
                    </h1>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Tabela ainda não criada no banco
                        </CardTitle>
                        <CardDescription className="space-y-3">
                            <p>
                                O Supabase retornou o erro PGRST205: a tabela{" "}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                                    public.credit_cards
                                </code>{" "}
                                não está no cache do PostgREST (normalmente a migração ainda
                                não foi aplicada).
                            </p>
                            <ol className="list-inside list-decimal space-y-2 text-foreground">
                                <li>
                                    No projeto Supabase, abra o SQL Editor e execute o arquivo
                                    de migração{" "}
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                        supabase/migrations/20260403140000_credit_cards_payment.sql
                                    </code>{" "}
                                    do repositório (ou rode{" "}
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                        supabase db push
                                    </code>
                                    ).
                                </li>
                                <li>
                                    Recarregue o schema do PostgREST: no SQL Editor execute{" "}
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                        NOTIFY pgrst, &apos;reload schema&apos;;
                                    </code>
                                    , ou em Dashboard → Settings → API use a opção de recarregar
                                    o schema, se disponível.
                                </li>
                            </ol>
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={ROUTES.SETTINGS} aria-label="Voltar às configurações">
                        <ArrowLeftIcon className="size-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold tracking-tight">
                    Cartões de crédito
                </h1>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Novo cartão</CardTitle>
                    <CardDescription>
                        Dados para identificar o cartão nas despesas (não armazenamos o
                        número completo).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CustomForm onSubmit={handleCreate} className="space-y-3">
                        <CreditCardFormFields
                            formKey={`settings-create-${createFormKey}`}
                            idPrefix="cc-settings"
                            name={name}
                            onNameChange={setName}
                            cardNumber={cardNumber}
                            onCardNumberChange={setCardNumber}
                            closingDay={closingDay}
                            onClosingDayChange={setClosingDay}
                            dueDay={dueDay}
                            onDueDayChange={setDueDay}
                            creditLimit={creditLimit}
                            onCreditLimitChange={setCreditLimit}
                            expiryMonth={expiryMonth}
                            onExpiryMonthChange={setExpiryMonth}
                            expiryYear={expiryYear}
                            onExpiryYearChange={setExpiryYear}
                        />
                        <Button type="submit" size="sm" disabled={saving}>
                            {saving ? "Salvando…" : "Cadastrar cartão"}
                        </Button>
                    </CustomForm>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Seus cartões</CardTitle>
                    <CardDescription>
                        Cartões disponíveis ao lançar despesas no cartão de crédito.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {cards.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhum cartão cadastrado ainda.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
                            {cards.map((c) => (
                                <li
                                    key={c.id}
                                    className="flex items-center justify-between gap-3 px-3 py-3 first:rounded-t-xl last:rounded-b-xl"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {c.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            •••• {c.last_four}
                                            {c.brand ? ` · ${c.brand}` : ""} · fecha{" "}
                                            {c.closing_day} · vence {c.due_day}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0 text-destructive hover:text-destructive"
                                        aria-label={`Excluir ${c.name}`}
                                        onClick={() => setPendingDelete(c)}
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Lançamentos já salvos podem ficar sem vínculo com este
                            cartão. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault()
                                void confirmDelete()
                            }}
                        >
                            {deleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
