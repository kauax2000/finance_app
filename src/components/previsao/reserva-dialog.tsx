"use client"

import { useState, type FormEvent } from "react"

import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormCancel, FormError, FormInput, FormSubmit } from "@/components/ui/form"
import { useWorkspace } from "@/components/workspace-provider"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

const SO_O_DONO = "Só quem é dono da carteira altera a reserva."

/** "Editar reserva": `workspaces.monthly_savings_target`, que só o dono altera (política de `update` de `workspaces`). */
export function ReservaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { currentWorkspaceId } = useWorkspace()
    const [salvando, setSalvando] = useState(false)

    return (
        <Dialog surface="auto" pending={salvando} open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar reserva</DialogTitle>
                    <DialogDescription>O que você separa todo mês antes de gastar. Sai do seguro para gastar.</DialogDescription>
                </DialogHeader>
                {/* Remonta por carteira: o rascunho de uma não pode ser gravado na outra. */}
                <CampoDaReserva
                    key={currentWorkspaceId ?? "nenhuma"}
                    salvando={salvando}
                    onSalvando={setSalvando}
                    onSalvo={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

function CampoDaReserva({
    salvando,
    onSalvando,
    onSalvo,
}: {
    salvando: boolean
    onSalvando: (v: boolean) => void
    onSalvo: () => void
}) {
    const { currentWorkspace, refreshWorkspaces } = useWorkspace()
    const atual = currentWorkspace?.monthly_savings_target
    const [valor, setValor] = useState(atual != null ? formatMoneyBrlInput(Number(atual)) : "")
    const [erro, setErro] = useState<string | null>(null)

    async function salvar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!currentWorkspace) return
        // Vazio grava `null` (sem reserva); 0 grava 0.
        const vazio = valor.trim() === ""
        const reais = vazio ? null : parseMoneyBrl(valor)
        if (!vazio && reais == null) {
            setErro("Digite um valor em reais, como 500,00.")
            return
        }
        onSalvando(true)
        setErro(null)
        try {
            const { data, error } = await supabase
                .from("workspaces")
                .update({ monthly_savings_target: reais })
                .eq("id", currentWorkspace.id)
                .select("id")
            if (error) setErro(formatSupabasePostgrestError(error) ?? "Não foi possível salvar a reserva.")
            // A política devolve zero linhas, sem erro, para quem não é dono.
            else if (!data?.length) setErro(SO_O_DONO)
            else {
                await refreshWorkspaces()
                onSalvo()
            }
        } finally {
            onSalvando(false)
        }
    }

    return (
        <Form layout="none" pending={salvando} onSubmit={salvar} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-3">
                <FormInput
                    money
                    label="Reserva do mês"
                    placeholder="0,00"
                    autoFocus
                    value={valor}
                    onValueChange={(v) => setValor(v)}
                />
                <FormError>{erro}</FormError>
            </DialogBody>
            <DialogFooter>
                <DialogClose asChild>
                    <FormCancel>Cancelar</FormCancel>
                </DialogClose>
                <FormSubmit>Salvar</FormSubmit>
            </DialogFooter>
        </Form>
    )
}
