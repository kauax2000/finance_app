import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

import { highlightParts } from "./command"
import { ariaShortcut, matchShortcut } from "@/lib/shortcut"
import { rememberRecent } from "@/hooks/use-command-recents"

/** As versões do `Command`. */

const CODIGO = lerFonte("src/components/ui/command.tsx")

const tecla = (key: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey", boolean>> = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
})

describe("as versões do Command", () => {
  it("o sinal da linha é a seta de ir ou, nas ações de criar, o +", () => {
    expect(CODIGO).toContain('variant === "add" ? PlusIcon : ArrowUpRightIcon')
    expect(lerFonte("src/components/layout/app-command-palette.tsx")).toContain('<CommandItemArrow variant="add" />')
  })

  it("a legenda mede 32, e o topo centraliza a pilha com ela (a placa mais 48)", () => {
    expect(CODIGO).toContain('"inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs whitespace-nowrap')
    expect(CODIGO).toContain("[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(12))]")
  })

  it("o ícone da linha não passa dos 36 da pilha: caixa de 24 de largura e 20 de altura", () => {
    expect(CODIGO).toContain('"flex h-5 w-6 shrink-0 items-center justify-center')
    expect(CODIGO).not.toContain('"flex size-6 shrink-0 items-center justify-center text-muted-foreground')
  })

  it("o destaque acha o trecho sem acento dos dois lados, e não inventa", () => {
    expect(highlightParts("Saúde", "saude")).toEqual([{ text: "Saúde", match: true }])
    expect(highlightParts("Mercado", "erc")).toEqual([
      { text: "M", match: false },
      { text: "erc", match: true },
      { text: "ado", match: false },
    ])
    expect(highlightParts("Educação", "cacao")).toEqual([
      { text: "Edu", match: false },
      { text: "cação", match: true },
    ])
    expect(highlightParts("Lazer", "xyz")).toEqual([{ text: "Lazer", match: false }])
    expect(highlightParts("Lazer", "  ")).toEqual([{ text: "Lazer", match: false }])
  })

  it("o atalho é um só para o SearchInput e o CommandItem", () => {
    expect(matchShortcut("mod+e", tecla("e", { metaKey: true }))).toBe(true)
    expect(matchShortcut("mod+e", tecla("e", { ctrlKey: true }))).toBe(true)
    expect(matchShortcut("mod+e", tecla("e"))).toBe(false)
    // Sem modificadora pedida, nenhuma pode estar descida.
    expect(matchShortcut("/", tecla("/", { metaKey: true }))).toBe(false)
    expect(matchShortcut("alt+n", tecla("n", { altKey: true }))).toBe(true)
    expect(ariaShortcut("mod+k")).toBe("Meta+K Control+K")
    expect(lerFonte("src/components/ui/search-input.tsx")).toContain('from "@/lib/shortcut"')
    expect(lerFonte("src/components/ui/search-input.tsx")).not.toMatch(/function casaAtalho/)
  })

  it("os recentes guardam destinos, sem duplicata, o último primeiro, no teto", () => {
    expect(rememberRecent(["a", "b", "c"], "b", 5)).toEqual(["b", "a", "c"])
    expect(rememberRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"])
  })

  it("a busca no servidor descarta a resposta de uma consulta cancelada", () => {
    const codigo = lerFonte("src/hooks/use-command-search.ts")
    expect(codigo).toContain("controle.abort()")
    expect(codigo.match(/if \(controle\.signal\.aborted\) return/g)?.length).toBe(2)
  })

  it("as sub-páginas: Backspace em dois toques, e o campo esvazia a cada passo", () => {
    expect(CODIGO).toMatch(/e\.key === "Backspace" && !texto[\s\S]*?if \(paginas\.armed\) paginas\.pop\(\)\s*else paginas\.setArmed\(true\)/)
    expect(CODIGO).toMatch(/if \(paginas\) mudarRef\.current\(""\)[\s\S]*?\}, \[profundidade\]\)/)
  })

  it("o atalho da linha só dispara com o foco na própria paleta", () => {
    expect(CODIGO).toContain('const raiz = ref.current?.closest("[cmdk-root]")')
    expect(CODIGO).toContain("raiz.contains(document.activeElement)")
  })

  it("no telefone a lupa vira a barra: camada própria, sem gaveta, com o título ligado", () => {
    expect(CODIGO).not.toMatch(/from "@\/components\/ui\/drawer"/)
    expect(CODIGO).toMatch(/if \(isMobile\) \{[\s\S]*?data-slot="command-search"[\s\S]*?<DialogTitle>\{title\}<\/DialogTitle>/)
    expect(CODIGO).toContain('data-slot="command-search-bar"')
    expect(CODIGO).toContain('data-slot="command-search-cancel"')
    // O × no vidro da pílula, não o "Cancelar" sem fundo (pedido do dono).
    expect(CODIGO).toMatch(/data-slot="command-search-cancel"[\s\S]*?searchFieldSurfaceClassName\.modal[\s\S]*?<XMarkIcon/)
    expect(CODIGO).toContain('aria-label="Fechar busca"')
    expect(CODIGO).not.toMatch(/>\s*Cancelar\s*</)
    expect(CODIGO).toContain("origin?: React.RefObject<HTMLElement | null>")
    // A pílula nasce do retângulo da origem e anda na mola; fecha na SAIDA.
    expect(CODIGO).toMatch(/import \{[^}]*\bMOLA\b[^}]*\bSAIDA\b[^}]*\} from "@\/lib\/spring"|import \{[^}]*\bSAIDA\b[^}]*\bMOLA\b[^}]*\} from "@\/lib\/spring"/)
    expect(CODIGO).toContain("getBoundingClientRect()")
    // O teclado: o foco vai ao campo no próprio commit, sem esperar a mola.
    expect(CODIGO).toMatch(/onOpenAutoFocus=\{[\s\S]*?preventDefault\(\)[\s\S]*?\.focus\(/)
    expect(CODIGO).toMatch(/if \(isMobile\)[\s\S]*?safe-area-inset-top/)
    // A cápsula da lupa se divide em duas bolhas: um progresso só, que abre na
    // MOLA de onde o gesto estiver (0 numa camada nova ou em repouso) e volta
    // na VOLTA_DA_PILULA, escreve cada quadro nos dois vidros.
    expect(CODIGO).toContain("const progresso = React.useRef(0)")
    expect(CODIGO).toContain("const de = pilula.style.clipPath ? progresso.current : 0")
    // A abertura anda na mola própria do gesto (mais lenta que a MOLA, para a
    // pinça caber em quadros), e o relógio só começa quando os quadros voltam:
    // o quadro 0 sai no efeito, e o `animate` espera dois rAF seguidos a ≤ 34ms
    // (até seis), senão a montagem engolia a divisão.
    expect(CODIGO).toMatch(/import \{[^}]*\bSEPARACAO\b[^}]*\} from "@\/lib\/spring"/)
    expect(CODIGO.match(/animate\(de, 1, \{ \.\.\.SEPARACAO, onUpdate: quadro \}\)/g)).toHaveLength(1)
    expect(CODIGO).not.toMatch(/animate\(de, 1, \{ \.\.\.MOLA/)
    const abertura = CODIGO.slice(CODIGO.indexOf("const de = pilula.style.clipPath"))
    expect(abertura.indexOf("quadro(de)")).toBeLessThan(abertura.indexOf("quandoPintar(() => {"))
    expect(abertura.indexOf("quandoPintar(() => {")).toBeLessThan(abertura.indexOf("animate(de, 1,"))
    // A espera mora num lugar só, e vale para abrir e para fechar.
    const espera = CODIGO.slice(CODIGO.indexOf("function quandoPintar("), CODIGO.indexOf("function quandoPintar(") + 600)
    expect(espera).toContain("if (quadros < 2 || (agora - antes > 34 && quadros < 6)) {")
    expect(espera).toContain("return () => cancelAnimationFrame(id)")
    expect(CODIGO.match(/= quandoPintar\(/g)).toHaveLength(2)
    expect(CODIGO).toMatch(/return \(\) => \{\s*ativa = false\s*cancelar\(\)\s*controle\?\.stop\(\)/)
    // A volta também espera a pintura (o teclado descendo para o WebKit), de
    // onde o gesto estava, e a casca segura 400ms para caber.
    expect(CODIGO).toMatch(/const de = progresso\.current\s*quadro\(de\)\s*cancelar = quandoPintar\(\(\) => \{\s*controle = animate\(de, 0, \{ \.\.\.VOLTA_DA_PILULA, onUpdate: quadro \}\)/)
    expect(CODIGO).toContain("const VOLTA_DA_PILULA = { duration: 0.26, ease: [0.2, 0, 0, 1] } as const")
    expect(CODIGO).toContain("data-closed:[animation:presence-hold_calc(var(--duration-slow)+var(--duration-instant))]")
    // O véu do telefone sai sem opacidade (no WebKit o borrão sumia de uma vez
    // com a opacidade animando): o raio e a tinta descem a zero no `veil-out`.
    expect(CODIGO).toContain('overlayClassName("modal"),')
    expect(CODIGO).toContain("data-closed:[animation:veil-out_var(--duration-slow)_var(--ease-out)_var(--duration-instant)_both]!")
    expect(lerFonte("src/app/globals.css")).toMatch(/@keyframes veil-out \{\s*to \{\s*-webkit-backdrop-filter: blur\(0\);\s*backdrop-filter: blur\(0\);\s*background-color: transparent;/)
    // A placa espera o vão: pausada no primeiro quadro, solta quando o vão abre
    // (o relógio do CSS corria durante a montagem), e a limpeza a solta sempre.
    expect(CODIGO).toContain('if (placa) placa.style.animationPlayState = "paused"')
    expect(CODIGO).toContain('if (f.vao > 0 && placa) placa.style.animationPlayState = ""')
    expect(CODIGO).toMatch(/controle\?\.stop\(\)\s*if \(placa\) placa\.style\.animationPlayState = ""/)
    // O foco não rola a pílula: os filhos estão transladados no voo, e o
    // `focus()` rolava o `overflow: hidden` do feixe (o conteúdo ~165pt fora).
    expect(CODIGO).toMatch(/onOpenAutoFocus=\{[\s\S]*?\.focus\(\{ preventScroll: true \}\)/)
    expect(CODIGO).toContain("function rolarAoInicio(pilula: HTMLElement)")
    expect(CODIGO.match(/rolarAoInicio\(pilula\)/g)?.length).toBeGreaterThanOrEqual(2)
    // Só a placa brota com o gesto dos menus e volta com o menu-unmorph; o × é
    // a segunda bolha, desenhada pelo mesmo progresso.
    expect(CODIGO).toContain("data-open:[&_[data-slot=command-dialog-panel]]:[animation:menu-morph_380ms_linear_60ms_backwards]")
    expect(CODIGO).toContain("data-closed:[&_[data-slot=command-dialog-panel]]:[animation:menu-unmorph_210ms_linear_both]")
    expect(CODIGO).not.toContain("command-search-cancel]]:[animation:menu-morph")
    expect(CODIGO).not.toContain(":is([data-slot=command-dialog-panel],[data-slot=command-search-cancel])")
    expect(CODIGO).not.toContain("[&_[data-slot=command-search-cancel]]:origin-center")
    expect(CODIGO).toContain("[&_[data-slot=command-dialog-panel]]:origin-top-right")
    expect(CODIGO).not.toMatch(/function quadroDaPilula|function pilulaEmRepouso/)
    const escritor = CODIGO.slice(CODIGO.indexOf("function desenharBolhas"), CODIGO.indexOf("function bolhasEmRepouso"))
    expect(escritor).toContain("pilula.style.transform = `translateX(${f.dx}px)`")
    expect(escritor).toContain("round ${f.Rh}px ${f.emendaH}px ${f.emendaH}px ${f.Rh}px / ${f.R}px ${f.emenda}px ${f.emenda}px ${f.R}px)`")
    // O recorte só tira pixels: o raio próprio zera só do lado da emenda. Os
    // cantos de fora ficam no R, senão a ponta esquerda saía reta no passe da
    // mola (o recorte passa da caixa e só a caixa pinta).
    expect(escritor).toContain("pilula.style.borderRadius = `${f.R}px 0px 0px ${f.R}px`")
    expect(escritor).toContain("x.style.borderRadius = `0px ${f.R}px ${f.R}px 0px`")
    expect(escritor).not.toContain('borderRadius = "0px"')
    expect(escritor).toContain("x.style.clipPath = `inset(0px round ${f.emenda}px ${f.R}px ${f.R}px ${f.emenda}px)`")
    // O conteúdo da pílula anda com a borda e acende com o progresso: em p 0 nada
    // dele aparece (nem a lupa cinza nem o placeholder na costura).
    // No passe da mola o conteúdo para na borda que pinta (a caixa), e acende
    // por `filter`, que multiplica a opacidade da classe (a lupa `opacity-70`).
    expect(escritor).toContain("filho.style.transform = `translateX(${Math.max(0, f.esquerda)}px)`")
    expect(escritor).toContain("filho.style.filter = `opacity(${f.conteudo})`")
    expect(escritor).not.toContain("filho.style.opacity")
    // O cursor nativo do iOS ignora o `filter` dos filhos: some no voo.
    expect(escritor).toContain('filho.style.caretColor = "transparent"')
    // O feixe acende com o conteúdo, e não sobre a cápsula que encolhe.
    expect(escritor).toContain("pilula.style.setProperty(\"--command-beam-flight\", `${f.conteudo}`)")
    // A silhueta no voo: a tinta sobe nos dois vidros, recortada pelo próprio `clip-path`.
    expect(escritor).toContain("color-mix(in oklab, var(--foreground) ${TINTA_DO_VOO * f.tinta}%, transparent)")
    expect(escritor).toContain("pilula.style.backgroundImage = x.style.backgroundImage = `linear-gradient(${tinta}, ${tinta})`")
    // O fantasma da lupa (só na cápsula) segura o desenho do header até o conteúdo acender.
    expect(escritor).toContain("origemLupa.style.opacity = `${1 - f.conteudo}`")
    expect(escritor).toContain("origemLupa.style.filter = `blur(${6 * f.conteudo}px)`")
    expect(escritor).toContain("origemLupa.style.transform = `translateX(${f.lupaDx}px) scale(${1 - 0.3 * f.conteudo})`")
    // A largura do × vem da costura (que, fundida, cai num pixel do aparelho).
    expect(escritor).toContain("scale(${f.escalaX}, ${1 - f.puxao * ACOPLAMENTO_Y})")
    // O elemento não é animado pelo motion (o valor dele reescrevia o fim), e o
    // repouso tira tudo dos dois vidros, do X e do fantasma.
    expect(CODIGO).not.toMatch(/animate\(pilula, \{ clipPath/)
    const repouso = CODIGO.slice(CODIGO.indexOf("function bolhasEmRepouso"), CODIGO.indexOf("/**\n * A paleta em diálogo"))
    expect(repouso).toContain('pilula.style.borderRadius = x.style.borderRadius = ""')
    expect(repouso).toContain('pilula.style.transform = ""')
    expect(repouso).toContain('pilula.style.clipPath = ""')
    expect(repouso).toContain('filho.style.transform = filho.style.filter = filho.style.caretColor = ""')
    expect(repouso).toContain('pilula.style.removeProperty("--command-beam-flight")')
    expect(repouso).toContain('pilula.style.backgroundImage = x.style.backgroundImage = ""')
    expect(repouso).toContain("rolarAoInicio(pilula)")
    expect(repouso).toContain('if (origemLupa) origemLupa.style.cssText = ""')
    expect(repouso).toContain('x.style.transform = ""')
    expect(repouso).toContain('x.style.clipPath = ""')
    expect(repouso).toContain('for (const el of [iconeX, fantasma]) if (el) el.style.opacity = el.style.filter = el.style.transform = ""')
    expect(CODIGO).toMatch(/abrindo\.then\(\(\) => \{\s*if \(ativa\) bolhasEmRepouso\(/)
    // A viagem zera a opacidade que uma entrada sem origem tenha deixado no
    // meio; sem viagem, as duas bolhas voltam ao repouso antes do esmaecer.
    expect(CODIGO).toMatch(/if \(viaja\) \{\s*pilula\.style\.opacity = x\.style\.opacity = ""/)
    expect(CODIGO).toMatch(/\} else \{\s*bolhasEmRepouso\(pilula, x, iconeX, fantasma, origemLupaEl\)\s*progresso\.current = aberto \? 1 : 0/)
    // O × é medido sem o aperto do toque (o `translate` do AFUNDAR e do
    // `active:translate-y-px`): o lugar de layout dele na camada, e não a caixa
    // pintada. O aperto da pessoa nunca é cancelado.
    expect(CODIGO).toMatch(/const xFinal = \{[\s\S]*?x\.offsetLeft[\s\S]*?x\.offsetTop[\s\S]*?x\.offsetWidth[\s\S]*?x\.offsetHeight/)
    expect(CODIGO).not.toContain("x.getBoundingClientRect()")
    expect(CODIGO).not.toMatch(/getAnimations\(\)[\s\S]{0,80}\.(cancel|finish)\(/)
    // O fantasma da lupa: fora da raiz do cmdk, como o ×, posto no retângulo da
    // lupa uma vez por gesto e preenchido com os filhos dela, com ou sem filtro
    // (sem filtro, é ele que anda com a borda esquerda do campo).
    expect(CODIGO).toContain(
      '<span aria-hidden data-slot="command-search-origin" className="pointer-events-none absolute z-20 grid place-items-center opacity-0 [&_svg]:size-5" />'
    )
    const telefone = CODIGO.slice(CODIGO.indexOf("if (isMobile) {"))
    expect(telefone.indexOf('data-slot="command-search-origin"')).toBeGreaterThan(telefone.indexOf("</Command>"))
    expect(CODIGO).not.toContain("const origemLupa = colado ? origemLupaEl : null")
    expect(CODIGO).toMatch(/origemLupaEl\.replaceChildren\(\.\.\.\[\.\.\.lupaEl\.children\]\.map\(\(n\) => n\.cloneNode\(true\)\)\)/)
    // "Colado" se decide pelas caixas de layout (sem o `transform` em voo da
    // lupa e da gota do header), nunca pelo retângulo pintado; um filtro
    // inerte (a gota voltando à lupa) não conta.
    expect(CODIGO).toContain("function caixaDeLayout(el: HTMLElement): DOMRect")
    expect(CODIGO).toContain("const lupa = lupaEl ? caixaDeLayout(lupaEl) : null")
    expect(CODIGO).toContain('const filtro = filtroEl && !filtroEl.closest("[inert]") ? caixaDeLayout(filtroEl) : null')
    expect(CODIGO).not.toMatch(/(lupaEl|filtroEl)\??\.getBoundingClientRect\(\)/)
    expect(CODIGO).not.toContain("borderTopLeftRadius")
    // Sem filtro, o fantasma do × fica vazio, e o × é a gota que pinga da pílula.
    expect(CODIGO).toContain("fantasma?.replaceChildren()")
    expect(CODIGO).toMatch(/const desenhar = colado && filtro\s*\? \(p: number\) => \{\s*const f = quadroDasBolhas\(/)
    expect(CODIGO).toMatch(/: \(p: number\) => \{\s*const m = \{ lupa, pilula: final, x: xFinal, dpr \}\s*const f = quadroDaGota\(m, p\)/)
    expect(CODIGO).toContain("animate([pilula, x], { opacity: [0, 1] }, SAIDA)")
    expect(CODIGO).toContain("animate([pilula, x], { opacity: 0 }, SAIDA)")
    // O fantasma é o que a origem do × mostrava (o filtro ou a lupa), clonado
    // de novo a cada gesto, e o × tem o fundo até a aresta (sem fio na emenda).
    expect(CODIGO).toContain('data-slot="command-search-cancel-origin"')
    expect(CODIGO).toContain("replaceChildren(")
    expect(CODIGO).toMatch(/data-slot="command-search-cancel"[\s\S]*?className=\{cn\([\s\S]*?origin-right bg-clip-border/)
    expect(CODIGO).toContain('import { ACOPLAMENTO_Y } from "@/lib/liquid-move"')
    // Nada escreve na casca: no ancestral, desligaria o borrão dos vidros.
    expect(CODIGO).not.toMatch(/camada\.style\.(transform|clipPath|opacity|filter)/)
    expect(CODIGO).toContain("closeOrigin?: React.RefObject<HTMLElement | null>")
    expect(lerFonte("src/components/layout/app-command-palette.tsx")).toContain("closeOrigin?: React.RefObject<HTMLElement | null>")
    expect(lerFonte("src/components/layout/app-command-palette.tsx")).toContain("closeOrigin={closeOrigin}")
    const header = lerFonte("src/components/layout/app-header.tsx")
    expect(header).toContain("ref={filtroRef}")
    expect(header).toContain("closeOrigin={filtroRef}")
    // O teclado do iOS só encolhe o viewport visual: a camada e o teto da
    // placa leem a altura dele, publicada numa variável, com 100dvh de reserva.
    expect(CODIGO).toContain("const vv = window.visualViewport")
    expect(CODIGO).toContain('camada.style.setProperty("--command-search-vh", `${vv.height}px`)')
    expect(CODIGO).toContain('vv.addEventListener("resize", medir)')
    expect(CODIGO).toContain('vv.removeEventListener("resize", medir)')
    expect(CODIGO).toContain("h-[var(--command-search-vh,100dvh)]")
    expect(CODIGO).toContain("[--command-list-ceiling:calc(var(--command-search-vh,100dvh)_-_")
    expect(CODIGO).not.toMatch(/if \(isMobile\)[\s\S]*?\bh-dvh\b/)
    // Fechar só mexe no foco que ficou no body ou na camada, e o leva ao
    // diálogo que a paleta abriu, se houver; senão, à lupa.
    expect(CODIGO).toMatch(/onCloseAutoFocus=\{[\s\S]*?const ativo = doc\.activeElement\s*if \(ativo !== doc\.body && !camada\?\.contains\(ativo\)\) return/)
    expect(CODIGO).toMatch(/\[role=dialog\],\[role=alertdialog\][\s\S]*?\.filter\(\(d\) => d !== camada\)[\s\S]*?\(outro \?\? origin\.current\)\.focus\(\)/)
    // Sem gatilho do Radix, fechar devolve o foco à origem, e não ao body.
    expect(CODIGO).toMatch(/onCloseAutoFocus=\{[\s\S]*?origin\?\.current[\s\S]*?preventDefault\(\)[\s\S]*?\.focus\(/)
  })

  it("a origem só vale com caixa: lupa escondida não faz a pílula nascer em 0,0", async () => {
    const { origemValida } = await import("@/components/ui/command")
    expect(origemValida(null)).toBe(false)
    expect(origemValida(undefined)).toBe(false)
    expect(origemValida({ width: 0, height: 44 } as DOMRect)).toBe(false)
    expect(origemValida({ width: 44, height: 44 } as DOMRect)).toBe(true)
  })

  it("o feixe da pílula tem um multiplicador do voo nos dois pseudo-elementos, 1 por padrão", () => {
    const feixe = lerFonte("src/app/globals.css").split("@utility command-beam {")[1].split("@utility ")[0]
    expect(feixe.match(/var\(--command-beam-flight, 1\)/g)).toHaveLength(2)
  })

  describe("as duas bolhas: um quadro puro do gesto, a 375px", () => {
    const caixa = (left: number, right: number) => ({ left, right, top: 6, bottom: 50, width: right - left, height: 44 })
    const pilula = caixa(16, 307)
    const x = caixa(315, 359)
    const capsula = { lupa: caixa(271, 315), deX: caixa(315, 359), pilula, x, dpr: 3 }
    type Quadro = { dx: number; esquerda: number }
    const esquerdaVisivel = (f: Quadro) => pilula.left + f.dx + f.esquerda
    const direitaDaPilula = (f: Quadro) => pilula.right + f.dx
    /** A borda esquerda do ×: a origem é a direita (`origin-right`), e só a largura escala. */
    const esquerdaDoX = (f: { xdx: number; escalaX: number }) => x.right + f.xdx - x.width * f.escalaX

    it("na cápsula, sai da lupa colada ao filtro, pinça antes de partir e pousa com o vão de 8", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      const f0 = quadroDasBolhas(capsula, 0)
      expect(esquerdaVisivel(f0)).toBeCloseTo(271, 6)
      expect(direitaDaPilula(f0)).toBeCloseTo(315, 6)
      expect(f0.emenda).toBe(0)
      expect(f0.xdx).toBe(0)
      expect(f0.icone).toBe(0)
      // O esticão fundido: a emenda ainda é reta.
      expect(quadroDasBolhas(capsula, 0.08).emenda).toBe(0)
      // A pinça quase fecha antes de o vão abrir: no último quadro fundido a
      // cintura tem poucos pixels (44 − 2 × emenda).
      const rasgo = quadroDasBolhas(capsula, 0.6)
      expect(rasgo.vao).toBe(0)
      expect(rasgo.emenda).toBeGreaterThan(20)
      expect(quadroDasBolhas(capsula, 0.7).emenda).toBe(22)
      const f1 = quadroDasBolhas(capsula, 1)
      expect(f1.dx).toBeCloseTo(0, 6)
      expect(f1.esquerda).toBeCloseTo(0, 6)
      expect(f1.emenda).toBe(22)
      expect(f1.puxao).toBe(0)
      expect(f1.escalaX).toBeCloseTo(1, 9)
      expect(f1.vao).toBe(8)
      expect(f1.icone).toBe(1)
    })

    it("em todo quadro (até o passe da mola), a pílula não invade o ×, a emenda cabe no raio e a borda só anda para a esquerda", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      for (const m of [capsula]) {
        let antes = Infinity
        for (let i = 0; i <= 105; i++) {
          const f = quadroDasBolhas(m, i / 100)
          expect(direitaDaPilula(f)).toBeLessThanOrEqual(esquerdaDoX(f) - f.vao + 1e-6)
          expect(f.emenda).toBeGreaterThanOrEqual(0)
          expect(f.emenda).toBeLessThanOrEqual(f.R)
          // O raio horizontal cabe na largura visível: o CSS não encolhe os quatro.
          expect(f.Rh + f.emendaH).toBeLessThanOrEqual(pilula.width - f.esquerda + 1e-6)
          expect(esquerdaVisivel(f)).toBeLessThanOrEqual(antes + 1e-9)
          antes = esquerdaVisivel(f)
        }
      }
    })

    it("fundidas, a costura cai num pixel do aparelho, a mesma nos dois vidros (sem o fio de duas bordas meio cobertas)", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      for (const dpr of [2, 3]) {
        // O puxão do × deixa a costura fracionária no meio da pinça.
        let fracionarias = 0
        for (const m of [capsula]) {
          for (let i = 0; i <= 105; i++) {
            const f = quadroDasBolhas({ ...m, dpr }, i / 100)
            if (f.vao !== 0) continue
            const costura = direitaDaPilula(f) * dpr
            expect(Math.abs(costura - Math.round(costura))).toBeLessThan(1e-6)
            expect(esquerdaDoX(f) * dpr).toBeCloseTo(costura, 6)
            const livre = (x.left + f.xdx - x.width * f.puxao) * dpr
            if (Math.abs(livre - Math.round(livre)) > 1e-3) fracionarias++
          }
        }
        expect(fracionarias).toBeGreaterThan(0)
      }
    })

    it("o conteúdo só acende depois que o vão abre, e não volta (fundido, a costura cortava o texto)", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      for (const m of [capsula]) {
        expect(quadroDasBolhas(m, 0).conteudo).toBe(0)
        expect(quadroDasBolhas(m, 0.85).conteudo).toBe(1)
        expect(quadroDasBolhas(m, 1.05).conteudo).toBe(1)
        let antes = -Infinity
        for (let i = 0; i <= 105; i++) {
          const f = quadroDasBolhas(m, i / 100)
          if (f.vao === 0) expect(f.conteudo).toBe(0)
          expect(f.conteudo).toBeGreaterThanOrEqual(antes)
          antes = f.conteudo
        }
      }
    })

    it("a tinta do voo é cheia na cápsula e some antes do repouso, sem voltar", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      expect(quadroDasBolhas(capsula, 0).tinta).toBe(1)
      expect(quadroDasBolhas(capsula, 0.85).tinta).toBe(1)
      expect(quadroDasBolhas(capsula, 1).tinta).toBe(0)
      expect(quadroDasBolhas(capsula, 1.05).tinta).toBe(0)
      let antes = Infinity
      for (let i = 0; i <= 105; i++) {
        const { tinta } = quadroDasBolhas(capsula, i / 100)
        expect(tinta).toBeLessThanOrEqual(antes)
        antes = tinta
      }
    })

    it("na SEPARACAO a divisão se lê: cintura ≥ 90ms, pinça ≥ 6 quadros, repouso ≤ 700ms", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      const { SEPARACAO } = await import("@/lib/spring")
      const { spring } = await import("motion")
      // O gerador do próprio motion, em passos de 1ms (o mesmo que o `animate` amostra).
      const mola = spring({ keyframes: [0, 1], ...SEPARACAO })
      let cintura = 0
      let pinca = 0
      let repouso = Infinity
      for (let t = 0; t <= 2000; t++) {
        const { value, done } = mola.next(t)
        const f = quadroDasBolhas(capsula, value)
        const arredondando = f.emenda > 0 && f.emenda < f.R
        if (arredondando) pinca++
        if (arredondando && f.vao === 0) cintura++
        if (done) {
          repouso = t
          break
        }
      }
      expect(cintura).toBeGreaterThanOrEqual(90)
      expect(pinca).toBeGreaterThanOrEqual(100)
      expect(repouso).toBeLessThanOrEqual(700)
    })

    it("o fantasma da lupa anda com a borda do conteúdo, e no passe da mola o conteúdo para na calha", async () => {
      const { quadroDasBolhas } = await import("@/components/ui/command")
      expect(quadroDasBolhas(capsula, 0).lupaDx).toBeCloseTo(0, 6)
      expect(quadroDasBolhas(capsula, 1).lupaDx).toBeCloseTo(pilula.left - capsula.lupa.left, 6)
      // As duas lupas na mesma borda (e, com o recuo de 14 + 8 = 44/2, no mesmo centro).
      const bordaDoConteudo = (f: Quadro) => pilula.left + f.dx + Math.max(0, f.esquerda)
      for (let i = 0; i <= 100; i++) {
        const f = quadroDasBolhas(capsula, i / 100)
        expect(capsula.lupa.left + f.lupaDx).toBeCloseTo(bordaDoConteudo(f), 6)
      }
      // Passe da mola: o recorte sai da caixa (esquerda < 0), e o conteúdo fica na calha.
      for (const m of [capsula]) {
        for (let i = 101; i <= 105; i++) {
          const f = quadroDasBolhas(m, i / 100)
          expect(f.esquerda).toBeLessThan(0)
          expect(bordaDoConteudo(f)).toBeCloseTo(pilula.left, 6)
        }
      }
    })
  })

  describe("sem filtro: a lupa vira o campo e o × pinga dela", () => {
    const caixa = (left: number, right: number) => ({ left, right, top: 6, bottom: 50, width: right - left, height: 44 })
    const pilula = caixa(16, 307)
    const x = caixa(315, 359)
    const m = { lupa: caixa(315, 359), pilula, x, dpr: 3 }

    it("parte do círculo da lupa com a gota escondida na ponta, e pousa na barra com o × e o vão de 8", async () => {
      const { quadroDaGota } = await import("@/components/ui/command")
      const f0 = quadroDaGota(m, 0)
      expect(f0.esquerda).toBe(315)
      expect(f0.direita).toBe(359)
      expect(f0.gota.r).toBeCloseTo(7.7, 6)
      expect(f0.gota.cx).toBe(337)
      expect(f0.vao).toBe(0)
      expect(f0.icone).toBe(0)
      expect(f0.conteudo).toBe(0)
      expect(f0.lupaX).toBe(337)
      expect(f0.lupaTroca).toBe(0)
      const f1 = quadroDaGota(m, 1)
      expect(f1.esquerda).toBe(16)
      expect(f1.direita).toBe(307)
      expect(f1.gota).toEqual({ cx: 337, r: 22 })
      expect(f1.vao).toBe(8)
      expect(f1.icone).toBe(1)
      expect(f1.conteudo).toBe(1)
      expect(f1.lupaX).toBe(38)
      expect(f1.lupaTroca).toBe(1)
      // A borda esquerda repousa na calha aos 0,7; o passe vem só da mola.
      expect(quadroDaGota(m, 0.7).esquerda).toBe(16)
      expect(quadroDaGota(m, 1.02).esquerda).toBeLessThan(16)
    })

    it("a gota nunca passa do lugar do ×, o vão só abre e a borda esquerda só anda para a calha", async () => {
      const { quadroDaGota } = await import("@/components/ui/command")
      let vao = -Infinity
      let esquerda = Infinity
      for (let i = 0; i <= 105; i++) {
        const f = quadroDaGota(m, i / 100)
        expect(f.gota.cx + f.gota.r).toBeLessThanOrEqual(x.right + 0.5)
        expect(f.vao).toBeGreaterThanOrEqual(vao)
        expect(f.esquerda).toBeLessThanOrEqual(esquerda + 1e-9)
        // A gota presa à ponta cai num pixel do aparelho (sem o fio de duas bordas meio cobertas).
        if (f.vao === 0) expect(Math.abs(f.direita * m.dpr - Math.round(f.direita * m.dpr))).toBeLessThan(1e-6)
        vao = f.vao
        esquerda = f.esquerda
      }
    })

    it("na SEPARACAO repousa em até 700ms", async () => {
      const { quadroDaGota } = await import("@/components/ui/command")
      const { SEPARACAO } = await import("@/lib/spring")
      const { spring } = await import("motion")
      const mola = spring({ keyframes: [0, 1], ...SEPARACAO })
      let repouso = Infinity
      for (let t = 0; t <= 2000; t++) {
        const { value, done } = mola.next(t)
        quadroDaGota(m, value)
        if (done) {
          repouso = t
          break
        }
      }
      expect(repouso).toBeLessThanOrEqual(700)
    })

    it("o escritor da gota mexe só nos dois vidros e nos filhos deles, e o repouso é o das bolhas", () => {
      const escritor = CODIGO.slice(CODIGO.indexOf("function desenharGota("), CODIGO.indexOf("function bolhasEmRepouso"))
      expect(escritor).toContain("pilula.style.transform = `translateX(${dx}px)`")
      expect(escritor).toContain("x.style.borderRadius = `0px ${R}px ${R}px 0px`")
      expect(escritor).toMatch(/x\.style\.transform = `translateX\(\$\{[^}]+\}px\) scale\(\$\{s\}\)`/)
      expect(escritor).toContain("filho.style.filter = `opacity(${filho === lupaDaPilula ? f.lupaTroca : f.conteudo})`")
      expect(escritor).toContain("origemLupa.style.opacity = `${1 - f.lupaTroca}`")
      expect(escritor).toContain("iconeX.style.opacity = `${f.icone}`")
      expect(escritor).not.toMatch(/camada|parentElement/)
      expect(CODIGO).toMatch(/if \(ativa\) bolhasEmRepouso\(pilula, x, iconeX, fantasma, origemLupaEl\)/)
    })
  })

  it("o CommandInput repassa o cursor desenhado ao SearchInput, desligado por padrão", () => {
    expect(CODIGO).toContain("caret = false,")
    expect(CODIGO).toMatch(/<SearchInput[^]*?caret=\{caret\}[^]*?<CommandPrimitive\.Input/)
  })

  it("a página não diz mais que o Combobox monta a pilha, nem que a pílula brota do flanco da lupa", () => {
    expect(lerFonte("src/app/designsystem/docs/command.tsx")).not.toMatch(/o CommandDialog e o Combobox a montam/)
    expect(lerFonte("src/app/designsystem/docs/command.tsx")).not.toMatch(/brota do flanco/)
    expect(lerFonte("src/app/designsystem/docs/command.tsx")).toMatch(/pinga/)
  })
})
