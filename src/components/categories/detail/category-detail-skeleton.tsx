import { TransacoesTabelaSkeleton } from "@/components/transactions/transactions-page-skeleton"
import { PageHeaderSkeleton } from "@/components/ui/page-header"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"

/** Uma linha dividida 5:4 como as do detalhe: abaixo de 36rem da área, empilha. */
function LinhaDividida({ altura }: { altura: string }) {
    return (
        <div className="@container">
            <div className="grid gap-(--space-block) @xl:grid-cols-[5fr_4fr]">
                <Skeleton shape="surface" className={altura} />
                <Skeleton shape="surface" className={altura} />
            </div>
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
            <div className="flex min-w-0 flex-col gap-6 md:px-9.5">
                {/* A faixa do mês: o rótulo, o valor com a variação, o "Deve fechar", as legendas e a barra.
                    No telefone, o título "Este mês" com o ⋯ em cima, o "Deve fechar" em duas linhas e o
                    selo do peso na carteira embaixo da barra, no lugar das legendas. */}
                <div className="flex flex-col">
                    <div className="mb-4 flex items-center justify-between md:hidden">
                        <Skeleton shape="text" className="h-4 w-20" />
                        <Skeleton shape="circle" size="sm" />
                    </div>
                    <Skeleton shape="text" className="w-32 max-md:w-12" />
                    <div className="mt-2 flex items-end gap-3">
                        <Skeleton className="h-10 w-56" />
                        <Skeleton shape="text" className="mb-1 w-10 max-md:hidden" />
                    </div>
                    <Skeleton shape="text" className="mt-2 w-96 max-w-full" />
                    <Skeleton shape="text" className="w-20 md:hidden" />
                    <div className="mt-3 flex justify-between gap-3 max-md:hidden">
                        <Skeleton shape="text" className="w-16" />
                        <Skeleton shape="text" className="w-40" />
                    </div>
                    <Skeleton className="mt-2 h-2 w-full rounded-full" />
                    <Skeleton shape="pill" className="mt-3 h-5 w-40 md:hidden" />
                </div>

                {/* Do que é feito o mês: a Leitura, os 6 meses com a comparação, as compras com as parcelas. */}
                <div className="grid gap-(--space-block)">
                    <Skeleton shape="surface" className="h-44 max-md:h-74" />
                    <LinhaDividida altura="h-73" />
                    <LinhaDividida altura="h-53" />
                </div>

                {/* Quem gastou e os insights. */}
                <LinhaDividida altura="h-58" />

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

                <Skeleton shape="text" className="mx-auto w-60" />
            </div>
        </SkeletonGroup>
    )
}
