"use client"

import { WrenchIcon, InformationCircleIcon, ReceiptPercentIcon, SparklesIcon } from "@heroicons/react/24/outline"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { tagChipInfo, tagChipWarning } from "@/lib/tag-chip-classes"
import { cn } from "@/lib/utils"

export default function PlansPage() {
    return (
        <div className="min-w-0 max-w-full space-y-5">
            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Plano atual
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div
                                    className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted/60"
                                    aria-hidden
                                >
                                    <SparklesIcon className="size-5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <p className="truncate text-sm font-medium leading-snug">
                                            Gratuito
                                        </p>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "shrink-0 px-1.5 py-0 text-[0.6rem]",
                                                tagChipInfo,
                                            )}
                                        >
                                            Atual
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Plano padrão, ativo automaticamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/25">
                            <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">
                                Você está usando o plano padrão. Sem cobranças ou assinaturas
                                ativas.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Planos disponíveis
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
                            <p className="min-w-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Status
                            </p>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "px-1.5 py-0 text-[0.65rem] font-semibold uppercase tracking-wide",
                                        tagChipWarning,
                                    )}
                                >
                                    Em construção
                                </Badge>
                                <p className="text-xs tabular-nums text-muted-foreground">
                                    0 planos
                                </p>
                            </div>
                        </div>
                        <div
                            className="flex flex-col gap-6 px-4 py-8 md:py-10"
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-5" aria-hidden>
                                    <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border">
                                        <SparklesIcon className="size-8 text-primary" />
                                    </div>
                                    <span className="absolute -right-0.5 -top-0.5 flex size-3">
                                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/35 opacity-75 motion-reduce:animate-none" />
                                        <span className="relative inline-flex size-3 rounded-full bg-primary ring-2 ring-background" />
                                    </span>
                                </div>
                                <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                    Trabalhando nos planos agora
                                </h2>
                                <p className="max-w-md text-center text-sm text-muted-foreground">
                                    A equipe está modelando benefícios, preços e a experiência de
                                    assinatura. Esta área vai ganhar comparação de planos e checkout
                                    assim que a primeira versão estiver pronta — sem ação sua por
                                    enquanto.
                                </p>
                            </div>
                            <div className="mx-auto w-full max-w-md space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4 sm:p-4">
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                    Em andamento neste momento
                                </div>
                                <ul className="list-none space-y-2.5 text-sm leading-snug text-muted-foreground">
                                    {[
                                        "Benefícios e limites por plano",
                                        "Cobrança recorrente e faturamento",
                                        "Gestão de assinatura na sua conta",
                                    ].map((label) => (
                                        <li key={label} className="flex gap-2.5">
                                            <span className="mt-1.5 flex size-1.5 shrink-0 items-center justify-center">
                                                <span className="size-1.5 rounded-full bg-primary/80 motion-safe:animate-pulse" />
                                            </span>
                                            <span className="min-w-0">{label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/25">
                            <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">
                                Quando os planos estiverem disponíveis, você verá tudo aqui e também
                                poderá receber um aviso na central de notificações.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Histórico de pagamentos
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                0 pagamentos
                            </p>
                        </div>
                        <div
                            className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                            role="status"
                            aria-live="polite"
                        >
                            <div
                                className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                                aria-hidden
                            >
                                <ReceiptPercentIcon className="size-7 text-muted-foreground" />
                            </div>
                            <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                Nenhum pagamento por aqui
                            </h2>
                            <p className="max-w-md text-center text-sm text-muted-foreground">
                                Quando você assinar um plano pago, suas faturas e recibos vão
                                aparecer neste histórico.
                            </p>
                        </div>
                        <div
                            className="shrink-0 border-t border-border bg-muted/15 py-3 dark:bg-muted/25"
                            aria-hidden
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
