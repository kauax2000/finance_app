"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleMarker,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Kbd } from "@/components/ui/kbd"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TEXTO_LONGO = [
  "A fatura fecha no dia de fechamento do cartão e vence alguns dias depois. Compras feitas entre o fechamento e o vencimento não entram na fatura que está aberta: elas caem na do mês seguinte, junto com a próxima parcela de tudo o que foi parcelado.",
  "O limite disponível não acompanha o fechamento. Ele volta a subir quando o pagamento é compensado, e não quando a fatura fecha — que é a razão de o valor mostrado aqui e o do aplicativo do banco divergirem por alguns dias todo mês.",
  "Parcelas futuras aparecem na projeção, e não no orçamento do mês corrente. O orçamento conta o que sai da conta agora; a projeção conta o que já está comprometido.",
]

/** Um degrau por vez, para a espiada ser comparável entre eles. */
const ESPIADAS = [
  ["sm", "≈3 linhas. O mínimo em que a espiada ainda informa alguma coisa."],
  ["md", "≈5 linhas. O parágrafo de abertura inteiro."],
  ["lg", "≈7 linhas. Quando o começo já é a resposta para a maioria."],
] as const

export default function CollapsibleDoc() {
  return (
    <>
      <Usage>
        Um bloco que expande — o <code>Accordion</code> de um item só, sem a
        semântica de lista. Para detalhes avançados de um formulário, ou para o
        resto de um texto longo.
      </Usage>

      <DocSection
        title="Padrão"
        description={
          <>
            O gatilho é o primitivo cru de propósito: ele quase sempre veste um{" "}
            <code>Button</code> por <code>asChild</code>, e cromagem aqui vazaria
            para dentro dele. Quem quer a linha inteira desenhada usa o{" "}
            <code>Accordion</code>.
          </>
        }
        code={`<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="tertiary">
      Opções avançadas
      <CollapsibleMarker />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>…</CollapsibleContent>
</Collapsible>`}
        previewClassName="items-stretch"
      >
        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="tertiary" className="gap-1.5">
              Opções avançadas
              <CollapsibleMarker />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <p className="text-sm text-muted-foreground">
              Anexar comprovante, dividir com um membro, marcar como reembolso.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </DocSection>

      <DocSection
        title="A espiada"
        description={
          <>
            Com <code>peek</code>, o fechado vira uma amostra com a base <strong>dissolvendo</strong> — o &ldquo;mostrar mais&rdquo;. É máscara, não véu pintado: alfa não precisa saber a cor do fundo.
          </>
        }
        code={`<Collapsible>
  <CollapsibleContent peek="md">…</CollapsibleContent>
  <CollapsibleTrigger asChild>
    <Button variant="link" size="sm">Continuar lendo</Button>
  </CollapsibleTrigger>
</Collapsible>`}
        previewClassName="items-stretch"
      >
        <PeekDemo />
      </DocSection>

      <DocSection
        title="Os três degraus"
        description="São alturas de leitura, não da escada de controles: abaixo de três linhas a espiada não informa nada além do rótulo do gatilho."
        previewClassName="flex-col items-stretch gap-8"
      >
        {ESPIADAS.map(([degrau, nota]) => (
          <div key={degrau} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <code className="font-mono text-xs text-primary-accent">
                {degrau}
              </code>
              <span className="text-xs text-muted-foreground">{nota}</span>
            </div>
            <Collapsible className="w-full">
              <CollapsibleContent
                peek={degrau}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {TEXTO_LONGO.map((p) => (
                  <p key={p} className="not-last:mb-3">
                    {p}
                  </p>
                ))}
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="px-0">
                  Continuar lendo
                  <CollapsibleMarker />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        ))}
      </DocSection>

      <PropsTable
        title="Props · CollapsibleContent"
        rows={[
          {
            prop: "peek",
            type: '"none" | "sm" | "md" | "lg"',
            default: '"none"',
            description:
              "A altura do fechado: em none o conteúdo desmonta e anima de zero; nos degraus ele fica montado e dissolve na base.",
          },
          {
            prop: "forceMount",
            type: "boolean",
            description:
              "Consequência de peek, não uma segunda decisão; quem passar o seu continua ganhando.",
          },
        ]}
      />

      <DocNote title="O que está fechado ainda existe para a busca do navegador?">
        Sem <code>peek</code>, não: o conteúdo recolhido sai do DOM, e <Kbd keys="mod+f" /> não o encontra. Se precisa ser localizável, não esconda — ou use <code>peek</code>, que mantém o texto montado e na árvore de acessibilidade.
      </DocNote>

      <DocNote title="A espiada abre de uma vez, e isso é um limite conhecido">
        Em <code>peek</code> a altura não anima: o Radix mede na mesma passagem em que o estado vira aberto, e não sobra transição para começar. O que diz &ldquo;tem mais&rdquo; é a dissolução, que não depende de movimento.
      </DocNote>

      <DocNote title="Use CollapsibleMarker">
        O marcador que gira é o mesmo do <code>Accordion</code>. Não monte seta à mão no gatilho: cada consumidor que fez isso fez diferente.
      </DocNote>
    </>
  )
}

/**
 * O "mostrar mais" completo, porque ele tem uma coisa que o resto da página não
 * tem: **o rótulo do gatilho muda com o estado**. "Continuar lendo" depois de
 * aberto seria uma promessa falsa.
 */
function PeekDemo() {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleContent
        peek="md"
        className="text-sm leading-relaxed text-muted-foreground"
      >
        {TEXTO_LONGO.map((p) => (
          <p key={p} className="not-last:mb-3">
            {p}
          </p>
        ))}
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          {open ? "Mostrar menos" : "Continuar lendo"}
          <CollapsibleMarker />
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  )
}
