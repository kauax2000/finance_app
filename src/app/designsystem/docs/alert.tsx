"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XCircleIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function AlertDoc() {
  return (
    <>
      <Usage>
        Uma mensagem que fica na tela porque é sobre <strong>o conteúdo dela</strong>:
        &ldquo;esta fatura já foi fechada&rdquo;, &ldquo;faltam dados para o
        cálculo&rdquo;. Confirmação de uma ação que acabou de acontecer é{" "}
        <code>toast</code>; aviso sobre o app inteiro é{" "}
        <code>AnnouncementBar</code>.
      </Usage>

      <DocSection
        title="Variantes"
        code={`<Alert variant="info">
  <InfoIcon />
  <AlertTitle>Título</AlertTitle>
  <AlertDescription>Explicação.</AlertDescription>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert>
          <InfoIcon />
          <AlertTitle>Padrão</AlertTitle>
          <AlertDescription>
            Sem cor: o aviso é neutro e não pede ação.
          </AlertDescription>
        </Alert>
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Parcelas futuras não entram</AlertTitle>
          <AlertDescription>
            O total considera só o que já foi lançado neste mês.
          </AlertDescription>
        </Alert>
        <Alert variant="success">
          <CheckCircle2Icon />
          <AlertTitle>Fatura paga</AlertTitle>
          <AlertDescription>Registrada em 05/04.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertTitle>Orçamento perto do limite</AlertTitle>
          <AlertDescription>
            Mercado está em 88% com 9 dias restantes.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <XCircleIcon />
          <AlertTitle>Não foi possível sincronizar</AlertTitle>
          <AlertDescription>
            As alterações ficaram salvas no aparelho e sobem quando a conexão
            voltar.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocNote title="Título sem descrição é permitido; descrição sem título não">
        Um alerta de uma linha só precisa do <code>AlertTitle</code>. Já uma
        descrição solta perde o resumo que faz o olho decidir se vale ler —
        e é o resumo que o leitor de tela anuncia primeiro.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"default" | "info" | "success" | "warning" | "destructive"',
            default: '"default"',
            description: "O tom do aviso. Todos tonais, nunca sólidos.",
          },
        ]}
      />
    </>
  )
}
