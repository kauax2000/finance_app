"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleMarker,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
        title="Padrão"
        description={
          <>
            O gatilho é o primitivo cru de propósito: ele quase sempre veste um{" "}
            <code>Button</code> por <code>asChild</code>, e cromagem aqui vazaria
            para dentro dele. Quem quer a linha inteira desenhada usa o{" "}
            <code>Accordion</code>.
          </>
        }
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
            <Button variant="tertiary" className="gap-1.5">
              Opções avançadas
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
        title="A espiada"
        description={
          <>
            Com <code>peek</code>, o fechado deixa de ser altura zero e passa a
            ser uma amostra com a base <strong>dissolvendo</strong> — o
            &ldquo;mostrar mais&rdquo;. O que diz que há mais texto é o texto
            sumindo, e não um véu
            pintado por cima: máscara é alfa, e alfa não precisa saber de que cor
            é o fundo.
          </>
        }
        code={`<Collapsible>
  <CollapsibleContent peek="md">…</CollapsibleContent>
  <CollapsibleTrigger asChild>
    <Button variant="link" size="sm">Continuar lendo</Button>
  </CollapsibleTrigger>
</Collapsible>`}
        previewClassName="items-stretch"
      >
        <PeekDemo />
      </DocSection>

      <DocSection
        title="Os três degraus"
        description="São alturas de leitura, e não da escada de controles: abaixo de três linhas a espiada não informa nada que o rótulo do gatilho já não informe."
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
            <Collapsible className="w-full">
              <CollapsibleContent
                peek={degrau}
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
                  Continuar lendo
                  <CollapsibleMarker />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        ))}
      </DocSection>

      <PropsTable
        title="Props · CollapsibleContent"
        rows={[
          {
            prop: "peek",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"none"',
            description:
              "A altura do estado fechado. Em none o conteúdo desmonta e a altura anima de zero; nos três degraus ele fica montado e dissolve na base.",
          },
          {
            prop: "forceMount",
            type: "boolean",
            description:
              "Consequência de peek, não uma segunda decisão: sem ele o nó fechado não existe. Quem passar o seu continua ganhando.",
          },
        ]}
      />

      <DocNote title="O que está fechado ainda existe para a busca do navegador?">
        Sem <code>peek</code>, não — o conteúdo recolhido sai do DOM, e{" "}
        <kbd>⌘F</kbd> não o encontra. Se o que está lá dentro precisa ser
        localizável, ele não deveria estar escondido — <strong>ou</strong> ele
        quer <code>peek</code>, que mantém o nó montado e o texto na árvore de
        acessibilidade.
      </DocNote>

      <DocNote title="Quem mede não pode ser quem é medido">
        A primeira versão do <code>peek</code> abria e continuava recortada, e a
        causa é boa de guardar: o Radix descobre a altura do conteúdo lendo a
        caixa da <strong>própria</strong> <code>Content</code> — que em{" "}
        <code>peek</code> é justamente o nó preso à espiada. Ele publicava{" "}
        <strong>100px</strong> como &ldquo;altura do conteúdo&rdquo; contra um{" "}
        <code>scrollHeight</code> de 206, e abrir levava de 100 a 100. É a mesma
        forma do defeito que o <code>Accordion</code> tinha: um elemento
        declarando como altura uma medida que ele próprio produz. A saída é a que
        o resto da casa já usa — um observador escreve a medida de um envelope
        interno, livre, numa variável.
      </DocNote>

      <DocNote title="As três armadilhas do peek">
        <strong>Uma:</strong> o Radix escreve o atributo <code>hidden</code> no
        nó fechado mesmo sob <code>forceMount</code>, e{" "}
        <code>hidden</code> é <code>display: none</code> na folha do agente —
        qualquer declaração de autor vence, e é o que <code>data-closed:block</code>{" "}
        faz. <strong>Duas:</strong> os keyframes{" "}
        <code>collapsible-down/up</code> saem de cena, porque em{" "}
        <code>peek</code> o trajeto não parte de zero — e a espiada{" "}
        <strong>abre de uma vez</strong>, por um limite medido que a nota abaixo
        conta.{" "}
        <strong>Três:</strong> todo <code>-</code> binário dentro de um{" "}
        <code>calc()</code> arbitrário se escreve <code>_-_</code>, ou a classe é
        cortada no meio e a máscara cai para <code>none</code>, em silêncio.
      </DocNote>

      <DocNote title="A espiada abre de uma vez, e isso é um limite conhecido">
        A altura não anima, e a causa é a outra metade do problema de medida: o
        Radix envolve a troca de estado num par &ldquo;carimba{" "}
        <code>transition-duration: 0s</code>, força um{" "}
        <code>getBoundingClientRect()</code>, devolve o valor&rdquo;, e o
        recálculo forçado acontece <strong>na mesma passagem</strong> em que o
        estado vira aberto. O navegador nunca vê as duas alturas em recálculos
        diferentes, então não há transição para começar. Quatro consertos foram
        tentados — <code>!important</code> na duração, um envelope externo que o
        Radix não manipula, o <code>data-medido</code> do <code>Command</code>, e
        animar por Web Animations API a partir de um observador — e o quarto
        chegou a funcionar na abertura, mas não no fechamento. Um trajeto que só
        existe num sentido é pior que nenhum. O que diz &ldquo;tem mais&rdquo; é
        a dissolução, e ela não depende de movimento.
      </DocNote>

      <DocNote title="Um marcador para a casa toda">
        Este componente não desenhava marcador nenhum, e por isso os{" "}
        <strong>dois de dois</strong> consumidores reais o montaram por conta
        própria — e montaram diferente: uma seta para baixo girando 180° num
        corpo <code>size-3.5</code> de um lado, uma seta para a direita girando
        90° no corpo padrão do outro. É o invariante 1 acontecendo dentro do
        próprio design system. <code>CollapsibleMarker</code> não tem opinião
        nenhuma além da que já está na régua que o <code>Accordion</code> veste.
      </DocNote>
    </>
  )
}

/**
 * O "mostrar mais" completo, porque ele tem uma coisa que o resto da página não
 * tem: **o rótulo do gatilho muda com o estado**. "Continuar lendo" depois de
 * aberto seria uma promessa falsa.
 */
function PeekDemo() {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleContent
        peek="md"
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
          {open ? "Mostrar menos" : "Continuar lendo"}
          <CollapsibleMarker />
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  )
}
