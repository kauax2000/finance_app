#!/usr/bin/env node
/**
 * audit.mjs — acha o que uma tela violou do design system.
 *
 * O script é deliberadamente burro: ele acha padrões e diz onde, sem opinião
 * sobre o que fazer. O julgamento é de quem lê. A vantagem sobre reler o arquivo
 * a olho é que ele não cansa e não erra diferente a cada vez.
 *
 * Uso:
 *   node audit.mjs src/app/(app)/transactions/page-client.tsx
 *   node audit.mjs src/components/credit-cards      # a pasta inteira
 *   node audit.mjs                                  # src/app + src/components
 *   node audit.mjs --json
 *   node audit.mjs --rule D3                        # só uma regra
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, relative, resolve, dirname, sep } from "node:path"
import { fileURLToPath } from "node:url"

// ---------------------------------------------------------------------------
// Tabelas de conhecimento
// ---------------------------------------------------------------------------

/** Primitivo cru -> componente do design system que já existe. */
const PRIMITIVE_TO_COMPONENT = {
  button: "Button",
  input: "Input",
  textarea: "Textarea",
  select: "Select (ou NativeSelect)",
  table: "Table",
  label: "Label",
  dialog: "Dialog",
  progress: "Progress",
  hr: "Separator",
}

/**
 * Primitivos sem equivalente no design system. Sinalizar é útil, mas o veredito
 * é diferente: são lacuna, não correção.
 */
const PRIMITIVE_WITHOUT_COMPONENT = new Set(["details", "summary", "meter", "fieldset"])

/** A paleta padrão do Tailwind. Nenhuma delas acompanha o tema. */
const TAILWIND_PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"

/**
 * `transparent`, `current` e `inherit` ficam de fora de propósito: são palavras
 * neutras, não cor. `border-transparent` aparece dentro do próprio Badge.
 */
const COLOR_UTILITY = new RegExp(
  `\\b(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline|shadow|divide|placeholder|caret|accent)-(?:${TAILWIND_PALETTE})-\\d{2,3}\\b`,
  "g"
)
const BARE_BW = /\b(?:bg|text|border|ring|fill|stroke|divide|placeholder)-(?:white|black)\b/g

/**
 * Onde uma cor literal **não é** decisão de tema, e por isso não deve segui-lo.
 *
 * Dois casos: cor que a pessoa escolheu e o banco guardou (categoria,
 * workspace, avatar), e material que representa um objeto do mundo — a marca
 * do cartão, a tinta clara sobre a face de plástico. Nos dois, seguir o tema
 * seria o erro, não o acerto.
 */
const RUNTIME_COLOR_FILES = [
  "category-appearance-fields",
  "workspace-appearance-form-fields",
  "workspace-appearance-edit-dialog",
  "credit-card-brand-logos",
  "registered-credit-card-face",
  "color-tile",
  "avatar.ts",
  "manifest.ts",
  "global-error.tsx",
]

/**
 * Bibliotecas de ícone que não são a deste projeto.
 *
 * Nenhuma delas está no `package.json` — e é justamente por isso que a regra
 * existe: o custo de instalar uma é um `npm i`, e o de conviver com duas é
 * permanente. Dois conjuntos não empilham: eles têm espessura de traço, grade e
 * cantos diferentes, e uma barra com um ícone de cada lê como um erro de
 * renderização, não como uma escolha.
 */
