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
        title="Tamanhos"
        description="A mesma escada do Input e do Button: 28, 32, 36 e 40. O degrau desce para dentro — o campo pega o corpo de texto dele e o botão acoplado desce um degrau sozinho, então ninguém escreve size duas vezes."
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

      <DocNote title="O grupo alinha com o campo ao lado sem ninguém dizer altura">
        <code>InputGroup</code>, <code>Input</code>, <code>SelectTrigger</code>,{" "}
        <code>NativeSelect</code> e <code>Button</code>{" "}
        usam os mesmos quatro nomes para as mesmas quatro alturas. Numa barra de
        filtros, trocar o degrau move todos pelo mesmo nome — antes o grupo era
        preso a 32 e a linha saía torta quando o vizinho era <code>lg</code>.
      </DocNote>

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

      <DocNote title="Para valor em reais, o modo é <Input money>">
        O prefixo &ldquo;R$&rdquo; acima é um exemplo de addon, não a forma de
        pedir dinheiro neste app. <code>&lt;Input money&gt;</code>{" "}
        resolve máscara,
        teclado e conversão; um <code>InputGroup</code>{" "}
        com R$ na frente deixa
        tudo isso para a tela.
        <br />
        <br />
        E <code>InputGroupInput</code> é fixado no <strong>ramo base</strong> da
        união (<code>InputBaseProps</code>), então <code>money</code> não passa
        por aqui: a moldura existe para addon, e o campo de dinheiro se pede
        direto.
      </DocNote>
    </>
  )
}
