import type * as React from "react"
import { TransacoesTabelaSkeleton } from "@/components/transactions/transactions-page-skeleton"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Uma linha dividida 5:4 como as do detalhe: abaixo de 36rem da área, empilha. */
function LinhaDividida({ children }: { children: React.ReactNode }) {
    return (
        <div className="@container">
            <div className="grid gap-(--space-block) @xl:grid-cols-[5fr_4fr]">{children}</div>
        </div>
    )
}

/**
 * Um cartão do detalhe que espera: o mesmo `Card` do real, com o título (e o selo, se o real
 * tem) e a ação de texto na tira de cima, e o corpo em ossos na forma do conteúdo. Bloco
 * maciço no lugar do cartão pesava mais que a tela pronta.
 */
function CartaoOsso({
    className,
    titulo,
    selo,
    acao,
    children,
}: {
    className: string
    titulo: string
    selo?: string
    acao?: string
    children: React.ReactNode
}) {
    return (
        <Card aria-hidden className={className}>
            <CardHeader>
                <CardTitle className="flex h-5 items-center gap-2">
                    <Skeleton shape="text" className={titulo} />
                    {selo ? <Skeleton shape="pill" className={cn("h-5", selo)} /> : null}
                </CardTitle>
                {acao ? (
                    <CardAction className="flex h-5 items-center">
                        <Skeleton shape="text" className={acao} />
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">{children}</CardContent>
        </Card>
    )
}

/** Linhas de lista (nome, selo e valor), como Principais gastos, Parcelas e Quem gastou. */
function LinhasOsso({ linhas, avatar = false }: { linhas: string[]; avatar?: boolean }) {
    return (
        <div className="flex flex-col gap-4">
            {linhas.map((largura, i) => (
                <div key={i} className="flex items-center gap-3">
                    {avatar ? <Skeleton shape="circle" size="sm" className="shrink-0" /> : null}
                    <Skeleton shape="text" className={largura} />
                    <Skeleton shape="text" className="ms-auto w-16 shrink-0" />
                </div>
            ))}
        </div>
    )
}

/**
 * O esqueleto na forma do detalhe (`CategoryDetailLayout`), na ordem e nas alturas
 * medidas a 1280px: o cabeçalho (só no desktop: ‹, ladrilho, nome, a pílula do mês e
 * o ⋯), a faixa do mês, a Leitura do mês, as duas linhas 5:4 do que é feito o mês,
 * a linha de quem gastou e dos insights, a lista (a tabela de Transações) e o link
 * para o Painel.
 */
export function CategoryDetailSkeleton() {
    return (
        <SkeletonGroup label="Carregando a categoria…" className="flex min-w-0 flex-col gap-6">
            <PageHeaderSkeleton description={false} back media actions={["lg", "icon"]} className="max-md:hidden" />
            <div className="flex min-w-0 flex-col gap-6 max-md:gap-(--space-block) md:px-9.5">
                {/* A faixa do mês: o rótulo, o valor com a variação, o "Deve fechar", as legendas e a barra.
                    No telefone, o topo centrado (ladrilho, nome, valor e legenda) em cima, o chip da comparação, e o resumo
                    (linha, barra e a frase de como o mês fecha) num cartão de 122px (medido a 375px, sem limite nem previsto: o fechamento quebra em duas linhas). */}
                <div className="flex flex-col">
                    <div className="-mt-3.5 flex flex-col items-center gap-2 pb-4 md:hidden">
                        <Skeleton shape="tile" size="2xl" />
                        <Skeleton shape="text" className="w-28" />
                        <Skeleton className="h-10 w-40" />
                        <Skeleton shape="text" className="w-56 max-w-full" />
                        <Skeleton shape="pill" className="mt-1 h-5.5 w-72 max-w-full" />
                    </div>
                    <Card aria-hidden className="h-30.5 md:hidden">
                        <CardContent className="grid gap-3">
                            <div className="flex justify-between gap-3">
                                <Skeleton shape="text" className="w-36" />
                                <Skeleton shape="text" className="w-20" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                            <Skeleton shape="text" className="w-full" />
                            <Skeleton shape="text" className="w-24" />
                        </CardContent>
                    </Card>
                    <Skeleton shape="text" className="w-32 max-md:hidden" />
                    <div className="mt-2 flex items-end gap-3 max-md:hidden">
                        <Skeleton className="h-10 w-56" />
                        <Skeleton shape="text" className="mb-1 w-10" />
                    </div>
                    <Skeleton shape="text" className="mt-2 w-96 max-w-full max-md:hidden" />
                    <div className="mt-3 flex justify-between gap-3 max-md:hidden">
                        <Skeleton shape="text" className="w-16" />
                        <Skeleton shape="text" className="w-40" />
                    </div>
                    <Skeleton className="mt-2 h-2 w-full rounded-full max-md:hidden" />
                </div>

                {/* Do que é feito o mês: a Leitura, os 6 meses com a comparação, as compras com as parcelas. */}
                <div className="grid gap-(--space-block)">
                    {/* A Leitura do mês: o selo e o rótulo com o "Ver …" à direita, a manchete em duas linhas e os motivos. */}
                    <Card aria-hidden className="h-44 max-md:h-74">
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Skeleton shape="circle" size="xs" />
                                <Skeleton shape="text" className="w-24" />
                                <Skeleton shape="text" className="ms-auto w-28" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-3/5" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Skeleton shape="pill" className="h-7 w-36" />
                                <Skeleton shape="pill" className="h-7 w-48" />
                            </div>
                        </CardContent>
                    </Card>
                    {/* No telefone as linhas empilham e cada cartão tem a altura do próprio conteúdo (medida a 375px). */}
                    <LinhaDividida>
                        {/* Os últimos 6 meses: a linha da média, tracejada, e os meses no pé. */}
                        <CartaoOsso className="h-73 max-md:h-79.5" titulo="w-28" selo="w-24" acao="w-20">
                            <div className="relative flex-1">
                                <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-muted-foreground/30" />
                                <Skeleton className="absolute inset-x-0 bottom-0 h-1/3 rounded-none opacity-50" />
                            </div>
                            <div className="mt-3 flex justify-between">
                                {Array.from({ length: 6 }, (_, i) => (
                                    <Skeleton key={i} shape="text" className="w-6" />
                                ))}
                            </div>
                        </CartaoOsso>
                        {/* A comparação com o mês anterior: as duas barras com o rótulo em cima e as partes embaixo. */}
                        <CartaoOsso className="h-73" titulo="w-44" selo="w-12">
                            <div className="flex flex-col gap-2">
                                <Skeleton shape="text" className="w-14" />
                                <Skeleton className="h-12 w-2/5 rounded-row-lg" />
                                <Skeleton shape="text" className="mt-1 w-16" />
                                <Skeleton className="h-12 w-3/5 rounded-row-lg" />
                            </div>
                            <div className="mt-auto">
                                <LinhasOsso linhas={["w-28", "w-36"]} />
                            </div>
                        </CartaoOsso>
                    </LinhaDividida>
                    <LinhaDividida>
                        <CartaoOsso className="h-53" titulo="w-28" acao="w-20">
                            <LinhasOsso linhas={["w-32", "w-24", "w-28"]} />
                        </CartaoOsso>
                        <CartaoOsso className="h-53 max-md:h-32" titulo="w-28" acao="w-16">
                            <LinhasOsso linhas={["w-28", "w-20"]} />
                        </CartaoOsso>
                    </LinhaDividida>
                </div>

                {/* Quem gastou e os insights. */}
                <LinhaDividida>
                    <CartaoOsso className="h-58 max-md:h-44.5" titulo="w-24" acao="w-28">
                        <LinhasOsso linhas={["w-28", "w-20"]} avatar />
                    </CartaoOsso>
                    <Card aria-hidden className="h-58 max-md:h-64.5">
                        <CardContent className="flex flex-1 flex-col gap-3">
                            <Skeleton shape="text" className="w-24" />
                            <Skeleton className="h-6 w-28" />
                            <Skeleton shape="text" className="w-full" />
                            <Skeleton shape="text" className="w-3/4" />
                            <div className="mt-auto flex justify-center gap-1.5">
                                <Skeleton shape="circle" className="size-1.5" />
                                <Skeleton shape="circle" className="size-1.5" />
                                <Skeleton shape="circle" className="size-1.5" />
                            </div>
                        </CardContent>
                    </Card>
                </LinhaDividida>

                {/* A lista: o título "Lançamentos" com a contagem e "Ver em Transações" numa linha, e a tabela de Transações. */}
                <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton shape="text" className="h-4 w-24" />
                            <Skeleton shape="text" className="w-5" />
                        </div>
                        <Skeleton shape="control" className="w-42" />
                    </div>
                    <TransacoesTabelaSkeleton dias={[2, 3]} />
                </div>

                {/* O cartão "Entenda … em <mês>", uma linha só: 58 no desktop, 70 no telefone (botão de 44). */}
                <Card aria-hidden padding="sm" className="h-14.5 justify-center max-md:h-17.5">
                    <CardContent className="flex items-center gap-3">
                        <Skeleton shape="tile" size="xs" className="shrink-0" />
                        <Skeleton shape="text" className="w-64 max-w-full" />
                        <Skeleton shape="control" size="sm" className="ms-auto w-32 shrink-0" />
                    </CardContent>
                </Card>
            </div>
        </SkeletonGroup>
    )
}
