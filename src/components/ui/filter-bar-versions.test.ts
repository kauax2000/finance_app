import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

import {
  abaInicialDoPeriodo,
  anosDaGrade,
  mesesDaGrade,
  pedirTotais,
  FilterBar,
  FILTER_PERIOD_DAY_PRESET_IDS,
  FILTER_PERIOD_PRESETS,
  FILTER_PERIOD_YEAR_PRESET_IDS,
  FilterBarSkeleton,
  filterPeriodRange,
  parseFilters,
  serializeFilters,
  type FilterField,
  tokensQueSaem,
  totalDoAno,
  excessoDaLinha,
  chaveDaMedida,
  type FilterValue,
} from "./filter-bar"
import { OverflowMenu } from "@/lib/overflow-menu"

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
    expect(CODIGO).toContain('const LISTA_NA_GAVETA = "[--command-list-max-h:min(55dvh,--spacing(120))]')
    // A linha concêntrica à placa (14), como nos menus, e não à gaveta (12).
    expect(CODIGO).toContain("[--radius-parent:var(--radius-surface)] [--radius-inset:--spacing(2)]")
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

  it("o operador não muda com a contagem, e o nome do valor diz todos", () => {
    const html = barra({ defaultValue: filtros })
    expect(html).toContain('aria-label="Categoria: é Mercado, Transporte. Editar valor."')
    expect(html).toContain('aria-label="Categoria: é. Trocar para não é."')
    expect(html).toContain("+1")
    const um = barra({ defaultValue: [{ field: "categoria", operator: "is-not", values: ["mercado"] }] })
    expect(um).toContain('aria-label="Categoria: não é Mercado. Editar valor."')
    // O `currencyBRL` separa o R$ com espaço inseparável.
    // A pílula sai curta; o nome do botão diz as duas pontas por extenso.
    expect(html).toMatch(/R\$\s50 – 200/)
    // O modo do Valor não se troca na pílula: o segmento é texto, e quem troca é o editor.
    expect(html).not.toContain("Valor: entre. Trocar operador.")
    expect(html).toMatch(/Valor: entre R\$\s50,00 a R\$\s200,00\. Editar valor\./)
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
    expect(CODIGO).toContain("useToolbarKeyboard(barraRef, !disabled)")
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
    // Só um token, o "+ Filtro" ou o "+N" seguram o editor (eles o trocam); o
    // vão da linha, que é larga, fecha como o resto da página.
    expect(CODIGO).toContain(
      'alvo?.closest("[data-slot=filter-bar-token], [data-slot=filter-bar-add], [data-overflow-more]")'
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

describe("atalhos e rótulo do período", () => {
  afterEach(() => vi.useRealTimers())
  const periodo = (values: string[]) =>
    barra({ defaultValue: [{ field: "periodo", operator: "is", values }] })

  it("Hoje e 90 dias entram, e os antigos seguem", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 8, 12))
    expect(filterPeriodRange(["hoje"])).toEqual({ from: "2026-11-08", to: "2026-11-08" })
    expect(filterPeriodRange(["ultimos-90"])).toEqual({ from: "2026-08-11", to: "2026-11-08" })
    expect(filterPeriodRange(["este-mes"])).toEqual({ from: "2026-11-01", to: "2026-11-08" })
    expect(filterPeriodRange(["mes-passado"])).toEqual({ from: "2026-10-01", to: "2026-10-31" })
    expect(FILTER_PERIOD_DAY_PRESET_IDS).toEqual(["hoje", "ultimos-7", "ultimos-30", "ultimos-90"])
    expect(FILTER_PERIOD_PRESETS.map((p) => p.id)).toEqual(
      expect.arrayContaining([...FILTER_PERIOD_DAY_PRESET_IDS, "este-mes", "mes-passado", "este-ano", "ano-passado", "ultimos-12-meses"])
    )
  })

  it("a URL guarda o atalho novo e recusa o desconhecido", () => {
    expect(parseFilters("periodo:is:ultimos-90", CAMPOS)[0].values).toEqual(["ultimos-90"])
    expect(parseFilters("periodo:is:amanha", CAMPOS)).toEqual([])
  })

  it("o rótulo do token segue a unidade", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 8, 12))
    const meses = periodo(["2026-08-01", "2026-10-31"])
    expect(meses).toContain("ago – out 2026")
    expect(meses).toContain(">é<")
    expect(periodo(["2025-01-01", "2025-12-31"])).toContain("2025")
    expect(periodo(["ultimos-90"])).toContain("Últimos 90 dias")
    expect(periodo(["2026-08-01", "2026-08-15"])).toContain(">entre<")
  })

  it("o DatePicker não mudou", () => {
    expect(lerFonte("src/components/ui/date-picker.tsx")).not.toContain("ultimos-90")
  })
})

