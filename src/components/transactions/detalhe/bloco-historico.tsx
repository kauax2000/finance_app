"use client"

import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { ChartBars, type ChartConfig } from "@/components/ui/chart"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption, Muted } from "@/components/ui/typography"
import { descricaoSemParcela, hrefDaLista } from "@/lib/detalhe/blocos"
import { historicoDe } from "@/lib/detalhe/contexto"
import { currencyBRL } from "@/lib/formatters"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import type { Transaction } from "@/lib/supabase"
import { addDaysYmd, filterRangeEndIso, filterRangeStartIso, transactionLocalYmd } from "@/lib/transaction-date"
import {
  BlocoContexto,
  BlocoContextoEsqueleto,
  useFatiaDaManchete,
  type AoMudarManchete,
} from "./bloco-contexto"

const CONFIG = { valor: { label: "Valor", color: "var(--chart-1)" } } satisfies ChartConfig

/** A mesma descrição nos 90 dias até esta: aparece com 3 vezes ou mais, contando esta. */
export function BlocoHistorico({
  transaction: t,
  onManchete,
}: {
  transaction: Transaction
  onManchete?: AoMudarManchete
}) {
  const { currentWorkspaceId } = useWorkspace()
  const nome = descricaoSemParcela(t.description ?? "")
  const ymd = transactionLocalYmd(t.date)
  const ligado = t.type === "expense" && Boolean(nome) && Boolean(ymd)
  const consulta = useTransactionsRangeQuery(
    currentWorkspaceId,
    ymd ? { from: filterRangeStartIso(addDaysYmd(ymd, -89)), to: filterRangeEndIso(ymd) } : { from: "", to: "" },
    { enabled: ligado },
  )

  const historico = useMemo(() => {
    if (!consulta.data) return undefined
    // A RLS já deixa o convidado só com as dele. O alvo entra mesmo se a página o cortou.
    const despesas = consulta.data.filter((x) => x.type === "expense")
    if (!despesas.some((x) => x.id === t.id)) despesas.push(t)
    return historicoDe(
      { ...t, amount: Number(t.amount) },
      despesas.map((x) => ({ ...x, amount: Number(x.amount) })),
    )
  }, [consulta.data, t])

  useFatiaDaManchete(
    onManchete,
    historico === undefined
      ? null
      : { historico: historico && { nome, valor: Number(t.amount), media: historico.media } },
  )

  if (!ligado || consulta.isError) return null
  if (historico === undefined) return <BlocoContextoEsqueleto />
  if (historico === null) return null

  const dados = historico.barras.map((b, i) => ({ vez: `${i + 1}ª`, valor: b.valor }))
  const atual = historico.barras.findIndex((b) => b.atual)

  return (
    <BlocoContexto
      titulo={`${nome} nos últimos 90 dias`}
      link={{
        href: hrefDaLista([{ field: "descricao", operator: "contains", values: [nome] }]),
        label: `ver os ${historico.vezes}`,
      }}
    >
      <ChartBars
        config={CONFIG}
        data={dados}
        x="vez"
        label={`As últimas ${dados.length} vezes de ${nome}`}
        selected={atual >= 0 ? dados[atual].vez : null}
        aspect="wide"
      />
      <Muted>
        {historico.vezes} vezes · <MoneyDisplay value={historico.total} className="font-medium text-foreground" />
      </Muted>
      <Caption>média {currencyBRL(historico.media)}</Caption>
    </BlocoContexto>
  )
}
