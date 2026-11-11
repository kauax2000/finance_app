"use client"

import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { Bar, BarChart, Cell } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption, Muted } from "@/components/ui/typography"
import { descricaoSemParcela, hrefDaLista, rotuloVerOs } from "@/lib/detalhe/blocos"
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

// Neutro, e não a rampa: a barra é a mesma despesa, e só esta vez acende.
const CONFIG = { valor: { label: "Valor", color: "var(--primary-accent)" } } satisfies ChartConfig
/** As outras vezes apagadas, na mesma opacidade do realce dos gráficos (`CHART_HOVER_DIM_OPACITY`). */
const APAGADA = 0.45

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
  const de = ymd ? addDaysYmd(ymd, -89) : ""
  const consulta = useTransactionsRangeQuery(
    currentWorkspaceId,
    ymd ? { from: filterRangeStartIso(de), to: filterRangeEndIso(ymd) } : { from: "", to: "" },
    { enabled: ligado },
  )

  const historico = useMemo(() => {
    // Desligado, o cache da mesma janela ainda pode responder: nada de histórico nem de manchete.
    if (!ligado || !consulta.data) return undefined
    // A RLS já deixa o convidado só com as dele. O alvo entra mesmo se a página o cortou.
    const despesas = consulta.data.filter((x) => x.type === "expense")
    if (!despesas.some((x) => x.id === t.id)) despesas.push(t)
    return historicoDe(
      { ...t, amount: Number(t.amount) },
      despesas.map((x) => ({ ...x, amount: Number(x.amount) })),
    )
  }, [ligado, consulta.data, t])

  // Desligado (a edição tirou a descrição) ou com erro, manda o vazio: a fatia velha sai da manchete.
  useFatiaDaManchete(
    onManchete,
    !ligado || consulta.isError
      ? { historico: null }
      : historico === undefined
        ? null
        : { historico: historico && { nome, valor: Number(t.amount), media: historico.media } },
  )

  if (!ligado || consulta.isError) return null
  if (historico === undefined) return <BlocoContextoEsqueleto />
  if (historico === null) return null

  const dados = historico.barras.map((b, i) => ({ vez: i, valor: b.valor, atual: b.atual }))

  return (
    <BlocoContexto
      titulo={`${nome} nos últimos 90 dias`}
      link={{
        href: hrefDaLista([
          { field: "descricao", operator: "contains", values: [nome] },
          { field: "periodo", operator: "is", values: [de, ymd ?? ""] },
        ]),
        label: rotuloVerOs(historico.vezes, "despesa"),
      }}
    >
      {/* Barras pequenas, sem eixo nem grade: a forma das últimas vezes, com esta acesa. */}
      <ChartContainer
        config={CONFIG}
        aspect="auto"
        label={`As últimas ${dados.length} vezes de ${nome}, esta destacada`}
        className="h-12 w-full"
      >
        <BarChart data={dados} accessibilityLayer>
          <Bar dataKey="valor" fill="var(--color-valor)" radius={[3, 3, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.vez} fillOpacity={d.atual ? 1 : APAGADA} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <Muted>
        {historico.vezes} vezes · <MoneyDisplay value={historico.total} className="font-medium text-foreground" />
      </Muted>
      <Caption>média {currencyBRL(historico.media)}</Caption>
    </BlocoContexto>
  )
}
