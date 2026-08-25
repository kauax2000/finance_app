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
        title="Variantes e tamanhos"
        code={`<Toggle>Padrão</Toggle>
<Toggle variant="outline">Contorno</Toggle>
<Toggle size="sm">sm</Toggle>
<Toggle size="lg">lg</Toggle>`}
      >
        <Toggle aria-label="Negrito">
          <BoldIcon aria-hidden />
        </Toggle>
        <Toggle variant="outline" defaultPressed>
          <EyeSlashIcon aria-hidden />
          Ocultar valores
        </Toggle>
        <Toggle size="sm" variant="outline">
          sm
        </Toggle>
        <Toggle size="lg" variant="outline">
          lg
        </Toggle>
        <Toggle disabled>Desabilitado</Toggle>
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
