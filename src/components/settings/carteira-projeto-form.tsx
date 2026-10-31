"use client"

import { useState, type FormEvent } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import { DatePicker } from "@/components/ui/date-picker"
import { DialogBody, DialogFooter } from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormError, FormField, FormInput, FormSubmit } from "@/components/ui/form"
import { currencyBRL } from "@/lib/formatters"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { AINDA_NAO_DISPONIVEL, editarCarteiraProjeto } from "@/lib/projetos/dados"
import { camposDaCarteiraProjeto } from "@/lib/projetos/modelos"
import type { Workspace } from "@/lib/supabase"
import { NADA_MUDOU } from "@/lib/supabase-errors"
import { toastSuccess } from "@/lib/toast"
import { formatYmdPtBr, localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"

/** O dia do calendário em hora local: `new Date("YYYY-MM-DD")` cairia no dia anterior no Brasil. */
export const ymdParaData = parseYmdLocal

/** O texto de apoio da linha "Datas e orçamento". */
export function resumoDoCalendario(w: Pick<Workspace, "starts_on" | "ends_on" | "budget_total">): string {
    const periodo =
        w.starts_on || w.ends_on
            ? `${w.starts_on ? formatYmdPtBr(w.starts_on) : "…"} a ${w.ends_on ? formatYmdPtBr(w.ends_on) : "…"}`
            : null
    const orcamento = w.budget_total != null ? currencyBRL(Number(w.budget_total)) : null
    return [periodo, orcamento].filter(Boolean).join(" · ") || "Sem datas"
}

/**
 * As datas e o orçamento total da carteira de projeto (spec §12: "datas e
 * orçamento total, sem ciclo"), nas Configurações e no passo depois de criar
 * uma carteira de um modelo de projeto. `onPendente` deixa o `Dialog` de quem
 * monta segurar o fechar enquanto salva.
 */
export function CarteiraProjetoForm({
    workspace,
    onSalvo,
    onCancelar,
    onPendente,
    cancelarLabel,
}: {
    workspace: Workspace
    onSalvo: () => void
    onCancelar: () => void
    onPendente?: (pendente: boolean) => void
    cancelarLabel: string
}) {
    const { refreshWorkspaces } = useWorkspace()
    const [inicio, setInicio] = useState(workspace.starts_on ?? "")
    const [fim, setFim] = useState(workspace.ends_on ?? "")
    const [orcamento, setOrcamento] = useState(workspace.budget_total != null ? formatMoneyBrlInput(Number(workspace.budget_total)) : "")
    const [erro, setErro] = useState<string | null>(null)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const r = camposDaCarteiraProjeto({ inicio, fim, orcamento })
        if (!r.ok) return setErro(r.erro)
        onPendente?.(true)
        setErro(null)
        try {
            const salvo = await editarCarteiraProjeto(workspace.id, r.campos)
            if (!salvo.disponivel) setErro(AINDA_NAO_DISPONIVEL)
            else if (!salvo.dados?.length) setErro(NADA_MUDOU)
            else {
                await refreshWorkspaces()
                toastSuccess("Salvo.")
                onSalvo()
            }
        } catch (falha) {
            setErro(falha instanceof Error ? falha.message : "Não foi possível salvar.")
        } finally {
            onPendente?.(false)
        }
    }

    return (
        <CustomForm onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="flex flex-col gap-4">
                <FormField label="Começa em" optional>
                    <DatePicker
                        clearable
                        value={ymdParaData(inicio)}
                        onChange={(d) => setInicio(d ? localYmdFromDate(d) : "")}
                    />
                </FormField>
                <FormField label="Termina em" optional>
                    <DatePicker
                        clearable
                        min={ymdParaData(inicio)}
                        value={ymdParaData(fim)}
                        onChange={(d) => setFim(d ? localYmdFromDate(d) : "")}
                    />
                </FormField>
                <FormInput
                    money
                    label="Orçamento total em R$"
                    optional
                    placeholder="0,00"
                    value={orcamento}
                    onValueChange={(valor) => setOrcamento(valor)}
                />
                <FormError>{erro}</FormError>
            </DialogBody>
            <DialogFooter>
                <FormCancel onClick={onCancelar}>{cancelarLabel}</FormCancel>
                <FormSubmit>Salvar</FormSubmit>
            </DialogFooter>
        </CustomForm>
    )
}
