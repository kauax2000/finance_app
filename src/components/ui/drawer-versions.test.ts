import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/** As versões do `Drawer`. */

const CODIGO = lerFonte("src/components/ui/drawer.tsx")

describe("as versões do Drawer", () => {
  it("dentro de outra gaveta, a raiz vira aninhada sozinha — e dentro de um painel, não", () => {
    // O aninhamento é um só: o painel do `Sheet` também o publica, e uma gaveta dentro dele é
    // raiz.
    expect(CODIGO).toMatch(
      /const Raiz =\s*pai\?\.superficie === "gaveta" \? DrawerPrimitive\.NestedRoot : DrawerPrimitive\.Root/
    )
  })

  it("salvando: dismissible desliga E o pedido de fechar é barrado — a alça fecha quando dismissible é falso", () => {
    expect(CODIGO).toContain("dismissible={pending ? false : dismissible}")
    expect(CODIGO).toMatch(/const pedir = \(proximo: boolean\) => \{\s*if \(!proximo && pending\) return/)
    // `pedir` vence o `onOpenChange` de quem chama: vem depois do espalhamento.
    expect(CODIGO).toMatch(/\{\.\.\.props\}\s*dismissible=\{pending \? false : dismissible\}\s*open=\{open\}\s*onOpenChange=\{pedir\}/)
  })

  it("o fundo que encolhe tem o invólucro na raiz do app", () => {
    expect(CODIGO).toContain("shouldScaleBackground={scaleBackground}")
    expect(lerFonte("src/app/layout.tsx")).toContain('data-vaul-drawer-wrapper=""')
  })

  it("a altura acompanha com um observador só: o elemento mora em estado, não numa ref de função", () => {
    expect(CODIGO).toContain("const [el, setEl] = React.useState<HTMLDivElement | null>(null)")
    expect(CODIGO).toContain("useAlturaQueAcompanha(el, !alta)")
    expect(CODIGO).toMatch(/return \(\) => \{\s*ro\.disconnect\(\)\s*animando\?\.cancel\(\)\s*\}\s*\}, \[el, ativo\]\)/)
  })

  it("só a gaveta com passos anda na viagem longa do desktop; as outras ficam na curta", () => {
    // O `Element.animate` não lê `var()`: os tokens são lidos computados no elemento.
    // A curta é a do editor de filtro, afinada à parte: a longa não pode vazar para ela.
    const fonte = semComentarios(CODIGO)
    const viagem = fonte.slice(fonte.indexOf("function viagemDa"), fonte.indexOf("function useAlturaQueAcompanha"))
    expect(viagem).toMatch(/if \(!el\.querySelector\('\[data-slot="dialog-steps"\]'\)\) return VIAGEM_CURTA/)
    expect(viagem).toContain('"--duration-gentle"')
    expect(viagem).toContain('"--ease-emphasized"')
    expect(fonte).toContain('const VIAGEM_CURTA = { duration: 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }')
    const gancho = fonte.slice(fonte.indexOf("function useAlturaQueAcompanha"), fonte.indexOf("ro.observe(el)"))
    expect(gancho).toContain("a = el.animate(quadros, viagemDa(el))")
    expect(gancho).not.toContain("duration: 300")
    expect(gancho).not.toContain("cubic-bezier(")
  })

  it("conteúdo que muda no meio da viagem vira uma viagem só, depois do fim, sem mexer no tamanho dentro do observador", () => {
    // Cancelar e medir a cada quadro custava layout forçado e dava o aviso de
    // laço do ResizeObserver; uma segunda viagem só sai se o conteúdo mudou.
    const fonte = semComentarios(CODIGO)
    const gancho = fonte.slice(fonte.indexOf("function useAlturaQueAcompanha"), fonte.indexOf("ro.observe(el)"))
    const observador = gancho.slice(gancho.indexOf("new ResizeObserver"))
    expect(observador).toMatch(/if \(animando\) \{\s*pendente = true\s*return\s*\}/)
    expect(observador).not.toContain(".cancel()")
    expect(gancho).not.toContain("currentTime")
    // No fim: mede a natural uma vez e segue do destino até ela.
    expect(gancho).toMatch(/if \(!pendente\) return\s*pendente = false\s*const natural = el\.getBoundingClientRect\(\)\.height/)
    expect(gancho).toContain("if (Math.abs(natural - para) >= 1 && !parado()) viajar(para, natural)")
    // Uma curva inválida cai na curta, sem derrubar o observador.
    expect(gancho).toMatch(/try \{\s*a = el\.animate\(quadros, viagemDa\(el\)\)\s*\} catch \{\s*a = el\.animate\(quadros, VIAGEM_CURTA\)/)
  })

  it("o meio que rola está escrito por extenso — classe montada não existe no CSS", () => {
    expect(CODIGO).not.toMatch(/\$\{MEIO\}/)
    for (const classe of ["min-h-0", "overflow-y-auto", "overscroll-contain", "scroll-fade-y", "[--scroll-fade-floor:0]"]) {
      expect(CODIGO).toContain(`"[&>[data-drawer-meio]]:${classe}"`)
    }
  })

  it("o meio é achado pela marca, e a cadeia de :not() não se repete", () => {
    const fonte = semComentarios(lerFonte("src/components/ui/drawer.tsx"), "tudo")
    expect(fonte).toContain("data-drawer-meio")
    expect(fonte.match(/:not\(\[data-slot=/g)?.length ?? 0).toBeLessThanOrEqual(6)
  })

  it("a marca acompanha os filhos: um observador de childList repete a busca", () => {
    expect(CODIGO).toMatch(/new MutationObserver\(marcar\)/)
    expect(CODIGO).toMatch(/observe\(el, \{ childList: true \}\)/)
  })

  it("a folha de ações: 52px, ícone de 20, e cada ação fecha", () => {
    // A classe da linha mora em `drawerActionClassName` (o `DropdownMenu` no telefone a
    // reaproveita); a `DrawerAction` a veste.
    expect(CODIGO).toMatch(/const drawerActionClassName = cn\(\s*"flex min-h-13/)
    expect(CODIGO).toMatch(/function DrawerAction\([\s\S]*?<DrawerPrimitive\.Close asChild>[\s\S]*?drawerActionClassName/)
    expect(CODIGO).toContain("[&_svg]:size-5")
  })

  it("o + abre o formulário, o menu da conta saiu, e o vidro escrito à mão também", () => {
    // O "+" abre direto o formulário de lançamento (a gaveta dele, no
    // telefone); a folha de ações antes dele saiu.
    const fab = lerFonte("src/components/layout/quick-actions.tsx")
    expect(fab).toMatch(/<BottomBarAction label="Adicionar" onClick=\{abrir\}>/)
    expect(fab).not.toMatch(/<DrawerActions>|<DropdownMenuContent/)
    expect(fab).not.toContain("MOBILE_GLASS")
    // Rodada 346: o menu da conta do telefone saiu; a aba Você leva à página /me.
    expect(existsSync(join(process.cwd(), "src/components/layout/mobile-account-menu.tsx"))).toBe(false)
    expect(lerFonte("src/components/ui/bottom-bar.tsx")).not.toContain("MOBILE_GLASS_MENU")
  })
})

describe("a alça da gaveta com ✕", () => {
  it("com ✕ e sem degraus a alça some, guardando o lugar", () => {
    const codigo = semComentarios(CODIGO)
    expect(codigo).toContain("group-has-[[data-slot=dialog-close-button]]/dialog-content:invisible")
    expect(codigo).not.toContain("handleOnly")
    expect(codigo).toMatch(
      /<DragHandle className=\{degraus \? undefined : "group-has-\[\[data-slot=dialog-close-button\]\]\/dialog-content:invisible"\} \/>/
    )
  })
})

describe("toda gaveta do telefone é a flush", () => {
  it("nenhum consumidor pede inset — só a página do catálogo o demonstra", () => {
    const consumidores = [
      "src/components/ui/popover.tsx",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/menubar.tsx",
      "src/components/ui/navigation-menu.tsx",
      "src/components/layout/quick-actions.tsx",
    ]
    for (const caminho of consumidores) {
      expect(lerFonte(caminho), caminho).not.toMatch(/<DrawerContent[^>]*variant="inset"/)
    }
    // E o padrão continua sendo a flush.
    expect(CODIGO).toMatch(/defaultVariants: \{\s*fill: false,\s*variant: "flush"/)
  })

  it("o meio nunca é um título ou descrição sr-only", () => {
    expect(CODIGO).toMatch(/"dialog-title",\s*"dialog-description"/)
  })

  it("sem `fill`, a gaveta cresce até a altura alta antes de o meio rolar (nada de 85%)", () => {
    expect(CODIGO).toContain('"[--drawer-max-h:var(--drawer-h)]"')
    expect(CODIGO).not.toContain("85dvh")
  })

  it("os passo a passo da conta têm a altura do maior passo, sem preencher a tela nem mudar de tamanho", () => {
    const caixa = semComentarios(lerFonte("src/components/account/passo-a-passo.tsx"))
    // Os fantasmas dividem a célula da grade com o passo atual, invisíveis e inertes.
    expect(caixa).toMatch(/aria-hidden inert className="invisible [^"]*\[grid-area:1\/1\]"/)
    expect(caixa).toContain('className="flex flex-col gap-4 [grid-area:1/1]"')
    expect(caixa).not.toContain("useAlturaAnimada")
    for (const f of ["guia-do-atalho", "guia-do-apple-pay", "conectar-ia-dialog"]) {
      const fonte = semComentarios(lerFonte(`src/components/account/${f}.tsx`))
      expect(fonte, f).not.toContain('layout="fixed"')
      expect(fonte, f).toMatch(/<CaixaDoPasso[^>]*fantasmas=/)
    }
  })

  it("o rodapé fica no pé da gaveta, também com o formulário embrulhando corpo e rodapé", () => {
    expect(CODIGO).toContain('"[&>[data-drawer-meio]]:flex-1"')
    for (const c of ["flex", "min-h-0", "flex-1", "flex-col"]) {
      expect(CODIGO).toContain(`"[&>*:has(>[data-slot=dialog-body])]:${c}"`)
    }
  })

  it("o invólucro com DialogBody, formulário ou não, não é o meio: quem rola é o corpo", () => {
    const fonte = semComentarios(CODIGO)
    expect(fonte).toContain(`if (filho.querySelector(':scope > [data-slot="dialog-body"]')) continue`)
    expect(fonte).not.toContain('filho.tagName === "FORM"')
  })

  it("com o teclado, a gaveta fica parada e só o meio rola por trás do cabeçalho", () => {
    const fonte = semComentarios(CODIGO)
    expect(fonte).toContain("repositionInputs = false")
    expect(fonte).toMatch(/const vv = janela\?\.visualViewport/)
    expect(fonte).toContain('vv.addEventListener("resize", assentar)')
    expect(fonte).toContain('vv.removeEventListener("resize", assentar)')
    expect(fonte).toContain('vv.addEventListener("scroll", medir)')
    expect(fonte).toContain('vv.removeEventListener("scroll", medir)')
    // A gaveta não encolhe até o teclado nem sobe: altura presa, e a rolagem do iOS desfeita.
    expect(fonte).not.toMatch(/setProperty\("--drawer-h"/)
    expect(fonte).not.toContain('setProperty("margin-bottom"')
    expect(fonte).toContain("if (janela.scrollY !== rolagem) janela.scrollTo(0, rolagem)")
    // A curta cresce até o conteúdo ficar acima do teclado; a alta fica presa (o teto).
    expect(fonte).toContain("Math.max(altura, Math.min(altura - recuo + coberto, teto))")
    // Só a curta cresce: a alta, que ainda mostra um campo acima do teclado, fica parada.
    expect(fonte).toContain("const curta = altura - recuo - coberto < VISIVEL_MIN")
    // A gaveta guarda o lugar do teclado embaixo: o rodapé assenta logo acima dele.
    expect(fonte).toContain('el.style.setProperty("padding-bottom", `${coberto}px`)')
    // O teclado conta a barra de setas e ✓: mede contra a janela de antes dele.
    expect(fonte).toContain("const medido = Math.max(janelaInteira, janela.innerHeight) - vv.height")
    // O iOS volta a medir como se a barra tivesse sumido: com o teclado aberto, a área coberta só cresce.
    expect(fonte).toContain("cobertoMax = Math.max(cobertoMax, medido)")
    // O foco não deixa o iOS rolar a página: o campo some 2000px por um quadro.
    expect(fonte).toContain('alvo.style.transform = "translateY(-2000px)"')
    expect(fonte).toContain('el.addEventListener("touchend", aoSoltarDedo, { passive: false, capture: true })')
    expect(fonte).toMatch(/if \(el && !degraus\) return rolarSobOTeclado\(el\)/)
    // A caixa nunca rola (só o meio): a rolagem que o foco faz nela volta a zero.
    expect(fonte).toContain("if (el.scrollTop !== 0) el.scrollTop = 0")
    expect(fonte).toContain('el.style.getPropertyValue("--drawer-teclado")')
    // O campo focado não assenta atrás do cabeçalho translúcido e do puxador: o topo lê o `scroll-padding`.
    expect(fonte).toContain("parseFloat(estilo.scrollPaddingTop)")
    // E não atrás do rodapé translúcido: o fim lê o `scroll-padding` de baixo.
    expect(fonte).toContain("parseFloat(estilo.scrollPaddingBottom)")
    expect(fonte).toContain("if (campo.bottom > caixa.bottom - baixo)")
    expect(fonte).toContain("else if (campo.top < caixa.top + topo)")
  })

})
