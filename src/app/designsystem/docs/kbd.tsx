"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
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

      <DocSection
        title="Ao lado de um controle"
        description="O uso real: a pastilha é dica visual, e quem anuncia o atalho é o controle, com aria-keyshortcuts no nome canônico. A pastilha leva aria-hidden na chamada — o componente não o põe sozinho, porque uma tecla citada numa frase de ajuda é conteúdo e precisa ser lida."
        code={`<Button variant="outline" aria-keyshortcuts="Meta+K Control+K">
  buscar
  <Kbd keys="mod+k" aria-hidden />
</Button>`}
      >
        <Button variant="outline" aria-keyshortcuts="Meta+K Control+K">
          buscar
          <Kbd keys="mod+k" aria-hidden />
        </Button>
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
        Ao lado de um controle, quem anuncia é o controle, com <code>aria-keyshortcuts</code> no nome canônico — <code>&quot;Meta+K Control+K&quot;</code> no gatilho da busca, sem depender da plataforma —, e a pastilha leva <code>aria-hidden</code> na chamada, para não dizer o atalho duas vezes. O componente não o põe por conta própria: uma tecla citada numa frase (&ldquo;aperte <Kbd>Esc</Kbd> para fechar&rdquo;) é conteúdo.
      </DocNote>

      <DocNote title="A pastilha é mais escura no claro, e é medido">
        Sobre o campo de busca, o <code>bg-muted</code> media 1,04 e a pastilha sumia como forma; um fio de <code>--border</code> dava 1,19 e não se enxergava. No claro ela é <code>bg-input-fill</code> com o glifo em <code>foreground/80</code> (8,3:1); no escuro, onde já se destaca sozinha, volta ao <code>muted</code>. Mede 20px de altura, com o corpo <code>text-xs</code>.
      </DocNote>

      <DocNote title="Onde se usa">
        Só no catálogo: o <code>⌘K</code> do gatilho da busca e a legenda de teclado da paleta (<Kbd>↑</Kbd> <Kbd>↓</Kbd> <Kbd>↵</Kbd> <Kbd>Esc</Kbd>, sem <code>keys</code> de propósito — tecla solta não espera o cliente). As telas do app ainda não têm atalho de teclado.
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
            prop: "aria-hidden",
            type: "boolean",
            description:
              "Passe quando a pastilha acompanha um controle que já anuncia o atalho por aria-keyshortcuts. O componente não o põe sozinho.",
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
