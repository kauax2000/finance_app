"use client"

import { useMemo } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { Bar, BarChart, Cell } from "recharts"
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartReferenceLine, type ChartConfig } from "@/components/ui/chart"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Caption } from "@/components/ui/typography"
import { descricaoSemParcela, hrefDaLista, rotuloVerOs } from "@/lib/detalhe/blocos"
import { contraAMedia, duplicadoDe, historicoDe } from "@/lib/detalhe/contexto"
import { currencyBRL } from "@/lib/formatters"
import { useTransactionsRangeQuery } from "@/lib/queries/use-transactions-range"
import type { Transaction } from "@/lib/supabase"
import {
  addDaysYmd,
  filterRangeEndIso,
  filterRangeStartIso,
  formatMonthShortPtBr,
  parseYmdLocal,
  transactionLocalYmd,
} from "@/lib/transaction-date"
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
    ymd ? { from: filterRangeStartIso(de), to: filterRangeEndIso(addDaysYmd(ymd, 2)) } : { from: "", to: "" },
    { enabled: ligado },
  )

  const { historico, duplicado } = useMemo(() => {
    // Desligado, o cache da mesma janela ainda pode responder: nada de histórico nem de manchete.
    if (!ligado || !consulta.data) return { historico: undefined, duplicado: null }
    // A RLS já deixa o convidado só com as dele. O alvo entra mesmo se a página o cortou.
    const despesas = consulta.data.filter((x) => x.type === "expense")
    if (!despesas.some((x) => x.id === t.id)) despesas.push(t)
    const lista = despesas.map((x) => ({ ...x, amount: Number(x.amount) }))
    const alvo = { ...t, amount: Number(t.amount) }
    // A janela passa 2 dias da data (o repetido pode vir depois); o histórico só olha até a data.
    return { historico: historicoDe(alvo, lista), duplicado: duplicadoDe(alvo, lista) }
  }, [ligado, consulta.data, t])

  const hrefHistorico = hrefDaLista([
    { field: "descricao", operator: "contains", values: [nome] },
    { field: "periodo", operator: "is", values: [de, ymd ?? ""] },
  ])
  const hrefDuplicado =
    ymd && nome
      ? hrefDaLista([
          { field: "descricao", operator: "contains", values: [nome] },
          { field: "periodo", operator: "is", values: [addDaysYmd(ymd, -2), addDaysYmd(ymd, 2)] },
        ])
      : ""
  const diaDoDuplicado = duplicado ? transactionLocalYmd(duplicado.date) : null
  const diaCurto = diaDoDuplicado ? parseYmdLocal(diaDoDuplicado) : null

  // Desligado (a edição tirou a descrição) ou com erro, manda o vazio: a fatia velha sai da manchete.
  useFatiaDaManchete(
    onManchete,
    !ligado || consulta.isError
      ? { historico: null, duplicado: null }
      : historico === undefined
        ? null
        : {
            historico: historico && {
              nome,
              valor: Number(t.amount),
              media: historico.media,
              outros: historico.outros,
              href: hrefHistorico,
            },
            duplicado:
              duplicado && diaCurto
                ? {
                    nome,
                    valor: Number(t.amount),
                    dia: `${diaCurto.getDate()} de ${formatMonthShortPtBr(diaCurto)}`,
                    href: hrefDuplicado,
                  }
                : null,
          },
  )

  if (!ligado || consulta.isError) return null
  if (historico === undefined) return <BlocoContextoEsqueleto />
  if (historico === null) return null

  const dados = historico.barras.map((b, i) => ({ vez: i, valor: b.valor, atual: b.atual }))
  const valor = Number(t.amount)
  const contra = contraAMedia(valor, historico.media)
  const primeira = historico.barras[0] ? transactionLocalYmd(historico.barras[0].data) : null
  const diaDaPrimeira = primeira ? parseYmdLocal(primeira) : null

  return (
    <BlocoContexto
      titulo={`${nome} nos últimos 90 dias`}
      link={{
        href: hrefHistorico,
        label: rotuloVerOs(historico.vezes, "despesa"),
      }}
    >
      {/* A pergunta da tela: esta saiu mais cara ou mais barata que o normal? */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MoneyDisplay value={valor} className="text-base font-medium" />
        {contra.direcao === "na" ? (
          <Badge tone="neutral">na média</Badge>
        ) : (
          <Badge tone={contra.direcao === "abaixo" ? "success" : "warning"}>
            {contra.direcao === "abaixo" ? <ArrowDownIcon aria-hidden /> : <ArrowUpIcon aria-hidden />}
            {currencyBRL(contra.diferenca)} {contra.direcao} da média
          </Badge>
        )}
      </div>
      {/* Barras pequenas com a régua da média: a forma das últimas vezes, com esta acesa. */}
      <ChartContainer
        config={CONFIG}
        aspect="auto"
        label={`As últimas ${dados.length} vezes de ${nome}, esta destacada, com a média de ${currencyBRL(historico.media)}`}
        className="h-14 w-full"
      >
        <BarChart data={dados} accessibilityLayer>
          <Bar dataKey="valor" fill="var(--color-valor)" radius={[3, 3, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.vez} fillOpacity={d.atual ? 1 : APAGADA} />
            ))}
          </Bar>
          <ChartReferenceLine y={historico.media} tone="average" ifOverflow="extendDomain" />
        </BarChart>
      </ChartContainer>
      <div className="flex justify-between">
        <Caption>{diaDaPrimeira ? `${diaDaPrimeira.getDate()} ${formatMonthShortPtBr(diaDaPrimeira)}` : null}</Caption>
        <Caption>esta</Caption>
      </div>
      <Caption className="nums">
        {historico.vezes} vezes · {currencyBRL(historico.total)} no total · média {currencyBRL(historico.media)}
      </Caption>
    </BlocoContexto>
  )
}
