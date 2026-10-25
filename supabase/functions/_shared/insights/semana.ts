/**
 * A semana do teto de push (3 por pessoa): começa na segunda, no dia de
 * Brasília. **Sem nenhum import**, como os outros módulos de `insights/`.
 */
export function segundaDaSemana(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  // getUTCDay: domingo 0 … sábado 6; o domingo volta 6 dias.
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}
