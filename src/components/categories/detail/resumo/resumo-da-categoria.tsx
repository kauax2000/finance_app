"use client"

import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import type { Fatia, TipoDaCategoria } from "@/lib/categoria-detalhe"
import type {
    Compromissos,
    compraTipica,
    diaDeMaisGasto,
    fraseDoResumo,
    insights,
    maisFrequente,
    porDiaDaSemana,
    porFaixaDeValor,
    repeticoes,
    ritmoDoMes,
} from "@/lib/categoria-resumo"
import type { Transaction } from "@/lib/supabase"
import { CartoesDoGasto } from "./cartoes-do-gasto"
import { CompromissosERepeticoes } from "./compromissos-e-repeticoes"
import { FraseDoResumo } from "./frase-do-resumo"
import { GraficosDoResumo } from "./graficos-do-resumo"
import { InsightsDoResumo } from "./insights-do-resumo"

export type ResumoDaCategoriaProps = {
    tipo: TipoDaCategoria
    nomeDaCategoria: string
    /** `categories.color` como está no banco. */
    cor: string | null
    yearMonth: string
    hojeYmd: string
    aberto: boolean
    frase: ReturnType<typeof fraseDoResumo>
    serie: { yearMonth: string; total: number }[]
    media: number | null
    ritmo: ReturnType<typeof ritmoDoMes>
    porPagamento: Fatia[]
    diasDaSemana: ReturnType<typeof porDiaDaSemana>
    faixas: ReturnType<typeof porFaixaDeValor>
    maior: Transaction | null
    tipica: ReturnType<typeof compraTipica>
    frequente: ReturnType<typeof maisFrequente>
    diaDeMais: ReturnType<typeof diaDeMaisGasto>
    compromissos: Compromissos
    repetidas: ReturnType<typeof repeticoes>
    insights: ReturnType<typeof insights>
    onDefinirLimite: () => void
}

/** A aba Resumo: frase → gráficos → cartões → parcelas e repetições → insights. Recebe tudo pronto. */
export function ResumoDaCategoria(p: ResumoDaCategoriaProps) {
    const temCompromissos = p.compromissos.itens.length > 0 || p.repetidas.length > 0
    return (
        <div className="grid gap-6">
            <FraseDoResumo frase={p.frase} />
            <GraficosDoResumo
                tipo={p.tipo}
                cor={p.cor}
                nomeDaCategoria={p.nomeDaCategoria}
                yearMonth={p.yearMonth}
                aberto={p.aberto}
                serie={p.serie}
                media={p.media}
                ritmo={p.ritmo}
                porPagamento={p.porPagamento}
                diasDaSemana={p.diasDaSemana}
                faixas={p.faixas}
            />
            <CartoesDoGasto tipo={p.tipo} maior={p.maior} tipica={p.tipica} frequente={p.frequente} diaDeMais={p.diaDeMais} />
            {temCompromissos ? (
                <PageSection>
                    <PageSectionHeader>
                        <PageSectionTitle>{p.tipo === "expense" ? "Já comprometido e o que se repete" : "Recorrente e o que se repete"}</PageSectionTitle>
                    </PageSectionHeader>
                    <CompromissosERepeticoes
                        tipo={p.tipo}
                        hojeYmd={p.hojeYmd}
                        compromissos={p.compromissos}
                        repetidas={p.repetidas}
                    />
                </PageSection>
            ) : null}
            {p.insights.length > 0 ? (
                <PageSection>
                    <PageSectionHeader>
                        <PageSectionTitle>Para ficar de olho</PageSectionTitle>
                    </PageSectionHeader>
                    <InsightsDoResumo itens={p.insights} onDefinirLimite={p.onDefinirLimite} />
                </PageSection>
            ) : null}
        </div>
    )
}
