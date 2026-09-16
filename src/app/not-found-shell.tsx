import { Container } from "@/components/ui/container"
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

import { ROUTES } from "@/config/navigation"
import { Button } from "@/components/ui/button"
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
            <Container size="sm" stack="section">
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
                        <Button asChild>
                            <Link href={ROUTES.DASHBOARD}>Ir para o painel</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/">Página inicial</Link>
                        </Button>
                    </EmptyStateActions>
                </EmptyState>
                <p
                    data-slot="typography-muted"
                    className={cn("block text-center text-xs text-muted-foreground")}
                >
                    Erro 404 — nada para exibir neste caminho.
                </p>
            </Container>
        </div>
    )
}
