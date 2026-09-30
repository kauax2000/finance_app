/**
 * Quando um contador de caracteres acende: nos últimos 10% ou 20 caracteres,
 * o que vier antes. A régua é uma só para o `Textarea` (rodada 180), o
 * `FieldCounter` (rodada 192) e o contador do `InputGroup` (rodada 193) — eram
 * três cópias da mesma conta.
 */
export function pertoDoLimite(restam: number, max: number) {
  return restam <= Math.max(20, Math.ceil(max * 0.1))
}
