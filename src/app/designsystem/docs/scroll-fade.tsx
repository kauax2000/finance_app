"use client"

import type * as React from "react"

import { ScrollFade } from "@/components/ui/scroll-fade"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import { Caption } from "@/components/ui/typography"
import { currencyBRL } from "@/lib/formatters"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Cor de runtime é o caso do `ColorTile`, e o espécime precisa de conteúdo
 *  com cor para o borrão ter o que borrar: sobre texto cinza ele quase não lê. */
const CORES = ["#16a34a", "#e11d48", "#2563eb", "#d97706", "#7c3aed"]

const MODOS = [
  { modo: "fade", rotulo: "fade — só a máscara" },
  { modo: "blur", rotulo: "blur — máscara + borrão" },
  { modo: "material", rotulo: "material — sem máscara" },
] as const

export default function ScrollFadeDoc() {
  return (
    <>
      <Usage>
        Uma lista cortada em seco na borda lê como lista terminada; a dissolução
        diz que continua. Aparece só do lado em que ainda há conteúdo, e cresce
        no mesmo passo em que a ponta consome o conteúdo.
      </Usage>

      <DocSection
        title="Vertical"
        code={`<ScrollFade className="h-40">
  …
</ScrollFade>`}
        previewClassName="items-stretch"
      >
        <ScrollFade className="h-40 w-full rounded-lg border border-border">
          <div className="flex flex-col p-3">
            {Array.from({ length: 15 }, (_, i) => (
              <p key={i} className="py-1.5 text-sm text-muted-foreground">
                Categoria {i + 1}
              </p>
            ))}
          </div>
        </ScrollFade>
      </DocSection>

      <DocSection
        title="Horizontal"
        description="São 24 filtros, e não uma dúzia: com 12 o conteúdo media 881px dentro de um preview de 908, e a demonstração saía chapada em qualquer tela de desktop — o defeito silencioso de uma região que só transborda no telefone."
        code={`<ScrollFade axis="x">…</ScrollFade>`}
        previewClassName="items-stretch"
      >
        <ScrollFade axis="x" className="w-full rounded-lg border border-border">
          <div className="flex gap-2 p-3">
            {Array.from({ length: 24 }, (_, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                Filtro {i + 1}
              </span>
            ))}
          </div>
        </ScrollFade>
      </DocSection>

      <DocSection
        title="Uma ponta só"
        code={`<ScrollFade sides="end">…</ScrollFade>`}
        previewClassName="items-stretch"
      >
        <ScrollFade
          sides="end"
          className="h-40 w-full rounded-lg border border-border"
        >
          <div className="flex flex-col p-3">
            {Array.from({ length: 15 }, (_, i) => (
              <p key={i} className="py-1.5 text-sm text-muted-foreground">
                Item {i + 1}
              </p>
            ))}
          </div>
        </ScrollFade>
      </DocSection>

      <DocSection
        title="Sobre qualquer superfície"
        code={`<PopoverContent>
  <ScrollFade className="h-40">…</ScrollFade>
</PopoverContent>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">abrir sobre um popover</Button>
          </PopoverTrigger>
          <PopoverContent padding="none" className="w-56">
            <ScrollFade className="h-40">
              <div className="flex flex-col p-3">
                {Array.from({ length: 15 }, (_, i) => (
                  <p key={i} className="py-1.5 text-sm text-muted-foreground">
                    Carteira {i + 1}
                  </p>
                ))}
              </div>
            </ScrollFade>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="Os três modos de borda"
        description="Não são graus do mesmo efeito. fade e blur somam — o conteúdo apaga, e no segundo também desfoca. material substitui: o conteúdo passa por baixo nítido, e quem o esconde é o borrão. É a diferença entre um material e um véu."
        code={`<ScrollFade edge="material" className="h-44">
  …
</ScrollFade>`}
        previewClassName="grid grid-cols-1 gap-4 md:grid-cols-3 items-stretch"
      >
        {MODOS.map(({ modo, rotulo }) => (
          <div key={modo} className="flex flex-col gap-2">
            <Caption>{rotulo}</Caption>
            <ScrollFade
              edge={modo}
              className="h-44 w-full rounded-lg border border-border"
            >
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ColorTile color={CORES[i % CORES.length]!} size="sm" />
                    <span className="text-sm">Mercado {i + 1}</span>
                    <span className="nums ms-auto text-sm text-muted-foreground">
                      {currencyBRL((i + 1) * 37.4)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollFade>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A tinta do material"
        description="Ela nasce transparent, e o padrão é o certo: cravar uma cor é o defeito que enterrou o ScrollFade de gradiente pintado. Quem sabe sobre que superfície está escreve a variável — aqui, a do card."
        code={`<ScrollFade
  edge="material"
  className="[--scroll-fade-blur-tint:var(--card)]"
/>`}
        previewClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 items-stretch"
      >
        {([undefined, "var(--card)"] as const).map((tinta) => (
          <div key={String(tinta)} className="flex flex-col gap-2">
            <Caption>{tinta ? "com a tinta do card" : "sem tinta (o padrão)"}</Caption>
            <ScrollFade
              edge="material"
              className="h-44 w-full rounded-lg border border-border"
              style={
                tinta
                  ? ({ "--scroll-fade-blur-tint": tinta } as React.CSSProperties)
                  : undefined
              }
            >
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ColorTile color={CORES[i % CORES.length]!} size="sm" />
                    <span className="text-sm">Mercado {i + 1}</span>
                    <span className="nums ms-auto text-sm text-muted-foreground">
                      {currencyBRL((i + 1) * 37.4)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollFade>
          </div>
        ))}
      </DocSection>

      <DocNote title="O material substitui a dissolução; ele não soma a ela">
        Nos outros dois modos a rampa apaga o conteúdo até 6% de alfa. Num
        material do iOS o conteúdo <strong>continua lá</strong>, legível-porém-
        desfocado, e quem o esconde é o borrão — por isso{" "}
        <code>edge=&quot;material&quot;</code> desliga{" "}
        <code>--scroll-fade-mask</code>. A folga de rolagem fica: um{" "}
        <code>scrollIntoView</code> não pode depositar o item ativo debaixo da
        faixa.
        <br />
        <br />
        Isto contraria a regra que enterrou o <code>ScrollFade</code> de
        gradiente pintado — <em>dissolver, e não pintar um véu</em> —, e a
        contradição é consciente. O defeito daquela versão era{" "}
        <strong>cor cravada</strong>: <code>from-card</code> dentro de um popover
        pintava uma faixa clara. Esta faixa não pinta cor nenhuma por padrão.
      </DocNote>

      <DocNote title="Por que a tinta não herda o outro vidro da casa">
        <code>--mobile-glass-bg</code> existe e <strong>não serve</strong>.
        Medido, ele segue superfícies diferentes em cada tema:{" "}
        <code>--background</code> no claro (0.985) e <code>--card</code> no
        escuro (0.205, contra uma página de 0.145). Ele é calibrado para uma
        folha sobre a página; uma faixa de borda vive sobre card, popover, página
        ou <code>muted</code>. Herdá-lo seria cravar a cor de novo.
        <br />
        <br />O que <strong>é</strong> herdado são o raio e a vibrância:{" "}
        <code>saturate(1.5)</code> é o número de{" "}
        <code>.mobile-glass-surface</code>, para a casa ter uma vibrância só, e
        as três camadas somam para ~26px efetivos contra os 24 de lá. Não é um
        terceiro vidro — é a mesma receita, numa faixa em vez de numa superfície.
      </DocNote>

      <DocNote title="O borrão não pode morar no elemento mascarado">
        Um <code>backdrop-filter</code> no rolável seria recortado{" "}
        <strong>pela própria rampa</strong>: forte onde a máscara é opaca,
        ausente justo na ponta — o contrário do que se quer. Filho dele herdaria
        o mesmo recorte. Por isso as camadas são <strong>irmãs</strong>, e quem
        hospeda as duas coisas é a casca.
        <br />
        <br />
        E isso cobra um mecanismo: o hook escreve{" "}
        <code>--scroll-fade-start</code> no rolável, e{" "}
        <em>irmão não lê custom property de irmão</em>. Com <code>blur</code> ele
        vai com <code>shell</code>, que espelha as duas variáveis na casca — de
        onde elas descem por herança para o rolável e para as camadas, e o recuo
        das faixas fixas sai de graça.
      </DocNote>

      <DocNote title="Empilhadas, e a ordem é o mecanismo">
        Uma camada só daria <strong>raio constante</strong> com opacidade
        variável — um crossfade entre nítido e borrado, não um gradiente de
        borrão. São três, e cada uma borra o que a de baixo já compôs: a
        variância soma, e o raio efetivo cresce em direção à borda sozinho. O
        índice multiplica o raio e <strong>encurta a extensão</strong> para{" "}
        <code>100% / i</code> ao mesmo tempo, então a que mais borra é a que
        menos avança para dentro.
        <br />
        <br />
        Quem quiser mais ou menos vidro sobrescreve{" "}
        <code>--scroll-fade-blur-r</code> no próprio elemento. Não há eixo de
        intensidade: variável herda, e eixo sem caso medido é ficção.
      </DocNote>

      <DocNote title="Dois vidros nesta casa, e este é o do backdrop-filter">
        A régua de escolha está em <code>globals.css</code>:{" "}
        <strong>há algo passando por baixo</strong> → borrão de verdade;{" "}
        <strong>não há</strong> → a <code>@utility glass</code>, que é luz
        pintada porque borrar cor chapada não desenha nada. Numa borda de rolagem
        há conteúdo passando por baixo — é o lado do{" "}
        <code>backdrop-filter</code>, e com ele vem o{" "}
        <code>prefers-reduced-transparency</code> que um blur de verdade obriga.
        Junto com ele, mais três guardas: sem rolagem, em alto contraste ou sem
        suporte a <code>backdrop-filter</code>, a camada sai do DOM pintado em
        vez de ficar como um retângulo inerte pagando composição.
      </DocNote>

      <DocNote title="Máscara, e não um gradiente pintado">
        A versão anterior desenhava dois <code>&lt;span&gt;</code> absolutos com{" "}
        <code>bg-gradient from-card</code> — uma <strong>cor cravada</strong>.
        Dentro de um popover ou de um menu (<code>bg-popover</code>) ela pintava
        uma faixa clara em vez de dissolver, e era por isso que este componente
        nunca teve um consumidor. Máscara é <strong>alfa, não cor</strong>: serve
        qualquer superfície sem precisar saber de que cor é o fundo. É o exemplo
        acima, e antes ele reprovava.
        <br />
        <br />
        Sem <code>blur</code>, <code>pointer-events</code> deixa de ser assunto —
        não há nada por cima do conteúdo para comer o clique dos itens de baixo.
        Com ele há seis camadas, e o que as mantém inertes é o{" "}
        <code>pointer-events: none</code> da utility, não a ausência de nós.
      </DocNote>

      <DocNote title="Quem rola não desenha nada">
        A moldura, a altura e a tinta ficam no contêiner; a máscara vai no
        elemento de dentro. Não é arrumação: a máscara recorta o alfa do elemento
        inteiro — fundo, borda e sombra externa junto —, então mascarar um nó que
        pinta apagaria os quatro cantos dele enquanto os lados continuam opacos,
        o que lê como falha de renderização. É a mesma razão pela qual um popover
        ou um menu precisa de um elemento interno para receber o efeito.
      </DocNote>

      <DocNote title="Um eixo por vez">
        <code>axis</code> é exclusivo. É um gradiente por elemento: a spec define{" "}
        <code>mask-image: none</code> como <em>camada preta transparente</em>,
        então compor duas máscaras com <code>mask-composite: intersect</code>{" "}
        daria alfa zero e apagaria o elemento. Para o conteúdo passar{" "}
        <em>por trás</em> de um cabeçalho fixo, quem publica a altura dele é a
        casca — a composição está em <code>scrollFadeBandsClassName</code>, e o{" "}
        <code>Command</code> é o exemplo vivo.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "axis",
            type: '"y" | "x"',
            default: '"y"',
            description: "Em qual eixo a área rola. Os dois não se combinam.",
          },
          {
            prop: "sides",
            type: '"both" | "start" | "end"',
            default: '"both"',
            description: "Qual ponta dissolve.",
          },
          {
            prop: "edge",
            type: '"fade" | "blur" | "material"',
            default: '"fade"',
            description:
              "O que a borda faz. blur soma borrão à dissolução; material a substitui — o conteúdo passa nítido por baixo, e três camadas irmãs o escondem.",
          },
          {
            prop: "viewportClassName",
            type: "string",
            description: "Classes da região rolável interna, não do contêiner.",
          },
        ]}
      />
    </>
  )
}
