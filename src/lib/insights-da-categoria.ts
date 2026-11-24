import { mesEAno } from "@/components/analise-do-mes/rotulos"
import { labelYearMonthPt, shiftYearMonth } from "@/lib/budget-month"
import { maioresLancamentos, peso, type TipoDaCategoria } from "@/lib/categoria-detalhe"
import type { Compromissos } from "@/lib/categoria-resumo"
import { currencyBRL } from "@/lib/formatters"
import type { Insight } from "@/lib/insights/acoes"
import { paymentMethodLabel } from "@/lib/payment-methods"
import type { Transaction } from "@/lib/supabase"
import { reaisInteiros } from "@/components/categories/detail/regua-do-mes-contas"
import { SAZONAL } from "../../supabase/functions/_shared/insights/textos"

/** O que o botão do insight faz; quem desenha só liga cada tipo ao que já existe na página. */
export type AcaoDoInsight =
    | { tipo: "previsao" }
    | { tipo: "limite"; valor?: number }
    | { tipo: "link"; href: string }
    | { tipo: "filtrar"; descricao: string }
    | { tipo: "ordenar-por-valor" }
    | { tipo: "conta-a-pagar"; insightId: string }
    | { tipo: "recorrencia"; insightId: string }
    | { tipo: "atualizar-preco"; insightId: string }

/** O dado que o corpo do slide desenha; um tipo por insight, para a tela não reler o payload. */
export type CorpoDoInsight =
    | { tipo: "duplicado"; lancamentos: { descricao: string; dataYmd: string; forma: string; valor: number }[] }
    | { tipo: "conferir"; linhas: { dia: string; descricao: string; valor: number }[]; resto: number; total: number }
    | { tipo: "ritmo"; lancado: number; previsto: number; limite: number }
    | { tipo: "sazonal"; dataYmd: string | null; valor: number }
    | { tipo: "parcela"; atual: number; total: number }
    | { tipo: "recorrencia"; insightId: string; valorMedio: number }
    | { tipo: "preco"; de: number; para: number }
    | { tipo: "limite"; lancado: number; sugerido: number }
    | { tipo: "concentracao"; partes: { nome: string; valor: number }[]; resto: number }

export type InsightDaCategoria = {
    id: string
    ordem: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    titulo: string
    numero: string
    tom?: "success" | "warning"
    linha: string
    rotulo: string
    /** `dado`: o número é a notícia e a ação é um link no canto; `acao`: o botão de largura toda. */
    foco: "dado" | "acao"
    corpo: CorpoDoInsight
    acao: AcaoDoInsight
}

