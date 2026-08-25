"use client"

import {
  tagChipDanger,
  tagChipExpense,
  tagChipFilterIdle,
  tagChipFilterSelected,
  tagChipIncome,
  tagChipInfo,
  tagChipNeutral,
  tagChipSuccess,
  tagChipUnreadCount,
  tagChipWarning,
} from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DocNote, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const CHIPS: [string, string, string][] = [
  ["tagChipSuccess", tagChipSuccess, "concluído, pago, ativo"],
  ["tagChipWarning", tagChipWarning, "vence hoje, perto do limite"],
  ["tagChipDanger", tagChipDanger, "atrasado, cancelado, falhou"],
  ["tagChipInfo", tagChipInfo, "informativo, em análise"],
  ["tagChipNeutral", tagChipNeutral, "pendente, rascunho, sem estado"],
  ["tagChipIncome", tagChipIncome, "receita"],
  ["tagChipExpense", tagChipExpense, "despesa"],
]

export default function ChipsStatusDoc() {
  return (
    <>
      <Usage>
        A superfície tonal para quando ela precisa entrar num elemento que <strong>já é outro componente</strong> — gatilho de menu, botão de filtro. Quando o rótulo é só rótulo, use <code>Badge</code>.
      </Usage>

      <Group title="Os chips">
        <Spec title="Estado" meta="lib/tag-chip-classes.ts">
          <Stack className="gap-2.5">
            {CHIPS.map(([nome, classe, uso]) => (
              <div key={nome} className="flex items-center gap-3">
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    classe
                  )}
                >
                  Exemplo
                </span>
                <div className="flex min-w-0 flex-col">
                  <code className="font-mono text-2xs text-foreground">
                    {nome}
                  </code>
                  <span className="text-xs text-muted-foreground">{uso}</span>
                </div>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Filtro e contagem">
          <Stack className="gap-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  tagChipFilterSelected
                )}
              >
                Selecionado
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  tagChipFilterIdle
                )}
              >
                Disponível
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "nums rounded-full px-1.5 py-0.5 text-2xs font-medium",
                  tagChipUnreadCount
                )}
              >
                3
              </span>
              <span className="text-xs text-muted-foreground">
                não lidas — sem hover, porque não é clicável
              </span>
            </div>
          </Stack>
        </Spec>
      </Group>

      <Group title="O mesmo estado como Badge">
        <Spec title="Quando o rótulo é só rótulo">
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Pago</Badge>
            <Badge variant="warning">Vence hoje</Badge>
            <Badge variant="destructive">Atrasado</Badge>
            <Badge variant="secondary">Pendente</Badge>
            <Badge variant="income">Receita</Badge>
            <Badge variant="expense">Despesa</Badge>
          </div>
        </Spec>
      </Group>

      <DocNote title="Nunca duplique estas classes numa tela">
        O motivo de o arquivo existir é ser o único lugar onde a lista de estados
        vive. Uma tela que escreve <code>bg-success-muted text-success-muted-foreground</code>{" "}
        à mão fica de fora quando o vocabulário mudar.
      </DocNote>

      <DocNote title="tagChipViolet e tagChipSky são apelidos, não cores novas">
        Os dois apontam para os tokens de <code>info</code>. Ficaram dos tempos
        em que as telas escolhiam a cor pelo tom, e continuam existindo só para
        não quebrar quem os importa. Não use em código novo.
      </DocNote>
    </>
  )
}
