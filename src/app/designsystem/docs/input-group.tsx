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
        Um campo com algo acoplado: ícone, unidade, botão. O conjunto se comporta como um controle só — o foco desenha o anel em volta do grupo inteiro. Para dinheiro, use <code>Input money</code>; rótulo e erro vêm do <code>Field</code>.
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
        title="Tamanhos"
        description="A escada do Input e do Button: 28, 32, 36 e 40. O degrau desce para dentro — o botão acoplado desce um degrau sozinho, sem repetir size."
        code={`<InputGroup size="lg">
  <InputGroupInput placeholder="Buscar" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton>Buscar</InputGroupButton>
  </InputGroupAddon>
</InputGroup>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <div key={size} className="flex w-full max-w-sm items-center gap-3">
            <code className="w-8 shrink-0 font-mono text-2xs text-muted-foreground">
              {size}
            </code>
            <InputGroup size={size}>
              <InputGroupAddon>
                <MagnifyingGlassIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Buscar transação"
                aria-label={`Buscar (${size})`}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton>Buscar</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        ))}
      </DocSection>

      <DocNote title="O grupo alinha com o campo ao lado pelo nome do degrau">
        <code>InputGroup</code>, <code>Input</code>, <code>SelectTrigger</code>, <code>NativeSelect</code> e <code>Button</code> usam os mesmos quatro nomes para as mesmas alturas; numa barra de filtros, trocar o degrau move todos juntos.
      </DocNote>

      <DocSection
        title="Acoplado acima e abaixo"
        description="block-start entra acima do controle e block-end abaixo, na largura toda. Para o que acompanha o campo sem disputar a linha: uma contagem, uma barra de ação."
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

      <DocNote title="Para valor em reais, use Input money">
        O &ldquo;R$&rdquo; acima é exemplo de addon. <code>&lt;Input money&gt;</code> resolve máscara, teclado e conversão; um <code>InputGroup</code> com R$ deixa tudo isso para a tela. Por isso <code>InputGroupInput</code> não aceita <code>money</code>.
      </DocNote>
    </>
  )
}
