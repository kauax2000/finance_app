"use client"

import { Button } from "@/components/ui/button"
import {
  MobileSheetFormDragStrip,
  MobileSheetFormStickyHeader,
} from "@/components/ui/mobile-sheet-form-chrome"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function MobileSheetFormChromeDoc() {
  return (
    <>
      <Usage>
        A moldura de um formulário em folha inferior: alça, cabeçalho fixo e o corpo que rola entre eles. O título e a ação <strong>não</strong> rolam junto — senão some de vista o que se preenche e onde fica o salvar.
      </Usage>

      <DocSection
        title="A moldura montada"
        description="Fora de uma folha de verdade, o que dá para mostrar é a estrutura. Numa tela, isto vive dentro de um SheetContent com side=&quot;bottom&quot; e fillMobileViewport."
        code={`<SheetContent
  side="bottom"
  fillMobileViewport
  showCloseButton={false}
  className={mobileFormSheetContentClassName}
>
  <MobileSheetFormDragStrip />
  <MobileSheetFormStickyHeader
    title="Nova transação"
    description="Ela entra no extrato deste mês."
    endAdornment={<MobileSheetFormHeaderCloseButton />}
  />
  <div className="min-h-0 flex-1 overflow-y-auto px-4">…</div>
  <div className="shrink-0 border-t px-4 pt-3">
    <Button type="submit" className="w-full">Salvar</Button>
  </div>
</SheetContent>`}
        previewClassName="items-stretch p-0"
      >
        <div className="flex h-80 w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card">
          <MobileSheetFormDragStrip />
          {/* `title` renderiza um SheetTitle, que precisa do contexto do Sheet.
              Fora dele, `children` substitui a linha inteira — que é também o
              que uma tela usa quando o cabeçalho tem mais que título e legenda. */}
          <MobileSheetFormStickyHeader>
            <div className="min-w-0">
              <p className="font-heading text-base leading-tight font-medium text-foreground">
                Nova transação
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ela entra no extrato deste mês.
              </p>
            </div>
          </MobileSheetFormStickyHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="mb-3 h-10 rounded-lg border border-dashed border-border"
              />
            ))}
          </div>
          <div className="shrink-0 border-t border-border px-4 pt-3 pb-4">
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </div>
        </div>
      </DocSection>

      <DocNote title="Ele só funciona dentro de um Sheet">
        Com a prop <code>title</code> o cabeçalho renderiza um <code>SheetTitle</code>, que lê o contexto do Radix. Fora de um <code>Sheet</code> aberto ele lança — e é o que garante que a folha tenha nome acessível. Por isso a demonstração acima usa <code>children</code>.
      </DocNote>

      <DocNote title="showCloseButton={false} e o fechar no cabeçalho">
        O X padrão do <code>SheetContent</code>{" "}
        flutua sobre o conteúdo e some
        atrás do cabeçalho fixo assim que a pessoa rola.{" "}
        <code>MobileSheetFormHeaderCloseButton</code>{" "}
        o coloca dentro do
        cabeçalho, onde ele fica.
      </DocNote>

      <DocNote title="O padding de baixo carrega a área segura">
        <code>mobileFormSheetContentClassName</code> termina em{" "}
        <code>pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]</code>. Sem isso,
        o botão de salvar fica sob a barra de gestos do iPhone — visível, e
        impossível de acertar.
      </DocNote>

      <PropsTable
        title="Partes"
        rows={[
          { prop: "mobileFormSheetContentClassName", type: "string", description: "Classes do SheetContent. Inclui a área segura de baixo." },
          { prop: "MobileSheetFormDragStrip", type: "—", description: "A alça. É o SheetDragHandle." },
          { prop: "MobileSheetFormStickyHeader", type: "{ title?, description?, children?, endAdornment? }", description: "Cabeçalho fixo. children substitui título + descrição." },
          { prop: "MobileSheetFormHeaderCloseButton", type: "{ disabled?: boolean }", description: "O fechar, para o endAdornment." },
          { prop: "mobileSheetChromeBelowHeaderClassName", type: "string", description: "A folga entre o cabeçalho e o corpo." },
        ]}
      />
    </>
  )
}