const FOREIGN_ICON_PACKAGES =
  /from\s+["'](lucide-react|react-icons(?:\/[\w-]+)?|@radix-ui\/react-icons|@tabler\/icons-react|phosphor-react|@phosphor-icons\/react|react-feather|feather-icons|@fortawesome\/[\w-]+|@mui\/icons-material|boxicons|ionicons)["']/g

/**
 * Onde um `<svg>` inline **não** é um ícone, e por isso não tem substituto no
 * Heroicons.
 *
 * Duas coisas: **marca** — o logo, a marca escrita, as bandeiras de cartão, que
 * são propriedade de outra pessoa e não existem em biblioteca de ícone — e
 * **primitivo desenhado**, como a roda do `Spinner`, cuja geometria é o
 * comportamento e não um pictograma.
 *
 * A lista é curta de propósito. Se um arquivo novo quiser entrar aqui, a
 * pergunta é se ele desenha uma marca ou um movimento; qualquer outra coisa é
 * um ícone, e ícone vem do Heroicons.
 */
const DRAWN_SVG_FILES = [
  "app-logo",
  "app-wordmark",
  "credit-card-brand-logos",
  "registered-credit-card-face",
  "spinner",
]

/**
 * O conjunto do Heroicons muda com o tamanho, porque eles são **redesenhos** e
 * não escalas: o micro tem menos detalhe e traço mais grosso, para sobreviver a
 * 16px. Usar o de 24 num `size-4` entrega um desenho que some.
 *
 * `size-6` ou maior -> `24/outline`; `size-5` -> `20/solid`; `size-4` ou menor
 * -> `16/solid`. Sem classe de tamanho conta como `size-4`, porque é o que o
 * componente que o contém aplica.
 */
function heroiconSetForSize(n) {
  if (n >= 6) return "24"
  if (n >= 5) return "20"
  return "16"
}

/**
 * O que não é código deste projeto.
 *
 * As três são dependência, build e histórico: nada ali foi escrito aqui.
 *
 * **`designsystem` estava nesta lista, e saiu.** Ela é a única pasta do
 * repositório cujo trabalho **é** escrever errado: mostra o literal que o token
 * substituiu, o `hover:` sem par que a regra proíbe, a peça que documenta. Ela
 * estava aqui porque medi-la dava 195 achados e 151 eram a regra A, o que
 * enterrava o relatório do app — mas calar por pasta é caro: foi assim que
 * quatro pares de ícone de conjunto errado viveram no catálogo sem ninguém ver,
 * inclusive as duas setas do paginador, uma de `24/outline` e a outra de
 * `16/solid`, lado a lado no mesmo `size-4`.
 *
 * O corte agora é por **regra**, não por pasta — ver `isCatalog`. Uma pasta
 * calada não é uma pasta conforme; é uma pasta que ninguém olhou.
 */
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"])

/**
 * Onde o Heroicons não tem o conjunto que a régua pede.
 *
 * `app-theme-toggle` faz um crossfade `outline` ↔ `solid` a 16px, e **não
 * existe `16/outline`** — os conjuntos micro e mini são só sólidos. É a mesma
 * classe de lacuna do círculo do `Spinner`, e a saída é a mesma: nomear.
 */
const HEROICON_SET_EXCEPTIONS = ["app-theme-toggle"]

/**
 * Onde fio **mais** tinta não é uma tira mal desenhada, e sim a emenda entre
 * duas superfícies.
 *
 * A regra J existe porque uma tira — barra de cartão, cabeçalho de popover,
 * rodapé de diálogo — **não desenha**: ela é a mesma superfície do corpo, e o
 * que a separa é o respiro. `PreviewCode` não é isso. Ele é a segunda
 * superfície do sistema de dois preenchimentos que o próprio `ds-doc.tsx`
 * declara — `card` para conteúdo, `muted` para código —, e a emenda entre duas
 * superfícies é justamente o que a lista de exclusões da J não nomeava.
 *
 * O número que decidiu, composto sobre `--card`: o fio dá **1,345:1** no claro e
 * 1,320 no escuro; a tinta a 30% dá **1,053** e 1,052. **O fio faz 5,5× o
 * trabalho da tinta** — e mesmo levando a tinta a 100% (1,192) ela não alcança.
 * Tirar o fio de 88 caixas de espécime derrubaria a emenda para abaixo de
 * qualquer limiar perceptual.
 */
const SECOND_SURFACE_FILES = ["ds-doc"]

// ---------------------------------------------------------------------------
// Varredura
// ---------------------------------------------------------------------------

function walk(target, acc = []) {
  const st = statSync(target)
  if (st.isFile()) {
    if (!/\.(tsx|ts)$/.test(target) || /\.test\.tsx?$/.test(target)) return acc
    // Arquivo gerado não tem autor a quem cobrar: o achado pertence à fonte, e
    // consertá-lo aqui é apagado no próximo `npm run ds:docs-map`.
    if (/^\/\/ GERADO POR/.test(readFileSync(target, "utf8").slice(0, 40))) return acc
    acc.push(target)
    return acc
  }
  for (const entry of readdirSync(target)) {
    if (SKIP_DIRS.has(entry)) continue
    walk(join(target, entry), acc)
  }
  return acc
}

/**
 * Apaga comentários **preservando os índices** — troca cada caractere por
 * espaço, para `lineOf` continuar acertando a linha.
 *
 * O que está comentado não é código. Sem isto, um `<select>` citado num JSDoc e
 * um `hover:` explicado numa nota viram achado.
 */
function semComentarios(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, " "))
}

