"use client"

import { useSyncExternalStore } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DialogCloseButton } from "@/components/ui/dialog"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { NotificationsPanel } from "@/components/layout/notifications-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { notificationsLabVersion } from "@/lib/notifications-lab"

const semAssinatura = () => () => {}

/**
 * A versão "chapada" do laboratório (`/laboratorio/notificacoes`): o fundo de
 * antes, a placa `--popover` sólida, com o rótulo do dia na mesma cor. Por
 * extenso: classe montada não chega ao CSS.
 */
const FUNDO_CHAPADO =
    "bg-popover supports-backdrop-filter:dark:bg-popover [--item-group-label-surface:var(--color-popover)]"

export function NotificationsSheet() {
    const { isOpen, close, open } = useNotificationsUi()
    const isMobile = useIsMobile()
    // No laboratório o nome do quadro troca o fundo, para comparar; no app é o vidro.
    const versao = useSyncExternalStore(
        semAssinatura,
        () => notificationsLabVersion(window.name),
        () => "vidro" as const,
    )

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(next) => {
                if (next) open()
                else close()
            }}
        >
            {/* O nome é o título do cabeçalho; não há descrição além dele. */}
            {/* A folha padrão: à direita, flutuante e `sm` (384), sem eixo escrito. */}
            <SheetContent
                fillMobileViewport={isMobile}
                className={versao === "chapada" ? FUNDO_CHAPADO : undefined}
                aria-describedby={undefined}
            >
                <NotificationsPanel isActive={isOpen} />
                <DialogCloseButton label="Fechar notificações" />
            </SheetContent>
        </Sheet>
    )
}
