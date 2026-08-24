"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CATEGORIAS = [
  { value: "mercado", label: "Mercado" },
  { value: "transporte", label: "Transporte" },
  { value: "restaurantes", label: "Restaurantes" },
  { value: "assinaturas", label: "Assinaturas" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "lazer", label: "Lazer" },
  { value: "casa", label: "Casa" },
]

export default function ComboboxDoc() {
  return (
    <>
      <Usage>
        Um <code>Select</code>{" "}
        com busca. A partir de umas dez opções, rolar a
        lista procurando um nome é pior que digitar três letras. Categoria,
        cartão e membro do workspace são os casos deste app.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Combobox value={value} onValueChange={setValue}>
  <ComboboxTrigger placeholder="Categoria">
    {CATEGORIAS.find((c) => c.value === value)?.label}
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxInput />
    <ComboboxList>
      <ComboboxEmpty />
      <ComboboxGroup>
        {CATEGORIAS.map((c) => (
          <ComboboxItem key={c.value} value={c.value}>{c.label}</ComboboxItem>
        ))}
      </ComboboxGroup>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
        previewClassName="items-stretch"
      >
        <ComboboxDemo />
      </DocSection>

      <DocNote title="Este não é o do registry">
        A versão do registry para o estilo <code>radix-nova</code>{" "}
        vem sobre Base
        UI, e trazê-la adicionaria uma segunda biblioteca de primitivos por causa
        de um componente só — os outros 30 daqui são todos Radix. Este é o mesmo
        componente montado sobre <code>Command</code> (cmdk) e{" "}
        <code>Popover</code>, que já existiam.
      </DocNote>

      <DocNote title="Não confundir com FormPickerPopover">
        Aquele é só o posicionamento de um popover ancorado num campo: largura
        igual à do gatilho, folga de colisão, foco que não pula. Este resolve
        busca, navegação por teclado e a semântica de listbox. Os dois se
        compõem, mas não se substituem.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "value", type: "string", description: "O valor selecionado, controlado." },
          { prop: "onValueChange", type: "(value: string) => void", description: "Chamado ao escolher. Fecha o popover sozinho." },
          { prop: "open / onOpenChange", type: "boolean / (open) => void", description: "Estado do popover, se precisar controlá-lo." },
        ]}
      />
    </>
  )
}

function ComboboxDemo() {
  const [value, setValue] = React.useState("")
  const selecionada = CATEGORIAS.find((c) => c.value === value)

  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <Label htmlFor="ds-combobox">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger id="ds-combobox" placeholder="Escolher categoria">
          {selecionada?.label}
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoria…" />
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <ComboboxGroup>
              {CATEGORIAS.map((c) => (
                <ComboboxItem key={c.value} value={c.value}>
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