/**
 * No catálogo, `` code={`…`} `` é o espécime: código **citado**, não escrito.
 *
 * A página que ensina "não escreva `hover:` sem `active:`" precisa mostrar o
 * exemplo errado — e é o que `docs/mobile-toque.tsx` faz, com a versão certa na
 * linha seguinte.
 */
function semEspecimes(src) {
  return src.replace(/\bcode=\{`[\s\S]*?`\}/g, (m) => m.replace(/[^\n]/g, " "))
}

/** Conta a linha de um índice. */
function lineOf(src, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (src[i] === "\n") line++
  return line
}

// ---------------------------------------------------------------------------
// Detectores
// ---------------------------------------------------------------------------

function auditFile(absPath, project) {
  const bruto = readFileSync(absPath, "utf8")
  const rel = relative(project, absPath)
  const findings = []
  const add = (rule, index, message, snippet) =>
    findings.push({
      rule,
      file: rel,
      line: lineOf(src, index),
      message,
      snippet: (snippet ?? "").trim().slice(0, 90),
    })

  const inApp = rel.startsWith(`src${sep}app${sep}`) || rel.startsWith("src/app/")
  const isUi =
    rel.startsWith(`src${sep}components${sep}ui${sep}`) ||
    rel.startsWith("src/components/ui/")

  /**
   * O catálogo. Ele **documenta** as regras, e para isso precisa violá-las: a
   * página de camadas escreve `z-[1]` porque é a escala que ela ensina; a de
   * tipografia cita `text-[10px]` porque foi o que os tokens substituíram; a de
   * `Code` cita `text-green-600` como o exemplo que o auditor reprova; e cada
   * peça dele nasce em `app/` de propósito, porque é demonstração e não tela.
   *
   * Por isso o corte é por regra: aqui calam **A** (as peças são demonstração),
   * **D / D2 / D3** (o literal é o espécime), **H** (o exemplo errado é o
   * ensino) e **I** (a página de dinheiro documenta formatação). Todas as
   * outras valem — e foi assim que apareceram os quatro pares de ícone com o
   * conjunto errado e o único achado de J do repositório.
   */
  const isCatalog =
    rel.startsWith(`src${sep}app${sep}designsystem${sep}`) ||
    rel.startsWith("src/app/designsystem/")

  // O que está comentado não é código; e no catálogo, o `code={`…`}` é citação.
  const src = isCatalog ? semEspecimes(semComentarios(bruto)) : semComentarios(bruto)

  const isRuntimeColor = RUNTIME_COLOR_FILES.some((f) => rel.includes(f))
  const isDrawnSvg = DRAWN_SVG_FILES.some((f) => rel.includes(f))
  const isHeroiconException = HEROICON_SET_EXCEPTIONS.some((f) => rel.includes(f))
  const isSecondSurface = SECOND_SURFACE_FILES.some((f) => rel.includes(f))

  // ── A. Componente nascendo dentro da tela ─────────────────────────────────
  // O caso central. Um componente definido em `app/` é invisível para todas as
  // outras telas: na próxima vez alguém escreve o mesmo de novo, um pouco
  // diferente, e o design system deixa de descrever o produto.
  // Arquivos que *são* uma convenção de rota do Next não podem morar em outro
  // lugar: `loading.tsx`, `error.tsx` e companhia só existem em `app/`, e o que
  // eles exportam é a rota, não um componente que fugiu do design system.
  const isRouteConvention =
    /(?:^|[\\/])(?:loading|error|global-error|not-found|not-found-shell|template|default|sw-register|manifest)\.tsx?$/.test(
      rel
    )

  if (inApp && !isCatalog && !isRouteConvention) {
    for (const m of src.matchAll(
      /^(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w*)\s*\(/gm
    )) {
      const name = m[1]
      // A função de rota é o próprio arquivo, não um componente extraído.
      if (/^(Page|Layout|Loading|Error|NotFound|Template|Default)$/.test(name)) continue
      if (/^\w*(Page|Layout|PageClient|Client|Route)$/.test(name)) continue
      add("A", m.index, `\`${name}\` é declarado dentro de src/app/`, m[0])
    }
  }

  // ── A2. cva() fora de components/ui/ ──────────────────────────────────────
  if (!isUi) {
    for (const m of src.matchAll(/\bcva\s*\(/g)) {
      add("A2", m.index, "`cva()` fora de components/ui/", m[0])
    }
  }

  // ── C / C'. Primitivo cru com (ou sem) equivalente no DS ──────────────────
  if (!isUi) {
    for (const m of src.matchAll(/<([a-z][a-z0-9]*)\b/g)) {
      const tag = m[1]
      if (PRIMITIVE_TO_COMPONENT[tag]) {
        add(
          "C",
          m.index,
          `\`<${tag}>\` cru — existe \`${PRIMITIVE_TO_COMPONENT[tag]}\` no design system`,
          m[0]
        )
      } else if (PRIMITIVE_WITHOUT_COMPONENT.has(tag)) {
        add("C'", m.index, `\`<${tag}>\` cru — sem equivalente no design system`, m[0])
      }
    }
  }

  // ── D. Cor literal ────────────────────────────────────────────────────────
  // (No catálogo, o hex **é** o espécime — ver `isCatalog`.)
  //
  // Numa **máscara** o valor não é cor: `mask-image` usa só o canal alfa, e o
  // preto é o estêncil convencional para "opaco". Uma rampa de máscara é uma
  // curva de transparência, e trocá-la por token não faria sentido — não há
  // tema que a acompanhe.
  //
  // A janela é generosa (900 caracteres) porque uma rampa de máscara se escreve
  // em muitas paradas, e a última fica longe do nome da declaração: com 400 a
  // regra pegava as quatro primeiras e marcava a quinta.
  const emMascara = (index) =>
    /mask/i.test(src.slice(Math.max(0, index - 900), index + 80))

  if (!isRuntimeColor && !isCatalog) {
    for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      if (emMascara(m.index)) continue
      // Um hex dentro de um seletor de atributo é alvo, não escolha: o
      // `[stroke='#ccc']` do ChartContainer existe justamente para sobrescrever
      // a cor que o Recharts carimba sozinho.
      const around = src.slice(Math.max(0, m.index - 40), m.index + 20)
      if (/\[[\w-]+=['"]?$/.test(src.slice(Math.max(0, m.index - 40), m.index))) continue
      if (/\[[\w-]+=['"]#[0-9a-fA-F]{3,8}['"]?\]/.test(around)) continue
      add("D", m.index, "cor literal em hex", m[0])
    }
    for (const m of src.matchAll(/\brgba?\s*\(/g)) {
      if (emMascara(m.index)) continue
      add("D", m.index, "cor literal em rgb()", m[0])
    }
  }

  // ── D3. Paleta padrão do Tailwind ─────────────────────────────────────────
  if (!isRuntimeColor && !isCatalog) {
    for (const m of src.matchAll(COLOR_UTILITY)) {
      add("D3", m.index, `\`${m[0]}\` não acompanha o tema — use um token`, m[0])
    }
    for (const m of src.matchAll(BARE_BW)) {
      add(
        "D3",
        m.index,
        `\`${m[0]}\` — use \`bg-card\`, \`bg-background\` ou \`text-foreground\``,
        m[0]
      )
    }
  }

  // ── D2. Valor arbitrário ──────────────────────────────────────────────────
  // (Calada no catálogo: `docs/camadas.tsx` escreve `z-[1]` porque documenta a
  //  escala, e `docs/typography.tsx` cita `text-[10px]` porque foi o que os dois
  //  degraus de token substituíram.)
  for (const m of isCatalog
    ? []
    : src.matchAll(
        /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|w|h|size|text|rounded|z|top|left|right|bottom|leading|tracking)-\[[^\]]+\]/g
      )) {
    // Variáveis CSS e cálculos com env() são legítimos: a área segura e a
    // largura do gatilho do Radix não têm token que os substitua. `inherit` e as
    // cores de sistema (`Canvas`, `CanvasText`) também: não são medidas nem
    // tinta do tema — o painel do `<select>` nativo segue o esquema do sistema
    // operacional, e `rounded-[inherit]` herda o raio de quem contém.
    if (/var\(|env\(|calc\(|--|\[inherit\]|\[Canvas(?:Text)?\]/.test(m[0])) continue
    add("D2", m.index, `valor arbitrário \`${m[0]}\``, m[0])
  }

  // ── F. Semântica e acessibilidade ─────────────────────────────────────────
  for (const m of src.matchAll(/<div[^>]*\bonClick=/g)) {
    add("F", m.index, "`<div onClick>` não recebe foco nem responde ao Enter", m[0])
  }
  for (const m of src.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) {
    add("F", m.index, "`<img>` sem `alt`", m[0])
  }

  // ── G. Ícone fora do Heroicons ────────────────────────────────────────────
  // Um conjunto de ícones é uma tipografia: o que o faz ler como sistema é
  // todos virem do mesmo desenho. Este projeto usa Heroicons, declarado em
  // `components.json`.
  for (const m of src.matchAll(FOREIGN_ICON_PACKAGES)) {
    add("G", m.index, `\`${m[1]}\` — o projeto usa Heroicons`, m[0])
  }

  // `<svg>` escrito à mão é o furo que nenhuma checagem de dependência pega:
  // não há import, e o glifo entrou por cópia.
  if (!isDrawnSvg) {
    for (const m of src.matchAll(/<svg\b/g)) {
      add(
        "G",
        m.index,
        "`<svg>` inline — use um ícone do Heroicons (marca e spinner são a exceção)",
        "<svg"
      )
    }
  }

  // O conjunto certo para o tamanho. Todos são Heroicons, então isto não é
  // sobre a biblioteca — é sobre pegar o desenho que aguenta aquele corpo.
  const heroiconSet = new Map()
  for (const m of src.matchAll(
    /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*["']@heroicons\/react\/(16|20|24)\/(?:solid|outline)["']/g
  )) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/).pop().trim()
      if (name) heroiconSet.set(name, m[2])
    }
  }
  // Um primitivo desenhado escolhe o glifo pela geometria, não pelo corpo: o
  // `Spinner` gira o mesmo desenho de 16 a 32px, e nenhum conjunto cobre a
  // faixa inteira. A lista já é `DRAWN_SVG_FILES`, pela mesma razão do `<svg>`.
  if (heroiconSet.size && !isDrawnSvg && !isHeroiconException) {
    for (const m of src.matchAll(/<([A-Z][A-Za-z0-9]*)\b([^>]*)>/g)) {
      const declared = heroiconSet.get(m[1])
      if (!declared) continue
      const found = m[2].match(/\bsize-(\d+(?:\.\d+)?)\b/)
      const n = found ? parseFloat(found[1]) : 4
      const want = heroiconSetForSize(n)
      if (want !== declared) {
        add(
          "G",
          m.index,
          `\`${m[1]}\` em \`size-${n}\` pede o conjunto \`${want}\`, e veio do \`${declared}\``,
          m[0]
        )
      }
    }
  }

  // ── G (indireção). Ícone passado como valor e renderizado no mesmo arquivo ─
  //
  // A régua diz que ícone passado como valor fica em `24/outline`, "já que quem
  // renderiza é que decide o corpo". A cláusula que faltava: isso vale **quando
  // quem renderiza não é quem declara**. Com a tabela e o `.map()` vizinhos de
  // arquivo, e o corpo cravado no sítio, quem declara **é** quem renderiza.
  //
  // O bloco acima só enxerga `<NomeImportado …>`. Estes três escapavam:
  //   const Chevron = isNext ? ChevronRightIcon : ChevronLeftIcon  ->  <Chevron>
  //   { slug: "cores", Icon: SwatchIcon }                          ->  <Icon>
  //   { label: "Carteiras", icon: WalletIcon }                     ->  <item.icon>
  //
  // Foi assim que as duas setas do paginador do catálogo — uma de `24/outline`,
  // a outra de `16/solid`, no mesmo `size-4` — conviveram sem ninguém ver.
  //
  // Ela **erra para menos**: se qualquer sítio indireto tiver o corpo ilegível
  // (`${…}` sem `size-`/`h-` literal), o arquivo inteiro se cala. É o que mantém
  // `docs/iconografia.tsx`, que escolhe o conjunto por px, fora do relatório.
  if (heroiconSet.size && !isDrawnSvg && !isHeroiconException) {
    const faixasDeImport = [...bruto.matchAll(
      /import\s*(?:type\s*)?\{[^}]+\}\s*from\s*["']@heroicons\/react\/(?:16|20|24)\/(?:solid|outline)["']/g
    )].map((m) => [m.index, m.index + m[0].length])
    const noImport = (i) => faixasDeImport.some(([a, b]) => i >= a && i < b)

    // 1. Quais dos ícones grandes aparecem como **valor** (sem `<` na frente).
    const comoValor = new Map()
    for (const [nome, conjunto] of heroiconSet) {
      if (conjunto === "16") continue
      for (const m of src.matchAll(new RegExp(`\\b${nome}\\b`, "g"))) {
        if (noImport(m.index)) continue
        if (src[m.index - 1] === "<" || src[m.index - 1] === "/") continue
        comoValor.set(nome, { conjunto, index: m.index })
        break
      }
    }

    if (comoValor.size) {
      // 2. Consts de string locais, para ler `className={cn(glifo, …)}`.
      const literais = new Map()
      for (const m of src.matchAll(
        /\b(?:const|let)\s+(\w+)\s*(?::[^=\n]+)?=\s*(?:cn\()?["'`]([^"'`]*)["'`]/g
      )) literais.set(m[1], m[2])

      // 3. Identificadores locais que carregam um ícone.
      const apelidos = new Set()
      for (const m of src.matchAll(
        /\b(?:const|let)\s+([A-Z]\w*)\s*(?::[^=\n]+)?=[^;]{0,200}?\b[A-Z]\w*Icon\b/g
      )) apelidos.add(m[1])
      for (const m of src.matchAll(/\b(?:const|let)\s+([A-Z]\w*)\s*=\s*\w+\.[a-zA-Z]\w*/g))
        apelidos.add(m[1])
      for (const m of src.matchAll(/\b([Ii]con)\s*:\s*[A-Z]\w*Icon\b/g)) apelidos.add(m[1])
      for (const m of src.matchAll(/\bicon\s*:\s*([A-Z]\w*)\s*[,}\n]/g)) apelidos.add(m[1])
      if (/\{[^{}]{0,120}\bIcon\b[^{}]{0,120}\}/.test(src)) apelidos.add("Icon")

      // 4. Os sítios de render indireto, e o conjunto que cada um pede.
      const pedidos = new Set()
      let opaco = false
      for (const m of src.matchAll(/<([A-Z]\w*|\w+\.[a-zA-Z]\w*)\b([^>]*?)\/?>/g)) {
        const tag = m[1]
        if (heroiconSet.has(tag)) continue
        if (!(apelidos.has(tag) || /^\w+\.(icon|Icon)$/.test(tag))) continue
        let attrs = m[2]
        for (const id of attrs.matchAll(/\b([a-z]\w*)\b/g))
          if (literais.has(id[1])) attrs += " " + literais.get(id[1])
        // `h-6 w-6` conta como corpo declarado.
        const sz = attrs.match(/\b(?:size|h)-(\d+(?:\.\d+)?)\b/)
        if (!sz && /\$\{/.test(attrs)) { opaco = true; continue }
        pedidos.add(heroiconSetForSize(sz ? parseFloat(sz[1]) : 4))
      }

      if (!opaco && pedidos.size === 1) {
        const quer = [...pedidos][0]
        for (const [nome, v] of comoValor) {
          if (v.conjunto === quer) continue
          add(
            "G",
            v.index,
            `\`${nome}\` vem do conjunto \`${v.conjunto}\` e é renderizado neste mesmo arquivo pedindo \`${quer}\``,
            nome
          )
        }
      }
    }
  }

  // ── J. Faixa de superfície desenhada à mão ────────────────────────────────
  //
  // Uma tira de topo ou de pé — a barra de um cartão, o cabeçalho de um popover,
  // o rodapé de um diálogo — **não desenha fio nem tinta**. O que a separa do
  // corpo é o respiro que ela traz e, onde há rolagem, o conteúdo dissolvendo
  // por baixo dela. Uma tira pintada é uma superfície diferente do corpo, e o
  // fio em cima dela é o segundo sinal para a mesma emenda.
  //
  // A regra existe porque a lição já foi aprendida caro: quando o `border-t`
  // saiu do `DialogFooter`, o app **não perdeu o fio** — 24 chamadas o
  // repunham à mão, e a mudança do componente não chegou à tela. Sem um guarda,
  // as 50 faixas que esta rodada migrou voltam pelo mesmo caminho.
  //
  // O que ela **não** acusa: separador de itens repetidos (`TableRow`,
  // `AccordionItem`), que é o que torna uma lista varrível; moldura (`border`
  // completo, com ou sem `rounded-`); e `PageHeader`/`H2`/`TableHeader`, que
  // ficaram fora do escopo por decisão.
  for (const m of src.matchAll(/className=\{?["'`]([^"'`]{0,2000})["'`]/g)) {
    const classes = m[1]
    const temFio = /(?:^|\s)border-[bt](?:\s|$)/.test(classes)
    const temTinta = /(?:^|\s)(?:dark:)?bg-muted\/\d+(?:\s|$)/.test(classes)
    const eMoldura = /(?:^|\s)(?:border|rounded-)/.test(
      classes.replace(/border-[bt]\b/g, "").replace(/border-(?:border|input)\S*/g, "")
    )
    if (temFio && temTinta && !eMoldura && !isSecondSurface) {
      add(
        "J",
        m.index,
        "faixa desenhada à mão — fio + tinta numa tira é `CardToolbar`, `CardNote`, `PopoverHeader` ou `DialogFooter`",
        classes.slice(0, 70)
      )
    }
  }

  // ── H. hover: sem par de toque (regra própria deste projeto) ──────────────
  // `hover:` compila para @media (hover: hover), e um telefone responde
  // `hover: none`. A resposta não é remover o hover: é somar `active:`.
  // Ver src/lib/tailwind-hover-policy.test.ts.
  //
  // Calada no catálogo: `docs/mobile-toque.tsx` mostra o exemplo **errado de
  // propósito**, com a versão certa na linha seguinte — é a página que ensina
  // esta regra.
  for (const m of isCatalog
    ? []
    : src.matchAll(/className=\{?["'`]([^"'`]{0,2000})["'`]/g)) {
    const classes = m[1]
    const hasHover = /(?:^|\s)(?:group-)?hover:(?:bg|text|border|ring)-/.test(classes)
    const hasActive = /(?:^|\s)(?:group-)?active:/.test(classes)
    if (hasHover && !hasActive) {
      add(
        "H",
        m.index,
        "`hover:` sem `active:` — no toque essa resposta não existe",
        classes.slice(0, 70)
      )
    }
  }

  // ── I. Formatação de dinheiro ou data fora dos helpers ────────────────────
  // (Calada no catálogo: `docs/dinheiro.tsx` e `docs/money-display.tsx`
  //  documentam justamente a formatação.)
  for (const m of isCatalog
    ? []
    : src.matchAll(/\bIntl\.(?:NumberFormat|DateTimeFormat)\b/g)) {
    add(
      "I",
      m.index,
      "use `@/lib/formatters` ou `@/lib/transaction-date`",
      m[0]
    )
  }
  for (const m of isCatalog
    ? []
    : src.matchAll(/\.toLocaleDateString\s*\(|\.toLocaleString\s*\(/g)) {
    add("I", m.index, "use `@/lib/transaction-date` ou `@/lib/formatters`", m[0])
  }

  return findings
}

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

const RULE_LABEL = {
  A: "componente nascendo dentro de src/app/",
  A2: "cva() fora de components/ui/",
  C: "primitivo cru com equivalente no design system",
  "C'": "primitivo cru sem equivalente (lacuna)",
  D: "cor literal",
  D2: "valor arbitrário",
  D3: "paleta padrão do Tailwind",
  F: "semântica / acessibilidade",
  G: "ícone fora do Heroicons",
  H: "hover: sem par de toque",
  I: "formatação fora dos helpers",
  J: "faixa de superfície desenhada à mão",
}

function render(findings) {
  if (!findings.length) {
    console.log("Nenhum achado. A tela está conforme.")
    return
  }

  const porRegra = {}
  for (const f of findings) (porRegra[f.rule] ??= []).push(f)

  const porArquivo = {}
  for (const f of findings) (porArquivo[f.file] ??= []).push(f)

  console.log(
    `${findings.length} achados em ${Object.keys(porArquivo).length} arquivos\n`
  )

  console.log("## Por regra\n")
  for (const rule of Object.keys(RULE_LABEL)) {
    const list = porRegra[rule]
    if (!list) continue
    console.log(`- **${rule}** (${list.length}) — ${RULE_LABEL[rule]}`)
  }
  console.log("")

  console.log("## Por arquivo\n")
  const ordenado = Object.entries(porArquivo).sort((a, b) => b[1].length - a[1].length)
  for (const [file, list] of ordenado) {
    console.log(`### ${file} — ${list.length}\n`)
    for (const f of list.slice(0, 20)) {
      console.log(`- \`${f.file}:${f.line}\` **${f.rule}** ${f.message}`)
    }
    if (list.length > 20) console.log(`- … e mais ${list.length - 20}`)
    console.log("")
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const asJson = args.includes("--json")
  const ruleIdx = args.indexOf("--rule")
  const onlyRule = ruleIdx !== -1 ? args[ruleIdx + 1] : null
  const targets = args.filter((a, i) => {
    if (a.startsWith("--")) return false
    if (ruleIdx !== -1 && i === ruleIdx + 1) return false
    return true
  })

  const here = dirname(fileURLToPath(import.meta.url))
  const project = existsSync(join(process.cwd(), "src/components/ui"))
    ? process.cwd()
    : resolve(here, "../../../..")

  const roots = targets.length
    ? targets.map((t) => resolve(project, t))
    : [join(project, "src/app"), join(project, "src/components")]

  const files = []
  for (const root of roots) {
    if (!existsSync(root)) {
      console.error(`Não existe: ${root}`)
      process.exit(1)
    }
    walk(root, files)
  }

  let findings = files.flatMap((f) => auditFile(f, project))
  if (onlyRule) findings = findings.filter((f) => f.rule === onlyRule)

  if (asJson) console.log(JSON.stringify(findings, null, 2))
  else render(findings)
}

main()
