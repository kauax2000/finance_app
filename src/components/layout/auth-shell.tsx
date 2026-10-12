"use client"

import type { ReactNode } from "react"
import { EnvelopeIcon, ExclamationTriangleIcon, UserGroupIcon } from "@heroicons/react/24/outline"

import { useAuthScene, type AuthSceneId } from "@/components/auth/showcase/scene-context"
import { EmptyStateIcon } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { SplitShellMain } from "@/components/ui/split-shell"

const ICONE = {
    mail: <EmptyStateIcon><EnvelopeIcon /></EmptyStateIcon>,
    done: <EmptyStateIcon variant="done" />,
    expired: <EmptyStateIcon tone="warning"><ExclamationTriangleIcon /></EmptyStateIcon>,
    invite: <EmptyStateIcon><UserGroupIcon /></EmptyStateIcon>,
} as const

/**
 * A coluna das telas de acesso: um `SplitShellMain` dentro do casco que mora
 * no layout de `(auth)` (`AuthFrame`).
 *
 * **Todo estado de todo formulário devolve um `AuthShell` no mesmo lugar da
 * árvore** — o formulário, o "Confira seu e-mail", o link expirado, a porta do
 * convite. Assim a coluna não remonta ao trocar de estado, o `step` muda e o
 * foco vai ao título; antes, a tela de status era outro componente, a coluna
 * remontava com o passo novo e o foco caía no `<body>`.
 *
 * Com `icon`, é a tela de status: o ícone acima do título e as ações
 * empilhadas (a primária primeiro, a `tertiary` depois).
 *
 * `scene` é o id que o painel de marca desenha, publicado por `useAuthScene`.
 */
export function AuthShell({
    scene,
    title,
    description,
    icon,
    back,
    footer,
    step,
    children,
}: {
    scene: AuthSceneId
    title: string
    description?: ReactNode
    icon?: keyof typeof ICONE
    /** O topo da coluna: o `SplitShellBack`. */
    back?: ReactNode
    /** O `SplitShellFooter`, logo abaixo do formulário. */
    footer?: ReactNode
    /** O passo do fluxo; ao mudar, o conteúdo desliza e o foco vai ao título. */
    step?: string | number
    children?: ReactNode
}) {
    useAuthScene(scene)
    return (
        <SplitShellMain
            media={icon ? <span className="contents [--empty-state-icon:--spacing(12)]">{ICONE[icon]}</span> : undefined}
            title={title}
            description={description}
            back={back}
            step={step}
        >
            {icon && children ? <div className="flex flex-col gap-3">{children}</div> : children}
            {/* O pé mora junto do formulário, e não preso à base da coluna:
                "Criar conta" é a alternativa a ele, e longe dele some. */}
            {footer}
        </SplitShellMain>
    )
}

/**
 * A espera dos formulários que leem `useSearchParams`.
 *
 * Eles precisam de `<Suspense>` para a rota continuar pré-renderizável, e o
 * fallback anterior era um `div` com `animate-pulse` e uma altura chutada
 * (`h-80` no login, `h-[28rem]` no cadastro) — dois números que descreviam o
 * cartão que não existe mais. Aqui a espera tem a forma do que vem: campos e
 * botão, no mesmo degrau `xl`.
 */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
    return (
        <div className="flex flex-col gap-(--space-block)" aria-hidden>
            {Array.from({ length: fields }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-full" />
                </div>
            ))}
            <Skeleton className="h-10 w-full rounded-full" />
        </div>
    )
}
