"use client"

import { motion, useReducedMotion } from "motion/react"
import { useMemo, useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleRow } from "@/components/ui/collapsible"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Caption } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { currencyBRL } from "@/lib/formatters"
import { MOLA_PALCO } from "@/lib/spring"
import {
    avisoDoImpacto,
    impactoDaParcela,
    impactoDoPlano,
    mesCurto,
    resumoDoImpacto,
    type Impacto,
    type PlanoProposto,
} from "@/lib/previsao/impacto-parcela"
import { usePrevisao } from "@/lib/previsao/use-previsao"
import { formatDatePtBr } from "@/lib/transaction-date"

// O `layout="inline"` só junta termo e valor a partir de `sm`; aqui é telefone, então vai em cada item.
const LINHA = "flex flex-row items-baseline justify-between gap-3 text-end"

function Linha({ termo, children }: { termo: string; children: React.ReactNode }) {
    return (
        <DescriptionListItem className={LINHA}>
            <DescriptionTerm className="text-start">{termo}</DescriptionTerm>
            <DescriptionDetails>{children}</DescriptionDetails>
        </DescriptionListItem>
    )
}

/** O aviso à vista e, fechado por padrão, o detalhe do impacto. Sem cartão, nem faturas nem limite. */
function QuadroDoImpacto({ impacto }: { impacto: Impacto }) {
    const { pico, proximasFaturas, percentualDaRenda, primeiroMesNegativo, limite } = impacto
    const aviso = avisoDoImpacto(impacto)
    const { antes, depois } = primeiroMesNegativo
    const [aberto, setAberto] = useState(false)
    const envelope = useRef<HTMLDivElement>(null)
    const reduzido = useReducedMotion()
    return (
        <div className="flex flex-col gap-2">
            {aviso ? (
                <Alert size="sm" tone={aviso.tom}>
                    <AlertTitle>{aviso.titulo}</AlertTitle>
                    {aviso.descricao ? <AlertDescription>{aviso.descricao}</AlertDescription> : null}
                </Alert>
            ) : null}
            <Collapsible variant="card" open={aberto} onOpenChange={setAberto}>
                <CollapsibleRow trailing={<span className="nums">{resumoDoImpacto(impacto)}</span>}>
                    Impacto da parcela
                </CollapsibleRow>
                {/* Uma altura só, na mola: fora a animação de CSS do `Collapsible` (ela vence o
                    estilo inline) e a subida do conteúdo, e quem contém o quadro não anima de
                    novo (`data-altura-em-voo`). */}
                <CollapsibleContent forceMount asChild className="animate-none! overflow-hidden *:animate-none!">
                    <motion.div
                        ref={envelope}
                        inert={!aberto}
                        initial={false}
                        animate={{ height: aberto ? "auto" : 0, opacity: aberto ? 1 : 0 }}
                        transition={reduzido ? { duration: 0 } : MOLA_PALCO}
                        onAnimationStart={() => envelope.current?.setAttribute("data-altura-em-voo", "")}
                        onAnimationComplete={() =>
                            // O último `ResizeObserver` do voo chega depois do fim da animação.
                            requestAnimationFrame(() =>
                                requestAnimationFrame(() => envelope.current?.removeAttribute("data-altura-em-voo"))
                            )
                        }
                    >
                        <DescriptionList divided>
                            <Linha termo="Parcela">{impacto.parcelaEFim}</Linha>
                            <Linha termo={`Pico de parcelas (${mesCurto(pico.mes)})`}>
                                {currencyBRL(pico.semEsta)} → {currencyBRL(pico.comEsta)}
                            </Linha>
                            {proximasFaturas?.map((f) => (
                                <Linha key={f.closeYmd} termo={`Fatura de ${formatDatePtBr(f.closeYmd)}`}>
                                    {currencyBRL(f.antes)} → {currencyBRL(f.depois)}
                                </Linha>
                            ))}
                            <Linha termo="Da renda recorrente">
                                {percentualDaRenda != null ? `${percentualDaRenda}% no pico` : "Sem receita recorrente"}
                            </Linha>
                            <Linha termo="Seguro para gastar">
                                {!antes && !depois
                                    ? "Sem mês negativo"
                                    : `${antes ? mesCurto(antes) : "nenhum"} → ${depois ? mesCurto(depois) : "nenhum"}`}
                            </Linha>
                            {limite.motivo === "sem_limite" ? (
                                <Linha termo="Limite disponível">Sem limite cadastrado</Linha>
                            ) : limite.disponivel != null ? (
                                <Linha termo="Limite disponível">{currencyBRL(limite.disponivel)}</Linha>
                            ) : null}
                        </DescriptionList>
                    </motion.div>
                </CollapsibleContent>
            </Collapsible>
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
    if (impacto) return <QuadroDoImpacto impacto={impacto} />
    if (erro) return <Caption role="status">Não deu para calcular o impacto agora.</Caption>
    if (carregando) return <Skeleton className="h-8.5 w-full rounded-row-lg pointer-coarse:h-11.5" />
    return null
}