describe("o período em abas", () => {
  afterEach(() => vi.useRealTimers())
  const BLOCO = CODIGO.slice(CODIGO.indexOf("function EditorDePeriodo"), CODIGO.indexOf("type ListaProps"))

  it("a aba inicial segue o valor", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 8, 12))
    expect(abaInicialDoPeriodo([])).toBe("dias")
    expect(abaInicialDoPeriodo(["2025-01-01", "2025-12-31"])).toBe("ano")
    expect(abaInicialDoPeriodo(["2025-11-01", "2026-02-28"])).toBe("meses")
    expect(abaInicialDoPeriodo(["este-mes"])).toBe("dias")
    expect(abaInicialDoPeriodo(["ultimos-7"])).toBe("dias")
    expect(abaInicialDoPeriodo(["2026-08-01", "2026-08-15"])).toBe("dias")
  })

  it("Dias · Meses · Ano no Tabs, a grade em intervalo, e só os atalhos de dias", () => {
    expect(BLOCO).toContain("<Tabs")
    for (const v of ["dias", "meses", "ano"]) expect(BLOCO).toContain(`<TabsTrigger value="${v}"`)
    expect(BLOCO).toMatch(/<MonthGrid[\s\S]*?mode="range"/)
    expect(BLOCO).toMatch(/presets=\{ATALHOS_DE_DIAS\}/)
    expect(CODIGO).toMatch(/const ATALHOS_DE_DIAS = FILTER_PERIOD_DAY_PRESET_IDS\.map/)
    expect(BLOCO).not.toMatch(/isMobile \?/)
    expect(BLOCO).toContain("<GradeDeAnos")
    expect(CODIGO).toMatch(/function GradeDeAnos[\s\S]*?proximoIntervaloDeMes\(/)
    expect(CODIGO).toContain('aria-label="Atalhos de ano"')
    expect(CODIGO).toContain("sem lançamentos")
  })

  it("os atalhos de ano são ids e resolvem na data de hoje", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 8, 12))
    expect(FILTER_PERIOD_YEAR_PRESET_IDS).toEqual(["este-ano", "ano-passado", "ultimos-12-meses"])
    expect(filterPeriodRange(["este-ano"])).toEqual({ from: "2026-01-01", to: "2026-11-08" })
    expect(filterPeriodRange(["ano-passado"])).toEqual({ from: "2025-01-01", to: "2025-12-31" })
    expect(filterPeriodRange(["ultimos-12-meses"])).toEqual({ from: "2025-11-09", to: "2026-11-08" })
    for (const id of FILTER_PERIOD_YEAR_PRESET_IDS) expect(abaInicialDoPeriodo([id])).toBe("ano")
    expect(abaInicialDoPeriodo(["2024-01-01", "2026-12-31"])).toBe("ano")
  })

  it("a grade de anos pinta anos inteiros, um ou vários", () => {
    expect(anosDaGrade(["2024-01-01", "2026-12-31"])).toEqual({ from: 2024, to: 2026 })
    expect(anosDaGrade(["2025-01-01", "2025-12-31"])).toEqual({ from: 2025, to: 2025 })
    expect(anosDaGrade(["ano-passado"])).toBeUndefined()
    expect(anosDaGrade(["2025-03-01", "2025-12-31"])).toBeUndefined()
  })

  it("o ano atual soma até o mês de hoje; o passado pede os doze", () => {
    const hoje = new Date(2026, 10, 8)
    const atual = [...Array(11).fill(10), null]
    expect(totalDoAno(atual, 2026, hoje)).toBe(110)
    expect(totalDoAno([null, ...Array(11).fill(10)], 2026, hoje)).toBeNull()
    expect(totalDoAno(Array(12).fill(0), 2023, hoje)).toBe(0)
    expect(totalDoAno([...Array(11).fill(1), null], 2025, hoje)).toBeNull()
    expect(totalDoAno(undefined, 2025, hoje)).toBeNull()
  })

  it("sem valor, os dois meses do desktop terminam no atual", () => {
    expect(BLOCO).toContain("getMonth() - 1")
  })

  it("o resumo diz o intervalo e a duração", () => {
    expect(BLOCO).toContain("periodSummary(")
    expect(BLOCO).toContain('data-slot="filter-bar-period-summary"')
  })

  it("os totais carregam por ano, cancelando, sem React Query", () => {
    expect(CODIGO).not.toContain("useQuery")
    expect(CODIGO).toContain("new AbortController()")
    expect(CODIGO).toContain("currencyCompactBRL(")
    // Tipo: o campo de período aceita `totals`.
    const comTotais: FilterField = { id: "p", label: "P", type: "period", totals: async () => Array(12).fill(null) }
    expect(comTotais.type).toBe("period")
  })
})

