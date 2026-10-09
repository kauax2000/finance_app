"use client"

import * as React from "react"

import { Code } from "@/components/ui/code"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, SpecList, SpecRow } from "../ds-kit"

/**
 * A escada lida de cima para baixo, como ela empilha na tela: o primeiro da
 * lista é o que cobre todos os outros. Os consumidores são os que declaram o
 * token hoje (`grep "z-(--z-"`), não os que deveriam.
 */
const BANDS = [
  {
    title: "Por cima da página",
    note: "Portalizadas: abrem, fecham e cobrem as barras.",
    layers: [
      { token: "--z-toast", value: 100, use: "o aviso, sempre por último", who: ["Toaster", "o atalho “pular para o conteúdo”"] },
      { token: "--z-popover", value: 80, use: "toda superfície ancorada e portalizada — abre por cima da folha que a contém", who: ["Popover", "DropdownMenu", "ContextMenu", "Menubar", "Select", "Combobox", "Tooltip", "HoverCard"] },
      { token: "--z-sheet", value: 70, use: "cobre o modal e a barra de baixo", who: ["Sheet", "Drawer"] },
      { token: "--z-modal", value: 50, use: "o que interrompe a tela", who: ["Dialog", "AlertDialog", "CommandDialog", "BottomBar", "a tela de carregamento"] },
    ],
  },
  {
    title: "Presas à janela",
    note: "As barras: ficam enquanto o conteúdo rola por baixo.",
    layers: [
      { token: "--z-header", value: 40, use: "a barra fixa do telefone", who: ["TopBar fixa"] },
      { token: "--z-banner", value: 30, use: "a faixa de aviso, abaixo do cabeçalho", who: ["AnnouncementBar sticky", "a faixa de offline"] },
      { token: "--z-sticky", value: 20, use: "a barra grudada no desktop e o trilho fixo", who: ["TopBar sticky", "Sidebar"] },
    ],
  },
  {
    title: "No fluxo",
    note: "Rola com a página.",
    layers: [
      { token: "--z-raised", value: 10, use: "o que se destaca sem sair do fluxo", who: ["TableHeader sticky", "NavigationMenu"] },
      { token: "--z-base", value: 0, use: "o conteúdo — ninguém precisa declarar", who: [] },
    ],
  },
]

const PECAS = [
  { value: "dialog", label: "Dialog" },
  { value: "sheet", label: "Sheet" },
  { value: "popover", label: "Popover" },
  { value: "toast", label: "Toast" },
]

const peca =
  "absolute flex flex-col gap-0.5 bg-popover px-3 py-2 text-2xs text-foreground ring-1 ring-border transition-opacity duration-(--duration-base) ease-(--ease-out)"

