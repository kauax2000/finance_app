"use client"

import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/16/solid"

import {
  Badge,
  BadgeDot,
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
<Badge>md</Badge>`}
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
<Badge tone="info">Em análise</Badge>
<Badge tone="warning">Vence hoje</Badge>
<Badge tone="destructive">Atrasado</Badge>
<Badge tone="income">Receita</Badge>
<Badge tone="expense">Despesa</Badge>
<Badge variant="outline" tone="neutral">Rascunho</Badge>`}
      >
        <Badge>Padrão</Badge>
        <Badge tone="neutral">Neutro</Badge>
        <Badge tone="success">Pago</Badge>
        <Badge tone="info">Em análise</Badge>
        <Badge tone="warning">Vence hoje</Badge>
        <Badge tone="destructive">Atrasado</Badge>
        <Badge tone="income">Receita</Badge>
        <Badge tone="expense">Despesa</Badge>
        <Badge variant="outline" tone="neutral">Rascunho</Badge>
      </DocSection>

      <DocSection
        title="Os dois eixos se cruzam"
        description="variant é a forma, tone é a cor, e os dois se combinam — inclusive contorno na cor do tom. Na contrast o tom não pinta a superfície: ele fica só no dot."
        code={`<Badge variant="outline" tone="success">Ativa</Badge>`}
      >
        <div className="flex flex-col gap-3">
          {(["soft", "outline", "contrast"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-2">
              <code className="w-20 shrink-0 font-mono text-2xs text-muted-foreground">
                {v}
              </code>
              {(
                [
                  "primary",
                  "neutral",
                  "success",
                  "info",
                  "warning",
                  "destructive",
                  "income",
                  "expense",
                ] as const
              ).map((t) => (
                <Badge key={t} variant={v} tone={t}>
                  {v === "contrast" ? <BadgeDot /> : null}
                  {t}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Ícone"
        description="O respiro e o corpo do glifo são do componente. Não escreva gap-1 nem size-3 na tela — e nunca mr-1, que foi o que uma tela inventou quando o Badge ainda não dava gap nenhum."
        code={`<Badge tone="success">
  <CheckCircleIcon />
  Pago
</Badge>`}
      >
        <Badge tone="success">
          <CheckCircleIcon />
          Pago
        </Badge>
        <Badge tone="warning">
          <ClockIcon />
          Vence hoje
        </Badge>
        <Badge tone="income" size="sm">
          <ArrowTrendingUpIcon />
          +12%
        </Badge>
        <Badge tone="neutral" size="xs">
          <ClockIcon />
          xs
        </Badge>
      </DocSection>

      <DocNote title="O conjunto do ícone aqui é sempre o micro">
        O corpo vai de 10 a 12px — <code>size-2.5</code> no <code>xs</code>, <code>size-3</code> nos outros dois —, e tudo que é <code>size-4</code> ou menor usa <code>@heroicons/react/16/solid</code>. O conjunto de 24 num chip sai com traço fino demais para sobreviver, e a regra G do auditor não tem exceção para o <code>Badge</code>.
      </DocNote>

      <DocSection
        title="O ponto de estado"
        description="Duas formas: pulsando, para o que está acontecendo agora, e parado, para o que só está sendo relatado. A cor sai do tone; o dot não escolhe cor nenhuma."
        code={`<Badge variant="contrast" tone="info">
  <BadgeDot pulse />
  Sincronizando
</Badge>

<Badge variant="contrast" tone="success">
  <BadgeDot />
  Conectado
</Badge>`}
      >
        <Badge variant="contrast" tone="info">
          <BadgeDot pulse />
          Sincronizando
        </Badge>
        <Badge variant="contrast" tone="success">
          <BadgeDot />
          Conectado
        </Badge>
        <Badge variant="contrast" tone="destructive">
          <BadgeDot pulse />
          Fora do ar
        </Badge>
        <Badge tone="success">
          <BadgeDot />
          Aberta
        </Badge>
        <Badge variant="outline" tone="warning">
          <BadgeDot pulse />
          Processando
        </Badge>
      </DocSection>

      <DocNote title="Pulsa é animate-ping, e isso é decisão de acessibilidade">
        O bloco global de <code>prefers-reduced-motion</code> isenta <code>animate-spin</code> e <code>animate-pulse</code> do corte — um spinner parado é um componente quebrado, e um esqueleto parado não diz que está carregando. Um ponto decorativo não tem essa desculpa, então ele usa <code>animate-ping</code>, que <strong>não</strong> é isento: para quem pede menos movimento o anel simplesmente não roda, e sobra o núcleo sólido. Nada de <code>motion-reduce:</code> escrito à mão.
      </DocNote>

      <DocNote title="A pílula grave é escura nos dois temas">
        <code>variant=&quot;contrast&quot;</code> não inverte com o tema. No claro ela é a tecla preta do <code>primary</code>; no escuro a tecla fica branca, então a superfície troca para o cinza levantado do <code>secondary</code> — o mesmo <code>oklch(0.269 0 0)</code> de <code>muted</code> e <code>accent</code>. É o que mantém o ponto aceso contra um fundo grave nas duas leituras, que é a razão de a forma existir.
      </DocNote>

      <DocSection
        title="A marca"
        description="O arco-íris em contorno de 1px e num halo borrado atrás, com o miolo chapado. Uma por tela, pela mesma razão do Button: acento em todo chip deixa de ser acento."
        code={`<Badge variant="brand">
  <BadgeDot pulse />
  Beta
</Badge>`}
      >
        <Badge variant="brand">Beta</Badge>
        <Badge variant="brand" size="sm">
          Novo
        </Badge>
        <Badge variant="brand">
          <CheckCircleIcon />
          Pro
        </Badge>
      </DocSection>

      <DocNote title="O texto não pousa no arco-íris, e é isso que torna a peça legítima">
        Sete matizes não têm um contraste só — é por isso que o <code>AGENTS.md</code> proíbe arco-íris num chip. Aqui o degradê fica na borda de 1px e no halo; o miolo é o preenchimento chapado do <code>primary</code>, então o rótulo tem exatamente o contraste do botão primário. Arco-íris <strong>sob</strong> texto continua proibido.
      </DocNote>

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
            type: '"soft" | "outline" | "contrast" | "brand"',
            default: '"soft"',
            description:
              "A forma: tinta suave do tom, contorno na cor dele, a pílula grave (onde o tom fica só no dot) ou o arco-íris da marca.",
          },
          {
            prop: "tone",
            type: '"primary" | "neutral" | "success" | "info" | "warning" | "destructive" | "income" | "expense"',
            default: '"primary"',
            description: "A cor — o estado que o rótulo comunica.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md"',
            default: '"md"',
            description:
              "Altura: xs 14, sm 18, md 22. xs é para contagem dentro de outro controle. O degrau também decide o corpo do ícone.",
          },
          {
            prop: "BadgeDot pulse",
            type: "boolean",
            default: "false",
            description:
              "O ponto pulsa em vez de ficar parado. A cor vem do tone do Badge, nunca do dot.",
          },
        ]}
      />
    </>
  )
}
