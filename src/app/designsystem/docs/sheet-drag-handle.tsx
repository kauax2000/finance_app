"use client"

import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SheetDragHandleDoc() {
  return (
    <>
      <Usage>
        A alça no topo de uma folha inferior. Ela é a convenção que diz &ldquo;isto
        se arrasta e isto se fecha&rdquo; — a mesma que o iOS e o Android usam,
        e a única pista disso numa folha sem botão de fechar visível.
      </Usage>

      <DocSection
        title="Em uso"
        code={`<SheetContent side="bottom">
  <SheetDragHandle />
  …
</SheetContent>`}
        previewClassName="items-stretch p-0"
      >
        <div className="w-full rounded-t-2xl border border-border bg-card">
          <SheetDragHandle />
          <div className="border-t border-border px-4 py-6 text-sm text-muted-foreground">
            Conteúdo da folha
          </div>
        </div>
      </DocSection>

      <DocNote title="Ela é aria-hidden">
        Um leitor de tela não tem o que fazer com uma alça: quem fecha a folha
        ali é o <kbd>Esc</kbd>{" "}
        ou o botão de fechar. A alça é uma pista visual
        para quem usa o dedo, e anunciá-la só somaria ruído.
      </DocNote>

      <DocNote title="Ela não implementa o arraste">
        É só o desenho. O gesto vem da folha — ou do <code>Drawer</code>, que tem
        física própria. Uma alça sobre uma folha que não se arrasta é uma promessa
        que não se cumpre.
      </DocNote>
    </>
  )
}
