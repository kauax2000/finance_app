import { useEffect, useState } from "react"

import { invokeEdgeJson } from "@/lib/edge-invoke"
import { supabase, type WorkspaceRole } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"
import { doze } from "./precos"
import { FIM_FUNDADORES, PRECO_FAMILIA_CENTAVOS, PRECO_FUNDADOR_CENTAVOS } from "../../../supabase/functions/_shared/plano"

export * from "../../../supabase/functions/_shared/plano"
export { doze } from "./precos"

/** O que a RPC `meu_plano` devolve. */
export type MeuPlano = {
  plano: "familia" | "leitura"
  origem: "livre" | "assinatura" | "vitalicio" | "teste" | "convite" | "nenhuma"
  status: "pending" | "active" | "past_due" | "expired" | null
  teste_ate: string | null
  periodo_ate: string | null
  cancelar_no_fim: boolean
  preco_centavos: number | null
  fundador: boolean
  /** Bloco 8; o banco antes da migração não os tem (`?? null`). */
  cartao_final: string | null
  reembolsavel_ate: string | null
  carencia_ate: string | null
  checkout_url: string | null
}

export async function buscarMeuPlano(): Promise<MeuPlano> {
  const { data, error } = await supabase.rpc("meu_plano")
  if (error) throw error
  const p = data as unknown as Partial<MeuPlano> & Omit<MeuPlano, "cartao_final" | "reembolsavel_ate" | "carencia_ate" | "checkout_url">
  return {
    ...p,
    cartao_final: p.cartao_final ?? null,
    reembolsavel_ate: p.reembolsavel_ate ?? null,
    carencia_ate: p.carencia_ate ?? null,
    checkout_url: p.checkout_url ?? null,
  }
}

/** A Edge que ainda não subiu (404 do gateway) não aparece como erro solto. */
function semEdge(e: unknown): unknown {
  return e instanceof Error && /não encontrada \(404\)/.test(e.message) ? new Error("Ainda não disponível.") : e
}

/** Abre o checkout do Asaas: devolve a URL. O CPF vai só neste corpo. */
export async function assinar(nome: string, cpf: string): Promise<string> {
  try {
    const { url } = await invokeEdgeJson<{ url: string }>("billing-checkout", { body: { nome, cpf } })
    return url
  } catch (e) {
    throw semEdge(e)
  }
}

/** Devolve a `mensagem` do 202 (o reembolso pedido e ainda não confirmado), ou `null`. */
export async function alterarAssinatura(acao: "cancelar" | "desfazer" | "reembolsar"): Promise<string | null> {
  try {
    const r = await invokeEdgeJson<{ ok: boolean; mensagem?: string }>("billing-cancel", { body: { acao } })
    return r?.mensagem ?? null
  } catch (e) {
    throw semEdge(e)
  }
}

/**
 * Busca quando a sessão chega ou troca de pessoa (o `INITIAL_SESSION` do
 * `onAuthStateChange` cobre a montagem) e quando a janela volta ao foco. Em
 * erro, `plano` fica nulo: nada de aviso falso.
 */
export function usePlano(): { plano: MeuPlano | null; carregando: boolean } {
  const [estado, setEstado] = useState<{ plano: MeuPlano | null; carregando: boolean }>({ plano: null, carregando: true })

  useEffect(() => {
    let vivo = true
    let usuario: string | null | undefined
    const buscar = () =>
      buscarMeuPlano().then(
        (plano) => vivo && setEstado({ plano, carregando: false }),
        () => vivo && setEstado((e) => ({ ...e, carregando: false })),
      )
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const id = sessao?.user.id ?? null
      if (id === usuario) return
      usuario = id
      // Outra pessoa: o plano da anterior não vale. A RPC sai do callback
      // (`setTimeout`): chamar o Supabase dentro dele pode travar no lock da sessão.
      setEstado({ plano: null, carregando: true })
      setTimeout(buscar, 0)
    })
    window.addEventListener("focus", buscar)
    return () => {
      vivo = false
      subscription.unsubscribe()
      window.removeEventListener("focus", buscar)
    }
  }, [])

  return estado
}

