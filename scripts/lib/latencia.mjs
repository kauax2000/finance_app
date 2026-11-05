// As contas do medidor de latência: puras, sem rede.

/** `null` é falha; os números saem em ms, arredondados. */
export function resumo(amostras) {
  const ok = amostras.filter((x) => x !== null).sort((a, b) => a - b)
  const falhas = amostras.length - ok.length
  const base = { n: amostras.length, falhas }
  if (ok.length === 0) {
    return { ...base, mediana: null, p95: null, min: null, max: null }
  }
  const k = ok.length
  const meio = k % 2 ? ok[(k - 1) / 2] : (ok[k / 2 - 1] + ok[k / 2]) / 2
  return {
    ...base,
    mediana: Math.round(meio),
    p95: Math.round(ok[Math.ceil(0.95 * k) - 1]),
    min: Math.round(ok[0]),
    max: Math.round(ok[k - 1]),
  }
}
