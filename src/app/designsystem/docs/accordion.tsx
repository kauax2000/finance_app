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
            <code>collapsible</code> é o que permite fechar tudo. A linha inteira
            é o alvo — inclusive o espaço vazio à direita do rótulo, que é metade
            dele.
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
            <code>md</code> 32, <code>lg</code> 36, <code>xl</code> 40 — os
            mesmos números que esses nomes têm no <code>Button</code>, no{" "}
            <code>Input</code> e no <code>Tabs</code>. A medida é piso, e não
            altura fixa: um rótulo que quebra em duas linhas faz a linha crescer,
            e não ser recortada.
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
            <strong>estrutura</strong>: com todas as setas na mesma coluna, a
            hierarquia fica legível numa varredura vertical. Para perguntas, o
            marcador continua na outra ponta.
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
            que acompanha o rótulo. É prop e não peça componível — a razão está
            na nota abaixo.
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
            description:
              "O piso de altura da linha — 32, 36, 40. Os mesmos números que esses nomes têm no resto do sistema.",
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
              "Só em single. Sem ele, um item fica sempre aberto — certo quando o acordeão é a navegação do conteúdo, errado quando ele é opcional.",
          },
        ]}
      />

      <PropsTable
        title="Props · AccordionTrigger"
        rows={[
          {
            prop: "trailing",
            type: "React.ReactNode",
            description:
              "O que acompanha o rótulo na outra ponta: contagem, total, Badge. Continua correto com o marcador dos dois lados.",
          },
        ]}
      />

      <DocNote title="O realce não troca a cor de fundo, e a razão é de sistema">
        Um acordeão <strong>não sabe sobre o que está pousado</strong>: ele mora
        dentro de <code>Card</code>, dentro de <code>muted</code>, dentro de
        diálogo e direto na página. Um realce que pinta fundo precisa combinar
        com a superfície de baixo — sobre <code>bg-muted</code> o{" "}
        <code>accent</code> quase some, e sobre <code>bg-card</code> num dos
        temas ele é quase o próprio cartão. Realce não pode depender de uma
        informação que o componente não tem.
        <br />
        <br />
        Então são dois sinais, e nenhum toca no fundo: o <strong>rótulo</strong>{" "}
        sublinha, e o <strong>marcador</strong> tinge e{" "}
        <strong>se desloca no sentido em que o clique vai levar</strong> — dois
        pixels para baixo quando o bloco vai abrir, dois para cima quando vai
        fechar.
      </DocNote>

      <DocNote title="O sublinhado é do rótulo, não da linha">
        O componente já teve um <code>hover:underline</code> no botão inteiro, e{" "}
        <code>text-decoration</code> desce para todo descendente em linha: o
        valor da direita — o total do slot <code>trailing</code> — vinha
        sublinhado junto. <strong>Traço sob número lê como rasura</strong>, e num
        app de finanças essa é a pior leitura possível. Escopado ao rótulo, o
        traço marca a palavra que responde ao clique, e a linha inteira continua
        sendo o alvo.
      </DocNote>

      <DocNote title="A direção do empurrão vem de uma variável, e não de duas variantes">
        O deslocamento depende de dois estados ao mesmo tempo: de a linha estar
        sob o cursor <strong>e</strong> de ela estar aberta. Escrito como
        variante empilhada, o Tailwind compila uma{" "}
        <strong>cadeia de descendente</strong> — e quando as duas apontam para o
        mesmo elemento o seletor não casa com nada. Este projeto já pagou essa
        medição no <code>AppThemeToggle</code>: o estado mora numa variável na
        raiz, e o cursor só troca qual variável o filho lê.
      </DocNote>

      <DocNote title="O marcador não teleporta">
        Havia dois ícones aqui — uma seta para baixo e uma para cima —, um
        escondendo o outro conforme o estado. É a mesma decisão que a rodada do{" "}
        <code>Tabs</code> julgou e reverteu: dois marcadores piscando não dizem o
        que um marcador se movendo diz. Aqui o conserto era de graça, porque a
        seta para baixo girada em 180° <strong>é</strong> a seta para cima.
      </DocNote>

      <DocNote title="Por que trailing é prop, e não uma peça">
        A alternativa componível exigia duas margens automáticas na mesma linha
        de flex — uma para empurrar o valor e outra para o marcador. E{" "}
        <strong>duas <code>ml-auto</code> dividem a sobra em partes iguais</strong>{" "}
        em vez de empurrar a segunda para a borda: o valor terminaria flutuando
        no meio da linha. Com um slot nomeado, a ordem é declarada.
      </DocNote>

      <DocNote title="O anel de foco é interno, e é a única divergência do sistema">
        O resto da casa usa <code>ring-3</code> por fora. Aqui a linha sangra até
        a borda do bloco, e um anel externo tem só dois destinos: dentro de{" "}
        <code>contained</code> a casca é <code>overflow-hidden</code> e ele some
        nos quatro lados da primeira e da última linha; em <code>plain</code>,
        ele cavalga o fio da linha vizinha e vira um traço duplo de 4px.{" "}
        <code>inset-ring</code> resolve os dois sem exceção por variante.
      </DocNote>

      <DocNote title="A altura do conteúdo era circular">
        O envelope interno declarava{" "}
        <code>h-(--radix-accordion-content-height)</code> — a variável que o
        Radix escreve a partir do <code>offsetHeight</code> desse mesmo nó. Ele
        declarava como altura a medida que ele próprio produz, e por isso ela
        congelava na primeira medição: um parágrafo que reflui, porque a janela
        estreitou ou a tradução é mais longa, passava a ser{" "}
        <strong>recortado</strong>. O envelope não precisa de altura nenhuma —
        quem anima é a <code>Content</code>, por keyframes, contra a variável.
      </DocNote>
    </>
  )
}
