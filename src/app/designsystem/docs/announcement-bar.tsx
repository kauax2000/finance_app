"use client"

import * as React from "react"
import {
  ArrowPathIcon,
  SignalSlashIcon,
  UserPlusIcon,
} from "@heroicons/react/16/solid"

import {
  AnnouncementBar,
  AnnouncementBarAction,
  AnnouncementBarActions,
  AnnouncementBarContent,
} from "@/components/ui/announcement-bar"
import { Button } from "@/components/ui/button"
import { P } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const PARAGRAFOS = [
  "Mercado — R$ 412,80 em 14 lançamentos.",
  "Transporte — R$ 186,00 em 9 lançamentos.",
  "Casa — R$ 1.940,00 em 4 lançamentos.",
  "Lazer — R$ 238,50 em 6 lançamentos.",
  "Saúde — R$ 96,40 em 2 lançamentos.",
  "Assinaturas — R$ 189,90 em 6 lançamentos.",
]

export default function AnnouncementBarDoc() {
  return (
    <>
      <Usage>
        Aviso sobre o <strong>app inteiro</strong>: modo offline, convite
        pendente, manutenção. Sobre o conteúdo de uma tela é <code>Alert</code>;
        sobre o que acabou de acontecer é <code>toast</code>.
      </Usage>

      <DocSection
        title="Tons"
        description="Cada tom traz o seu ícone — ⓘ, ✓, ⚠ e o círculo com × —, os mesmos do Alert; o default fica sem. Sem ícone, a gravidade seria dita só pela cor."
        code={`<AnnouncementBar tone="warning">
  Você está offline. As alterações sobem quando a conexão voltar.
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar tone="default">
          Manutenção programada para domingo, das 2h às 4h.
        </AnnouncementBar>
        <AnnouncementBar tone="info">
          O servidor está em manutenção até as 4h. A fila local continua
          guardando o que você lançar.
        </AnnouncementBar>
        <AnnouncementBar tone="success">
          Convite aceito. Ana já vê as transações deste workspace.
        </AnnouncementBar>
        <AnnouncementBar tone="warning">
          Você está offline. As alterações ficam no aparelho e sobem quando a
          conexão voltar.
        </AnnouncementBar>
        <AnnouncementBar tone="destructive">
          Sua assinatura expirou. Os dados continuam salvos, mas em modo leitura.
        </AnnouncementBar>
      </DocSection>

      <DocSection
        title="O ícone"
        description="icon troca o do tom por um que diz o assunto — o offline usa o sinal cortado; icon={false} tira. Não escreva o svg como filho."
        code={`<AnnouncementBar tone="warning" icon={<SignalSlashIcon />}>…</AnnouncementBar>
<AnnouncementBar tone="info" icon={false}>…</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar tone="warning" icon={<SignalSlashIcon />}>
          Você está offline. As alterações sobem quando a conexão voltar.
        </AnnouncementBar>
        <AnnouncementBar tone="info" icon={false}>
          O servidor está em manutenção até as 4h.
        </AnnouncementBar>
      </DocSection>

      <DocSection
        title="Com ação, e dispensável"
        description="O botão não declara cor: tertiary com currentColor serve os cinco tons. onDismiss põe o ×; sem ela, a faixa precisa sumir sozinha quando o estado mudar."
        code={`<AnnouncementBar tone="warning" icon={<SignalSlashIcon />}>
  <AnnouncementBarContent>Você está offline.</AnnouncementBarContent>
  <AnnouncementBarActions>
    <AnnouncementBarAction>Tentar de novo</AnnouncementBarAction>
  </AnnouncementBarActions>
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar tone="warning" icon={<SignalSlashIcon />}>
          <AnnouncementBarContent>
            Você está offline. Tentando reconectar…
          </AnnouncementBarContent>
          <AnnouncementBarActions>
            <AnnouncementBarAction>
              <ArrowPathIcon aria-hidden />
              Tentar de novo
            </AnnouncementBarAction>
          </AnnouncementBarActions>
        </AnnouncementBar>
        <DismissDemo />
      </DocSection>

      <DocSection
        title="Centralizada"
        description="align=&quot;center&quot; leva o texto e as ações juntos para o meio — a forma do anúncio de produto. O × sai do fluxo e fica na borda, com o recuo simétrico, senão empurraria o miolo meio botão para o lado."
        code={`<AnnouncementBar variant="brand" align="center" onDismiss={dispensar}>
  <AnnouncementBarContent>Uma nova versão está disponível.</AnnouncementBarContent>
  <AnnouncementBarActions>
    <AnnouncementBarAction>Ver novidades</AnnouncementBarAction>
  </AnnouncementBarActions>
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar variant="brand" align="center" onDismiss={() => {}}>
          <AnnouncementBarContent>
            Uma nova versão está disponível.
          </AnnouncementBarContent>
          <AnnouncementBarActions>
            <AnnouncementBarAction>Ver novidades</AnnouncementBarAction>
          </AnnouncementBarActions>
        </AnnouncementBar>
        <AnnouncementBar tone="info" align="center" size="sm">
          Manutenção programada para domingo, das 2h às 4h.
        </AnnouncementBar>
      </DocSection>

      <DocSection
        title="Marca"
        description="A faixa sem fundo, com o arco-íris translúcido atrás do texto, saindo forte do topo central e deslizando em 20s — o Banner rainbow do Fumadocs. É a forma para quando quem fala é o produto e não o estado do app; o ícone dela é o ✦. Não aceita tone: marca não tem gravidade. Uma por tela."
        code={`<AnnouncementBar variant="brand" position="sticky">…</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar variant="brand">
          <AnnouncementBarContent>
            Faturas de cartão agora fecham sozinhas na data do ciclo.
          </AnnouncementBarContent>
          <AnnouncementBarActions>
            <AnnouncementBarAction>Ver o que mudou</AnnouncementBarAction>
          </AnnouncementBarActions>
        </AnnouncementBar>
      </DocSection>

      <DocSection
        title="Posição, e a entrada"
        description="position=&quot;static&quot; fica no fluxo; sticky prende no topo de quem rola; fixed prende à janela — as duas na camada --z-banner, com o fio do tom. Ao aparecer, a faixa esmaece e desce: a altura inteira quando presa, 4px no fluxo. Role a caixa, e derrube a conexão."
        code={`<AnnouncementBar position="sticky">…</AnnouncementBar>
<AnnouncementBar position="fixed" className="top-(--mobile-header-offset) md:top-0">…</AnnouncementBar>`}
        previewClassName="flex-col items-stretch p-0"
      >
        <EntradaDemo />
      </DocSection>

      <DocSection
        title="Escada"
        description="md é a faixa do topo do app; sm é a que acompanha uma seção. O ícone acompanha o corpo do texto."
        code={`<AnnouncementBar size="sm" tone="info">…</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        {(["sm", "md"] as const).map((s) => (
          <AnnouncementBar key={s} size={s} tone="info">
            size=&ldquo;{s}&rdquo;
          </AnnouncementBar>
        ))}
      </DocSection>

      <DocNote title="A altura não depende do botão de fechar">
        A linha declara a própria altura mínima e o × cabe dentro dela; o alvo de toque cresce por pseudo-elemento. Assim a barra não salta ao ganhar ou perder o ×.
      </DocNote>

      <DocNote title="Tons do Alert; o neutro pinta muted">
        Os quatro tons leem os mesmos tokens <code>-muted</code> do <code>Alert</code>. O <code>default</code> usa fundo <code>--muted</code>, porque <code>--card</code> numa faixa de topo quase some contra a página, e texto no foreground cheio — o tom sem cor não pode ter o texto mais fraco. O fio de <code>sticky</code> e <code>fixed</code> é <code>current/20</code>, uma linha para os cinco tons: fio cinza sobre superfície colorida lê como acidente.
      </DocNote>

      <DocNote title="O realce dos botões é a tinta do tom">
        Os dois declaram a cor da flor do <code>tertiary</code> em <code>currentColor</code>. Herdando o <code>--muted</code>, os quatro tons convergiam no mesmo <code>235,235,235</code> no tema claro — o realce apagava o tom —, e ninguém viu porque a razão de luminância é <strong>1,007–1,078</strong>: o defeito é cromático, e os scripts da casa só medem luminância. O × sobe a 15%, sem contorno, contra 10% da ação: é um ícone de 12px numa caixa de 24, e a mesma diferença de cor em área menor lê como menos.
      </DocNote>

      <DocNote title="O véu substitui o fio, e a ordem do cva é o mecanismo">
        Em <code>brand</code> a faixa não tem fio de baixo — o véu já a separa da página —, então a variante traz <code>border-b-0</code>. E o eixo <code>variant</code> é declarado <strong>depois</strong> de <code>position</code>: o <code>cva</code> concatena na ordem das chaves e o <code>tailwind-merge</code> resolve por último-vence; declarado antes, o fio do <code>sticky</code> voltaria sob o véu. O mesmo último-vence era um defeito até a rodada 187: o <code>relative</code> que o véu pede morava na marca e vencia o <code>sticky</code>, então a faixa de marca presa ao topo nunca prendeu. Hoje ele é do <code>static</code>.
      </DocNote>

      <DocNote title="O papel segue o tom">
        <code>destructive</code> é <code>role=&quot;alert&quot;</code>, que interrompe; os outros quatro são <code>status</code>. Para outro papel, passe <code>role</code>.
      </DocNote>

      <DocNote title="Dispensável quando o estado deixa">
        Aviso permanente que não se fecha vira cenário e deixa de avisar, então dê <code>onDismiss</code> a todo aviso que a pessoa pode ignorar. Se o estado é bloqueante, omita — e a barra precisa sumir sozinha quando o estado mudar, como faz o <code>OfflineBanner</code>.
      </DocNote>

      <DocNote title="Onde o app usa">
        Uma: o <code>OfflineBanner</code>, com <code>tone=&quot;warning&quot;</code>, o sinal cortado e <code>position=&quot;fixed&quot;</code> — ele escrevia as quatro classes do <code>fixed</code> à mão, e fica só com o <code>top</code>, porque no telefone passa por baixo do cabeçalho. Offline é um quinto estado neste app, com a fila de mutações local: &ldquo;salvo aqui, ainda não sincronizado&rdquo;, que não é erro nem sucesso. Quem o diz é esta barra e o <code>sync-status-chip</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"default" | "info" | "success" | "warning" | "destructive"',
            default: '"info"',
            description:
              "A gravidade; default é o aviso sem gravidade. Proibido junto de variant=\"brand\".",
          },
          {
            prop: "variant",
            type: '"soft" | "brand"',
            default: '"soft"',
            description:
              "A forma: soft leva a superfície do tom; brand é a faixa sem fundo, com o véu de arco-íris atrás do texto.",
          },
          {
            prop: "icon",
            type: "ReactNode | false",
            default: "o do tom",
            description: "Troca o ícone; false tira. default não tem.",
          },
          {
            prop: "position",
            type: '"static" | "sticky" | "fixed"',
            default: '"static"',
            description:
              "No fluxo, presa ao topo de quem rola, ou presa à janela — as duas últimas na camada --z-banner.",
          },
          {
            prop: "align",
            type: '"start" | "center"',
            default: '"start"',
            description: "center leva texto e ações ao meio; o × fica na borda.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "Respiro, corpo do texto e medida do ícone, juntos.",
          },
          {
            prop: "onDismiss · dismissLabel",
            type: "() => void · string",
            default: '— · "Dispensar aviso"',
            description: "Sem onDismiss, o botão de fechar não aparece.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "AnnouncementBarContent",
            type: "ComponentProps<'div'>",
            description:
              "O texto que ocupa a sobra; opcional.",
          },
          {
            prop: "AnnouncementBarActions",
            type: "ComponentProps<'div'>",
            description:
              "A fileira de ações, na borda (no meio, com align=\"center\").",
          },
          {
            prop: "AnnouncementBarAction",
            type: "Button",
            description:
              "Button tertiary size=\"xs\" com a tinta do tom por currentColor — o AlertAction, um degrau abaixo.",
          },
        ]}
      />
    </>
  )
}

function DismissDemo() {
  const [visivel, setVisivel] = React.useState(true)

  if (!visivel) {
    return (
      <Button variant="tertiary" size="sm" className="mx-4 mb-4 self-start" onClick={() => setVisivel(true)}>
        mostrar de novo
      </Button>
    )
  }

  return (
    <AnnouncementBar
      tone="success"
      icon={<UserPlusIcon />}
      onDismiss={() => setVisivel(false)}
    >
      Convite aceito. Ana já vê as transações deste workspace.
    </AnnouncementBar>
  )
}

function EntradaDemo() {
  const [offline, setOffline] = React.useState(false)
  return (
    <div className="flex flex-col gap-3 p-4">
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setOffline((v) => !v)}>
        {offline ? "voltar a conexão" : "derrubar a conexão"}
      </Button>
      <div className="h-44 overflow-y-auto rounded-lg border border-border">
        {offline ? (
          <AnnouncementBar tone="warning" position="sticky" size="sm" icon={<SignalSlashIcon />}>
            Você está offline.
          </AnnouncementBar>
        ) : null}
        <div className="flex flex-col gap-3 p-4">
          {PARAGRAFOS.map((t) => (
            <P key={t}>{t}</P>
          ))}
        </div>
      </div>
    </div>
  )
}
