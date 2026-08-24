"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { DocSection, Usage } from "../ds-doc"

export default function KbdDoc() {
  return (
    <>
      <Usage>
        Representa uma tecla numa dica de atalho. Combine teclas com{" "}
        <code>KbdGroup</code>. Só faz sentido onde existe teclado: numa dica que
        aparece no telefone, ele é ruído.
      </Usage>

      <DocSection
        title="Teclas e combinações"
        code={`<Kbd>Esc</Kbd>
<KbdGroup>
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>`}
      >
        <Kbd>Esc</Kbd>
        <Kbd>Enter</Kbd>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          abre a busca
        </span>
      </DocSection>
    </>
  )
}
