import type { ReactNode } from "react"
import { EnvelopeIcon, ExclamationTriangleIcon, UserGroupIcon } from "@heroicons/react/24/outline"

import { AuthShell } from "@/components/layout/auth-shell"
import { EmptyStateIcon } from "@/components/ui/empty-state"

const ICONE = {
    mail: <EmptyStateIcon><EnvelopeIcon /></EmptyStateIcon>,
    done: <EmptyStateIcon variant="done" />,
    expired: <EmptyStateIcon tone="warning"><ExclamationTriangleIcon /></EmptyStateIcon>,
    invite: <EmptyStateIcon><UserGroupIcon /></EmptyStateIcon>,
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
            media={<span className="contents [--empty-state-icon:--spacing(12)]">{ICONE[icon]}</span>}
            scene={scene}
            step={step ?? title}
            footer={footer}
        >
            {children ? <div className="flex flex-col gap-3">{children}</div> : null}
        </AuthShell>
    )
}
