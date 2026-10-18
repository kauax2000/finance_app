"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { NotificationsPanel } from "@/components/layout/notifications-panel"
import { useIsMobile } from "@/hooks/use-mobile"

export function NotificationsSheet() {
    const { isOpen, close, open } = useNotificationsUi()
    const isMobile = useIsMobile()

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
                aria-describedby={undefined}
                // A rampa de cima do corpo dobra (48px): com 24 o fio entre duas linhas e o
                // texto ainda cruzavam a base das abas nítidos, como uma quebra. A de baixo
                // fica nos 24 da casa.
                className="[--dialog-body-fade-h:--spacing(12)] [--dialog-body-fade-end-h:--spacing(6)]"
            >
                <NotificationsPanel isActive={isOpen} />
            </SheetContent>
        </Sheet>
    )
}
