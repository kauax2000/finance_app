"use client"

import {
  Badge,
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
} from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
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

export default function BadgeDoc() {
  return (
    <>
      <Usage>
        Um rótulo que <strong>descreve</strong>, nunca que age. Se dá para clicar, é <code>Button</code> ou <code>Toggle</code> — um badge clicável não recebe foco nem é anunciado como controle.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="Três degraus: 14, 18 e 22 de altura. Quem manda na altura é a entrelinha, e cada degrau declara a sua — senão xs e sm saem idênticos."
        code={`<Badge size="xs">xs</Badge>
<Badge size="sm">sm</Badge>
<Badge>md</Badge>
<Badge>default</Badge>`}
      >
        <Badge size="xs" tone="neutral">
          xs
        </Badge>
        <Badge size="sm" tone="neutral">
          sm
        </Badge>
        <Badge tone="neutral">md</Badge>
      </DocSection>

      <DocNote title="xs é para dentro de outro controle">
        Os 14px do <code>xs</code> existem para uma contagem caber dentro de um
        botão ou de um item de menu sem esticá-lo. Rótulo que vive sozinho numa
        linha usa <code>sm</code> ou o padrão.
      </DocNote>

      <DocSection
        title="Coloração e estado"
        description="Todas tonais: fundo suave e texto do mesmo matiz. A cor é o estado que o rótulo comunica."
        code={`<Badge>Padrão</Badge>
<Badge tone="neutral">Neutro</Badge>
<Badge tone="success">Pago</Badge>
<Badge tone="warning">Vence hoje</Badge>
<Badge tone="destructive">Atrasado</Badge>
<Badge tone="income">Receita</Badge>
<Badge tone="expense">Despesa</Badge>
<Badge variant="outline" tone="neutral">Rascunho</Badge>`}
      >
        <Badge>Padrão</Badge>
        <Badge tone="neutral">Neutro</Badge>
        <Badge tone="success">Pago</Badge>
        <Badge tone="warning">Vence hoje</Badge>
        <Badge tone="destructive">Atrasado</Badge>
        <Badge tone="income">Receita</Badge>
        <Badge tone="expense">Despesa</Badge>
        <Badge variant="outline" tone="neutral">Rascunho</Badge>
      </DocSection>

      <DocSection
        title="Os dois eixos se cruzam"
        description="variant é a forma, tone é a cor, e os dois se combinam — inclusive contorno na cor do tom."
        code={`<Badge variant="outline" tone="success">Ativa</Badge>`}
      >
        <div className="flex flex-col gap-3">
          {(["soft", "outline"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-2">
              <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
                {v}
              </code>
              {(
                [
                  "primary",
                  "neutral",
                  "success",
                  "warning",
                  "destructive",
                  "income",
                  "expense",
                ] as const
              ).map((t) => (
                <Badge key={t} variant={v} tone={t}>
                  {t}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </DocSection>

      <DocNote title="tone é a cor; variant é só a forma">
        O eixo de cor se chama <code>tone</code>, como no <code>Alert</code>, <code>StatCard</code>, <code>Timeline</code>, <code>Progress</code> e <code>AnnouncementBar</code>. Não misture os dois num ternário: &ldquo;ativa&rdquo; e &ldquo;inativa&rdquo; são tons, não uma cor contra um contorno.
      </DocNote>

      <DocNote title="Dinheiro não é aviso">
        <code>income</code> e <code>expense</code> são mais saturadas que <code>success</code> e <code>destructive</code> de propósito: num extrato, verde e vermelho são o dado, não um juízo. Receita com o verde de &ldquo;deu certo&rdquo; faz o extrato parecer um painel de alertas.
      </DocNote>

      <Group
        title="A mesma superfície fora do Badge"
        description="Quando a tinta tonal entra num elemento que já é outro componente — gatilho de menu, botão de filtro, pílula de linha —, use as constantes tagChip* deste arquivo, as mesmas strings das tintas soft. Rótulo que é só rótulo é Badge."
      >
        <Spec title="Estado" meta="ui/badge.tsx">
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

      <DocNote title="Uma fonte só para a tinta dos chips">
        As tintas <code>soft</code> do <code>Badge</code> e as constantes <code>tagChip*</code> são as mesmas strings, em <code>badge.tsx</code>. Não escreva <code>bg-success-muted text-success-muted-foreground</code> à mão: a tela fica de fora quando o vocabulário mudar.
      </DocNote>

      <DocNote title="tagChipViolet e tagChipSky são apelidos, não cores novas">
        Os dois apontam para os tokens de <code>info</code> e existem só para não quebrar quem os importa. Não use em código novo.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"soft" | "outline"',
            default: '"soft"',
            description:
              "A forma: preenche a tinta suave do tom, ou desenha o contorno na cor dele.",
          },
          {
            prop: "tone",
            type: '"primary" | "neutral" | "success" | "warning" | "destructive" | "income" | "expense"',
            default: '"primary"',
            description: "A cor — o estado que o rótulo comunica.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md"',
            default: '"md"',
            description:
              "Altura: xs 14, sm 18, md 22. xs é para contagem dentro de outro controle.",
          },
        ]}
      />
    </>
  )
}
