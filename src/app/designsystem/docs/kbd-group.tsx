"use client"

import Link from "next/link"

import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function KbdGroupDoc() {
  return (
    <>
      <Usage>
        Teclas em mais de uma pastilha: a <strong>sequência</strong>, apertadas
        uma depois da outra (<code>g</code> depois <code>h</code>), ou as{" "}
        <strong>alternativas</strong>, qualquer uma delas (↑ ou ↓). O acorde —{" "}
        <code>⌘K</code>, dedos descendo juntos — é uma pastilha só e mora no{" "}
        <Link href="/designsystem/kbd" className="underline">
          Kbd
        </Link>
        .
      </Usage>

      <DocSection
        title="Sequência"
        description="Uma tecla por pastilha, na ordem em que se aperta. Os nomes passam pela mesma tabela do Kbd, então esc vira Esc e up vira ↑. Um passo pode ser um acorde: mod+k resolve ⌘ ou Ctrl pela plataforma, como no Kbd — é o atalho de dois tempos do VS Code."
        code={`<KbdGroup keys={["g", "h"]} />
<KbdGroup keys={["mod+k", "s"]} />`}
        previewClassName="gap-4"
      >
        <KbdGroup keys={["g", "h"]} />
        <KbdGroup keys={["g", "esc"]} />
        <KbdGroup keys={["mod+k", "s"]} />
      </DocSection>

      <DocSection
        title="“Depois” à vista"
        description="separator põe um › quieto entre os passos, para quem não conhece a convenção do atalho de dois tempos. O leitor de tela ouve “depois” com ou sem ele."
        code={`<KbdGroup keys={["g", "h"]} separator />`}
        previewClassName="gap-4"
      >
        <KbdGroup keys={["g", "h"]} separator />
        <KbdGroup keys={["mod+k", "s"]} separator />
      </DocSection>

      <DocSection
        title="Alternativas"
        description="mode=&quot;either&quot;: as teclas são opções, e não passos — um / fica entre elas, e o leitor de tela ouve “ou”. É a legenda da paleta (↑/↓ navegar), que escrevia duas pastilhas lado a lado, o desenho da sequência."
        code={`<KbdGroup mode="either" keys={["up", "down"]} />
<KbdGroup mode="either" keys={["mod+k", "/"]} />`}
        previewClassName="gap-4"
      >
        <KbdGroup mode="either" keys={["up", "down"]} />
        <KbdGroup mode="either" keys={["mod+k", "/"]} />
      </DocSection>

      <DocSection
        title="Sequência, alternativa ou acorde"
        description="A distinção é o gesto: trocar uma pela outra ensina o atalho errado."
        previewClassName="gap-6"
      >
        <div className="flex flex-col items-start gap-1.5">
          <Caption>sequência — g, depois i</Caption>
          <KbdGroup keys={["g", "i"]} />
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <Caption>alternativa — uma ou outra</Caption>
          <KbdGroup mode="either" keys={["up", "down"]} />
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <Caption>acorde — as duas juntas</Caption>
          <Kbd keys="mod+k" />
        </div>
      </DocSection>

      <DocSection
        title="Tecla que acende"
        description="live acende as pastilhas enquanto a pessoa aperta aquelas teclas. Na sequência é o progresso — g acende, h completa, e a sequência apaga sozinha; errar volta ao começo. Nas alternativas, acende a que está descida. Para uma tela de atalhos ou uma dica de primeira vez; o teclado só é escutado com live. Aperte g e depois h, ou as setas."
        code={`<KbdGroup keys={["g", "h"]} separator live />
<KbdGroup mode="either" keys={["up", "down"]} live />`}
        previewClassName="gap-6"
      >
        <KbdGroup keys={["g", "h"]} separator live />
        <KbdGroup mode="either" keys={["up", "down"]} live />
      </DocSection>

      <DocSection
        title="O que keys não escreve"
        description="Um glifo que não está na tabela, um ícone, uma tecla com nome próprio: aí as pastilhas vêm por children, e cada uma é um Kbd. O separador e o “depois”/“ou” valem igual."
        code={`<KbdGroup>
  <Kbd>Fn</Kbd>
  <Kbd>F5</Kbd>
</KbdGroup>`}
        previewClassName="gap-4"
      >
        <KbdGroup>
          <Kbd>Fn</Kbd>
          <Kbd>F5</Kbd>
        </KbdGroup>
      </DocSection>

      <DocNote title="keys e children não convivem">
        O tipo é uma união, como no <code>Kbd</code>: duas fontes para o mesmo
        conteúdo deixam uma delas em silêncio, e quem escreveu não descobre qual.
        <code>live</code> só existe com <code>keys</code>: é a lista de teclas que
        ele compara com o teclado.
      </DocNote>

      <DocNote title="Onde é usado">
        Nenhuma tela do app mostra atalho em sequência. O catálogo usa as
        alternativas na legenda da paleta de busca, e a página do{" "}
        <code>Command</code> também — as duas escreviam{" "}
        <code>&lt;Kbd&gt;↑&lt;/Kbd&gt;&lt;Kbd&gt;↓&lt;/Kbd&gt;</code>, que se lia
        como &ldquo;↑ depois ↓&rdquo;.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "keys",
            type: "string[]",
            description: "As teclas, na ordem; cada passo pode ser um acorde (mod+k). Os nomes passam pela tabela do Kbd.",
          },
          {
            prop: "mode",
            type: '"sequence" | "either"',
            default: '"sequence"',
            description: "Passos, ou opções (um / entre elas).",
          },
          {
            prop: "separator",
            type: "boolean",
            default: "false",
            description: "Na sequência, o › entre os passos.",
          },
          {
            prop: "live",
            type: "boolean",
            default: "false",
            description: "Acende as pastilhas com as teclas apertadas. Só com keys.",
          },
          {
            prop: "children",
            type: "React.ReactNode",
            description: "As pastilhas à mão, para o que keys não escreve.",
          },
        ]}
      />
    </>
  )
}
