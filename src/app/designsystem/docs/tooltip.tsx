"use client"

import { InformationCircleIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LADOS = ["top", "right", "bottom", "left"] as const

export default function TooltipDoc() {
  return (
    <>
      <Usage>
        Um <strong>complemento curto</strong> para quem já entendeu o essencial:
        o nome de um ícone, o porquê de um botão estar desligado. Nunca
        informação necessária — no telefone não existe hover, e o tooltip
        simplesmente não aparece.
      </Usage>

      <DocSection
        title="Padrão"
        description="O TooltipProvider já está montado no layout raiz; não repita. O gatilho usa asChild para envolver o controle que já existe, em vez de acrescentar um elemento focável a mais."
        code={`<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="icon-md" aria-label="Sobre o cálculo">
      <InformationCircleIcon aria-hidden />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Considera só transações efetivadas.</TooltipContent>
</Tooltip>`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-md" aria-label="Sobre o cálculo">
              <InformationCircleIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Considera só transações efetivadas.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-md" aria-label="Excluir" disabled>
              <TrashIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Só o owner remove membros.</TooltipContent>
        </Tooltip>
      </DocSection>

      <DocSection
        title="Lado"
        description="side escolhe de onde ele sai, e a entrada desliza a partir do gatilho — o movimento aponta para quem o abriu. O Radix vira o lado sozinho quando falta espaço na tela."
        code={`<TooltipContent side="right">Copiar link</TooltipContent>`}
      >
        {LADOS.map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="tertiary" size="sm">
                {side}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>Sai por {side}</TooltipContent>
          </Tooltip>
        ))}
      </DocSection>

      <DocSection
        title="Texto que não cabe numa linha"
        description="max-w-xs quebra e a caixa cresce. Até esta rodada ela tinha altura fixa de 32px e cortava a segunda linha — mas o limite continua sendo de intenção, não de layout: se precisa de duas linhas, provavelmente não é tooltip."
        code={`<TooltipContent>
  Fatura fechada. Lançamentos novos entram na próxima.
</TooltipContent>`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="tertiary" size="sm">
              Duas linhas
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Fatura fechada. Lançamentos novos entram na próxima.
          </TooltipContent>
        </Tooltip>
      </DocSection>

      <DocNote title="No toque ele não existe">
        Se a explicação é indispensável, ela vira texto na tela, um{" "}
        <code>Popover</code>{" "}
        acionado por toque, ou a descrição de um campo — nunca um tooltip. É a
        regra que decide se ele cabe: <strong>a tela funciona sem ele?</strong>{" "}
        Se não funciona, o conteúdo está no lugar errado.
      </DocNote>

      <DocNote title="Tooltip não substitui aria-label">
        Um botão só de ícone precisa dos <strong>dois</strong>: o{" "}
        <code>aria-label</code> para ser anunciado e o tooltip para ser lido. O
        Radix liga o tooltip por <code>aria-describedby</code>, que{" "}
        <em>complementa</em>{" "}
        o nome acessível e não o cria — sem o rótulo, o leitor de tela anuncia
        &ldquo;botão&rdquo; e mais nada.
      </DocNote>

      <DocNote title="A superfície é a de overlay, e não a da sidebar">
        Ele pintava com <code>bg-sidebar-accent</code>{" "}
        e <code>text-sidebar-accent-foreground</code>{" "}
        — tokens de uma região específica, num elemento que flutua sobre a tela
        inteira. O preço apareceu sozinho: ao corrigir o item ativo do menu
        lateral, que era o mesmo cinza da lateral,{" "}
        <strong>o tooltip mudou de cor junto</strong>. Hoje ele usa{" "}
        <code>--popover</code>, a mesma superfície do <code>Popover</code>{" "}
        e do <code>DropdownMenu</code>.
      </DocNote>

      <PropsTable
        title="Props do TooltipContent"
        rows={[
          {
            prop: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"top"',
            description: "De onde ele sai. Vira sozinho quando falta espaço.",
          },
          {
            prop: "sideOffset",
            type: "number",
            default: "6",
            description: "Distância até o gatilho.",
          },
          {
            prop: "align",
            type: '"start" | "center" | "end"',
            default: '"center"',
            description: "Alinhamento ao longo do lado escolhido.",
          },
        ]}
      />
    </>
  )
}
