// Mede as seis cores das formas de pagamento (`--payment-*`) contra o cartão.
// Precisa do dev server em :3000.
//
//   node scripts/payment-contrast.mjs
//
// As cores são marca não textual (a barra, o ponto e o ladrilho do "Como foi
// pago"), então o piso é o da WCAG 1.4.11: 3:1 contra `--card`, nos dois temas.
// E as seis precisam se distinguir entre si: a distância de cada par em OKLab
// (ΔE ×100) não pode cair abaixo de DISTANCIA_MINIMA.
//
// O método é o de `tone-contrast.mjs`: um bloco chapado por token, a cor lida
// por canvas de 1×1 (o `getComputedStyle` devolve `oklch(...)`).
import { abrirNavegador, abrirPagina, concluir, contraste, linha, lum, TEMAS } from "./lib/contrast.mjs"

const PISO = 3
const DISTANCIA_MINIMA = 10
const FORMAS = ["pix", "credit", "debit", "cash", "ted", "other"]

// sRGB 0–255 para OKLab (Björn Ottosson), ×100 na distância.
const oklab = ([r, g, b]) => {
    const lin = (u) => {
        const c = u / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const [R, G, B] = [lin(r), lin(g), lin(b)]
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ]
}
const deltaE = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i])) * 100

const browser = await abrirNavegador()
const linhas = []
const pares = []

for (const tema of TEMAS) {
    const { ctx, page } = await abrirPagina(browser, tema, "/designsystem/colors", {
        viewport: { width: 900, height: 700 },
        seletor: "body",
        espera: 500,
    })
    const cores = await page.evaluate(({ formas, escuro }) => {
        // O tema pedido pelo `localStorage` pode chegar depois da hidratação: a classe é posta aqui.
        document.documentElement.classList.toggle("dark", escuro)
        const c = document.createElement("canvas")
        c.width = c.height = 1
        const g = c.getContext("2d")
        const ler = (token) => {
            const d = document.createElement("div")
            d.style.cssText = `background:var(${token})`
            document.body.appendChild(d)
            g.clearRect(0, 0, 1, 1)
            g.fillStyle = getComputedStyle(d).backgroundColor
            g.fillRect(0, 0, 1, 1)
            d.remove()
            const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data
            // Token ausente pinta transparente: devolve null, e a linha reprova.
            return a === 255 ? [r, gg, b] : null
        }
        return { card: ler("--card"), ...Object.fromEntries(formas.map((f) => [f, ler(`--payment-${f}`)])) }
    }, { formas: FORMAS, escuro: tema === "dark" })

    for (const f of FORMAS) {
        const razao = cores[f] ? +contraste(lum(cores.card), lum(cores[f])).toFixed(2) : 0
        linhas.push(linha({ tema, forma: f, uso: "contra --card" }, razao, PISO))
    }
    for (let i = 0; i < FORMAS.length; i++)
        for (let j = i + 1; j < FORMAS.length; j++) {
            const [a, b] = [cores[FORMAS[i]], cores[FORMAS[j]]]
            pares.push({ tema, par: `${FORMAS[i]} × ${FORMAS[j]}`, deltaE: a && b ? +deltaE(a, b).toFixed(1) : 0 })
        }
    await ctx.close()
}

await browser.close()
console.table(pares)
const piorPar = pares.reduce((a, b) => (a.deltaE <= b.deltaE ? a : b))
console.log(`par mais próximo: ${piorPar.par} (${piorPar.tema}) ΔE ${piorPar.deltaE}   mínimo: ${DISTANCIA_MINIMA}\n`)
if (piorPar.deltaE < DISTANCIA_MINIMA) {
    console.error("Reprovou: duas formas de pagamento ficaram parecidas demais.")
    process.exitCode = 1
}
concluir(linhas, PISO, "alguma forma de pagamento ficou abaixo de 3:1 contra o cartão.")