export const fundadoresAbertos = (agora: Date) => agora.getTime() < Date.parse(FIM_FUNDADORES)

/** O preço anual do dia: o de fundador até o fim de janeiro. */
export function precoDoDia(agora: Date): number {
  return fundadoresAbertos(agora) ? PRECO_FUNDADOR_CENTAVOS : PRECO_FAMILIA_CENTAVOS
}

export type AcaoDoPlano = "assinar" | "atualizar_cartao" | "cancelar" | "desfazer" | "reembolsar" | "pagar_pendente"

type Resumo = { titulo: string; linhas: string[]; acoes: AcaoDoPlano[] }

/** DD/MM no fuso de quem lê. */
const diaMes = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

/**
 * O que a tela mostra e oferece. As ações seguem o `status` (Decisão 9): um
 * `past_due` pede o cartão mesmo com a `origem` já em teste, convite ou nenhuma.
 * O convidado não assina (Decisão 10); o servidor recusa também.
 */
export function resumoDoPlano(p: MeuPlano, agora: Date, papel: WorkspaceRole | null): Resumo {
  const r = resumoBase(p, agora)
  if (papel === "guest") return { ...r, acoes: [] }
  if (!p.checkout_url) return r
  return { ...r, acoes: ["pagar_pendente", ...r.acoes.filter((a) => a !== "assinar" && a !== "atualizar_cartao")] }
}

function resumoBase(p: MeuPlano, agora: Date): Resumo {
  if (p.status === "past_due") {
    return {
      titulo: "Não conseguimos renovar",
      linhas: [p.carencia_ate ? `Atualize o cartão até ${diaMes(p.carencia_ate)}.` : "Atualize o cartão."],
      // Cancelado, o plano acaba na tolerância: pagar não faz sentido, só desfazer (Rulings 11 e 14).
      acoes: p.cancelar_no_fim ? ["desfazer"] : ["atualizar_cartao", "cancelar"],
    }
  }
  switch (p.origem) {
    case "livre":
      return { titulo: "Plano Família", linhas: ["Tudo liberado até o lançamento da assinatura."], acoes: [] }
    case "teste":
      return {
        titulo: p.teste_ate ? `Teste grátis até ${formatDatePtBr(p.teste_ate)}` : "Teste grátis",
        linhas: [],
        acoes: ["assinar"],
      }
    case "assinatura": {
      const linhas = [
        p.cancelar_no_fim
          ? `Termina em ${formatDatePtBr(p.periodo_ate)}`
          : `Renova em ${formatDatePtBr(p.periodo_ate)}: ${doze(p.preco_centavos ?? precoDoDia(agora))}`,
      ]
      if (p.cartao_final) linhas.push(`Cartão final ${p.cartao_final}`)
      if (p.status !== "active") return { titulo: "Plano Família", linhas, acoes: [] }
      const acoes: AcaoDoPlano[] = []
      // Com carência, a renovação foi cobrada e espera confirmação: o servidor recusa cancelar (Ruling 12).
      if (p.carencia_ate) linhas.push("Renovação em confirmação.")
      else acoes.push(p.cancelar_no_fim ? "desfazer" : "cancelar")
      if (p.reembolsavel_ate && agora < new Date(p.reembolsavel_ate)) acoes.push("reembolsar")
      return { titulo: "Plano Família", linhas, acoes }
    }
    case "vitalicio":
      return { titulo: "Plano Família vitalício", linhas: [], acoes: [] }
    case "convite":
      return { titulo: "Coberto pelo plano da família", linhas: [], acoes: [] }
    case "nenhuma":
      return { titulo: "Conta em só leitura", linhas: ["Tudo continua visível; exportar e apagar seguem liberados."], acoes: ["assinar"] }
  }
}
