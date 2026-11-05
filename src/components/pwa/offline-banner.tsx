"use client"

import { ClockIcon, SignalSlashIcon } from "@heroicons/react/16/solid"

import { AnnouncementBar } from "@/components/ui/announcement-bar"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"
import { useServidorLento } from "@/lib/servidor-lento"
import { cn } from "@/lib/utils"

/**
 * O aviso de modo offline no desktop: a faixa fixa no topo, tom `warning` — o
 * app funciona pela metade, e o cinza diria que está tudo normal.
 *
 * No telefone ela não aparece (rodada 347): o cabeçalho de lá é só borrão, o
 * conteúdo passa por baixo dele, e uma faixa presa ali cortava a tela em duas.
 * Lá o aviso é a `OfflinePill`, no acessório da barra de baixo.
 *
 * Online, o mesmo lugar avisa o servidor lento (`lib/servidor-lento`): um pedido
 * ao Supabase passou de 4s. Offline vence, porque explica a lentidão.
 */
export function OfflineBanner() {
  const shell = usePwaShellOptional()
  const lento = useServidorLento()
  const offline = !!shell && !shell.isOnline
  if (!offline && !lento) return null

  return (
    <AnnouncementBar
      tone="warning"
      position="fixed"
      icon={offline ? <SignalSlashIcon /> : <ClockIcon />}
      className="hidden md:flex"
    >
      {offline
        ? "Você está offline. Alterações serão sincronizadas quando a conexão voltar."
        : "O servidor está demorando para responder. Os dados podem levar alguns segundos para aparecer."}
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
 * Online, a mesma pílula diz "Servidor lento" (ver `OfflineBanner`).
 */
export function OfflinePill() {
  const shell = usePwaShellOptional()
  const lento = useServidorLento()
  const offline = !!shell && !shell.isOnline
  if (!offline && !lento) return null

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
      {offline ? (
        <>
          <SignalSlashIcon aria-hidden className="size-4 shrink-0" />
          Você está offline
          <span className="sr-only">. Alterações serão sincronizadas quando a conexão voltar.</span>
        </>
      ) : (
        <>
          <ClockIcon aria-hidden className="size-4 shrink-0" />
          Servidor lento
          <span className="sr-only">. Os dados podem levar alguns segundos para aparecer.</span>
        </>
      )}
    </div>
  )
}
