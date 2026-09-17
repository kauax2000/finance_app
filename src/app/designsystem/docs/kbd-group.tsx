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
        uma na própria pastilha, como <code>g</code> depois <code>h</code>. O
        acorde — <code>⌘K</code>, dedos descendo juntos — é uma pastilha só e
        mora no{" "}
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
        description="A distinção é o gesto: trocar uma pela outra ensina o atalho errado."
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
        O tipo é uma união, como no <code>Kbd</code>: duas fontes para o mesmo
        conteúdo deixam uma delas em silêncio, e quem escreveu não descobre qual.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "keys",
            type: "string[]",
            description: "As teclas da sequência, na ordem; cada uma vira um Kbd com o nome normalizado (esc → Esc, up → ↑).",
          },
          {
            prop: "children",
            type: "React.ReactNode",
            description: "As pastilhas à mão, para o que keys não escreve.",
          },
        ]}
      />
    </>
  )
}
