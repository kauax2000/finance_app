"use client"

import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ButtonGroupDoc() {
  return (
    <>
      <Usage>
        Botões que agem sobre a <strong>mesma coisa</strong>{" "}
        e por isso ficam
        colados: uma ação com seu menu de variações, um par de navegação. Se as
        ações são independentes, elas ficam separadas por <code>gap</code>{" "}
        — colar
        sugere uma relação que não existe.
      </Usage>

      <DocSection
        title="Ação com menu"
        code={`<ButtonGroup>
  <Button>Nova transação</Button>
  <Button size="icon" aria-label="Mais opções">
    <ChevronDownIcon aria-hidden />
  </Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button>Nova transação</Button>
          <Button size="icon" aria-label="Mais opções de criação">
            <ChevronDownIcon aria-hidden />
          </Button>
        </ButtonGroup>
      </DocSection>

      <DocSection
        title="Conjunto de contorno"
        code={`<ButtonGroup>
  <Button variant="outline">Mês</Button>
  <Button variant="outline">Ano</Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button variant="outline">Anterior</Button>
          <Button variant="outline">Hoje</Button>
          <Button variant="outline">Próximo</Button>
        </ButtonGroup>
      </DocSection>

      <DocNote title="Não é um seletor">
        ButtonGroup agrupa <em>ações</em>. Um conjunto onde uma opção fica
        marcada é <code>ToggleGroup</code>: ele carrega o estado pressionado e a
        semântica de rádio que o botão não tem.
      </DocNote>
    </>
  )
}
