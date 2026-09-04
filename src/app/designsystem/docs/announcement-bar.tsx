"use client"

import * as React from "react"
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
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
          Uma nova versão está disponível. Recarregue para atualizar.
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
        description="O caso canônico — “você está offline, tentar de novo” — não tinha lugar. O botão de dentro não declara cor: tertiary mais currentColor serve os cinco tons."
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

      <DocNote title="A altura não depende mais do botão de fechar">
        Medido antes: <strong>40px sem o ×, 44px com</strong>. O{" "}
        <code>Button size=&quot;xs&quot;</code> (24) é mais alto que a linha de
        texto, então era ele quem passava a mandar na altura — e uma barra que
        ganha o × ao mudar de estado saltava 4px. Hoje a linha declara a própria
        altura mínima, o × cabe dentro dela, e o alvo de toque cresce por
        pseudo-elemento em vez de por medida.
      </DocNote>

      <DocNote title="Os quatro tons já eram os do Alert; o neutro não">
        Medida a cor resolvida dos cinco, <code>info</code>,{" "}
        <code>success</code>, <code>warning</code> e <code>destructive</code>{" "}
        batem com o <code>Alert</code> em <strong>distância 0</strong>, nos dois
        temas — a barra sempre leu os tokens <code>-muted</code>.
        <br />
        <br />
        O <code>default</code> diverge de propósito no <strong>fundo</strong>: o
        Alert usa <code>bg-card</code>, que ali já o separa da página, e uma
        faixa de topo com <code>--card</code> ficaria quase invisível — medido no
        escuro, 23 de distância da página contra os 48 do <code>--muted</code>.
        <br />
        <br />
        Mas o <strong>texto</strong> era divergência de verdade. Com{" "}
        <code>text-muted-foreground</code>, o tom neutro era o que se lia{" "}
        <strong>pior</strong> de todos: 5,04 no claro e 5,86 no escuro, contra
        6,9–10,8 dos quatro tonais. O <code>Alert default</code> usa o
        foreground cheio, e a barra passou a usá-lo também: 16,61 e 14,50.
        Justamente o tom que não tem cor para ajudar a ler não podia ter o texto
        mais fraco.
      </DocNote>

      <DocNote title="O fio do sticky herda o tom">
        Ele era <code>border-border/50</code> — cinza sobre superfície colorida,
        a mesma família do texto cinza que o <code>Alert</code> documenta e
        reverteu. <code>current/20</code> é uma linha só para os cinco tons.
      </DocNote>

      <DocNote title="O realce do × é mais forte que o do botão de ação">
        E não é capricho. Medido no escuro, <code>current/10</code> dava
        contraste 1,28–1,35 contra o fundo — o hover do{" "}
        <code>Button tertiary</code> do app dá <strong>1,11</strong> e o do menu{" "}
        <strong>1,14</strong>, então o delta já era maior que o da casa. O que
        faltava não era delta: era <strong>área</strong>. Um ícone de 12px numa
        caixa de 24 sem contorno tem um quarto da superfície de um botão de
        texto, e a mesma diferença de cor lê como menos.
        <br />
        <br />
        Daí as duas alavancas: 15% em vez de 10%, e o <strong>contorno
        aparecendo</strong> — é ele que delimita os 24px e diz onde o alvo
        começa. Medido depois: preenchimento em 1,26–1,39 no claro e 1,46–1,58
        no escuro, com a borda somando 1,50–1,76 e 1,93–2,23. No hover o × passa
        a falar exatamente a língua do botão de ação ao lado.
      </DocNote>

      <DocNote title="O papel segue o tom">
        <code>role=&quot;status&quot;</code> era cravado, inclusive em{" "}
        <code>destructive</code> — um erro bloqueante anunciado com polidez,
        quando ali o papel é <code>alert</code>, que interrompe. Os outros quatro
        seguem <code>status</code>. Quem precisar de outro passa{" "}
        <code>role</code> por fora.
      </DocNote>

      <DocNote title="Dispensável por padrão">
        Um aviso permanente que não se pode fechar vira cenário em uma semana, e
        deixa de avisar. Se o estado é bloqueante, não passe{" "}
        <code>onDismiss</code> — mas então ele precisa sumir sozinho quando o
        estado mudar, que é o que o <code>OfflineBanner</code> faz.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"default" | "info" | "success" | "warning" | "destructive"',
            default: '"info"',
            description:
              "A gravidade. default é o aviso sem gravidade, que antes era obrigado a se pintar de info.",
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
              "Prende no topo em --z-banner, a camada que a escala reserva para isto.",
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
              "O texto que ocupa a sobra. Opcional — um texto solto como filho também funciona.",
          },
          {
            prop: "AnnouncementBarActions",
            type: "ComponentProps<'div'>",
            description:
              "A fileira, na borda. Só a fileira — quem veste o botão é o AnnouncementBarAction.",
          },
          {
            prop: "AnnouncementBarAction",
            type: "Button",
            description:
              "A ação. Button tertiary size=\"xs\" que herda a tinta do tom por currentColor. Irmão do AlertAction, um degrau mais baixo porque a barra é mais densa.",
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
