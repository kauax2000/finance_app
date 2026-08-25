"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function CollapsibleDoc() {
  return (
    <>
      <Usage>
        Um bloco que expande — o <code>Accordion</code> de um item só, sem a semântica de lista. Para detalhes avançados de um formulário ou o resto de uma lista longa.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">Opções avançadas</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
        previewClassName="items-stretch"
      >
        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-1.5">
              Opções avançadas
              <ChevronDownIcon
                className="transition-transform duration-(--duration-fast) group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <p className="text-sm text-muted-foreground">
              Anexar comprovante, dividir com um membro, marcar como reembolso.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </DocSection>

      <DocNote title="O que está fechado ainda existe para a busca do navegador?">
        Não. O conteúdo recolhido sai do DOM, então <kbd>⌘F</kbd>{" "}
        não o encontra.
        Se o que está lá dentro precisa ser localizável, ele não deveria estar
        escondido.
      </DocNote>
    </>
  )
}
