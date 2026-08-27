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
        Código de verificação de poucos dígitos. Aceita colar o código inteiro de uma vez, que é como a pessoa recebe do SMS ou do gerenciador de senhas.
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

      <DocSection
        title="Tamanhos"
        description="A escada do projeto, com os mesmos nomes e as mesmas alturas: 28, 32, 36 e 40. O degrau move a casa, o corpo do dígito, o cursor e o traço entre os blocos de uma vez."
        code={`<InputOTP maxLength={6} size="lg">…</InputOTP>`}
        previewClassName="flex-col items-start gap-4"
      >
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <div key={size} className="flex items-center gap-4">
            <code className="w-8 shrink-0 font-mono text-2xs text-muted-foreground">
              {size}
            </code>
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

      <DocNote title="No telefone o alvo cresce, o desenho não">
        O campo real é um <code>&lt;input&gt;</code>{" "}
        só, esticado por cima do contêiner inteiro — o alvo de toque é o
        retângulo, não cada casa. A 32px ele fica 12px abaixo do piso de{" "}
        <strong>Mobile e toque</strong>, e mesmo o degrau <code>xl</code>{" "}
        para em 40. Em ponteiro grosso o contêiner vai a 44 e as casas
        continuam na altura do degrau, centradas na faixa.
      </DocNote>

      <DocNote title="Os dígitos são tabulares">
        Sem figuras de largura fixa o &ldquo;1&rdquo; é mais estreito que o
        &ldquo;8&rdquo;, e cada casa centra o próprio glifo num ponto
        ligeiramente diferente. A 32px passa despercebido; a 40 a fileira treme
        enquanto se digita.
      </DocNote>

      <DocNote title="Ele espera dígitos, e o teclado precisa saber disso">
        Sem <code>inputMode=&quot;numeric&quot;</code> e{" "}
        <code>autoComplete=&quot;one-time-code&quot;</code>, o telefone abre o
        teclado de texto e o iOS não oferece o preenchimento automático do código
        que acabou de chegar por SMS.
      </DocNote>
    </>
  )
}