const str = (v: unknown) => (typeof v === "string" ? v : "")
const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0))
/** "2026-03" → "março". */
const soMes = (ym: string) => labelYearMonthPt(ym).toLocaleLowerCase("pt-BR").split(" ")[0]
/** "2027-08" visto em 2026 → "ago/27" (a forma do cartão Parcelas, que cabe numa linha); no mesmo ano, "agosto". */
const dmy = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`
const mesComAno = (ym: string, vistoYm: string) => (ym.slice(0, 4) === vistoYm.slice(0, 4) ? soMes(ym) : mesEAno(ym))

/** Os insights que a página calcula sozinha (ordens 2, 3, 5, 8 e 9). */
export function insightsLocais(a: {
    tipo: TipoDaCategoria
    categoryId: string
    yearMonth: string
    aberto: boolean
    lancado: number
    previsto: number
    media: number | null
    limite: number | null
    txs: Transaction[]
    compromissos: Compromissos
}): InsightDaCategoria[] {
    const { tipo, categoryId, aberto, lancado, previsto, media, limite, txs } = a
    const r: InsightDaCategoria[] = []

    const conferir = txs.filter((t) => t.needs_review)
    if (conferir.length > 0) {
        const total = conferir.reduce((s, t) => s + Number(t.amount || 0), 0)
        const recentes = [...conferir].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 2)
        r.push({
            id: "a-conferir",
            ordem: 2,
            titulo: `${conferir.length} para conferir`,
            numero: reaisInteiros(total),
            linha: "Lançados pelo app e ainda não vistos",
            rotulo: "Conferir agora",
            foco: "acao",
            corpo: {
                tipo: "conferir",
                linhas: recentes.map((t) => ({ dia: dmy(t.date), descricao: t.description ?? "", valor: Number(t.amount || 0) })),
                resto: conferir.length - recentes.length,
                total,
            },
            acao: { tipo: "link", href: `/transactions?conferir=1&cats=${categoryId}` },
        })
    }

    if (aberto && limite != null && limite > 0 && lancado + previsto > limite) {
        const fecha = lancado + previsto
        r.push({
            id: "ritmo",
            ordem: 3,
            titulo: "Vai passar do limite",
            numero: `${reaisInteiros(fecha - limite)} acima`,
            tom: "warning",
            linha: `Fecha em ${reaisInteiros(fecha)} · limite ${reaisInteiros(limite)}`,
            rotulo: "Ajustar limite",
            foco: "dado",
            corpo: { tipo: "ritmo", lancado, previsto, limite },
            acao: { tipo: "limite" },
        })
    }

    const termina = a.compromissos.itens
        .filter((i) => i.tipo === "parcela" && i.terminaYm)
        .sort((x, y) => x.terminaYm!.localeCompare(y.terminaYm!))[0]
    if (termina) {
        const atual = termina.atual ?? termina.total ?? 0
        r.push({
            id: "parcela-termina",
            ordem: 5,
            titulo: `Sobra em ${mesComAno(shiftYearMonth(termina.terminaYm!, 1), a.yearMonth)}`,
            numero: `+${reaisInteiros(termina.valor)}/mês`,
            tom: "success",
            linha: `${termina.nome} · ${atual} de ${termina.total} · termina em ${mesComAno(termina.terminaYm!, a.yearMonth)}`,
            rotulo: "Ver na Previsão",
            foco: "dado",
            corpo: { tipo: "parcela", atual, total: termina.total ?? atual },
            acao: { tipo: "previsao" },
        })
    }

    if (tipo === "expense" && limite == null && media != null && media > 0) {
        const sugerido = Math.ceil(media / 100) * 100
        r.push({
            id: "limite",
            ordem: 8,
            titulo: "Sugestão de limite",
            numero: `${reaisInteiros(sugerido)}/mês`,
            linha: `Este mês: ${reaisInteiros(lancado)} · pela média de 6 meses`,
            rotulo: `Definir ${reaisInteiros(sugerido)}`,
            foco: "acao",
            corpo: { tipo: "limite", lancado, sugerido },
            acao: { tipo: "limite", valor: sugerido },
        })
    }

    const maiores = maioresLancamentos(txs, tipo, 2)
    const dois = maiores.reduce((s, t) => s + Number(t.amount || 0), 0)
    if (lancado > 0 && txs.filter((t) => peso(t, tipo) === 1).length >= 3 && maiores.length === 2 && dois <= lancado && dois / lancado > 0.7) {
        r.push({
            id: "concentracao",
            ordem: 9,
            titulo: "Dois gastos fizeram o mês",
            numero: `${Math.round((dois / lancado) * 100)}%`,
            linha: `${maiores[0].description} e ${maiores[1].description} · resto ${reaisInteiros(lancado - dois)}`,
            rotulo: "Ver os dois",
            foco: "dado",
            corpo: {
                tipo: "concentracao",
                partes: maiores.map((t) => ({ nome: t.description ?? "", valor: Number(t.amount || 0) })),
                resto: lancado - dois,
            },
            acao: { tipo: "ordenar-por-valor" },
        })
    }
    return r
}

/**
 * Os insights da caixa que são desta categoria (ordens 1, 4, 6 e 7). Payload antigo ou
 * incompleto some em silêncio: o sazonal sem `category_id` e a recorrência sem `nome`.
 */
export function insightsDaCaixa(
    linhas: Insight[],
    c: {
        categoryId: string
        assinaturas: { id: string; category_id: string | null }[]
        /** Os lançamentos do mês e da categoria da página: o duplicado lê os dois ids daqui. */
        txs: Transaction[]
    },
): InsightDaCategoria[] {
    const r: InsightDaCategoria[] = []
    const porId = new Map(c.txs.map((t) => [t.id, t]))
    for (const l of linhas) {
        const p = l.payload
        switch (l.kind) {
            case "duplicidade": {
                const ids = Array.isArray(p.ids) ? p.ids.filter((x): x is string => typeof x === "string") : []
                const descricao = str(p.descricao)
                if (!descricao || !(ids.length === 2 && ids.every((id) => porId.has(id)))) break
                const data = str(p.dataYmd)
                r.push({
                    id: l.id,
                    ordem: 1,
                    titulo: "Lançamento repetido?",
                    numero: reaisInteiros(num(p.valor)),
                    linha: `${descricao}, duas vezes em ${dmy(data)}`,
                    rotulo: "Ver os dois na lista",
                    foco: "acao",
                    corpo: {
                        tipo: "duplicado",
                        lancamentos: ids.map((id) => {
                            const t = porId.get(id)!
                            return {
                                descricao: t.description ?? "",
                                dataYmd: t.date.slice(0, 10),
                                forma: paymentMethodLabel(t.payment_method),
                                valor: Number(t.amount || 0),
                            }
                        }),
                    },
                    acao: { tipo: "filtrar", descricao },
                })
                break
            }
            case "sazonal": {
                if (p.category_id !== c.categoryId) break
                const termo = str(p.termo)
                const ym = str(p.mesAnterior)
                r.push({
                    id: l.id,
                    ordem: 4,
                    titulo: `${SAZONAL[termo] ?? termo} chega em ${soMes(ym)}`,
                    numero: reaisInteiros(num(p.valor)),
                    linha: `Foi o que você pagou em ${mesEAno(ym)}`,
                    rotulo: `Criar conta do ${SAZONAL[termo] ?? termo}`,
                    foco: "acao",
                    corpo: { tipo: "sazonal", dataYmd: str(p.dataYmd) || null, valor: num(p.valor) },
                    acao: { tipo: "conta-a-pagar", insightId: l.id },
                })
                break
            }
            case "recorrencia": {
                const nome = str(p.nome)
                if (!nome || p.category_id !== c.categoryId) break
                const n = Array.isArray(p.lancamentos) ? p.lancamentos.length : 0
                r.push({
                    id: l.id,
                    ordem: 6,
                    titulo: `${nome} todo mês`,
                    numero: `~${reaisInteiros(num(p.valorMedio))}/mês`,
                    linha: `Há ${n} meses seguidos, sem cadastro`,
                    rotulo: p.destino === "assinatura" ? "Virar assinatura" : "Virar conta a pagar",
                    foco: "acao",
                    corpo: { tipo: "recorrencia", insightId: l.id, valorMedio: num(p.valorMedio) },
                    acao: { tipo: "recorrencia", insightId: l.id },
                })
                break
            }
            case "preco_assinatura": {
                const nome = str(p.nome)
                const assinatura = c.assinaturas.find((s) => s.id === str(p.assinaturaId))
                if (!nome || !assinatura || assinatura.category_id !== c.categoryId) break
                const de = num(p.de)
                const para = num(p.para)
                r.push({
                    id: l.id,
                    ordem: 7,
                    titulo: `${nome} mudou de preço`,
                    numero: `${currencyBRL(de)} → ${currencyBRL(para)}`,
                    linha: `${para >= de ? "+" : "−"}${reaisInteiros(Math.abs((para - de) * 12))} por ano`,
                    rotulo: `Atualizar para ${currencyBRL(para)}`,
                    foco: "acao",
                    corpo: { tipo: "preco", de, para },
                    acao: { tipo: "atualizar-preco", insightId: l.id },
                })
                break
            }
        }
    }
    return r
}

const ESCREVE: AcaoDoInsight["tipo"][] = ["limite", "recorrencia", "atualizar-preco", "conta-a-pagar"]

/** O convidado não vê insight cuja ação escreve. */
export const paraQuemLe = (xs: InsightDaCategoria[], podeEscrever: boolean) =>
    podeEscrever ? xs : xs.filter((x) => !ESCREVE.includes(x.acao.tipo))

/** Pela ordem do carrossel; `sort` é estável. */
export const ordenarInsights = (xs: InsightDaCategoria[]) => [...xs].sort((a, b) => a.ordem - b.ordem)
