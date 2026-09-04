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
        Mensagem que fica na tela porque é sobre <strong>o conteúdo dela</strong>
        . Confirmação do que acabou de acontecer é <code>toast</code>; aviso
        sobre o app inteiro é <code>AnnouncementBar</code>. Três eixos, e eles
        não se misturam: <code>tone</code> é a cor, <code>variant</code> é a
        forma, <code>size</code> é o corpo.
      </Usage>

      <DocSection
        title="Tom"
        description="Cinco tons, todos tonais e nunca sólidos — o alerta explica, não interrompe. E o tom chega ao texto: título e descrição são dois níveis de uma tinta só, em vez de branco e cinza sobre uma superfície colorida. O default é o único com descrição cinza, porque ali a superfície é neutra."
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
        description="soft tem moldura própria e é o padrão: o aviso solto no conteúdo precisa de uma aresta que o separe do que vem antes. plain é o mesmo tingido sem borda, para dentro de um formulário ou de um diálogo — onde a moldura já é de outro, e mais uma só acrescenta um retângulo à pilha. Quatro formulários de autenticação do app já desenhavam essa forma à mão."
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
        description="Dois degraus. md é o aviso que fala com a tela. sm é o aviso que fala com um campo: dentro de um formulário, sob um controle, colado ao que explica. Ele encolhe o texto, o respiro e o ícone juntos — e o ícone encolhe porque a largura da coluna e o corpo do svg saem da mesma variável."
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
        description="Quando o aviso tem saída, ela fica em AlertActions, no pé e alinhada ao texto. O botão é tertiary e não declara cor nenhuma: a pele sai de currentColor, então serve os cinco tons sem nomear nenhum, e o par active: que o toque exige vem junto. É o que o dashboard escrevia à mão em cinco classes que só valiam para destructive."
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
        description="O ícone é opcional, e a grade sabe disso: sem svg o alerta é de uma coluna só, e o texto começa na borda do respiro em vez de num recuo que não tem dono."
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
              "A cor do aviso, e ela pinta superfície, borda, ícone e texto. Todos tonais, nunca sólidos. Era variant, e o nome mudou para o mesmo que StatCard, Progress, Timeline e AnnouncementBar já usavam.",
          },
          {
            prop: "variant",
            type: '"soft" | "plain"',
            default: '"soft"',
            description:
              "A forma. soft tem moldura própria; plain é o tingido sem borda, para dentro de algo que já tem moldura.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "O corpo. sm encolhe texto, respiro e ícone juntos — é o aviso que fala com um campo, não com a tela.",
          },
          {
            prop: "role",
            type: '"alert" | "status" | string',
            default: "derivado do tom",
            description:
              "destructive e warning saem como alert (região viva assertiva, que interrompe o leitor de tela); o resto sai como status. Sobrescrevível.",
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
              "O resumo — a linha que o olho lê para decidir se continua, e a primeira que o leitor de tela anuncia.",
          },
          {
            prop: "AlertDescription",
            type: "div",
            description:
              "O detalhe, na tinta do alerta a 85%. No tom default é cinza, porque ali a superfície é neutra.",
          },
          {
            prop: "AlertActions",
            type: "div",
            description:
              "A linha da saída, no pé e alinhada ao texto. Só a linha — quem veste o botão é o AlertAction.",
          },
          {
            prop: "AlertAction",
            type: "Button",
            description:
              "A ação. É um Button tertiary size=\"sm\" que herda a tinta do tom por currentColor. Aceita asChild para virar link.",
          },
        ]}
      />

      <DocNote title="Título sem descrição é permitido; descrição sem título não">
        Um alerta de uma linha só precisa do <code>AlertTitle</code>. Já uma
        descrição solta perde o resumo que faz o olho decidir se vale ler — e é
        o resumo que o leitor de tela anuncia primeiro. Ela também é a tinta
        secundária do par, e uma linha secundária sozinha não tem a que ser
        secundária.
      </DocNote>

      <DocNote title="A ação não declara cor, e agora não precisa lembrar disso">
        <code>AlertAction</code> é um <code>Button</code>{" "}
        <code>tertiary</code> <code>size=&quot;sm&quot;</code>: a borda, a tinta
        e o realce saem de <code>currentColor</code>, que é a cor do próprio
        alerta — então a mesma linha serve os cinco tons, e trocar o tom do
        aviso troca o botão junto. Escrever <code>border-destructive/40</code>
        ali é reimportar a paleta para dentro da tela.
        <br />
        <br />
        <strong>Ele é uma peça porque antes era um pedido.</strong>{" "}
        <code>AlertActions</code> alcançava o botão por <em>seletor
        descendente</em> — cinco regras <code>[&amp;_[data-slot=button]]:</code>{" "}
        — e esta nota mandava quem chamasse escrever <code>tertiary</code> à
        mão. As <strong>seis</strong> chamadas escreviam a mesma string, o que é
        o sinal de sempre: quando o catálogo escreve a anatomia, falta uma peça.
        E faltava a de baixo — <code>alert.tsx</code> importava{" "}
        <strong>zero</strong> componentes e se dizia molécula.
      </DocNote>

      <DocNote title="Alert, AnnouncementBar e toast não se substituem">
        <code>Alert</code> fica <strong>dentro</strong> do conteúdo e fala de
        uma coisa daquela tela. <code>AnnouncementBar</code> atravessa o topo do
        app e fala de estado global — offline, convite pendente, manutenção —, e
        é dispensável, porque aviso permanente que não se fecha vira ruído em
        uma semana. <code>toast</code> confirma o que acabou de acontecer e vai
        embora sozinho. Um <code>Alert</code> fixado no topo da janela com{" "}
        <code>rounded-none border-x-0</code> é uma <code>AnnouncementBar</code>{" "}
        escrita com o componente errado.
      </DocNote>
    </>
  )
}
