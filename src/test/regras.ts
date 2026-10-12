/**
 * As regras que vários testes do design system trancam, cada uma escrita uma
 * vez. Quem chama continua dono do `it` e do nome; aqui mora só a conta.
 */
import { expect } from "vitest"

import { blocoCss } from "./fonte"

/** Nenhum par repete o valor — o defeito do `Item`, que tinha dois nomes para a mesma string. */
export function esperarDistintos(valores: readonly unknown[], mensagem?: string) {
  expect(new Set(valores).size, mensagem).toBe(valores.length)
}

/** A escada não desce: ordenar não muda nada. Com `estrito`, ela também não repete degrau. */
export function esperarCrescente(
  seq: readonly number[],
  { estrito = false, mensagem }: { estrito?: boolean; mensagem?: string } = {}
) {
  expect(seq, mensagem).toStrictEqual([...seq].sort((a, b) => a - b))
  if (estrito) esperarDistintos(seq, mensagem)
}

/** Cada degrau sobe exatamente `passo` sobre o anterior. */
export function esperarPasso(seq: readonly number[], passo: number, nomes?: readonly string[]) {
  for (let i = 1; i < seq.length; i++) {
    expect(seq[i] - seq[i - 1], nomes && `${nomes[i - 1]} → ${nomes[i]}`).toBe(passo)
  }
}

/** O Tailwind varre o código como texto: uma classe montada por interpolação nunca chega ao CSS. */
export function esperarSemClasseMontada(codigo: string) {
  expect(codigo).not.toMatch(/`[^`]*\$\{[^}]*\}[^`]*`/)
}

/**
 * Os realces que acendem no cursor e ficam inertes no dedo: cada string com
 * `hover:bg-` ou `hover:shadow-` sem o `active:` da mesma família. `hover:`
 * compila dentro de `@media (hover: hover)`, e a regra H do auditor varre
 * `className="…"` — não enxerga dentro de `cva()` nem de `cn()`.
 */
export function realcesSemParDeToque(codigo: string): string[] {
  const semPar: string[] = []
  for (const [, classes] of codigo.matchAll(/"([^"]*hover:(?:bg|shadow)-[^"]*)"/g)) {
    for (const familia of ["bg", "shadow"]) {
      const acendeNoCursor = new RegExp(`(?:^|\\s|:)hover:${familia}-`).test(classes)
      const acendeNoDedo = new RegExp(`(?:^|\\s|:)active:${familia}-`).test(classes)
      if (acendeNoCursor && !acendeNoDedo) semPar.push(`${familia}: ${classes.slice(0, 70)}…`)
    }
  }
  return semPar
}

/**
 * Utility nova mora depois de `@utility no-scrollbar`: `glass.test.ts` fatia o
 * CSS de `@utility glass-control` até ela, e uma utility nessa faixa reprova
 * asserções de outro componente. Devolve o bloco que começa em `abre` (até
 * `fecha`, como em `blocoCss`).
 */
export function esperarDepoisDeNoScrollbar(
  css: string,
  abre: string,
  { fecha, mensagem }: { fecha?: string; mensagem?: string } = {}
): string {
  expect(css.indexOf(abre), mensagem).toBeGreaterThan(css.indexOf("@utility no-scrollbar"))
  return blocoCss(css, abre, fecha)
}
