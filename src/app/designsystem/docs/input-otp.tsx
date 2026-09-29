"use client"

import { REGEXP_ONLY_DIGITS } from "input-otp"

import { Code } from "@/components/ui/code"
import { Field, FieldControl, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function InputOtpDoc() {
  return (
    <>
      <Usage>
        Código de verificação de poucos dígitos. Aceita colar o código inteiro de uma vez, que é como a pessoa recebe do e-mail, do SMS ou do gerenciador de senhas. O campo real é um <code>input</code> só; as casas são desenho.
      </Usage>

      <DocSection
        title="Seis dígitos"
        code={`<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    …
  </InputOTPGroup>
</InputOTP>`}
        previewClassName="flex-col items-start"
      >
        <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} aria-label="Código de verificação">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="A escada do projeto: 28, 32, 36 e 40. O degrau move casa, dígito, cursor e traço de uma vez."
        code={`<InputOTP maxLength={6} size="lg">…</InputOTP>`}
        previewClassName="flex-col items-start gap-4"
      >
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <div key={size} className="flex items-center gap-4">
            <Code className="w-8 shrink-0 text-center">{size}</Code>
            <InputOTP
              maxLength={6}
              size={size}
              aria-label={`Código de verificação (${size})`}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Com erro"
        description="Dentro de um Field com erro, o FieldControl marca o campo inválido, e as casas e o grupo pintam de destructive. O erro desce por contexto, e não por seletor: o input fica fora dos grupos no DOM."
        code={`<Field invalid>
  <FieldLabel>Código</FieldLabel>
  <FieldControl>
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS}>…</InputOTP>
  </FieldControl>
  <FieldError>Código inválido ou expirado.</FieldError>
</Field>`}
        previewClassName="flex-col items-start"
      >
        <Field invalid>
          <FieldLabel>Código</FieldLabel>
          <FieldControl>
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} defaultValue="1234">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </FieldControl>
          <FieldError>Código inválido ou expirado.</FieldError>
        </Field>
      </DocSection>

      <DocNote title="O erro desce por contexto, e já não aparecia">
        O <code>aria-invalid</code> cai no <code>input</code>, que é irmão dos grupos, e as classes <code>has-aria-invalid</code> e <code>aria-invalid:</code> que o componente tinha nunca casavam: o campo marcado inválido continuava cinza, medido. Desde a rodada 163 o <code>InputOTP</code> lê o <code>aria-invalid</code> e o passa às casas por contexto, como já passava o <code>size</code>.
      </DocNote>

      <DocNote title="No telefone o alvo cresce, o desenho não">
        O campo real é um input só, esticado sobre o contêiner: o alvo é o retângulo, não cada casa. Em ponteiro grosso o contêiner vai a 44px e as casas ficam na altura do degrau, centradas.
      </DocNote>

      <DocNote title="Os dígitos são tabulares">
        Sem largura fixa, cada casa centra o glifo num ponto diferente e a fileira treme enquanto se digita.
      </DocNote>

      <DocNote title="O teclado e o preenchimento vêm de fábrica; os dígitos, não">
        A biblioteca já declara <code>inputMode=&quot;numeric&quot;</code> e <code>autoComplete=&quot;one-time-code&quot;</code>: o telefone abre o teclado de números e o iOS oferece o código que chegou. O que ela <strong>não</strong> faz é restringir a dígitos — sem <code>pattern</code>, uma letra digitada no teclado físico entra na casa. Passe <code>pattern={"{"}REGEXP_ONLY_DIGITS{"}"}</code>, exportado de <code>input-otp</code>.
      </DocNote>

      <DocNote title="O anel da casa ativa é o do campo">
        <code>ring-3</code> de <code>--ring</code> a 30%, o mesmo dos controles de campo desde a rodada 162 — mais suave a pedido do dono, e abaixo dos 3:1 da WCAG por decisão registrada.
      </DocNote>

      <DocNote title="Onde o app usa">
        Na recuperação de senha, com seis casas num grupo só, no degrau <code>xl</code> e dentro de um <code>FieldControl</code> — o caso em que o erro não aparecia.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "28, 32, 36 e 40. Move casa, dígito, cursor e traço juntos.",
          },
          {
            prop: "maxLength",
            type: "number",
            description: "Quantas casas o código tem. Obrigatório, da biblioteca.",
          },
          {
            prop: "pattern",
            type: "string",
            description: "O que cada tecla pode ser. Sem ele, qualquer caractere: passe REGEXP_ONLY_DIGITS para código numérico.",
          },
          {
            prop: "aria-invalid",
            type: "boolean",
            description: "Pinta as casas e o grupo de destructive. O FieldControl o escreve sozinho.",
          },
          {
            prop: "InputOTPSlot · index",
            type: "number",
            description: "A posição da casa no código, a partir de 0.",
          },
        ]}
      />
    </>
  )
}
