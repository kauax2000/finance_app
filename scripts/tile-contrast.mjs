// Mede o contraste do ícone contra a superfície chapada do `ColorTile`.
// Precisa do dev server em :3000.
//
//   node scripts/tile-contrast.mjs
//
// Por que um script e não uma asserção de CSS: a cor não é do sistema, é um
// hexadecimal que a pessoa gravou no banco, e a superfície o normaliza com
// `oklch(from var(--tile-color) 0.86 min(c, 0.12) h)`. A conta fecha no papel
// para uma cor; o que esta grade responde é se ela fecha para as doze que o
// produto alcança, nos dois temas e nos quatro degraus — inclusive o branco e o
// preto, que o seletor livre da carteira ainda permite.
//
// O método é o de `identity-contrast.mjs`: clona um ladrilho real para cada
// célula, **esconde o glifo** (para todo pixel da caixa central ser superfície),
// captura e pega o pior par. A tinta sai de `getComputedStyle().color` do
// próprio filho, passada por um canvas de 1×1 — o navegador devolve `oklch(…)`,
// e parsear aqueles números como RGB foi o que fez toda razão marcar 1,0 na
// primeira versão da página de cores.
//
// **O piso é 4,5, e não os 3:1 da WCAG 1.4.11.** O ícone é gráfico e bastariam
// 3, mas esta peça é a construção do `AvatarFallback` e mede pela régua dele —
// que é a de texto, porque lá o conteúdo são iniciais. Medir a mais custa nada
// e mantém as duas comparáveis.
//
// Quem mexer na claridade de 0,86, no teto de croma de 0,12 ou na tinta remede
// aqui.
import { chromium } from "playwright"

const PISO = 4.5

// As oito cores de `src/lib/tile-palette.ts` — os matizes da marca na banda da
// identidade, e a paleta de categoria **e** de carteira desde a rodada 96 —,
// os três extremos que o seletor livre da carteira permite, e o caso sem cor.
//
// Os presets legados não entram: `tileColorFor` os dobra numa destas oito antes
// de o ladrilho ver a cor. Quem entra são os extremos, que **não** são dobrados
// — o seletor livre continua de pé, e é ele que ainda alcança um branco puro.
const CORES = [
    { nome: "teal", valor: "#5DE9E9" },
    { nome: "azul", valor: "#6EE2FF" },
    { nome: "indigo", valor: "#A6D1FF" },
    { nome: "violeta", valor: "#D0C4FF" },
    { nome: "magenta", valor: "#FFB3F0" },
    { nome: "coral", valor: "#FFB49B" },
    { nome: "ambar", valor: "#F5CB70" },
    { nome: "lima", valor: "#B7E18C" },
    { nome: "amarelo puro", valor: "#FFFF00" },
    { nome: "branco", valor: "#FFFFFF" },
    { nome: "quase preto", valor: "#111827" },
    { nome: "sem cor", valor: "var(--muted-foreground)" },
]

const TAMANHOS = { md: "size-8", lg: "size-9", xl: "size-10", "2xl": "size-11" }

const browser = await chromium.launch()
const linhas = []
let reprovou = false

