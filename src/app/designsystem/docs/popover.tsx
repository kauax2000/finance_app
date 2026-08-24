"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function PopoverDoc() {
  return (
    <>
      <Usage>
        Uma camada ancorada a um gatilho, aberta por clique. Diferente do
        tooltip, funciona no toque e pode conter controles. Diferente do diálogo,
        não bloqueia a tela — o que o torna certo para um ajuste rápido e errado
        para uma decisão que precisa de atenção.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Popover>
  <PopoverTrigger asChild><Button variant="outline">Detalhes</Button></PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Como o total é calculado</PopoverTitle>
    </PopoverHeader>
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Como calculamos</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <PopoverHeader>
              <PopoverTitle>Como o total é calculado</PopoverTitle>
              <PopoverDescription>
                Soma das transações efetivadas do mês, sem parcelas futuras e sem
                transferências entre carteiras.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocNote title="Para seletor ancorado num campo, use FormPickerPopover">
        Um popover que sai de um campo de formulário precisa de largura igual à
        do gatilho, de folga de colisão e de não roubar o foco ao abrir.{" "}
        <code>FormPickerPopoverContent</code>{" "}
        já resolve os três; repetir isso à
        mão é como cada seletor acaba se comportando um pouco diferente.
      </DocNote>
    </>
  )
}
