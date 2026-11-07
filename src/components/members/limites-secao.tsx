"use client"

import { useState, type FormEvent } from "react"

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
import { AvatarDoMembro, memberDisplayName, type MemberWithProfile } from "@/components/members/pessoas-secao"
import { PencilIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { PageSection, PageSectionDescription, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { Progress } from "@/components/ui/progress"
import { currencyBRL } from "@/lib/formatters"
import {
    gravarLimite,
    lerLimiteDigitado,
    linhasDosLimites,
    removerLimite,
    situacaoDoLimite,
    type LancamentoDaPessoa,
    type LimiteDaPessoa,
    type LinhaDoLimite,
} from "@/lib/limites/limites"
import { cn } from "@/lib/utils"
import { formatMoneyBrlInput } from "@/lib/money-brl"


/**
 * Os limites mensais por pessoa (seção `#limites` de Membros): o gasto do mês
 * de cada uma contra o limite. O dono edita; o membro só vê. Os dados chegam
 * no pacote da tela (`fetchMembersPageBundle`), junto com o resto. Se a leitura
 * falhou (a tabela ainda não existe no banco), fica um estado neutro.
 */
export function LimitesSecao({
    workspaceId,
    pessoas,
    podeEditar,
    ym,
    limites,
    lancamentos,
    indisponivel,
    onMudou,
}: {
    workspaceId: string
    pessoas: MemberWithProfile[]
    podeEditar: boolean
    /** O mês (`YYYY-MM`) dos lançamentos. */
    ym: string
    limites: LimiteDaPessoa[]
    lancamentos: LancamentoDaPessoa[]
    indisponivel: boolean
    /** Depois de gravar ou remover: relê o pacote. */
    onMudou: () => Promise<unknown>
}) {
    return (
        <PageSection size="sm">
            <PageSectionHeader>
                <PageSectionTitle>Limites</PageSectionTitle>
            </PageSectionHeader>
            <PageSectionDescription>
                Limite mensal de gasto de cada pessoa. Avisa em 80% e em 100%, à pessoa e ao dono.
            </PageSectionDescription>
            {indisponivel ? (
                <Card padding="none" role="status">
                    <Item variant="flush" className="min-h-12">
                        <ItemContent>
                            <ItemDescription>Os limites ainda não estão disponíveis nesta carteira.</ItemDescription>
                        </ItemContent>
                    </Item>
                </Card>
            ) : (
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {linhasDosLimites(
                            pessoas.map((m) => ({ user_id: m.user_id, nome: memberDisplayName(m) })),
                            limites, lancamentos,
                            ym,
                        ).map((l) => (
                            <LinhaDoLimiteItem
                                key={`${l.user_id}:${l.limite}`}
                                linha={l}
                                membro={pessoas.find((m) => m.user_id === l.user_id)}
                                podeEditar={podeEditar}
                                onSalvar={async (valor) => {
                                    await gravarLimite(workspaceId, l.user_id, valor)
                                    await onMudou()
                                }}
                                onRemover={async () => {
                                    await removerLimite(workspaceId, l.user_id)
                                    await onMudou()
                                }}
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
    membro,
    podeEditar,
    onSalvar,
    onRemover,
}: {
    linha: LinhaDoLimite
    membro: MemberWithProfile | undefined
    podeEditar: boolean
    onSalvar: (valor: number) => Promise<void>
    onRemover: () => Promise<void>
}) {
    const [aberto, setAberto] = useState(false)
    const [valor, setValor] = useState(linha.limite == null ? "" : formatMoneyBrlInput(linha.limite))
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const gasto = currencyBRL(linha.gastoCentavos / 100)
    const situacao = linha.limite == null ? null : situacaoDoLimite(linha.gastoCentavos, linha.limite)
    const pct = situacao?.pct ?? 0
    const tomPct = pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-foreground"

    const corpo = (
        <>
            {membro ? (
                <ItemMedia>
                    <AvatarDoMembro member={membro} size="sm" />
                </ItemMedia>
            ) : null}
            <ItemContent className="min-w-0">
                <ItemTitle className="truncate pointer-coarse:text-base">{linha.nome}</ItemTitle>
                <ItemDescription>
                    {situacao == null ? (
                        `${gasto} no mês · sem limite`
                    ) : (
                        <>
                            {situacao.tipo === "passou" ? (
                                <span className="text-destructive">
                                    {"Passou "}
                                    {currencyBRL(situacao.valorCentavos / 100)}
                                </span>
                            ) : (
                                "Sobram " + currencyBRL(situacao.valorCentavos / 100)
                            )}
                            {` · limite ${currencyBRL(linha.limite!)}`}
                        </>
                    )}
                </ItemDescription>
                {situacao != null ? (
                    <Progress
                        value={pct}
                        bands={[80, 100]}
                        size="sm"
                        aria-label={`${linha.nome}: ${pct}% do limite do mês`}
                    />
                ) : null}
            </ItemContent>
            {situacao != null ? <span className={cn("nums text-sm font-medium", tomPct)}>{pct}%</span> : null}
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
            <Item variant="flush" className="min-h-12">
                {corpo}
                <DialogTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="sm"
                        aria-label={`${situacao == null ? "Definir" : "Editar"} o limite de ${linha.nome}`}
                    >
                        <PencilIcon aria-hidden data-icon="inline-start" />
                        {situacao == null ? "Definir" : "Editar"}
                    </Button>
                </DialogTrigger>
            </Item>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{`Limite de ${linha.nome}`}</DialogTitle>
                    <DialogDescription>Quanto esta pessoa pode gastar por mês.</DialogDescription>
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
