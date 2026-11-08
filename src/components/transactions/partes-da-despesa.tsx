"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogError,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import { Form, FormActions, FormCancel, FormError, FormInput, FormSubmit } from "@/components/ui/form"
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    PageSection,
    PageSectionDescription,
    PageSectionHeader,
    PageSectionSkeleton,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { useWorkspace } from "@/components/workspace-provider"
import { identityToneFor } from "@/lib/avatar"
import { definirPartes, lerPartes } from "@/lib/divisao/dados"
import { emCentavos, faltaParaFechar, lerParte, partesFecham, textoDaFalta } from "@/lib/divisao/partes"
import { chaves, useAdultos } from "@/lib/divisao/use-adultos"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"
import type { Transaction } from "@/lib/supabase"
import { cn, getInitials } from "@/lib/utils"

const PARTES_NAO_FECHAM = "As partes precisam somar o valor da despesa."

const mensagem = (e: unknown) => (e instanceof Error && e.message ? e.message : "Não foi possível salvar.")

function AvatarDaPessoa({ nome }: { nome: string }) {
    const tom = identityToneFor(null, nome)
    return (
        <Avatar size="sm">
            <AvatarFallback className={cn("font-semibold", tom.surface, tom.ink)}>{getInitials(nome)}</AvatarFallback>
        </Avatar>
    )
}

/**
 * As partes de uma despesa no detalhe (spec §9.3): sempre as de
 * `transaction_shares`. Só na carteira que divide, para o adulto. O adulto as
 * edita à mão (o editor confere que fecham antes do `definir_partes`) e volta ao
 * automático.
 */
export function PartesDaDespesa({ transaction }: { transaction: Transaction }) {
    const { currentWorkspace, isAdulto } = useWorkspace()
    const ws = currentWorkspace?.split_mode === "split" && isAdulto ? currentWorkspace.id : null
    if (!ws || transaction.workspace_id !== ws || transaction.type !== "expense") return null
    return <Partes key={transaction.id} t={transaction} ws={ws} />
}

