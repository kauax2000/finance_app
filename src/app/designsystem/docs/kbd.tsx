"use client"

import Link from "next/link"

import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function KbdDoc() {
  return (
    <>
      <Usage>
        A tecla numa dica de atalho: uma tecla é <code>children</code>, um acorde é <code>keys</code>. Sequência — teclas uma depois da outra — é o{" "}
        <Link href="/designsystem/kbd-group" className="underline">
          Kbd Group
        </Link>
        . Só onde existe teclado; no telefone é ruído.
      </Usage>

      <DocSection
        title="Uma tecla"
        code={`<Kbd>Esc</Kbd>`}
        previewClassName="gap-3"
      >
        <Kbd>Esc</Kbd>
        <Kbd>Enter</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>?</Kbd>
      </DocSection>

      <DocSection
        title="Um acorde"
        description="Teclas apertadas juntas, numa pastilha só, com o símbolo do sistema de quem lê — como o ⌘K da busca deste catálogo."
        code={`<Kbd keys="mod+k" />
<Kbd keys="shift+enter" />
<Kbd keys="esc" />`}
        previewClassName="gap-3"
      >
        <Kbd keys="mod+k" />
        <Kbd keys="shift+enter" />
        <Kbd keys="mod+shift+p" />
        <Kbd keys="shift+?" />
        <Kbd keys="esc" />
      </DocSection>

      <DocSection
        title="As três formas"
        description="Tecla, acorde e sequência dizem coisas diferentes, e trocar uma pela outra ensina o atalho errado."
        previewClassName="gap-6"
      >
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-2xs text-muted-foreground">tecla</span>
          <Kbd>Esc</Kbd>
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-2xs text-muted-foreground">
            acorde — juntas
          </span>
          <Kbd keys="mod+k" />
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-2xs text-muted-foreground">
            sequência — uma depois da outra
          </span>
          <KbdGroup keys={["g", "i"]} />
        </div>
      </DocSection>

      <DocNote title="Acorde é uma pastilha; sequência são várias">
        <code>⌘K</code> é um gesto: os dedos descem juntos. Em duas pastilhas, o olho lê dois passos, como o <code>g</code> depois <code>h</code> do GitHub.
      </DocNote>

      <DocNote title="O vão entre teclas segue a largura do glifo">
        Símbolos encostam (<code>⌘⇧P</code>) porque cada um já lê como tecla inteira; uma palavra no acorde pede vão, senão <code>CtrlK</code> vira uma coisa só. A regra é o glifo, não a plataforma.
      </DocNote>

      <DocNote title="Escreva mod, nunca ⌘ à mão">
        <code>mod</code> é o modificador principal da plataforma, como no cmdk e no ProseMirror. <code>⌘</code> à mão ensina o atalho errado para metade de quem lê. Neste navegador: <Kbd keys="mod+k" />.
      </DocNote>

      <DocNote title="A tecla desenhada não é a anunciada">
        A pastilha é <code>aria-hidden</code>; quem anuncia é o controle, com <code>aria-keyshortcuts</code> no nome canônico — como <code>&quot;Meta+K Control+K&quot;</code> no gatilho da busca, sem depender da plataforma.
      </DocNote>

      <DocNote title="Só o acorde espera o cliente">
        <code>⌘</code> ou <code>Ctrl</code> depende do <code>navigator</code>, então o acorde não desenha nada até montar — um palpite piscaria e mudaria de largura. Tecla solta (<code>Esc</code>, <code>↵</code>) é igual nos dois sistemas e não espera.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "keys",
            type: "string",
            description:
              'O acorde, em partes separadas por "+". mod vira ⌘ no Apple e Ctrl no resto; também aceita cmd, meta, ctrl, shift, alt/opt e nomes de tecla como esc, enter, space, up.',
          },
          {
            prop: "children",
            type: "React.ReactNode",
            description:
              "A tecla, quando é uma só. Não convive com keys — o tipo barra os dois juntos.",
          },
        ]}
      />
    </>
  )
}
