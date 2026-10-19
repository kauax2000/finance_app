import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  FilterBar,
  FilterBarSkeleton,
  filterPeriodRange,
  parseFilters,
  serializeFilters,
  type FilterField,
  type FilterValue,
} from "./filter-bar"

/** O FilterBar: o token partido, o editor, a URL e o teclado. */

const FONTE = lerFonte("src/components/ui/filter-bar.tsx")
const CODIGO = semComentarios(FONTE, "linha-inteira")

const CAMPOS: FilterField[] = [
  {
    id: "categoria",
    label: "Categoria",
    type: "enum",
    options: [
      { value: "mercado", label: "Mercado" },
      { value: "transporte", label: "Transporte" },
    ],
  },
  { id: "tipo", label: "Tipo", type: "enum", multiple: false, options: [{ value: "despesa", label: "Despesas" }, { value: "receita", label: "Receitas" }] },
  { id: "loja", label: "Loja", type: "enum", loadOptions: async () => [] },
  { id: "periodo", label: "Período", type: "period" },
  { id: "valor", label: "Valor", type: "money" },
  { id: "descricao", label: "Descrição", type: "text" },
  { id: "parcelado", label: "Compras parceladas", type: "boolean" },
]

const barra = (props: Partial<React.ComponentProps<typeof FilterBar>> = {}) =>
  renderToStaticMarkup(h(FilterBar, { fields: CAMPOS, ...props }))