export default function LayersDoc() {
  const [ligadas, setLigadas] = React.useState(PECAS.map((p) => p.value))
  const off = (v: string) => !ligadas.includes(v) && "pointer-events-none opacity-0"

  return (
    <>
      <Usage>
        Empilhamento é decisão global disfarçada de local. Sem escala nomeada, cada superfície nova chuta um número que funciona onde foi testada e quebra ao lado de outra. São nove degraus, e cada um existe porque tem alguém nele.
      </Usage>

      <Group
        title="A escada"
        description="Lida de cima para baixo, na ordem em que cobre a tela: o primeiro da lista fica por cima de todos."
        layout="flow"
      >
        <Spec title="Do toast ao conteúdo" meta="globals.css" bodyClassName="p-0">
          <SpecList>
          {BANDS.map((band) => (
            <SpecRow key={band.title}>
              <p className="text-2xs font-medium tracking-wider text-muted-foreground uppercase">
                {band.title}
              </p>
              <p className="text-xs text-muted-foreground">{band.note}</p>
              <ol className="mt-3 flex flex-col gap-3">
                {band.layers.map((layer) => (
                  <li
                    key={layer.token}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3"
                  >
                    <span className="nums text-right text-sm font-medium text-foreground">
                      {layer.value}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <Code variant="inline">{layer.token}</Code>
                      <span className="text-xs text-muted-foreground">
                        {layer.use}
                      </span>
                      {layer.who.length ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {layer.who.map((w) => (
                            <Code key={w}>{w}</Code>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </SpecRow>
          ))}
          </SpecList>
        </Spec>
      </Group>

      <DocSection
        title="Quem cobre quem"
        description={
          <>
            Cada peça declara só o próprio token: <code>z-(--z-sheet)</code>. No DOM elas estão na ordem inversa, e mesmo assim o popover abre sobre a folha e o toast fica por cima de tudo — quem decide é a escala. A moldura é <code>isolate</code>, senão o toast daqui cobriria o cabeçalho do catálogo.
          </>
        }
        code={`<SheetContent className="z-(--z-sheet)">…</SheetContent>
<PopoverContent className="z-(--z-popover)">…</PopoverContent>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          value={ligadas}
          onValueChange={setLigadas}
          aria-label="Superfícies na tela"
          className="self-start"
        >
          {PECAS.map((p) => (
            <ToggleGroupItem key={p.value} value={p.value}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* O palco publica o raio e o recuo (`right-3` mais o fio) para o toast,
            que encosta no canto, vestir `concentric`: 22 − 13 = 9 (rodada
            241m). As peças do meio não encostam em borda nenhuma e ficam na
            superfície. */}
        <div className="relative isolate h-72 overflow-hidden rounded-surface border border-border bg-background [--radius-parent:var(--radius-surface)] [--radius-inset:calc(--spacing(3)+1px)]">
          <div
            className={cn(peca, "concentric right-3 bottom-3 z-(--z-toast) shadow-lg", off("toast"))}
          >
            <span className="font-medium">Toast</span>
            <Code variant="inline" className="text-2xs text-muted-foreground">
              --z-toast
            </Code>
          </div>

          <div
            className={cn(peca, "rounded-surface top-24 right-24 z-(--z-popover) shadow-md", off("popover"))}
          >
            <span className="font-medium">Popover</span>
            <Code variant="inline" className="text-2xs text-muted-foreground">
              --z-popover
            </Code>
          </div>

          <div className={cn("absolute inset-0 z-(--z-sheet) transition-opacity duration-(--duration-base) ease-(--ease-out)", off("sheet"))}>
            <div className="absolute inset-0 bg-overlay" />
            <div className="absolute inset-y-0 right-0 flex w-40 flex-col gap-0.5 border-l border-border bg-background p-3 text-2xs">
              <span className="font-medium text-foreground">Sheet</span>
              <Code variant="inline" className="text-2xs text-muted-foreground">
                --z-sheet
              </Code>
            </div>
          </div>

          <div className={cn("absolute inset-0 z-(--z-modal) transition-opacity duration-(--duration-base) ease-(--ease-out)", off("dialog"))}>
            <div className="absolute inset-0 bg-overlay" />
            <div className={cn(peca, "rounded-surface top-1/2 left-1/2 w-44 -translate-1/2 py-6 shadow-xl")}>
              <span className="font-medium">Dialog</span>
              <Code variant="inline" className="text-2xs text-muted-foreground">
                --z-modal
              </Code>
            </div>
          </div>

          <div className="absolute inset-x-0 top-0 z-(--z-sticky) flex h-9 items-center gap-2 border-b border-border bg-background px-3 text-2xs">
            <span className="font-medium text-foreground">TopBar</span>
            <Code variant="inline" className="text-2xs text-muted-foreground">
              --z-sticky
            </Code>
          </div>

          <div aria-hidden className="absolute inset-0 z-(--z-base) flex flex-col gap-2 px-4 pt-14">
            <div className="h-3 w-1/3 rounded-sm bg-muted" />
            <div className="h-3 w-2/3 rounded-sm bg-muted" />
            <div className="h-3 w-1/2 rounded-sm bg-muted" />
            <div className="mt-3 h-16 w-full rounded-surface bg-muted" />
            <div className="h-3 w-3/5 rounded-sm bg-muted" />
          </div>
        </div>
      </DocSection>

      <DocNote title="Escalar para vencer é sempre o sintoma">
        Se um popover precisa passar de <code>--z-popover</code>, o errado é quem o contém — subir o número faz ele cobrir os toasts do app inteiro. O <code>DatePicker</code> já escalou até <code>--z-toast</code> para vencer uma disputa que <code>--z-popover</code> já ganhava.
      </DocNote>

      <DocNote title="Véu e conteúdo dividem o degrau">
        O overlay de um <code>Dialog</code> e o próprio diálogo estão no mesmo <code>--z-modal</code>; quem põe o conteúdo por cima é a ordem no DOM. Dois portais no mesmo degrau se resolvem igual — o último a abrir fica por cima.
      </DocNote>

      <DocNote title="Toda superfície ancorada e portalizada é --z-popover">
        Tooltip, HoverCard, ContextMenu e Menubar já estiveram em <code>--z-modal</code>, no mesmo degrau do <code>Dialog</code>, e um tooltip dentro de um diálogo era decidido pelo DOM. A exceção é o <code>NavigationMenu</code>: ele não é portalizado, e em <code>--z-popover</code> o painel pintava por cima do cabeçalho — por isso mora em <code>--z-raised</code>.
      </DocNote>

      <DocNote title="Empilhamento local não é camada">
        <code>z-0</code>, <code>z-10</code> e <code>-z-10</code> dentro de um componente são ordem entre irmãos, e continuam números crus. Um <code>z</code> negativo precisa de <code>isolate</code> no pai, senão cai atrás do fundo de um ancestral e some. A escala nomeia o que atravessa telas: se a decisão se toma olhando um arquivo só, não é camada.
      </DocNote>
    </>
  )
}
