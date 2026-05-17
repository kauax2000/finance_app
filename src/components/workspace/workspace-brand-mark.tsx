"use client"

import { createElement } from "react"
import { UserGroupIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { getWorkspaceIconComponent } from "@/lib/workspace-icons"

type WorkspaceBrandMarkProps = {
    iconKey: string
    backgroundColor: string
    className?: string
    iconClassName?: string
}

export function WorkspaceBrandMark({
    iconKey,
    backgroundColor,
    className,
    iconClassName,
}: WorkspaceBrandMarkProps) {
    const Cmp = getWorkspaceIconComponent(iconKey) ?? UserGroupIcon
    const glyphClass = cn("size-3.5", iconClassName)

    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-md text-white shadow-sm",
                className
            )}
            style={{ backgroundColor }}
        >
            {createElement(Cmp, {
                className: glyphClass,
                "aria-hidden": true,
            })}
        </div>
    )
}
