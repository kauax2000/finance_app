"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  DescriptionDetails,
  DescriptionHint,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DescriptionListDoc() {
  return (
    <>
      <Usage>
          Pares rótulo/valor numa tela de detalhe. É um <code>&lt;dl&gt;</code> de verdade, então o leitor de tela associa cada valor ao rótulo. Para linhas com mídia e ações é <code>Item</code>; para várias colunas comparáveis, <code>Table</code>.
      </Usage>

      <DocSection
        title="Empilhado"
        description="O padrão, e o que serve no telefone: rótulo em cima, valor embaixo."
        code={`<DescriptionList>
  <DescriptionListItem>
    <DescriptionTerm>Fechamento</DescriptionTerm>
    <DescriptionDetails>28 de março</DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList className="w-full max-w-sm">
          <DescriptionListItem>
            <DescriptionTerm>Fechamento</DescriptionTerm>
            <DescriptionDetails>28 de março</DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Vencimento</DescriptionTerm>
            <DescriptionDetails>5 de abril</DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Total da fatura</DescriptionTerm>
            <DescriptionDetails>
              <MoneyDisplay value={-1482.3} tone="expense" />
            </DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Em linha"
        description="Rótulo à esquerda e valor à direita a partir de sm; abaixo disso, empilha. O layout se declara uma vez, na lista."
        code={`<DescriptionList layout="inline">
  <DescriptionListItem>
    <DescriptionTerm>Limite total</DescriptionTerm>
    <DescriptionDetails>
      <MoneyDisplay value={8000} />
    </DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="inline" className="w-full max-w-sm">
          {[
            ["Limite total", 8000],
            ["Limite usado", 1482.3],
            ["Disponível", 6517.7],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={value as number} />
              </DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Extrato"
        description="divided põe o fio entre os pares, como numa fatura. A linha do total usa size='lg' no valor — o total pesa, o rótulo não."
        code={`<DescriptionList layout="inline" divided>
  …
  <DescriptionListItem>
    <DescriptionTerm>Total</DescriptionTerm>
    <DescriptionDetails size="lg">
      <MoneyDisplay value={-1482.3} tone="expense" />
    </DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <Card className="w-full max-w-sm">
          <CardContent>
            <DescriptionList layout="inline" divided>
              {[
                ["Compras do período", 1284.6],
                ["Parcelamentos", 197.7],
                ["Encargos", 0],
              ].map(([term, value]) => (
                <DescriptionListItem key={term}>
                  <DescriptionTerm>{term}</DescriptionTerm>
                  <DescriptionDetails>
                    <MoneyDisplay value={value as number} />
                  </DescriptionDetails>
                </DescriptionListItem>
              ))}
              <DescriptionListItem>
                <DescriptionTerm>Total da fatura</DescriptionTerm>
                <DescriptionDetails size="lg">
                  <MoneyDisplay value={-1482.3} tone="expense" />
                </DescriptionDetails>
              </DescriptionListItem>
            </DescriptionList>
          </CardContent>
        </Card>
      </DocSection>

      <DocSection
        title="Rótulo em caixa alta, valor de destaque e nota"
        description="term=&quot;eyebrow&quot; põe os rótulos em caixa alta, 11px e espaçados — a sobrancelha dos painéis. size=&quot;xl&quot; no valor é o número da tela. DescriptionHint é a linha miúda que explica o valor, dentro do <dd>: o leitor de tela a lê como parte da definição."
        code={`<DescriptionList layout="grid" term="eyebrow">
  <DescriptionListItem>
    <DescriptionTerm>Ticket médio</DescriptionTerm>
    <DescriptionDetails size="xl">
      R$ 86,40
      <DescriptionHint>Valor médio por despesa na fatura aberta.</DescriptionHint>
    </DescriptionDetails>
  </DescriptionListItem>
</DescriptionList>`}
        previewClassName="items-stretch"
      >
        <DescriptionList layout="grid" term="eyebrow" className="w-full max-w-md">
          <DescriptionListItem>
            <DescriptionTerm>Ticket médio</DescriptionTerm>
            <DescriptionDetails size="xl">
              <MoneyDisplay value={86.4} />
              <DescriptionHint>Valor médio por despesa na fatura aberta.</DescriptionHint>
            </DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Ticket mediano</DescriptionTerm>
            <DescriptionDetails size="xl">
              <MoneyDisplay value={41.9} />
              <DescriptionHint>Metade das despesas ficou abaixo deste valor.</DescriptionHint>
            </DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
      </DocSection>

      <DocSection
        title="Em grade, e as colunas"
        description="grid reparte os pares em duas colunas a partir de sm. columns fixa o número de colunas em qualquer largura — o painel de acesso tem dois por dois já no telefone. align=&quot;end&quot; encosta o par à direita."
        code={`<DescriptionList layout="grid">…</DescriptionList>
<DescriptionList layout="grid" columns={3}>
  …
  <DescriptionListItem align="end">…</DescriptionListItem>
</DescriptionList>`}
        previewClassName="flex-col items-stretch gap-8"
      >
        <DescriptionList layout="grid" className="w-full max-w-md">
          {[
            ["Bandeira", "Mastercard"],
            ["Final", "4821"],
            ["Fechamento", "28 de março"],
            ["Vencimento", "5 de abril"],
            ["Limite total", 8000],
            ["Disponível", 6517.7],
          ].map(([term, value]) => (
            <DescriptionListItem key={term}>
              <DescriptionTerm>{term}</DescriptionTerm>
              <DescriptionDetails>
                {typeof value === "number" ? <MoneyDisplay value={value} /> : value}
              </DescriptionDetails>
            </DescriptionListItem>
          ))}
        </DescriptionList>
        <DescriptionList layout="grid" columns={3} size="sm" className="w-full max-w-md">
          <DescriptionListItem>
            <DescriptionTerm>Pago em 90 dias</DescriptionTerm>
            <DescriptionDetails><MoneyDisplay value={1240} /></DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem>
            <DescriptionTerm>Pendente</DescriptionTerm>
            <DescriptionDetails><MoneyDisplay value={310} /></DescriptionDetails>
          </DescriptionListItem>
          <DescriptionListItem align="end">
            <DescriptionTerm>Próxima</DescriptionTerm>
            <DescriptionDetails>12/05</DescriptionDetails>
          </DescriptionListItem>
        </DescriptionList>
      </DocSection>

      <DocNote title="O layout se declara uma vez">
          <code>&lt;DescriptionList layout=&quot;inline&quot;&gt;</code> desce para os itens por <code>data-layout</code>. O prop no item é só a sobrescrita para a linha que foge do padrão.
      </DocNote>

      <DocNote title="Não dê ao item uma base que colida com o layout">
          <code>in-*</code> compila com <code>:where()</code> e perde para uma classe base no mesmo elemento. Funciona porque a base do item é só <code>min-w-0</code>; um <code>flex-col</code> ou <code>text-*</code> fixo quebraria a herança.
      </DocNote>

      <DocNote title="Sem gap entre termo e valor">
        O <code>gap</code> do componente fica entre um par e o próximo, nunca
        dentro do par: rótulo sobre valor é o mesmo dado em duas linhas, e quem
        os separa é a entrelinha.
      </DocNote>

      <DocNote title="O rótulo em caixa alta vem da lista, e não do termo">
          <code>term=&quot;eyebrow&quot;</code> é aplicado pela <code>&lt;dl&gt;</code>, num seletor que desce um nível só: o painel de acesso é server component, e ler contexto no termo o obrigaria a virar cliente. O <code>Caption</code> do termo declara <code>text-xs</code>, e o seletor da lista tem mais especificidade que uma classe — é o que vence. Não escreva <code>text-2xs uppercase tracking-wide</code> num <code>DescriptionTerm</code>.
      </DocNote>

      <DocNote title="Onde o app usa">
          Em oito telas: o cartão e a fatura (o total planejado, os hábitos de consumo, os tickets), as duas contas a pagar, o painel de faturas, o resumo da categoria, o painel de acesso e o <code>HistogramSlider</code>. Desde a rodada 190 nenhuma escreve o rótulo em caixa alta, o valor em <code>font-semibold</code>, a nota em <code>text-2xs</code> nem as colunas por <code>className</code>. O painel de faturas trocou a quebra em 480px, escrita à mão, pelo <code>layout=&quot;inline&quot;</code>, que quebra em 640px.
      </DocNote>

      <DocNote title="Figuras tabulares de fábrica">
          <code>.nums</code> sai em todo <code>DescriptionDetails</code>: dígito em lista de detalhe é dado, e sem figuras tabulares a coluna não alinha. Não escreva <code>className=&quot;nums&quot;</code> à mão.
      </DocNote>

      <PropsTable
        title="Props de DescriptionList"
        rows={[
          {
            prop: "layout",
            type: '"stacked" | "inline" | "grid"',
            default: '"stacked"',
            description:
              "Declarado uma vez. Desce para os itens por data-layout.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "O respiro entre pares.",
          },
          {
            prop: "divided",
            type: "boolean",
            default: "false",
            description:
              "Fio entre os pares; ignorado em grid.",
          },
          {
            prop: "term",
            type: '"caption" | "eyebrow"',
            default: '"caption"',
            description: "eyebrow põe os rótulos em caixa alta, 11px e espaçados.",
          },
          {
            prop: "columns",
            type: "2 | 3",
            description: "Só em grid: as colunas em qualquer largura.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "DescriptionListItem",
            type: 'layout? · align?: "start" | "end"',
            default: 'herdado · "start"',
            description: "Sobrescrita local do layout; end encosta o par à direita.",
          },
          {
            prop: "DescriptionTerm",
            type: "ComponentProps<'dt'>",
            description: "O rótulo. Sempre quieto, mesmo na linha do total.",
          },
          {
            prop: "DescriptionDetails",
            type: 'size?: "sm" | "lg" | "xl"',
            default: '"sm"',
            description:
              "O valor, com .nums; lg é a linha do total, xl o número da tela.",
          },
          {
            prop: "DescriptionHint",
            type: "ComponentProps<'span'>",
            description: "A linha miúda que explica o valor, dentro do <dd>.",
          },
        ]}
      />
    </>
  )
}
