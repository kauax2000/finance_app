"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SelectDoc() {
  return (
    <>
      <Usage>
        Poucas opções conhecidas, sem busca. Passando de umas dez, o componente é o <code>Combobox</code>.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Select>
  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="mercado">Mercado</SelectItem>
  </SelectContent>
</Select>`}
      >
        <Select>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mercado">Mercado</SelectItem>
            <SelectItem value="transporte">Transporte</SelectItem>
            <SelectItem value="lazer">Lazer</SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Tamanhos e grupos"
        description="Os tamanhos batem com os do Input e do Button. Grupos com rótulo servem quando as opções vêm de origens diferentes — despesa e receita, por exemplo."
        code={`<SelectTrigger size="sm">…</SelectTrigger>
<SelectGroup>
  <SelectLabel>Despesa</SelectLabel>
  <SelectItem value="mercado">Mercado</SelectItem>
</SelectGroup>`}
      >
        <Select>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="sm" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Despesa</SelectLabel>
              <SelectItem value="mercado">Mercado</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Receita</SelectLabel>
              <SelectItem value="salario">Salário</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Desabilitado" />
          </SelectTrigger>
          <SelectContent />
        </Select>
      </DocSection>

      <DocNote title="O Enter não é do formulário aqui">
        Sobre um gatilho de Select o Enter abre e escolhe, em vez de enviar. O <code>shouldDeferEnterToWidget</code> reconhece isso pelo <code>data-slot=&quot;select-trigger&quot;</code>.
      </DocNote>
    </>
  )
}
