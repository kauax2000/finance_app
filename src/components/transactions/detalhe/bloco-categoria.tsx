"use client"

import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
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
  fatiaDoLancamento,
  hrefDaLista,
  rotuloDaVariacao,
  rotuloDoPeso,
  rotuloDoResto,
  rotuloVerOs,
  marcadorDoMes,
  mesPorExtenso,
  totalAteODia,
} from "@/lib/detalhe/blocos"
import { useCategoryDetailBundleQuery } from "@/lib/queries/use-category-detail-bundle"
import type { Transaction } from "@/lib/supabase"
import { tileColorFor } from "@/lib/tile-palette"
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
  // Sem categoria (ou convidado, que não vê orçamento) não há para onde levar.
  const hrefOrcamento = categoryId && !convidado && ym ? categoryDetailPath(categoryId, { month: ym }) : null
  useFatiaDaManchete(
    onManchete,
    gasto == null || lancado == null
      ? null
      : { categoria: { nome, mes, gasto, lancado, orcamento, hrefOrcamento } },
  )

  if (!categoryId || !ym || atual.isError) return null
  if (!bundle || gasto == null || lancado == null) return <BlocoContextoEsqueleto />

  const { period_start, period_end } = periodBoundsFromYearMonth(ym)
  const quantos = bundle.txs.filter((x) => x.type === "expense").length
  // Com mais de um, a lista do mês; com o único, ele mesmo já está aberto: a categoria no mês.
  const link =
    quantos > 1
      ? {
          href: hrefDaLista([
            { field: "categoria", operator: "is", values: [categoryId] },
            { field: "periodo", operator: "is", values: [period_start, period_end] },
          ]),
          label: rotuloVerOs(quantos, "despesa"),
        }
      : quantos === 1 && hrefOrcamento
        ? { href: hrefOrcamento, label: "ver a categoria" }
        : null

  // A fatia e o ponto vestem a cor da categoria pela régua do ladrilho (`tile-vivid`), nunca crua.
  const corDaCategoria = {
    "--tile-color": tileColorFor(bundle.category?.color ?? t.category?.color) ?? "var(--muted-foreground)",
  } as CSSProperties
  // A cor e o `tile-vivid` no mesmo nó: o `className` do `Progress` vai à casca e o `style` à
  // barra, e a conta do `--tile-surface` precisa do `--tile-color` onde ela roda.
  const barraNaCor = (barra: ReactNode) => (
    <div className="tile-vivid [--progress-highlight:var(--tile-surface)]" style={corDaCategoria}>
      {barra}
    </div>
  )
  const ponto = (
    <span aria-hidden className="tile-vivid inline-block size-2 rounded-full bg-(--tile-surface)" style={corDaCategoria} />
  )
  const peso = rotuloDoPeso(Number(t.amount), gasto, quantos)

  if (orcamento != null && orcamento > 0) {
    const resto = orcamento - gasto
    const diasRestantes = diasDoMes(ym) - hoje.getDate()
    return (
      <BlocoContexto titulo={`${nome} em ${mes}`} link={link}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <MoneyDisplay value={gasto} size="lg" />
          <Muted>
            de <MoneyDisplay value={orcamento} />
          </Muted>
        </div>
        {barraNaCor(
          <Progress
            value={gasto}
            max={orcamento}
            bands={BUDGET_BANDS}
            marker={mesCorrente ? marcadorDoMes(hoje) : undefined}
            highlight={fatiaDoLancamento(gasto, Number(t.amount))}
            aria-label={`Orçamento de ${nome} em ${mes}`}
          />,
        )}
        <Caption>
          {ponto} {peso} · {rotuloDoResto(resto, mesCorrente, diasRestantes)}
        </Caption>
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
  // Sem gasto no mês anterior, a variação não compara nada: o selo sai. No corrente, o lado de cá
  // também é só o lançado até hoje — o número grande soma o agendado do resto do mês.
  const variacao =
    anteriorTotal != null && anteriorTotal > 0
      ? rotuloDaVariacao(mesCorrente ? lancado : gasto, anteriorTotal, mesAnterior, mesCorrente ? hoje.getDate() : null)
      : null

  return (
    <BlocoContexto titulo={`${nome} em ${mes}`} link={link}>
      <div className="flex flex-wrap items-center gap-x-2">
        <MoneyDisplay value={gasto} size="lg" />
        {variacao ? (
          <Badge variant="soft" size="sm" tone={variacao.bom ? "success" : "warning"}>
            {variacao.texto}
          </Badge>
        ) : null}
      </div>
      {barraNaCor(
        <Progress
          value={gasto}
          max={gasto}
          highlight={fatiaDoLancamento(gasto, Number(t.amount))}
          aria-label={`Este lançamento no mês de ${nome}`}
        />,
      )}
      <Caption>
        {ponto} {peso}
      </Caption>
      {!convidado ? (
        <Button variant="secondary" size="sm" asChild className="justify-self-start">
          <Link href={categoryDetailPath(categoryId, { month: ym })}>definir orçamento</Link>
        </Button>
      ) : null}
    </BlocoContexto>
  )
}
