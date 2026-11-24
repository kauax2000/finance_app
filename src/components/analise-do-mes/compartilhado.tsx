import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Caption } from "@/components/ui/typography"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { cn } from "@/lib/utils"

/** "Gasto" ou "Entrada": o que o cartão mede, no nome do gráfico. */
export const oQueSeMede = (despesa: boolean) => (despesa ? "Gasto" : "Entrada")

/** A diferença de uma forma contra o mês anterior: "+R$ 312" no tom do veredito, "igual" ou "novo" (null). */
export function diferencaDaForma(diferenca: number | null, despesa: boolean) {
    if (diferenca == null) return { texto: "novo", classe: undefined }
    if (Math.round(diferenca) === 0) return { texto: "igual", classe: undefined }
    const bom = despesa ? diferenca < 0 : diferenca > 0
    return {
        texto: `${diferenca > 0 ? "+" : "−"}${reaisInteiros(Math.abs(diferenca))}`,
        classe: bom ? "text-success-muted-foreground" : "text-warning-muted-foreground",
    }
}

/** O cartão de um gráfico da análise: título pequeno, uma legenda de apoio à direita e o conteúdo. */
export function CartaoDoGrafico({
    titulo,
    apoio,
    acao,
    className,
    children,
}: {
    titulo: string
    apoio?: React.ReactNode
    /** Uma ação no canto do cabeçalho (o "Ver todas" das parcelas); no lugar do `apoio`. */
    acao?: React.ReactNode
    className?: string
    children: React.ReactNode
}) {
    return (
        <Card className={cn("min-w-0", className)}>
            <CardHeader>
                <CardTitle size="sm">{titulo}</CardTitle>
                {acao ? (
                    <CardAction>{acao}</CardAction>
                ) : apoio ? (
                    <CardAction>
                        <Caption>{apoio}</Caption>
                    </CardAction>
                ) : null}
            </CardHeader>
            {/* Coluna que cresce: lado a lado, o último bloco do cartão (`mt-auto`) assenta no pé, e os pés se alinham. */}
            <CardContent className="flex flex-1 flex-col">{children}</CardContent>
        </Card>
    )
}
