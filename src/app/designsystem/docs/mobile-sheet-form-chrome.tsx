"use client"

import Link from "next/link"

import { Form, FormActions, FormSubmit } from "@/components/ui/form"
import {
  MobileSheetFormBody,
  MobileSheetFormStickyHeader,
} from "@/components/ui/mobile-sheet-form-chrome"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { PhoneFrame, PhoneFrameSheet } from "../ds-frame"

export default function MobileSheetFormChromeDoc() {
  return (
    <>
      <Usage>
        A moldura de um formulário em folha inferior: cabeçalho fixo e o corpo
        que rola debaixo dele. O título e a ação <strong>não</strong> rolam
        junto — senão some de vista o que se preenche e onde fica o salvar.
      </Usage>

      <DocSection
        title="A moldura montada"
        description="Numa tela, isto vive dentro de um SheetContent com side=&quot;bottom&quot; e fillMobileViewport — e é por isso que a demonstração roda num telefone de verdade, e não numa caixa de 384px."
        code={`<SheetContent
  side="bottom"
  fillMobileViewport
  className={mobileFormSheetContentClassName}
>
  <MobileSheetFormStickyHeader
    title="Nova transação"
    description="Ela entra no extrato deste mês."
    endAdornment={<MobileSheetFormHeaderCloseButton />}
  />
  <Form layout="none" className="flex min-h-0 flex-1 flex-col">
    <MobileSheetFormBody>…</MobileSheetFormBody>
    <FormActions variant="sticky">
      <FormSubmit className="w-full">Salvar</FormSubmit>
    </FormActions>
  </Form>
</SheetContent>`}
        previewClassName="justify-center"
      >
        <PhoneFrame title="Prévia da moldura de folha de formulário num telefone">
          <PhoneFrameSheet>
            {/* `title` renderiza um DialogTitle, que precisa do contexto do
                Sheet. Fora dele, `children` substitui a linha inteira — que é
                também o que uma tela usa quando o cabeçalho tem mais que
                título e legenda. */}
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
            <Form layout="none" className="flex min-h-0 flex-1 flex-col">
              <MobileSheetFormBody className="pb-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="mb-3 h-10 rounded-lg border border-dashed border-border"
                  />
                ))}
              </MobileSheetFormBody>
              <FormActions variant="sticky">
                <FormSubmit className="w-full">Salvar</FormSubmit>
              </FormActions>
            </Form>
          </PhoneFrameSheet>
        </PhoneFrame>
      </DocSection>

      <DocNote title="A demonstração é um telefone de verdade, e antes não era">
        Ela vivia numa <code>&lt;div&gt;</code> de 384px chamada de telefone. Os
        componentes usam breakpoints de <em>viewport</em>, não container
        queries, então tudo resolvia no ramo desktop: o corpo saía com{" "}
        <strong>20px</strong> de recuo (<code>sm:px-5</code>) em vez de 16, o
        cabeçalho com <strong>12</strong> (<code>md:pt-3</code>) em vez de 8, e o
        rodapé <code>flex-row</code> com <code>justify-end</code> em vez de
        empilhado. Um <code>&lt;iframe&gt;</code> de 375px tem viewport próprio,
        e é a única forma de <code>@media</code> voltar a significar o que diz.
        Escalar com <code>transform</code> não serviria: mentiria sobre o pixel
        de CSS, que é o defeito que estamos consertando.
      </DocNote>

      <DocNote title="O que a moldura não conserta">
        Ela troca o viewport do <strong>CSS</strong>, e nada mais.{" "}
        <code>useIsMobile</code> lê o <code>matchMedia</code> da janela de fora;
        os portais do Radix (<code>Dialog</code>, <code>Popover</code>,{" "}
        <code>Select</code>) vão para o <code>body</code> do documento pai e
        escapam do telefone; e <code>env(safe-area-inset-bottom)</code> vale zero
        aqui, porque não há aparelho — o recuo de baixo que se vê são os 24px de
        base, sem os 34 do iPhone.
      </DocNote>

      <DocNote title="O corpo é o MobileSheetFormBody, e não uma div">
        Esta página desenhava o corpo à mão —{" "}
        <code>min-h-0 flex-1 overflow-y-auto px-4</code> —, que é exatamente a
        string que a peça existe para eliminar. Sem ela não há dissolução na
        borda nem <code>overscroll-contain</code>: rolar a folha até o fim
        passava a rolar a página atrás.
      </DocNote>

      <DocNote title="O rodapé não desenha fio">
        Ele era um <code>&lt;div&gt;</code> com <code>border-t</code>, e a página
        do <a href="/designsystem/form" className="underline underline-offset-2">Form</a>{" "}
        afirmava o contrário sobre o mesmo rodapé — duas páginas do catálogo
        ensinando o oposto uma da outra. Vale a regra <strong>J</strong>: quem
        marca a fronteira é o conteúdo dissolvendo na borda do corpo, logo
        acima. O rodapé é <code>FormActions variant=&quot;sticky&quot;</code>.
      </DocNote>

      <DocNote title="Ele só funciona dentro de um Sheet">
        Com a prop <code>title</code> o cabeçalho renderiza um{" "}
        <code>DialogTitle</code> — o mesmo do diálogo, porque a folha é a mesma
        primitiva do Radix —, que lê o contexto. Fora de um <code>Sheet</code>{" "}
        aberto ele lança, e é isso que garante que a folha tenha nome acessível.
        Por isso a demonstração acima usa <code>children</code>; uma tela de
        verdade usa <code>title</code>.
      </DocNote>

      <DocNote title="O fechar mora no cabeçalho">
        Um × flutuante passa por cima do conteúdo e some atrás do cabeçalho fixo
        assim que a pessoa rola — e foi por isso que o{" "}
        <code>SheetContent</code> deixou de injetar um.{" "}
        <code>MobileSheetFormHeaderCloseButton</code> o coloca dentro do
        cabeçalho, onde ele fica.
      </DocNote>

      <DocNote title="O padding de baixo carrega a área segura">
        <code>mobileFormSheetContentClassName</code> termina em{" "}
        <code>pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]</code>. Sem isso,
        o botão de salvar fica sob a barra de gestos do iPhone — visível, e
        impossível de acertar. E era o que faltava na moldura à mão desta
        página: medido, <code>padding-bottom: 0</code>, com o botão colado na
        borda.
      </DocNote>

      <DocNote title="A alça não é peça da moldura">
        <code>MobileSheetFormDragStrip</code> deixou de existir: ele era um
        embrulho de uma linha em volta de um componente que retornava{" "}
        <code>null</code>, escrito por 20 telas. Quem desenha a alça é a
        superfície — o <code>SheetContent</code> compõe o{" "}
        <Link href="/designsystem/drag-handle" className="underline">
          DragHandle
        </Link>{" "}
        sozinho quando é gaveta, e no desktop não há alça porque a folha não se
        arrasta.
      </DocNote>

      <PropsTable
        title="Partes"
        rows={[
          { prop: "mobileFormSheetContentClassName", type: "string", description: "Classes do SheetContent. Inclui a área segura de baixo." },
          { prop: "MobileSheetFormStickyHeader", type: "{ title?, description?, children?, endAdornment? }", description: "Cabeçalho fixo. children substitui título + descrição, e com ele ninguém dá o nome acessível — numa tela, use title." },
          { prop: "MobileSheetFormBody", type: "ComponentProps<'div'>", description: "O corpo rolável, com a dissolução na borda e overscroll-contain." },
          { prop: "MobileSheetFormHeaderCloseButton", type: "{ disabled?: boolean }", description: "O fechar, para o endAdornment." },
          { prop: "mobileSheetChromeBelowHeaderClassName", type: "string", description: "A folga entre o cabeçalho e o corpo." },
        ]}
      />
    </>
  )
}
