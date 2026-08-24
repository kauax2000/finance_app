"use client"

import { MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function DropdownMenuDoc() {
  return (
    <>
      <Usage>
        Ações sobre um item específico. Se as opções <em>selecionam</em> um valor
        em vez de agir, o componente é <code>Select</code> ou{" "}
        <code>Combobox</code>: um menu não guarda o que foi escolhido.
      </Usage>

      <DocSection
        title="Menu de item"
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Ações da transação">
      <MoreHorizontalIcon aria-hidden />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ações da transação">
              <MoreHorizontalIcon aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Transação</DropdownMenuLabel>
            <DropdownMenuItem>
              Editar
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Conta corrente</DropdownMenuItem>
                <DropdownMenuItem>Poupança</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DocSection>

      <DocSection
        title="Com estado"
        description="Checkbox para várias opções independentes, radio para uma escolha entre alternativas. O menu fica aberto ao marcar um checkbox e fecha ao escolher um radio."
        code={`<DropdownMenuCheckboxItem checked>Mostrar canceladas</DropdownMenuCheckboxItem>
<DropdownMenuRadioGroup value="data">
  <DropdownMenuRadioItem value="data">Data</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Exibição</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked>
              Transações canceladas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Parcelas futuras</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuRadioGroup value="data">
              <DropdownMenuRadioItem value="data">Data</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="valor">Valor</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </DocSection>

      <DocNote title="O gatilho de três pontos precisa de rótulo">
        <code>aria-label=&quot;Ações da transação&quot;</code>, não
        &ldquo;Menu&rdquo;. Numa lista de vinte linhas, vinte botões chamados
        &ldquo;Menu&rdquo; são indistinguíveis para quem navega por lista de
        controles.
      </DocNote>
    </>
  )
}
