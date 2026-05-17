"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useCallback, useRef } from "react"
import type { CreditCard } from "@/lib/supabase"
import type { CardCycleSnapshot } from "@/lib/credit-card-billing"
import { formatDatePtBr } from "@/lib/credit-card-billing"
import { CreditCardFaceTilt } from "@/components/credit-cards/credit-card-face-tilt"
import { RegisteredCreditCardFace } from "@/components/credit-cards/registered-credit-card-face"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet"
import { SheetDragHandle } from "@/components/ui/sheet-drag-handle"
import { mobileSheetChromeBelowHeaderClassName } from "@/components/ui/mobile-sheet-form-chrome"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ChevronDownIcon,
    ListBulletIcon,
    PencilIcon,
    PowerIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline"
import { PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"

const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
})

const DETAILS_ANCHOR_ID = "credit-card-details-anchor"

function SectionLabel({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <p
            className={cn(
                "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                className
            )}
        >
            {children}
        </p>
    )
}

export type CreditCardDetailSheetProps = {
    card: CreditCard | null
    snapshot: CardCycleSnapshot | null
    open: boolean
    onOpenChange: (open: boolean) => void
    transactionsHref: string
    onEdit: () => void
    onDelete: () => void
    onSetActive?: (active: boolean) => void | Promise<void>
}

export function CreditCardDetailSheet({
    card,
    snapshot,
    open,
    onOpenChange,
    transactionsHref,
    onEdit,
    onDelete,
    onSetActive,
}: CreditCardDetailSheetProps) {
    const isMobile = useIsMobile()
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const scrollToDetails = useCallback(() => {
        scrollAreaRef.current
            ?.querySelector(`#${DETAILS_ANCHOR_ID}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, [])

    if (!card) {
        return null
    }

    const viewBody = (
        <div className="flex min-h-0 flex-1 flex-col gap-0">
            {isMobile ? <SheetDragHandle /> : null}
            <SheetDescription className="sr-only">
                Cartão {card.name}, final {card.last_four}.
            </SheetDescription>
            <div
                className={cn(
                    "flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 sm:px-5",
                    mobileSheetChromeBelowHeaderClassName,
                    isMobile && "pt-1",
                )}
            >
                <SheetTitle className="font-heading min-w-0 flex-1 truncate text-base font-medium leading-tight">
                    {card.name}
                </SheetTitle>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={() => onOpenChange(false)}
                    aria-label="Fechar"
                >
                    <XMarkIcon className="h-5 w-5" aria-hidden />
                </Button>
            </div>

            <div
                className={cn(
                    "shrink-0 border-b border-border px-4 pb-3 pt-2 sm:px-5",
                    !isMobile && "pt-3"
                )}
            >
                <CreditCardFaceTilt className="w-full">
                    <RegisteredCreditCardFace card={card} size="md" />
                </CreditCardFaceTilt>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={scrollToDetails}
                    >
                        <ListBulletIcon className="size-3.5" aria-hidden />
                        Ver detalhes
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                            >
                                Gerenciar
                                <ChevronDownIcon className="size-3.5 opacity-70" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52">
                            <DropdownMenuItem onClick={() => onEdit()}>
                                <PencilIcon className="h-4 w-4" aria-hidden />
                                Editar
                            </DropdownMenuItem>
                            {onSetActive ? (
                                <DropdownMenuItem
                                    onClick={() => void onSetActive(!card.is_active)}
                                >
                                    {card.is_active ? (
                                        <>
                                            <PowerOff className="h-4 w-4" aria-hidden />
                                            Desativar cartão
                                        </>
                                    ) : (
                                        <>
                                            <PowerIcon className="h-4 w-4" aria-hidden />
                                            Ativar cartão
                                        </>
                                    )}
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete()}
                            >
                                <TrashIcon className="h-4 w-4" aria-hidden />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div
                ref={scrollAreaRef}
                className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5"
            >
                {snapshot ? (
                    <section
                        id={DETAILS_ANCHOR_ID}
                        className="scroll-mt-3 space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 dark:bg-muted/10"
                    >
                        <SectionLabel>Faturas (estimativa)</SectionLabel>
                        <dl className="grid gap-2 text-sm">
                            <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                                <dt className="text-muted-foreground">
                                    Fatura aberta (planejada)
                                </dt>
                                <dd className="text-right tabular-nums font-medium">
                                    <span className="block">
                                        {currencyFmt.format(
                                            snapshot.committedOpenTotal
                                        )}
                                    </span>
                                    {snapshot.projectedOpenInstallmentsTotal > 0 ? (
                                        <span className="block text-[11px] font-normal text-muted-foreground">
                                            Total registrado{" "}
                                            {currencyFmt.format(snapshot.openTotal)}
                                            {" · "}
                                            Parcelas previstas{" "}
                                            {currencyFmt.format(
                                                snapshot.projectedOpenInstallmentsTotal
                                            )}
                                        </span>
                                    ) : null}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted-foreground">Última fechada</dt>
                                <dd className="tabular-nums font-medium">
                                    {currencyFmt.format(snapshot.lastClosedTotal)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted-foreground">Próximo fechamento</dt>
                                <dd className="tabular-nums text-foreground">
                                    {formatDatePtBr(snapshot.nextClose)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted-foreground">
                                    Vencimento estimado (última fechada)
                                </dt>
                                <dd className="tabular-nums text-foreground">
                                    {formatDatePtBr(snapshot.estimatedDueLastClose)}
                                </dd>
                            </div>
                        </dl>
                        <p className="text-[11px] leading-snug text-muted-foreground">
                            Fechamento e vencimento seguem os dias cadastrados; bancos podem
                            diferir em finais de semana e feriados.
                        </p>
                    </section>
                ) : null}

                <section
                    id={snapshot ? undefined : DETAILS_ANCHOR_ID}
                    className={cn("space-y-2", !snapshot && "scroll-mt-3")}
                >
                    <SectionLabel>Cadastro</SectionLabel>
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3 text-sm text-muted-foreground">
                        <p>
                            Fecha dia <span className="font-medium text-foreground">{card.closing_day}</span>
                            {" · "}
                            Vence dia{" "}
                            <span className="font-medium text-foreground">{card.due_day}</span>
                        </p>
                        {card.credit_limit != null ? (
                            <p className="mt-1">
                                Limite cadastrado:{" "}
                                <span className="font-medium text-foreground tabular-nums">
                                    {currencyFmt.format(Number(card.credit_limit))}
                                </span>
                            </p>
                        ) : null}
                        {!card.is_active ? (
                            <p className="mt-2 text-amber-600 dark:text-amber-500">
                                Cartão inativo — não aparece ao lançar despesas no crédito.
                            </p>
                        ) : null}
                    </div>
                </section>

                <Button type="button" variant="outline" size="sm" className="w-full gap-2" asChild>
                    <Link href={transactionsHref}>Ver transações neste cartão</Link>
                </Button>
            </div>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? "bottom" : "right"}
                fillMobileViewport={isMobile}
                className={cn(
                    "flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md",
                    isMobile && "rounded-t-2xl pt-0 sm:max-w-full"
                )}
                showCloseButton={false}
            >
                {viewBody}
            </SheetContent>
        </Sheet>
    )
}
