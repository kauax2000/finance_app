"use client"

import { createElement } from "react"
import { UserGroupIcon } from "@heroicons/react/24/outline"
import { ColorTile } from "@/components/ui/color-tile"
import { cn } from "@/lib/utils"
import { getWorkspaceIconComponent } from "@/lib/workspace-icons"

type WorkspaceBrandMarkProps = {
    iconKey: string
    backgroundColor: string
    className?: string
    iconClassName?: string
}

/**
 * A marca da carteira é a cor escolhida pela pessoa, e cor de runtime é trabalho
 * do `ColorTile`: ele escolhe a tinta pelo contraste. O `text-white` cru sumia
 * sobre cores claras.
 */
export function WorkspaceBrandMark({
    iconKey,
    backgroundColor,
    className,
    iconClassName,
}: WorkspaceBrandMarkProps) {
    const Cmp = getWorkspaceIconComponent(iconKey) ?? UserGroupIcon

    return (
        <ColorTile color={backgroundColor} className={cn("shrink-0", className)}>
            {createElement(Cmp, {
                className: cn("size-3.5", iconClassName),
                "aria-hidden": true,
            })}
        </ColorTile>
    )
}
