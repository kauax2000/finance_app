"use client"

import { compareYmd } from "@/lib/transaction-date"
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionListItem,
    DescriptionTerm,
} from "@/components/ui/description-list"
import { billDuePill, billDaysDeltaLabel } from "@/components/bills/bill-status"
import { ArrowRightIcon, BanknotesIcon, CreditCardIcon, EllipsisHorizontalIcon, ForwardIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { CreditCardIcon as CreditCardMiniIcon } from "@heroicons/react/20/solid"
import {
    Badge,
    tagChipInfo,
} from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardLink,
    CardTitle,
} from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuHeader,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { billFrequencyLabel } from "@/components/bills/bill-form-shared"
import type { BillPendingRow } from "@/components/bills/bill-list-types"
import {
    CategoryIconPreview,
    normalizeCategoryIcon,
} from "@/components/categories/category-appearance-fields"
import {
    formatTransactionDmyPtBr,
} from "@/lib/transaction-date"
import { cn } from "@/lib/utils"
import { ColorTile } from "@/components/ui/color-tile"

const EXPENSE_CATEGORY_FALLBACK_COLOR = "var(--expense)"

function pendingStatusPill(
    row: BillPendingRow,
    todayYmd: string
): { label: string; className: string } {
    if (row.kind === "virtual_cc") {
        return { label: "Fatura cartão", className: tagChipInfo }
    }
    return billDuePill(row.dueYmd, todayYmd)
}

export type BillPendingCardProps = {
    row: BillPendingRow
    todayYmd: string
    onOpenDetail: () => void
    onPay: () => void
    onEditModel: () => void
    onSkipInstance: () => void
    onDeleteBill: () => void
}