function Partes({ t, ws }: { t: Transaction; ws: string }) {
    const queryClient = useQueryClient()
    const { lista, nome } = useAdultos(ws)
    const partes = useQuery({ queryKey: [...chaves.partes(t.id), t.amount, t.updated_at], queryFn: () => lerPartes(t.id) })
    const [editando, setEditando] = React.useState<Record<string, string> | null>(null)
    const [voltando, setVoltando] = React.useState(false)
    const [pendente, setPendente] = React.useState(false)
    const [erro, setErro] = React.useState<string | null>(null)

    /** Grava e devolve se deu certo; o erro fica em `erro`. */
    async function gravar(valores: { user_id: string; amount: number }[] | null): Promise<boolean> {
        setPendente(true)
        setErro(null)
        try {
            const r = await definirPartes(t.id, valores)
            if (!r.disponivel) {
                setErro(AINDA_NAO_DISPONIVEL)
                return false
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: chaves.partes(t.id) }),
                queryClient.invalidateQueries({ queryKey: chaves.saldos(ws) }),
            ])
            return true
        } catch (e) {
            setErro(mensagem(e))
            return false
        } finally {
            setPendente(false)
        }
    }

    const reais = editando
        ? Object.fromEntries(lista.map((a) => [a.user_id, lerParte(editando[a.user_id] ?? "")]))
        : {}
    // O que não se lê conta zero só no "Faltam"; para fechar, o NaN reprova.
    const falta = faltaParaFechar(
        Object.fromEntries(Object.entries(reais).map(([id, v]) => [id, Number.isNaN(v) ? 0 : v])),
        Number(t.amount),
    )
    const digitadas = Object.entries(reais).map(([user_id, v]) => ({ user_id, centavos: emCentavos(v) }))
    const fecha = editando != null && partesFecham(digitadas, emCentavos(t.amount))

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!fecha) return setErro(PARTES_NAO_FECHAM)
        if (await gravar(digitadas.map((p) => ({ user_id: p.user_id, amount: p.centavos / 100 })))) setEditando(null)
    }

    async function voltarAoAutomatico() {
        if (await gravar(null)) setVoltando(false)
    }

    const dados = partes.data?.disponivel ? partes.data.dados : null
    const podeEditar = dados != null && dados.partes.length > 0 && editando == null

    if (partes.isPending) return <PageSectionSkeleton size="sm" />

    return (
        <PageSection size="sm">
            <PageSectionHeader
                actions={
                    podeEditar ? (
                        <>
                            {dados.manual ? (
                                <AlertDialog
                                    open={voltando}
                                    onOpenChange={(aberto) => {
                                        setVoltando(aberto)
                                        if (!aberto) setErro(null)
                                    }}
                                    pending={pendente}
                                >
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="tertiary" disabled={pendente}>
                                            Voltar ao automático
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Voltar ao automático?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                As partes escritas à mão saem, e a despesa volta a dividir pelos pesos da
                                                carteira.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        {erro ? <AlertDialogError>{erro}</AlertDialogError> : null}
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                variant="primary"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    void voltarAoAutomatico()
                                                }}
                                            >
                                                Voltar ao automático
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : null}
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={pendente}
                                onClick={() => {
                                    setErro(null)
                                    setEditando(
                                        Object.fromEntries(
                                            lista.map((a) => {
                                                const p = dados.partes.find((x) => x.user_id === a.user_id)
                                                return [a.user_id, formatMoneyBrlInput(p ? Number(p.amount) : 0)]
                                            }),
                                        ),
                                    )
                                }}
                            >
                                Editar à mão
                            </Button>
                        </>
                    ) : null
                }
            >
                <PageSectionTitle>Divisão</PageSectionTitle>
                {dados && dados.partes.length > 0 ? (
                    <PageSectionDescription>
                        {dados.manual
                            ? "Partes escritas à mão."
                            : "Partes automáticas, pelos pesos; o centavo que sobra fica com quem pagou."}
                    </PageSectionDescription>
                ) : null}
            </PageSectionHeader>

            {editando ? (
                <Form onSubmit={onSubmit}>
                    {lista.map((a) => (
                        <FormInput
                            key={a.user_id}
                            money
                            label={`Parte de ${a.nome}`}
                            value={editando[a.user_id] ?? ""}
                            onValueChange={(v) => setEditando({ ...editando, [a.user_id]: v })}
                        />
                    ))}
                    <FormError>{erro ?? textoDaFalta(falta)}</FormError>
                    <FormActions>
                        <FormCancel onClick={() => setEditando(null)}>Cancelar</FormCancel>
                        <FormSubmit disabled={!fecha}>Salvar</FormSubmit>
                    </FormActions>
                </Form>
            ) : (
                <Card padding="none">
                    {partes.isError ? <CardMessage tone="destructive">{mensagem(partes.error)}</CardMessage> : null}
                    {partes.data && !partes.data.disponivel ? <CardMessage>{AINDA_NAO_DISPONIVEL}</CardMessage> : null}
                    {dados ? (
                        <ItemGroup variant="divided">
                            <Item variant="flush">
                                <ItemMedia>
                                    <AvatarDaPessoa nome={nome(dados.pagou)} />
                                </ItemMedia>
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="truncate">Pagou: {nome(dados.pagou)}</ItemTitle>
                                </ItemContent>
                            </Item>
                            {dados.partes.length === 0 ? (
                                <CardMessage>Fora da divisão: a despesa é de antes de a carteira passar a dividir.</CardMessage>
                            ) : (
                                dados.partes.map((p) => (
                                    <Item key={p.user_id} variant="flush">
                                        <ItemMedia>
                                            <AvatarDaPessoa nome={nome(p.user_id)} />
                                        </ItemMedia>
                                        <ItemContent className="min-w-0">
                                            <ItemTitle className="truncate">{nome(p.user_id)}</ItemTitle>
                                        </ItemContent>
                                        <ItemActions>
                                            {dados.manual ? <Badge>manual</Badge> : null}
                                            <MoneyDisplay value={Number(p.amount)} />
                                        </ItemActions>
                                    </Item>
                                ))
                            )}
                        </ItemGroup>
                    ) : null}
                    {erro && !voltando ? <CardMessage tone="destructive">{erro}</CardMessage> : null}
                </Card>
            )}
        </PageSection>
    )
}
