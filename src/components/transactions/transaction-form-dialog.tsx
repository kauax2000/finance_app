"use client"

import { useEffect, useMemo, useState } from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { useLancamentoInteligente } from "@/hooks/use-lancamento-inteligente"
import type { Category, CreditCard, Transaction } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { TransactionFormSurface } from "@/components/transactions/transaction-form-surface"
import { LancamentoInteligente } from "@/components/transactions/lancamento-inteligente"
import { useLeituraDoLancamento } from "@/components/transactions/use-leitura-do-lancamento"
import { useTransactionForm } from "@/components/transactions/transaction-form-use"
import type { TransactionFormKind } from "@/components/transactions/transaction-type-segment"
import type {
    InstallmentPlanFormSavePayload,
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
    TransactionSaveResult,
    InstallmentPlanSaveResult,
} from "@/components/transactions/transaction-form-types"

export type {
    InstallmentPlanFormSavePayload,
    InstallmentPlanUpdatePayload,
    TransactionFormSavePayload,
    TransactionSaveResult,
    InstallmentPlanSaveResult,
} from "@/components/transactions/transaction-form-types"

type TransactionFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingTransaction: Transaction | null
    /** When opening for create (no `editingTransaction`), initial tab. */
    defaultLaunchKind?: TransactionFormKind
    categories: Category[]
    creditCards: CreditCard[]
    categoriesHref: string
    creditCardsHref: string
    saving: boolean
    onSave: (payload: TransactionFormSavePayload) => Promise<TransactionSaveResult>
    onSaveInstallmentPlan?: (
        payload: InstallmentPlanFormSavePayload
    ) => Promise<InstallmentPlanSaveResult>
    onUpdateInstallmentPlan?: (
        planId: string,
        payload: InstallmentPlanUpdatePayload
    ) => Promise<boolean>
    /** Na criação, a frase já escrita (o compartilhar do Android): abre a paleta com ela. */
    fraseInicial?: string
    /** Na criação, a foto que a paleta lê ao abrir (o compartilhar do Android). */
    fotoInicial?: File
}

export function TransactionFormDialog({
    open,
    onOpenChange,
    editingTransaction,
    defaultLaunchKind = "expense",
    categories,
    creditCards,
    categoriesHref,
    creditCardsHref,
    saving,
    onSave,
    onSaveInstallmentPlan,
    onUpdateInstallmentPlan,
    fraseInicial,
    fotoInicial,
}: TransactionFormDialogProps) {
    const isMobile = useIsMobile()

    const form = useTransactionForm({
        active: open,
        saving,
        editingTransaction,
        defaultLaunchKind,
        categories,
        creditCards,
        categoriesHref,
        creditCardsHref,
        onSave,
        onSaveInstallmentPlan,
        onUpdateInstallmentPlan,
        closeOnSuccess: true,
        onClose: () => onOpenChange(false),
    })

    const { handleSubmit, fieldsProps, formTitle, formDescription, showFooter, submitDisabled, isDirty } = form

    // A paleta é a criação de quem ligou o lançamento inteligente (ou de quem
    // chegou com uma frase ou foto compartilhada); editar segue no formulário,
    // e quem pediu Receita ou Parcelada (⌘K) escolheu o formulário.
    // O hook da leitura e o do formulário moram aqui, uma vez só: "Abrir
    // formulário completo" troca a casca e os campos lidos já estão nele.
    const [ligado] = useLancamentoInteligente()
    const [usarFormulario, setUsarFormulario] = useState(false)
    if (!open && usarFormulario) setUsarFormulario(false)
    // O lançamento inteligente é do telefone: no laptop e no desktop a criação
    // é sempre o formulário, ligado ou não (pedido do dono, 28/10). O
    // compartilhar do Android só chega no telefone.
    const usarPaleta =
        !editingTransaction &&
        isMobile &&
        ((ligado && defaultLaunchKind === "expense") || Boolean(fraseInicial || fotoInicial)) &&
        !usarFormulario

    // Estáveis: cada troca relê a frase.
    const cartoes = useMemo(
        () =>
            creditCards
                .filter((c) => c.is_active)
                .map((c) => ({ ...c, wallet_alias: c.wallet_alias ?? null })),
        [creditCards]
    )
    const leitura = useLeituraDoLancamento({
        form,
        ativo: usarPaleta && open,
        cartoes,
        categorias: categories,
        fraseInicial,
        fotoInicial,
    })
    // O diálogo fica montado entre uma paleta e outra: fechada, a leitura zera.
    // Aberta com uma frase compartilhada nova, ela entra no campo e já é lida.
    const { setTexto, interpretar, reiniciar } = leitura
    useEffect(() => {
        if (!open) reiniciar()
        else if (fraseInicial) {
            setTexto(fraseInicial)
            interpretar(fraseInicial)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reiniciar, setTexto e interpretar são recriados a cada render
    }, [open, fraseInicial])

    // Uma casca só: diálogo no desktop, gaveta alta no telefone. O
    // `isMobile` sobra só para escolher a variante do miolo, que no telefone
    // trava a rolagem com um seletor aberto. A descrição é `sr-only` nas três.
    //
    // Salvar com sucesso fecha pelo `onClose` do hook, que chama o
    // `onOpenChange` da tela direto — fora do `Dialog` —, e por isso não
    // pergunta "Descartar alterações?".
    if (usarPaleta) {
        return (
            <LancamentoInteligente
                open={open}
                onOpenChange={onOpenChange}
                leitura={leitura}
                form={form}
                cartoes={cartoes}
                onAbrirFormulario={() => setUsarFormulario(true)}
                saving={saving}
            />
        )
    }

    return (
        <Dialog
            surface="auto"
            pending={saving}
            dirty={isDirty}
            confirmDiscard
            open={open}
            onOpenChange={onOpenChange}
        >
            {/* O teto de altura sobe a 42rem (o diálogo lê `--dialog-max-h`, que
                existe para isso): com as fichas da forma de pagamento a despesa
                passa dos 36rem e rolava numa tela que tem espaço. */}
            <DialogContent
                layout="fixed"
                showCloseButton={false}
                className="[--dialog-max-h:min(90dvh,42rem)]"
            >
                <TransactionFormSurface
                    variant={isMobile ? "dialog-mobile" : "dialog-desktop"}
                    handleSubmit={handleSubmit}
                    fieldsProps={fieldsProps}
                    formTitle={formTitle}
                    formDescription={formDescription}
                    showFooter={showFooter}
                    submitDisabled={submitDisabled}
                    saving={saving}
                />
            </DialogContent>
        </Dialog>
    )
}