describe("a escada e as superfícies", () => {
  it("sm 28 · md 32 · lg 36, e o piso de 40 no dedo vem da régua de campo", () => {
    expect(CODIGO).toContain("fieldControlHeightClassName[size]")
    expect(barra({ defaultValue: [{ field: "parcelado", operator: "is", values: [] }] })).toContain(
      "pointer-coarse:h-11"
    )
  })

  it("no dedo, todo ponto de toque segue a régua — e só no dedo", () => {
    // Segmento: 40 × 40, a régua do controle em linha; o alvo atravessa a borda da cápsula.
    expect(CODIGO).toContain("pointer-coarse:min-w-10 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-px")
    // A busca dos editores liga o piso de toque do CommandInput (40, e a faixa junto).
    expect(CODIGO.match(/<CommandInput\s+surface="plate"\s+touchFloor/g)).toHaveLength(2)
    // O E/OU também.
    expect(CODIGO).toContain("pointer-coarse:h-11 pointer-coarse:min-w-10")
    // "Remover" cresce à vista no dedo, a 40 — e não por um alvo invisível.
    expect(CODIGO).toContain("pointer-coarse:h-11 pointer-coarse:px-3 pointer-coarse:text-sm")
    expect(CODIGO).not.toContain("pointer-coarse:after:-inset-2.5")
    // O calendário na gaveta é o do DatePicker: células lg, esticadas.
    expect(CODIGO).toContain('size={naGaveta ? "lg" : "md"}')
    // Os atalhos de período sobem a 40 no Calendar.
    const calendario = lerFonte("src/components/ui/calendar.tsx")
    expect(calendario).toContain("w-full justify-center font-normal pointer-coarse:h-11")
    // No telefone os atalhos são 2 × 2, e na gaveta o calendário não pinta fundo.
    expect(calendario).toContain('className="grid grid-cols-2 gap-1 md:flex')
    // A coluna do desktop tem o desenho da grade do telefone; o corte é md, o da gaveta.
    expect(calendario).not.toMatch(/sm:flex-row|sm:w-36|ATALHO_FAIXA/)
    expect(calendario).toContain("in-data-[surface=drawer]:bg-transparent")
    // Contornados, e o escolhido é a tecla preenchida — no telefone e no desktop.
    expect(calendario).toContain('const atalhoSolto = "outline"')
    expect(calendario).toContain('const atalhoEscolhido = "primary"')
    expect(calendario.match(/variant=\{ativo \? atalhoEscolhido : atalhoSolto\}/g)).toHaveLength(2)
    // Na gaveta as faixas do editor recuam 8, a borda da busca e da grade.
    expect(CODIGO).toContain('const recuo = naGaveta ? "px-2" : "px-3"')
    // Nenhuma régua de toque pergunta à largura.
    expect(CODIGO).not.toMatch(/\bmd:min-w|max-md:min-w|max-md:h-1/)
  })

  it("o iPhone do catálogo é dedo: a variante vale sob [data-pointer=coarse], e a moldura marca o documento", () => {
    const css = lerFonte("src/app/globals.css")
    expect(css).toMatch(/@custom-variant pointer-coarse \{\s*@media \(pointer: coarse\) \{\s*@slot;\s*\}\s*@media \(width < 48rem\) \{\s*@slot;\s*\}\s*&:where\(\[data-pointer="coarse"\] \*\) \{\s*@slot;/)
    const moldura = lerFonte("src/app/designsystem/ds-frame.tsx")
    expect(moldura).toContain('raiz.dataset.pointer = "coarse"')
    expect(moldura).toContain("<ToqueEmulado />")
  })

  it("na moldura do iPhone a gaveta não é modal, mas tem véu e fecha no toque fora", () => {
    const gaveta = lerFonte("src/components/ui/drawer.tsx")
    // Só quando a falta de modal é da moldura — `modal={false}` de quem chama continua sem véu.
    expect(gaveta).toContain("const veuEmulado = modalDaMoldura === false && modalProp === undefined")
    expect(gaveta).toContain("onPointerDown={() => raiz.fechar()}")
    expect(gaveta).toContain("pointer-events-auto")
  })

  it("na gaveta a lista é mais alta que o teto de 288 do popover", () => {
    expect(CODIGO).toContain('const LISTA_NA_GAVETA = "[--command-list-max-h:min(55dvh,--spacing(120))]"')
    expect(CODIGO.match(/naGaveta && LISTA_NA_GAVETA/g)).toHaveLength(2)
  })

  it("sem size, fala o degrau de quem está em volta — a Toolbar", () => {
    expect(CODIGO).toContain("React.useContext(ButtonSizeContext)")
    expect(CODIGO).toContain("<ButtonSizeContext.Provider value={size}>")
  })

  it("a cápsula é a superfície de campo; o verde é o das fichas", () => {
    expect(CODIGO).toContain("cn(fieldSurfaceClassName, \"divide-x divide-foreground/14\")")
    expect(CODIGO).toContain("tagChipSuccess")
    const verde = barra({ tone: "success", defaultValue: [{ field: "parcelado", operator: "is", values: [] }] })
    expect(verde).toContain("bg-success-muted")
  })

  it("o telefone é container query da própria barra, nunca a janela", () => {
    expect(CODIGO).toContain("@container/filter-bar")
    expect(CODIGO).toContain("@max-md/filter-bar:flex-nowrap")
    expect(CODIGO).toContain("@max-md/filter-bar:flex-col")
    expect(CODIGO).toContain("scrollFadeViewportXClassName")
    expect(CODIGO).toContain('useScrollFade({ axis: "x" })')
    expect(CODIGO).not.toMatch(/["\s]max-md:/)
  })

  it("o stack é uma grade de colunas alinhadas, e cada token herda as colunas", () => {
    expect(CODIGO).toContain("@max-md/filter-bar:grid-cols-[auto_auto_minmax(0,1fr)_auto]")
    // A subgrid herda o vão da grade: entre colunas ele tem de ser zero.
    expect(CODIGO).toContain("@max-md/filter-bar:gap-x-0")
    expect(CODIGO).toContain("@max-md/filter-bar:grid-cols-subgrid")
    expect(CODIGO).toContain("booleano && CAMPO_SOZINHO_TELEFONE[mobile]")
    expect(CODIGO).toContain('stack: "@max-md/filter-bar:col-span-3"')
    expect(CODIGO).toContain("@max-md/filter-bar:[&>svg]:hidden")
    const html = barra({ mobile: "stack", defaultValue: [{ field: "parcelado", operator: "is", values: [] }] })
    expect(html).toContain("@max-md/filter-bar:col-span-3")
  })
})

describe("o token e os nomes", () => {
  const filtros: FilterValue[] = [
    { field: "categoria", operator: "is", values: ["mercado", "transporte"] },
    { field: "valor", operator: "between", values: ["50", "200"] },
    { field: "parcelado", operator: "is", values: [] },
  ]

  it("cada token é um grupo com campo, operador, valor e ×", () => {
    const html = barra({ defaultValue: filtros })
    for (const slot of ["filter-bar", "filter-bar-row", "filter-bar-token", "filter-bar-field", "filter-bar-operator", "filter-bar-value", "filter-bar-remove", "filter-bar-add", "filter-bar-clear"]) {
      expect(html).toContain(`data-slot="${slot}"`)
    }
    expect(html).toContain('role="toolbar"')
    expect(html).toContain('aria-label="Filtros"')
    expect(html).toContain('aria-label="Filtro Categoria"')
  })

  it("o operador segue a contagem, e o nome do valor diz todos", () => {
    const html = barra({ defaultValue: filtros })
    expect(html).toContain('aria-label="Categoria: é um de Mercado, Transporte. Editar valor."')
    expect(html).toContain('aria-label="Categoria: é um de. Trocar operador."')
    expect(html).toContain("+1")
    const um = barra({ defaultValue: [{ field: "categoria", operator: "is-not", values: ["mercado"] }] })
    expect(um).toContain('aria-label="Categoria: não é Mercado. Editar valor."')
    // O `currencyBRL` separa o R$ com espaço inseparável.
    expect(html).toMatch(/R\$\s50,00 e R\$\s200,00/)
    expect(html).toContain('aria-label="Remover filtro Categoria"')
  })

  it("o filtro sem valor não tem operador nem valor", () => {
    const html = barra({ defaultValue: [{ field: "parcelado", operator: "is", values: [] }] })
    expect(html).toContain("Compras parceladas")
    expect(html).not.toContain('data-slot="filter-bar-value"')
    expect(html).not.toContain('data-slot="filter-bar-operator"')
  })

  it("Limpar e E/OU só a partir de dois filtros, e o E/OU só com o handler", () => {
    const dois = filtros.slice(0, 2)
    expect(barra({ defaultValue: filtros.slice(0, 1) })).not.toContain('data-slot="filter-bar-clear"')
    expect(barra({ defaultValue: dois })).toContain('data-slot="filter-bar-clear"')
    expect(barra({ defaultValue: dois })).not.toContain('data-slot="filter-bar-match"')
    expect(barra({ defaultValue: dois, onMatchChange: () => {} })).toContain(
      'aria-label="Combinar filtros: todos (E). Trocar para qualquer um (OU)."'
    )
  })

  it("a contagem é uma região viva", () => {
    expect(barra({ count: 8, total: 42, noun: ["lançamento", "lançamentos"] })).toMatch(
      /role="status"[^>]*data-slot="filter-bar-count"[^>]*>8 de 42 lançamentos</
    )
  })

  it("pending põe a roda no token e avisa", () => {
    const campos = CAMPOS.map((c) => (c.id === "categoria" ? { ...c, pending: true } : c))
    const html = renderToStaticMarkup(
      h(FilterBar, { fields: campos, defaultValue: filtros.slice(0, 1) })
    )
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('data-slot="spinner"')
    expect(html).toContain("Carregando.")
  })

  it("o + Filtro diz a tecla e o que abre", () => {
    const html = barra()
    expect(html).toContain('aria-label="Adicionar filtro"')
    expect(html).toContain('aria-keyshortcuts="F"')
    expect(html).toContain('aria-haspopup="dialog"')
  })
})

describe("a URL", () => {
  afterEach(() => vi.useRealTimers())

  it("vai e volta igual, em todos os tipos", () => {
    const filtros: FilterValue[] = [
      { field: "categoria", operator: "is", values: ["mercado", "transporte"] },
      { field: "valor", operator: "between", values: ["50", "200"] },
      { field: "periodo", operator: "is", values: ["este-mes"] },
      { field: "descricao", operator: "contains", values: ["ação: café, pão | leite"] },
      { field: "parcelado", operator: "is", values: [] },
    ]
    const texto = serializeFilters(filtros)!
    expect(parseFilters(texto, CAMPOS)).toEqual(filtros)
    expect(parseFilters(serializeFilters([{ field: "periodo", operator: "is", values: ["2026-10-01", "2026-10-15"] }]), CAMPOS)).toEqual([
      { field: "periodo", operator: "is", values: ["2026-10-01", "2026-10-15"] },
    ])
    expect(serializeFilters([])).toBeNull()
  })

  it("descarta o que não entende, e conserta o que dá", () => {
    expect(parseFilters("desconhecido:is:x,valor:gte:abc,categoria:is:nada", CAMPOS)).toEqual([])
    // Repetido: o primeiro vale. Operador inválido: o padrão do tipo.
    expect(parseFilters("categoria:is:mercado,categoria:is:transporte", CAMPOS)).toEqual([
      { field: "categoria", operator: "is", values: ["mercado"] },
    ])
    expect(parseFilters("categoria:xyz:mercado", CAMPOS)).toEqual([
      { field: "categoria", operator: "is", values: ["mercado"] },
    ])
    // Datas e valores invertidos voltam em ordem; uma escolha só fica com uma.
    expect(parseFilters("periodo:is:2026-10-15:2026-10-01", CAMPOS)[0].values).toEqual(["2026-10-01", "2026-10-15"])
    expect(parseFilters("valor:between:200:50", CAMPOS)[0].values).toEqual(["50", "200"])
    expect(parseFilters("tipo:is:despesa:receita", CAMPOS)[0].values).toEqual(["despesa"])
    // A opção que vem do servidor não é conhecida aqui, e fica.
    expect(parseFilters("loja:is:padaria", CAMPOS)[0].values).toEqual(["padaria"])
    expect(parseFilters("periodo:is:amanha", CAMPOS)).toEqual([])
    expect(parseFilters("descricao:contains:%E0%A4%A", CAMPOS)).toEqual([])
  })

  it("o atalho de período resolve na data de hoje", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 8, 12))
    expect(filterPeriodRange(["este-mes"])).toEqual({ from: "2026-10-01", to: "2026-10-08" })
    expect(filterPeriodRange(["mes-passado"])).toEqual({ from: "2026-09-01", to: "2026-09-30" })
    expect(filterPeriodRange(["2026-10-01", "2026-10-15"])).toEqual({ from: "2026-10-01", to: "2026-10-15" })
    expect(filterPeriodRange(["ontem"])).toBeNull()
  })

  it("pushState com null, uma entrada por sessão do editor, e o voltar relê", () => {
    expect(CODIGO).toContain('window.history.pushState(null, "", url)')
    expect(CODIGO).toContain('window.history.replaceState(null, "", url)')
    expect(CODIGO).toContain('window.addEventListener("popstate", voltar)')
    expect(CODIGO).not.toContain("window.history.state")
  })
})

describe("o comportamento", () => {
  it("o teclado é o da Toolbar, e o Backspace só vale de dentro do token no DOM", () => {
    expect(CODIGO).toContain("useToolbarKeyboard(linhaRef, !disabled)")
    expect(CODIGO).toContain("if (!e.currentTarget.contains(e.target as Node)) return")
    expect(CODIGO).toContain('e.key !== "Backspace" && e.key !== "Delete"')
  })

  it("a tecla F mora no documento da barra e não dispara em campo de texto", () => {
    expect(CODIGO).toContain("el.ownerDocument")
    expect(CODIGO).toContain("matchShortcut(shortcut, e)")
    expect(CODIGO).toContain("isEditableTarget(e.target)")
  })

  it("o Enter não é parado na barra: um Form em volta só envia pelo dono do campo no DOM", () => {
    expect(CODIGO).not.toContain('if (e.key === "Enter") e.stopPropagation()')
  })

  it("o editor não sobrescreve o data-slot do popover", () => {
    // O Calendar e quem procura o popover leem `data-slot="popover-content"`.
    expect(CODIGO).not.toContain('data-slot="filter-bar-editor"')
    expect(CODIGO).toContain('data-filter-bar="editor"')
  })

  it("um popover para a barra, ancorado no que está aberto", () => {
    expect(CODIGO).toContain("<PopoverAnchor virtualRef={ancoraRef} />")
    // Só um token ou o "+ Filtro" seguram o editor (eles o trocam); o vão da
    // linha, que é larga, fecha como o resto da página.
    expect(CODIGO).toContain(
      'alvo?.closest("[data-slot=filter-bar-token], [data-slot=filter-bar-add]")'
    )
    expect(CODIGO.match(/<Popover\b/g)).toHaveLength(1)
  })

  it("o token surge e se dissolve, e quem abre e fecha o espaço são os vizinhos", () => {
    // Tirado do fluxo na hora, para os vizinhos fecharem o espaço junto; a
    // regra de posição vai ao `<head>` do documento da barra (o iframe do catálogo).
    expect(CODIGO.match(/<AnimatePresence initial=\{false\} mode="popLayout" root=\{cabeca\}>/g)).toHaveLength(3)
    expect(CODIGO).toContain("if (el) setCabeca(el.ownerDocument.head)")
    expect(CODIGO).toContain('layout={reduzir ? undefined : "position"}')
    expect(CODIGO).toContain("layoutScroll")
    // Surgir: escala na mola, opacidade e desfoque numa curva; sair: curva, sem mola.
    expect(CODIGO).toContain('initial: { opacity: 0, scale: 0.9, filter: "blur(4px)" }')
    expect(CODIGO).toContain("scale: MOLA,")
    expect(CODIGO).toContain("transition: { duration: 0.15, ease: CURVA }")
    // A largura não anima mais: a mola passava do alvo e a pílula inchava.
    expect(CODIGO).not.toMatch(/width: "auto"|width: 0/)
    // Nem `motion.create(Button)`: o `ref` do Button é refeito a cada render, e
    // o elemento animado desmontava no meio da saída.
    expect(CODIGO).not.toContain("motion.create(Button)")
    expect(CODIGO).toContain("useReducedMotion()")
    expect(CODIGO).toContain("inert={!presente || undefined}")
  })

  it("o foco não rola a faixa pelo que se vê no meio do deslize", () => {
    expect(CODIGO).toContain("alvo.focus({ preventScroll: true })")
    expect(CODIGO).toContain("ini += n.offsetLeft")
    expect(CODIGO).not.toMatch(/addRef\.current\?\.focus\(\)/)
  })

  it("no sm, o ladrilho de cor desce a 20, com a folga de 4 do md", () => {
    expect(CODIGO).toContain(
      'sm: "gap-1 [&>svg]:size-3.5 [&_[data-slot=color-tile]]:size-5 [&_[data-slot=color-tile]]:rounded-sm"'
    )
  })

  it("no empilhado, o token que sai declara as colunas da grade", () => {
    expect(CODIGO).toContain(
      "@max-md/filter-bar:[&[data-motion-pop-id]]:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
    )
  })

  it("o flash é a utility da casa, numa sobreposição que remonta — nunca o botão", () => {
    expect(CODIGO).toContain('trocasValor > 0 && "table-flash"')
    expect(CODIGO).toMatch(/<span aria-hidden key=\{trocasValor\}/)
    expect(lerFonte("src/app/globals.css")).not.toContain("filter-bar")
  })

  it("o operador troca num menu de rádios, e no telefone ele e o editor viram gaveta", () => {
    expect(CODIGO).toContain("DropdownMenuRadioGroup")
    expect(CODIGO.match(/mobile="sheet"/g)).toHaveLength(2)
  })
})

describe("o esqueleto", () => {
  it("anuncia uma vez, e some dentro de um esqueleto de página", () => {
    expect(renderToStaticMarkup(h(FilterBarSkeleton))).toContain('data-slot="skeleton-group"')
    expect(renderToStaticMarkup(h(FilterBarSkeleton, { group: false }))).not.toContain('data-slot="skeleton-group"')
  })
})

describe("as proibições", () => {
  it("organismo não importa template, e o Combobox não é o editor", () => {
    expect(CODIGO).not.toContain('from "@/components/ui/toolbar"')
    expect(CODIGO).not.toContain('from "@/components/ui/combobox"')
  })

  it("ícones do tamanho certo, sem identidade de peça, sem classe montada", () => {
    expect(CODIGO).not.toContain("@heroicons/react/24")
    expect(CODIGO).not.toContain("child.type ===")
    expect(CODIGO).not.toMatch(/className=\{`/)
    expect(CODIGO).not.toMatch(/`\[\$\{/)
  })
})
