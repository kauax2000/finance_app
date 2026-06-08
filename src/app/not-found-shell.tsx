import Link from "next/link"
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline"

import { ROUTES } from "@/config/navigation"
import { buttonVariants } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

export function NotFoundShell() {
    return (
        <div className="flex min-h-dvh w-full flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6">
            <div className="mx-auto w-full max-w-md space-y-8">
                <EmptyState className="w-full border-border/80 bg-card/40 py-10">
                    <EmptyStateIcon>
                        <QuestionMarkCircleIcon aria-hidden />
                    </EmptyStateIcon>
                    <EmptyStateTitle>Página não encontrada</EmptyStateTitle>
                    <EmptyStateDescription>
                        O endereço não existe ou foi movido. Verifique o link ou
                        volte ao painel.
                    </EmptyStateDescription>
                    <EmptyStateActions>
                        <Link
                            href={ROUTES.DASHBOARD}
                            className={buttonVariants({ variant: "default" })}
                        >
                            Ir para o painel
                        </Link>
                        <Link
                            href="/"
                            className={buttonVariants({ variant: "outline" })}
                        >
                            Página inicial
                        </Link>
                    </EmptyStateActions>
                </EmptyState>
                <p
                    data-slot="typography-muted"
                    className={cn("block text-center text-xs text-muted-foreground")}
                >
                    Erro 404 — nada para exibir neste caminho.
                </p>
            </div>
        </div>
    )
}
