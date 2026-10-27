import { currencyBRL } from '../formatters.ts'

export type Dinheiro = { valor: number; texto: string }

/** Os cálculos correm em centavos inteiros; só aqui viram reais. */
export function dinheiro(centavos: number): Dinheiro {
  const valor = centavos / 100
  return { valor, texto: currencyBRL(valor) }
}

export function ok(dados: Record<string, unknown>) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(dados) }], structuredContent: dados }
}

export function falha(mensagem: string) {
  return { content: [{ type: 'text' as const, text: mensagem }], isError: true as const }
}

export function mensagemDoErroDoBanco(e: { code?: string; message?: string }): string {
  if (e.message?.includes('workspace_somente_leitura')) {
    return 'Sua carteira está só leitura no plano atual. Para registrar, a pessoa titular precisa reativar o plano no app.'
  }
  if (e.code === '42501') return 'Você não tem permissão para isso nessa carteira.'
  return 'Não foi possível concluir. Tente de novo.'
}

export type Carteira = { id: string; name: string; type: 'personal' | 'shared' }

export function escolherCarteira(
  carteiras: Carteira[],
  pedida?: string,
): { carteira: Carteira } | { erro: string } {
  if (carteiras.length === 0) return { erro: 'Você ainda não participa de nenhuma carteira.' }
  if (pedida) {
    const c = carteiras.find((x) => x.id === pedida)
    return c ? { carteira: c } : { erro: 'Carteira não encontrada. Use listar_carteiras para ver os ids.' }
  }
  const pessoal = carteiras.find((x) => x.type === 'personal')
  if (pessoal) return { carteira: pessoal }
  return { carteira: [...carteiras].sort((a, b) => a.name.localeCompare(b.name))[0] }
}
