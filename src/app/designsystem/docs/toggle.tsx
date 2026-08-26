"use client"

import { BoldIcon, EyeSlashIcon } from "@heroicons/react/16/solid"
import { Toggle } from "@/components/ui/toggle"
import { DocSection, PropsTable, Usage } from "../ds-doc"

export default function ToggleDoc() {
  return (
    <>
      <Usage>
        Um botão que fica pressionado: esconder valores, fixar uma coluna. Se a opção pertence a um conjunto onde só uma vale por vez, use <code>ToggleGroup</code>.
      </Usage>

      <DocSection
        title="Variantes"
        description="default não desenha contorno até ser pressionado. outline mostra a borda desde o repouso, para quando o controle precisa ser encontrado antes de ser usado. Os dois no mesmo tamanho aqui — o que muda é só o contorno."
        code={`<Toggle>Padrão</Toggle>
<Toggle variant="outline">Contorno</Toggle>`}
      >
        <Toggle aria-label="Negrito">
          <BoldIcon aria-hidden />
          default
        </Toggle>
        <Toggle variant="outline" aria-label="Negrito com contorno">
          <BoldIcon aria-hidden />
          outline
        </Toggle>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="sm, o padrão e lg. Todos aqui na mesma variante — só a altura muda."
        code={`<Toggle size="sm">sm</Toggle>
<Toggle>default</Toggle>
<Toggle size="lg">lg</Toggle>`}
      >
        <Toggle variant="outline" size="sm">
          sm
        </Toggle>
        <Toggle variant="outline">default</Toggle>
        <Toggle variant="outline" size="lg">
          lg
        </Toggle>
      </DocSection>

      <DocSection
        title="Estados"
        description="Pressionado é o estado que dá nome ao componente: ele fica marcado e o leitor de tela anuncia aria-pressed. Desabilitado continua visível — o que existe e está indisponível ensina mais ficando na tela."
        code={`<Toggle defaultPressed>Pressionado</Toggle>
<Toggle disabled>Desabilitado</Toggle>`}
      >
        <Toggle variant="outline" defaultPressed>
          <EyeSlashIcon aria-hidden />
          Ocultar valores
        </Toggle>
        <Toggle variant="outline">
          <EyeSlashIcon aria-hidden />
          Em repouso
        </Toggle>
        <Toggle variant="outline" disabled>
          Desabilitado
        </Toggle>
      </DocSection>

      <PropsTable
        rows={[
          { prop: "pressed", type: "boolean", description: "Estado controlado." },
          { prop: "defaultPressed", type: "boolean", description: "Estado inicial não controlado." },
          { prop: "variant", type: '"default" | "outline"', default: '"default"', description: "Com ou sem contorno em repouso." },
          { prop: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "Altura do botão." },
        ]}
      />
    </>
  )
}
