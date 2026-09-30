"use client"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleLabel,
  CollapsibleMarker,
  CollapsibleRow,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Kbd } from "@/components/ui/kbd"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TEXTO_LONGO = [
  "A fatura fecha no dia de fechamento do cartão e vence alguns dias depois. Compras feitas entre o fechamento e o vencimento não entram na fatura que está aberta: elas caem na do mês seguinte, junto com a próxima parcela de tudo o que foi parcelado.",
  "O limite disponível não acompanha o fechamento. Ele volta a subir quando o pagamento é compensado, e não quando a fatura fecha — que é a razão de o valor mostrado aqui e o do aplicativo do banco divergirem por alguns dias todo mês.",
  "Parcelas futuras aparecem na projeção, e não no orçamento do mês corrente. O orçamento conta o que sai da conta agora; a projeção conta o que já está comprometido.",
]

/** Um degrau por vez, para a espiada ser comparável entre eles. */
const ESPIADAS = [
  ["sm", "≈3 linhas. O mínimo em que a espiada ainda informa alguma coisa."],
  ["md", "≈5 linhas. O parágrafo de abertura inteiro."],
  ["lg", "≈7 linhas. Quando o começo já é a resposta para a maioria."],
] as const

export default function CollapsibleDoc() {
  return (
    <>
      <Usage>
        Um bloco que expande — o <code>Accordion</code> de um item só, sem a
        semântica de lista. Para detalhes avançados de um formulário, ou para o
        resto de um texto longo.
      </Usage>

      <DocSection
        title="A linha pronta"
        description="CollapsibleRow é o gatilho já desenhado, com a régua do Accordion: degrau md, lg ou xl, o rótulo sublinhando no cursor, trailing na outra ponta, o marcador de qualquer lado e 44px no dedo. É o que o formulário de cartão e o painel da fatura vestem."
        code={`<Collapsible>
  <CollapsibleRow trailing={<MoneyDisplay value={-612.4} />}>Mercado</CollapsibleRow>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
        previewClassName="flex-col items-stretch gap-2"
      >
        <Collapsible>
          <CollapsibleRow trailing={<MoneyDisplay value={-612.4} />}>
            Mercado
          </CollapsibleRow>
          <CollapsibleContent>
            <p className="pt-1 text-sm text-muted-foreground">
              14 lançamentos, o maior de R$ 186,00 no dia 12.
            </p>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible>
          <CollapsibleRow markerSide="start">Como o ciclo funciona</CollapsibleRow>
          <CollapsibleContent>
            <p className="pt-1 text-sm text-muted-foreground">{TEXTO_LONGO[0]}</p>
          </CollapsibleContent>
        </Collapsible>
      </DocSection>

      <DocSection
        title="Cartão"
        description="variant=&quot;card&quot; veste a superfície do Card, e a linha e o conteúdo ficam no recuo dele. Não há fio entre a linha e o conteúdo — é a regra das tiras. O recuo de baixo é um pseudo-elemento, e não padding, para o bloco não estalar ao fechar."
        code={`<Collapsible variant="card">
  <CollapsibleRow size="xl">Mais sobre este período</CollapsibleRow>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
        previewClassName="flex-col items-stretch"
      >
        <Collapsible variant="card">
          <CollapsibleRow size="xl">Mais sobre este período</CollapsibleRow>
          <CollapsibleContent>
            <p className="text-sm text-muted-foreground">{TEXTO_LONGO[1]}</p>
          </CollapsibleContent>
        </Collapsible>
      </DocSection>

      <DocSection
        title="Com um botão"
        description="CollapsibleTrigger é o primitivo cru de propósito: com asChild ele funde a className no filho, e cromagem aqui vazaria para dentro de todo botão. O marcador vem do CollapsibleMarker, que gira sozinho."
        code={`<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="tertiary">
      Opções avançadas
      <CollapsibleMarker />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
        previewClassName="items-stretch"
      >
        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="tertiary">
              opções avançadas
              <CollapsibleMarker />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <p className="text-sm text-muted-foreground">
              Anexar comprovante, dividir com um membro, marcar como reembolso.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </DocSection>

      <DocSection
        title="A espiada, e o rótulo que troca"
        description="Com peek, o fechado vira uma amostra com a base dissolvendo — o “mostrar mais”. Os degraus são alturas de leitura, não da escada de controles. O texto do gatilho é CollapsibleLabel: “Continuar lendo” fechado, “Mostrar menos” aberto, lendo o estado do Collapsible — a tela não guarda useState para trocar a frase."
        code={`<Collapsible>
  <CollapsibleContent peek="md">…</CollapsibleContent>
  <CollapsibleTrigger asChild>
    <Button variant="link" size="sm">
      <CollapsibleLabel closed="Continuar lendo" open="Mostrar menos" />
      <CollapsibleMarker />
    </Button>
  </CollapsibleTrigger>
</Collapsible>`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {ESPIADAS.map(([degrau, nota]) => (
          <div key={degrau} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <code className="font-mono text-xs text-primary-accent">
                {degrau}
              </code>
              <span className="text-xs text-muted-foreground">{nota}</span>
            </div>
            <PeekDemo peek={degrau} />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Encontrável no ⌘F"
        description="findable deixa o fechado no DOM como hidden=&quot;until-found&quot;: a busca do navegador o encontra, e ele abre no resultado. Feche o bloco e procure “tangerina”."
        code={`<CollapsibleContent findable>…</CollapsibleContent>`}
        previewClassName="flex-col items-stretch"
      >
        <Collapsible variant="card">
          <CollapsibleRow size="lg">Categorias de exemplo</CollapsibleRow>
          <CollapsibleContent findable>
            <p className="text-sm text-muted-foreground">
              Mercado, feira, padaria, hortifrúti — e a tangerina que entrou em
              Lazer por engano.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </DocSection>

      <PropsTable
        title="Props"
        rows={[
          {
            prop: "Collapsible · variant",
            type: '"plain" | "card"',
            default: '"plain"',
            description: "card veste a superfície do Card, com a linha e o conteúdo no recuo.",
          },
          {
            prop: "CollapsibleRow · size",
            type: '"md" | "lg" | "xl"',
            default: '"md"',
            description: "A altura mínima da linha: 32, 36, 40; 44 no dedo.",
          },
          {
            prop: "CollapsibleRow · trailing · markerSide",
            type: 'ReactNode · "start" | "end"',
            default: '— · "end"',
            description: "O que vai na outra ponta, e de que lado fica a seta.",
          },
          {
            prop: "CollapsibleContent · peek",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"none"',
            description:
              "A altura do fechado: em none o conteúdo desmonta e anima de zero; nos degraus ele fica montado e dissolve na base.",
          },
          {
            prop: "CollapsibleContent · findable",
            type: "boolean",
            default: "false",
            description: "Fechado, fica encontrável pelo ⌘F e abre quando é achado.",
          },
          {
            prop: "CollapsibleLabel · open · closed",
            type: "ReactNode",
            description: "O texto do gatilho aberto e fechado.",
          },
        ]}
      />

      <DocNote title="O que está fechado existe para a busca do navegador?">
        Sem <code>findable</code> nem <code>peek</code>, não: o conteúdo recolhido sai do DOM, e <Kbd keys="mod+f" /> não o encontra. <code>findable</code> o mantém montado como <code>hidden=&quot;until-found&quot;</code>, e o Radix desta versão não tem a opção — o atributo é escrito pelo componente, depois da animação de fechar, e sai no pedido de abrir, antes de o Radix medir a altura (senão ele mediria 0). Onde o navegador não conhece <code>until-found</code>, o bloco fecha igual e só não é encontrado.
      </DocNote>

      <DocNote title="A espiada desliza até o fim">
        Em <code>peek</code> a caixa desliza da espiada até a altura inteira, na mola da casa, e o gatilho desce junto. Ao fechar, ela volta à espiada numa curva curta. A altura é escrita por JS, e não pelo CSS: com ela no CSS, o Radix a resolvia no mesmo recálculo em que o estado virava aberto, e a espiada saltava.
      </DocNote>

      <DocNote title="O conteúdo sobe em cascata">
        A altura e o conteúdo abrem na mesma mola da Tooltip: passam um pouco do alvo e voltam, e cada filho sobe 6px, 30ms depois do anterior. Ao fechar, é uma curva curta, sem mola. É o mesmo movimento do <code>Accordion</code>, e a espiada não o usa: lá o conteúdo já está na tela.
      </DocNote>

      <DocNote title="Onde o app usa">
        Dois: o &ldquo;como funciona o ciclo&rdquo; do formulário de cartão e o &ldquo;Mais sobre este período&rdquo; da fatura, os dois com <code>CollapsibleRow</code> e <code>findable</code> desde a rodada 189. O primeiro era um <code>Button tertiary</code> com <code>h-9 w-full justify-between px-2 text-xs</code>; o segundo, um cartão escrito à mão (<code>rounded-xl border-border/70 shadow-sm</code>) com um gatilho cru e um <code>border-t</code> no conteúdo, e é o <code>variant=&quot;card&quot;</code>. O catálogo usa o marcador na gaveta de código de cada demonstração.
      </DocNote>
    </>
  )
}

/** O "mostrar mais" completo: a espiada e o rótulo que troca, sem estado aqui. */
function PeekDemo({ peek = "md" }: { peek?: "sm" | "md" | "lg" }) {
  return (
    <Collapsible className="w-full">
      <CollapsibleContent
        peek={peek}
        className="text-sm leading-relaxed text-muted-foreground"
      >
        {TEXTO_LONGO.map((p) => (
          <p key={p} className="not-last:mb-3">
            {p}
          </p>
        ))}
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          <CollapsibleLabel closed="Continuar lendo" open="Mostrar menos" />
          <CollapsibleMarker />
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  )
}
