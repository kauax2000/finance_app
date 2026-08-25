"use client"

import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const LAYERS = [
  ["--z-base", "0", "o conteúdo da página"],
  ["--z-raised", "10", "o que se destaca sem sair do fluxo: ponto de timeline, cabeçalho grudado no desktop"],
  ["--z-sticky", "20", "a alça de redimensionar da sidebar"],
  ["--z-banner", "30", "a faixa de offline, abaixo do cabeçalho"],
  ["--z-header", "40", "o cabeçalho fixo do telefone"],
  ["--z-modal", "50", "Dialog, AlertDialog, Drawer, Tooltip, HoverCard, Menubar, ContextMenu"],
  ["--z-sheet", "70", "a folha lateral, que cobre o modal"],
  ["--z-popover", "80", "Popover, DropdownMenu e Select — abrem por cima da folha"],
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

      <DocNote title="A escala foi corrigida para descrever a produção">
        A primeira versão inventou os números: dizia <code>--z-sheet: 50</code> e <code>--z-popover: 60</code> enquanto o app rodava 70 e 80, e não tinha degrau para o 50, onde moram Dialog, Drawer e os menus do Radix. Migrar teria empilhado a folha no nível do diálogo.
      </DocNote>

      <DocNote title="Dois tokens foram renomeados pelo que está neles">
        <code>--z-overlay</code> (40) não tinha uso: escurecimento e conteúdo sempre compartilham o mesmo z. Quem mora no 40 é o cabeçalho fixo, e virou <code>--z-header</code>. <code>--z-nav-island</code> (30) nomeava a ilha, que está no 50; o 30 é a faixa de offline, e virou <code>--z-banner</code>. Token cujo nome não bate com o ocupante é pior que número cru.
      </DocNote>

      <DocNote title="Empilhamento local não é camada">
        <code>z-0</code>, <code>z-10</code> e <code>z-[1]</code> dentro de um componente são ordem entre irmãos, e continuam números crus. A escala nomeia o que atravessa telas: se a decisão se toma olhando um arquivo só, não é camada.
      </DocNote>

      <DocNote title="Escalar para vencer é sempre o sintoma">
        A toolbar de categorias tinha um <code>PopoverContent</code> em <code>z-[100]</code> — o nível do toast — e um <code>Select</code> em <code>z-[220]</code> para vencer o popover que o continha. O efeito era o popover cobrir os toasts do app inteiro. Dois portais no mesmo z se resolvem por ordem no DOM.
      </DocNote>
    </>
  )
}
