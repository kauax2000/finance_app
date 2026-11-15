"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
    DescriptionDetails,
    DescriptionHint,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Muted } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { currencyBRL } from "@/lib/formatters"
import type { Seguro } from "@/lib/previsao/tipos"
import { formatTransactionDayMonthPtBr } from "@/lib/transaction-date"

/** Uma linha termo/valor; o valor encosta à direita a partir de `sm`, na linha do termo. */
function Linha({ termo, children, dica }: { termo: ReactNode; children: ReactNode; dica?: ReactNode }) {
    return (
        <DescriptionListItem>
            <DescriptionTerm>{termo}</DescriptionTerm>
            <DescriptionDetails className="sm:text-end">
                {children}
                {dica ? <DescriptionHint>{dica}</DescriptionHint> : null}
            </DescriptionDetails>
        </DescriptionListItem>
    )
}

/** As contas por trás do seguro: o que entra, o que sai, a sobra, a reserva e o seguro. */
export function DeOndeVem({ seguro, onEditarReserva }: { seguro: Seguro; onEditarReserva: () => void }) {
    const { currentWorkspace, isWorkspaceOwner } = useWorkspace()
    const dono = currentWorkspace ? isWorkspaceOwner(currentWorkspace.id) : false

    return (
        <Card padding="none">
            <CardToolbar>
                <span className="min-w-0 truncate">De onde vem</span>
                {dono ? (
                    <Button type="button" variant="tertiary" onClick={onEditarReserva}>
                        Editar reserva
                    </Button>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="button" variant="tertiary" disabled>
                                Editar reserva
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Só quem é dono da carteira altera a reserva</TooltipContent>
                    </Tooltip>
                )}
            </CardToolbar>
            <CardContent className="grid gap-4 px-(--card-strip-px) pb-(--card-strip-py)">
                <DescriptionList layout="inline" size="sm">
                    <Linha
                        termo="Entra"
                        dica={`${currencyBRL(seguro.receitas.recebidas)} recebidas · ${currencyBRL(seguro.receitas.previstas)} previstas`}
                    >
                        <MoneyDisplay value={seguro.entra} tone="income" />
                    </Linha>
                    <Linha
                        termo="Despesas fora do cartão"
                        dica={`${currencyBRL(seguro.despesas.pagas)} pagas · ${currencyBRL(seguro.despesas.previstas)} previstas`}
                    >
                        <MoneyDisplay value={seguro.despesas.pagas + seguro.despesas.previstas} tone="expense" />
                    </Linha>
                    {seguro.faturas.length === 0 ? (
                        <Linha termo="Faturas">Nenhuma fatura vence neste mês</Linha>
                    ) : (
                        seguro.faturas.map((f) => (
                            <Linha
                                key={`${f.cardId}:${f.closeYmd}`}
                                termo={
                                    <span className="inline-flex flex-wrap items-center gap-1.5">
                                        Fatura {f.nome}
                                        {f.paga ? <Badge size="xs">paga</Badge> : null}
                                        {f.usaTotalDoBanco ? <Badge size="xs">total do banco</Badge> : null}
                                    </span>
                                }
                                dica={`vence ${formatTransactionDayMonthPtBr(f.dueYmd)}`}
                            >
                                <MoneyDisplay value={f.total} tone="expense" />
                            </Linha>
                        ))
                    )}
                </DescriptionList>
                <Separator />
                <DescriptionList layout="inline" size="sm">
                    <Linha termo="Sobra do mês">
                        <MoneyDisplay value={seguro.sobra} tone={seguro.sobra < 0 ? "expense" : "default"} />
                    </Linha>
                    <Linha termo="Reserva do mês">
                        <MoneyDisplay value={seguro.reserva} />
                    </Linha>
                </DescriptionList>
                <Separator />
                <DescriptionList layout="inline" size="sm">
                    <Linha termo="Seguro para gastar">
                        <MoneyDisplay value={seguro.seguro} tone={seguro.seguro < 0 ? "expense" : "default"} />
                    </Linha>
                </DescriptionList>
                <div className="grid gap-1">
                    {seguro.comprometidoNaProximaFatura > 0 ? (
                        <Muted>Já comprometido na próxima fatura: {currencyBRL(seguro.comprometidoNaProximaFatura)}</Muted>
                    ) : null}
                    {seguro.contasSemValor.length > 0 ? (
                        <Muted>Contas sem valor: {seguro.contasSemValor.join(", ")}</Muted>
                    ) : null}
                    <Muted>A fatura conta no mês em que vence. Cada mês começa do zero.</Muted>
                </div>
            </CardContent>
        </Card>
    )
}
