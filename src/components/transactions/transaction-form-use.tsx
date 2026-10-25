"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase, type Category, type CreditCard, type Transaction, type TransactionSource } from "@/lib/supabase"
import { enviarAnexo } from "@/lib/anexos"
import { useWorkspace } from "@/components/workspace-provider"
import { useAuth } from "@/components/providers"
import { podeSerPrivado, privadaPresa, privadoDoSalvar } from "@/lib/privado/pode-ser-privado"
import { primeiraParcelaDoPlano } from "@/components/transactions/transaction-form-persistence"
import type { PaymentMethod } from "@/lib/payment-methods"
import {
    calendarYmdToStorageIso,
    localYmdFromDate,
} from "@/lib/transaction-date"
import {
    equalInstallmentsFromPortion,
    splitTotalAcrossInstallments,
} from "@/lib/installment-amounts"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { totalPurchaseFromPlan } from "@/lib/transaction-installment"
import { toastError } from "@/lib/toast"
import {
    origemDaFrase,
    rascunhoDaFrase,
    type CamposDaFrase,
} from "@/lib/captura/frase-no-form"
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"
import { transactionFormTitle } from "@/components/transactions/transaction-form-title"
import {
    DEFAULT_INSTALLMENT_COUNT,
    TRANSACTION_SAVE_TOAST_ID,
    type InstallmentPlanFormSavePayload,
    type InstallmentPlanUpdatePayload,
    type TransactionFormSavePayload,
    type TransactionSaveResult,
    type InstallmentPlanSaveResult,
} from "@/components/transactions/transaction-form-types"

type RecurringMode = "once" | "daily" | "weekly" | "monthly"

function recurringModeToDb(mode: RecurringMode): {
    isRecurring: boolean
    recurringInterval: "daily" | "weekly" | "monthly" | null
} {
    if (mode === "once") {
        return { isRecurring: false, recurringInterval: null }
    }
    return {
        isRecurring: true,
        recurringInterval: mode,
    }
}

function recurringModeFromTransaction(
    isRecurring: boolean,
    interval: "daily" | "weekly" | "monthly" | null
): RecurringMode {
    if (!isRecurring || !interval) return "once"
    if (interval === "daily" || interval === "weekly" || interval === "monthly") {
        return interval
    }
    return "once"
}

/**
 * A fotografia que o `isDirty` compara: só o que a pessoa **escreveu ou
 * escolheu** como dado. A aba (`formKind`), o tipo, o modo de valor da parcela
 * e o escopo da edição ficam de fora — trocá-los num formulário vazio é
 * navegar, e não pode fazer o fechar perguntar "Descartar alterações?".
 */
function fotografar(r: Rascunho): string {
    return JSON.stringify([
        r.amount,
        r.description,
        r.categoryId,
        r.date,
        r.recurringMode,
        r.paymentMethod,
        r.paymentCreditCardId,
        r.estornoCartaoId,
        r.installmentTotal,
        r.installmentPerAmount,
        r.installmentCount,
        r.isPrivate,
    ])
}

/** Os campos do formulário, na ordem da fotografia. */
type Rascunho = {
    formKind: TransactionFormKind
    type: "income" | "expense"
    amount: string
    description: string
    categoryId: string
    date: string
    recurringMode: RecurringMode
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string
    /** Receita que é estorno no cartão: o cartão que ela abate. */
    estornoCartaoId: string | null
    installmentValueMode: "total" | "per_installment"
    installmentTotal: string
    installmentPerAmount: string
    installmentCount: string
    installmentEditScope: "slice" | "plan"
    /** Gasto privado (Bloco 7B). */
    isPrivate: boolean
}

/**
 * A forma de pagamento que vai ao banco. A receita só tem forma no estorno:
 * `credit_card` com o cartão, que abate a fatura (Decisão 6 do Bloco 2).
 */
