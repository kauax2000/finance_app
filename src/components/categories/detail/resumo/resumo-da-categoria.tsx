"use client"

import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import type { Fatia, TipoDaCategoria } from "@/lib/categoria-detalhe"
import type {
    Compromissos,
    compraTipica,
    diaDeMaisGasto,
    fatosDoMes,
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
import { FatosDoMes } from "./fatos-do-mes"
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
    fatos: ReturnType<typeof fatosDoMes>
    /** Abre o detalhe do lançamento que puxou o mês; null sem ele. */
    onAbrirLancamento: (() => void) | null
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

const ID_COMPROMETIDO = "ja-comprometido"

/** Leva a "Já comprometido" (o que o mês seguinte já tem previsto); sem animação com movimento reduzido. */
function rolarAteOComprometido() {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById(ID_COMPROMETIDO)?.scrollIntoView({ behavior: reduzido ? "auto" : "smooth", block: "start" })
}

/** Uma seção do Resumo com o título por cima; quem decide se ela aparece é quem chama. */
function Secao({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
    return (
        // A âncora para no pé da barra do topo, e não por baixo dela.
        <PageSection id={id} className={id ? "scroll-mt-(--top-bar-bottom)" : undefined}>
            <PageSectionHeader>
                <PageSectionTitle>{titulo}</PageSectionTitle>
            </PageSectionHeader>
            {children}
        </PageSection>
    )
}

/** A aba Resumo: gráficos → cartões → parcelas e repetições → insights, cada bloco com título. Recebe tudo pronto. */
export function ResumoDaCategoria(p: ResumoDaCategoriaProps) {
    const despesa = p.tipo === "expense"
    // As mesmas condições com que cada bloco some sozinho: sem conteúdo, sem título solto.
    const temGraficos =
        p.serie.some((m) => m.total !== 0) ||
        p.ritmo.some((d) => (d.atual ?? 0) !== 0 || d.anterior !== 0) ||
        p.porPagamento.length > 0 ||
        p.diasDaSemana.some((d) => d.total > 0) ||
        p.faixas.some((f) => f.quantidade > 0)
    const temCartoes = p.maior != null || p.tipica != null || p.frequente != null || p.diaDeMais != null
    const temCompromissos = p.compromissos.itens.length > 0 || p.repetidas.length > 0
    const verComprometido = temCompromissos ? rolarAteOComprometido : null
    return (
        <div className="grid gap-6">
            {temGraficos ? (
                <Secao titulo="Como o mês andou">
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
                </Secao>
            ) : null}
            {temCartoes ? (
                <Secao titulo={despesa ? "Destaques dos gastos" : "Destaques das entradas"}>
                    <CartoesDoGasto tipo={p.tipo} cor={p.cor} maior={p.maior} tipica={p.tipica} frequente={p.frequente} diaDeMais={p.diaDeMais} />
                </Secao>
            ) : null}
            {temCompromissos ? (
                <Secao titulo={despesa ? "Já comprometido" : "O que entra todo mês"} id={ID_COMPROMETIDO}>
                    <CompromissosERepeticoes
                        tipo={p.tipo}
                        cor={p.cor}
                        hojeYmd={p.hojeYmd}
                        compromissos={p.compromissos}
                        repetidas={p.repetidas}
                    />
                </Secao>
            ) : null}
            {p.fatos.length > 0 || p.insights.length > 0 ? (
                <Secao titulo="Para ficar de olho">
                    <div className="grid gap-3">
                        <FatosDoMes
                            fatos={p.fatos}
                            tipo={p.tipo}
                            cor={p.cor}
                            onAbrirLancamento={p.onAbrirLancamento}
                            onVerComprometido={verComprometido}
                        />
                        <InsightsDoResumo itens={p.insights} onDefinirLimite={p.onDefinirLimite} />
                    </div>
                </Secao>
            ) : null}
        </div>
    )
}
