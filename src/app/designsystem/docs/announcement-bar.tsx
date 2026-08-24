"use client"

import * as React from "react"

import { AnnouncementBar } from "@/components/ui/announcement-bar"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function AnnouncementBarDoc() {
  return (
    <>
      <Usage>
        Um aviso sobre o <strong>app inteiro</strong>, não sobre a tela: modo
        offline, convite pendente, manutenção programada. Aviso sobre o conteúdo
        de uma tela é <code>Alert</code>; confirmação do que acabou de acontecer
        é <code>toast</code>.
      </Usage>

      <DocSection
        title="Tons"
        code={`<AnnouncementBar tone="warning" onDismiss={() => …}>
  Você está offline. As alterações sobem quando a conexão voltar.
</AnnouncementBar>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        <AnnouncementBar tone="info">
          Uma nova versão está disponível. Recarregue para atualizar.
        </AnnouncementBar>
        <AnnouncementBar tone="warning">
          Você está offline. As alterações ficam no aparelho e sobem quando a
          conexão voltar.
        </AnnouncementBar>
        <DismissDemo />
      </DocSection>

      <DocNote title="Dispensável por padrão">
        Um aviso permanente que não se pode fechar vira parte do cenário em uma
        semana, e aí deixa de avisar. Se o estado é realmente bloqueante,{" "}
        <strong>não</strong> passe <code>onDismiss</code>{" "}
        — mas então ele
        precisa desaparecer sozinho quando o estado mudar.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"info" | "success" | "warning" | "destructive"',
            default: '"info"',
            description: "A gravidade do aviso.",
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
      Convite aceito. Ana já vê as transações deste workspace.
    </AnnouncementBar>
  )
}
