"use client"

import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function InputGroupDoc() {
  return (
    <>
      <Usage>
        Um campo com algo acoplado: um ícone de busca, uma unidade, um botão de
        ação. O conjunto se comporta como um controle só — o foco desenha o anel
        em volta do grupo inteiro, não do <code>&lt;input&gt;</code>{" "}
        escondido lá
        dentro.
      </Usage>

      <DocSection
        title="Com ícone"
        code={`<InputGroup>
  <InputGroupAddon><SearchIcon aria-hidden /></InputGroupAddon>
  <InputGroupInput placeholder="Buscar transação" />
</InputGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput placeholder="Buscar transação" aria-label="Buscar" />
        </InputGroup>
      </DocSection>

      <DocSection
        title="Com texto e com botão"
        code={`<InputGroup>
  <InputGroupAddon><InputGroupText>R$</InputGroupText></InputGroupAddon>
  <InputGroupInput inputMode="decimal" />
</InputGroup>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <InputGroupText>R$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            inputMode="decimal"
            placeholder="0,00"
            aria-label="Valor"
          />
        </InputGroup>
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput placeholder="Convidar por e-mail" aria-label="E-mail" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>Convidar</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </DocSection>

      <DocNote title="Para valor em reais, prefira MoneyInput">
        O prefixo &ldquo;R$&rdquo; acima é um exemplo de addon, não a forma de
        pedir dinheiro neste app. <code>MoneyInput</code>{" "}
        resolve máscara,
        teclado e conversão; um <code>InputGroup</code>{" "}
        com R$ na frente deixa
        tudo isso para a tela.
      </DocNote>
    </>
  )
}
