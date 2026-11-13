"use client"

import {
    ArrowPathRoundedSquareIcon,
    BanknotesIcon,
    CheckIcon,
    CreditCardIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/16/solid"
import { useMemo } from "react"

import { BlocoContexto, BlocoContextoEsqueleto } from "@/components/transactions/detalhe/bloco-contexto"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { currencyBRL } from "@/lib/formatters"
import { formatMonthLongPtBr, formatMonthShortPtBr } from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import {
    avisoDoImpacto,
    frasesDoImpacto,
    impactoDaParcela,
    impactoDoPlano,
    type FraseDoImpacto,
    type Impacto,
    type PlanoProposto,
} from "@/lib/previsao/impacto-parcela"
import { usePrevisao } from "@/lib/previsao/use-previsao"

function Icone({ frase: f }: { frase: FraseDoImpacto }) {
    if (f.icone === "repetir") return <ArrowPathRoundedSquareIcon aria-hidden />
    if (f.icone === "cartao") return <CreditCardIcon aria-hidden />
    if (f.icone === "limite") return <BanknotesIcon aria-hidden />
    return f.tom === "success" ? <CheckIcon aria-hidden /> : <ExclamationTriangleIcon aria-hidden />
}

const dataDoMes = (mes: string) => new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1, 1)

/** O aviso à vista e o cartão do mês mais pesado: os quatro meses com o pico marcado e as frases. */
function QuadroDoImpacto({ impacto, comLink }: { impacto: Impacto; comLink: boolean }) {
    const { pico, percentualDaRenda } = impacto
    const aviso = avisoDoImpacto(impacto)
    return (
        <div className="flex flex-col gap-2">
            {aviso ? (
                <Alert tone={aviso.tom}>
                    <AlertTitle>{aviso.titulo}</AlertTitle>
                    {aviso.descricao ? <AlertDescription>{aviso.descricao}</AlertDescription> : null}
                </Alert>
            ) : null}
            <BlocoContexto
                titulo="Parcelas mês a mês"
                // O formulário não navega: o link só no detalhe.
                link={comLink ? { href: ROUTES.PREVISAO, label: "ver previsão" } : null}
            >
                <div role="list" className="grid grid-cols-4 gap-1.5">
                    {impacto.meses.map((m, i) => {
                        const desta = m.comEsta - m.semEsta
                        const ehPico = m.mes === pico.mes
                        const data = dataDoMes(m.mes)
                        return (
                            <div
                                key={m.mes}
                                role="listitem"
                                aria-label={`${formatMonthLongPtBr(data)}: ${currencyBRL(m.comEsta)} em parcelas, ${currencyBRL(desta)} desta compra`}
                                className={cn(
                                    "flex flex-col rounded-row-lg bg-muted px-2.5 py-2",
                                    i === 0
                                        ? "inset-ring-1 inset-ring-warning/60"
                                        : ehPico && "inset-ring-1 inset-ring-foreground/35",
                                )}
                            >
                                <Caption>
                                    {formatMonthShortPtBr(data)}
                                    {ehPico ? " · pico" : null}
                                </Caption>
                                <MoneyDisplay value={m.comEsta} className="font-medium" />
                                <Caption className={desta > 0 ? "text-warning" : undefined}>
                                    {desta > 0 ? `+ ${currencyBRL(desta)} esta` : "sem esta"}
                                </Caption>
                            </div>
                        )
                    })}
                </div>
                {percentualDaRenda != null ? <Caption>{percentualDaRenda}% da renda recorrente</Caption> : null}
                {/* Um respiro só entre as frases (o do grupo): sem o recuo vertical do Item, a frase de uma linha não ganha vão a mais. */}
                <ItemGroup className="gap-3 pt-1">
                    {frasesDoImpacto(impacto).map((f) => (
                        <Item key={f.chave} size="sm" className="p-0">
                            {/* `success` não existe no ladrilho: o positivo fica neutro, com o tique. */}
                            <ItemMedia variant="tile" tone={f.tom === "success" ? "neutral" : f.tom}>
                                <Icone frase={f} />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>{f.titulo}</ItemTitle>
                                {f.descricao ? <ItemDescription>{f.descricao}</ItemDescription> : null}
                            </ItemContent>
                        </Item>
                    ))}
                </ItemGroup>
            </BlocoContexto>
        </div>
    )
}

/**
 * Carrega a previsão da carteira e mostra o quadro: `proposto` é a compra ainda não salva
 * (formulário, frase); `planoId`, o plano ativo de um lançamento parcelado (detalhe).
 */
export function ImpactoDaParcela(
    props: { proposto: PlanoProposto; planoId?: never } | { planoId: string; proposto?: never },
) {
    const { currentWorkspaceId } = useWorkspace()
    const { dados, carregando, erro } = usePrevisao(currentWorkspaceId)
    const { proposto, planoId } = props
    const impacto = useMemo(() => {
        if (!dados) return null
        if (proposto) return impactoDaParcela(proposto, dados)
        const salvo = dados.planos.find((p) => p.id === planoId && p.is_active)
        return salvo ? impactoDoPlano(salvo, dados) : undefined
    }, [dados, proposto, planoId])

    // Plano encerrado (ou de outra carteira): não há o que prever.
    if (impacto === undefined) return null
    if (impacto) return <QuadroDoImpacto impacto={impacto} comLink={!proposto} />
    if (erro) {
        return (
            <BlocoContexto titulo="Parcelas">
                <Caption role="status">Não deu para calcular o impacto agora.</Caption>
            </BlocoContexto>
        )
    }
    if (carregando) return <BlocoContextoEsqueleto />
    return null
}
