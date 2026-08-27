"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { KbdShortcut } from "@/components/ui/kbd-shortcut"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function KbdDoc() {
  return (
    <>
      <Usage>
        A tecla que se aperta, numa dica de atalho. Três formas, e a escolha é
        pelo <strong>gesto</strong>: uma tecla é <code>Kbd</code>, um acorde é{" "}
        <code>KbdShortcut</code>, uma sequência é <code>KbdGroup</code>. Só faz
        sentido onde existe teclado — no telefone é ruído.
      </Usage>

      <DocSection
        title="Uma tecla"
        code={`<Kbd>Esc</Kbd>`}
      >
        <Kbd>Esc</Kbd>
        <Kbd>Enter</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>?</Kbd>
      </DocSection>

      <DocSection
        title="Um acorde"
        description="Teclas apertadas juntas, numa pastilha só. É a forma que o gatilho da busca deste catálogo usa — o ⌘K ali em cima. keys aceita mod, que vira ⌘ no Apple e Ctrl no resto, sem a tela precisar saber qual dos dois."
        code={`<KbdShortcut keys="mod+k" />
<KbdShortcut keys="shift+enter" />`}
      >
        <KbdShortcut keys="mod+k" />
        <KbdShortcut keys="shift+enter" />
        <KbdShortcut keys="mod+shift+p" />
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <KbdShortcut keys="mod+k" />
          abre a busca
        </span>
      </DocSection>

      <DocSection
        title="Uma sequência"
        description="Teclas apertadas uma depois da outra, cada uma na própria pastilha. É o caso raro: atalho de dois tempos, como o g h do GitHub."
        code={`<KbdGroup>
  <Kbd>G</Kbd>
  <Kbd>H</Kbd>
</KbdGroup>`}
      >
        <KbdGroup>
          <Kbd>G</Kbd>
          <Kbd>H</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>G</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </DocSection>

      <DocNote title="Acorde e sequência não são a mesma coisa">
        <code>⌘</code> <code>K</code> em duas pastilhas lê como dois passos:
        aperta, solta, aperta. Mas num acorde os dedos descem juntos, e a dica
        precisa mostrar isso — senão ela ensina o atalho errado. Esta página já
        demonstrou o acorde como sequência, enquanto a busca do cabeçalho, a dois
        metros dali, fazia o certo.
      </DocNote>

      <DocNote title="O espaço entre as teclas é layout, não texto">
        <code>⌘K</code> cola porque cada símbolo já se lê como uma tecla
        inteira. Basta uma <strong>palavra</strong> no acorde para o vão ser
        necessário: <code>CtrlK</code> vira uma coisa só, e{" "}
        <code>⇧Enter</code> gruda o símbolo no verbo. A regra é a largura do
        glifo, não a plataforma — <code>⌘⇧P</code>{" "}
        continua colado, com três teclas. Era um espaço digitado dentro da
        string, o que fazia o dado carregar uma decisão de desenho.
      </DocNote>

      <DocNote title="A tecla desenhada não é a tecla anunciada">
        <code>KbdShortcut</code> é desenho: quem usa leitor de tela precisa do{" "}
        <code>aria-keyshortcuts</code>{" "}
        no controle, que é o atributo que os leitores de fato anunciam. O gatilho
        da busca declara{" "}
        <code>aria-keyshortcuts=&quot;Meta+K Control+K&quot;</code>{" "}
        e passa <code>aria-hidden</code>{" "}
        na pastilha — sem isso o nome acessível diria a tecla duas vezes.
      </DocNote>

      <DocNote title="Ele não aparece antes de saber em que plataforma está">
        A escolha entre <code>⌘</code> e <code>Ctrl</code>{" "}
        depende do <code>navigator</code>, que não existe no servidor. Renderizar
        o palpite e corrigir depois faria a tecla piscar de errada para certa — e
        as duas têm larguras diferentes, então o salto seria duplo. Até saber,{" "}
        <code>KbdShortcut</code> não desenha nada.
      </DocNote>

      <PropsTable
        title="Props do KbdShortcut"
        rows={[
          {
            prop: "keys",
            type: "string",
            description:
              'O acorde, em partes separadas por "+". Aceita mod, cmd, meta, ctrl, shift, alt/opt, e nomes de tecla como esc, enter, space, up.',
          },
        ]}
      />
    </>
  )
}
