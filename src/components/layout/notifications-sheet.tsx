"use client"

import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
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
                className={cn(
                    "flex w-full flex-col gap-0 p-0",
                    isMobile
                        ? "rounded-t-xl pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
                        : "h-full max-h-[100dvh] border-l sm:max-w-md"
                )}
            >
                <DialogTitle className="sr-only">Notificações</DialogTitle>
                <DialogDescription className="sr-only">
                    Alertas e avisos da carteira atual. Marque como lidas ou exclua.
                </DialogDescription>
                <NotificationsPanel isActive={isOpen} />
            </SheetContent>
        </Sheet>
    )
}
