"use client"

import { BoldIcon, EyeSlashIcon } from "@heroicons/react/16/solid"
import { Toggle } from "@/components/ui/toggle"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ToggleDoc() {
  return (
    <>
      <Usage>
        Um <strong>estado</strong> que se liga e desliga: esconder valores, fixar uma coluna. Não é um botão — botão faz algo acontecer e volta ao que era; o toggle passa a valer e fica. Se a opção pertence a um conjunto onde só uma vale por vez, use <code>ToggleGroup</code>.
      </Usage>

      <DocSection
        title="Variantes"
        description="plain — o padrão — não tem cromo nenhum em repouso: nem borda, nem preenchimento, nem sombra. outline mostra a borda desde o repouso, para o toggle que aparece sozinho numa superfície sem outra pista de que ali se clica. Clique nos dois para ver o estado ligado."
        code={`<Toggle>Ocultar</Toggle>
<Toggle variant="outline">Ocultar</Toggle>`}
      >
        <Toggle aria-label="Negrito">
          <BoldIcon aria-hidden />
          plain
        </Toggle>
        <Toggle variant="outline" aria-label="Negrito com contorno">
          <BoldIcon aria-hidden />
          outline
        </Toggle>
      </DocSection>

      <DocSection
        title="Desligado e ligado"
        description="Desligado é tinta apagada sobre nada. Ligado é tinta cheia sobre o cinza do secondary — quem carrega o sinal é o salto de tinta, e o chão só confirma. Os dois pares aqui estão fixos para a diferença ficar lado a lado."
        code={`<Toggle>Em repouso</Toggle>
<Toggle defaultPressed>Ligado</Toggle>`}
      >
        <Toggle aria-label="Desligado">
          <EyeSlashIcon aria-hidden />
          Desligado
        </Toggle>
        <Toggle defaultPressed aria-label="Ligado">
          <EyeSlashIcon aria-hidden />
          Ligado
        </Toggle>
        <Toggle variant="outline" aria-label="Desligado com contorno">
          <EyeSlashIcon aria-hidden />
          Desligado
        </Toggle>
        <Toggle variant="outline" defaultPressed aria-label="Ligado com contorno">
          <EyeSlashIcon aria-hidden />
          Ligado
        </Toggle>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="28, 32 e 36 — os mesmos degraus e os mesmos nomes do Button e do Input, então toggle ao lado de campo alinha sem ninguém dizer size. O degrau do meio já media 32; ele só se chamava default."
        code={`<Toggle size="sm">sm</Toggle>
<Toggle>md</Toggle>
<Toggle size="lg">lg</Toggle>`}
      >
        <Toggle variant="outline" size="sm">
          sm
        </Toggle>
        <Toggle variant="outline">md</Toggle>
        <Toggle variant="outline" size="lg">
          lg
        </Toggle>
      </DocSection>

      <DocSection
        title="Desabilitado"
        description="Continua visível — o que existe e está indisponível ensina mais ficando na tela. O leitor de tela anuncia aria-pressed nos dois casos."
        code={`<Toggle disabled>Desabilitado</Toggle>
<Toggle disabled defaultPressed>Ligado e travado</Toggle>`}
      >
        <Toggle disabled>Desabilitado</Toggle>
        <Toggle disabled defaultPressed>
          Ligado e travado
        </Toggle>
      </DocSection>

      <DocNote title="Ele não afunda quando é clicado">
        O <code>Button</code> tem <code>active:translate-y-px</code>: foi
        pressionado, algo aconteceu, e a peça volta. O toggle não volta — ele
        passa a valer. O deslocamento prometia um retorno que não existe, e é a
        razão de o controle ler como botão mesmo depois de perder o
        preenchimento.
      </DocNote>

      <DocNote title="plain aqui, tertiary lá">
        No <code>Button</code> o nome <code>plain</code>{" "}
        foi trocado por <code>tertiary</code>{" "}
        porque precisava dizer um degrau de uma escada de três pesos. O toggle
        não tem escada: tem duas peles, com e sem contorno. Aí o nome pode
        descrever o cromo em vez de uma posição que não existe.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "pressed", type: "boolean", description: "Estado controlado." },
          { prop: "defaultPressed", type: "boolean", description: "Estado inicial não controlado." },
          { prop: "variant", type: '"plain" | "outline"', default: '"plain"', description: "Sem cromo nenhum em repouso, ou com contorno desde o repouso." },
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Altura: 28, 32 e 36." },
        ]}
      />
    </>
  )
}
