"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowPathIcon, LockClosedIcon } from "@heroicons/react/16/solid"

import {
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

function DemoDispensar() {
  const [aberto, setAberto] = React.useState(true)
  return aberto ? (
    <Alert tone="info" onDismiss={() => setAberto(false)}>
      <AlertTitle>Parcelas futuras não entram no total</AlertTitle>
      <AlertDescription>
        O total considera só o que já foi lançado neste mês.
      </AlertDescription>
    </Alert>
  ) : (
    <Button variant="tertiary" size="sm" onClick={() => setAberto(true)}>
      mostrar o aviso de novo
    </Button>
  )
}

function DemoEntrada() {
  const [erro, setErro] = React.useState(false)
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setErro((v) => !v)}>
        {erro ? "limpar o erro" : "entrar com a senha errada"}
      </Button>
      {erro ? (
        <Alert tone="destructive">
          <AlertTitle>E-mail ou senha incorretos.</AlertTitle>
        </Alert>
      ) : null}
    </div>
  )
}

export default function AlertDoc() {
  return (
    <>
      <Usage>
          Mensagem que fica na tela porque é sobre <strong>o conteúdo dela</strong>. Confirmação do que acabou de acontecer é <code>toast</code>; aviso sobre o app inteiro é <code>AnnouncementBar</code>. Três eixos que não se misturam: <code>tone</code> é a cor (e o ícone), <code>variant</code> a forma, <code>size</code> o corpo. Quando quem fala é o produto e não o dado, a forma é <code>brand</code>.
      </Usage>

      <DocSection
        title="Tom"
        description="Cinco tons, tonais e nunca sólidos — o alerta explica, não interrompe. Cada tom traz o seu ícone, e título e descrição levam a tinta dele; o default não tem ícone e tem a descrição cinza, porque a superfície é neutra."
        code={`<Alert tone="warning">
  <AlertTitle>Orçamento perto do limite</AlertTitle>
  <AlertDescription>Mercado está em 88%.</AlertDescription>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert>
          <AlertTitle>Padrão</AlertTitle>
          <AlertDescription>
            Sem cor: o aviso é neutro e não pede ação.
          </AlertDescription>
        </Alert>
        <Alert tone="info">
          <AlertTitle>Parcelas futuras não entram</AlertTitle>
          <AlertDescription>
            O total considera só o que já foi lançado neste mês.
          </AlertDescription>
        </Alert>
        <Alert tone="success">
          <AlertTitle>Fatura paga</AlertTitle>
          <AlertDescription>Registrada em 05/04.</AlertDescription>
        </Alert>
        <Alert tone="warning">
          <AlertTitle>Orçamento perto do limite</AlertTitle>
          <AlertDescription>
            Mercado está em 88% com 9 dias restantes.
          </AlertDescription>
        </Alert>
        <Alert tone="destructive">
          <AlertTitle>Não foi possível sincronizar</AlertTitle>
          <AlertDescription>
            As alterações ficaram salvas no aparelho e sobem quando a conexão
            voltar.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocSection
        title="O ícone"
        description="O do tom vem sozinho: ⓘ, ✓, ⚠ e o círculo com × — o destrutivo não é o triângulo do warning, senão só a cor separaria atenção de falha. icon troca por outro nó; icon={false} tira, e o texto começa na borda do respiro. Não escreva o svg como filho."
        code={`<Alert tone="info" icon={<LockClosedIcon />}>…</Alert>
<Alert tone="info" icon={false}>…</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="info" icon={<LockClosedIcon />}>
          <AlertTitle>Modo de leitura</AlertTitle>
          <AlertDescription>
            Você entrou por um convite de visualização e não pode editar.
          </AlertDescription>
        </Alert>
        <Alert tone="info" icon={false}>
          <AlertTitle>Modo de leitura</AlertTitle>
          <AlertDescription>
            Você entrou por um convite de visualização e não pode editar.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocSection
        title="Corpo"
        description="md fala com a tela; sm fala com um campo, colado ao controle que explica. O degrau encolhe texto, respiro e ícone juntos. Uma linha só não precisa de descrição."
        code={`<Alert tone="info">…</Alert>            {/* md */}
<Alert tone="info" size="sm">…</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="info">
          <AlertTitle>O dia de fechamento não é o de vencimento</AlertTitle>
          <AlertDescription>
            Compras após o fechamento entram na fatura seguinte.
          </AlertDescription>
        </Alert>
        <Alert tone="info" size="sm">
          <AlertTitle>O dia de fechamento não é o de vencimento</AlertTitle>
        </Alert>
      </DocSection>

      <DocSection
        title="Com ação"
        description="AlertActions no pé, alinhada ao texto, é o padrão. placement=&quot;inline&quot; põe a ação à direita, para o aviso curto de uma saída só — e ela desce para o pé quando o alerta tem menos de 28rem, perguntando à largura dele e não à da janela. AlertAction não declara cor: sai de currentColor e serve os cinco tons."
        code={`<Alert tone="destructive">
  <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
  <AlertDescription>A conexão caiu no meio do carregamento.</AlertDescription>
  <AlertActions placement="inline">
    <AlertAction iconMotion="spin">
      <ArrowPathIcon aria-hidden />
      Tentar novamente
    </AlertAction>
  </AlertActions>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="destructive">
          <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
          <AlertDescription>
            A conexão caiu no meio do carregamento.
          </AlertDescription>
          <AlertActions placement="inline">
            <AlertAction iconMotion="spin">
              <ArrowPathIcon aria-hidden />
              Tentar novamente
            </AlertAction>
          </AlertActions>
        </Alert>
        <Alert tone="warning">
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
        title="Dispensar"
        description="onDismiss põe o × no canto, na tinta do tom e com alvo de 46px no dedo — o mesmo da AnnouncementBar. O alerta não se esconde sozinho: quem chama o desmonta, e decide se lembra da escolha. Para o aviso explicativo que a pessoa já leu; um erro não se dispensa, se conserta."
        code={`<Alert tone="info" onDismiss={() => setAberto(false)}>…</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <DemoDispensar />
      </DocSection>

      <DocSection
        title="A entrada"
        description="O alerta que surge — o erro do login, o sucesso num diálogo — esmaece subindo 4px, por @starting-style e sem timer. Com movimento reduzido ele aparece na hora. Não há prop: todo alerta entra assim."
        code={`{erro ? (
  <Alert tone="destructive">
    <AlertTitle>{erro}</AlertTitle>
  </Alert>
) : null}`}
      >
        <DemoEntrada />
      </DocSection>

      <DocSection
        title="Marca"
        description="A caixa neutra em repouso, e o arco-íris acendendo num arco da borda conforme o ponteiro passa pela tela. É a forma para quando quem fala é o produto — uma novidade, uma boas-vindas — e não o dinheiro da pessoa. O ícone dela é o ✦. Ela não aceita tone nem size=&quot;sm&quot;. Uma por tela; passe o mouse perto."
        code={`<Alert variant="brand">
  <AlertTitle>O total agora considera as parcelas</AlertTitle>
  <AlertDescription>…</AlertDescription>
  <AlertActions>
    <AlertAction>Ver o que mudou</AlertAction>
  </AlertActions>
</Alert>`}
        previewClassName="flex-col items-stretch"
      >
        <Alert variant="brand">
          <AlertTitle>O total agora considera as parcelas</AlertTitle>
          <AlertDescription>
            Compras parceladas passam a entrar no mês em que cada parcela cai, e
            não no da compra.
          </AlertDescription>
          <AlertActions>
            <AlertAction>Ver o que mudou</AlertAction>
          </AlertActions>
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
            type: '"soft" | "brand"',
            default: '"soft"',
            description:
              "A forma: soft com moldura, o padrão; brand com o brilho de arco-íris na borda — sem tone e sem sm.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "O corpo; sm é o aviso que fala com um campo.",
          },
          {
            prop: "icon",
            type: "ReactNode | false",
            default: "o do tom",
            description:
              "Troca o ícone; false tira. default não tem.",
          },
          {
            prop: "onDismiss · dismissLabel",
            type: '() => void · string',
            default: '— · "Dispensar aviso"',
            description:
              "Põe o × no canto; quem chama desmonta o alerta.",
          },
          {
            prop: "role",
            type: '"alert" | "status" | string',
            default: "derivado do tom",
            description:
              "só destructive sai como alert (assertivo); todo o resto, status.",
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
              "O resumo, a primeira linha que o leitor de tela anuncia. Quebra palavra longa sozinho.",
          },
          {
            prop: "AlertDescription",
            type: "div",
            description:
              "O detalhe, na tinta do alerta a 85%.",
          },
          {
            prop: "AlertActions · placement",
            type: '"block" | "inline"',
            default: '"block"',
            description:
              "A linha da saída: no pé, alinhada ao texto, ou à direita dele num alerta de 28rem ou mais.",
          },
          {
            prop: "AlertAction",
            type: "Button",
            description:
              "A ação: Button tertiary que herda a tinta do tom; aceita asChild.",
          },
        ]}
      />

      <DocNote title="O ícone era escolhido por quem chamava">
          Seis telas escreviam o <code>svg</code> como filho, e cada uma escolhia: o destrutivo saía triângulo em cinco (o mesmo do <code>warning</code>) e círculo com × no catálogo, e as telas de acesso — login, cadastro, recuperação, convite — não tinham ícone nenhum. Desde a rodada 186 o ícone é do tom, e <code>alert-icon.test.ts</code> reprova o <code>svg</code> escrito como filho. O mesmo teste cobra o <code>break-words</code> que três diálogos escreviam no título: a mensagem do servidor pode ser uma palavra só, e quem a quebra é o <code>AlertTitle</code>.
      </DocNote>

      <DocNote title="Houve um variant=&quot;plain&quot;, e ele saiu">
          Era o aviso tingido <strong>sem borda</strong>, para dentro de formulário ou diálogo — onde a moldura já é de outro e mais uma só acrescenta um retângulo. Tinha 8 chamadas em 4 telas de acesso e saiu a pedido do dono. O custo está dito: esses avisos passaram a desenhar a própria borda dentro do formulário, que é exatamente o que o <code>plain</code> evitava. O caminho de volta é uma linha (<code>border-0</code>).
      </DocNote>

      <DocNote title="Título sem descrição é permitido; descrição sem título não">
          O título é o resumo que faz o olho decidir se vale ler, e o que o leitor de tela anuncia primeiro. Uma descrição solta perde esse resumo.
      </DocNote>

      <DocNote title="O brilho da marca é a primitiva, e mora na página dela">
          <code>brand</code> veste <code>@utility brand-glow</code> e <code>useBrandGlow</code>, os mesmos do <code>Card</code>, do <code>Badge</code>, do <code>Button</code> e dos controles de escolha; o mecanismo e as medições estão em <Link href="/designsystem/brand">Brand</Link>. Dois custos são do alerta: <strong>no telefone não há brilho</strong> — como ele substituiu a régua de 2px, o que sobra é a caixa neutra, igual ao <code>soft</code> de <code>tone=&quot;default&quot;</code> com o ✦ —, e <strong>não há degrau <code>sm</code></strong>: na rodada 118 a razão era a geometria da régua, que saiu com ela; fica a semântica (<code>sm</code> fala com um campo, a marca fala uma vez por tela).
      </DocNote>

      <DocNote title="Use AlertAction, e não pinte o botão">
          <code>AlertAction</code> é um <code>Button</code> <code>tertiary</code> <code>size=&quot;sm&quot;</code> cuja borda, tinta e realce saem de <code>currentColor</code>: trocar o tom do aviso troca o botão junto. Escrever <code>border-destructive/40</code> ali é reimportar a paleta para dentro da tela.
      </DocNote>

      <DocNote title="Onde o app usa">
          Em doze telas. Os erros e sucessos dos formulários de acesso e dos diálogos de conta (<code>destructive</code> e <code>success</code>, muitos em <code>sm</code>), o aviso de fatura no formulário de cartão (<code>info</code> <code>sm</code>), os dois neutros de permissão em membros e notificações, os detalhes técnicos da tela de erro, e o erro de carteiras do painel — desde a rodada 186 com a ação na linha. Nenhuma tela usa <code>brand</code> nem <code>onDismiss</code>.
      </DocNote>

      <DocNote title="Alert, AnnouncementBar e toast não se substituem">
          <code>Alert</code> fica dentro do conteúdo e fala daquela tela. <code>AnnouncementBar</code> atravessa o topo e fala de estado global — offline, convite, manutenção —, e é dispensável. <code>toast</code> confirma o que acabou de acontecer e some. Um <code>Alert</code> fixado no topo com <code>rounded-none border-x-0</code> é uma <code>AnnouncementBar</code> escrita com o componente errado.
      </DocNote>
    </>
  )
}
