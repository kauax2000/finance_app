import Link from "next/link"
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline"

import { ROUTES } from "@/config/navigation"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotFoundShell() {
    return (
        <div className="flex min-h-dvh w-full flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6">
            <div className="mx-auto w-full max-w-md space-y-8">
                <div
                    data-slot="empty-state"
                    className={cn(
                        "flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-10 text-center",
                    )}
                >
                    <div
                        data-slot="empty-state-icon"
                        className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6"
                    >
                        <QuestionMarkCircleIcon aria-hidden />
                    </div>
                    <h2
                        data-slot="empty-state-title"
                        className="mb-2 text-center text-base font-semibold tracking-tight text-foreground"
                    >
                        Página não encontrada
                    </h2>
                    <p
                        data-slot="empty-state-description"
                        className="mb-6 max-w-sm text-center text-sm text-muted-foreground"
                    >
                        O endereço não existe ou foi movido. Verifique o link ou
                        volte ao painel.
                    </p>
                    <div
                        data-slot="empty-state-actions"
                        className="flex flex-wrap items-center justify-center gap-2"
                    >
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
                    </div>
                </div>
                <p
                    data-slot="typography-muted"
                    className="block text-center text-xs text-muted-foreground"
                >
                    Erro 404 — nada para exibir neste caminho.
                </p>
            </div>
        </div>
    )
}
