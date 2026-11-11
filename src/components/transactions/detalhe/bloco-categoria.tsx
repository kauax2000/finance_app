"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Progress } from "@/components/ui/progress"
import { Caption, Muted } from "@/components/ui/typography"
import { categoryDetailPath } from "@/config/navigation"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { formatYearMonth, periodBoundsFromYearMonth, shiftYearMonth } from "@/lib/budget-month"
import { buildCategoryCommitmentsForMonth } from "@/lib/category-commitments"
import {
  corteDoMesAnterior,
  diasDoMes,
  hrefDaLista,
  marcadorDoMes,
  mesPorExtenso,
  totalAteODia,
} from "@/lib/detalhe/blocos"
import { currencyBRL } from "@/lib/formatters"
import { useCategoryDetailBundleQuery } from "@/lib/queries/use-category-detail-bundle"
import type { Transaction } from "@/lib/supabase"
import { transactionLocalYmd } from "@/lib/transaction-date"
import {
  BlocoContexto,
  BlocoContextoEsqueleto,
  useFatiaDaManchete,
  type AoMudarManchete,
} from "./bloco-contexto"

/** Categoria no mês: o mesmo número do detalhe da categoria, no mês da data do lançamento. */
export function BlocoCategoria({
  transaction: t,
  onManchete,
}: {
  transaction: Transaction
  onManchete?: AoMudarManchete
}) {
  const { user } = useAuth()
  const { currentWorkspaceId, papel } = useWorkspace()
  const convidado = papel === "guest"
  const categoryId = t.type === "expense" ? t.category_id : null
  const ym = (transactionLocalYmd(t.date) ?? "").slice(0, 7)
  const hoje = new Date()
  const mesCorrente = ym === formatYearMonth(hoje)

  const atual = useCategoryDetailBundleQuery({
    workspaceId: currentWorkspaceId,
    userId: user?.id ?? null,
    categoryId: categoryId ?? "",
    yearMonth: ym,
    enabled: Boolean(categoryId && ym),
  })
  const bundle = atual.data
  const orcamento = !convidado && bundle?.budget ? Number(bundle.budget.amount) : null
  // Sem orçamento, no mês corrente: o mês anterior até o mesmo dia pede o bundle dele.
  const anterior = useCategoryDetailBundleQuery({
    workspaceId: currentWorkspaceId,
    userId: user?.id ?? null,
    categoryId: categoryId ?? "",
    yearMonth: ym ? shiftYearMonth(ym, -1) : "",
    enabled: Boolean(categoryId && ym && bundle && orcamento == null && mesCorrente),
  })

  const gasto =
    bundle && categoryId
      ? (buildCategoryCommitmentsForMonth({
          yearMonth: ym,
          transactions: bundle.txs,
          installmentPlans: bundle.installmentPlans,
          subscriptions: bundle.subscriptions,
          creditCards: bundle.creditCards,
        })[categoryId]?.committedTotal ?? 0)
      : null

  const nome = bundle?.category?.name ?? t.category?.name ?? "Categoria"
  const mes = ym ? mesPorExtenso(ym) : ""
  useFatiaDaManchete(
    onManchete,
    gasto == null ? null : { categoria: { nome, mes, gasto, orcamento } },
  )

  if (!categoryId || !ym || atual.isError) return null
  if (!bundle || gasto == null) return <BlocoContextoEsqueleto />

  const { period_start, period_end } = periodBoundsFromYearMonth(ym)
  const quantos = bundle.txs.filter((x) => x.type === "expense").length
  const link = quantos
    ? {
        href: hrefDaLista([
          { field: "categoria", operator: "is", values: [categoryId] },
          { field: "periodo", operator: "is", values: [period_start, period_end] },
        ]),
        label: `ver os ${quantos}`,
      }
    : null

  if (orcamento != null && orcamento > 0) {
    const resto = orcamento - gasto
    const diasRestantes = diasDoMes(ym) - hoje.getDate()
    return (
      <BlocoContexto titulo={`${nome} em ${mes}`} link={link}>
        <Muted>
          <MoneyDisplay value={gasto} className="font-medium text-foreground" /> de{" "}
          <MoneyDisplay value={orcamento} />
        </Muted>
        <Progress
          value={gasto}
          max={orcamento}
          bands={BUDGET_BANDS}
          marker={mesCorrente ? marcadorDoMes(hoje) : undefined}
          aria-label={`Orçamento de ${nome} em ${mes}`}
        />
        <Caption>
          {resto >= 0
            ? `${mesCorrente ? "faltam" : "sobraram"} ${currencyBRL(resto)}${mesCorrente ? ` · ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}` : ""}`
            : `${currencyBRL(-resto)} acima do orçamento`}
        </Caption>
      </BlocoContexto>
    )
  }

  const mesAnterior = mesPorExtenso(shiftYearMonth(ym, -1))
  // Num mês que passou, o mês anterior inteiro; no corrente, até o mesmo dia (sem o bundle, nada).
  const comparacao = mesCorrente
    ? anterior.data
      ? `${mesAnterior} até dia ${hoje.getDate()}: ${currencyBRL(totalAteODia(anterior.data.txs, corteDoMesAnterior(ym, hoje.getDate())))}`
      : null
    : `${mesAnterior}: ${currencyBRL(bundle.prevMonthCategoryTotal)}`

  return (
    <BlocoContexto titulo={`${nome} em ${mes}`} link={link}>
      <MoneyDisplay value={gasto} size="lg" />
      {comparacao ? <Caption>{comparacao}</Caption> : null}
      {!convidado ? (
        <Button variant="link" asChild className="justify-self-start">
          <Link href={categoryDetailPath(categoryId, { month: ym })}>definir orçamento</Link>
        </Button>
      ) : null}
    </BlocoContexto>
  )
}