describe("o período na grade de meses (revisão)", () => {
  it("meses e o ano inteiro pintam a grade; dias não", () => {
    expect(mesesDaGrade(["2026-08-01", "2026-10-31"])).toEqual({ from: new Date(2026, 7, 1), to: new Date(2026, 9, 1) })
    // Jan–Dez escolhido na grade é um ano: a grade continua mostrando os doze.
    expect(mesesDaGrade(["2025-01-01", "2025-12-31"])).toEqual({ from: new Date(2025, 0, 1), to: new Date(2025, 11, 1) })
    expect(mesesDaGrade(["2025-03-01", "2025-03-15"])).toBeUndefined()
    expect(mesesDaGrade([])).toBeUndefined()
  })

  it("os totais carregam o ano em que a grade abre — a mesma regra nos dois lugares", () => {
    const BLOCO = CODIGO.slice(CODIGO.indexOf("function EditorDePeriodo"), CODIGO.indexOf("type ListaProps"))
    expect(BLOCO).toContain("const valorDaGrade = mesesDaGrade(valores)")
    expect(BLOCO).toContain("const anoDoValor = (valorDaGrade?.from ?? new Date()).getFullYear()")
    expect(BLOCO).toMatch(/<MonthGrid[\s\S]*?value=\{valorDaGrade\}/)
  })
})

describe("os totais sob o StrictMode (revisão final)", () => {
  // Rejeita no cancelamento, como o Supabase; chega no próximo giro, senão.
  const buscar = (chamadas: number[]) => (ano: number, signal: AbortSignal) => {
    chamadas.push(ano)
    return new Promise<(number | null)[]>((ok, falha) => {
      signal.addEventListener("abort", () => falha(new DOMException("cancelado", "AbortError")))
      setTimeout(() => ok(Array(12).fill(ano)), 0)
    })
  }

  it("montar, limpar e montar de novo pede o ano outra vez, e ele chega", async () => {
    const pedidos = new Set<number>()
    const chamadas: number[] = []
    const chegou = vi.fn()
    const limpar = pedirTotais(pedidos, [2026], buscar(chamadas), chegou)
    limpar()
    pedirTotais(pedidos, [2026], buscar(chamadas), chegou)
    await new Promise((r) => setTimeout(r, 5))
    expect(chamadas).toEqual([2026, 2026])
    expect(chegou).toHaveBeenCalledWith(2026, Array(12).fill(2026))
    // O cancelado que rejeita depois não tira o pedido da rodada nova.
    expect(pedidos.has(2026)).toBe(true)
  })

  it("o que já chegou não é pedido de novo", async () => {
    const pedidos = new Set<number>()
    const chamadas: number[] = []
    pedirTotais(pedidos, [2026], buscar(chamadas), () => {})
    await new Promise((r) => setTimeout(r, 5))
    pedirTotais(pedidos, [2026, 2025], buscar(chamadas), () => {})
    expect(chamadas).toEqual([2026, 2025])
  })
})

