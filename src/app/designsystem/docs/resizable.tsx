"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ResizableDoc() {
  return (
    <>
      <Usage>
        Painéis que a pessoa redimensiona. Faz sentido quando ela vai passar muito tempo na tela e tem preferência sobre a proporção.
      </Usage>

      <DocSection
        title="Horizontal"
        code={`<ResizablePanelGroup orientation="horizontal">
  <ResizablePanel defaultSize="40">…</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="60">…</ResizablePanel>
</ResizablePanelGroup>`}
        previewClassName="items-stretch"
      >
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-40 w-full rounded-lg border border-border"
        >
          <ResizablePanel defaultSize="40" minSize="25">
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              Extrato
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="60" minSize="30">
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              Detalhe
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DocSection>

      <DocNote title="defaultSize=&quot;40&quot; é 40%; defaultSize={40} é 40 pixels">
        <code>react-resizable-panels</code>{" "}
        v4 interpreta número como pixel e
        string sem unidade como porcentagem. É o contrário do que a v0 e a v1
        faziam, e é a forma mais fácil de acabar com um painel de 40px achando
        que se pediu 40%.
      </DocNote>

      <DocNote title="Não funciona no toque, e o app é de telefone">
        Arrastar uma alça de 4px é impossível com o dedo. Toda tela que usar
        painéis redimensionáveis precisa de um layout empilhado abaixo de{" "}
        <code>md</code>{" "}
        — e se esse layout empilhado resolve o problema, vale
        perguntar se o redimensionamento era necessário.
      </DocNote>

      <DocNote title="Está no catálogo por paridade">
        Nenhuma tela o consome hoje. Antes de usá-lo, vale o teste: tem semântica própria, o reuso é previsível, e as variants vêm de uso real?
      </DocNote>
    </>
  )
}
