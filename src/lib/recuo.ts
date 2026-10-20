/**
 * O app recua enquanto um modal está aberto: a barra lateral e o conteúdo dão
 * um passo para trás (a escala do `globals.css`, só do `md` para cima) e o
 * modal chega na frente. Quem escurece é o véu de sempre; a escala é só
 * profundidade.
 *
 * Quem segura o recuo é um contador: dois modais empilhados (a confirmação de
 * dentro de um diálogo) recuam uma vez, e o app só volta quando o último fecha.
 *
 * A origem é o centro da tela que está à vista. A barra lateral é `fixed` e
 * recua por si; o conteúdo segue a rolagem da janela, por isso a origem é
 * medida nas coordenadas da caixa de cada um — com a página rolada, o centro
 * do conteúdo está mais abaixo, e nada pula de lugar.
 */

const REGIOES = "[data-slot=sidebar-container], [data-slot=sidebar-inset]"

/** A volta dura 200ms; sem transição (telefone, movimento reduzido) o `transitionend` não chega. */
const RESERVA_MS = 200

let abertos = 0
let geracao = 0

/** O centro da tela nas coordenadas da caixa. */
export function origemDoRecuo(
  caixa: { left: number; top: number },
  tela: { width: number; height: number }
): { x: number; y: number } {
  return { x: tela.width / 2 - caixa.left, y: tela.height / 2 - caixa.top }
}

/** Soma um modal aberto e devolve quem o fecha (chamar duas vezes desconta uma). */
export function abrirRecuo(doc: Document = document): () => void {
  abertos += 1
  geracao += 1
  if (abertos === 1) {
    for (const el of doc.querySelectorAll<HTMLElement>(REGIOES)) {
      // Reaberto no meio da volta, a origem ainda está lá: medir agora leria a
      // caixa já escalada, e a origem nova faria a região saltar.
      if (el.style.transformOrigin) continue
      const view = doc.defaultView
      const { x, y } = origemDoRecuo(el.getBoundingClientRect(), {
        width: view?.innerWidth ?? 0,
        height: view?.innerHeight ?? 0,
      })
      el.style.transformOrigin = `${x}px ${y}px`
    }
    doc.documentElement.dataset.recuo = ""
  }

  let fechado = false
  return () => {
    if (fechado) return
    fechado = true
    abertos -= 1
    if (abertos > 0) return
    delete doc.documentElement.dataset.recuo
    const minha = geracao
    for (const el of doc.querySelectorAll<HTMLElement>(REGIOES)) {
      depoisDaVolta(el, () => {
        // Outro modal abriu (e talvez fechou) no meio: a volta é dele.
        if (abertos > 0 || geracao !== minha) return
        el.style.transformOrigin = ""
        if (!el.getAttribute("style")) el.removeAttribute("style")
      })
    }
  }
}

function depoisDaVolta(el: HTMLElement, feito: () => void) {
  let pronto = false
  const fim = () => {
    if (pronto) return
    pronto = true
    el.removeEventListener("transitionend", aoFim)
    clearTimeout(reserva)
    feito()
  }
  // O `transitionend` sobe dos filhos: só o `transform` da própria região conta.
  const aoFim = (e: TransitionEvent) => {
    if (e.target === el && e.propertyName === "transform") fim()
  }
  el.addEventListener("transitionend", aoFim)
  const reserva = setTimeout(fim, RESERVA_MS)
}
