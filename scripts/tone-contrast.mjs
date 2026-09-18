// Mede o contraste dos pares tonais `-muted` / `-muted-foreground`.
// Precisa do dev server em :3000.
//
//   node scripts/tone-contrast.mjs
//
// Por que ele existe: na rodada 89 as seis superfícies `-muted` subiram de
// croma (0,03–0,04 para 0,06–0,07 no estado; 0,055–0,07 para 0,105–0,11 no
// dinheiro), a pedido do dono, que leu a paleta como apagada. Subir a
// superfície aproxima ela da tinta, e é exatamente o eixo em que o contraste
// se perde. Quem mexer numa dessas rampas remede aqui.
//
// **Dois consumidores, e o segundo é o difícil.** O `Badge` põe a tinta cheia
// sobre a superfície. O `Alert` põe a **mesma tinta a 85%** (`text-current/85`,
// em `alert.tsx:173`), que é uma composição — e ele é o pior caso do sistema,
// porque carrega parágrafo e não duas palavras.
//
// O método: um retângulo sólido por medição, e o pixel do centro dele. Não há
// antisserrilhado num bloco chapado, então o valor lido é a cor composta
// exata — enquanto amostrar a letra leria os pixels de borda, que são a mistura
// dos dois e **superestimariam** o contraste. As cores saem por canvas de 1×1:
// `getComputedStyle` devolve `oklch(...)`, e parsear aqueles números como RGB
// foi o que fez toda razão marcar 1,0 na primeira versão da página de cores.
//
// O piso é 4,5:1 (WCAG AA).
import { chromium } from "playwright"

const PISO = 4.5
const TONS = ["success", "warning", "info", "destructive", "income", "expense"]

// ds-kit.tsx:812-827, verbatim.
const lum = ([r, g, b]) => {
    const f = (u) => {
        const c = u / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contraste = (a, b) => {
    const [hi, lo] = a > b ? [a, b] : [b, a]
    return (hi + 0.05) / (lo + 0.05)
}

const browser = await chromium.launch()
const linhas = []
let reprovou = false

for (const tema of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } })
    await ctx.addInitScript((t) => localStorage.setItem("theme", t), tema)
    const page = await ctx.newPage()
    await page.goto("http://localhost:3000/designsystem/badge", {
        waitUntil: "domcontentloaded",
    })
    await page.waitForSelector("[data-slot=badge]")
    await page.waitForTimeout(500)

    const medidas = await page.evaluate(({ tons }) => {
        const palco = document.createElement("div")
        palco.style.cssText = "position:fixed;left:0;top:0;z-index:99999"
        // Por tom, três blocos chapados: a superfície, a tinta cheia sobre ela
        // e a tinta a 85% sobre ela. O 85% precisa do navegador para compor.
        for (const t of tons) {
            for (const [papel, css] of [
                ["surface", `background:var(--${t}-muted)`],
                ["ink", `background:var(--${t}-muted-foreground)`],
                [
                    "ink85",
                    `background:var(--${t}-muted);color:var(--${t}-muted-foreground)`,
                ],
            ]) {
                const d = document.createElement("div")
                d.dataset.probe = `${t}-${papel}`
                d.style.cssText = `width:40px;height:40px;${css}`
                if (papel === "ink85") {
                    const v = document.createElement("div")
                    // `text-current/85` é a tinta com alfa; um bloco com a
                    // mesma cor e o mesmo alfa compõe igual.
                    v.style.cssText =
                        "width:100%;height:100%;background:currentColor;opacity:0.85"
                    d.appendChild(v)
                }
                palco.appendChild(d)
            }
        }
        document.body.appendChild(palco)

        const c = document.createElement("canvas")
        c.width = c.height = 1
        const g = c.getContext("2d")
        const ler = (el) => {
            g.fillStyle = getComputedStyle(el).backgroundColor
            g.fillRect(0, 0, 1, 1)
            const [r, gg, b] = g.getImageData(0, 0, 1, 1).data
            return [r, gg, b]
        }
        const out = {}
        for (const t of tons) {
            out[t] = {
                surface: ler(palco.querySelector(`[data-probe="${t}-surface"]`)),
                ink: ler(palco.querySelector(`[data-probe="${t}-ink"]`)),
            }
        }
        palco.remove()
        return out
    }, { tons: TONS })

    // A composição do 85% é aritmética simples em sRGB, e o navegador já nos
    // deu os dois extremos: tinta sobre superfície, alfa 0,85.
    for (const t of TONS) {
        const { surface, ink } = medidas[t]
        const ink85 = ink.map((v, i) => v * 0.85 + surface[i] * 0.15)
        const lSurf = lum(surface)
        for (const [papel, cor] of [
            ["Badge (tinta cheia)", ink],
            ["Alert (tinta a 85%)", ink85],
        ]) {
            const razao = +contraste(lSurf, lum(cor)).toFixed(2)
            if (razao < PISO) reprovou = true
            linhas.push({
                tema,
                tom: t,
                uso: papel,
                razao,
                ok: razao >= PISO ? "sim" : "NÃO",
            })
        }
    }
    await ctx.close()
}

await browser.close()
console.table(linhas)
const pior = Math.min(...linhas.map((l) => l.razao))
console.log(`\npior caso: ${pior.toFixed(2)}:1   piso: ${PISO}:1`)
if (reprovou) {
    console.error("\nReprovou: algum par ficou abaixo do piso AA.")
    process.exit(1)
}
