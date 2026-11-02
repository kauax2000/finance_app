"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowPathIcon } from "@heroicons/react/16/solid"

import {
  alertDispensadoKey,
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

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

/**
 * O `storageKey` lembra no aparelho, e a dispensa só se desfaz recarregando (a
 * memória da sessão do Alert não tem API de esquecer). A chave é uma só,
 * `catalogo-lembrar`, e o botão a apaga antes de recarregar.
 */
function DemoLembrar() {
  const [dispensado, setDispensado] = React.useState(false)
  return (
    <div className="flex w-full flex-col gap-3">
      <Alert tone="warning" storageKey="catalogo-lembrar" onDismiss={() => setDispensado(true)}>
        <AlertTitle>Este aparelho bloqueou os avisos</AlertTitle>
        <AlertDescription>
          Libere as notificações nas configurações do navegador para receber os
          lembretes de vencimento.
        </AlertDescription>
      </Alert>
      <Button
        variant="tertiary"
        size="sm"
        className="self-start"
        onClick={() => {
          try {
            localStorage.removeItem(alertDispensadoKey("catalogo-lembrar"))
          } catch {
            // Sem armazenamento não há o que apagar.
          }
          window.location.reload()
        }}
      >
        {dispensado ? "mostrar o aviso de novo (recarrega)" : "esquecer a dispensa (recarrega)"}
      </Button>
    </div>
  )
}

function NoTelefone() {
  const [aberto, setAberto] = React.useState(true)
  return (
    <IphoneFrame title="O alerta com ação e dispensar num iPhone">
      <div className="flex h-full flex-col gap-3 px-4 pt-16">
        {aberto ? (
          <Alert tone="warning" onDismiss={() => setAberto(false)}>
            <AlertTitle>Orçamento de Mercado em 88%</AlertTitle>
            <AlertDescription>
              Faltam 9 dias para o mês virar e restam R$ 186,40 do limite.
            </AlertDescription>
            <AlertActions>
              <AlertAction>Revisar orçamento</AlertAction>
            </AlertActions>
          </Alert>
        ) : (
          <Button
            variant="tertiary"
            size="sm"
            className="self-start"
            onClick={() => setAberto(true)}
          >
            mostrar o aviso de novo
          </Button>
        )}
      </div>
    </IphoneFrame>
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

const TONS = ["default", "info", "success", "warning", "destructive"] as const
const FORMAS = ["soft", "brand"] as const
const CORPOS = ["sm", "md"] as const

function DemoNaTela() {
  const [tom, setTom] = React.useState<(typeof TONS)[number]>("warning")
  const [forma, setForma] = React.useState<(typeof FORMAS)[number]>("soft")
  const [corpo, setCorpo] = React.useState<(typeof CORPOS)[number]>("md")
  const [acao, setAcao] = React.useState(true)
  const [descricao, setDescricao] = React.useState(true)
  const [dispensar, setDispensar] = React.useState(false)
  const [semIcone, setSemIcone] = React.useState(false)

  const marca = forma === "brand"
  const conteudo = (
    <>
      <AlertTitle>{marca ? "O total agora considera as parcelas" : "Orçamento de Mercado em 88%"}</AlertTitle>
      {descricao ? (
        <AlertDescription>
          {marca
            ? "Compras parceladas entram no mês em que cada parcela cai, e não no da compra."
            : "Faltam 9 dias para o mês virar e restam R$ 186,40 do limite."}
        </AlertDescription>
      ) : null}
      {acao ? (
        <AlertActions>
          <AlertAction>{marca ? "Ver o que mudou" : "Revisar orçamento"}</AlertAction>
        </AlertActions>
      ) : null}
    </>
  )
  // O alerta recomeça (e a entrada toca) a cada troca; o × da demo só some com o aviso.
  const chave = [tom, forma, corpo, acao, descricao, dispensar, semIcone].join("|")

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        inicio={
          <>
            <Eixo
              rotulo="variant"
              valores={FORMAS}
              valor={forma}
              onChange={setForma}
              rotulos={{ soft: "soft", brand: "brand" }}
            />
            {/* A marca não aceita tone nem sm: os dois eixos saem em vez de mentir. */}
            {marca ? null : (
              <>
                <Eixo rotulo="tone" valores={TONS} valor={tom} onChange={setTom} />
                <Eixo rotulo="size" valores={CORPOS} valor={corpo} onChange={setCorpo} />
              </>
            )}
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="alert-acao" rotulo="ação" valor={acao} onChange={setAcao} />
            <Interruptor id="alert-descricao" rotulo="descrição" valor={descricao} onChange={setDescricao} />
            <Interruptor id="alert-dispensar" rotulo="dispensar" valor={dispensar} onChange={setDispensar} />
            <Interruptor id="alert-sem-icone" rotulo="sem ícone" valor={semIcone} onChange={setSemIcone} />
          </Interruptores>
        }
      />
      <div className="w-full max-w-xl">
        {marca ? (
          <Alert key={chave} variant="brand" icon={semIcone ? false : undefined} onDismiss={dispensar ? () => {} : undefined}>
            {conteudo}
          </Alert>
        ) : (
          <Alert
            key={chave}
            tone={tom}
            size={corpo}
            icon={semIcone ? false : undefined}
            onDismiss={dispensar ? () => {} : undefined}
          >
            {conteudo}
          </Alert>
        )}
      </div>
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
        title="Na tela"
        description="Os três eixos que não se misturam: tone é a cor (e o ícone), variant a forma, size o corpo. A marca não aceita tone nem sm, e some com os dois eixos quando é escolhida. O ícone do tom vem sozinho; icon troca o nó e icon={false} tira ícone e poço. O × da demo é só o botão: quem chama desmonta o alerta."
        code={`<Alert tone="warning" onDismiss={fechar}>
  <AlertTitle>Orçamento de Mercado em 88%</AlertTitle>
  <AlertDescription>Faltam 9 dias para o mês virar.</AlertDescription>
  <AlertActions>
    <AlertAction>Revisar orçamento</AlertAction>
  </AlertActions>
</Alert>

<Alert variant="brand">…</Alert>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O ícone era escolhido por quem chamava">
          Seis telas escreviam o <code>svg</code> como filho, e cada uma escolhia: o destrutivo saía triângulo em cinco (o mesmo do <code>warning</code>) e círculo com × no catálogo, e as telas de acesso — login, cadastro, recuperação, convite — não tinham ícone nenhum. Desde a rodada 186 o ícone é do tom, e <code>alert-icon.test.ts</code> reprova o <code>svg</code> escrito como filho. O mesmo teste cobra o <code>break-words</code> que três diálogos escreviam no título: a mensagem do servidor pode ser uma palavra só, e quem a quebra é o <code>AlertTitle</code>.
      </DocNote>

      <DocNote title="O poço é do Alert, e o raio é o do Card">
          O ícone mora num círculo desenhado pelo próprio <code>Alert</code> (<code>data-slot=&quot;alert-icon&quot;</code>), na cor do texto a 15% — <code>bg-current/15</code> —, com 24 no <code>sm</code> e 32 no <code>md</code> e o ícone de 14 e 16 dentro. A grade pergunta pelo poço e não pelo <code>svg</code>, então <code>icon={'{false}'}</code> não deixa coluna vazia. O raio saiu da escala de linha: o <code>sm</code> tinha 12px ao lado do <code>Card</code> de 22, e o <code>md</code> 16; hoje os dois vestem <code>rounded-surface</code>.
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
          Em 21 arquivos, 31 usos. Os erros e sucessos dos formulários de acesso e dos diálogos de conta (<code>destructive</code> e <code>success</code>, muitos em <code>sm</code>), o aviso de fatura no formulário de cartão (<code>info</code> <code>sm</code>), os dois neutros de permissão em membros e notificações, os detalhes técnicos da tela de erro, e o erro de carteiras do painel — desde a rodada 186 com a ação na linha. Nenhuma tela usa <code>brand</code> nem <code>onDismiss</code>; <code>storageKey</code> só o aviso de notificações bloqueadas em Configurações.
      </DocNote>

      <DocNote title="Alert, AnnouncementBar e toast não se substituem">
          <code>Alert</code> fica dentro do conteúdo e fala daquela tela. <code>AnnouncementBar</code> atravessa o topo e fala de estado global — offline, convite, manutenção —, e é dispensável. <code>toast</code> confirma o que acabou de acontecer e some. Um <code>Alert</code> fixado no topo com <code>rounded-none border-x-0</code> é uma <code>AnnouncementBar</code> escrita com o componente errado.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Abaixo de 48rem, ou com o dedo, o alerta vira a leitura de iOS: o sm veste o corpo do md (texto 14, poço 32, ícone 16), o recuo é 12 nas quatro bordas, e a ação e o Agora não dividem a linha de baixo meio a meio, a 8px, com 44 de altura; sozinhos, ocupam a linha. A ação inline nunca sobe à direita aqui. É a moldura de 375px de largura, onde essas regras valem de verdade."
        code={`<Alert tone="warning" onDismiss={fechar}>
  <AlertTitle>Orçamento de Mercado em 88%</AlertTitle>
  <AlertDescription>Faltam 9 dias para o mês virar.</AlertDescription>
  <AlertActions>
    <AlertAction>Revisar orçamento</AlertAction>
  </AlertActions>
</Alert>`}
        previewClassName="items-start justify-center"
      >
        <NoTelefone />
      </DocSection>

      <DocSection
        title="A ação na linha"
        description="AlertActions no pé, alinhada ao texto, é o padrão. placement=&quot;inline&quot; põe a ação à direita, para o aviso curto de uma saída só — e ela desce para o pé quando o alerta tem menos de 20rem, perguntando à largura dele e não à da janela (as duas caixas abaixo têm 18rem e 24rem). AlertAction não declara cor: sai de currentColor e serve os cinco tons."
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
        previewClassName="flex-wrap items-start gap-4"
      >
        {["w-72", "w-96"].map((largura) => (
          <div key={largura} className={largura}>
            <Alert tone="destructive">
              <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
              <AlertDescription>A conexão caiu no meio do carregamento.</AlertDescription>
              <AlertActions placement="inline">
                <AlertAction iconMotion="spin">
                  <ArrowPathIcon aria-hidden />
                  Tentar novamente
                </AlertAction>
              </AlertActions>
            </Alert>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Dispensar"
        description="onDismiss põe o × no canto, na tinta do tom. Ele não esconde o alerta: quem chama o desmonta. No dedo o × some e o mesmo botão vira o texto Agora não (dismissText troca), na linha de baixo. Para o aviso explicativo que a pessoa já leu; um erro não se dispensa, se conserta."
        code={`<Alert tone="info" onDismiss={() => setAberto(false)}>…</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <DemoDispensar />
      </DocSection>

      <DocSection
        title="Dispensar e lembrar"
        description="storageKey põe o × e guarda a dispensa neste aparelho, em localStorage, na chave alert-dispensado:push-bloqueado quando a storageKey é push-bloqueado: o aviso não volta a cada visita. Sem localStorage — modo privado, armazenamento bloqueado — o × some com o aviso até recarregar, e nada quebra. No servidor o alerta sai aberto e some depois de hidratar, se o aparelho já o dispensou. A chave é de quem chama e identifica o aviso, não a tela; onDismiss soma ao lembrar, e serve para avisar o resto da tela."
        code={`<Alert tone="warning" size="sm" storageKey="push-bloqueado">
  <AlertTitle>Este aparelho bloqueou os avisos.</AlertTitle>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <DemoLembrar />
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
              "Põe o × no canto; quem chama desmonta o alerta. dismissLabel é o nome do × com o mouse.",
          },
          {
            prop: "dismissText",
            type: "string",
            default: '"Agora não"',
            description:
              "O texto do botão que toma o lugar do × no dedo; é também o nome acessível dele ali.",
          },
          {
            prop: "storageKey",
            type: "string",
            default: "—",
            description:
              "Põe o × e lembra a dispensa neste aparelho, em localStorage na chave alert-dispensado:<storageKey>. Sem localStorage, vale até recarregar.",
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
              "A linha da saída: no pé, alinhada ao texto, ou à direita dele num alerta de 20rem ou mais. No dedo é sempre o pé, dividido com o Agora não.",
          },
          {
            prop: "AlertAction",
            type: "Button",
            description:
              "A ação: Button tertiary que herda a tinta do tom; aceita asChild.",
          },
        ]}
      />

    </>
  )
}
