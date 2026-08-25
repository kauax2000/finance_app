"use client"

import { XMarkIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const announcementBarVariants = cva(
  "flex w-full items-center gap-3 px-4 py-2.5 text-sm",
  {
    variants: {
      tone: {
        // O neutro faltava: um aviso sem gravidade era obrigado a se pintar de
        // `info`, que promete informação nova.
        default: "bg-muted text-muted-foreground",
        info: "bg-info-muted text-info-muted-foreground",
        success: "bg-success-muted text-success-muted-foreground",
        warning: "bg-warning-muted text-warning-muted-foreground",
        destructive:
          "bg-destructive-muted text-destructive-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  }
)

/**
 * Faixa de largura total para um aviso que vale para a sessão inteira: modo
 * offline, convite pendente, manutenção programada.
 *
 * Não é um `Alert`. O Alert fica dentro do conteúdo e fala de uma coisa da tela;
 * este atravessa o topo do app e fala de estado global. Dispensável por padrão,
 * porque um aviso permanente que não se pode fechar vira ruído em uma semana.
 */
function AnnouncementBar({
  className,
  tone,
  onDismiss,
  dismissLabel = "Dispensar aviso",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof announcementBarVariants> & {
    onDismiss?: () => void
    dismissLabel?: string
  }) {
  return (
    <div
      data-slot="announcement-bar"
      role="status"
      className={cn(announcementBarVariants({ tone }), className)}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-mr-1.5 shrink-0 text-current hover:bg-foreground/10 active:bg-foreground/10"
        >
          <XMarkIcon aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}

export { AnnouncementBar, announcementBarVariants }