export function formaDoPayload(a: {
    type: "income" | "expense"
    paymentMethod: PaymentMethod | null
    paymentCreditCardId: string
    estornoCartaoId: string | null
}): { paymentMethod: PaymentMethod | null; paymentCreditCardId: string | null } {
    if (a.type === "income") {
        return a.estornoCartaoId
            ? { paymentMethod: "credit_card", paymentCreditCardId: a.estornoCartaoId }
            : { paymentMethod: null, paymentCreditCardId: null }
    }
    return {
        paymentMethod: a.paymentMethod,
        paymentCreditCardId:
            a.paymentMethod === "credit_card" ? a.paymentCreditCardId || null : null,
    }
}

export type UseTransactionFormArgs = {
    active: boolean
    saving: boolean
    editingTransaction: Transaction | null
    defaultLaunchKind?: TransactionFormKind
    categories: Category[]
    creditCards: CreditCard[]
    categoriesHref: string
    creditCardsHref: string
    onSave: (payload: TransactionFormSavePayload) => Promise<TransactionSaveResult>
    onSaveInstallmentPlan?: (
        payload: InstallmentPlanFormSavePayload
    ) => Promise<InstallmentPlanSaveResult>
    onUpdateInstallmentPlan?: (
        planId: string,
        payload: InstallmentPlanUpdatePayload
    ) => Promise<boolean>
    /** When false, successful save does not call onClose (e.g. detail sheet returns to view). */
    closeOnSuccess?: boolean
    onClose: () => void
    /** Called after any successful save (before onClose when closeOnSuccess). */
    onSuccess?: () => void
    /** Na criação, a frase rápida já escrita (o compartilhar do Android). */
    fraseInicial?: string
    /** Na criação, a foto que a "Foto do recibo" lê ao abrir (o compartilhar do Android). */
    fotoInicial?: File
}

