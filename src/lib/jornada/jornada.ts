import {
    compareCalendarDates,
    estimatedDueDateForClose,
    formatDatePtBr,
    nextCloseAfter,
    previousStatementCloseBefore,
} from "@/lib/credit-card-billing"
import { supabase } from "@/lib/supabase"

export type Plataforma = "iphone" | "android" | "computador"

export function plataformaDe(userAgent: string): Plataforma {
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "iphone"
    if (/Android/i.test(userAgent)) return "android"
    return "computador"
}

type Canal = { titulo: string; texto: string; href: string }

/** Os caminhos do primeiro lançamento: dois valem em toda plataforma, um é da plataforma. */
export function canaisPara(p: Plataforma): Canal[] {
    const proprio: Record<Plataforma, Canal> = {
        iphone: {
            titulo: "Atalho do iPhone",
            texto: "Fale ou escreva o gasto e o Atalho lança. Crie o token em Minha conta.",
            href: "/account",
        },
        android: {
            titulo: "Compartilhar com o app",
            texto: "Instale o app e compartilhe o comprovante com ele.",
            href: "/transactions",
        },
        computador: {
            titulo: "Importar extrato",
            texto: "Suba o extrato do banco ou a sua planilha e o app lança de uma vez.",
            href: "/transactions?importar=1",
        },
    }
    return [
        {
            titulo: "Frase rápida",
            texto: "Escreva \"42 mercado\" e o app entende valor, descrição e categoria.",
            href: "/transactions?new=1",
        },
        proprio[p],
        {
            titulo: "Envie o PDF da última fatura",
            texto: "O app lê a fatura e confere com o que você já lançou.",
            href: "/credit-cards",
        },
    ]
}

type Cartao = { nome: string; closingDay: number; dueDay: number }

function menorData(datas: Date[]): Date | null {
    return datas.reduce<Date | null>((a, d) => (a && compareCalendarDates(a, d) <= 0 ? a : d), null)
}

/** Fecha estritamente depois de `hoje`; vence hoje ou depois (a fatura já fechada conta). */
function datasDoCartao(c: Cartao, hoje: Date): { fecha: Date; vence: Date } {
    const fecha = nextCloseAfter(hoje, c.closingDay)
    const dueAnterior = estimatedDueDateForClose(previousStatementCloseBefore(fecha, c.closingDay), c.dueDay)
    const vence = compareCalendarDates(dueAnterior, hoje) >= 0 ? dueAnterior : estimatedDueDateForClose(fecha, c.dueDay)
    return { fecha, vence }
}

const ymdParaData = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number)
    return new Date(y, m - 1, d, 12)
}

/** Uma linha por aviso; a preferência ausente conta como ligada (o padrão do banco). */
export function proximosAvisos(entrada: {
    prefs: Record<string, boolean>
    cartoes: Cartao[]
    proximaConta: { nome: string; data: string } | null
    hoje: Date
}): Array<{ aviso: string; ligado: boolean; proximo: string | null }> {
    const { prefs, cartoes, proximaConta, hoje } = entrada
    const ligado = (chave: string) => prefs[chave] !== false
    const datas = cartoes.map((c) => datasDoCartao(c, hoje))
    const fecha = menorData(datas.map((d) => d.fecha))
    const vence = menorData(datas.map((d) => d.vence))
    return [
        { aviso: "Fatura fechando", ligado: ligado("notify_credit_card_calendar"), proximo: fecha ? formatDatePtBr(fecha) : null },
        { aviso: "Fatura vencendo", ligado: ligado("notify_credit_card_calendar"), proximo: vence ? formatDatePtBr(vence) : null },
        {
            aviso: "Conta vencendo",
            ligado: ligado("notify_bills"),
            proximo: proximaConta ? `${proximaConta.nome} · ${formatDatePtBr(ymdParaData(proximaConta.data))}` : null,
        },
        { aviso: "Orçamento estourando", ligado: ligado("notify_budget"), proximo: null },
        { aviso: "A conferir", ligado: ligado("notify_review"), proximo: "às 20h" },
    ]
}

/** Marca a jornada como vista: `user_settings.jornada_concluida_em = now()` (a linha pode não existir). */
export async function concluirJornada(): Promise<void> {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) throw new Error("Entre na sua conta para continuar.")
    const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, jornada_concluida_em: new Date().toISOString() }, { onConflict: "user_id" })
    if (error) throw error
}
