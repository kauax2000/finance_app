"use client"

import {
  formatDateLongPtBr,
  formatDatePtBr,
  formatRelativeDayPtBr,
  formatTransactionCompactPtBr,
  formatTransactionDayMonthPtBr,
  formatTransactionDmyPtBr,
  formatTransactionMonthYearPtBr,
} from "@/lib/transaction-date"
import { DocNote, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const HOJE = new Date().toISOString()
const REF = "2026-03-05T12:00:00.000Z"

const FORMATOS: [string, string, string][] = [
  ["formatDatePtBr", formatDatePtBr(REF), "o padrão de uma tela de detalhe"],
  ["formatDateLongPtBr", formatDateLongPtBr(REF), "quando a data é o assunto"],
  ["formatTransactionDmyPtBr", formatTransactionDmyPtBr(REF), "coluna de tabela"],
  ["formatTransactionDayMonthPtBr", formatTransactionDayMonthPtBr(REF), "agrupador de extrato"],
  ["formatTransactionCompactPtBr", formatTransactionCompactPtBr(REF), "espaço apertado"],
  ["formatTransactionMonthYearPtBr", formatTransactionMonthYearPtBr(REF), "seletor de período"],
  ["formatRelativeDayPtBr", formatRelativeDayPtBr(HOJE), "as últimas linhas do extrato"],
]

export default function DatasDoc() {
  return (
    <>
      <Usage>
        Todas em <code>src/lib/transaction-date.ts</code>. Nenhuma tela chama <code>toLocaleDateString</code> direto: a diferença entre <code>05/03/26</code> e <code>5 de março</code> é decisão de produto, e mora num lugar só.
      </Usage>

      <Group title="Os formatos">
        <Spec title="Saídas" meta="lib/transaction-date.ts">
          <Stack className="gap-3">
            {FORMATOS.map(([fn, saida, uso]) => (
              <div key={fn} className="flex flex-col">
                <code className="font-mono text-2xs text-muted-foreground">
                  {fn}()
                </code>
                <span className="text-sm font-medium text-foreground">
                  {saida}
                </span>
                <span className="text-xs text-muted-foreground">{uso}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Quando usar o relativo">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Hoje / Ontem</strong>{" "}
              ajuda nas
              últimas linhas de um extrato, onde a pessoa está conferindo o que
              acabou de gastar.
            </p>
            <p>
              Depois de uns três dias ele atrapalha: &ldquo;há 9 dias&rdquo;
              obriga a fazer a conta de cabeça para saber se foi antes ou depois
              do fechamento da fatura.
            </p>
            <p>
              Em tela de detalhe, extrato exportado e comprovante, a data é
              sempre absoluta.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Fuso: a data de uma transação é uma data, não um instante">
        Uma compra do dia 1º não pode virar 28 de fevereiro porque o servidor está em UTC. <code>parseYmdLocal</code> e <code>localYmdFromDate</code> tratam <code>2026-03-01</code> como dia do calendário local; <code>calendarYmdToStorageIso</code> faz o caminho de volta.
      </DocNote>

      <DocNote title="O travessão como valor vazio">
        Numa célula sem data, o <code>—</code>{" "}
        não é pontuação: é um símbolo que
        significa &ldquo;sem dado&rdquo;, com a mesma função de um ícone. Trocar
        por hífen leria como erro de digitação, e deixar em branco leria como
        bug.
      </DocNote>
    </>
  )
}
