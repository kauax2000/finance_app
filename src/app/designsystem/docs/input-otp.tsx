"use client"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function InputOtpDoc() {
  return (
    <>
      <Usage>
        Código de verificação de poucos dígitos: confirmação de e-mail, segundo
        fator. Aceita colar o código inteiro de uma vez, que é como a pessoa
        recebe do SMS ou do gerenciador de senhas.
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
        <InputOTP maxLength={6} aria-label="Código de verificação">
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

      <DocNote title="Ele espera dígitos, e o teclado precisa saber disso">
        Sem <code>inputMode=&quot;numeric&quot;</code> e{" "}
        <code>autoComplete=&quot;one-time-code&quot;</code>, o telefone abre o
        teclado de texto e o iOS não oferece o preenchimento automático do código
        que acabou de chegar por SMS.
      </DocNote>
    </>
  )
}
