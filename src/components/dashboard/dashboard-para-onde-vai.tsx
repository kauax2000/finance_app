"use client"

import { useCallback, useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChartBarIcon, ReceiptPercentIcon, TagIcon } from "@heroicons/react/24/outline"
import { ComoFoiPago } from "@/components/analise-do-mes/como-foi-pago"
import { DestaquesDoMes } from "@/components/analise-do-mes/destaques-do-mes"
import { DiasDaSemana } from "@/components/analise-do-mes/dias-da-semana"
import { RitmoDoMes } from "@/components/analise-do-mes/ritmo-do-mes"
import { mesPorExtenso } from "@/components/analise-do-mes/rotulos"
import { TamanhoDasCompras } from "@/components/analise-do-mes/tamanho-das-compras"
import { categoriaDoParametro, useAnaliseDoMes } from "@/components/dashboard/use-analise-do-mes"
import { ColorTile } from "@/components/ui/color-tile"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxField,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
} from "@/components/ui/combobox"
import {
    EmptyState,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import type { CreditCardClosingLookup } from "@/lib/expense-month-attribution"
import type {
    Category,
    CreditCard,
    Transaction,
    WorkspaceInstallmentPlan,
    WorkspaceSubscription,
} from "@/lib/supabase"
import { TILE_EXPENSE_DEFAULT, tileColorFor, tileVividColor } from "@/lib/tile-palette"

/** A âncora da seção: `/dashboard?categoria=<id>#para-onde-vai` abre o Painel já nela. */
export const PARA_ONDE_VAI_ID = "para-onde-vai"
const TODAS = "todas"
// Sem cor guardada, o ladrilho da despesa: o mesmo matiz que a série desenha.
const corDoLadrilho = (cor: string | null) => tileColorFor(cor) ?? TILE_EXPENSE_DEFAULT

/** "Para onde vai o dinheiro": a análise da despesa do mês, da carteira inteira ou de uma categoria (`?categoria=`). */
export function DashboardParaOndeVai({
    calendarYm,
    todayYmd,
    categories,
    transactionsWide,
    prevTransactions,
    lookup,
    creditCards,
    installmentPlans,
    subscriptions,
    previstoDaCarteira,
}: {
    calendarYm: string
    todayYmd: string
    categories: Category[]
    transactionsWide: Transaction[]
    prevTransactions: Transaction[]
    lookup: CreditCardClosingLookup
    creditCards: CreditCard[]
    installmentPlans: WorkspaceInstallmentPlan[]
    subscriptions: WorkspaceSubscription[]
    previstoDaCarteira: number
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const despesas = useMemo(
        () => categories.filter((c) => c.type === "expense").sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
        [categories],
    )
    // Inexistente ou de receita, o parâmetro cai em "Todas".
    const categoriaId = categoriaDoParametro(searchParams.get("categoria"), despesas)
    const categoria = despesas.find((c) => c.id === categoriaId) ?? null

    const escolher = useCallback(
        (valor: string) => {
            const p = new URLSearchParams(searchParams.toString())
            if (valor === TODAS) p.delete("categoria")
            else p.set("categoria", valor)
            const q = p.toString()
            router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
        },
        [pathname, router, searchParams],
    )

    // A seção monta depois do esqueleto: a rolagem nativa até a âncora já passou.
    useEffect(() => {
        if (window.location.hash === `#${PARA_ONDE_VAI_ID}`) {
            document.getElementById(PARA_ONDE_VAI_ID)?.scrollIntoView({ block: "start" })
        }
    }, [])

    const analise = useAnaliseDoMes({
        transactionsWide,
        prevTransactions,
        calendarYm,
        todayYmd,
        lookup,
        creditCards,
        installmentPlans,
        subscriptions,
        previstoDaCarteira,
        categoriaId,
    })

    // Sem categoria, a cor do gasto dos gráficos da casa; com ela, a que o ladrilho dela desenha.
    const corDaSerie = categoria
        ? tileVividColor(corDoLadrilho(categoria.color))
        : "var(--chart-expense)"
    const aberto = calendarYm === todayYmd.slice(0, 7)

    return (
        <PageSection id={PARA_ONDE_VAI_ID} className="scroll-mt-[calc(var(--top-bar-bottom)_+_--spacing(6))]">
            <PageSectionHeader
                actions={
                    <Combobox value={categoriaId ?? TODAS} onValueChange={escolher}>
                        <ComboboxField className="w-56 max-w-full">
                            <ComboboxTrigger aria-label="Filtrar por categoria">
                                <ComboboxValue
                                    media={categoria ? <ColorTile size="xs" color={corDoLadrilho(categoria.color)} /> : undefined}
                                >
                                    {categoria?.name ?? "Todas as categorias"}
                                </ComboboxValue>
                            </ComboboxTrigger>
                        </ComboboxField>
                        <ComboboxContent>
                            <ComboboxInput placeholder="Buscar categoria…" />
                            <ComboboxList>
                                <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
                                <ComboboxGroup>
                                    <ComboboxItem value={TODAS}>Todas as categorias</ComboboxItem>
                                    {despesas.map((c) => (
                                        <ComboboxItem key={c.id} value={c.id} media={<ColorTile size="xs" color={corDoLadrilho(c.color)} />}>
                                            {c.name}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxGroup>
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                }
            >
                <PageSectionTitle>Para onde vai o dinheiro</PageSectionTitle>
            </PageSectionHeader>

            {analise ? (
                // Pela largura da seção, não da janela: com a barra lateral aberta, as duas colunas apertariam cedo.
                <div className="@container/para-onde">
                    <div className="grid gap-3 @2xl/para-onde:grid-cols-2">
                        <RitmoDoMes
                            ritmo={analise.ritmo}
                            aberto={aberto}
                            yearMonth={calendarYm}
                            corDaSerie={corDaSerie}
                            despesa
                            oQue="Gasto"
                            className="@2xl/para-onde:col-span-2"
                        />
                        <TamanhoDasCompras concentracao={analise.concentracao} corDaSerie={corDaSerie} despesa />
                        <ComoFoiPago
                            porPagamento={analise.porPagamento}
                            porPagamentoAnterior={analise.porPagamentoAnterior}
                            cartoes={creditCards}
                            aberto={aberto}
                            yearMonth={calendarYm}
                            despesa
                        />
                        <DiasDaSemana diasDaSemana={analise.diasDaSemana} corDaSerie={corDaSerie} despesa />
                        <DestaquesDoMes
                            tipo="expense"
                            cor={categoria?.color ?? null}
                            maior={analise.maior}
                            tipica={analise.tipica}
                            frequente={analise.frequente}
                            diaDeMais={analise.diaDeMais}
                            // Em meia linha, os quatro números ficam dois a dois.
                            className="lg:grid-cols-2"
                        />
                    </div>
                </div>
            ) : (
                <EmptyState>
                    <EmptyStateIcon variant="stack">
                        <TagIcon aria-hidden />
                        <ChartBarIcon aria-hidden />
                        <ReceiptPercentIcon aria-hidden />
                    </EmptyStateIcon>
                    <EmptyStateTitle>Sem gastos em {mesPorExtenso(calendarYm)}</EmptyStateTitle>
                    <EmptyStateDescription>
                        {categoria
                            ? `Nenhuma despesa em ${categoria.name} neste mês.`
                            : "A análise aparece assim que despesas forem registradas."}
                    </EmptyStateDescription>
                </EmptyState>
            )}
        </PageSection>
    )
}
