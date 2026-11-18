/**
 * A troca do dia preso da lista agrupada (`mobileGroups="inset"`): o cabeçalho
 * de cima não sobe; quando o próximo chega a menos de uma altura dele, ele gira
 * no próprio eixo e some, e o próximo toma o lugar por cima. `distancia` é a do
 * topo do próximo cabeçalho ao topo do preso, em px; sem altura medida, nada
 * gira. Com movimento reduzido, só esmaece.
 */
export function trocaDoDia(distancia: number, altura: number, reduzido = false): { giro: number; opacidade: number } {
  const p = altura > 0 ? Math.min(1, Math.max(0, 1 - distancia / altura)) : 0
  return { giro: reduzido ? 0 : 90 * p, opacidade: 1 - p }
}
