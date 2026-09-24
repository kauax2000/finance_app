import { Container } from "@/components/ui/container"
import Link from "next/link"

import { ROUTES } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateCode,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"

export function NotFoundShell() {
    return (
        <div className="flex min-h-dvh w-full flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6">
            <Container size="sm" stack="section">
                <EmptyState variant="plain" size="page" className="w-full">
                    <EmptyStateCode>404</EmptyStateCode>
                    <EmptyStateTitle>Página não encontrada</EmptyStateTitle>
                    <EmptyStateDescription>
                        O endereço não existe ou foi movido. Verifique o link ou
                        volte ao painel.
                    </EmptyStateDescription>
                    <EmptyStateActions>
                        <Button asChild>
                            <Link href={ROUTES.DASHBOARD}>Ir para o painel</Link>
                        </Button>
                        <Button asChild variant="tertiary">
                            <Link href="/">Página inicial</Link>
                        </Button>
                    </EmptyStateActions>
                </EmptyState>
            </Container>
        </div>
    )
}
