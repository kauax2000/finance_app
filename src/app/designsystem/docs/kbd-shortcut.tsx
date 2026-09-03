"use client"

import { KbdShortcut } from "@/components/ui/kbd-shortcut"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function KbdShortcutDoc() {
  return (
    <>
      <Usage>
        Um <strong>acorde</strong> — teclas apertadas ao mesmo tempo. É a peça
        que faltava entre as outras duas: <code>Kbd</code> desenha uma tecla e{" "}
        <code>KbdGroup</code> desenha uma sequência, duas teclas apertadas uma
        depois da outra. Um acorde não é nenhum dos dois.
      </Usage>

      <DocSection
        title="Padrão"
        description="A modificadora e a tecla numa peça só, com o símbolo que o sistema operacional de quem lê usa."
        code={`<KbdShortcut keys="mod+k" />
<KbdShortcut keys="shift+?" />`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <KbdShortcut keys="mod+k" />
          <KbdShortcut keys="mod+shift+p" />
          <KbdShortcut keys="shift+?" />
          <KbdShortcut keys="esc" />
        </div>
      </DocSection>

      <DocSection
        title="Acorde, sequência e tecla"
        description="As três peças dizem coisas diferentes, e trocar uma pela outra ensina o atalho errado."
        code={`<KbdShortcut keys="mod+k" />   {/* juntas */}
<KbdGroup><Kbd>g</Kbd><Kbd>i</Kbd></KbdGroup>   {/* uma depois da outra */}
<Kbd>Esc</Kbd>                        {/* uma tecla */}`}
      >
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            acorde <KbdShortcut keys="mod+k" />
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            sequência{" "}
            <KbdGroup>
              <Kbd>g</Kbd>
              <Kbd>i</Kbd>
            </KbdGroup>
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            tecla <Kbd>Esc</Kbd>
          </span>
        </div>
      </DocSection>

      <DocNote title="mod é a tecla certa nos dois sistemas">
        <code>mod</code> sai <code>⌘</code> no Mac e <code>Ctrl</code> no resto.
        Escrever <code>⌘</code> à mão ensina o atalho errado para metade de quem
        lê — e escrever <code>Ctrl</code> à mão ensina errado para a outra
        metade. O acorde ao lado é o que este navegador resolve agora:{" "}
        <KbdShortcut keys="mod+k" />.
      </DocNote>

      <DocNote title="Ele existia sem página, e sem entrada no catálogo">
        O arquivo estava em <code>src/components/ui/</code> desde a rodada da
        paleta de comandos, usado pela busca deste catálogo, e não aparecia em
        lugar nenhum — nem no registry, nem em <code>docs/</code>. É o
        invariante 8 do projeto (&ldquo;componente novo entra em três lugares na
        mesma mudança&rdquo;) violado pelo próprio design system.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "keys",
            type: "string",
            description:
              'As teclas do acorde, separadas por "+". mod vira ⌘ ou Ctrl conforme o sistema.',
          },
        ]}
      />
    </>
  )
}
