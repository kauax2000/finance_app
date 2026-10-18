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
            >
                <NotificationsPanel isActive={isOpen} />
            </SheetContent>
        </Sheet>
    )
}
