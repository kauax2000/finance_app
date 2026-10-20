"use client"

import { SignalSlashIcon } from "@heroicons/react/16/solid"

import { AnnouncementBar } from "@/components/ui/announcement-bar"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { cn } from "@/lib/utils"

/**
 * O aviso de modo offline no desktop: a faixa fixa no topo, tom `warning` — o
 * app funciona pela metade, e o cinza diria que está tudo normal.
 *
 * No telefone ela não aparece (rodada 347): o cabeçalho de lá é só borrão, o
 * conteúdo passa por baixo dele, e uma faixa presa ali cortava a tela em duas.
 * Lá o aviso é a `OfflinePill`, no acessório da barra de baixo.
 */
export function OfflineBanner() {
  const shell = usePwaShellOptional()
  if (!shell || shell.isOnline) return null

  return (
    <AnnouncementBar
      tone="warning"
      position="fixed"
      icon={<SignalSlashIcon />}
      className="hidden md:flex"
    >
      Você está offline. Alterações serão sincronizadas quando a conexão voltar.
    </AnnouncementBar>
  )
}

/**
 * O aviso de offline do telefone: a pílula acima da barra de baixo, como o "Sem
 * conexão" do iOS (rodadas 347 e 348). Mora no `accessory` da `BottomBar`, que a
 * centra a 8px da barra — antes ela fazia a conta da altura da barra por fora e,
 * com o CSS velho do servidor de desenvolvimento, encostava nela.
 *
 * O fundo é o vidro no tom de aviso (`--warning-muted` translúcido com o borrão,
 * a tinta `--warning-muted-foreground` medida contra ele em
 * `scripts/tone-contrast.mjs`), o anel na própria tinta e a sombra da barra.
 * Brota de baixo no gesto dos menus (`menu-morph`), terminando cápsula.
 */
export function OfflinePill() {
  const shell = usePwaShellOptional()
  if (!shell || shell.isOnline) return null

  return (
    <div
      role="status"
      className={cn(
        "glass-surface bg-warning-muted/90 supports-backdrop-filter:bg-warning-muted/75 reduced-transparency:bg-warning-muted",
        "text-warning-muted-foreground ring-1 ring-warning-muted-foreground/20 shadow-lg",
        "flex h-9 items-center gap-1.5 rounded-full ps-3 pe-3.5 text-sm font-medium whitespace-nowrap",
        "origin-bottom [--morph-radius:calc(infinity*1px)] [animation:menu-morph_380ms_linear_backwards]"
      )}
    >
      <SignalSlashIcon aria-hidden className="size-4 shrink-0" />
      Você está offline
      <span className="sr-only">. Alterações serão sincronizadas quando a conexão voltar.</span>
    </div>
  )
}
