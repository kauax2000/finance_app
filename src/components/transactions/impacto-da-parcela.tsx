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
import { Progress } from "@/components/ui/progress"
import { Caption, Muted } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { currencyBRL } from "@/lib/formatters"
import {
    avisoDoImpacto,
    frasesDoImpacto,
    impactoDaParcela,
    impactoDoPlano,
    tituloDoImpacto,
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

/** O aviso à vista e o cartão do mês mais pesado: a barra com a parte desta compra e as frases. */
function QuadroDoImpacto({ impacto, comLink }: { impacto: Impacto; comLink: boolean }) {
    const { pico, percentualDaRenda } = impacto
    const aviso = avisoDoImpacto(impacto)
    const desta = Math.max(0, pico.comEsta - pico.semEsta)
    return (
        <div className="flex flex-col gap-2">
            {aviso ? (
                <Alert tone={aviso.tom}>
                    <AlertTitle>{aviso.titulo}</AlertTitle>
                    {aviso.descricao ? <AlertDescription>{aviso.descricao}</AlertDescription> : null}
                </Alert>
            ) : null}
            <BlocoContexto
                titulo={tituloDoImpacto(impacto)}
                // O formulário não navega: o link só no detalhe.
                link={comLink ? { href: ROUTES.PREVISAO, label: "ver previsão" } : null}
            >
                <div className="flex flex-wrap items-baseline gap-x-2">
                    <MoneyDisplay value={pico.comEsta} size="lg" />
                    <Muted>em parcelas no mês</Muted>
                </div>
                {/* Sem parcela nenhuma, o máximo seria 0 (o Radix recusa). */}
                {pico.comEsta > 0 ? (
                    <Progress
                        className="[--progress-highlight:var(--color-warning)]"
                        value={pico.comEsta}
                        max={pico.comEsta}
                        highlight={{ from: pico.semEsta, to: pico.comEsta }}
                        aria-label={`${currencyBRL(pico.comEsta)} em parcelas no mês, ${currencyBRL(desta)} desta compra`}
                    />
                ) : null}
                <Caption>
                    <span aria-hidden className="inline-block size-2 rounded-full bg-primary" /> outras{" "}
                    {currencyBRL(pico.semEsta)} ·{" "}
                    <span aria-hidden className="inline-block size-2 rounded-full bg-warning" /> esta compra{" "}
                    {currencyBRL(desta)}
                    {percentualDaRenda != null ? ` · ${percentualDaRenda}% da renda recorrente` : null}
                </Caption>
                <ItemGroup>
                    {frasesDoImpacto(impacto).map((f) => (
                        <Item key={f.chave} size="sm" className="px-0">
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
