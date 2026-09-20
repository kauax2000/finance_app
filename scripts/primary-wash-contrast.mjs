// Mede o contraste do rótulo do `Button variant="primary"` sobre a lava.
// Precisa do dev server em :3000.
//
//   node scripts/primary-wash-contrast.mjs
//
// A rodada 98 pôs o arco-íris da marca atrás do primário no cursor — atrás de
// um vidro da cor do botão, fino no ponteiro (`--button-glass-min`) e grosso na
// borda (`--button-glass-max`). O pior caso para o rótulo é o cursor **em cima
// dele**, com um blob saturado passando por baixo: é o que esta grade varre.
//
// O método é o dos outros três scripts: clona o botão real, força
// `--button-wash: 1`, fixa a órbita numa fase (`--button-lava`) e a posição do
// ponteiro, esconde o texto e amostra o **pior pixel** na caixa do rótulo,
// comparando com `--primary-foreground` rasterizada por canvas (o navegador
// devolve `oklch()`, e parsear aqueles números como RGB marca 1,0 em tudo).
//
// Grade, por tema: 8 fases da órbita × 5 posições do ponteiro na ordem padrão
// da pilha, mais as 8 **rotações** da pilha × 8 fases com o ponteiro no centro
// do rótulo — o `Button` gira a ordem das cores a cada entrada do cursor, e a
// camada de cima é a que lê sob o ponteiro. 104 células por tema, 208 no total.
// **Piso 4,5** — é texto. Quem mexer em `--button-glass-min`, nos blobs ou nas
// paradas da marca remede aqui; se reprovar, o botão de calibração é o
// `--button-glass-min`, para cima.
import { chromium } from "playwright"

const PISO = 4.5
const FASES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]
// Em fração da caixa: o centro do rótulo e as quatro pontas do texto.
const ORDEM = ["teal", "coral", "indigo", "amber", "magenta", "green", "violet", "blue"]
const PONTEIROS = {
    centro: [0.5, 0.5],
    "esq. cima": [0.3, 0.2],
    "dir. cima": [0.7, 0.2],
    "esq. baixo": [0.3, 0.8],
    "dir. baixo": [0.7, 0.8],
}

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
    await page.goto("http://localhost:3000/designsystem/button", {
        waitUntil: "domcontentloaded",
    })
    await page.waitForSelector("button[data-variant=primary]")
    await page.addStyleTag({ content: "nextjs-portal{display:none}" })
    await page.waitForTimeout(600)

    const tinta = await page.evaluate(
        ({ fases, ponteiros, ordem }) => {
            const modelo = [...document.querySelectorAll("button[data-variant=primary]")]
                .find((b) => !b.disabled && b.offsetWidth >= 200)
            const palco = document.createElement("div")
            palco.id = "palco"
            palco.style.cssText =
                "position:absolute;left:0;top:0;z-index:99999;display:flex;flex-wrap:wrap;gap:16px;padding:16px;background:var(--background);width:1280px"
            const caixa = modelo.getBoundingClientRect()
            // (rotação, fase, ponteiro): rotação 0 nas cinco posições; as
            // outras sete rotações só no centro, que é o pior caso.
            const celulas = []
            for (const fase of fases) {
                for (const nome of Object.keys(ponteiros)) celulas.push([0, fase, nome])
                for (let r = 1; r < ordem.length; r++) celulas.push([r, fase, "centro"])
            }
            for (const [r, fase, nome] of celulas) {
                {
                    const [fx, fy] = ponteiros[nome]
                    const no = modelo.cloneNode(true)
                    no.dataset.probe = `${r}-${fase}-${nome}`
                    ordem.forEach((_, k) =>
                        no.style.setProperty(`--button-blob-${k + 1}`, `var(--brand-${ordem[(k + r) % ordem.length]})`)
                    )
                    no.style.animation = "none"
                    no.style.transition = "none"
                    no.style.setProperty("--button-wash", "1")
                    no.style.setProperty("--button-lava", String(fase))
                    no.style.setProperty("--button-mx", `${(fx * caixa.width).toFixed(1)}px`)
                    no.style.setProperty("--button-my", `${(fy * caixa.height).toFixed(1)}px`)
                    // O texto sai para o pixel de baixo dele ser mensurável.
                    no.style.color = "transparent"
                    palco.appendChild(no)
                }
            }
            document.body.appendChild(palco)
            const c = document.createElement("canvas")
            c.width = c.height = 1
            const g = c.getContext("2d")
            g.fillStyle = getComputedStyle(modelo).color
            g.fillRect(0, 0, 1, 1)
            return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3)
        },
        { fases: FASES, ponteiros: PONTEIROS, ordem: ORDEM }
    )
    await page.waitForTimeout(400)

    const celulas = []
    for (const fase of FASES) {
        for (const nome of Object.keys(PONTEIROS)) celulas.push([0, fase, nome])
        for (let r = 1; r < ORDEM.length; r++) celulas.push([r, fase, "centro"])
    }
    for (const [r, fase, nome] of celulas) {
        {
            const png = await page.locator(`[data-probe="${r}-${fase}-${nome}"]`).screenshot()
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
                    // A caixa do rótulo: a faixa central onde o texto pousa.
                    const x0 = Math.floor(c.width * 0.3)
                    const x1 = Math.ceil(c.width * 0.7)
                    const y0 = Math.floor(c.height * 0.25)
                    const y1 = Math.ceil(c.height * 0.75)
                    const d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data
                    const lum = ([r, gg, b]) => {
                        const f = (u) => {
                            const c = u / 255
                            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
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
                [png.toString("base64"), tinta]
            )
            if (razao < PISO) reprovou = true
            linhas.push({ tema, rotacao: r, fase, ponteiro: nome, razao, ok: razao >= PISO ? "sim" : "NÃO" })
        }
    }
    await ctx.close()
}

await browser.close()
console.table(linhas)
const piorDe = (ls) => ls.reduce((a, b) => (a.razao <= b.razao ? a : b))
for (const tema of ["light", "dark"]) {
    const p = piorDe(linhas.filter((l) => l.tema === tema))
    console.log(`${tema.padEnd(5)} pior: ${p.razao.toFixed(2)}:1   (rotação ${p.rotacao}, fase ${p.fase}, ${p.ponteiro})`)
}
const pior = piorDe(linhas)
console.log(`\n${linhas.length} células   pior caso: ${pior.razao.toFixed(2)}:1   piso: ${PISO}:1`)
if (reprovou) {
    console.error("\nReprovou: o rótulo caiu abaixo de 4,5 sobre a lava. Suba --button-glass-min.")
    process.exit(1)
}
