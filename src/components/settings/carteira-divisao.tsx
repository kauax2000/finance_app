"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { Card, CardContent } from "@/components/ui/card"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { ChartSplit, type ChartConfig } from "@/components/ui/chart"
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
import { currencyBRL } from "@/lib/formatters"

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

/** O total do exemplo: um mercado de R$ 100. */
export const TOTAL_DO_EXEMPLO = 100

/**
 * O exemplo da divisão: quanto de um gasto de `total`, pago por `pagadorId`,
 * fica com cada adulto pelos pesos, e quem fica devendo a quem paga. Com um
 * peso inválido, `null`. Os centavos que sobram do arredondamento ficam com
 * quem paga.
 */
export function exemploDaDivisao(
    adultos: Adulto[],
    valores: Record<string, string>,
    pagadorId: string,
    total = TOTAL_DO_EXEMPLO,
) {
    const pesos = adultos.map((a) => lerPeso(valores[a.user_id] ?? "1"))
    if (!adultos.length || pesos.some((p) => p == null)) return null
    const soma = (pesos as number[]).reduce((t, p) => t + p, 0)
    const partes = adultos.map((a, i) => ({ ...a, valor: Math.floor(((pesos[i] as number) / soma) * total * 100) / 100 }))
    const pagador = partes.find((p) => p.user_id === pagadorId) ?? partes[0]
    pagador.valor = Math.round((total - partes.filter((p) => p !== pagador).reduce((t, p) => t + p.valor, 0)) * 100) / 100
    return { pagador, partes, devem: partes.filter((p) => p !== pagador && p.valor > 0) }
}

/** O mercado de R$ 100 com os nomes da carteira: o que o modo escolhido faz com ele. */
function ExemploDaDivisao({ divisao }: { divisao: DivisaoEditavel }) {
    const { user } = useAuth()
    const ex = exemploDaDivisao(divisao.adultos, divisao.valores, user?.id ?? "")
    if (!ex) return <Muted>Ajuste os pesos para ver o exemplo.</Muted>
    const total = currencyBRL(TOTAL_DO_EXEMPLO)
    const config: ChartConfig = Object.fromEntries(ex.partes.map((p) => [p.user_id, { label: p.nome }]))
    return (
        <Card variant="muted" padding="sm">
            <CardContent className="flex flex-col gap-3">
                <P className="font-medium">
                    Se {ex.pagador.nome} pagar o mercado de {total}
                </P>
                {divisao.modo === "pooled" ? (
                    <Muted>O valor sai do pote de todos, e ninguém fica devendo nada.</Muted>
                ) : ex.devem.length === 0 ? (
                    <Muted>Quando outro adulto entrar na carteira, cada gasto vira partes entre vocês.</Muted>
                ) : (
                    <>
                        <ChartSplit
                            labels="legend"
                            config={config}
                            data={ex.partes.map((p) => ({ pessoa: p.user_id, valor: p.valor }))}
                            nameKey="pessoa"
                            dataKey="valor"
                            label={`Como o mercado de ${total} se divide`}
                        />
                        <DescriptionList divided>
                            {ex.devem.map((p) => (
                                <DescriptionListItem key={p.user_id}>
                                    <DescriptionTerm>
                                        {p.nome} fica devendo a {ex.pagador.nome}
                                    </DescriptionTerm>
                                    <DescriptionDetails>{currencyBRL(p.valor)}</DescriptionDetails>
                                </DescriptionListItem>
                            ))}
                        </DescriptionList>
                    </>
                )}
            </CardContent>
        </Card>
    )
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
            <ExemploDaDivisao divisao={divisao} />
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
                                label={`Peso de ${a.nome}`}
                                inputMode="decimal"
                                value={divisao.valores[a.user_id] ?? ""}
                                onChange={(e) => divisao.setPeso(a.user_id, e.target.value)}
                            />
                        ))}
                        <Muted>
                            Peso 2 paga o dobro de peso 1. O convidado não entra: quem é responsável por ele paga. Os pesos
                            valem para os gastos novos e para os editados.
                        </Muted>
                    </>
                ) : (
                    <Muted>{AINDA_NAO_DISPONIVEL}</Muted>
                )
            ) : null}
        </FieldSet>
    )
}
