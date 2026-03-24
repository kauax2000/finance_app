import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function ButtonGroup({ className, children, ...props }: ButtonGroupProps) {
    return (
        <div
            data-slot="button-group"
            className={cn("inline-flex items-center justify-start", className)}
            role="group"
            {...props}
        >
            {children}
        </div>
    )
}
