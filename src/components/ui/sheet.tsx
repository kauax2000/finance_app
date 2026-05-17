"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XMarkIcon } from "@heroicons/react/24/outline"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        /** Above mobile chrome (`MobileBottomNav` / FAB use z-50); below `Toaster` z-[100]. */
        "fixed inset-0 z-[70] bg-overlay ease-in-out supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-open:animation-duration-300 data-closed:animate-out data-closed:fade-out-0 data-closed:animation-duration-300",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  fillMobileViewport = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /** Bottom sheet: near-full viewport height, small top gap + safe-area; use flex children with shrink-0 header + min-h-0 flex-1 scroll body. */
  fillMobileViewport?: boolean
}) {
  const isMobileFillBottom = fillMobileViewport && side === "bottom"
  const mobileFill = isMobileFillBottom
      ? "sheet-mobile-fill sheet-mobile-fill-motion gap-0 min-h-0 overflow-hidden data-open:animate-none data-closed:animate-none motion-reduce:animate-none"
      : undefined

  /** Symmetric open/close; bottom uses a slightly iOS-like slide curve (tw-animate reads --tw-ease). */
  const motionEase =
    side === "bottom" && !isMobileFillBottom
      ? "ease-[cubic-bezier(0.32,0.72,0,1)]"
      : "ease-in-out"

  const bottomSlideOpen = isMobileFillBottom
    ? undefined
    : "data-[side=bottom]:data-open:slide-in-from-bottom-12"
  const bottomSlideClosed = isMobileFillBottom
    ? undefined
    : "data-[side=bottom]:data-closed:slide-out-to-bottom-12"

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        data-mobile-fill={isMobileFillBottom ? "true" : undefined}
        className={cn(
          "fixed z-[70] flex flex-col gap-4 bg-background bg-clip-padding text-sm shadow-lg duration-300 transition-colors will-change-transform motion-reduce:will-change-auto motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=left]:data-open:slide-in-from-left-12 data-[side=right]:data-open:slide-in-from-right-12 data-[side=top]:data-open:slide-in-from-top-12 data-closed:animate-out data-closed:fade-out-0 data-[side=left]:data-closed:slide-out-to-left-12 data-[side=right]:data-closed:slide-out-to-right-12 data-[side=top]:data-closed:slide-out-to-top-12",
          bottomSlideOpen,
          bottomSlideClosed,
          motionEase,
          mobileFill,
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              size="icon-sm"
            >
              <XMarkIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
