import type { ReactNode } from "react"

import { AuthBrandPanel } from "@/components/layout/auth-brand-panel"
import { Skeleton } from "@/components/ui/skeleton"
import { SplitShell } from "@/components/ui/split-shell"

/**
 * O casco das telas de acesso: o `SplitShell` com o painel de marca deste
 * produto encaixado.
 *
 * São poucas linhas, e elas existem para que as cinco telas não repitam
 * `aside={<AuthBrandPanel />}` — e, mais importante, para que o Template do
 * design system continue sem saber o que é uma carteira. O genérico mora em
 * `ui/split-shell.tsx`; o que é deste produto mora aqui e no
 * `auth-brand-panel.tsx`, na mesma prateleira de `auth-guard.tsx`.
 */
export function AuthShell({
    title,
    description,
    back,
    footer,
    step,
    scene,
    media,
    children,
}: {
    title: string
    description?: ReactNode
    /** O topo da coluna: o `SplitShellBack`. */
    back?: ReactNode
    /** O pé da coluna: o `SplitShellFooter`. */
    footer?: ReactNode
    /** O passo do fluxo; ao mudar, o conteúdo desliza e o foco vai ao título. */
    step?: string | number
    /** A cena do painel de marca: cada tela mostra o pedaço do produto que lhe cabe. */
    scene: ReactNode
    /** O ícone ou ilustração acima do título (a tela de status). */
    media?: ReactNode
    children: ReactNode
}) {
    return (
        <SplitShell
            aside={<AuthBrandPanel>{scene}</AuthBrandPanel>}
            side="end"
            asideMobile="logo"
            media={media}
            title={title}
            description={description}
            back={back}
            footer={footer}
            step={step}
        >
            {children}
        </SplitShell>
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
