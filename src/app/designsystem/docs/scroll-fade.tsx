"use client"

import type * as React from "react"

import { ScrollFade } from "@/components/ui/scroll-fade"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
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
        Área rolável cujas pontas dissolvem: um corte seco lê como lista
        terminada, a dissolução diz que continua. Aparece só do lado em que
        ainda há conteúdo.
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
        description="Para fileiras que transbordam na largura, como filtros no telefone."
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
            <PopoverTitle className="sr-only">Carteiras</PopoverTitle>
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
        description="Não são graus do mesmo efeito. fade e blur somam: o conteúdo apaga e, no segundo, também desfoca. material substitui: o conteúdo passa nítido por baixo, e quem o esconde é o borrão."
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
        description="Nasce transparent, e o padrão é o certo: cor cravada vira faixa errada sobre outra superfície. Quem sabe sobre que superfície está escreve a variável — aqui, a do card."
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
        Em <code>edge=&quot;material&quot;</code> a máscara sai e o conteúdo
        continua legível sob o borrão, como num material do iOS. A folga de
        rolagem fica: um <code>scrollIntoView</code> não pode depositar o item
        ativo debaixo da faixa.
      </DocNote>

      <DocNote title="A tinta não herda --mobile-glass-bg">
        Ele muda de superfície entre os temas e é calibrado para uma folha sobre
        a página; uma faixa de borda vive sobre card, popover, página ou{" "}
        <code>muted</code>. Herdá-lo seria cravar cor. O que é herdado é a
        vibrância: <code>saturate(1.5)</code>, a de{" "}
        <code>.mobile-glass-surface</code>.
      </DocNote>

      <DocNote title="O borrão não pode morar no elemento mascarado">
        Um <code>backdrop-filter</code> no rolável seria recortado pela própria
        rampa e sumiria justo na ponta. As camadas são <strong>irmãs</strong>,
        hospedadas na casca; como irmão não lê custom property de irmão, com{" "}
        <code>blur</code> o hook usa <code>shell</code> para espelhar as
        variáveis na casca.
      </DocNote>

      <DocNote title="Três camadas empilhadas, e a ordem é o mecanismo">
        Uma camada só faria um crossfade entre nítido e borrado. Cada uma borra o
        que a de baixo compôs, com raio multiplicado pelo índice e extensão{" "}
        <code>100% / i</code>, então o borrão cresce em direção à borda. Para
        mais ou menos vidro, sobrescreva <code>--scroll-fade-blur-r</code>.
      </DocNote>

      <DocNote title="Este é o vidro do backdrop-filter">
        A régua de <code>globals.css</code>: <strong>há algo passando por
        baixo</strong> → borrão de verdade; <strong>não há</strong> → a{" "}
        <code>@utility glass</code>. Numa borda de rolagem há. Sem rolagem, em
        alto contraste, com <code>prefers-reduced-transparency</code> ou sem
        suporte a <code>backdrop-filter</code>, a camada sai do DOM.
      </DocNote>

      <DocNote title="Máscara, e não um gradiente pintado">
        Máscara é <strong>alfa, não cor</strong>: serve qualquer superfície sem
        saber a cor do fundo, enquanto um gradiente <code>from-card</code> pinta
        uma faixa clara dentro de um popover. Com <code>blur</code>, as camadas
        ficam inertes pelo <code>pointer-events: none</code> da utility.
      </DocNote>

      <DocNote title="Quem rola não desenha nada">
        Moldura, altura e tinta ficam no contêiner; a máscara vai no elemento de
        dentro. A máscara recorta o alfa do elemento inteiro, então mascarar um
        nó que pinta apaga os cantos e deixa os lados opacos.
      </DocNote>

      <DocNote title="Um eixo por vez">
        <code>axis</code> é exclusivo: duas máscaras com{" "}
        <code>mask-composite: intersect</code> dariam alfa zero. Para o conteúdo
        passar <em>por trás</em> de um cabeçalho fixo, use{" "}
        <code>scrollFadeBandsClassName</code>, como no <code>Command</code>.
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
            description: "O que a borda faz: blur soma borrão à dissolução, material a substitui.",
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
