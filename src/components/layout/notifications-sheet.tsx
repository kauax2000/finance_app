"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import { NotificationsPanel } from "@/components/layout/notifications-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

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
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                fillMobileViewport={isMobile}
                showCloseButton={false}
                className={cn(
                    "flex w-full flex-col gap-0 p-0",
                    isMobile
                        ? "rounded-t-xl pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
                        : "h-full max-h-[100dvh] border-l sm:max-w-md"
                )}
            >
                <SheetTitle className="sr-only">Notificações</SheetTitle>
                <SheetDescription className="sr-only">
                    Alertas e avisos da carteira atual. Marque como lidas ou exclua.
                </SheetDescription>
                {isMobile ? <SheetDragHandle /> : null}
                <NotificationsPanel isActive={isOpen} />
            </SheetContent>
        </Sheet>
    )
}