for (const tema of ["light", "dark"]) {
    const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
    })
    await ctx.addInitScript((t) => localStorage.setItem("theme", t), tema)
    const page = await ctx.newPage()
    await page.goto("http://localhost:3000/designsystem/color-tile", {
        waitUntil: "domcontentloaded",
    })
    await page.waitForSelector("[data-slot=color-tile] svg")
    await page.addStyleTag({ content: "nextjs-portal{display:none}" })
    await page.waitForTimeout(600)

    // Uma grade de clones do componente real: trocar a `--tile-color` e a
    // classe do tamanho é exatamente o que o prop `color` e o prop `size`
    // fazem em produção.
    const tintas = await page.evaluate(
        ({ cores, tamanhos }) => {
            const modelo = document
                .querySelector("[data-slot=color-tile] svg")
                .closest("[data-slot=color-tile]")
            const palco = document.createElement("div")
            palco.id = "palco"
            palco.style.cssText =
                "position:fixed;left:0;top:0;z-index:99999;display:flex;flex-wrap:wrap;gap:16px;padding:16px;background:var(--background)"
            for (let i = 0; i < cores.length; i++) {
                for (const [nome, cls] of Object.entries(tamanhos)) {
                    const no = modelo.cloneNode(true)
                    no.className = no.className.replace(/\bsize-\d+\b/, cls)
                    no.style.setProperty("--tile-color", cores[i].valor)
                    no.dataset.probe = `${i}-${nome}`
                    palco.appendChild(no)
                }
            }
            document.body.appendChild(palco)

            // A tinta de cada célula, por canvas — `getComputedStyle` devolve
            // `oklch()`, e ele muda com a cor **e** com o tema.
            const c = document.createElement("canvas")
            c.width = c.height = 1
            const g = c.getContext("2d")
            const fora = {}
            for (const no of palco.children) {
                const glifo = no.firstElementChild
                g.clearRect(0, 0, 1, 1)
                g.fillStyle = getComputedStyle(glifo).color
                g.fillRect(0, 0, 1, 1)
                const [r, gg, b] = g.getImageData(0, 0, 1, 1).data
                fora[no.dataset.probe] = [r, gg, b]
                // O glifo sai para o pixel de baixo dele ser mensurável.
                glifo.style.visibility = "hidden"
            }
            return fora
        },
        { cores: CORES, tamanhos: TAMANHOS }
    )
    await page.waitForTimeout(400)

    for (let i = 0; i < CORES.length; i++) {
        for (const nome of Object.keys(TAMANHOS)) {
            const probe = `${i}-${nome}`
            const png = await page.locator(`[data-probe="${probe}"]`).screenshot()
            const razao = await page.evaluate(
                async ([b64, fg]) => {
                    const img = new Image()
                    img.src = "data:image/png;base64," + b64
                    await img.decode()
                    const c = document.createElement("canvas")
                    c.width = img.width
                    c.height = img.height
                    const g = c.getContext("2d")
                    g.drawImage(img, 0, 0)
                    // A caixa onde o glifo pousa, generosa de propósito: ela
                    // inclui a folga em volta dele e exclui o fio da aresta.
                    const x0 = Math.floor(c.width * 0.25)
                    const x1 = Math.ceil(c.width * 0.75)
                    const y0 = Math.floor(c.height * 0.25)
                    const y1 = Math.ceil(c.height * 0.75)
                    const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data

                    // ds-kit.tsx:812-827, verbatim.
                    const lum = ([r, gg, b]) => {
                        const f = (u) => {
                            const c = u / 255
                            return c <= 0.04045
                                ? c / 12.92
                                : ((c + 0.055) / 1.055) ** 2.4
                        }
                        return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b)
                    }
                    const razao = (a, b) => {
                        const [hi, lo] = a > b ? [a, b] : [b, a]
                        return (hi + 0.05) / (lo + 0.05)
                    }
                    const lFg = lum(fg)
                    let pior = Infinity
                    for (let k = 0; k < d.length; k += 4) {
                        if (d[k + 3] < 200) continue
                        const r = razao(lFg, lum([d[k], d[k + 1], d[k + 2]]))
                        if (r < pior) pior = r
                    }
                    return +pior.toFixed(2)
                },
                [png.toString("base64"), tintas[probe]]
            )
            if (razao < PISO) reprovou = true
            linhas.push({
                tema,
                cor: CORES[i].nome,
                degrau: nome,
                razao,
                ok: razao >= PISO ? "sim" : "NÃO",
            })
        }
    }
    await ctx.close()
}

await browser.close()
console.table(linhas)
const piorDe = (ls) => ls.reduce((a, b) => (a.razao <= b.razao ? a : b))
const pior = piorDe(linhas)
// Por tema, porque é assim que a régua se lê: as duas receitas são diferentes
// (véu de 12% contra 18%, tinta de 0,42 contra 0,78) e uma delas pode afundar
// sozinha.
for (const tema of ["light", "dark"]) {
    const p = piorDe(linhas.filter((l) => l.tema === tema))
    console.log(`${tema.padEnd(5)} pior: ${p.razao.toFixed(2)}:1   (${p.cor}, ${p.degrau})`)
}
console.log(
    `\n${linhas.length} células   pior caso: ${pior.razao.toFixed(2)}:1 ` +
        `(${pior.cor}, ${pior.degrau}, ${pior.tema})   piso: ${PISO}:1`
)
if (reprovou) {
    console.error("\nReprovou: alguma célula ficou abaixo do piso da WCAG 1.4.11.")
    process.exit(1)
}
