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
import { AdicionarLimiteDialog } from "@/components/members/adicionar-limite-dialog"
import { AvatarDoMembro, memberDisplayName, type MemberWithProfile } from "@/components/members/pessoas-secao"
import { PencilIcon, PlusIcon } from "@heroicons/react/16/solid"
import { BellAlertIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
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
 *
 * Título e subtítulo ficam soltos, como em Pessoas. Sem limite nenhum, é um
 * convite (o vazio tracejado, com "Definir limites" para o dono); com limite,
 * a lista mostra só quem tem, e "Adicionar limite" fica no cabeçalho enquanto
 * houver alguém sem. Os dois abrem o diálogo de dois passos.
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
    const [adicionando, setAdicionando] = useState(false)

    if (indisponivel) {
        return (
            <PageSection size="sm">
                <PageSectionHeader>
                    <PageSectionTitle>Limites</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none" role="status">
                    <Item variant="flush" className="min-h-12">
                        <ItemContent>
                            <ItemDescription>Os limites ainda não estão disponíveis nesta carteira.</ItemDescription>
                        </ItemContent>
                    </Item>
                </Card>
            </PageSection>
        )
    }

    const linhas = linhasDosLimites(
        pessoas.map((m) => ({ user_id: m.user_id, nome: memberDisplayName(m) })),
        limites, lancamentos,
        ym,
    )
    const comLimite = linhas.filter((l) => l.limite != null)
    const semLimite = linhas.filter((l) => l.limite == null)

    return (
        <PageSection size="sm">
            <PageSectionHeader
                actions={
                    podeEditar && comLimite.length > 0 && semLimite.length > 0 ? (
                        <Button type="button" variant="secondary" onClick={() => setAdicionando(true)}>
                            <PlusIcon aria-hidden />
                            Adicionar limite
                        </Button>
                    ) : undefined
                }
            >
                <PageSectionTitle>Limites</PageSectionTitle>
                <PageSectionDescription>
                    Defina quanto cada pessoa pode gastar por mês. A pessoa e o dono recebem um aviso ao chegar a 80% e a 100% do limite.
                </PageSectionDescription>
            </PageSectionHeader>
            {comLimite.length === 0 ? (
                <EmptyState variant="dashed" size="sm">
                    <EmptyStateIcon variant="circle">
                        <BellAlertIcon aria-hidden />
                    </EmptyStateIcon>
                    <EmptyStateTitle>Controle o gasto de cada pessoa</EmptyStateTitle>
                    {podeEditar ? (
                        <>
                            <EmptyStateDescription>Escolha uma pessoa e o valor por mês.</EmptyStateDescription>
                            <EmptyStateActions>
                                <Button type="button" variant="secondary" onClick={() => setAdicionando(true)}>
                                    Definir limites
                                </Button>
                            </EmptyStateActions>
                        </>
                    ) : (
                        <EmptyStateDescription>
                            O dono da carteira pode definir quanto cada pessoa gasta por mês.
                        </EmptyStateDescription>
                    )}
                </EmptyState>
            ) : (
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {comLimite.map((l) => (
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
            {podeEditar ? (
                <AdicionarLimiteDialog
                    open={adicionando}
                    onOpenChange={setAdicionando}
                    semLimite={semLimite}
                    pessoas={pessoas}
                    onSalvar={async (userId, valor) => {
                        await gravarLimite(workspaceId, userId, valor)
                        await onMudou()
                    }}
                />
            ) : null}
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
                <div className="flex min-w-0 items-baseline justify-between gap-3">
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
                    {situacao != null ? <span className={cn("nums shrink-0 text-sm font-medium", tomPct)}>{pct}%</span> : null}
                </div>
                {situacao != null ? (
                    <Progress
                        value={pct}
                        bands={[80, 100]}
                        size="sm"
                        className="mt-2"
                        aria-label={`${linha.nome}: ${pct}% do limite do mês`}
                    />
                ) : null}
            </ItemContent>
        </>
    )

    if (!podeEditar) {
        return (
            <Item variant="flush" size="lg" className="px-4">
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
            <Item variant="flush" size="lg" className="px-4">
                {corpo}
                <DialogTrigger asChild>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-lg"
                        aria-label={`${situacao == null ? "Definir" : "Editar"} o limite de ${linha.nome}`}
                    >
                        <PencilIcon aria-hidden />
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
