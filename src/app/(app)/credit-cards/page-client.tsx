"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { toastError, toastSuccess, toastWarning } from "@/lib/toast"
import { CustomForm } from "@/components/ui/form"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { CreditCardsEmptyState } from "@/components/credit-cards/credit-cards-empty-state"
import { CreditCardTile } from "@/components/credit-cards/credit-card-tile"
import { CreditCardsPageSkeleton } from "@/components/credit-cards/credit-cards-page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import {
    CreditCardsViewSegment,
    type CreditCardsPageView,
} from "@/components/credit-cards/credit-cards-view-segment"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormHeaderCloseButton,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { CreditCardFormFields } from "@/components/credit-cards/credit-card-form-fields"
import { parseExpiryFields } from "@/components/credit-cards/credit-card-form-shared"
import { resolveCreditCardForSave } from "@/lib/credit-card-number"
import { buildCardCycleSnapshot } from "@/lib/credit-card-billing"
import type { CcTxRow } from "@/lib/credit-cards-workspace-transactions"
import { invalidateWorkspaceData } from "@/lib/queries/invalidate-workspace-data"
import { useCreditCardsPageBundle } from "@/lib/queries/use-credit-cards-page-bundle"
import { Plus } from "lucide-react"

const CreditCardsHistoryChart = dynamic(
    () =>
        import("@/components/credit-cards/credit-cards-history-chart").then(
            (m) => ({ default: m.CreditCardsHistoryChart }),
        ),
    {
        ssr: false,
        loading: () => (
            <div className="flex aspect-video w-full items-center justify-center rounded-md border border-border/60 p-4">
                <Skeleton className="h-40 w-full max-w-md rounded-lg" />
            </div>
        ),
    },
)

