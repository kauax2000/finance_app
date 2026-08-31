/**
 * A busca das superfícies de comando — uma só, para o `Command` e o `Combobox`.
 *
 * ## O padrão do cmdk erra em português
 *
 * O cmdk casa por **subsequência difusa**: as letras da consulta só precisam
 * aparecer na ordem, em qualquer posição. Digitar "cor" traz `Carousel` e
 * `Combobox` antes de `Cores`, porque as três letras estão lá, espalhadas. E
 * ele não conhece acento: "graficos" não acha "Gráficos".
 *
 * A paleta do catálogo já escrevia o conserto à mão, inline. Este arquivo é o
 * mesmo filtro, num lugar onde o segundo consumidor pode encontrá-lo — que é a
 * definição de régua compartilhada que `menu-classes` e `field-classes` já
 * seguem.
 *
 * ## Ela gradua, e a graduação é o ponto
 *
 * Uma versão anterior devolvia 1 ou 0. Com tudo empatado vencia a ordem do
 * registro, e digitar "badge" trazia `Cores` na frente do `Badge` — porque a
 * palavra aparece no texto daquela página. Um campo que diz "buscar componente"
 * precisa que o componente venha primeiro: **o nome pesa mais que o corpo**.
 *
 * | Onde casou | Nota |
 * | --- | --- |
 * | começo do rótulo | 1 |
 * | meio do rótulo | 0,8 |
 * | no corpo (`keywords`) | 0,4 |
 * | em lugar nenhum | 0 |
 *
 * **Não somar um degrau de prefixo para `keywords`.** Ele reordenaria a paleta
 * do catálogo, e esta extração promete não mudar o comportamento dela.
 *
 * ## O vão que o `Combobox` abre
 *
 * No catálogo, `value` é texto legível (`"Badge badge Rótulo curto…"`). Num
 * combobox de dados reais, `value` é a **chave de máquina** — `"cat_7f3a"` —, e
 * nenhuma consulta casaria com ela. Por isso o `ComboboxItem` deriva
 * `keywords` do próprio rótulo quando ele é texto, e aceita `keywords`
 * explícito quando não é. O filtro daqui não tem como adivinhar isso: quem sabe
 * qual é o rótulo é quem renderiza a linha.
 */

/**
 * Acentos fora dos dois lados da comparação: quem digita "graficos" acha
 * "Gráficos", e quem digita "Gráficos" também.
 *
 * A classe de combinantes vai escrita como faixa de code points
 * (`\u0300-\u036f`) e não com os glifos crus, que num editor aparecem colados
 * no colchete e já foram lidos como erro de digitação mais de uma vez.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/**
 * A assinatura é a do cmdk: `(value, search, keywords?) => number`. Consulta
 * vazia devolve 1 para tudo, que é como o cmdk pede "mostre a lista inteira".
 */
export function commandFilter(
  value: string,
  search: string,
  keywords?: string[]
): number {
  const q = normalizeSearchText(search)
  if (!q) return 1

  const rotulo = normalizeSearchText(value)
  if (rotulo.startsWith(q)) return 1
  if (rotulo.includes(q)) return 0.8

  const corpo = normalizeSearchText((keywords ?? []).join(" "))
  return corpo.includes(q) ? 0.4 : 0
}
