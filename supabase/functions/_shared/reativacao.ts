// Os avisos de reativação (Edge `reativacao`): o 3º e o 7º dia sem acesso.

const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

/** O aviso de quem está há `dias` sem acesso: 3 de 3 a 6, 7 de 7 a 9, senão nenhum. Um cron perdido só atrasa. */
export function marcoDoDia(dias: number): 3 | 7 | null {
  if (dias >= 3 && dias <= 6) return 3
  if (dias >= 7 && dias <= 9) return 7
  return null
}

/** O texto do push; `ultimoAcessoYmd` (`AAAA-MM-DD`, data de Brasília) dá o dia da semana do marco 3. */
export function textoDoAviso(marco: 3 | 7, ultimoAcessoYmd: string): { titulo: string; corpo: string } {
  if (marco === 7) {
    return { titulo: 'Uma semana sem lançar', corpo: 'Abra o Finance e ponha o mês em dia.' }
  }
  const [y, m, d] = ultimoAcessoYmd.split('-').map(Number)
  const diaDaSemana = DIAS_DA_SEMANA[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]
  return {
    titulo: 'Seus gastos estão esperando',
    corpo: `Leva 10 segundos lançar o que você gastou desde ${diaDaSemana}.`,
  }
}
