"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ButtonGroupDoc() {
  return (
    <>
      <Usage>
        Botões que agem sobre a <strong>mesma coisa</strong> e por isso ficam colados: uma ação com seu menu, um par de navegação. Ações independentes ficam separadas por <code>gap</code>.
      </Usage>

      <DocSection
        title="Ação com menu"
        code={`<ButtonGroup>
  <Button>Nova transação</Button>
  <Button size="icon-md" aria-label="Mais opções">
    <ChevronDownIcon aria-hidden />
  </Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button>Nova transação</Button>
          <Button size="icon-md" aria-label="Mais opções de criação">
            <ChevronDownIcon aria-hidden />
          </Button>
        </ButtonGroup>
      </DocSection>

      <DocSection
        title="Par de navegação"
        description="Andar no tempo não é a ação da tela, então o trio fica no segundo degrau. Sem contorno para separar, quem marca as emendas é o divisor."
        code={`<ButtonGroup>
  <Button variant="secondary">Anterior</Button>
  <Button variant="secondary">Hoje</Button>
  <Button variant="secondary">Próximo</Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button variant="secondary">Anterior</Button>
          <Button variant="secondary">Hoje</Button>
          <Button variant="secondary">Próximo</Button>
        </ButtonGroup>
      </DocSection>

      <DocNote title="O grupo é quem manda no raio">
        Os cantos internos são achatados e as bordas vizinhas se sobrepõem em
        1px, então a emenda é um fio só e não uma linha dupla. Sobre esse fio
        vai um divisor de <code>currentColor</code> a 20%, que segue a cor do
        texto de cada variante — clareia sobre o primário preenchido, escurece
        sobre o claro — porque num botão cheio não há borda visível para marcar
        onde um termina e o outro começa. Antes o{" "}
        <code>Button</code> carregava{" "}
        <code>in-data-[slot=button-group]:rounded-xl</code>, que dentro do grupo
        deixava cada filho <em>mais</em> arredondado — o oposto de colar. Quem
        recebe hover ou foco sobe de camada, senão o vizinho recortaria o anel —
        e o divisor sobe mais alto ainda, porque ele mora 1px fora da própria
        caixa, em cima da aresta do vizinho da esquerda: sem isso a emenda sumia
        justo do lado que se está apontando.
      </DocNote>

      <DocNote title="Não é um seletor">
        ButtonGroup agrupa <em>ações</em>. Um conjunto onde uma opção fica
        marcada é <code>ToggleGroup</code>: ele carrega o estado pressionado e a
        semântica de rádio que o botão não tem. O app tinha 11 controles
        segmentados embrulhados aqui dentro; todos saíram, porque um{}
        <code>role=&quot;group&quot;</code> entre um <code>tablist</code> e suas
        abas quebra a posse que o leitor de tela precisa para anunciar
        &ldquo;aba 1 de 3&rdquo;.
      </DocNote>
    </>
  )
}
