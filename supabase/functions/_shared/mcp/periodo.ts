const MES = /^\d{4}-(0[1-9]|1[0-2])$/

export function mesDe(hoje: string): string {
  return hoje.slice(0, 7)
}

export function intervaloDoMes(mes: string): { inicio: string; fim: string } {
  if (!MES.test(mes)) throw new Error('mes_invalido')
  const [a, m] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, '0')}` }
}

export function mesAnterior(mes: string): string {
  if (!MES.test(mes)) throw new Error('mes_invalido')
  const [a, m] = mes.split('-').map(Number)
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`
}

/** Data real de calendário: `2026-02-30` passa no formato, mas o `Date` rola para março. */
export function dataValida(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
