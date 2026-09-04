"use client"

import Link from "next/link"

import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function KbdDoc() {
  return (
    <>
      <Usage>
        A tecla que se aperta, numa dica de atalho. <strong>Duas formas, um
        componente</strong>: uma tecla é <code>children</code>, um acorde é{" "}
        <code>keys</code>. A terceira forma — a <strong>sequência</strong>,
        teclas apertadas uma depois da outra — é outra peça, o{" "}
        <Link href="/designsystem/kbd-group" className="underline">
          Kbd Group
        </Link>
        . Só faz sentido onde existe teclado; no telefone é ruído.
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
        description="Teclas apertadas juntas, numa pastilha só, com o símbolo que o sistema operacional de quem lê usa. É a forma que o gatilho da busca deste catálogo usa — o ⌘K ali em cima. keys aceita mod, cmd, meta, ctrl, shift, alt/opt e nomes de tecla como esc, enter, space, up."
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

      <DocNote title="Acorde e sequência não são a mesma coisa">
        <code>⌘K</code> é um gesto: os dedos descem juntos. Separado em duas
        pastilhas, o olho lê dois passos — que é como se escreve o{" "}
        <code>g</code> depois <code>h</code> do GitHub. Não é teoria: a página do{" "}
        <code>Command</code> desenhava o <code>⌘K</code> dela como sequência, com
        o <code>⌘</code> literal, enquanto o atalho de verdade logo acima aceitava{" "}
        <code>metaKey || ctrlKey</code> — dois passos e a tecla errada em
        Windows, na demonstração do componente que abre com o atalho. Foi
        consertado na rodada que fundiu estas peças.
      </DocNote>

      <DocNote title="O espaço entre as teclas é layout, não texto">
        Símbolos encostam (<code>gap-0</code>) porque cada um já se lê como uma
        tecla inteira — <code>⌘K</code>, <code>⌘⇧P</code>. Basta uma palavra no
        acorde para o vão ser necessário: <code>CtrlK</code> vira uma coisa só, e{" "}
        <code>⇧Enter</code> gruda o símbolo no verbo. A regra é a{" "}
        <strong>largura do glifo</strong>, não a plataforma — a primeira versão
        amarrava o vão ao sistema operacional e produzia exatamente esse{" "}
        <code>⇧Enter</code>.
      </DocNote>

      <DocNote title="mod é a tecla certa nos dois sistemas">
        <code>mod</code> é a convenção de quem já resolveu isto — cmdk,
        Mousetrap, ProseMirror: o modificador principal da plataforma, sem a tela
        precisar saber qual é. Escrever <code>⌘</code> à mão ensina o atalho
        errado para metade de quem lê. O acorde ao lado é o que{" "}
        <em>este navegador</em> resolve agora: <Kbd keys="mod+k" />.
      </DocNote>

      <DocNote title="A tecla desenhada não é a tecla anunciada">
        A pastilha é <code>aria-hidden</code>, e quem anuncia o atalho é o
        controle, com <code>aria-keyshortcuts</code>. São dois públicos: o olho
        precisa do símbolo do sistema, o leitor de tela precisa do nome canônico
        — e o gatilho da busca deste catálogo declara{" "}
        <code>aria-keyshortcuts=&quot;Meta+K Control+K&quot;</code>, os dois, sem
        depender da plataforma.
      </DocNote>

      <DocNote title="Só o acorde espera para saber onde está">
        A escolha entre <code>⌘</code> e <code>Ctrl</code> depende do{" "}
        <code>navigator</code>, que não existe no servidor — então o acorde não
        desenha nada até o cliente montar. Renderizar o palpite e corrigir faria
        a tecla piscar de errada para certa, e como as duas têm larguras
        diferentes, o salto seria duplo.
        <br />
        <strong>A tecla solta não espera.</strong> <code>Esc</code>,{" "}
        <code>↑</code> e <code>↵</code> são a mesma tecla nos dois sistemas, e a
        legenda do rodapé da paleta de comandos são quatro delas: se esperassem
        por uma plataforma que não muda nada, a legenda inteira pintaria em
        branco por um quadro.
      </DocNote>

      <DocNote title="Uma peça, duas formas">
        Isto já foram dois componentes — <code>Kbd</code> e{" "}
        <code>KbdShortcut</code>, em dois arquivos, com duas páginas e{" "}
        <strong>duas tabelas da mesma prop</strong> <code>keys</code> que já
        tinham divergido: uma enumerava o que a prop aceita, a outra explicava o{" "}
        <code>mod</code>, e nenhuma continha a outra. Se você procurava{" "}
        <code>KbdShortcut</code>, é <code>&lt;Kbd keys=…&gt;</code>.
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
