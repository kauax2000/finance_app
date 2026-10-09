"use client"

import * as React from "react"
import {
  CheckIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const LADOS = ["top", "right", "bottom", "left"] as const

function DemoCopiar() {
  const [copiado, setCopiado] = React.useState(false)
  return (
    <Tooltip confirmation={copiado ? "Link copiado" : null}>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-md"
          aria-label={copiado ? "Link copiado" : "Copiar link"}
          onClick={() => {
            setCopiado(true)
            window.setTimeout(() => setCopiado(false), 2000)
          }}
        >
          {copiado ? <CheckIcon className="text-success" /> : <DocumentDuplicateIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copiar link</TooltipContent>
    </Tooltip>
  )
}

export default function TooltipDoc() {
  return (
    <>
      <Usage>
        Um <strong>complemento curto</strong>: o nome de um ícone, o atalho de uma ação, o porquê de um botão estar desligado. Nunca informação necessária — no telefone não há cursor e ele não aparece. Explicação indispensável vira texto na tela ou um <code>Popover</code>; conteúdo que se aponta é o <code>HoverCard</code>.
      </Usage>

      <DocSection
        title="Padrão, e sobre um controle desabilitado"
        description="O TooltipProvider já está no layout raiz; não repita. O gatilho usa asChild para envolver o controle existente. Se o filho está disabled, o gatilho o embrulha sozinho num alvo focável — um botão desligado não recebe ponteiro nem foco, e a dica que explica o porquê nunca abria."
        code={`<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="icon-md" aria-label="Excluir" disabled>
      <TrashIcon aria-hidden />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Só o owner remove membros.</TooltipContent>
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
        title="A confirmação do clique"
        description="confirmation: enquanto existir, a dica fica aberta mostrando-a, e ela é anunciada ao leitor de tela. Quem a liga é a tela, pelo resultado da ação — uma cópia que falha não confirma nada. Sem ela o Radix fecha a dica no clique, e o “Copiado” que as telas trocavam dentro da dica nunca aparecia. Clique."
        code={`<Tooltip confirmation={copiado ? "Link copiado" : null}>
  <TooltipTrigger asChild>
    <Button aria-label="Copiar link" onClick={copiar}>…</Button>
  </TooltipTrigger>
  <TooltipContent>Copiar link</TooltipContent>
</Tooltip>`}
      >
        <DemoCopiar />
      </DocSection>

      <DocSection
        title="Com atalho"
        description="shortcut, na grafia do Kbd: a tecla entra à direita do texto, com ⌘ no Mac e Ctrl no resto. É o que o botão de recolher a lateral mostra — o ⌘B existia e nada na tela dizia."
        code={`<TooltipContent shortcut="mod+b">Recolher barra lateral</TooltipContent>`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="tertiary" size="icon-md" aria-label="Buscar">
              <MagnifyingGlassIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent shortcut="mod+k">Buscar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="tertiary" size="icon-md" aria-label="Buscar (contraste)">
              <MagnifyingGlassIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent variant="contrast" shortcut="mod+k">
            Buscar
          </TooltipContent>
        </Tooltip>
      </DocSection>

      <DocSection
        title="Contraste e tamanho"
        description="variant=&quot;contrast&quot; é a pílula grave, preta no claro e branca no escuro, sem vidro: para o rótulo de ícone que precisa se destacar do que está atrás. size=&quot;sm&quot; (24px, texto de 12) é o padrão; size=&quot;md&quot; (32px, texto de 14) é para uma frase mais longa."
        code={`<TooltipContent variant="contrast">Editar Mercado</TooltipContent>
<TooltipContent size="md">Mantém o saldo de ontem até a fatura fechar</TooltipContent>`}
      >
        {(
          [
            ["plate", "md"],
            ["plate", "sm"],
            ["contrast", "md"],
            ["contrast", "sm"],
          ] as const
        ).map(([variant, size]) => (
          <Tooltip key={variant + size}>
            <TooltipTrigger asChild>
              <Button variant="tertiary" size="icon-sm" aria-label={`Editar Mercado (${variant}, ${size})`}>
                <PencilIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent variant={variant} size={size}>
              Editar Mercado
            </TooltipContent>
          </Tooltip>
        ))}
      </DocSection>

      <DocSection
        title="Lado"
        description="side escolhe de onde ela sai, e a caixa cresce a partir do gatilho — a origem da escala é a que o Radix publica. Ela vira o lado quando falta espaço."
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
        description="O teto é 20rem (ou a largura disponível, o que for menor), e a caixa cresce para baixo. Mas se precisa de duas linhas, provavelmente não é tooltip."
        code={`<TooltipContent>
  Fatura fechada. Lançamentos novos entram na próxima.
</TooltipContent>`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="tertiary" size="sm">
              duas linhas
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Fatura fechada. Lançamentos novos entram na próxima.
          </TooltipContent>
        </Tooltip>
      </DocSection>

      <DocNote title="Ela cresce a partir do gatilho, com mola">
        A entrada é <code>scale 0,5 → 1</code> com <code>opacity 0 → 1</code>, numa mola de <code>stiffness 300</code> e <code>damping 25</code> — subamortecida de propósito, então ela passa de 1 e volta. A origem é <code>--radix-tooltip-content-transform-origin</code>, então a caixa nasce do botão. Como é movimento de JavaScript, o bloco global de movimento reduzido não a alcança: quem a desliga é <code>useReducedMotion</code>.
      </DocNote>

      <DocNote title="Tooltip não substitui aria-label">
        Botão só de ícone precisa dos dois. O Radix liga a dica por <code>aria-describedby</code>, que complementa o nome e não o cria. E a confirmação não é anunciada por esse caminho — mudar uma descrição não fala nada —, por isso ela tem uma região viva própria.
      </DocNote>

      <DocNote title="A placa é a dos menus, e a pílula não veste a placa">
        <code>plate</code> veste <code>menuPanelSurfaceClassName</code>, a casca de <code>Popover</code>, <code>Select</code> e menus. <code>contrast</code> não a veste por baixo: a placa traz a tinta de vidro do escuro, o <code>glass-surface</code> e a variante de transparência reduzida, e cada um venceria o <code>--primary</code> num tema ou num ambiente.
      </DocNote>

      <DocNote title="Onde o app usa">
        Na coluna de ações da <code>Table</code> (<code>size=&quot;sm&quot;</code>, o nome de cada ícone), no trilho recolhido da <code>Sidebar</code> e, desde a rodada 185, no botão de recolher a lateral, com o atalho. E no botão de copiar o link de convite, na tela de membros e no diálogo de convite: ele trocava a dica para &ldquo;Copiado&rdquo;, que nunca aparecia porque o clique fecha a dica; hoje é <code>confirmation</code>.
      </DocNote>

      <PropsTable
        title="Props"
        rows={[
          { prop: "Tooltip · confirmation", type: "ReactNode", description: "Enquanto existir, a dica fica aberta mostrando-a, e ela é anunciada. Ligue pelo resultado da ação." },
          { prop: "TooltipContent · variant", type: '"plate" | "contrast"', default: '"plate"', description: "A placa dos menus, ou a pílula grave." },
          { prop: "TooltipContent · size", type: '"sm" | "md"', default: '"sm"', description: "sm (24px, texto de 12) é o padrão; md (32px, texto de 14) para uma frase mais longa." },
          { prop: "TooltipContent · shortcut", type: "string", description: 'O atalho, na grafia do Kbd ("mod+b").' },
          { prop: "TooltipContent · side · align", type: "Radix", default: '"top" · "center"', description: "De onde sai e como se alinha. Vira sozinho quando falta espaço." },
          { prop: "TooltipContent · sideOffset", type: "number", default: "6", description: "Distância até o gatilho." },
        ]}
      />
    </>
  )
}
