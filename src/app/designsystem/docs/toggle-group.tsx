"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ToggleGroupDoc() {
  return (
    <>
      <Usage>
        Um conjunto de opções sempre visíveis, com uma ou várias ativas. É o
        segmento de &ldquo;receita / despesa&rdquo; e o de período. Quando as
        opções trocam o <strong>conteúdo</strong>{" "}
        da tela em vez de filtrá-lo, o
        componente é o <code>Tabs</code>.
      </Usage>

      <DocSection
        title="Seleção única"
        code={`<ToggleGroup type="single" defaultValue="mes">
  <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
  <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
</ToggleGroup>`}
      >
        <ToggleGroup type="single" defaultValue="mes" variant="outline">
          <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
          <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
          <ToggleGroupItem value="ano">Ano</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocSection
        title="Seleção múltipla"
        code={`<ToggleGroup type="multiple" defaultValue={["pix"]}>
  <ToggleGroupItem value="pix">Pix</ToggleGroupItem>
</ToggleGroup>`}
      >
        <ToggleGroup type="multiple" defaultValue={["pix"]} variant="outline">
          <ToggleGroupItem value="pix">Pix</ToggleGroupItem>
          <ToggleGroupItem value="cartao">Cartão</ToggleGroupItem>
          <ToggleGroupItem value="dinheiro">Dinheiro</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocNote title="Seleção única precisa aceitar valor vazio">
        Com <code>type=&quot;single&quot;</code>, clicar na opção já ativa a
        desmarca e o valor vira string vazia. Se a tela não tolera &ldquo;nenhum
        período&rdquo;, trate esse caso — ignorar a desmarcação é melhor que
        renderizar uma lista vazia sem explicação.
      </DocNote>
    </>
  )
}
