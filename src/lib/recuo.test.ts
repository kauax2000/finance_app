import { afterEach, describe, expect, it, vi } from "vitest"
import { abrirRecuo, origemDoRecuo } from "@/lib/recuo"
import { blocoCss, lerFonte, semComentarios } from "@/test/fonte"

describe("origemDoRecuo", () => {
  it("é o centro da tela nas coordenadas da caixa", () => {
    expect(origemDoRecuo({ left: 0, top: 0 }, { width: 1280, height: 800 })).toEqual({ x: 640, y: 400 })
  })

  it("acompanha a rolagem: o conteúdo rolado 1200px tem o centro mais abaixo", () => {
    expect(origemDoRecuo({ left: 256, top: -1200 }, { width: 1280, height: 800 })).toEqual({ x: 384, y: 1600 })
  })
})

describe("abrirRecuo", () => {
  // O `document` mínimo: sem regiões para medir, só o atributo no `<html>`.
  const doc = { documentElement: { dataset: {} as DOMStringMap }, querySelectorAll: () => [] } as unknown as Document

  it("dois modais empilhados recuam uma vez e só voltam quando o último fecha", () => {
    const fecharA = abrirRecuo(doc)
    const fecharB = abrirRecuo(doc)
    fecharB()
    expect(doc.documentElement.dataset.recuo).toBe("")
    fecharA()
    expect(doc.documentElement.dataset.recuo).toBeUndefined()
  })

  it("fechar o mesmo modal duas vezes não desconta duas", () => {
    const fecharA = abrirRecuo(doc)
    const fecharB = abrirRecuo(doc)
    fecharB()
    fecharB()
    expect(doc.documentElement.dataset.recuo).toBe("")
    fecharA()
    expect(doc.documentElement.dataset.recuo).toBeUndefined()
  })
})

describe("a volta do recuo", () => {
  afterEach(() => vi.useRealTimers())

  // Uma região falsa: a caixa no topo da tela, sem `transitionend` (só a reserva limpa).
  function regiao() {
    let estilo: string | null = null
    const el = {
      style: { transformOrigin: "" },
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      addEventListener() {},
      removeEventListener() {},
      getAttribute: () => estilo,
      removeAttribute: () => (estilo = null),
    }
    const doc = {
      documentElement: { dataset: {} as DOMStringMap },
      defaultView: { innerWidth: 1280, innerHeight: 800 },
      querySelectorAll: () => [el],
    } as unknown as Document
    return { el, doc }
  }

  it("a reserva espera além da volta de 200ms antes de limpar a origem", () => {
    vi.useFakeTimers()
    const { el, doc } = regiao()
    abrirRecuo(doc)()
    vi.advanceTimersByTime(250)
    expect(el.style.transformOrigin).toBe("640px 400px")
    vi.advanceTimersByTime(100)
    expect(el.style.transformOrigin).toBe("")
  })

  it("reaberto no meio da volta, a origem fica", () => {
    vi.useFakeTimers()
    const { el, doc } = regiao()
    abrirRecuo(doc)()
    vi.advanceTimersByTime(100)
    const fechar = abrirRecuo(doc)
    vi.advanceTimersByTime(1000)
    expect(el.style.transformOrigin).toBe("640px 400px")
    expect(doc.documentElement.dataset.recuo).toBe("")
    fechar()
    vi.advanceTimersByTime(1000)
    expect(el.style.transformOrigin).toBe("")
  })
})

describe("o CSS do recuo", () => {
  const CSS = semComentarios(lerFonte("src/app/globals.css"), "bloco")
  const bloco = blocoCss(CSS, "@media (width >= 48rem) and (prefers-reduced-motion: no-preference) {")

  it("mora só do `md` para cima e com movimento: no telefone nada fica recuado", () => {
    expect(bloco).toContain(":root[data-recuo]")
    // Nenhuma regra do recuo mora fora do bloco.
    expect(CSS.match(/\[data-recuo\]/g)?.length).toBe(bloco.match(/\[data-recuo\]/g)?.length)
    expect(bloco).toContain("scale(0.985)")
    expect(bloco).toContain("300ms")
    expect(bloco).toContain("200ms")
  })

  it("só a casca do app recua: as regiões leem a marca que ela veste", () => {
    for (const regra of bloco.match(/^\s*[^@\s][^{]*\{/gm) ?? []) expect(regra).toContain("[data-recuo-regiao]")
    expect(lerFonte("src/components/layout/app-sidebar.tsx")).toMatch(/<Sidebar [^>]*data-recuo-regiao=""/)
    expect(lerFonte("src/components/layout/sidebar-app-shell.tsx")).toContain('<SidebarInset data-recuo-regiao="">')
  })

  it("preserva as transições que a barra lateral já declara", () => {
    // O bloco reescreve a lista de `transition-property` das duas regiões; se a
    // `Sidebar` animar outra propriedade, ela tem de entrar aqui também.
    const sidebar = lerFonte("src/components/ui/sidebar.tsx")
    expect(sidebar).toContain("transition-[left,width]")
    expect(sidebar).toContain("transition-[margin]")
    expect(bloco).toContain("transition-property: left, width, transform")
    expect(bloco).toContain("transition-property: margin, transform")
  })
})
