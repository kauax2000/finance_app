"use client"

import * as React from "react"
import { EnvelopeIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupPasswordToggle,
  InputGroupSelect,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { SelectItem } from "@/components/ui/select"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

function DemoVerificando() {
  const [verificando, setVerificando] = React.useState(true)
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <InputGroup pending={verificando}>
        <InputGroupAddon>
          <EnvelopeIcon aria-hidden />
        </InputGroupAddon>
        <InputGroupInput defaultValue="ana@exemplo.com" aria-label="E-mail do convite" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>disponível</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <Button variant="tertiary" size="sm" className="self-start" onClick={() => setVerificando((v) => !v)}>
        {verificando ? "terminar a verificação" : "verificar de novo"}
      </Button>
    </div>
  )
}

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
        title="Senha que se mostra"
        description="InputGroupPasswordToggle é o olho no fim do campo. O estado mora no grupo: o InputGroupInput type=&quot;password&quot; vira texto sozinho, o botão marca aria-pressed e o rótulo troca. As quatro telas de senha escreviam as ~22 linhas e um useState por campo."
        code={`<InputGroup size="xl">
  <InputGroupInput type="password" autoComplete="current-password" />
  <InputGroupPasswordToggle />
</InputGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <InputGroup size="xl" className="w-full max-w-sm">
          <InputGroupInput
            type="password"
            defaultValue="finanças-2026"
            aria-label="Senha"
            autoComplete="off"
          />
          <InputGroupPasswordToggle />
        </InputGroup>
      </DocSection>

      <DocSection
        title="Seletor no começo"
        description="InputGroupSelect é o Select do app colado no começo do campo — o DDI de um telefone, a moeda de um valor, o modo (total ou parcela) de uma compra parcelada —, com a emenda na borda de campo, a placa flutuante dos menus e o foco acendendo o grupo inteiro. Precisa de aria-label."
        code={`<InputGroup>
  <InputGroupSelect aria-label="DDI" defaultValue="55">
    <SelectItem value="55">+55</SelectItem>
    <SelectItem value="351">+351</SelectItem>
  </InputGroupSelect>
  <InputGroupInput type="tel" placeholder="(11) 98765-4321" />
</InputGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <InputGroup className="w-full max-w-sm">
          <InputGroupSelect aria-label="DDI" defaultValue="55">
            <SelectItem value="55">+55</SelectItem>
            <SelectItem value="351">+351</SelectItem>
            <SelectItem value="1">+1</SelectItem>
          </InputGroupSelect>
          <InputGroupInput type="tel" placeholder="(11) 98765-4321" aria-label="Telefone" />
        </InputGroup>
      </DocSection>

      <DocSection
        title="Carregando"
        description="pending põe o Spinner na ponta enquanto algo acontece — a busca, a verificação do e-mail — e marca aria-busy no grupo. O addon da ponta sai de cena sem desmontar e volta quando termina."
        code={`<InputGroup pending={verificando}>
  <InputGroupInput />
  <InputGroupAddon align="inline-end">…</InputGroupAddon>
</InputGroup>`}
      >
        <DemoVerificando />
      </DocSection>

      <DocSection
        title="Contador"
        description="maxLength no InputGroupTextarea põe a contagem embaixo, sempre; no InputGroupInput, na ponta, só perto do teto. A régua é a do Textarea: âmbar e anunciada nos últimos 10% ou 20 caracteres. O contador do Textarea embrulharia o campo numa div e o grupo travaria na altura de uma linha — dentro do grupo, a contagem é um addon."
        code={`<InputGroup>
  <InputGroupTextarea maxLength={140} />
</InputGroup>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <InputGroup className="w-full max-w-sm">
          <InputGroupTextarea
            maxLength={140}
            aria-label="Observação"
            defaultValue="Parcela da geladeira: sétima de doze. Juros embutidos no preço à vista, segundo a loja. Conferir no extrato e guardar a nota."
          />
        </InputGroup>
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput
            maxLength={40}
            aria-label="Nome da carteira"
            defaultValue="Casa na praia — despesas divididas"
          />
        </InputGroup>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="A escada do Input e do Button: 28, 32, 36 e 40. O degrau desce para dentro — o botão acoplado desce um degrau sozinho, sem repetir size. Num apontador grosso os três degraus de baixo sobem ao piso de 40."
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
        description="block-start entra acima do controle e block-end abaixo, na largura toda. Para o que acompanha o campo sem disputar a linha: uma dica, uma barra de ação. A contagem não se escreve aqui — ela é o maxLength (acima)."
        code={`<InputGroup>
  <InputGroupTextarea placeholder="Observação" />
  <InputGroupAddon align="block-end">
    <InputGroupText>Enter quebra linha · ⌘Enter envia</InputGroupText>
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
            <InputGroupText>Enter quebra linha · ⌘Enter envia</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </DocSection>

      <DocNote title="Onde o app usa">
        Nos seis campos de senha — login, cadastro, redefinição e os três do diálogo de trocar senha —, todos com o <code>InputGroupPasswordToggle</code> desde a rodada 193. Eles eram o mesmo bloco de ~22 linhas repetido, com um <code>useState</code> por campo. O catálogo usa o grupo no <code>Field</code>, no <code>Textarea</code> e na busca.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "InputGroup · size", type: '"sm" | "md" | "lg" | "xl"', default: '"lg"', description: "A altura, na escada dos campos; o botão acoplado desce um degrau." },
          { prop: "InputGroup · pending", type: "boolean", default: "false", description: "O Spinner na ponta, no lugar do addon, e aria-busy." },
          { prop: "InputGroupInput · maxLength", type: "number", description: "Põe a contagem na ponta, perto do teto." },
          { prop: "InputGroupTextarea · maxLength", type: "number", description: "Põe a contagem embaixo, sempre." },
          { prop: "InputGroupPasswordToggle", type: "{ showLabel?, hideLabel? }", description: "O olho da senha; o type=\"password\" do campo vira texto sozinho." },
          { prop: "InputGroupSelect", type: "select & { aria-label }", description: "O seletor nativo colado no começo." },
        ]}
      />

      <DocNote title="Para valor em reais, use Input money">
        O &ldquo;R$&rdquo; acima é exemplo de addon. <code>&lt;Input money&gt;</code> resolve máscara, teclado e conversão; um <code>InputGroup</code> com R$ deixa tudo isso para a tela. Por isso <code>InputGroupInput</code> não aceita <code>money</code>.
      </DocNote>
    </>
  )
}
