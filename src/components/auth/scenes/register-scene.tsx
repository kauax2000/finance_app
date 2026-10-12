import { ScaleIcon } from "@heroicons/react/16/solid"

import { AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar-group"
import { Card, CardContent, CardNote, CardToolbar } from "@/components/ui/card"
import { Progress, ProgressHeader, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { StatCard, StatCardHeader, StatCardIcon, StatCardLabel, StatCardSplit } from "@/components/ui/stat-card"
import { BUDGET_BANDS } from "@/lib/budget-bands"
import { currencyBRL } from "@/lib/formatters"

const PESSOAS = [{ name: "Marina Costa" }, { name: "Rafael Lima" }, { name: "Você" }]
const GASTO = 1056
const LIMITE = 1200

/**
 * A cena do cadastro: o que a conta nova já faz — o mês dividido, um
 * orçamento perto do limite, quem divide a casa. A entrada é a do
 * `stat-card-reveal`; não há utility genérica de cascata.
 */
export function RegisterScene() {
    return (
        <div className="stat-card-reveal flex flex-col gap-4">
            <StatCard size="md">
                <StatCardHeader>
                    <StatCardLabel>
                        <StatCardIcon>
                            <ScaleIcon />
                        </StatCardIcon>
                        Outubro
                    </StatCardLabel>
                </StatCardHeader>
                <StatCardSplit
                    items={[
                        { label: "Entradas", value: 8432.15, tone: "income" },
                        { label: "Saídas", value: 6218.4, tone: "expense" },
                    ]}
                />
            </StatCard>
            <Card variant="elevated">
                <CardContent>
                    <Progress
                        value={GASTO}
                        max={LIMITE}
                        bands={BUDGET_BANDS}
                        header={
                            <ProgressHeader>
                                <ProgressLabel>Mercado</ProgressLabel>
                                <ProgressValue>
                                    {currencyBRL(GASTO)} de {currencyBRL(LIMITE)}
                                </ProgressValue>
                            </ProgressHeader>
                        }
                    />
                </CardContent>
            </Card>
            <Card variant="elevated" padding="none">
                <CardToolbar variant="title">
                    Casa
                    <AvatarGroup label="Quem divide a carteira Casa" size="sm">
                        {PESSOAS.map((p) => (
                            <AvatarGroupItem key={p.name} name={p.name} />
                        ))}
                    </AvatarGroup>
                </CardToolbar>
                <CardNote>Números de exemplo.</CardNote>
            </Card>
        </div>
    )
}
