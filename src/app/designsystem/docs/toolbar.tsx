"use client"

import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Toolbar, ToolbarActions, ToolbarSearch } from "@/components/ui/toolbar"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function ToolbarDoc() {
  return (
    <>
      <Usage>
        A linha entre o título e a lista: busca e filtros de um lado, ações do
        outro. Existe porque esse bloco já era desenhado à mão em transações,
        faturas e membros, com um espaçamento diferente em cada.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Toolbar>
  <ToolbarSearch>
    <InputGroup>…</InputGroup>
    <Button variant="outline"><FilterIcon />Filtros</Button>
  </ToolbarSearch>
  <ToolbarActions>
    <Button><PlusIcon />Nova</Button>
  </ToolbarActions>
</Toolbar>`}
        previewClassName="items-stretch"
      >
        <Toolbar className="w-full">
          <ToolbarSearch>
            <InputGroup className="max-w-xs">
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput placeholder="Buscar" aria-label="Buscar" />
            </InputGroup>
            <Button variant="outline">
              <FilterIcon aria-hidden />
              Filtros
              <Badge size="xs" variant="secondary">
                2
              </Badge>
            </Button>
          </ToolbarSearch>
          <ToolbarActions>
            <Button>
              <PlusIcon aria-hidden />
              Nova transação
            </Button>
          </ToolbarActions>
        </Toolbar>
      </DocSection>

      <DocNote title="Quebra em linhas, não encolhe">
        No telefone os itens vão para a linha de baixo. Um filtro espremido em
        80px não é filtro: o rótulo trunca e a pessoa deixa de saber o que aquilo
        faz. <code>ToolbarActions</code> nunca encolhe;{" "}
        <code>ToolbarSearch</code> cresce e encolhe com o espaço.
      </DocNote>
    </>
  )
}
