"use client"

import { InformationCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
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
        Um <strong>complemento curto</strong>: o nome de um ícone, o porquê de um botão estar desligado. Nunca informação necessária — no telefone não há hover e ele não aparece. Explicação indispensável vira texto na tela ou um <code>Popover</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O TooltipProvider já está no layout raiz; não repita. O gatilho usa asChild para envolver o controle existente, sem acrescentar um focável."
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
        description="side escolhe de onde ele sai; a entrada desliza a partir do gatilho. O Radix vira o lado quando falta espaço."
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
        title="Tamanho"
        description="md (14px) é o padrão, para uma frase. sm (12px, recuo menor) rotula ícones em fileira densa, como a coluna de ações da Table."
        code={`<TooltipContent size="sm">Editar Mercado</TooltipContent>`}
      >
        {(["sm", "md"] as const).map((size) => (
          <Tooltip key={size}>
            <TooltipTrigger asChild>
              <Button variant="tertiary" size="icon-sm" aria-label={`Editar Mercado (${size})`}>
                <PencilIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent size={size}>Editar Mercado</TooltipContent>
          </Tooltip>
        ))}
      </DocSection>

      <DocSection
        title="Texto que não cabe numa linha"
        description="max-w-xs quebra e a caixa cresce. Mas se precisa de duas linhas, provavelmente não é tooltip."
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

      <DocNote title="A tela funciona sem ele?">
        Se não funciona, o conteúdo está no lugar errado: vira texto na tela, um <code>Popover</code> acionado por toque ou a descrição de um campo.
      </DocNote>

      <DocNote title="Tooltip não substitui aria-label">
        Botão só de ícone precisa dos dois. O Radix liga o tooltip por <code>aria-describedby</code>, que complementa o nome acessível e não o cria — sem rótulo, o leitor de tela anuncia &ldquo;botão&rdquo; e mais nada.
      </DocNote>

      <DocNote title="Veste a superfície de menu, nunca tokens de região">
        <code>menuPanelSurfaceClassName</code> dá o <code>--popover</code>, o canto de 10px, o <code>ring-1</code> e o material com guarda de <code>prefers-reduced-transparency</code> — a mesma casca de <code>Popover</code>, <code>Select</code> e menus. Tokens de <code>sidebar</code> num elemento que flutua mudam de cor quando a lateral muda.
      </DocNote>

      <DocNote title="O alfa da superfície serve sem ajuste">
        O corpo é <code>--popover-foreground</code>, tinta cheia, então passa de 4,5:1 com folga mesmo sobre o preenchimento do botão <code>primary</code>.
      </DocNote>

      <PropsTable
        title="Props do TooltipContent"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "md é 14px, para uma frase; sm é 12px, para rotular ícone em fileira densa.",
          },
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
          {
            prop: "collisionPadding",
            type: "number | Padding",
            default: "ANCHORED_COLLISION_PADDING (8)",
            description:
              "A folga até a borda da janela, de lib/anchored-surface.",
          },
        ]}
      />

      <DocNote title="Ele encolhe antes de encostar">
        <code>max-w-xs</code> é o teto de leitura; <code>max-w-(--radix-tooltip-content-available-width)</code> é o da janela, e o menor vence — deslocar não resolve o que não cabe. A folga de 8px vem de <code>lib/anchored-surface</code>, como em toda superfície ancorada.
      </DocNote>
    </>
  )
}
