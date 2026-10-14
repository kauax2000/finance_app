"use client"

import { createElement } from "react"
import { UserGroupIcon } from "@heroicons/react/16/solid"
import { UserGroupIcon as UserGroupMiniIcon } from "@heroicons/react/20/solid"
import { ColorTile } from "@/components/ui/color-tile"
import { cn } from "@/lib/utils"
import { getWorkspaceIconComponent, isWorkspaceIconKey, WORKSPACE_ICON_MAP_MINI } from "@/lib/workspace-icons"

type WorkspaceBrandMarkProps = {
    iconKey: string
    backgroundColor: string
    /** O degrau do `ColorTile`: `xs` 24 dentro de uma linha de menu, `md` 32 na barra lateral, `lg` 36 no resto, `xl` 40 ao lado do campo de nome. */
    size?: "xs" | "md" | "lg" | "xl"
    className?: string
    iconClassName?: string
}

/**
 * A marca da carteira é a cor escolhida pela pessoa, e cor de runtime é trabalho
 * do `ColorTile`: ele escolhe a tinta pelo contraste. O `text-white` cru sumia
 * sobre cores claras.
 *
 * **O corpo do ícone é do ladrilho, e o `size-3.5` daqui nunca desenhou nada.**
 * Medido: `[&>svg]:size-4` do degrau é um seletor de descendente (0,1,1) e a
 * classe no próprio `svg` é 0,1,0 — `size-5`, `size-4`, `size-3` e `size-3.5`
 * computam **16px**, todas. O prop `iconClassName` continua servindo tinta e
 * opacidade; para **medida** ele é inerte, e as cinco telas que passam um
 * tamanho por ele estão pedindo o que o ladrilho não concede.
 */
export function WorkspaceBrandMark({
    iconKey,
    backgroundColor,
    size = "lg",
    className,
    iconClassName,
}: WorkspaceBrandMarkProps) {
    // O `xl` desenha o ícone a 20px, e 20px é o mini (`20/solid`).
    const Cmp =
        size === "xl"
            ? (isWorkspaceIconKey(iconKey) ? WORKSPACE_ICON_MAP_MINI[iconKey] : UserGroupMiniIcon)
            : (getWorkspaceIconComponent(iconKey) ?? UserGroupIcon)

    return (
        <ColorTile
            size={size}
            color={backgroundColor}
            className={cn("shrink-0", className)}
        >
            {createElement(Cmp, {
                className: iconClassName,
                "aria-hidden": true,
            })}
        </ColorTile>
    )
}
