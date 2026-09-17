"use client"

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid"

import {
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function AlertDoc() {
  return (
    <>
      <Usage>
          Mensagem que fica na tela porque é sobre <strong>o conteúdo dela</strong>. Confirmação do que acabou de acontecer é <code>toast</code>; aviso sobre o app inteiro é <code>AnnouncementBar</code>. Três eixos que não se misturam: <code>tone</code> é a cor, <code>variant</code> a forma, <code>size</code> o corpo.
      </Usage>

      <DocSection
        title="Tom"
        description="Cinco tons, tonais e nunca sólidos — o alerta explica, não interrompe. Título e descrição levam a tinta do tom; só o default tem descrição cinza, porque a superfície é neutra."
        code={`<Alert tone="warning">
  <ExclamationTriangleIcon />
  <AlertTitle>Orçamento perto do limite</AlertTitle>
  <AlertDescription>Mercado está em 88%.</AlertDescription>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert>
          <InformationCircleIcon />
          <AlertTitle>Padrão</AlertTitle>
          <AlertDescription>
            Sem cor: o aviso é neutro e não pede ação.
          </AlertDescription>
        </Alert>
        <Alert tone="info">
          <InformationCircleIcon />
          <AlertTitle>Parcelas futuras não entram</AlertTitle>
          <AlertDescription>
            O total considera só o que já foi lançado neste mês.
          </AlertDescription>
        </Alert>
        <Alert tone="success">
          <CheckCircleIcon />
          <AlertTitle>Fatura paga</AlertTitle>
          <AlertDescription>Registrada em 05/04.</AlertDescription>
        </Alert>
        <Alert tone="warning">
          <ExclamationTriangleIcon />
          <AlertTitle>Orçamento perto do limite</AlertTitle>
          <AlertDescription>
            Mercado está em 88% com 9 dias restantes.
          </AlertDescription>
        </Alert>
        <Alert tone="destructive">
          <XCircleIcon />
          <AlertTitle>Não foi possível sincronizar</AlertTitle>
          <AlertDescription>
            As alterações ficaram salvas no aparelho e sobem quando a conexão
            voltar.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocSection
        title="Forma"
        description="soft, o padrão, tem moldura para se separar do conteúdo. plain é o mesmo tingido sem borda, para dentro de formulário ou diálogo, onde a moldura já é de outro."
        code={`<Alert tone="success">…</Alert>                  {/* soft */}
<Alert tone="success" variant="plain">…</Alert>`}
        previewClassName="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"
      >
        {(
          [
            ["soft", "Duas molduras para um bloco." ],
            ["plain", "Uma moldura, a do formulário."],
          ] as const
        ).map(([variant, hint]) => (
          <div key={variant} className="flex flex-col gap-2">
            <p className="font-mono text-xs text-muted-foreground">
              variant=&quot;{variant}&quot;
            </p>
            {/* A moldura de mentira é o ponto da seção: `plain` não se explica
                sozinho no meio da página — ele só faz sentido dentro de algo
                que já tem borda, e é aí que a borda a mais aparece como borda a
                mais. */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-col gap-2">
                <div className="h-8 rounded-lg border border-input bg-input-fill/30" />
                <Alert tone="success" variant={variant} size="sm">
                  <CheckCircleIcon />
                  <AlertTitle>Senha atualizada</AlertTitle>
                </Alert>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Corpo"
        description="md fala com a tela; sm fala com um campo, colado ao controle que explica. O degrau encolhe texto, respiro e ícone juntos."
        code={`<Alert tone="info">…</Alert>            {/* md */}
<Alert tone="info" size="sm">…</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="info">
          <InformationCircleIcon />
          <AlertTitle>O dia de fechamento não é o de vencimento</AlertTitle>
          <AlertDescription>
            Compras após o fechamento entram na fatura seguinte.
          </AlertDescription>
        </Alert>
        <Alert tone="info" size="sm">
          <InformationCircleIcon />
          <AlertTitle>O dia de fechamento não é o de vencimento</AlertTitle>
          <AlertDescription>
            Compras após o fechamento entram na fatura seguinte.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocSection
        title="Com ação"
        description="A saída fica em AlertActions, no pé e alinhada ao texto. AlertAction não declara cor: sai de currentColor e serve os cinco tons."
        code={`<Alert tone="destructive">
  <XCircleIcon />
  <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
  <AlertDescription>A conexão caiu no meio do carregamento.</AlertDescription>
  <AlertActions>
    <AlertAction>
      <ArrowPathIcon aria-hidden />
      Tentar novamente
    </AlertAction>
  </AlertActions>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="destructive">
          <XCircleIcon />
          <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
          <AlertDescription>
            A conexão caiu no meio do carregamento.
          </AlertDescription>
          <AlertActions>
            <AlertAction>
              <ArrowPathIcon aria-hidden />
              Tentar novamente
            </AlertAction>
          </AlertActions>
        </Alert>
        <Alert tone="warning">
          <ExclamationTriangleIcon />
          <AlertTitle>Orçamento de Mercado em 88%</AlertTitle>
          <AlertDescription>
            Faltam 9 dias para o mês virar.
          </AlertDescription>
          <AlertActions>
            <AlertAction>Revisar orçamento</AlertAction>
            <AlertAction>Ver gastos</AlertAction>
          </AlertActions>
        </Alert>
      </DocSection>

      <DocSection
        title="Sem ícone"
        description="O ícone é opcional: sem svg o alerta é de uma coluna só, e o texto começa na borda do respiro."
        code={`<Alert tone="info">
  <AlertTitle>Sem ícone</AlertTitle>
  <AlertDescription>…</AlertDescription>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="info">
          <AlertTitle>Modo de leitura</AlertTitle>
          <AlertDescription>
            Você entrou por um convite de visualização e não pode editar.
          </AlertDescription>
        </Alert>
        <Alert tone="info" size="sm">
          <AlertTitle>Uma linha só não precisa de descrição.</AlertTitle>
        </Alert>
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"default" | "info" | "success" | "warning" | "destructive"',
            default: '"default"',
            description:
              "A cor: pinta superfície, borda, ícone e texto, sempre tonal.",
          },
          {
            prop: "variant",
            type: '"soft" | "plain"',
            default: '"soft"',
            description:
              "A forma: soft com moldura; plain sem borda, para dentro de algo que já tem moldura.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "O corpo; sm é o aviso que fala com um campo.",
          },
          {
            prop: "role",
            type: '"alert" | "status" | string',
            default: "derivado do tom",
            description:
              "destructive e warning saem como alert (assertivo); o resto, status.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "AlertTitle",
            type: "div",
            description:
              "O resumo, a primeira linha que o leitor de tela anuncia.",
          },
          {
            prop: "AlertDescription",
            type: "div",
            description:
              "O detalhe, na tinta do alerta a 85%.",
          },
          {
            prop: "AlertActions",
            type: "div",
            description:
              "A linha da saída, no pé e alinhada ao texto.",
          },
          {
            prop: "AlertAction",
            type: "Button",
            description:
              "A ação: Button tertiary que herda a tinta do tom; aceita asChild.",
          },
        ]}
      />

      <DocNote title="Título sem descrição é permitido; descrição sem título não">
          O título é o resumo que faz o olho decidir se vale ler, e o que o leitor de tela anuncia primeiro. Uma descrição solta perde esse resumo.
      </DocNote>

      <DocNote title="Use AlertAction, e não pinte o botão">
          <code>AlertAction</code> é um <code>Button</code> <code>tertiary</code> <code>size=&quot;sm&quot;</code> cuja borda, tinta e realce saem de <code>currentColor</code>: trocar o tom do aviso troca o botão junto. Escrever <code>border-destructive/40</code> ali é reimportar a paleta para dentro da tela.
      </DocNote>

      <DocNote title="Alert, AnnouncementBar e toast não se substituem">
          <code>Alert</code> fica dentro do conteúdo e fala daquela tela. <code>AnnouncementBar</code> atravessa o topo e fala de estado global — offline, convite, manutenção —, e é dispensável. <code>toast</code> confirma o que acabou de acontecer e some. Um <code>Alert</code> fixado no topo com <code>rounded-none border-x-0</code> é uma <code>AnnouncementBar</code> escrita com o componente errado.
      </DocNote>
    </>
  )
}