export default function CreditCardsPageClient() {
    const queryClient = useQueryClient()
    const isMobile = useIsMobile()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const bundleQuery = useCreditCardsPageBundle(
        !authLoading && !workspaceLoading && currentWorkspaceId
            ? currentWorkspaceId
            : null,
        Boolean(user && !authLoading && !workspaceLoading),
    )
    const bundle = bundleQuery.data
    const cards = useMemo(() => bundle?.cards ?? [], [bundle?.cards])
    const ccTransactions = useMemo<CcTxRow[]>(
        () => bundle?.ccTransactions ?? [],
        [bundle?.ccTransactions],
    )
    const installmentPlans = useMemo(
        () => bundle?.installmentPlans ?? [],
        [bundle?.installmentPlans],
    )
    const creditCardsTableMissing = bundle?.creditCardsTableMissing ?? false
    const loading =
        authLoading ||
        workspaceLoading ||
        (Boolean(user && currentWorkspaceId) && bundleQuery.isPending)
    const [saving, setSaving] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [createFormKey, setCreateFormKey] = useState(0)
    const didConsumeNewQuery = useRef(false)
    const [pageView, setPageView] = useState<CreditCardsPageView>("cards")

    const [name, setName] = useState("")
    const [cardNumber, setCardNumber] = useState("")
    const [closingDay, setClosingDay] = useState("")
    const [dueDay, setDueDay] = useState("")
    const [creditLimit, setCreditLimit] = useState("")
    const [expiryMonth, setExpiryMonth] = useState("")
    const [expiryYear, setExpiryYear] = useState("")

    const canCreateCard =
        !authLoading &&
        !workspaceLoading &&
        !loading &&
        Boolean(user && currentWorkspaceId) &&
        !creditCardsTableMissing

    useEffect(() => {
        didConsumeNewQuery.current = false
    }, [currentWorkspaceId])

    useEffect(() => {
        if (authLoading || workspaceLoading || loading) return
        if (createOpen) return
        if (didConsumeNewQuery.current) return
        if (searchParams.get("new") !== "1") return

        didConsumeNewQuery.current = true

        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("new")
        const qs = nextParams.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })

        requestAnimationFrame(() => {
            setCreateFormKey((k) => k + 1)
            setCreateOpen(true)
        })
    }, [
        authLoading,
        workspaceLoading,
        loading,
        createOpen,
        pathname,
        router,
        searchParams,
    ])

    const snapshots = useMemo(() => {
        const today = new Date()
        const map = new Map<string, ReturnType<typeof buildCardCycleSnapshot>>()
        for (const c of cards) {
            map.set(
                c.id,
                buildCardCycleSnapshot(c, ccTransactions, today, {
                    installmentPlans,
                })
            )
        }
        return map
    }, [cards, ccTransactions, installmentPlans])

    const resetCreateForm = () => {
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
        const insertRow = {
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
        }
        const { error } = await supabase.from("credit_cards").insert(insertRow)
        setSaving(false)

        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível cadastrar o cartão."
            )
            return
        }

        toastSuccess("Cartão cadastrado.")
        resetCreateForm()
        setCreateOpen(false)
        if (currentWorkspaceId) {
            void invalidateWorkspaceData(queryClient, currentWorkspaceId, {
                domains: ["credit_cards", "credit_card_expense_rows", "installment_plans"],
            })
        }
    }

    if (authLoading || workspaceLoading || loading) {
        return <CreditCardsPageSkeleton />
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
                <h1 className="text-lg font-semibold tracking-tight">
                    Cartões de crédito
                </h1>
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
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 md:flex-wrap md:gap-3">
                <CreditCardsViewSegment
                    value={pageView}
                    onChange={setPageView}
                    className="min-w-0 flex-1 md:max-w-full md:flex-none"
                />
                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="inline-flex size-10 shrink-0 rounded-lg p-0 text-xs md:size-auto md:h-8 md:w-auto md:gap-2 md:px-3"
                    aria-label="Novo cartão"
                    disabled={!canCreateCard}
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="size-4 shrink-0" />
                    <span className="hidden md:inline">Novo cartão</span>
                </Button>
            </div>

            {pageView === "cards" ? (
                cards.length === 0 ? (
                    <CreditCardsEmptyState onAddCard={() => setCreateOpen(true)} />
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {cards.map((c) => (
                            <CreditCardTile
                                key={c.id}
                                card={c}
                                snapshot={snapshots.get(c.id)}
                            />
                        ))}
                    </div>
                )
            ) : (
                <CreditCardsHistoryChart
                    cards={cards.filter((c) => c.is_active)}
                    transactions={ccTransactions}
                    installmentPlans={installmentPlans}
                    monthsBack={12}
                />
            )}

            {isMobile ? (
                <Sheet
                    open={createOpen}
                    onOpenChange={(o) => {
                        if (!o && saving) return
                        if (o) setCreateFormKey((k) => k + 1)
                        setCreateOpen(o)
                        if (!o && !saving) resetCreateForm()
                    }}
                >
                    <SheetContent
                        side="bottom"
                        fillMobileViewport
                        showCloseButton={false}
                        className={mobileFormSheetContentClassName}
                    >
                        <MobileSheetFormDragStrip />
                        <MobileSheetFormStickyHeader
                            title="Cadastro de cartão"
                            endAdornment={
                                <MobileSheetFormHeaderCloseButton disabled={saving} />
                            }
                        />
                        <CustomForm
                            onSubmit={handleCreate}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-4">
                                <div className="space-y-3 pb-2">
                                    <CreditCardFormFields
                                        formKey={`create-${createFormKey}`}
                                        idPrefix="cc-new"
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
                                </div>
                            </div>
                            <SheetFooter className="mt-0 shrink-0 gap-2 border-t border-border/60 px-4 pt-4">
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-10 w-full"
                                    disabled={saving}
                                >
                                    {saving ? "Salvando…" : "Cadastrar"}
                                </Button>
                            </SheetFooter>
                        </CustomForm>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog
                    open={createOpen}
                    onOpenChange={(o) => {
                        if (o) setCreateFormKey((k) => k + 1)
                        setCreateOpen(o)
                        if (!o && !saving) resetCreateForm()
                    }}
                >
                    <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                        <CustomForm
                            onSubmit={handleCreate}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                                <DialogTitle>Cadastro de cartão</DialogTitle>
                                <DialogDescription>
                                    Dados para identificar o cartão nas despesas (não armazenamos o
                                    número completo).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="min-h-0 flex-1 overflow-y-auto px-6">
                                <div className="space-y-3 pb-2">
                                    <CreditCardFormFields
                                        formKey={`create-${createFormKey}`}
                                        idPrefix="cc-new"
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
                                </div>
                            </div>
                            <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-b-xl border-t border-border/60 bg-background px-6 pt-4 pb-5 sm:gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setCreateOpen(false)
                                        resetCreateForm()
                                    }}
                                    disabled={saving}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Salvando…" : "Cadastrar"}
                                </Button>
                            </DialogFooter>
                        </CustomForm>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
