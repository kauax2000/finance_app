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
  rotuloDoResto,
  rotuloVerOs,
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

  const compromisso =
    bundle && categoryId
      ? buildCategoryCommitmentsForMonth({
          yearMonth: ym,
          transactions: bundle.txs,
          installmentPlans: bundle.installmentPlans,
          subscriptions: bundle.subscriptions,
          creditCards: bundle.creditCards,
        })[categoryId]
      : undefined
  // A mesma reserva da tela da categoria: sem compromisso no mês, o lançado.
  const reserva =
    bundle && categoryId && !compromisso
      ? bundle.txs
          .filter((x) => !bundle.category?.type || x.type === bundle.category.type)
          .reduce((soma, x) => soma + Number(x.amount), 0)
      : null
  // `gasto` (lançado + agendado) é a barra e o "passou"; `lancado` é o ritmo e a comparação.
  const gasto = compromisso?.committedTotal ?? reserva
  const lancado = compromisso?.postedTotal ?? reserva

  const nome = bundle?.category?.name ?? t.category?.name ?? "Categoria"
  const mes = ym ? mesPorExtenso(ym) : ""
  useFatiaDaManchete(
    onManchete,
    gasto == null || lancado == null ? null : { categoria: { nome, mes, gasto, lancado, orcamento } },
  )

  if (!categoryId || !ym || atual.isError) return null
  if (!bundle || gasto == null || lancado == null) return <BlocoContextoEsqueleto />

  const { period_start, period_end } = periodBoundsFromYearMonth(ym)
  const quantos = bundle.txs.filter((x) => x.type === "expense").length
  const link = quantos
    ? {
        href: hrefDaLista([
          { field: "categoria", operator: "is", values: [categoryId] },
          { field: "periodo", operator: "is", values: [period_start, period_end] },
        ]),
        label: rotuloVerOs(quantos, "despesa"),
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
        <Caption>{rotuloDoResto(resto, mesCorrente, diasRestantes)}</Caption>
      </BlocoContexto>
    )
  }

  const mesAnterior = mesPorExtenso(shiftYearMonth(ym, -1))
  // Num mês que passou, o mês anterior inteiro; no corrente, até o mesmo dia (sem o bundle, nada).
  const anteriorTotal = mesCorrente
    ? anterior.data
      ? totalAteODia(anterior.data.txs, corteDoMesAnterior(ym, hoje.getDate()))
      : null
    : bundle.prevMonthCategoryTotal
  // Sem gasto no mês anterior, "R$ 0,00" não compara nada: a linha sai. No corrente, o lado de cá
  // também é só o lançado até hoje — o número grande soma o agendado do resto do mês.
  const comparacao =
    anteriorTotal != null && anteriorTotal > 0
      ? mesCorrente
        ? `até dia ${hoje.getDate()}: ${currencyBRL(lancado)} · ${mesAnterior} até dia ${hoje.getDate()}: ${currencyBRL(anteriorTotal)}`
        : `${mesAnterior}: ${currencyBRL(anteriorTotal)}`
      : null

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
