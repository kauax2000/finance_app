"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const DURATIONS = [
  ["--duration-fast", "150ms", "hover, foco, troca de cor"],
  ["--duration-base", "200ms", "abrir um popover, expandir um bloco"],
  ["--duration-slow", "300ms", "folha subindo, gaveta"],
]

const EASINGS = [
  ["--ease-out", "cubic-bezier(0.16, 1, 0.3, 1)", "entra rápido e assenta devagar"],
  ["--ease-emphasized", "cubic-bezier(0.32, 0.72, 0, 1)", "a curva das folhas, com peso de iOS"],
]

export default function MovimentoDoc() {
  const [on, setOn] = React.useState(false)

  return (
    <>
      <Usage>
        Movimento explica uma mudança de estado: de onde a folha veio, o que acabou de aparecer. Se a animação não responde a isso, é decoração e custa quadros.
      </Usage>

      <Group title="Tokens" layout="grid">
        <Spec title="Durações">
          <Stack className="gap-2">
            {DURATIONS.map(([token, value, use]) => (
              <div key={token} className="flex items-baseline gap-3">
                <code className="w-40 shrink-0 font-mono text-2xs text-foreground">
                  {token}
                </code>
                <span className="nums w-14 shrink-0 text-2xs text-muted-foreground">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">{use}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Curvas">
          <Stack className="gap-2">
            {EASINGS.map(([token, value, use]) => (
              <div key={token} className="flex flex-col">
                <code className="font-mono text-2xs text-foreground">{token}</code>
                <code className="font-mono text-2xs text-muted-foreground">
                  {value}
                </code>
                <span className="text-xs text-muted-foreground">{use}</span>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Como usar"
        description="A sintaxe do Tailwind v4 lê a variável direto: duration-(--duration-base). Não invente um número novo em milissegundos."
        code={`<div className="transition-transform duration-(--duration-slow) ease-(--ease-emphasized)" />`}
        previewClassName="flex-col items-start gap-4"
      >
        <Button type="button" variant="outline" onClick={() => setOn((v) => !v)}>
          {on ? "Voltar" : "Mover"}
        </Button>
        <div className="w-full overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
          <span
            className={`block size-8 rounded-md bg-primary transition-transform duration-(--duration-slow) ease-(--ease-emphasized) ${
              on ? "translate-x-[calc(100%*4)]" : "translate-x-0"
            }`}
          />
        </div>
      </DocSection>

      <DocNote title="Ainda não migrado">
        Fora deste catálogo e das animações de folha em <code>globals.css</code>,
        o produto ainda escreve a duração à mão: <code>duration-300</code> em 15
        lugares, <code>duration-200</code> em nove, <code>duration-100</code> em
        nove. Os tokens são o destino, não uma descrição do presente.
      </DocNote>

      <DocNote title="Quando o sistema pede menos animação">
        A regra encurta transições e desliga animações de uma passada, mas <strong>preserva</strong> as que se repetem — <code>animate-spin</code>, <code>animate-pulse</code>, shimmer. Elas comunicam &ldquo;está carregando&rdquo;, que é estado: um spinner congelado não informa nada.
      </DocNote>
    </>
  )
}
