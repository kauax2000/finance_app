"use client"

import { MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function InputGroupDoc() {
  return (
    <>
      <Usage>
        Um campo com algo acoplado: ícone, unidade, botão. O conjunto se comporta como um controle só — o foco desenha o anel em volta do grupo inteiro.
      </Usage>

      <DocSection
        title="Com ícone"
        code={`<InputGroup>
  <InputGroupAddon><MagnifyingGlassIcon aria-hidden /></InputGroupAddon>
  <InputGroupInput placeholder="Buscar transação" />
</InputGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <MagnifyingGlassIcon aria-hidden />
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

      <DocSection
        title="Acoplado acima e abaixo"
        description="align aceita quatro valores, e os dois de bloco ocupam a largura toda: block-start entra acima do controle, block-end abaixo. Servem para o que acompanha o campo sem disputar a linha dele — uma contagem, uma barra de ação sob um textarea."
        code={`<InputGroup>
  <InputGroupTextarea placeholder="Observação" />
  <InputGroupAddon align="block-end">
    <InputGroupText>0/280</InputGroupText>
  </InputGroupAddon>
</InputGroup>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon align="block-start">
            <InputGroupText>Aparece no extrato</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="Mercado" aria-label="Descrição" />
        </InputGroup>
        <InputGroup className="w-full max-w-sm">
          <InputGroupTextarea
            placeholder="Observação da transação"
            aria-label="Observação"
          />
          <InputGroupAddon align="block-end">
            <InputGroupText>0/280</InputGroupText>
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
