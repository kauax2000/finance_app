"use client"

import { SignalSlashIcon } from "@heroicons/react/16/solid"

import { AnnouncementBar } from "@/components/ui/announcement-bar"
import { usePwaShellOptional } from "@/components/pwa/pwa-shell-context"

/**
 * O aviso de modo offline.
 *
 * Ele era um `Alert` desfazendo a própria forma em cinco classes — `rounded-none
 * border-x-0 border-t-0` mais o posicionamento — com `AlertDescription` sem
 * `AlertTitle`, o que a documentação do `Alert` proíbe. O `AGENTS.md` já o
 * registrava como "um Alert fingindo de AnnouncementBar", e é o componente
 * certo que estava faltando: faixa de largura total sobre estado global.
 *
 * **O tom deixa de ser `default`.** Cinza neutro para um estado que é, por
 * definição, degradado — o app está funcionando pela metade, e a cor dizia que
 * estava tudo normal. `warning` é o que o estado é.
 *
 * **O posicionamento continua `fixed`, e não `sticky`.** A variante `sticky` do
 * componente existe e seria melhor aqui — em fluxo, a barra empurra o conteúdo
 * em vez de cobrir a primeira linha dele. Mas esta faixa é irmã do shell e
 * passa por baixo de um cabeçalho fixo no telefone (daí o
 * `--mobile-header-offset`), e trocar o modo de posicionamento é uma mudança de
 * layout que **não deu para verificar**: a tela exige sessão autenticada. Fica
 * como está, e a troca vira item de backlog para quem puder abrir o app.
 */
export function OfflineBanner() {
  const shell = usePwaShellOptional()
  if (!shell || shell.isOnline) return null

  return (
    <AnnouncementBar
      tone="warning"
      className="fixed inset-x-0 top-[var(--mobile-header-offset)] z-(--z-banner) border-b border-current/20 md:top-0"
    >
      <SignalSlashIcon aria-hidden />
      Você está offline. Alterações serão sincronizadas quando a conexão voltar.
    </AnnouncementBar>
  )
}
