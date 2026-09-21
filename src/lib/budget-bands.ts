import type { ProgressBands } from "@/components/ui/progress"

/**
 * Os cortes da escada de cor das barras de consumo.
 *
 * Eles moram juntos porque a semelhança engana: as duas rampas têm a mesma
 * forma e respondem a **perguntas diferentes**, e enquanto estavam em arquivos
 * separados pareciam a mesma regra escrita com números errados num dos lados.
 * Lado a lado, a diferença fica óbvia e cada número fica com a sua razão.
 *
 * Antes desta rodada, `budgetFillColor` estava duplicado byte a byte em
 * `expense-category-card` e `category-detail-summary-section`, e
 * `limitGaugeFillClass` vivia no painel de fatura — três funções, duas
 * políticas, nenhum dono.
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
