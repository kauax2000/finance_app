"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"

import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormError, FormInput, FormSubmit } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Item, ItemChevron, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionDescription, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Progress } from "@/components/ui/progress"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Muted } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import {
    gravarLimite,
    lerLancamentosDoMes,
    lerLimiteDigitado,
    lerLimites,
    linhasDosLimites,
    removerLimite,
    type LancamentoDaPessoa,
    type LimiteDaPessoa,
    type LinhaDoLimite,
} from "@/lib/limites/limites"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { localYmdFromDate } from "@/lib/transaction-date"

type Pessoa = { user_id: string; nome: string }

/**
 * Os limites mensais por pessoa (seção `#limites` de Membros): o gasto do mês
 * de cada uma contra o limite. O dono edita; o membro só vê. Se a leitura
 * falha (a tabela ainda não existe no banco), fica um estado neutro.
 */
export function LimitesSecao({
    workspaceId,
    pessoas,
    podeEditar,
}: {
    workspaceId: string | null
    pessoas: Pessoa[]
    podeEditar: boolean
}) {
    const ym = localYmdFromDate(new Date()).slice(0, 7)
    const [dados, setDados] = useState<{ limites: LimiteDaPessoa[]; lancs: LancamentoDaPessoa[] } | null>(null)
    const [indisponivel, setIndisponivel] = useState(false)

    const [versao, setVersao] = useState(0)
    const carregar = useCallback(() => setVersao((v) => v + 1), [])

    useEffect(() => {
        if (!workspaceId) return
        let vivo = true
        Promise.all([lerLimites(workspaceId), lerLancamentosDoMes(workspaceId, ym)]).then(
            ([limites, lancs]) => {
                if (!vivo) return
                setDados({ limites, lancs })
                setIndisponivel(false)
            },
            () => {
                if (vivo) setIndisponivel(true)
            },
        )
        return () => {
            vivo = false
        }
    }, [workspaceId, ym, versao])

    return (
        <PageSection size="sm">
            <PageSectionHeader>
                <PageSectionTitle>Limites</PageSectionTitle>
            </PageSectionHeader>
            <PageSectionDescription>
                Limite mensal de gasto de cada pessoa. Avisa em 80% e em 100%, à pessoa e ao dono.
            </PageSectionDescription>
            {indisponivel ? (
                <Muted role="status">Os limites ainda não estão disponíveis nesta carteira.</Muted>
            ) : !dados || !workspaceId ? (
                <SkeletonGroup label="Carregando limites…">
                    <Skeleton shape="block" className="h-24 w-full" />
                </SkeletonGroup>
            ) : (
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {linhasDosLimites(pessoas, dados.limites, dados.lancs, ym).map((l) => (
                            <LinhaDoLimiteItem
                                key={`${l.user_id}:${l.limite}`}
                                linha={l}
                                podeEditar={podeEditar}
                                onSalvar={(valor) => gravarLimite(workspaceId, l.user_id, valor).then(carregar)}
                                onRemover={() => removerLimite(workspaceId, l.user_id).then(carregar)}
                            />
                        ))}
                    </ItemGroup>
                </Card>
            )}
        </PageSection>
    )
}

function LinhaDoLimiteItem({
    linha,
    podeEditar,
    onSalvar,
    onRemover,
}: {
    linha: LinhaDoLimite
    podeEditar: boolean
    onSalvar: (valor: number) => Promise<void>
    onRemover: () => Promise<void>
}) {
    const [aberto, setAberto] = useState(false)
    const [valor, setValor] = useState(linha.limite == null ? "" : formatMoneyBrlInput(linha.limite))
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const gasto = currencyBRL(linha.gastoCentavos / 100)
    const pct = linha.limite ? (linha.gastoCentavos / 100 / linha.limite) * 100 : 0

    const corpo = (
        <>
            <ItemContent>
                <ItemTitle className="pointer-coarse:text-base">{linha.nome}</ItemTitle>
                <ItemDescription>
                    {linha.limite == null
                        ? `${gasto} no mês, sem limite`
                        : `${gasto} de ${currencyBRL(linha.limite)}`}
                </ItemDescription>
                {linha.limite != null ? (
                    <Progress
                        value={Math.min(pct, 100)}
                        bands={[80, 100]}
                        size="sm"
                        aria-label={`${linha.nome}: ${Math.round(pct)}% do limite do mês`}
                    />
                ) : null}
            </ItemContent>
            {podeEditar ? <ItemChevron /> : null}
        </>
    )

    if (!podeEditar) {
        return (
            <Item variant="flush" className="min-h-12">
                {corpo}
            </Item>
        )
    }

    async function rodar(fn: () => Promise<void>) {
        setSalvando(true)
        setErro(null)
        try {
            await fn()
            setAberto(false)
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Não foi possível salvar o limite.")
        } finally {
            setSalvando(false)
        }
    }

    function salvar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const n = lerLimiteDigitado(valor)
        if (n == null) {
            setErro("Informe um valor maior que zero, até R$ 9.999.999.999,99.")
            return
        }
        return rodar(() => onSalvar(n))
    }

    return (
        <Dialog
            surface="auto"
            pending={salvando}
            open={aberto}
            onOpenChange={(v) => {
                setAberto(v)
                if (v) setErro(null)
            }}
        >
            <DialogTrigger asChild>
                <Item variant="flush" interactive asChild className="min-h-12">
                    <button type="button" className="w-full text-left">
                        {corpo}
                    </button>
                </Item>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{`Limite de ${linha.nome}`}</DialogTitle>
                    <DialogDescription>Quanto esta pessoa pode gastar por mês. Deixe sem limite para não avisar.</DialogDescription>
                </DialogHeader>
                <CustomForm pending={salvando} onSubmit={salvar}>
                    <DialogBody className="space-y-3">
                        <FormInput
                            money
                            label="Limite mensal em R$"
                            placeholder="1.234,56"
                            value={valor}
                            onValueChange={(v) => setValor(v)}
                        />
                        <FormError>{erro}</FormError>
                    </DialogBody>
                    <DialogFooter>
                        {linha.limite != null ? (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={salvando}
                                onClick={() =>
                                    void rodar(async () => {
                                        await onRemover()
                                        setValor("")
                                    })
                                }
                            >
                                Remover limite
                            </Button>
                        ) : null}
                        <FormCancel onClick={() => setAberto(false)}>Cancelar</FormCancel>
                        <FormSubmit>Salvar</FormSubmit>
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
