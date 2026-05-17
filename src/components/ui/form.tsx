"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CustomFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}

function shouldDeferEnterToWidget(target: HTMLElement): boolean {
  if (
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  ) {
    return true
  }
  if (target.closest('[data-slot="select-trigger"]')) {
    return true
  }
  const role = target.getAttribute("role")
  if (role === "combobox" || role === "listbox") {
    return true
  }
  if (target.closest('[role="combobox"]') || target.closest('[role="listbox"]')) {
    return true
  }
  return false
}

const CustomForm = React.forwardRef<HTMLFormElement, CustomFormProps>(
  ({ className, onSubmit, onKeyDown, children, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement
        if (shouldDeferEnterToWidget(target)) {
          onKeyDown?.(e)
          return
        }
        e.preventDefault()
        const form = e.currentTarget
        let submitButton = form.querySelector(
          "button[type=\"submit\"]:not(:disabled)"
        ) as HTMLButtonElement | null
        if (!submitButton && form.id) {
          submitButton = document.querySelector(
            `button[type="submit"][form="${CSS.escape(form.id)}"]:not(:disabled)`,
          ) as HTMLButtonElement | null
        }
        if (submitButton) {
          submitButton.click()
        }
      }
      onKeyDown?.(e)
    }

    return (
      <form
        ref={ref}
        className={cn(className)}
        onSubmit={onSubmit}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </form>
    )
  }
)
CustomForm.displayName = "CustomForm"

export { CustomForm }
