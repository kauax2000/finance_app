"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"
import { FormInput } from "@/components/ui/form"
import { SpinnerBlock } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Muted, P } from "@/components/ui/typography"
import { gravarModo, gravarPesos, lerPesos, lerSaldos, type Adulto } from "@/lib/divisao/dados"
import { lerPeso, pesosDigitados } from "@/lib/divisao/partes"
import { chaves, useAdultos } from "@/lib/divisao/use-adultos"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"
import type { Workspace } from "@/lib/supabase"
import { NADA_MUDOU } from "@/lib/supabase-errors"

type Modo = "pooled" | "split"

const MODOS = [
    { value: "pooled", label: "Pote único", description: "O dinheiro é de todos, sem conta de quem deve a quem." },
    { value: "split", label: "Dividida", description: "Cada despesa vira partes entre os adultos, e o Painel mostra quem deve a quem." },
]

/** Sem as partes no banco, "Dividida" não dividiria nada: fica travada, salvo para a carteira que já divide. */
export function opcoesDeModo(partesNoAr: boolean, modoAtual: Workspace["split_mode"]) {
    if (partesNoAr || modoAtual === "split") return MODOS
    return MODOS.map((m) => (m.value === "split" ? { ...m, description: AINDA_NAO_DISPONIVEL, disabled: true } : m))
}

export type DivisaoEditavel = ReturnType<typeof useDivisaoEditavel>

/**
 * O modo da carteira e os pesos de cada adulto, editados dentro do "Editar
 * carteira" e gravados no mesmo Salvar. Trocar o modo não apaga nada. Sem `ws`,
 * nada é lido.
 */
export function useDivisaoEditavel(ws: Workspace | null) {
    const id = ws?.id ?? ""
    const { refreshWorkspaces } = useWorkspace()
    const queryClient = useQueryClient()
    const { lista: adultos, erro: erroAdultos } = useAdultos(id)
    const pesos = useQuery({ queryKey: chaves.pesos(id), queryFn: () => lerPesos(id), enabled: ws != null })
    // `saldos_da_carteira` nasce com as partes: quando a migração subir, a opção se solta.
    const partes = useQuery({ queryKey: ["divisao", "partes-no-ar", id], queryFn: () => lerSaldos(id), enabled: ws != null })

    // O que a pessoa mexeu; o resto vem do banco. Trocar de carteira esquece tudo.
    const [deQuem, setDeQuem] = useState(id)
    const [modoEscolhido, setModoEscolhido] = useState<Modo | null>(null)
    const [editados, setEditados] = useState<Record<string, string>>({})
    if (deQuem !== id) {
        setDeQuem(id)
        setModoEscolhido(null)
        setEditados({})
    }

    const salvos = pesos.data?.disponivel ? pesos.data.dados : null
    const iniciais: Record<string, string> = Object.fromEntries(
        adultos.map((a) => {
            const p = salvos?.find((x) => x.user_id === a.user_id)
            return [a.user_id, String(p ? Number(p.weight) : 1).replace(".", ",")]
        }),
    )
    const valores = { ...iniciais, ...editados }
    const modoSalvo: Modo = ws?.split_mode ?? "pooled"
    const modo = modoEscolhido ?? modoSalvo
    const pesosDisponiveis = salvos != null

    /** O erro que impede salvar, antes de gravar qualquer coisa. */
    function validar(): string | null {
        if (modo === "split" && pesosDisponiveis && !pesosDigitados(valores)) return "Cada peso precisa ser maior que zero."
        return null
    }

    /** Grava só o que mudou: pesos primeiro, para o modo não mudar com os pesos pela metade. */
    async function salvar(): Promise<string | null> {
        if (!ws) return null
        const digitados = pesosDigitados(valores) ?? []
        const mudados = digitados.filter((p) => lerPeso(iniciais[p.user_id] ?? "1") !== p.weight)
        if (modo === "split" && mudados.length) {
            const r = await gravarPesos(ws.id, mudados)
            if (!r.disponivel) return AINDA_NAO_DISPONIVEL
        }
        if (modo !== ws.split_mode) {
            const r = await gravarModo(ws.id, modo)
            if (!r.disponivel) return AINDA_NAO_DISPONIVEL
            if (!r.dados?.length) return NADA_MUDOU
        }
        await Promise.all([
            refreshWorkspaces(),
            queryClient.invalidateQueries({ queryKey: chaves.pesos(ws.id) }),
            queryClient.invalidateQueries({ queryKey: chaves.saldos(ws.id) }),
        ])
        return null
    }

    return {
        carregando: ws != null && (!adultos.length || pesos.isLoading || partes.isLoading),
        erro: erroAdultos || pesos.isError,
        opcoes: opcoesDeModo(partes.data?.disponivel === true, ws?.split_mode),
        modo,
        setModo: setModoEscolhido,
        valores,
        setPeso: (userId: string, valor: string) => setEditados((e) => ({ ...e, [userId]: valor })),
        adultos: adultos as Adulto[],
        pesosDisponiveis,
        validar,
        salvar,
    }
}

/** A seção Divisão do "Editar carteira": o trilho de dois modos e, dividida, os pesos. */
export function CamposDaDivisao({ divisao }: { divisao: DivisaoEditavel }) {
    if (divisao.erro) return <P>Não foi possível carregar a divisão.</P>
    if (divisao.carregando) return <SpinnerBlock label="Carregando a divisão…" />
    const atual = divisao.opcoes.find((o) => o.value === divisao.modo)
    return (
        <FieldSet>
            <FieldLegend>Divisão</FieldLegend>
            <Tabs value={divisao.modo} onValueChange={(v) => divisao.setModo(v as Modo)}>
                <TabsList aria-label="Divisão da carteira">
                    {divisao.opcoes.map((o) => (
                        <TabsTrigger key={o.value} value={o.value} disabled={(o as { disabled?: boolean }).disabled}>
                            {o.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            {atual ? <FieldDescription>{atual.description}</FieldDescription> : null}
            {divisao.opcoes
                .filter((o) => (o as { disabled?: boolean }).disabled)
                .map((o) => (
                    <FieldDescription key={o.value}>
                        {o.label}: {o.description}
                    </FieldDescription>
                ))}
            {divisao.modo === "split" ? (
                divisao.pesosDisponiveis ? (
                    <>
                        {divisao.adultos.map((a) => (
                            <FormInput
                                key={a.user_id}
                                label={a.nome}
                                inputMode="decimal"
                                value={divisao.valores[a.user_id] ?? ""}
                                onChange={(e) => divisao.setPeso(a.user_id, e.target.value)}
                            />
                        ))}
                        <Muted>
                            Peso 1 para todos é a divisão igual; peso 2 fica com o dobro de peso 1. O convidado não entra:
                            quem é responsável por ele paga. Os pesos novos valem para as despesas novas e para as editadas.
                        </Muted>
                    </>
                ) : (
                    <Muted>{AINDA_NAO_DISPONIVEL}</Muted>
                )
            ) : null}
        </FieldSet>
    )
}
