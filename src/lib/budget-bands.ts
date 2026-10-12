import type { ProgressBands } from "@/components/ui/progress"

/**
 * Os cortes da escada de cor das barras de consumo. As duas rampas têm a mesma
 * forma e respondem a perguntas diferentes; moram juntas para cada número ficar
 * com a sua razão.
 */

/**
 * **Orçamento de categoria.** Verde até 85% do limite, âmbar de 85 a 100,
 * vermelho acima. O corte de cima é o próprio limite: gastar mais do que o
 * orçado é o estouro, e o componente já o trata como caso à parte.
 */
export const BUDGET_BANDS: ProgressBands = [85, 100]

/**
 * **Limite estimado do cartão.** Verde só até 30%, âmbar até 70, vermelho daí
 * em diante — muito mais conservador que o orçamento, e de propósito: um
 * orçamento é uma meta que a pessoa escolheu gastar, e o limite do cartão é
 * uma margem que ela não quer encostar.
 *
 * E a rampa é de **estado**, não de direção de dinheiro: um limite folgado é
 * "deu certo" (`success`), não "entrou dinheiro" (`income`).
 */
export const CARD_LIMIT_BANDS: ProgressBands = [30, 70]
