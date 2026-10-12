import type { ReactNode } from "react"
import { EnvelopeIcon, ExclamationTriangleIcon, UserGroupIcon } from "@heroicons/react/24/outline"

import { AuthShell } from "@/components/layout/auth-shell"
import { EmptyStateIcon } from "@/components/ui/empty-state"

const ICONE = {
    mail: <EmptyStateIcon className="[--empty-state-icon:--spacing(12)]"><EnvelopeIcon /></EmptyStateIcon>,
    done: <EmptyStateIcon variant="done" className="[--empty-state-icon:--spacing(12)]" />,
    expired: <EmptyStateIcon tone="warning" className="[--empty-state-icon:--spacing(12)]"><ExclamationTriangleIcon /></EmptyStateIcon>,
    invite: <EmptyStateIcon className="[--empty-state-icon:--spacing(12)]"><UserGroupIcon /></EmptyStateIcon>,
} as const

/**
 * A tela de status da jornada de acesso: um ícone, o que aconteceu, o que
 * fazer agora. Confira seu e-mail, senha atualizada, link expirado e convite
 * aceito têm a mesma forma — antes cada um era um arranjo.
 */
export function AuthStatus({
    title,
    description,
    icon = "mail",
    scene,
    step,
    footer,
    children,
}: {
    title: string
    description: ReactNode
    icon?: keyof typeof ICONE
    scene: ReactNode
    step?: string
    footer?: ReactNode
    /** As ações: a primária primeiro, a `tertiary` depois. */
    children?: ReactNode
}) {
    return (
        <AuthShell
            title={title}
            description={description}
            media={ICONE[icon]}
            scene={scene}
            step={step ?? title}
            footer={footer}
        >
            {children ? <div className="flex flex-col gap-3">{children}</div> : null}
        </AuthShell>
    )
}
