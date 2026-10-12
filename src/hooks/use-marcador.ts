"use client"

import * as React from "react"

import { TRAJETO_MACIO, viajarLiquido, type CaixaLiquida } from "@/lib/liquid-move"
import { caixaDoAtivo } from "@/lib/marcador"

type UseMarcadorOptions = {
  /** O elemento que contém os itens e o marcador, e onde as variáveis são escritas. */
  trilha: React.RefObject<HTMLElement | null>
  /** A peça que viaja. */
  marcador: React.RefObject<HTMLElement | null>
  /** O item ativo agora, ou `null` quando nenhum está — e aí não há marca. */
  ativo: (trilha: HTMLElement) => HTMLElement | null
  /** Os atributos cuja troca é troca de ativo (`data-state`, `aria-current`…). */
  atributos: string[]
  /** As variáveis saem como `--<prefixo>-x/y/w/h`. */
  prefixo: string
  /** Quanto o marcador recua para dentro do item, em px. */
  insete: number
  /** O eixo da fileira: decide o esticão e a régua do salto. */
  eixo?: "x" | "y"
  /** Há marcador. Sem ele (`Tabs plain`, `ToggleGroup` múltiplo) nada é medido nem observado. */
  viajar: boolean
  /**
   * Chamado a cada medida, com o ativo já publicado. Devolver `true` faz o
   * marcador acompanhar a caixa nova do mesmo item, sem esticão (o rótulo do
   * `BottomBar` que abre); sem isso o mesmo item só reposiciona.
   */
  acompanhar?: () => boolean
  /** O que, além das opções, refaz a medição (degrau, variante…). */
  deps?: React.DependencyList
}

/**
 * O marcador que viaja, um mecanismo só para `Tabs`, `BottomBar` e
 * `ToggleGroup`: cada um guarda o prefixo das variáveis e o DOM.
 *
 * Lê `offsetLeft`/`offsetTop` relativos à trilha, não `getBoundingClientRect`:
 * em coordenada de viewport o marcador escorregaria a cada pixel rolado. O
 * `ResizeObserver` pega mudança de largura e o `MutationObserver` nos
 * `atributos` pega a troca de ativo, o que faz o marcador seguir também a troca
 * programática e a seta; nada de laço por quadro.
 *
 * Quando o ativo muda (e não quando o mesmo só muda de tamanho), o marcador corre
 * pela receita do `ThemeToggle` (`viajarLiquido`), com esticão de 0,09 por item
 * andado e teto de 0,18. Devolve se já mediu: antes disso, e sem JavaScript,
 * quem marca a escolha é o próprio item, e o marcador não monta (escorregaria
 * de 0,0 até o lugar).
 */
export function useMarcador(o: UseMarcadorOptions): boolean {
  const [medido, setMedido] = React.useState(false)
  const anterior = React.useRef<{ el: HTMLElement; caixa: CaixaLiquida } | null>(null)
  const emCurso = React.useRef<Animation[]>([])

  // As funções são novas a cada render; o efeito lê sempre as da última.
  const opcoes = React.useRef(o)
  React.useLayoutEffect(() => {
    opcoes.current = o
  })

  const { trilha: trilhaRef, marcador, atributos, prefixo, insete, eixo = "x", viajar } = o
  const filtro = atributos.join(" ")

  React.useLayoutEffect(() => {
    const trilha = trilhaRef.current
    if (!trilha || !viajar) return

    const medir = () => {
      const ativa = opcoes.current.ativo(trilha)
      if (!ativa) {
        anterior.current = null
        setMedido(false)
        return
      }
      const caixa = caixaDoAtivo(
        { left: ativa.offsetLeft, top: ativa.offsetTop, width: ativa.offsetWidth, height: ativa.offsetHeight },
        insete
      )
      trilha.style.setProperty(`--${prefixo}-x`, `${caixa.x}px`)
      trilha.style.setProperty(`--${prefixo}-y`, `${caixa.y}px`)
      trilha.style.setProperty(`--${prefixo}-w`, `${caixa.w}px`)
      trilha.style.setProperty(`--${prefixo}-h`, `${caixa.h}px`)

      const antes = anterior.current
      anterior.current = { el: ativa, caixa }
      const peca = marcador.current
      const acompanha = opcoes.current.acompanhar?.() ?? false
      if (antes && peca && (antes.el !== ativa || acompanha)) {
        for (const a of emCurso.current) a.cancel()
        const vertical = eixo === "y"
        const passo = vertical ? caixa.h : caixa.w
        const andado = Math.abs(vertical ? caixa.y - antes.caixa.y : caixa.x - antes.caixa.x)
        // O mesmo item, só maior (o rótulo abriu): acompanha a largura sem esticar.
        const amplitude =
          antes.el === ativa ? 0 : Math.min(0.18, passo > 0 ? (andado / passo) * 0.09 : 0.09)
        emCurso.current = viajarLiquido(peca, antes.caixa, caixa, {
          amplitude,
          eixo,
          trajeto: TRAJETO_MACIO,
        })
      }
      setMedido(true)
    }

    medir()

    // O marcador não entra: a largura dele anima durante a viagem.
    const ro = new ResizeObserver(medir)
    const observar = (no: Node) => {
      // `nodeType` e não `instanceof Element`: no `IphoneFrame` o nó é de outra janela.
      if (no.nodeType === Node.ELEMENT_NODE && no !== marcador.current) ro.observe(no as Element)
    }
    ro.observe(trilha)
    for (const filho of trilha.children) observar(filho)

    const mo = new MutationObserver((registros) => {
      for (const r of registros) {
        if (r.target === trilha) r.addedNodes.forEach(observar)
      }
      medir()
    })
    mo.observe(trilha, {
      attributes: true,
      attributeFilter: filtro.split(" "),
      subtree: true,
      childList: true,
    })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
    // `deps` é de quem chama; as refs são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajar, prefixo, insete, eixo, filtro, ...(o.deps ?? [])])

  return viajar && medido
}
