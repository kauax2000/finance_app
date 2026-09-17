"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const MOLDURAS = [
  ["plain", "Fio entre itens e mais nada. Para dentro de algo que já tem moldura."],
  ["contained", "Uma caixa só, com os fios por dentro. A forma que este app usa."],
  ["separated", "Cada item solto. Sobre o fundo da página — nunca dentro de um Card."],
] as const

const PERGUNTAS = [
  {
    value: "fechamento",
    pergunta: "Quando a fatura fecha?",
    resposta:
      "No dia de fechamento do cartão. Compras feitas depois disso entram na fatura do mês seguinte.",
  },
  {
    value: "parcelas",
    pergunta: "Como as parcelas aparecem?",
    resposta:
      "Cada parcela é lançada no mês da fatura correspondente, e não toda no mês da compra.",
  },
  {
    value: "orcamento",
    pergunta: "O orçamento considera parcelas?",
    resposta: "Só a parcela do mês corrente. As futuras aparecem na projeção.",
  },
]

export default function AccordionDoc() {
  return (
    <>
      <Usage>
        Assuntos em que se lê um ou outro, não todos. Nunca para conteúdo que
        precisa ser comparado: o que está fechado não se compara com nada.
      </Usage>

      <DocSection
        title="Um por vez"
        description={
          <>
            <code>collapsible</code> permite fechar tudo. A linha inteira é o
            alvo, inclusive o espaço vazio à direita do rótulo.
          </>
        }
        code={`<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>Pergunta</AccordionTrigger>
    <AccordionContent>Resposta.</AccordionContent>
  </AccordionItem>
</Accordion>`}
        previewClassName="items-stretch"
      >
        <Accordion type="single" collapsible className="w-full">
          {PERGUNTAS.map((p) => (
            <AccordionItem key={p.value} value={p.value}>
              <AccordionTrigger>{p.pergunta}</AccordionTrigger>
              <AccordionContent>{p.resposta}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DocSection>

      <DocSection
        title="A moldura"
        description={
          <>
            Três superfícies, e a escolha é sobre <strong>onde</strong> o
            acordeão está. <code>separated</code> é a única que não entra num{" "}
            <code>Card</code>.
          </>
        }
        code={`<Accordion variant="contained" type="single" collapsible>…</Accordion>`}
        previewClassName="flex-col items-stretch gap-8"
      >
        {MOLDURAS.map(([variante, nota]) => (
          <div key={variante} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <code className="font-mono text-xs text-primary-accent">
                {variante}
              </code>
              <span className="text-xs text-muted-foreground">{nota}</span>
            </div>
            <Accordion
              variant={variante}
              type="single"
              collapsible
              defaultValue={variante === "contained" ? "fechamento" : undefined}
              className="w-full"
            >
              {PERGUNTAS.slice(0, 2).map((p) => (
                <AccordionItem key={p.value} value={p.value}>
                  <AccordionTrigger>{p.pergunta}</AccordionTrigger>
                  <AccordionContent>{p.resposta}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A escada"
        description={
          <>
            <code>md</code> 32, <code>lg</code> 36, <code>xl</code> 40, como no{" "}
            <code>Button</code>, no <code>Input</code> e no <code>Tabs</code>. É
            piso, não altura fixa: um rótulo em duas linhas faz a linha crescer.
          </>
        }
        code={`<Accordion size="lg" type="single" collapsible>…</Accordion>`}
        previewClassName="flex-col items-stretch gap-6"
      >
        {(["md", "lg", "xl"] as const).map((degrau) => (
          <div key={degrau} className="flex flex-col gap-2">
            <code className="font-mono text-xs text-primary-accent">
              {degrau}
            </code>
            <Accordion
              variant="contained"
              size={degrau}
              type="single"
              collapsible
              className="w-full"
            >
              <AccordionItem value="a">
                <AccordionTrigger>Quando a fatura fecha?</AccordionTrigger>
                <AccordionContent>{PERGUNTAS[0].resposta}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="O marcador do lado do rótulo"
        description={
          <>
            <code>markerSide=&quot;start&quot;</code> é o acordeão de{" "}
            <strong>estrutura</strong>: setas na mesma coluna deixam a
            hierarquia legível numa varredura. Para perguntas, o marcador fica
            na outra ponta.
          </>
        }
        code={`<Accordion markerSide="start" type="multiple">…</Accordion>`}
        previewClassName="items-stretch"
      >
        <Accordion
          markerSide="start"
          type="multiple"
          defaultValue={["essenciais"]}
          className="w-full"
        >
          <AccordionItem value="essenciais">
            <AccordionTrigger>Essenciais</AccordionTrigger>
            <AccordionContent>
              Moradia, mercado, transporte e saúde.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="lazer">
            <AccordionTrigger>Lazer</AccordionTrigger>
            <AccordionContent>Restaurantes, streaming e viagens.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocSection>

      <DocSection
        title="O valor na outra ponta"
        description={
          <>
            <code>trailing</code> é a contagem, o total ou o <code>Badge</code>{" "}
            que acompanha o rótulo.
          </>
        }
        code={`<AccordionTrigger trailing={<MoneyDisplay value={-612.4} tone="expense" />}>
  Mercado
</AccordionTrigger>`}
        previewClassName="items-stretch"
      >
        <Accordion
          variant="contained"
          type="multiple"
          defaultValue={["mercado"]}
          className="w-full"
        >
          <AccordionItem value="mercado">
            <AccordionTrigger trailing={<MoneyDisplay value={-612.4} tone="expense" />}>
              Mercado
            </AccordionTrigger>
            <AccordionContent>4 transações neste mês.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="transporte">
            <AccordionTrigger trailing={<MoneyDisplay value={-218.9} tone="expense" />}>
              Transporte
            </AccordionTrigger>
            <AccordionContent>7 transações neste mês.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="assinaturas">
            <AccordionTrigger trailing={<Badge size="xs">3 novas</Badge>}>
              Assinaturas
            </AccordionTrigger>
            <AccordionContent>
              Renovam entre os dias 8 e 22.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocSection>

      <PropsTable
        title="Props · Accordion"
        rows={[
          {
            prop: "variant",
            type: '"plain" | "contained" | "separated"',
            default: '"plain"',
            description:
              "A moldura. Ela também decide o recuo horizontal: 0 em plain, 16 nas duas molduradas.",
          },
          {
            prop: "size",
            type: '"md" | "lg" | "xl"',
            default: '"md"',
            description: "O piso de altura da linha: 32, 36, 40.",
          },
          {
            prop: "markerSide",
            type: '"start" | "end"',
            default: '"end"',
            description:
              "De que lado o marcador espera. start para estrutura, end para perguntas.",
          },
          {
            prop: "type",
            type: '"single" | "multiple"',
            description: "Do Radix. Um item aberto por vez, ou vários.",
          },
          {
            prop: "collapsible",
            type: "boolean",
            default: "false",
            description:
              "Só em single. Sem ele, um item fica sempre aberto: certo quando o acordeão é a navegação do conteúdo.",
          },
        ]}
      />

      <PropsTable
        title="Props · AccordionTrigger"
        rows={[
          {
            prop: "trailing",
            type: "React.ReactNode",
            description: "O que acompanha o rótulo na outra ponta: contagem, total, Badge.",
          },
        ]}
      />

      <DocNote title="O realce não pinta fundo">
        O acordeão não sabe sobre que superfície está — <code>Card</code>,{" "}
        <code>muted</code>, diálogo, página —, e um fundo de realce some sobre
        algumas delas. São dois sinais: o <strong>rótulo</strong> sublinha, e o{" "}
        <strong>marcador</strong> tinge e se desloca 2px no sentido em que o
        clique vai levar.
      </DocNote>

      <DocNote title="O sublinhado é do rótulo, não da linha">
        <code>text-decoration</code> desce para os descendentes: sublinhar a
        linha inteira sublinharia o total do <code>trailing</code>.{" "}
        <strong>Traço sob número lê como rasura.</strong>
      </DocNote>

      <DocNote title="A direção do empurrão vem de uma variável, e não de duas variantes">
        O deslocamento depende de cursor <strong>e</strong> de aberto ao mesmo
        tempo; variantes empilhadas compilam uma cadeia de descendente que não
        casa no mesmo elemento. O estado mora numa variável na raiz, como no{" "}
        <code>ThemeToggle</code>.
      </DocNote>

      <DocNote title="O marcador não teleporta">
        Um ícone só, girado 180° ao abrir. Dois ícones trocando piscam; um
        marcador que se move diz a transição.
      </DocNote>

      <DocNote title="trailing é prop, e não uma peça">
        Duas <code>ml-auto</code> na mesma linha dividem a sobra em partes
        iguais, e o valor flutuaria no meio. Com um slot nomeado, a ordem é
        declarada.
      </DocNote>

      <DocNote title="O anel de foco é interno">
        A linha sangra até a borda: um <code>ring-3</code> externo some no{" "}
        <code>overflow-hidden</code> de <code>contained</code> e vira traço
        duplo sobre o fio vizinho em <code>plain</code>. <code>inset-ring</code>{" "}
        resolve os dois; é a única divergência do sistema.
      </DocNote>

      <DocNote title="O envelope do conteúdo não declara altura">
        Quem anima é a <code>Content</code>, por keyframes, contra{" "}
        <code>--radix-accordion-content-height</code>. Altura no envelope
        congelaria a primeira medição e recortaria o texto que reflui.
      </DocNote>
    </>
  )
}
