"use client"

import { BoldIcon, EyeSlashIcon } from "@heroicons/react/16/solid"
import { Toggle } from "@/components/ui/toggle"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ToggleDoc() {
  return (
    <>
      <Usage>
        Um <strong>estado</strong> que liga e desliga: esconder valores, fixar uma coluna. Botão faz algo acontecer e volta; o toggle passa a valer e fica. Se só uma opção de um conjunto vale por vez, use <code>ToggleGroup</code>.
      </Usage>

      <DocSection
        title="Variantes"
        description="plain, o padrão, não tem cromo em repouso. outline mostra a borda desde o repouso, para o toggle sozinho numa superfície sem outra pista de que ali se clica."
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
        description="Desligado é tinta apagada sobre nada; ligado é tinta cheia sobre o secondary. Quem carrega o sinal é o salto de tinta."
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
        description="28, 32 e 36 — os degraus e nomes do Button e do Input, então toggle ao lado de campo alinha sem ninguém dizer size."
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
        description="Continua visível: o que existe e está indisponível ensina mais ficando na tela. O leitor de tela anuncia aria-pressed nos dois casos."
        code={`<Toggle disabled>Desabilitado</Toggle>
<Toggle disabled defaultPressed>Ligado e travado</Toggle>`}
      >
        <Toggle disabled>Desabilitado</Toggle>
        <Toggle disabled defaultPressed>
          Ligado e travado
        </Toggle>
      </DocSection>

      <DocNote title="Ele não afunda ao clicar">
        O <code>active:translate-y-px</code> do <code>Button</code> promete que a peça volta. O toggle não volta — passa a valer —, então não afunda.
      </DocNote>

      <DocNote title="plain aqui, tertiary lá">
        No <code>Button</code> o nome é <code>tertiary</code> porque diz um degrau de uma escada de três pesos. O toggle não tem escada, só duas peles, e o nome descreve o cromo.
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
