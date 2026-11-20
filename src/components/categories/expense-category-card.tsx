"use client"

import Link from "next/link"
import { Card, CardAction, CardContent, CardHeader, CardLink, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { CategoryCardContextMenu } from "@/components/categories/category-card-context-menu"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { ColorTile } from "@/components/ui/color-tile"
import { ChartSparkline } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { shiftYearMonth } from "@/lib/budget-month"
import {
    mediaDosMeses,
    rotuloDaVariacao,
    situacaoDaDespesa,
    variacaoDoMes,
    type Situacao,
    type Variacao,
} from "@/lib/categoria-situacao"
import { currencyBRL } from "@/lib/formatters"
import { TILE_EXPENSE_DEFAULT, tileColorFor } from "@/lib/tile-palette"
import { formatMonthShortPtBr } from "@/lib/transaction-date"

function stopLinkNavigation(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
}

const TOM_DA_VARIACAO: Record<Variacao["kind"], string> = {
    up: "text-expense",
    down: "text-income",
    flat: "text-muted-foreground",
    novo: "text-muted-foreground",
    nenhum: "text-muted-foreground",
}

const TOM_DA_SITUACAO: Record<Situacao["tom"], string> = {
    neutro: "text-muted-foreground",
    aviso: "text-warning-muted-foreground",
    perigo: "text-destructive",
}

function variacaoPorExtenso(v: Variacao): string | undefined {
    if (v.kind === "up") return `↑ ${v.pct}% vs mês anterior`
    if (v.kind === "down") return `↓ ${v.pct}% vs mês anterior`
    if (v.kind === "flat") return "Estável vs mês anterior"
    if (v.kind === "novo") return "Sem gasto no mês anterior"
    return undefined
}

function mesCurto(ym: string): string {
    const [y, m] = ym.split("-").map(Number)
    return formatMonthShortPtBr(new Date(y, m - 1, 1))
}

export function ExpenseCategoryCard({
    category,
    lancado,
    previsto,
    anterior,
    limite,
    totalDoMes,
    maiorTotal,
    ritmo,
    mesYm,
    historico,
    href,
    onEdit,
    onDelete,
}: {
    category: { id: string; name: string; icon: string | null; color: string | null }
    lancado: number
    previsto: number
    anterior: number
    limite: number
    totalDoMes: number
    maiorTotal: number
    ritmo: number | null
    mesYm: string
    /** Os 5 meses anteriores, do mais antigo ao mais recente; `undefined` enquanto carrega. */
    historico: number[] | undefined
    href: string
    /** Sem eles (o convidado, Bloco 7A), o cartão é só leitura: sem o menu. */
    onEdit?: () => void
    onDelete?: () => void
}) {
    const color = tileColorFor(category.color) ?? TILE_EXPENSE_DEFAULT
    // O estorno maior que as compras deixa o mês negativo: tudo lê como zero.
    const lancadoNaTela = Math.max(0, lancado)
    const total = Math.max(0, lancado + previsto)
    // As partes sempre somam o total: lançado negativo come do previsto.
    const previstoNaTela = Math.max(0, total - lancadoNaTela)
    const comLimite = limite > 0

    const variacao = variacaoDoMes(total, anterior)
    const rotulo = rotuloDaVariacao(variacao, shiftYearMonth(mesYm, -1))
    const situacao = situacaoDaDespesa({ total, limite, totalDoMes, ritmo })

    const serie =
        historico === undefined
            ? null
            : [...historico, total].map((v, i, todos) => ({
                  name: mesCurto(shiftYearMonth(mesYm, i - (todos.length - 1))),
                  total: Math.max(0, v),
              }))
    const media = historico === undefined ? 0 : mediaDosMeses(historico)
    const valores = serie?.map((p) => p.total) ?? []
    const descricaoDaSerie = serie
        ? `de ${currencyBRL(Math.min(...valores))} a ${currencyBRL(Math.max(...valores))}; média ${currencyBRL(media)}`
        : undefined

    const barraLabel = `${category.name}: ${situacao.texto}`

    return (
        // O cartão inteiro é clicável pelo `CardLink` no título (o link
        // esticado do sistema, rodada 204), e não por um <a> em volta de tudo:
        // o menu ficava dentro de um link, e o aria-label do link apagava o
        // conteúdo do cartão.
        <CategoryCardContextMenu
            name={category.name}
            description={`${currencyBRL(total)} no mês`}
            href={href}
            onEdit={onEdit}
            onDelete={onDelete}
        >
            <Card
                padding="sm"
                className="group h-full hover:border-foreground/20 hover:bg-muted/40 active:border-foreground/20 active:bg-muted/40"
            >
                <CardHeader
                    media={
                        <ColorTile size="lg" color={color}>
                            <CategoryIconPreview name={normalizeCategoryIcon(category.icon)} />
                        </ColorTile>
                    }
                >
                    <CardTitle className="flex min-w-0 items-center gap-1 self-center leading-snug">
                        <CardLink asChild>
                            <Link href={href} className="min-w-0 truncate">
                                {category.name}
                            </Link>
                        </CardLink>
                        <ChevronRightIcon
                            aria-hidden
                            className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,translate,color] duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-foreground group-hover:opacity-100 group-active:translate-x-0.5 group-active:text-foreground group-active:opacity-100 group-focus-within:translate-x-0.5 group-focus-within:text-foreground group-focus-within:opacity-100 max-md:hidden"
                        />
                    </CardTitle>

                    {onEdit && onDelete ? (
                        <CardAction>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="icon-md"
                                        // No cursor, o ⋯ só aparece com ele sobre o cartão; o teclado o
                                        // acha pelo foco. No toque não existe: o toque longo abre o menu de
                                        // contexto. O `opacity-0` é cru, e não `[@media(hover:hover)]:`: a
                                        // variante arbitrária sai depois do `group-hover:` no CSS e venceria.
                                        className={cn(
                                            "text-muted-foreground hover:text-foreground active:text-foreground",
                                            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100 pointer-coarse:hidden",
                                        )}
                                        aria-label={`Opções da categoria ${category.name}`}
                                        onClick={(e) => stopLinkNavigation(e)}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        <EllipsisVerticalIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" size="sm">
                                    <DropdownMenuItem onSelect={onEdit}>
                                        <PencilIcon aria-hidden />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                                        <TrashIcon aria-hidden />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardAction>
                    ) : null}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                    <div>
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="min-w-0 text-2xl font-bold tabular-nums tracking-tight">
                                {currencyBRL(total)}
                            </p>
                            {rotulo ? (
                                <span
                                    className={cn("shrink-0 text-xs font-medium", TOM_DA_VARIACAO[variacao.kind])}
                                    title={variacaoPorExtenso(variacao)}
                                >
                                    {rotulo}
                                </span>
                            ) : null}
                        </div>
                        {previstoNaTela > 0 ? (
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {currencyBRL(lancadoNaTela)} lançado + {currencyBRL(previstoNaTela)} previsto
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {comLimite ? (
                            <Progress
                                size="sm"
                                value={lancadoNaTela}
                                projected={previstoNaTela}
                                max={limite}
                                bands={BUDGET_BANDS}
                                marker={ritmo ?? undefined}
                                aria-label={barraLabel}
                            />
                        ) : (
                            <Progress
                                size="sm"
                                value={lancadoNaTela}
                                projected={previstoNaTela}
                                max={maiorTotal > 0 ? maiorTotal : 1}
                                aria-label={barraLabel}
                            />
                        )}
                        <p className={cn("text-xs", TOM_DA_SITUACAO[situacao.tom])}>{situacao.texto}</p>
                    </div>

                    {historico === undefined ? (
                        <div aria-hidden data-osso="faisca" className="-mx-(--card-px) -mb-(--card-py) mt-auto flex items-end max-md:h-26 md:h-16">
                    {/* O osso da faísca de área: a faixa preenchida do pé, e não barras. */}
                    <Skeleton className="h-10 w-full rounded-none" />
                </div>
                    ) : (
                        <div className="relative -mx-(--card-px) -mb-(--card-py) mt-auto">
                        <ChartSparkline
                            variant="area"
                            bleed
                            y="total"
                            className="w-full max-md:h-26 md:h-16"
                            data={serie ?? []}
                            reference={media}
                            config={{ total: { label: category.name, color } }}
                            label={`Gasto em ${category.name} nos últimos 6 meses`}
                            description={descricaoDaSerie}
                        />
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-x-(--card-px) bottom-2.5 flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-foreground transition-colors group-active:bg-foreground/12 md:hidden"
                            >
                                Ver lançamentos
                                <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </CategoryCardContextMenu>
    )
}

/** O osso do cartão de categoria (despesa e receita): cabeçalho, valor, barra, frase e faísca. */
export function CategoryCardSkeleton() {
    return (
        <Card padding="sm" className="h-full" aria-hidden>
            <CardHeader media={<Skeleton shape="tile" size="lg" />}>
                <CardTitle className="min-w-0 self-center">
                    <Skeleton shape="text" className="w-32 max-w-full" />
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                    <Skeleton className="h-8 w-36 max-w-full" />
                    <Skeleton shape="text" className="w-14 shrink-0" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <Skeleton shape="text" className="w-48 max-w-full" />
                </div>
                <div aria-hidden data-osso="faisca" className="-mx-(--card-px) -mb-(--card-py) mt-auto flex items-end max-md:h-26 md:h-16">
                    {/* O osso da faísca de área: a faixa preenchida do pé, e não barras. */}
                    <Skeleton className="h-10 w-full rounded-none" />
                </div>
            </CardContent>
        </Card>
    )
}