export function useTransactionForm({
    active,
    saving,
    editingTransaction,
    defaultLaunchKind = "expense",
    categories,
    creditCards,
    categoriesHref,
    creditCardsHref,
    onSave,
    onSaveInstallmentPlan,
    onUpdateInstallmentPlan,
    closeOnSuccess = true,
    onClose,
    onSuccess,
    fraseInicial,
    fotoInicial,
}: UseTransactionFormArgs) {
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
    const [creditCardPopoverOpen, setCreditCardPopoverOpen] = useState(false)

    const [formKind, setFormKind] = useState<TransactionFormKind>("expense")
    const [type, setType] = useState<"income" | "expense">("expense")
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [date, setDate] = useState(() => localYmdFromDate(new Date()))
    const [recurringMode, setRecurringMode] = useState<RecurringMode>("once")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
        null
    )
    const [paymentCreditCardId, setPaymentCreditCardId] = useState("")
    const [estornoCartaoId, setEstornoCartaoId] = useState<string | null>(null)
    const [installmentValueMode, setInstallmentValueMode] = useState<
        "total" | "per_installment"
    >("total")
    const [installmentTotal, setInstallmentTotal] = useState("")
    const [installmentPerAmount, setInstallmentPerAmount] = useState("")
    const [installmentCount, setInstallmentCount] = useState(DEFAULT_INSTALLMENT_COUNT)
    const [installmentEditScope, setInstallmentEditScope] = useState<
        "slice" | "plan"
    >("slice")
    const [isPrivate, setIsPrivate] = useState(false)
    // As dúvidas da frase rápida aplicada; `null` sem frase. O salvar leva a
    // origem `quick_text` e a marca de "a conferir" (Decisão 14).
    const [duvidasDaFrase, setDuvidasDaFrase] = useState<string[] | null>(null)
    // Quem preencheu: a frase (`quick_text`) ou a foto do recibo (`share`).
    const [fonteDaFrase, setFonteDaFrase] = useState<TransactionSource>("quick_text")
    // A foto do recibo, já comprimida: vira anexo depois do salvar.
    const [fotoDoRecibo, setFotoDoRecibo] = useState<File | null>(null)
    const { currentWorkspaceId, papel } = useWorkspace()
    // Toda porta de receita (paleta, `?new=receita`, casca) abre a do convidado
    // em despesa: ele só lança despesa (Bloco 7A, Ruling 11).
    const kindInicial: TransactionFormKind =
        papel === "guest" && defaultLaunchKind === "income" ? "expense" : defaultLaunchKind

    const segmentMode: "create" | "edit" = editingTransaction
        ? "edit"
        : "create"

    const hasInstallmentPlan = Boolean(editingTransaction?.installment_plan_id)
    const planRef = editingTransaction?.installment_plan ?? null
    const planIsActive = planRef?.is_active === true

    // A fotografia do rascunho ao abrir: `isDirty` compara o formulário com
    // ela, para o diálogo perguntar antes de descartar o que foi preenchido.
    const [snapshot, setSnapshot] = useState<Rascunho | null>(null)

    /* eslint-disable react-hooks/set-state-in-effect -- hydrate form fields when opening for edit or create */
    useEffect(() => {
        if (!active) {
            setSnapshot(null)
            return
        }
        const p = editingTransaction?.installment_plan
        const v: Rascunho = editingTransaction
            ? {
                  formKind:
                      editingTransaction.type === "income" ? "income" : "expense",
                  type: editingTransaction.type,
                  amount: formatMoneyBrlInput(editingTransaction.amount),
                  description: editingTransaction.description || "",
                  categoryId: editingTransaction.category_id || "",
                  date: localYmdFromDate(new Date(editingTransaction.date)),
                  recurringMode: recurringModeFromTransaction(
                      editingTransaction.is_recurring,
                      editingTransaction.recurring_interval
                  ),
                  paymentMethod:
                      editingTransaction.type === "expense"
                          ? (editingTransaction.payment_method ?? null)
                          : null,
                  paymentCreditCardId:
                      editingTransaction.payment_credit_card_id || "",
                  estornoCartaoId:
                      editingTransaction.type === "income" &&
                      editingTransaction.payment_method === "credit_card"
                          ? (editingTransaction.payment_credit_card_id ?? null)
                          : null,
                  installmentValueMode: "total",
                  installmentTotal: p
                      ? formatMoneyBrlInput(totalPurchaseFromPlan(p))
                      : "",
                  installmentPerAmount: p
                      ? formatMoneyBrlInput(p.installment_amount)
                      : "",
                  installmentCount: p ? String(p.total_installments) : DEFAULT_INSTALLMENT_COUNT,
                  installmentEditScope: "slice",
                  isPrivate: editingTransaction.is_private === true,
              }
            : {
                  formKind: kindInicial,
                  type: kindInicial === "income" ? "income" : "expense",
                  amount: "",
                  description: "",
                  categoryId: "",
                  date: localYmdFromDate(new Date()),
                  recurringMode: "once",
                  // A forma começa vazia em todo tipo, a parcelada inclusive: a
                  // pessoa escolhe, e ao tocar em Crédito o cartão vem escolhido
                  // (`preEscolherCartao`, nos campos).
                  paymentMethod: null,
                  paymentCreditCardId: "",
                  estornoCartaoId: null,
                  installmentValueMode: "total",
                  installmentTotal: "",
                  installmentPerAmount: "",
                  installmentCount: DEFAULT_INSTALLMENT_COUNT,
                  installmentEditScope: "slice",
                  isPrivate: false,
              }
        setFormKind(v.formKind)
        setType(v.type)
        setAmount(v.amount)
        setDescription(v.description)
        setCategoryId(v.categoryId)
        setDate(v.date)
        setRecurringMode(v.recurringMode)
        setPaymentMethod(v.paymentMethod)
        setPaymentCreditCardId(v.paymentCreditCardId)
        setEstornoCartaoId(v.estornoCartaoId)
        setInstallmentValueMode(v.installmentValueMode)
        setInstallmentTotal(v.installmentTotal)
        setInstallmentPerAmount(v.installmentPerAmount)
        setInstallmentCount(v.installmentCount)
        setInstallmentEditScope(v.installmentEditScope)
        setIsPrivate(v.isPrivate)
        setDuvidasDaFrase(null)
        setFotoDoRecibo(null)
        setSnapshot(v)
    }, [active, editingTransaction, kindInicial])
    /* eslint-enable react-hooks/set-state-in-effect */

    /* eslint-disable react-hooks/set-state-in-effect -- sync form type/panels with launch kind and active state */
    useEffect(() => {
        if (!active || editingTransaction) return
        if (formKind === "income") {
            setType("income")
        } else {
            setType("expense")
        }
    }, [formKind, active, editingTransaction])

    useEffect(() => {
        if (!active) {
            setCategoryPopoverOpen(false)
            setCreditCardPopoverOpen(false)
        }
    }, [active])

    useEffect(() => {
        const cat = categories.find((c) => c.id === categoryId)
        if (categoryId && cat && cat.type !== type) {
            setCategoryId("")
        }
    }, [type, categories, categoryId])

    useEffect(() => {
        if (type === "income") {
            setPaymentMethod(null)
            setPaymentCreditCardId("")
        }
    }, [type])
    /* eslint-enable react-hooks/set-state-in-effect */

    const activeCards = useMemo(
        () => creditCards.filter((c) => c.is_active),
        [creditCards]
    )

    const isInstallmentCreate =
        !editingTransaction && formKind === "installment"

    // O "Privado" (Bloco 7B): só na despesa de quem a lançou, e só depois de o
    // papel chegar; na edição de uma privada, também na receita, para dizer
    // por que ela não vale mais. O salvar só manda `is_private` ao marcar ou
    // desmarcar (`privadoDoSalvar`, Ruling 8), e a privada cuja regra deixou
    // de valer segura o salvar (`privadaPresa`, Ruling 10).
    const { user } = useAuth()
    const autorId = editingTransaction?.user_id ?? user?.id ?? ""
    const eraPrivada = editingTransaction?.is_private === true
    const regraDoPrivado =
        (type === "expense" || eraPrivada) &&
        papel != null &&
        Boolean(user) &&
        autorId === user?.id &&
        (!editingTransaction || editingTransaction.is_private !== undefined)
            ? podeSerPrivado({
                  papel,
                  metodo: paymentMethod,
                  cartao: creditCards.find((c) => c.id === paymentCreditCardId) ?? null,
                  autorId,
                  receita: type === "income",
                  vinculado:
                      formKind === "installment" ||
                      Boolean(editingTransaction?.installment_plan_id || editingTransaction?.subscription_id),
              })
            : null
    const motivoDaPresa = privadaPresa({ marcado: isPrivate, regra: regraDoPrivado, eraPrivada })

    const isInstallmentPlanEdit =
        Boolean(editingTransaction?.installment_plan_id) &&
        segmentMode === "edit" &&
        installmentEditScope === "plan"

    const syncFieldsForInstallmentScope = useCallback(
        (next: "slice" | "plan") => {
            if (!editingTransaction) return
            if (next === "plan" && editingTransaction.installment_plan) {
                const p = editingTransaction.installment_plan
                setDescription(p.description ?? "")
                setCategoryId(p.category_id ?? "")
                setPaymentMethod(p.payment_method ?? null)
                setPaymentCreditCardId(p.payment_credit_card_id ?? "")
                if (p.next_billing_date) {
                    const d = new Date(p.next_billing_date + "T12:00:00")
                    if (!Number.isNaN(d.getTime())) {
                        setDate(localYmdFromDate(d))
                    }
                }
            } else {
                setDescription(editingTransaction.description ?? "")
                setCategoryId(editingTransaction.category_id ?? "")
                setPaymentMethod(
                    editingTransaction.type === "expense"
                        ? (editingTransaction.payment_method ?? null)
                        : null
                )
                setPaymentCreditCardId(
                    editingTransaction.payment_credit_card_id ?? ""
                )
                setDate(localYmdFromDate(new Date(editingTransaction.date)))
            }
        },
        [editingTransaction]
    )

    const setInstallmentScope = useCallback(
        (next: "slice" | "plan") => {
            syncFieldsForInstallmentScope(next)
            setInstallmentEditScope(next)
        },
        [syncFieldsForInstallmentScope]
    )

    /**
     * Preenche os campos pela frase (`rascunhoDaFrase`). Com parcelas, a
     * criação vai para a Parcelada; o estorno é a receita com o cartão.
     */
    const preencher = useCallback((c: CamposDaFrase, fonte: TransactionSource) => {
        const r = rascunhoDaFrase(c)
        setFormKind(r.formKind)
        setType(r.type)
        setAmount(r.amount)
        setInstallmentValueMode(r.installmentValueMode)
        setInstallmentTotal(r.installmentTotal)
        setInstallmentPerAmount("")
        setInstallmentCount(r.installmentCount)
        setDescription(r.description)
        setDate(r.date)
        setCategoryId(r.categoryId)
        setPaymentMethod(r.paymentMethod)
        setPaymentCreditCardId(r.paymentCreditCardId)
        setEstornoCartaoId(r.estornoCartaoId)
        setDuvidasDaFrase(c.duvidas)
        setFonteDaFrase(fonte)
    }, [])
    const aplicarFrase = useCallback((c: CamposDaFrase) => preencher(c, "quick_text"), [preencher])
    const aplicarFoto = useCallback((c: CamposDaFrase) => preencher(c, "share"), [preencher])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isInstallmentCreate) {
            if (
                paymentMethod === "credit_card" &&
                activeCards.length > 0 &&
                !paymentCreditCardId
            ) {
                toastError("Selecione o cartão de crédito usado nesta compra", { id: TRANSACTION_SAVE_TOAST_ID })
                return
            }
        }

        if (isInstallmentCreate) {
            if (!onSaveInstallmentPlan) {
                toastError(
                    "Não foi possível salvar o plano parcelado (configuração incompleta)",
                    { id: TRANSACTION_SAVE_TOAST_ID }
                )
                return
            }

            const n = Math.floor(Number.parseInt(installmentCount, 10))
            if (!Number.isFinite(n) || n < 2) {
                toastError("Informe pelo menos 2 parcelas", { id: TRANSACTION_SAVE_TOAST_ID })
                return
            }

            let installmentAmount = 0
            let finalInstallmentAmount = 0

            if (installmentValueMode === "total") {
                const total = parseMoneyBrl(installmentTotal)
                if (total === null || total <= 0) {
                    toastError("Informe um valor total válido em reais", { id: TRANSACTION_SAVE_TOAST_ID })
                    return
                }
                const split = splitTotalAcrossInstallments(total, n)
                installmentAmount = split.installmentAmount
                finalInstallmentAmount = split.finalInstallmentAmount
                if (installmentAmount <= 0 || finalInstallmentAmount <= 0) {
                    toastError("Não foi possível dividir o valor nas parcelas", { id: TRANSACTION_SAVE_TOAST_ID })
                    return
                }
            } else {
                const per = parseMoneyBrl(installmentPerAmount)
                if (per === null || per <= 0) {
                    toastError("Informe o valor de cada parcela em reais", { id: TRANSACTION_SAVE_TOAST_ID })
                    return
                }
                const eq = equalInstallmentsFromPortion(per, n)
                installmentAmount = eq.installmentAmount
                finalInstallmentAmount = eq.finalInstallmentAmount
            }

            const pm = paymentMethod
            const pcc =
                paymentMethod === "credit_card"
                    ? paymentCreditCardId || null
                    : null

            const plano = await onSaveInstallmentPlan({
                categoryId: categoryId || null,
                description: description.trim() ? description.trim() : null,
                firstBillingYmd: date,
                paymentMethod: pm,
                paymentCreditCardId: pcc,
                totalInstallments: n,
                installmentAmount,
                finalInstallmentAmount,
                ...origemDaFrase(duvidasDaFrase, false, categoryId, fonteDaFrase),
            })

            if (plano) {
                // A foto vai para a 1ª parcela lançada do plano.
                const planId = plano.planId
                if (fotoDoRecibo) {
                    anexarFotoDoRecibo(fotoDoRecibo, planId ? () => primeiraParcelaDoPlano(supabase, planId) : null)
                }
                onSuccess?.()
                if (closeOnSuccess) onClose()
            }
            return
        }

        if (isInstallmentPlanEdit) {
            if (!onUpdateInstallmentPlan || !editingTransaction?.installment_plan_id) {
                toastError(
                    "Não foi possível atualizar o plano parcelado (configuração incompleta)",
                    { id: TRANSACTION_SAVE_TOAST_ID }
                )
                return
            }
            if (
                paymentMethod === "credit_card" &&
                activeCards.length > 0 &&
                !paymentCreditCardId
            ) {
                toastError("Selecione o cartão de crédito usado nesta compra", { id: TRANSACTION_SAVE_TOAST_ID })
                return
            }

            const plan = editingTransaction.installment_plan
            const gen = plan?.generated_count ?? 0

            const n = Math.floor(Number.parseInt(installmentCount, 10))
            if (!Number.isFinite(n) || n < 2) {
                toastError("Informe pelo menos 2 parcelas", { id: TRANSACTION_SAVE_TOAST_ID })
                return
            }
            if (n < gen) {
                toastError(
                    `O número de parcelas não pode ser menor que ${gen} (já geradas no plano)`,
                    { id: TRANSACTION_SAVE_TOAST_ID }
                )
                return
            }

            let installmentAmount = 0
            let finalInstallmentAmount = 0

            if (installmentValueMode === "total") {
                const total = parseMoneyBrl(installmentTotal)
                if (total === null || total <= 0) {
                    toastError("Informe um valor total válido em reais", { id: TRANSACTION_SAVE_TOAST_ID })
                    return
                }
                const split = splitTotalAcrossInstallments(total, n)
                installmentAmount = split.installmentAmount
                finalInstallmentAmount = split.finalInstallmentAmount
                if (installmentAmount <= 0 || finalInstallmentAmount <= 0) {
                    toastError("Não foi possível dividir o valor nas parcelas", { id: TRANSACTION_SAVE_TOAST_ID })
                    return
                }
            } else {
                const per = parseMoneyBrl(installmentPerAmount)
                if (per === null || per <= 0) {
                    toastError("Informe o valor de cada parcela em reais", { id: TRANSACTION_SAVE_TOAST_ID })
                    return
                }
                const eq = equalInstallmentsFromPortion(per, n)
                installmentAmount = eq.installmentAmount
                finalInstallmentAmount = eq.finalInstallmentAmount
            }

            const pm = paymentMethod
            const pcc =
                paymentMethod === "credit_card"
                    ? paymentCreditCardId || null
                    : null

            const nextBillingYmd = planIsActive ? date : null

            const ok = await onUpdateInstallmentPlan(
                editingTransaction.installment_plan_id,
                {
                    categoryId: categoryId || null,
                    description: description.trim() ? description.trim() : null,
                    paymentMethod: pm,
                    paymentCreditCardId: pcc,
                    totalInstallments: n,
                    installmentAmount,
                    finalInstallmentAmount,
                    nextBillingYmd,
                }
            )

            if (ok) {
                onSuccess?.()
                if (closeOnSuccess) onClose()
            }
            return
        }

        const parsed = parseMoneyBrl(amount)
        if (parsed === null || parsed <= 0) {
            toastError("Informe um valor válido em reais", { id: TRANSACTION_SAVE_TOAST_ID })
            return
        }

        const { isRecurring, recurringInterval } = recurringModeToDb(recurringMode)

        if (
            type === "expense" &&
            paymentMethod === "credit_card" &&
            activeCards.length > 0 &&
            !paymentCreditCardId
        ) {
            toastError("Selecione o cartão de crédito usado nesta despesa", { id: TRANSACTION_SAVE_TOAST_ID })
            return
        }

        if (motivoDaPresa) {
            toastError(motivoDaPresa, { id: TRANSACTION_SAVE_TOAST_ID })
            return
        }

        const { paymentMethod: pm, paymentCreditCardId: pcc } = formaDoPayload({
            type,
            paymentMethod,
            paymentCreditCardId,
            estornoCartaoId,
        })

        const salvo = await onSave({
            editingId: editingTransaction?.id ?? null,
            categoryId: categoryId || null,
            type,
            amount: parsed,
            description: description.trim() ? description.trim() : null,
            dateIso: calendarYmdToStorageIso(date),
            isRecurring,
            recurringInterval,
            paymentMethod: pm,
            paymentCreditCardId: pcc,
            isPrivate: privadoDoSalvar({
                marcado: isPrivate,
                regra: regraDoPrivado,
                eraPrivada,
            }),
            ...origemDaFrase(duvidasDaFrase, Boolean(editingTransaction), categoryId, fonteDaFrase),
        })

        if (salvo) {
            const id = salvo.id
            if (fotoDoRecibo && !editingTransaction) {
                anexarFotoDoRecibo(fotoDoRecibo, id ? async () => id : null)
            }
            onSuccess?.()
            if (closeOnSuccess) onClose()
        }
    }

    /**
     * A foto do recibo vira anexo depois do lançamento salvo, sem segurar o
     * fechar; falhando, o lançamento fica. Sem `id` (salvo offline), avisa.
     */
    function anexarFotoDoRecibo(foto: File, lancamento: (() => Promise<string | null>) | null) {
        // Uma foto anexa um lançamento só, mesmo com o formulário aberto.
        setFotoDoRecibo(null)
        if (!currentWorkspaceId) {
            toastError("Sem carteira: a foto não foi anexada.")
            return
        }
        if (!lancamento) {
            toastError("Sem conexão: a foto não foi anexada.")
            return
        }
        const workspaceId = currentWorkspaceId
        void (async () => {
            const id = await lancamento()
            if (!id) {
                toastError("A foto não foi anexada: a compra ainda não tem parcela lançada.")
                return
            }
            const r = await enviarAnexo(supabase, { workspaceId }, foto, { transactionId: id })
            if (!r.ok) toastError(r.erro)
        })().catch((erro: unknown) => {
            console.error("anexo da foto do recibo:", erro)
            toastError("Não foi possível anexar a foto.")
        })
    }

    const showFooter = true

    const fieldsProps = {
        segmentMode,
        formKind,
        setFormKind,
        type,
        setType,
        amount,
        setAmount,
        description,
        setDescription,
        categoryId,
        setCategoryId,
        dateYmd: date,
        setDateYmd: setDate,
        paymentMethod,
        setPaymentMethod,
        paymentCreditCardId,
        setPaymentCreditCardId,
        estornoCartaoId,
        setEstornoCartaoId,
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        categoryPopoverOpen,
        setCategoryPopoverOpen,
        creditCardPopoverOpen,
        setCreditCardPopoverOpen,
        installmentValueMode,
        setInstallmentValueMode,
        installmentTotal,
        setInstallmentTotal,
        installmentPerAmount,
        setInstallmentPerAmount,
        installmentCount,
        setInstallmentCount,
        hasInstallmentPlan,
        installmentEditScope,
        setInstallmentEditScope: setInstallmentScope,
        planIsActive,
        fraseInicial,
        aplicarFrase,
        fotoInicial,
        aplicarFoto,
        setFotoDoRecibo,
        isPrivate,
        setIsPrivate,
        regraDoPrivado,
        eraPrivada,
    }

    const formTitle = transactionFormTitle({
        editing: Boolean(editingTransaction),
        formKind,
        type,
        hasInstallmentPlan,
        installmentEditScope,
    })

    const formDescription = editingTransaction
        ? installmentEditScope === "plan" && hasInstallmentPlan
            ? "Altera o plano; parcelas já lançadas no extrato não mudam automaticamente."
            : "Atualize os dados da transação"
        : formKind === "installment"
          ? "Só as parcelas aparecem no extrato; o total só orienta o cálculo."
          : "Adicione uma nova receita ou despesa"

    const needsCreditCard =
        paymentMethod === "credit_card" &&
        activeCards.length > 0 &&
        !paymentCreditCardId

    const submitDisabled =
        saving ||
        motivoDaPresa != null ||
        (needsCreditCard &&
            (isInstallmentCreate ||
                isInstallmentPlanEdit ||
                type === "expense"))

    const atual: Rascunho = {
        formKind,
        type,
        amount,
        description,
        categoryId,
        date,
        recurringMode,
        paymentMethod,
        paymentCreditCardId,
        estornoCartaoId,
        installmentValueMode,
        installmentTotal,
        installmentPerAmount,
        installmentCount,
        installmentEditScope,
        isPrivate,
    }
    // A foto escolhida também é rascunho: fechar pergunta "Descartar alterações?".
    const isDirty =
        active &&
        snapshot !== null &&
        (fotografar(atual) !== fotografar(snapshot) || fotoDoRecibo !== null)

    return {
        handleSubmit,
        fieldsProps,
        formTitle,
        formDescription,
        showFooter,
        submitDisabled,
        isDirty,
    }
}