import { useEffect, useState } from "react"

import { currencyBRL } from "@/lib/formatters"
import { supabase } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"
import { FIM_FUNDADORES, PRECO_FAMILIA_CENTAVOS, PRECO_FUNDADOR_CENTAVOS } from "../../../supabase/functions/_shared/plano"

export * from "../../../supabase/functions/_shared/plano"

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
}

export async function buscarMeuPlano(): Promise<MeuPlano> {
  const { data, error } = await supabase.rpc("meu_plano")
  if (error) throw error
  return data as unknown as MeuPlano
}

/** Busca ao montar e quando a janela volta ao foco. Em erro, `plano` fica nulo: nada de aviso falso. */
export function usePlano(): { plano: MeuPlano | null; carregando: boolean } {
  const [estado, setEstado] = useState<{ plano: MeuPlano | null; carregando: boolean }>({ plano: null, carregando: true })

  useEffect(() => {
    let vivo = true
    const buscar = () =>
      buscarMeuPlano().then(
        (plano) => vivo && setEstado({ plano, carregando: false }),
        () => vivo && setEstado((e) => ({ ...e, carregando: false })),
      )
    void buscar()
    window.addEventListener("focus", buscar)
    return () => {
      vivo = false
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

export const doze = (centavos: number) => `12x de ${currencyBRL(centavos / 1200)}`

export function resumoDoPlano(p: MeuPlano, agora: Date): { titulo: string; linhas: string[]; podeAssinar: boolean } {
  switch (p.origem) {
    case "livre":
      return { titulo: "Plano Família", linhas: ["Tudo liberado até o lançamento da assinatura."], podeAssinar: false }
    case "teste":
      return {
        titulo: p.teste_ate ? `Teste grátis até ${formatDatePtBr(p.teste_ate)}` : "Teste grátis",
        linhas: [],
        podeAssinar: true,
      }
    case "assinatura":
      return {
        titulo: "Plano Família",
        linhas: [
          p.cancelar_no_fim
            ? `Termina em ${formatDatePtBr(p.periodo_ate)}`
            : `Renova em ${formatDatePtBr(p.periodo_ate)}: ${doze(p.preco_centavos ?? precoDoDia(agora))}`,
        ],
        podeAssinar: false,
      }
    case "vitalicio":
      return { titulo: "Plano Família vitalício", linhas: [], podeAssinar: false }
    case "convite":
      return { titulo: "Coberto pelo plano da família", linhas: [], podeAssinar: false }
    case "nenhuma":
      return { titulo: "Conta em só leitura", linhas: ["Tudo continua visível; exportar e apagar seguem liberados."], podeAssinar: true }
  }
}
