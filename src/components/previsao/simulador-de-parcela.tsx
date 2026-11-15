"use client"

import { useMemo, useState, type FormEvent } from "react"

import { useQuickCreateTransaction } from "@/components/layout/quick-actions"
import { ImpactoDaParcela } from "@/components/transactions/impacto-da-parcela"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import { FieldRow } from "@/components/ui/field"
import { Form, FormActions, FormControl, FormField, FormInput, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { splitTotalAcrossInstallments } from "@/lib/installment-amounts"
import type { PlanoProposto } from "@/lib/previsao/impacto-parcela"
import type { CreditCard } from "@/lib/supabase"

const SEM_CARTAO = "sem-cartao"
const MIN_PARCELAS = 2
const MAX_PARCELAS = 48

/** "E se eu parcelar?": simula uma compra parcelada contra a previsão. Não grava nada. */
export function SimuladorDeParcela({ cartoes, hojeYmd }: { cartoes: CreditCard[]; hojeYmd: string }) {
    const abrirLancamento = useQuickCreateTransaction()
    const [valor, setValor] = useState("")
    const [total, setTotal] = useState<number | null>(null)
    const [parcelas, setParcelas] = useState("")
    const [cartao, setCartao] = useState(SEM_CARTAO)

    const proposto = useMemo((): PlanoProposto | null => {
        const n = Number(parcelas)
        if (!Number.isInteger(n) || n < MIN_PARCELAS || n > MAX_PARCELAS || total == null || total <= 0) return null
        const split = splitTotalAcrossInstallments(total, n)
        if (split.installmentAmount <= 0 || split.finalInstallmentAmount <= 0) return null
        return {
            valorParcela: split.installmentAmount,
            parcelas: n,
            ultimaParcela: split.finalInstallmentAmount,
            primeiraYmd: hojeYmd,
            cardId: cartao === SEM_CARTAO ? null : cartao,
            descricao: "",
        }
    }, [parcelas, total, cartao, hojeYmd])

    // Simula, não grava: a ação abre o formulário de lançamento já em Parcelada.
    function lancar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        abrirLancamento("installment")
    }

    return (
        <Card padding="none">
            <CardToolbar>
                <span className="min-w-0 truncate">E se eu parcelar?</span>
            </CardToolbar>
            <CardContent className="grid gap-4 px-(--card-strip-px) pb-(--card-strip-py)">
                <Form onSubmit={lancar}>
                    <FieldRow>
                        <FormInput
                            money
                            label="Valor total"
                            placeholder="0,00"
                            required
                            value={valor}
                            onValueChange={(v, reais) => {
                                setValor(v)
                                setTotal(reais)
                            }}
                        />
                        <FormInput
                            type="number"
                            inputMode="numeric"
                            label="Parcelas"
                            placeholder="10"
                            required
                            min={MIN_PARCELAS}
                            max={MAX_PARCELAS}
                            step={1}
                            value={parcelas}
                            onChange={(e) => setParcelas(e.target.value)}
                        />
                    </FieldRow>
                    {cartoes.length > 0 ? (
                        <FormField label="Cartão" optional>
                            <Select value={cartao} onValueChange={setCartao}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={SEM_CARTAO} variant="none">
                                        Fora do cartão
                                    </SelectItem>
                                    {cartoes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    ) : null}
                    {proposto ? <ImpactoDaParcela proposto={proposto} /> : null}
                    <FormActions>
                        <FormSubmit>Lançar esta compra</FormSubmit>
                    </FormActions>
                </Form>
            </CardContent>
        </Card>
    )
}
