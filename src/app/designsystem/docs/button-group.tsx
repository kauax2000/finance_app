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
        description="Andar no tempo não é a ação da tela, então o trio é secondary. A emenda é um vão transparente de 1px que mostra a superfície de trás."
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

      <DocNote title="O grupo manda no raio e na emenda">
        Os cantos internos são achatados e as bordas vizinhas se sobrepõem em 1px, para a emenda ser um fio só. Em botão cheio, um divisor de <code>currentColor</code> a 20% marca a emenda; em <code>outline</code> e no primário a borda já desenha, e em <code>secondary</code> o vão transparente basta. Não arredonde os filhos por fora. Quem recebe hover ou foco sobe de camada, senão o vizinho recorta o anel.
      </DocNote>

      <DocNote title="Não é um seletor">
        ButtonGroup agrupa <em>ações</em>. Opção que fica marcada é <code>ToggleGroup</code>, com estado pressionado e semântica de rádio. Abas não entram aqui: um <code>role=&quot;group&quot;</code> entre <code>tablist</code> e abas quebra o &ldquo;aba 1 de 3&rdquo; do leitor de tela.
      </DocNote>
    </>
  )
}
