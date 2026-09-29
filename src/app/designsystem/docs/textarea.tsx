"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LONGO =
  "Compra dividida com a Ana: metade no meu cartão, metade no dela.\nA parte dela entra como reembolso em março.\nSe ela pagar antes, ajusto a categoria.\nGuardar a nota fiscal até o fim do ano.\nConferir se a loja cobrou o frete duas vezes."

export default function TextareaDoc() {
  return (
    <>
      <Usage>
        Texto de mais de uma linha: a observação de uma transação, o motivo de um ajuste. Ele cresce com o conteúdo por <code>field-sizing-content</code>. Para uma linha só é o <code>Input</code>; para o rótulo, a ajuda e o erro já ligados, o <code>FormTextarea</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Sem nada, o piso é 64px e o campo cresce sem teto. A alça do navegador não aparece: o campo cresce sozinho."
        code={`<Field>
  <FieldLabel>Observação</FieldLabel>
  <Textarea placeholder="Opcional" />
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="w-full max-w-md">
          <FieldLabel>Observação</FieldLabel>
          <Textarea placeholder="Compra dividida com a Ana, metade dela" />
        </Field>
      </DocSection>

      <DocSection
        title="Altura em linhas"
        description="minRows é o piso e maxRows o teto, em linhas do próprio texto: o campo cresce até o teto e dali rola. rows não serve — com field-sizing-content o navegador o ignora."
        code={`<Textarea minRows={2} maxRows={4} />`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        <Textarea minRows={2} maxRows={4} placeholder="Piso de 2 linhas" aria-label="Piso de 2 linhas" />
        <Textarea minRows={2} maxRows={4} defaultValue={LONGO} aria-label="Teto de 4 linhas" />
      </DocSection>

      <DocSection
        title="Contador"
        description="Com maxLength aparece o contador, embaixo e à direita. Nos últimos 10% (ou 20 caracteres) ele fica âmbar, e o leitor de tela ouve quantos restam — só nessa faixa, para não anunciar cada tecla. showCount={false} o desliga."
        code={`<Textarea maxLength={140} />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <Textarea maxLength={140} placeholder="Até 140 caracteres" aria-label="Contador" />
          <Textarea
            maxLength={140}
            aria-label="Contador perto do limite"
            defaultValue="Parcela da geladeira: sétima de doze. Juros embutidos no preço à vista, segundo a loja. Conferir no extrato de abril e guardar a nota."
          />
        </div>
      </DocSection>

      <DocSection
        title="Com alça"
        description="resize=&quot;vertical&quot; devolve a alça, só na vertical. Arrastada, ela crava uma altura e o campo para de crescer sozinho — por isso não é o padrão."
        code={`<Textarea resize="vertical" />`}
        previewClassName="flex-col items-stretch"
      >
        <Textarea resize="vertical" minRows={3} placeholder="Arraste o canto" aria-label="Com alça" className="max-w-md" />
      </DocSection>

      <DocSection
        title="Dentro de um grupo, o teto dissolve"
        description="No InputGroupTextarea quem pinta a borda e o fundo é o grupo, e o textarea é transparente: aí o maxRows rola dissolvendo nas bordas, com a primitiva do sistema. Num Textarea solto isso não é possível (ver a nota)."
        code={`<InputGroup>
  <InputGroupTextarea maxRows={4} />
  <InputGroupAddon align="block-end">
    <InputGroupText>Enter quebra linha · ⌘Enter envia</InputGroupText>
  </InputGroupAddon>
</InputGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <InputGroup className="w-full max-w-md">
          <InputGroupTextarea maxRows={4} defaultValue={LONGO} aria-label="Observação no grupo" />
          <InputGroupAddon align="block-end">
            <InputGroupText>Enter quebra linha · ⌘Enter envia</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </DocSection>

      <DocSection
        title="Estados"
        code={`<Textarea disabled />
<Textarea aria-invalid />`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        <Textarea placeholder="Desabilitado" disabled aria-label="Desabilitado" />
        <Textarea defaultValue="Texto com erro" aria-invalid aria-label="Com erro" />
      </DocSection>

      <DocNote title="Enter quebra linha; ⌘/Ctrl+Enter envia">
        O <code>Form</code> leva o Enter ao botão de enviar, mas abre exceção para o textarea: dentro de uma observação a tecla quebra a linha. Para enviar sem tirar a mão do teclado, <code>⌘/Ctrl+Enter</code> funciona de dentro dele.
      </DocNote>

      <DocNote title="O teto de um Textarea solto rola, mas não dissolve">
        A dissolução é uma máscara, e a máscara recorta o elemento inteiro — borda e preenchimento junto. O textarea pinta os dois, então ela os apagaria nas pontas. É a invariante da primitiva: o elemento mascarado não desenha nada. No <code>InputGroup</code> quem desenha é o grupo, e ali ela funciona.
      </DocNote>

      <DocNote title="Onde o navegador não cresce o campo">
        <code>field-sizing</code> não existe no Firefox nem no Safari antigo, e lá o campo ficava no piso e rolava. Nesses navegadores — e só neles, perguntado por <code>CSS.supports</code> — a altura acompanha o <code>scrollHeight</code> a cada digitação, com o mesmo teto.
      </DocNote>

      <DocNote title="O size aqui não mede altura">
        O degrau carrega o recuo e, no <code>sm</code>, o corpo do texto, para um <code>FormTextarea</code> ficar ao lado de um <code>FormInput</code> falando o mesmo nome. A altura é do conteúdo, do <code>minRows</code> e do <code>maxRows</code>.
      </DocNote>

      <DocNote title="Onde o app usa">
        Um campo: as observações de uma conta, num <code>FormTextarea</code>. Ele trazia <code>rows={"{3}"}</code>, que o navegador ignorava, e um <code>shadow-xs</code> que nenhum outro campo tem; desde a rodada 180 é <code>minRows={"{3}"}</code> e <code>maxRows={"{8}"}</code>. O <code>InputGroupTextarea</code> também é ele por dentro.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "minRows", type: "number", default: "64px", description: "O piso, em linhas do texto." },
          { prop: "maxRows", type: "number", description: "O teto, em linhas: dali em diante o campo rola." },
          { prop: "maxLength", type: "number", description: "O limite nativo; com ele aparece o contador." },
          { prop: "showCount", type: "boolean", default: "true", description: "Mostra o contador quando há maxLength." },
          { prop: "resize", type: '"none" | "vertical"', default: '"none"', description: "A alça de redimensionar do navegador." },
          { prop: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "O recuo e, no sm, o corpo do texto. Não é altura." },
          { prop: "aria-invalid", type: "boolean", description: "Pinta a borda e o anel de destructive." },
        ]}
      />
    </>
  )
}
