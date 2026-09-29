"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ToggleGroupDoc() {
  return (
    <>
      <Usage>
        Opções sempre visíveis, com uma ou várias ativas, como o período. Quando trocam o <strong>conteúdo</strong> da tela em vez de filtrá-lo, o componente é o <code>Tabs</code>.
      </Usage>

      <DocSection
        title="Seleção única"
        code={`<ToggleGroup type="single" defaultValue="mes">
  <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
  <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
</ToggleGroup>`}
      >
        <ToggleGroup type="single" defaultValue="mes">
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
        <ToggleGroup type="multiple" defaultValue={["pix"]}>
          <ToggleGroupItem value="pix">Pix</ToggleGroupItem>
          <ToggleGroupItem value="cartao">Cartão</ToggleGroupItem>
          <ToggleGroupItem value="dinheiro">Dinheiro</ToggleGroupItem>
        </ToggleGroup>
      </DocSection>

      <DocNote title="Na seleção única, clicar no ativo não desmarca">
        O Radix trata o grupo de um valor como um toggle: o segundo clique no
        item ativo devolveria string vazia e deixaria o grupo sem nenhum. O
        componente engole essa troca, e em <code>type=&quot;single&quot;</code>{" "}
        sempre há um escolhido — por isso os filtros do app puderam sair de{" "}
        <code>role=&quot;tab&quot;</code>. (A versão anterior desta página dizia
        o contrário.) Em <code>type=&quot;multiple&quot;</code>, esvaziar é uma
        resposta legítima e passa.
      </DocNote>

      <DocNote title="As peles são as do Toggle">
        <code>variant</code>, <code>shape</code> e <code>size</code> descem do
        grupo para os itens, e cada item também recebe <code>icon</code>,{" "}
        <code>iconOn</code> e <code>color</code>. A pílula dos filtros, a
        amostra de cor e os degraus de ícone das grades estão na página do{" "}
        <code>Toggle</code>.
      </DocNote>
    </>
  )
}
