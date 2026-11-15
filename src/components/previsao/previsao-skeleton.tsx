import { CardSkeleton } from "@/components/ui/card"
import { ChartSkeleton } from "@/components/ui/chart"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { StatCard, StatCardHeader, StatCardValueSkeleton } from "@/components/ui/stat-card"

/** A Previsão esperando os dados, na forma dos blocos: o herói, a grade dos dois cartões e o simulador. */
export function PrevisaoSkeleton() {
    return (
        <SkeletonGroup label="Carregando a previsão" delay className="grid min-w-0 gap-5">
            <StatCard size="lg" aria-hidden>
                <StatCardHeader>
                    <Skeleton shape="text" className="w-44" />
                </StatCardHeader>
                <StatCardValueSkeleton className="w-40" />
                <Skeleton shape="text" className="w-56" />
                <ChartSkeleton aspect="auto" className="mt-5 h-48" />
            </StatCard>
            <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                <CardSkeleton lines={8} />
                <CardSkeleton>
                    <ChartSkeleton aspect="auto" bars={6} className="h-48" />
                </CardSkeleton>
            </div>
            <CardSkeleton lines={2} />
        </SkeletonGroup>
    )
}
