"use client"

import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function TooltipDoc() {
  return (
    <>
      <Usage>
        Um complemento curto para quem já entendeu o essencial. Nunca coloque
        nele informação necessária: no telefone não existe hover, e o tooltip
        simplesmente não aparece.
      </Usage>

      <DocSection
        title="Padrão"
        description="O TooltipProvider já está montado no layout raiz, então não é preciso repeti-lo."
        code={`<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="icon" aria-label="Sobre o cálculo">
      <InfoIcon aria-hidden />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Considera só transações efetivadas.</TooltipContent>
</Tooltip>`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Sobre o cálculo">
              <InfoIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Considera só transações efetivadas.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">Passe o cursor</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Atalho: <kbd>⌘</kbd> <kbd>K</kbd>
          </TooltipContent>
        </Tooltip>
      </DocSection>

      <DocNote title="No toque ele não existe">
        <code>hover:</code> compila para{" "}
        <code>@media (hover: hover)</code>, e um telefone responde{" "}
        <code>hover: none</code>. Se a explicação é indispensável, ela vira texto
        na tela, um <code>Popover</code>{" "}
        acionado por toque ou a descrição de um
        campo — não um tooltip que metade dos usuários nunca verá.
      </DocNote>

      <DocNote title="Tooltip não substitui aria-label">
        Um botão só de ícone precisa dos dois: o <code>aria-label</code>{" "}
        para ser
        anunciado e o tooltip para ser lido. O tooltip do Radix é ligado por{" "}
        <code>aria-describedby</code>, que complementa o nome mas não o cria.
      </DocNote>
    </>
  )
}
