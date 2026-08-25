"use client"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ContextMenuDoc() {
  return (
    <>
      <Usage>
        As ações do <code>DropdownMenu</code>, abertas pelo botão direito. É atalho, <strong>nunca</strong> o único caminho: não existe botão direito no toque.
      </Usage>

      <DocSection
        title="Padrão"
        description="Toda ação daqui precisa existir também num lugar visível — o menu de três pontos da linha, por exemplo."
        code={`<ContextMenu>
  <ContextMenuTrigger>…</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}
        previewClassName="items-stretch"
      >
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Clique com o botão direito aqui
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            <ContextMenuItem>Editar</ContextMenuItem>
            <ContextMenuItem>Duplicar</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </DocSection>

      <DocNote title="Ainda não há consumidor no produto">
        Nenhuma tela o usa. Enquanto isso, a regra acima é o que decide se ele deve mesmo aparecer numa.
      </DocNote>
    </>
  )
}
