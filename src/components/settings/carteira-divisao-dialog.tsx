"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"
import { CustomForm, FormCancel, FormError, FormInput, FormRadioGroup, FormSubmit } from "@/components/ui/form"
import { SpinnerBlock } from "@/components/ui/spinner"
import { P } from "@/components/ui/typography"
import { gravarModo, gravarPesos, lerPesos, lerSaldos, type Adulto } from "@/lib/divisao/dados"
import { lerPeso, pesosDigitados } from "@/lib/divisao/partes"
import { chaves, useAdultos } from "@/lib/divisao/use-adultos"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"
import type { Workspace } from "@/lib/supabase"
import { NADA_MUDOU } from "@/lib/supabase-errors"
import { toastSuccess } from "@/lib/toast"

const MODOS = [
    { value: "pooled", label: "Pote único", description: "O dinheiro é de todos, sem conta de quem deve a quem." },
    { value: "split", label: "Dividida", description: "Cada despesa vira partes entre os adultos, e o Painel mostra quem deve a quem." },
]

/** Sem as partes no banco, "Dividida" não dividiria nada: fica travada, salvo para a carteira que já divide. */
export function opcoesDeModo(partesNoAr: boolean, modoAtual: Workspace["split_mode"]) {
    if (partesNoAr || modoAtual === "split") return MODOS
    return MODOS.map((m) => (m.value === "split" ? { ...m, description: AINDA_NAO_DISPONIVEL, disabled: true } : m))
}

/** O modo da carteira e os pesos de cada adulto. Trocar o modo não apaga nada. */
export function CarteiraDivisaoDialog({
    open,
    onOpenChange,
    workspace,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace: Workspace | null
}) {
    const [pendente, setPendente] = useState(false)

    return (
        <Dialog surface="auto" pending={pendente} open={open} onOpenChange={onOpenChange}>
            <DialogContent layout="fixed">
                <DialogHeader>
                    <DialogTitle>Divisão</DialogTitle>
                </DialogHeader>
                {workspace ? (
                    <ModoEPesos
                        ws={workspace}
                        pendente={pendente}
                        onPendente={setPendente}
                        onSalvo={() => onOpenChange(false)}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

type AcoesDoFormulario = {
    pendente: boolean
    onPendente: (pendente: boolean) => void
    onSalvo: () => void
}

function ModoEPesos({ ws, ...acoes }: { ws: Workspace } & AcoesDoFormulario) {
    const { lista, erro } = useAdultos(ws.id)
    const pesos = useQuery({ queryKey: chaves.pesos(ws.id), queryFn: () => lerPesos(ws.id) })
    // `saldos_da_carteira` nasce com as partes: quando a migração subir, a opção se solta.
    const partes = useQuery({ queryKey: ["divisao", "partes-no-ar", ws.id], queryFn: () => lerSaldos(ws.id) })
    if (erro || pesos.isError) {
        return (
            <DialogBody>
                <P>Não foi possível carregar.</P>
            </DialogBody>
        )
    }
    if (!lista.length || pesos.isLoading || partes.isLoading) {
        return (
            <DialogBody>
                <SpinnerBlock label="Carregando…" />
            </DialogBody>
        )
    }
    const salvos = pesos.data?.disponivel ? pesos.data.dados : null
    const iniciais = Object.fromEntries(
        lista.map((a) => {
            const p = salvos?.find((x) => x.user_id === a.user_id)
            return [a.user_id, String(p ? Number(p.weight) : 1).replace(".", ",")]
        }),
    )
    return (
        <FormularioDoModo
            key={`${ws.id}:${ws.split_mode}:${JSON.stringify(iniciais)}`}
            ws={ws}
            adultos={lista}
            iniciais={iniciais}
            pesosDisponiveis={salvos != null}
            partesNoAr={partes.data?.disponivel === true}
            {...acoes}
        />
    )
}

function FormularioDoModo({
    ws,
    adultos,
    iniciais,
    pesosDisponiveis,
    partesNoAr,
    pendente,
    onPendente,
    onSalvo,
}: {
    ws: Workspace
    adultos: Adulto[]
    iniciais: Record<string, string>
    pesosDisponiveis: boolean
    partesNoAr: boolean
} & AcoesDoFormulario) {
    const { refreshWorkspaces } = useWorkspace()
    const queryClient = useQueryClient()
    const [modo, setModo] = useState<"pooled" | "split">(ws.split_mode ?? "pooled")
    const [valores, setValores] = useState(iniciais)
    const [erro, setErro] = useState<string | null>(null)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const pesos = pesosDigitados(valores)
        if (modo === "split" && pesosDisponiveis && !pesos) return setErro("Cada peso precisa ser maior que zero.")
        // Só o que mudou vai ao banco (Ruling 8).
        const mudados = (pesos ?? []).filter((p) => lerPeso(iniciais[p.user_id] ?? "1") !== p.weight)
        onPendente(true)
        setErro(null)
        try {
            // Pesos primeiro: se falharem, o modo não muda e nada fica pela metade.
            if (modo === "split" && mudados.length) {
                const r = await gravarPesos(ws.id, mudados)
                if (!r.disponivel) return setErro(AINDA_NAO_DISPONIVEL)
            }
            if (modo !== ws.split_mode) {
                const r = await gravarModo(ws.id, modo)
                if (!r.disponivel) return setErro(AINDA_NAO_DISPONIVEL)
                if (!r.dados?.length) return setErro(NADA_MUDOU)
            }
            await Promise.all([
                refreshWorkspaces(),
                queryClient.invalidateQueries({ queryKey: chaves.pesos(ws.id) }),
                queryClient.invalidateQueries({ queryKey: chaves.saldos(ws.id) }),
            ])
            toastSuccess("Salvo.")
            onSalvo()
        } catch (falha) {
            setErro(falha instanceof Error ? falha.message : "Não foi possível salvar.")
        } finally {
            onPendente(false)
        }
    }

    return (
        <CustomForm pending={pendente} onSubmit={(e) => void onSubmit(e)} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="flex flex-col gap-4">
                <FormRadioGroup
                    label="Modo"
                    description="Trocar o modo não apaga nada: as partes ficam guardadas e voltam a valer se a carteira voltar a dividir."
                    options={opcoesDeModo(partesNoAr, ws.split_mode)}
                    value={modo}
                    onValueChange={(valor) => setModo(valor as "pooled" | "split")}
                />
                {modo === "split" ? (
                    <FieldSet>
                        <FieldLegend>Pesos</FieldLegend>
                        {pesosDisponiveis ? null : <P>{AINDA_NAO_DISPONIVEL}</P>}
                        {pesosDisponiveis
                            ? adultos.map((a) => (
                                  <FormInput
                                      key={a.user_id}
                                      label={a.nome}
                                      inputMode="decimal"
                                      value={valores[a.user_id] ?? ""}
                                      onChange={(e) => setValores({ ...valores, [a.user_id]: e.target.value })}
                                  />
                              ))
                            : null}
                        <FieldDescription>
                            Peso 1 para todos é a divisão igual; peso 2 fica com o dobro de peso 1. O convidado não entra: quem
                            é responsável por ele paga. Os pesos novos valem para as despesas novas e para as editadas.
                        </FieldDescription>
                    </FieldSet>
                ) : null}
                <FormError>{erro}</FormError>
            </DialogBody>
            <DialogFooter>
                <DialogClose asChild>
                    <FormCancel>Cancelar</FormCancel>
                </DialogClose>
                <FormSubmit>Salvar</FormSubmit>
            </DialogFooter>
        </CustomForm>
    )
}
