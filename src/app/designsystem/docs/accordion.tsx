"use client"

import * as React from "react"
import {
  BoltIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "@heroicons/react/16/solid"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggleAll,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const MOLDURAS = [
  ["plain", "Fio entre itens e mais nada. Para dentro de algo que já tem moldura."],
  ["contained", "Uma caixa só, com os fios por dentro. Para o acordeão direto na tela."],
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

const GRUPOS = [
  { value: "essenciais", nome: "Essenciais", itens: "Moradia, mercado, transporte e saúde." },
  { value: "lazer", nome: "Lazer", itens: "Restaurantes, streaming e viagens." },
  { value: "investimentos", nome: "Investimentos", itens: "Reserva de emergência e previdência." },
]

export default function AccordionDoc() {
  return (
    <>
      <Usage>
        Assuntos em que se lê um ou outro, não todos. Nunca para conteúdo que
        precisa ser comparado: o que está fechado não se compara com nada. Um
        bloco só que expande é o <code>Collapsible</code>.
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
            Troque o degrau.
          </>
        }
        code={`<Accordion size="lg" type="single" collapsible>…</Accordion>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <EscadaDemo />
      </DocSection>

      <DocSection
        title="O que a linha carrega"
        description={
          <>
            <code>icon</code> vai antes do rótulo, <code>description</code> é a
            linha de apoio sob ele — par de identidade, sem <code>gap</code>, e só
            o rótulo sublinha no cursor —, e <code>trailing</code> é o valor na
            outra ponta: o total, a contagem, o <code>Badge</code>.
          </>
        }
        code={`<AccordionTrigger
  icon={<ShoppingCartIcon />}
  description="4 transações · última em 12/03"
  trailing={<MoneyDisplay value={-612.4} tone="expense" />}
>
  Mercado
</AccordionTrigger>`}
        previewClassName="items-stretch"
      >
        <Accordion
          variant="contained"
          size="xl"
          type="multiple"
          defaultValue={["mercado"]}
          className="w-full"
        >
          <AccordionItem value="mercado">
            <AccordionTrigger
              icon={<ShoppingCartIcon />}
              description="4 transações · última em 12/03"
              trailing={<MoneyDisplay value={-612.4} tone="expense" />}
            >
              Mercado
            </AccordionTrigger>
            <AccordionContent>A maior foi de R$ 186,00, no dia 12.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="transporte">
            <AccordionTrigger
              icon={<TruckIcon />}
              description="7 transações · última em 14/03"
              trailing={<MoneyDisplay value={-218.9} tone="expense" />}
            >
              Transporte
            </AccordionTrigger>
            <AccordionContent>Aplicativo e combustível.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="energia">
            <AccordionTrigger
              icon={<BoltIcon />}
              description="Vence em 20/03"
              trailing={<Badge size="xs">a pagar</Badge>}
            >
              Energia
            </AccordionTrigger>
            <AccordionContent>Conta de março, em débito automático.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocSection>

      <DocSection
        title="Estrutura: a seta antes, e abrir todos"
        description={
          <>
            <code>markerSide=&quot;start&quot;</code> é o acordeão de{" "}
            <strong>estrutura</strong>: setas na mesma coluna deixam a
            hierarquia legível numa varredura, e o conteúdo alinha com o rótulo,
            não com a seta. Em <code>type=&quot;multiple&quot;</code>,{" "}
            <code>AccordionToggleAll</code> abre e fecha todos, e o rótulo troca
            sozinho.
          </>
        }
        code={`<Accordion markerSide="start" type="multiple">
  <AccordionToggleAll />
  <AccordionItem value="essenciais">…</AccordionItem>
</Accordion>`}
        previewClassName="items-stretch"
      >
        <Accordion
          markerSide="start"
          variant="contained"
          type="multiple"
          defaultValue={["essenciais"]}
          className="w-full"
        >
          <AccordionToggleAll />
          {GRUPOS.map((g) => (
            <AccordionItem key={g.value} value={g.value}>
              <AccordionTrigger>{g.nome}</AccordionTrigger>
              <AccordionContent>{g.itens}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DocSection>

      <DocSection
        title="Encontrável no ⌘F"
        description={
          <>
            <code>findable</code> deixa a resposta fechada no DOM como{" "}
            <code>hidden=&quot;until-found&quot;</code>: a busca do navegador a
            encontra, e o item abre no resultado. Procure “estorno”.
          </>
        }
        code={`<AccordionContent findable>…</AccordionContent>`}
        previewClassName="items-stretch"
      >
        <Accordion variant="contained" type="single" collapsible className="w-full">
          <AccordionItem value="estorno">
            <AccordionTrigger>Uma compra foi cancelada. E agora?</AccordionTrigger>
            <AccordionContent findable>
              O estorno entra como crédito na fatura em que o banco o lançar, que
              pode não ser a da compra.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="juros">
            <AccordionTrigger>Pagar o mínimo gera juros?</AccordionTrigger>
            <AccordionContent findable>
              Sim: o restante entra no rotativo, com os juros do mês seguinte.
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
              "De que lado o marcador espera. start para estrutura — e o conteúdo alinha com o rótulo —, end para perguntas.",
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
        title="Props · peças"
        rows={[
          {
            prop: "AccordionTrigger · icon",
            type: "React.ReactNode",
            description: "O ícone antes do rótulo, em 16px (16/solid).",
          },
          {
            prop: "AccordionTrigger · description",
            type: "React.ReactNode",
            description: "A linha de apoio sob o rótulo.",
          },
          {
            prop: "AccordionTrigger · trailing",
            type: "React.ReactNode",
            description: "O que acompanha o rótulo na outra ponta: contagem, total, Badge.",
          },
          {
            prop: "AccordionContent · findable",
            type: "boolean",
            default: "false",
            description: "Fechado, fica encontrável pelo ⌘F e abre quando é achado.",
          },
          {
            prop: "AccordionToggleAll · openLabel · closeLabel",
            type: "string",
            default: '"Abrir todos" · "Fechar todos"',
            description: "Só em multiple; no single não renderiza.",
          },
        ]}
      />

      <DocNote title="O realce não pinta fundo">
        O acordeão não sabe sobre que superfície está — <code>Card</code>,{" "}
        <code>muted</code>, diálogo, página —, e um fundo de realce some sobre
        algumas delas. São dois sinais: o <strong>rótulo</strong> sublinha, e o{" "}
        <strong>marcador</strong> tinge e se desloca 2px no sentido em que o
        clique vai levar. O sublinhado é só do rótulo: <code>text-decoration</code>{" "}
        desce para os descendentes, e sublinhar a linha inteira riscaria o total
        do <code>trailing</code> e a descrição.
      </DocNote>

      <DocNote title="A direção do empurrão vem de uma variável">
        O deslocamento depende de cursor <strong>e</strong> de aberto ao mesmo
        tempo, e variantes empilhadas compilam uma cadeia de descendente que não
        casa no mesmo elemento. O estado mora em <code>--disclosure-nudge</code>,
        na linha, e o marcador só a lê. Um ícone só, girado 180° ao abrir: dois
        ícones trocando piscam.
      </DocNote>

      <DocNote title="O estado mora na raiz">
        O ⌘F abrindo o item que achou e o &ldquo;abrir todos&rdquo; escrevem no
        valor de fora da linha, então o <code>Accordion</code> passou a guardar o
        valor quando ninguém o controla, com <code>defaultValue</code> como
        semente. Para quem chama, <code>value</code>, <code>defaultValue</code> e{" "}
        <code>onValueChange</code> continuam iguais. Ao abrir, o conteúdo{" "}
        <code>findable</code> sai do <code>until-found</code> antes de o Radix
        medir a altura (<Kbd keys="mod+f" /> num bloco medido em 0 abriria sem
        trajeto).
      </DocNote>

      <DocNote title="O anel de foco é interno">
        A linha sangra até a borda: um <code>ring-3</code> externo some no{" "}
        <code>overflow-hidden</code> de <code>contained</code> e vira traço
        duplo sobre o fio vizinho em <code>plain</code>. <code>inset-ring</code>{" "}
        resolve os dois, e o <code>Collapsible</code> divide a régua.
      </DocNote>

      <DocNote title="O envelope do conteúdo não declara altura">
        Quem anima é a <code>Content</code>, por keyframes, contra{" "}
        <code>--radix-accordion-content-height</code>. Altura no envelope
        congelaria a primeira medição e recortaria o texto que reflui.
      </DocNote>

      <DocNote title="Onde o app usa">
        Em nenhuma tela, hoje. Os blocos que expandem no app são um só por vez —
        o ciclo do cartão, o período da fatura —, e são <code>Collapsible</code>.
      </DocNote>
    </>
  )
}

function EscadaDemo() {
  const [degrau, setDegrau] = React.useState<"md" | "lg" | "xl">("md")

  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="size"
            valores={["md", "lg", "xl"] as const}
            valor={degrau}
            onChange={setDegrau}
            rotulos={{ md: "md · 32", lg: "lg · 36", xl: "xl · 40" }}
          />
        }
      />
      <Accordion
        variant="contained"
        size={degrau}
        type="single"
        collapsible
        className="w-full"
      >
        {PERGUNTAS.slice(0, 2).map((p) => (
          <AccordionItem key={p.value} value={p.value}>
            <AccordionTrigger>{p.pergunta}</AccordionTrigger>
            <AccordionContent>{p.resposta}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}