export function BillPendingCard({
    row,
    todayYmd,
    onOpenDetail,
    onPay,
    onEditModel,
    onSkipInstance,
    onDeleteBill,
}: BillPendingCardProps) {
    const pill = pendingStatusPill(row, todayYmd)
    const dueFmt = formatTransactionDmyPtBr(`${row.dueYmd}T12:00:00`)
    const delta = billDaysDeltaLabel(row.dueYmd, todayYmd)
    const isEstimated =
        row.kind === "regular"
            ? row.instance.amount == null &&
              row.bill.amount_estimated != null
            : row.amountHint != null

    const subtitle =
        row.kind === "regular"
            ? `${billFrequencyLabel(row.bill.frequency)} · Dia ${row.bill.due_day_of_month}`
            : `Cartão · venc. fatura`

    const cat = row.kind === "regular" ? row.bill.category : null
    const headerColor =
        row.kind === "regular"
            ? (cat?.color ?? EXPENSE_CATEGORY_FALLBACK_COLOR)
            : undefined
    return (
        // O botão direito e o toque longo repetem as ações do rodapé — o
        // "Pagar" e o menu de três pontos continuam à vista.
        <ContextMenu>
        <ContextMenuTrigger asChild>
        <Card
            padding="sm"
            inactive={row.kind === "regular" && !row.bill.is_active}
            className="group"
        >
                <CardHeader
                    media={
                        row.kind === "virtual_cc" ? (
                            /* Fatura de cartão não tem cor escolhida por
                               ninguém — e é exatamente o que o `ColorTile` sem
                               cor desenha desde a rodada 95: o cinza do
                               sistema, pela mesma receita das outras linhas. A
                               `div` que morava aqui repetia o degrau `2xl` à
                               mão porque o padrão de então era `--primary`, e
                               com o branding preto e branco isso lia como
                               desativado. */
                            <ColorTile
                                size="2xl"
                            >
                                <CreditCardMiniIcon />
                            </ColorTile>
                        ) : (
                            <ColorTile
                                size="2xl"
                                color={headerColor}
                            >
                                {/* `lg` desenha o ícone a 20px, e a 20 o
                                    conjunto é o mini. */}
                                <CategoryIconPreview
                                    name={normalizeCategoryIcon(
                                        row.bill.icon ?? "receipt"
                                    )}
                                    size="mini"
                                />
                            </ColorTile>
                        )
                    }
                >
                        <CardTitle
                            className={cn(
                                "min-w-0 self-center leading-snug",
                                "line-clamp-2 text-balance @min-[360px]/card-header:line-clamp-1 @min-[360px]/card-header:truncate",
                            )}
                        >
                            {/* O cartão abre pelo `CardLink` (rodada 204): a película
                                cobre o cartão, e os botões do rodapé ficam acima
                                dela — era um <button> em volta de tudo, que não
                                podia conter as ações. */}
                            <CardLink asChild>
                                <button type="button" className="text-left" onClick={onOpenDetail} aria-label={`Abrir ${row.title}`}>
                                    {row.title}
                                </button>
                            </CardLink>
                        </CardTitle>

                        <CardAction>
                        <Badge
                            tone="neutral"
                            className={cn(
                                "shrink-0 border-0 text-xs",
                                pill.className
                            )}
                        >
                            {row.kind === "virtual_cc" ? (
                                <>
                                    <CreditCardIcon aria-hidden />
                                    {pill.label}
                                </>
                            ) : (
                                pill.label
                            )}
                        </Badge>
                        </CardAction>

                        <CardDescription className="text-xs leading-relaxed">
                            {row.kind === "regular" && cat ? (
                                <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                    <span className="inline-flex min-w-0 items-center gap-1.5">
                                        <span
                                            className="size-2 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    cat.color ??
                                                    "var(--muted-foreground)",
                                            }}
                                            aria-hidden
                                        />
                                        <span className="truncate">{cat.name}</span>
                                    </span>
                                    <span className="text-muted-foreground/70">·</span>
                                    <span>{subtitle}</span>
                                </span>
                            ) : (
                                subtitle
                            )}
                        </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                    <DescriptionList term="eyebrow">
                        <DescriptionListItem>
                            <DescriptionTerm>
                                Valor estimado
                            </DescriptionTerm>
                            <DescriptionDetails>
                                <div className="mt-1 flex flex-wrap items-baseline gap-1 tabular-nums">
                                    {row.amountHint != null ? (
                                        <>
                                            {isEstimated ? (
                                                <span className="text-sm text-muted-foreground">
                                                    ~
                                                </span>
                                            ) : null}
                                            <MoneyDisplay
                                                value={row.amountHint}
                                                size="lg"
                                                className="font-semibold tracking-tight"
                                            />
                                        </>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            Definido no pagamento
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    Venc. {dueFmt}
                                    <span className="text-muted-foreground/70"> · </span>
                                    <span
                                        className={cn(
                                            compareYmd(row.dueYmd, todayYmd) < 0 &&
                                                "font-medium text-destructive"
                                        )}
                                    >
                                        {delta}
                                    </span>
                                </p>
                            </DescriptionDetails>
                        </DescriptionListItem>
                    </DescriptionList>
                </CardContent>

            <CardFooter className="justify-end">
                <Button
                    type="button"
                    size="sm"
                    className="h-8 min-w-[5.5rem] text-xs"
                    onClick={(e) => {
                        e.stopPropagation()
                        onPay()
                    }}
                >
                    Pagar
                </Button>
                {row.kind === "regular" ? (
                    <DropdownMenu mobile="sheet">
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                aria-label="Mais ações"
                                className="size-8 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <EllipsisHorizontalIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            size="md"
                            header={
                                <DropdownMenuHeader
                                    title={row.title}
                                    description={`Venc. ${dueFmt} · ${delta}`}
                                />
                            }
                        >
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEditModel()
                                }}
                            >
                                <PencilIcon aria-hidden />
                                Editar modelo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSkipInstance()
                                }}
                            >
                                <ForwardIcon aria-hidden />
                                Ignorar parcela
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteBill()
                                }}
                            >
                                <TrashIcon aria-hidden />
                                Excluir conta
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </CardFooter>
        </Card>
        </ContextMenuTrigger>
        <ContextMenuContent
            size="xl"
            header={
                <ContextMenuHeader
                    title={row.title}
                    description={`Venc. ${dueFmt} · ${delta}`}
                />
            }
        >
            <ContextMenuItem onSelect={onOpenDetail}>
                <ArrowRightIcon aria-hidden />
                Abrir
            </ContextMenuItem>
            <ContextMenuItem onSelect={onPay}>
                <BanknotesIcon aria-hidden />
                Pagar
            </ContextMenuItem>
            {row.kind === "regular" ? (
                <>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={onEditModel}>
                        <PencilIcon aria-hidden />
                        Editar modelo
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={onSkipInstance}>
                        <ForwardIcon aria-hidden />
                        Ignorar parcela
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive" onSelect={onDeleteBill}>
                        <TrashIcon aria-hidden />
                        Excluir conta
                    </ContextMenuItem>
                </>
            ) : null}
        </ContextMenuContent>
        </ContextMenu>
    )
}
