/**
 * O contador de caracteres. A régua é uma só para o `Textarea` (rodada 180),
 * o `FieldCounter` (rodada 192) e o contador do `InputGroup` (rodada 193) —
 * eram três cópias da mesma conta e da mesma frase. Cada peça continua dona
 * de quando o número aparece (sempre, ou só perto do teto) e de onde.
 */

/** Quando um contador acende: nos últimos 10% ou 20 caracteres, o que vier antes. */
export function pertoDoLimite(restam: number, max: number) {
  return restam <= Math.max(20, Math.ceil(max * 0.1))
}

/** O que falta e se acendeu, para o número à vista e a região viva lerem a mesma conta. */
export function contarCaracteres(count: number, max: number) {
  const restam = max - count
  return { restam, perto: pertoDoLimite(restam, max) }
}

/**
 * A região viva: o número à vista é `aria-hidden`, e quem fala é ela, só perto
 * do teto — uma vez por mudança, e não em cada foco.
 */
export function CharCountLive({ restam, perto }: { restam: number; perto: boolean }) {
  return (
    <span className="sr-only" aria-live="polite">
      {perto ? `Restam ${restam} caracteres` : ""}
    </span>
  )
}
