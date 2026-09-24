"use client"

import * as React from "react"
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SignalSlashIcon,
  SparklesIcon,
  UserPlusIcon,
} from "@heroicons/react/16/solid"

import {
  AnnouncementBar,
  AnnouncementBarAction,
  AnnouncementBarActions,
  AnnouncementBarContent,
} from "@/components/ui/announcement-bar"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

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
        description="O ícone entra como filho direto, e é medido pelo size da barra. Sem ele, a gravidade é dita só pela cor."
        code={`<AnnouncementBar tone="warning">
  <ExclamationTriangleIcon aria-hidden />
  Você está offline. As alterações sobem quando a conexão voltar.
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar tone="default">
          Manutenção programada para domingo, das 2h às 4h.
        </AnnouncementBar>
        <AnnouncementBar tone="info">
          <InformationCircleIcon aria-hidden />
          O servidor está em manutenção até as 4h. A fila local continua
          guardando o que você lançar.
        </AnnouncementBar>
        <AnnouncementBar tone="warning">
          <SignalSlashIcon aria-hidden />
          Você está offline. As alterações ficam no aparelho e sobem quando a
          conexão voltar.
        </AnnouncementBar>
        <AnnouncementBar tone="destructive">
          <ExclamationTriangleIcon aria-hidden />
          Sua assinatura expirou. Os dados continuam salvos, mas em modo leitura.
        </AnnouncementBar>
      </DocSection>

      <DocSection
        title="Com ação"
        description="Para o caso canônico — “você está offline, tentar de novo”. O botão não declara cor: tertiary com currentColor serve os cinco tons."
        code={`<AnnouncementBar tone="warning">
  <SignalSlashIcon aria-hidden />
  <AnnouncementBarContent>Você está offline.</AnnouncementBarContent>
  <AnnouncementBarActions>
    <AnnouncementBarAction>Tentar de novo</AnnouncementBarAction>
  </AnnouncementBarActions>
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar tone="warning">
          <SignalSlashIcon aria-hidden />
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
        title="Marca"
        description="A faixa sem fundo, com o arco-íris translúcido atrás do texto, saindo forte do topo central e deslizando em 20s — o Banner rainbow do Fumadocs. É a forma para quando quem fala é o produto — uma novidade, uma versão nova — e não o estado do app. Ela não aceita tone: marca não tem gravidade. Uma por tela."
        code={`<AnnouncementBar variant="brand" sticky>
  <SparklesIcon aria-hidden />
  <AnnouncementBarContent>…</AnnouncementBarContent>
  <AnnouncementBarActions>
    <AnnouncementBarAction>Ver as novidades</AnnouncementBarAction>
  </AnnouncementBarActions>
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar variant="brand">
          <SparklesIcon aria-hidden />
          <AnnouncementBarContent>
            Uma nova versão está disponível. Recarregue para atualizar.
          </AnnouncementBarContent>
          <AnnouncementBarActions>
            <AnnouncementBarAction>Recarregar</AnnouncementBarAction>
          </AnnouncementBarActions>
        </AnnouncementBar>
        <AnnouncementBar variant="brand" size="sm">
          <SparklesIcon aria-hidden />
          Faturas de cartão agora fecham sozinhas na data do ciclo.
        </AnnouncementBar>
      </DocSection>

      <DocSection
        title="Escada"
        description="md é a faixa do topo do app; sm é a que acompanha uma seção."
        code={`<AnnouncementBar size="sm" tone="info">…</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        {(["sm", "md"] as const).map((s) => (
          <AnnouncementBar key={s} size={s} tone="info">
            <InformationCircleIcon aria-hidden />
            size=&ldquo;{s}&rdquo; — o ícone acompanha o corpo do texto.
          </AnnouncementBar>
        ))}
      </DocSection>

      <DocNote title="A altura não depende do botão de fechar">
        A linha declara a própria altura mínima e o × cabe dentro dela; o alvo de toque cresce por pseudo-elemento. Assim a barra não salta ao ganhar ou perder o ×.
      </DocNote>

      <DocNote title="Tons do Alert; o neutro pinta muted">
        Os quatro tons leem os mesmos tokens <code>-muted</code> do <code>Alert</code>. O <code>default</code> usa fundo <code>--muted</code>, porque <code>--card</code> numa faixa de topo quase some contra a página, e texto no foreground cheio — o tom sem cor não pode ter o texto mais fraco.
      </DocNote>

      <DocNote title="O fio do sticky herda o tom">
        É <code>current/20</code>, uma linha para os cinco tons: fio cinza sobre superfície colorida lê como acidente.
      </DocNote>

      <DocNote title="O realce do × é mais forte que o do botão de ação">
        O × é um ícone de 12px numa caixa de 24 sem contorno, e a mesma diferença de cor em área menor lê como menos. Por isso ele sobe a 15% e mostra o contorno no cursor, enquanto a ação fica em 10%.
      </DocNote>

      <DocNote title="Os dois botões pagaram a rodada 99 com atraso">
        Eles mantinham <code>hover:bg-current/N</code> e nunca declaravam <code>--button-fill-color</code>, então herdavam o cinza de <code>--muted</code> do <code>tertiary</code>: o realce pintava <strong>duas</strong> camadas — a tinta do tom na caixa toda e um disco cinza por cima. No tema claro, onde <code>--muted</code> é opaco, os quatro tons convergiam no mesmo <code>235,235,235</code>: o realce apagava o tom em vez de realçá-lo. Ninguém viu porque a razão de luminância é <strong>1,007–1,078</strong> — o defeito é cromático, e os scripts da casa só medem luminância. Com <code>currentColor</code> no disco: 1,16–1,19 no claro e 1,26–1,30 no escuro.
      </DocNote>

      <DocNote title="O véu substitui o fio do sticky, e a ordem do cva é o mecanismo">
        Em <code>brand</code> a faixa não tem fio de baixo — o véu já a separa da página —, então a variante traz <code>border-b-0</code>. E o eixo <code>variant</code> é declarado <strong>depois</strong> de <code>sticky</code> no <code>cva</code>: a concatenação segue a ordem das chaves e o <code>tailwind-merge</code> resolve por último-vence. Declarado antes, o <code>border-b</code> do <code>sticky</code> venceria e a barra sairia com duas linhas de 1px empilhadas, uma cinza e uma de arco-íris.
      </DocNote>

      <DocNote title="O papel segue o tom">
        <code>destructive</code> é <code>role=&quot;alert&quot;</code>, que interrompe; os outros quatro são <code>status</code>. Para outro papel, passe <code>role</code>.
      </DocNote>

      <DocNote title="Dispensável por padrão">
        Aviso permanente que não se fecha vira cenário e deixa de avisar. Se o estado é bloqueante, omita <code>onDismiss</code> — e a barra precisa sumir sozinha quando o estado mudar, como faz o <code>OfflineBanner</code>.
      </DocNote>

      <DocNote title="Offline é um quinto estado, e este app tem">
        Com a fila de mutações local existe &ldquo;salvo aqui, ainda não sincronizado&rdquo;: não é erro nem sucesso, e a tela precisa dizer. Quem diz é esta barra, no <code>offline-banner</code>, e o <code>sync-status-chip</code>.
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
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "Respiro, corpo do texto e medida do ícone, juntos.",
          },
          {
            prop: "sticky",
            type: "boolean",
            default: "false",
            description:
              "Prende no topo, na camada --z-banner.",
          },
          {
            prop: "onDismiss",
            type: "() => void",
            description: "Sem ela, o botão de fechar não aparece.",
          },
          {
            prop: "dismissLabel",
            type: "string",
            default: '"Dispensar aviso"',
            description: "O aria-label do botão de fechar.",
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
              "A fileira de ações, na borda.",
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
      <Button variant="outline" size="sm" onClick={() => setVisivel(true)}>
        Mostrar de novo
      </Button>
    )
  }

  return (
    <AnnouncementBar tone="success" onDismiss={() => setVisivel(false)}>
      <UserPlusIcon aria-hidden />
      Convite aceito. Ana já vê as transações deste workspace.
    </AnnouncementBar>
  )
}
