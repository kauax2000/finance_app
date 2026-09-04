"use client"

import { ScrollFade } from "@/components/ui/scroll-fade"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

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
        De quebra, <code>pointer-events</code> deixou de ser assunto — não há
        mais nada por cima do conteúdo para comer o clique dos itens de baixo.
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
            prop: "viewportClassName",
            type: "string",
            description: "Classes da região rolável interna, não do contêiner.",
          },
        ]}
      />
    </>
  )
}