describe("a largura do período (revisão final)", () => {
  const BLOCO = CODIGO.slice(CODIGO.indexOf("function EditorDePeriodo"), CODIGO.indexOf("type ListaProps"))

  it("no desktop as três abas têm a largura de Dias; na gaveta nada muda", () => {
    // Dias fica montado e sem altura fora da vez: a largura dele segura o editor.
    const dias = BLOCO.slice(BLOCO.indexOf('<TabsContent\n'), BLOCO.indexOf('<TabsContent value="meses"'))
    expect(dias).toContain('value="dias"')
    expect(dias).toContain("forceMount={naGaveta ? undefined : true}")
    expect(dias).toContain('inert={!naGaveta && aba !== "dias"}')
    for (const c of ["data-[state=inactive]:block", "data-[state=inactive]:invisible", "data-[state=inactive]:h-0", "data-[state=inactive]:flex-none", "data-[state=inactive]:overflow-hidden"])
      expect(dias).toContain(c)
    expect(BLOCO).not.toMatch(/min-w-\[|w-\[\d/)
  })
})

/** O trecho de um `<div>` inteiro, do `data-slot` até o `</div>` que o fecha. */
const divDoSlot = (html: string, slot: string) => {
  const ini = html.lastIndexOf("<div", html.indexOf(`data-slot="${slot}"`))
  const re = /<div\b|<\/div>/g
  re.lastIndex = ini
  let fundo = 0
  for (let m = re.exec(html); m; m = re.exec(html)) {
    fundo += m[0] === "</div>" ? -1 : 1
    if (fundo === 0) return html.slice(ini, m.index + 6)
  }
  return html.slice(ini)
}

describe("overflow menu", () => {
  const TRES: FilterValue[] = [
    { field: "categoria", operator: "is", values: ["mercado"] },
    { field: "descricao", operator: "contains", values: ["pão"] },
    { field: "parcelado", operator: "is", values: [] },
  ]

  it("o valor scroll saiu: a linha é wrap ou menu", () => {
    expect(CODIGO).toContain('overflow?: "wrap" | "menu"')
    expect(CODIGO).not.toMatch(/overflow\?: [^\n]*"scroll"/)
    expect(CODIGO).not.toContain('overflow === "scroll"')
    // O auto-rolar até o token novo e a faixa que rola saíram junto.
    expect(CODIGO).not.toMatch(/scrollTo\(\{ left: [a-z]+\.scrollWidth/)
    expect(CODIGO).not.toContain("flex-initial flex-nowrap overflow-x-auto")
  })

  it("quem sai é o mecanismo do sistema, medido por ResizeObserver, e sai por hidden", () => {
    expect(CODIGO).toMatch(/import \{[^}]*quemSai[^}]*\} from "@\/lib\/overflow"/)
    expect(CODIGO).toMatch(/import \{[^}]*OverflowMenu[^}]*\} from "@\/lib\/overflow-menu"/)
    expect(CODIGO).toContain("new ResizeObserver(")
    expect(CODIGO).toContain('setAttribute("hidden", "")')
    expect(CODIGO).toContain('ponta: "fim"')
  })

  it("tokensQueSaem: do fim, pulando o fixo, até caber com o +N", () => {
    const o = { reserva: 40, gap: 6 }
    expect(tokensQueSaem([100, 100, 100], 250, o)).toEqual([1, 2])
    expect(tokensQueSaem([100, 100, 100], 250, { ...o, fixo: 2 })).toEqual([0, 1])
    expect(tokensQueSaem([100, 100, 100], 400, o)).toEqual([])
  })

  it("excessoDaLinha: mostra o máximo que cabe, encolhendo o primeiro que sairia", () => {
    const o = { reserva: 36, gap: 6, pisos: [112, 112] }
    // O caso medido a 1165px: o Período encolhe na sobra, só o A conferir vai ao +1.
    expect(excessoDaLinha([277, 129], 303, o)).toEqual({ saem: [1], encolhe: { indice: 0, largura: 261 } })
    // Tudo cabe: nada sai, nada encolhe.
    expect(excessoDaLinha([100, 100], 300, o)).toEqual({ saem: [] })
    // Sozinho, o primeiro não chega ao piso: sai.
    expect(excessoDaLinha([300], 100, o)).toEqual({ saem: [0] })
    // O booleano não tem valor para encolher: o piso dele é a largura inteira.
    expect(excessoDaLinha([277, 129], 400, { ...o, pisos: [112, 129] })).toEqual({ saem: [], encolhe: { indice: 0, largura: 265 } })
    expect(excessoDaLinha([60, 129], 180, { ...o, pisos: [60, 129] })).toEqual({ saem: [1] })
    // Só um sairia: encolher o último por 16px vence o +1.
    expect(excessoDaLinha([150, 150], 290, o)).toEqual({ saem: [], encolhe: { indice: 1, largura: 134 } })
    // O último ficaria abaixo do piso: encolhe o mais largo.
    expect(excessoDaLinha([300, 80], 370, o)).toEqual({ saem: [], encolhe: { indice: 0, largura: 284 } })
    // O do editor aberto nunca encolhe nem sai.
    expect(excessoDaLinha([300, 80], 370, { ...o, fixo: 0 })).toEqual({ saem: [1] })
    expect(CODIGO).toContain("for (const el of els) el.style.maxWidth = \"\"")
  })

  it("com o editor aberto, digitar não remede: a chave ignora os valores e os tokens não são observados", () => {
    const linha = [
      { field: "descricao", operator: "contains" as const, values: ["pão"] },
      { field: "valor", operator: "gte" as const, values: ["10"] },
    ]
    const digitado = [linha[0], { ...linha[1], values: ["1000"] }]
    expect(chaveDaMedida(linha, "valor")).toBe(chaveDaMedida(digitado, "valor"))
    // Fechado, o valor muda a largura e remede; fechar muda a chave e remede uma vez.
    expect(chaveDaMedida(linha)).not.toBe(chaveDaMedida(digitado))
    expect(chaveDaMedida(digitado, "valor")).not.toBe(chaveDaMedida(digitado))
    // Entra ou sai um token com o editor aberto: remede.
    expect(chaveDaMedida(linha.slice(0, 1), "valor")).not.toBe(chaveDaMedida(linha, "valor"))
    expect(CODIGO).toContain("const chaveDaLinha = chaveDaMedida(tokens, fixo)")
    expect(CODIGO).toMatch(/if \(!fixo\) for \(const el of lerTokens\(\)\) ro\.observe\(el\)/)
  })

  it("a linha do +N que abre o editor dá ao foco um lugar, mesmo se o +N sair", () => {
    expect(CODIGO).toMatch(/onSelect: \(\) => \{\s*doMenu\.current = true\s*abrirValor\(t\.field\)/)
    expect(CODIGO).toMatch(/onCloseAutoFocus=\{\(e\) => \{\s*if \(!doMenu\.current\) return\s*doMenu\.current = false\s*e\.preventDefault\(\)\s*const doc = linhaRef\.current\?\.ownerDocument\s*if \(!doc\?\.activeElement \|\| doc\.activeElement === doc\.body\) focarDestino\(\)/)
    const menuFonte = semComentarios(lerFonte("src/lib/overflow-menu.tsx"), "linha-inteira")
    expect(menuFonte).toContain("<DropdownMenuContent align={align} size=\"lg\" onCloseAutoFocus={onCloseAutoFocus}>")
  })

  it("uma linha só que não rola, e as ações e a contagem ficam fora dela", () => {
    const html = barra({ overflow: "menu", defaultValue: TRES, count: 3 })
    expect(html).toContain('data-overflow="menu"')
    const linha = divDoSlot(html, "filter-bar-row")
    const abre = linha.slice(0, linha.indexOf(">"))
    expect(abre).toContain("flex-nowrap")
    expect(abre).toContain("overflow-hidden")
    expect(abre).not.toContain("overflow-x-auto")
    expect(linha).toContain('data-slot="filter-bar-token"')
    expect(linha).not.toContain('data-slot="filter-bar-add"')
    expect(linha).not.toContain('data-slot="filter-bar-clear"')
    expect(linha).not.toContain('data-slot="filter-bar-count"')
    expect(html).toContain('data-slot="filter-bar-add"')
    expect(html).toContain('data-slot="filter-bar-count"')
    // O teclado de setas atravessa os tokens, o +N e as ações: o `toolbar` é o invólucro.
    expect(linha).not.toContain('role="toolbar"')
    expect(html.match(/role="toolbar"/g)).toHaveLength(1)
  })

  it("o +N diz quantos saíram, e as linhas do menu são o token por extenso", () => {
    expect(CODIGO).toContain('`Mais ${fora.length} ${fora.length === 1 ? "filtro" : "filtros"}`')
    expect(CODIGO).toContain("trigger={`+${fora.length}`}")
    expect(CODIGO).toMatch(/campo\.label : `\$\{campo\.label\} \$\{d\.operador\} \$\{d\.falado\}`/)
    // Escolher uma linha abre o editor do mesmo jeito que o token.
    expect(CODIGO).toMatch(/onSelect: \(\) => \{\s*doMenu\.current = true\s*abrirValor\(t\.field\)/)
    // O menu nunca é uma lista de remover: o booleano é lido como o token e abre o editor dele.
    expect(CODIGO).not.toContain("label: `Remover ${campo.label}`")
    expect(CODIGO).toMatch(/label: campo\.type === "boolean" \? campo\.label :/)
    expect(CODIGO).not.toMatch(/const abrirValor = \(field: string\) => \{\s*if \(porId\.get\(field\)\?\.type === "boolean"\) return/)
    // O editor do booleano: o título, o Remover e a frase de que não há valor a escolher.
    expect(CODIGO).toMatch(/campo\.type === "boolean" \? \(\s*<p[^>]*>Sem valor a escolher/)
  })

  it("sem overflow, igual a hoje: o \"+ Filtro\" mora na fileira", () => {
    const html = barra({ defaultValue: TRES })
    expect(html).not.toContain("data-overflow")
    expect(divDoSlot(html, "filter-bar-row")).toContain('data-slot="filter-bar-add"')
  })

  it("na barra estreita a contagem guarda o número e esconde o nome só da vista", () => {
    const html = barra({ overflow: "menu", defaultValue: TRES, count: 48, noun: ["lançamento", "lançamentos"] })
    expect(html).toMatch(/data-slot="filter-bar-count"[^>]*>48<span class="@max-md\/filter-bar:sr-only"> lançamentos<\/span>/)
    expect(barra({ count: 48, noun: ["lançamento", "lançamentos"] })).toMatch(/>48 lançamentos</)
  })

  it("na barra estreita o Limpar vira o × redondo, e o + Filtro guarda o texto", () => {
    expect(CODIGO).toMatch(/menu && "@max-md\/filter-bar:aspect-square @max-md\/filter-bar:px-0"/)
    expect(CODIGO).toMatch(/<XMarkIcon aria-hidden className="hidden @max-md\/filter-bar:block" \/>\s*<span className="@max-md\/filter-bar:hidden">Limpar<\/span>/)
    const html = barra({ overflow: "menu", defaultValue: TRES })
    const limpar = html.match(/<button[^>]*data-slot="filter-bar-clear"[\s\S]*?<\/button>/)?.[0] ?? ""
    expect(limpar).toContain('aria-label="Limpar filtros"')
    expect(limpar).toContain('data-variant="tertiary"')
    expect(limpar).toContain("pointer-coarse:h-11")
    expect(html.match(/<button[^>]*data-slot="filter-bar-add"[\s\S]*?<\/button>/)?.[0]).toMatch(/filtro/)
  })

  it("a linha de fora só empilha na forma wrap", () => {
    expect(CODIGO).toMatch(/!menu && "@max-md\/filter-bar:flex-col/)
  })
})

describe("OverflowMenu", () => {
  const menu = (props: Partial<React.ComponentProps<typeof OverflowMenu>> = {}) =>
    renderToStaticMarkup(h(OverflowMenu, { items: [], label: "Mais 2 filtros", ...props }))

  it("com trigger, o gatilho mostra o texto e guarda o nome e a marca da medição", () => {
    const html = menu({ trigger: "+2" })
    expect(html).toContain(">+2<")
    expect(html).toContain('aria-label="Mais 2 filtros"')
    expect(html).toContain("data-overflow-more")
    expect(html).not.toContain("<svg")
  })

  it("sem trigger, continua o ⋯ do Tabs e da Toolbar", () => {
    const html = menu({ label: "Mais ações" })
    expect(html).toContain("<svg")
    expect(html).toContain('aria-label="Mais ações"')
    expect(html).toContain("data-overflow-more")
  })
})

describe("o deslize da barra é medido contra ela", () => {
  it("o miolo é layoutRoot: um salto da página não faz o \"+ Filtro\" atravessar na mola", () => {
    expect(CODIGO).toMatch(/<motion\.div\s+layoutRoot\b/)
  })
})

describe("a contagem assenta no pé da linha", () => {
  it("o span do filter-bar-count leva self-end, para ficar rente à base dos tokens", () => {
    expect(CODIGO).toMatch(/data-slot="filter-bar-count"[^>]*className="[^"]*\sself-end\s[^"]*"/)
  })
})
