"use client"

import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const LAYERS = [
  ["--z-base", "0", "o conteúdo da página"],
  ["--z-raised", "10", "o que se destaca sem sair do fluxo: o cabeçalho sticky da Table e a raiz do NavigationMenu"],
  ["--z-sticky", "20", "a TopBar grudada no desktop e o trilho fixo da Sidebar"],
  ["--z-banner", "30", "a AnnouncementBar sticky — a faixa de offline, abaixo do cabeçalho"],
  ["--z-header", "40", "a TopBar fixa do telefone"],
  ["--z-modal", "50", "Dialog, AlertDialog e a BottomBar"],
  ["--z-sheet", "70", "Sheet e Drawer — cobrem o modal e a barra de baixo"],
  ["--z-popover", "80", "toda superfície ancorada e portalizada: Popover, DropdownMenu, Select, Combobox, Tooltip, HoverCard, ContextMenu, Menubar"],
  ["--z-toast", "100", "o toast, sempre por último"],
]

export default function CamadasDoc() {
  return (
    <>
      <Usage>
        Empilhamento é decisão global disfarçada de local. Sem escala nomeada, cada superfície nova chuta um número que funciona onde foi testada e quebra ao lado de outra.
      </Usage>

      <Group title="A ordem">
        <Spec title="Do conteúdo ao toast" meta="globals.css">
          <Stack className="gap-2">
            {LAYERS.map(([token, value, use]) => (
              <div key={token} className="flex items-baseline gap-3">
                <code className="w-36 shrink-0 font-mono text-2xs text-foreground">
                  {token}
                </code>
                <span className="nums w-8 shrink-0 text-right text-2xs text-muted-foreground">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground">{use}</span>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Como usar"
        code={`<header className="sticky top-0 z-(--z-sticky)">…</header>`}
      >
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-border bg-muted/30">
          <span className="absolute top-4 left-4 z-(--z-base) flex size-16 items-end justify-center rounded-lg bg-secondary pb-1 text-2xs text-secondary-foreground">
            base
          </span>
          <span className="absolute top-8 left-12 z-(--z-sticky) flex size-16 items-end justify-center rounded-lg bg-info-muted pb-1 text-2xs text-info-muted-foreground">
            sticky
          </span>
          <span className="absolute top-12 left-20 z-(--z-sheet) flex size-16 items-end justify-center rounded-lg bg-primary pb-1 text-2xs text-primary-foreground">
            sheet
          </span>
        </div>
      </DocSection>

      <DocNote title="Empilhamento local não é camada">
        <code>z-0</code>, <code>z-10</code> e <code>z-[1]</code> dentro de um componente são ordem entre irmãos, e continuam números crus. A escala nomeia o que atravessa telas: se a decisão se toma olhando um arquivo só, não é camada.
      </DocNote>

      <DocNote title="Escalar para vencer é sempre o sintoma">
        Se um popover precisa passar de <code>--z-popover</code>, o errado é quem o contém — subir o número faz ele cobrir os toasts do app inteiro. Dois portais no mesmo z se resolvem pela ordem no DOM.
      </DocNote>
    </>
  )
}
