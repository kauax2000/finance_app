"use client"

import Link from "next/link"

import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function KbdGroupDoc() {
  return (
    <>
      <Usage>
        A <strong>sequência</strong>: teclas apertadas uma depois da outra, cada
        uma na própria pastilha — o atalho de dois tempos, como o{" "}
        <code>g</code> depois <code>h</code> do GitHub. Ele{" "}
        <strong>não</strong> é o acorde: <code>⌘K</code> tem os dedos descendo
        juntos, é uma pastilha só, e mora no{" "}
        <Link href="/designsystem/kbd" className="underline">
          Kbd
        </Link>
        .
      </Usage>

      <DocSection
        title="Padrão"
        description="Uma tecla por pastilha, na ordem em que se aperta. Os nomes passam pela mesma tabela do Kbd, então esc vira Esc e up vira ↑."
        code={`<KbdGroup keys={["g", "h"]} />
<KbdGroup keys={["g", "esc"]} />`}
        previewClassName="gap-4"
      >
        <KbdGroup keys={["g", "h"]} />
        <KbdGroup keys={["g", "p"]} />
        <KbdGroup keys={["g", "esc"]} />
      </DocSection>

      <DocSection
        title="Sequência ou acorde"
        description="A distinção é o gesto, e trocar uma pela outra ensina o atalho errado. A explicação longa mora na página do Kbd, onde o acorde vive."
        previewClassName="gap-6"
      >
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-2xs text-muted-foreground">
            sequência — g, depois i
          </span>
          <KbdGroup keys={["g", "i"]} />
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-2xs text-muted-foreground">
            acorde — as duas juntas
          </span>
          <Kbd keys="mod+k" />
        </div>
      </DocSection>

      <DocSection
        title="O que keys não escreve"
        description="Um glifo que não está na tabela, um ícone, uma tecla com nome próprio: aí as pastilhas vêm por children, e cada uma é um Kbd."
        code={`<KbdGroup>
  <Kbd>Fn</Kbd>
  <Kbd>F5</Kbd>
</KbdGroup>`}
        previewClassName="gap-4"
      >
        <KbdGroup>
          <Kbd>Fn</Kbd>
          <Kbd>F5</Kbd>
        </KbdGroup>
      </DocSection>

      <DocNote title="keys e children não convivem">
        O tipo é uma união: ou um, ou outro. É a mesma forma do{" "}
        <code>Kbd</code>, e pela mesma razão — duas fontes para o mesmo conteúdo
        deixam uma delas em silêncio, e quem escreveu não descobre qual.
      </DocNote>

      <DocNote title="Ele importa o átomo, e é por isso que é molécula">
        Antes desta rodada ele importava <strong>zero</strong> componentes: as
        pastilhas vinham de quem chamava, e ele era só uma caixa de flex com{" "}
        <code>gap-1</code>. Uma molécula que não compõe nada é o padrão fraco que
        este catálogo já mediu — <strong>26 das 38</strong> moléculas importavam
        zero. O <code>keys</code> existe justamente para a classificação virar
        verdade: um <code>Kbd</code> por tecla, o átomo importado de fato.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "keys",
            type: "string[]",
            description:
              "As teclas da sequência, na ordem. Cada uma vira um Kbd, com o nome normalizado pela mesma tabela (esc → Esc, up → ↑, k → K).",
          },
          {
            prop: "children",
            type: "React.ReactNode",
            description:
              "As pastilhas escritas à mão, para o que keys não escreve. Não convive com keys.",
          },
        ]}
      />
    </>
  )
}
