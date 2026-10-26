import { useCallback, useEffect, useRef, useState } from "react"

import { invokeEdgeJson } from "@/lib/edge-invoke"
import { isEdgeInvokeTransportFailure } from "@/lib/edge-errors"
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

/** O erro das ações do plano: a mensagem já é a que a tela mostra, em português. */
export class ErroDoPlano extends Error {}

export const FALHA_DO_SERVIDOR = "Não foi possível falar com o servidor. Tente de novo."

/**
 * Só a frase que a Edge mandou (o `Error` simples do `invokeEdgeJson`) chega à
 * tela. A Edge que ainda não subiu (o 404 do gateway) é "Ainda não disponível.";
 * falha de rede, `TypeError` e o fallback em inglês viram `FALHA_DO_SERVIDOR`.
 */
function traduzir(e: unknown): ErroDoPlano {
  if (e instanceof ErroDoPlano) return e
  if (!(e instanceof Error) || e.constructor !== Error || !e.message) return new ErroDoPlano(FALHA_DO_SERVIDOR)
  if (/não encontrada \(404\)/.test(e.message)) return new ErroDoPlano("Ainda não disponível.")
  if (isEdgeInvokeTransportFailure(e) || /^Edge function failed/i.test(e.message)) return new ErroDoPlano(FALHA_DO_SERVIDOR)
  return new ErroDoPlano(e.message)
}

/** Só um endereço `https:` é aberto: o checkout do Asaas. */
export function urlDoPagamento(u: unknown): string | null {
  if (typeof u !== "string") return null
  try {
    return new URL(u).protocol === "https:" ? u : null
  } catch {
    return null
  }
}

/** Abre o checkout do Asaas: devolve a URL. O CPF vai só neste corpo. */
export async function assinar(nome: string, cpf: string): Promise<string> {
  let r: { url?: unknown } | null
  try {
    r = await invokeEdgeJson<{ url?: unknown } | null>("billing-checkout", { body: { nome, cpf } })
  } catch (e) {
    throw traduzir(e)
  }
  const url = urlDoPagamento(r?.url)
  if (!url) throw new ErroDoPlano("Não foi possível abrir o pagamento. Tente de novo.")
  return url
}

/** Devolve a `mensagem` do 202 (o reembolso pedido e ainda não confirmado), ou `null`. */
export async function alterarAssinatura(acao: "cancelar" | "desfazer" | "reembolsar"): Promise<string | null> {
  try {
    const r = await invokeEdgeJson<{ ok?: boolean; mensagem?: unknown } | null>("billing-cancel", { body: { acao } })
    return typeof r?.mensagem === "string" ? r.mensagem : null
  } catch (e) {
    throw traduzir(e)
  }
}

/** A volta do checkout terminou: o status mudou, ou já é um plano ativo sem renovação à espera. */
export function retornoConcluido(inicial: MeuPlano, atual: MeuPlano): boolean {
  return atual.status !== inicial.status || (atual.status === "active" && !atual.carencia_ate)
}

/**
 * Busca quando a sessão chega ou troca de pessoa (o `INITIAL_SESSION` do
 * `onAuthStateChange` cobre a montagem) e quando a janela volta ao foco. Em
 * erro, `plano` fica nulo: nada de aviso falso.
 */
export function usePlano(): { plano: MeuPlano | null; carregando: boolean; recarregar: () => Promise<MeuPlano | null> } {
  const [estado, setEstado] = useState<{ plano: MeuPlano | null; carregando: boolean }>({ plano: null, carregando: true })
  const buscarRef = useRef<() => Promise<MeuPlano | null>>(() => Promise.resolve(null))

  useEffect(() => {
    let vivo = true
    let usuario: string | null | undefined
    const buscar = () =>
      buscarMeuPlano().then(
        (plano) => {
          if (vivo) setEstado({ plano, carregando: false })
          return plano
        },
        () => {
          if (vivo) setEstado((e) => ({ ...e, carregando: false }))
          return null
        },
      )
    buscarRef.current = buscar
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

  // Lê de novo e devolve o plano lido (`null` em erro); a tela mostra sempre o do hook.
  const recarregar = useCallback(() => buscarRef.current(), [])
  return { ...estado, recarregar }
}

export const fundadoresAbertos = (agora: Date) => agora.getTime() < Date.parse(FIM_FUNDADORES)

/** O preço anual do dia: o de fundador até o fim de janeiro. */
export function precoDoDia(agora: Date): number {
  return fundadoresAbertos(agora) ? PRECO_FUNDADOR_CENTAVOS : PRECO_FAMILIA_CENTAVOS
}

export type AcaoDoPlano = "assinar" | "atualizar_cartao" | "cancelar" | "desfazer" | "reembolsar" | "pagar_pendente"

type Resumo = { titulo: string; linhas: string[]; acoes: AcaoDoPlano[] }

const DIA_MES_BRASILIA = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })

/** DD/MM no horário de Brasília, como o backend conta os dias. */
const diaMes = (iso: string) => DIA_MES_BRASILIA.format(new Date(iso))

/**
 * O que a tela mostra e oferece. As ações seguem o `status` (Decisão 9): um
 * `past_due` pede o cartão mesmo com a `origem` já em teste, convite ou nenhuma.
 * O convidado não assina (Decisão 10); o servidor recusa também. Com o papel
 * ainda carregando (`null`), nenhuma ação aparece.
 */
export function resumoDoPlano(p: MeuPlano, agora: Date, papel: WorkspaceRole | null): Resumo {
  const r = resumoBase(p, agora)
  if (papel === null || papel === "guest") return { ...r, acoes: [] }
  // Um past_due cancelado acaba na tolerância: não há o que continuar pagando.
  if (!p.checkout_url || (p.status === "past_due" && p.cancelar_no_fim)) return r
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
