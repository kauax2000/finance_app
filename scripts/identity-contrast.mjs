// Mede o contraste das iniciais sobre a cor de identidade do `Avatar`.
// Precisa do dev server em :3000.
//
//   node scripts/identity-contrast.mjs
//
// Por que um script e não uma asserção de CSS: hoje a superfície é uma cor
// chapada e a conta caberia numa fórmula, mas ela já foi um degradê de três
// paradas com um ponto de luz por cima e, antes disso, com grão em blend mode.
// Amostrar pixel responde direto e continua respondendo se alguma dessas
// camadas voltar — uma fórmula teria de ser reescrita a cada vez.
//
// O método: clona um avatar real para cada família × tamanho, esconde o texto,
// captura o elemento e pega o **pixel mais escuro** da caixa onde as letras
// pousam (25–75% na horizontal, 35–65% na vertical — generosa de propósito,
// ela inclui as folgas em volta das letras). Um estado só por célula, porque o
// avatar não responde ao cursor; se o movimento voltar, meça os dois. A tinta
// vem de
// `getComputedStyle().color` passada por um canvas de 1×1: o navegador devolve
// `oklch(...)`, e parsear aqueles números como RGB foi o que fez toda razão
// marcar 1,0 na primeira versão da página de cores.
//
// O piso é 4,5:1 (WCAG AA). Quem mexer numa rampa remede aqui.
import { chromium } from "playwright"

const PISO = 4.5
const FAMILIAS = ["ember", "gold", "grove", "ocean", "iris", "bloom"]
const TAMANHOS = { 24: "size-6", 40: "size-10", 56: "size-14" }

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
    await page.goto("http://localhost:3000/designsystem/avatar", {
        waitUntil: "domcontentloaded",
    })
    await page.waitForSelector("[data-slot=avatar-fallback]")
    await page.addStyleTag({ content: "nextjs-portal{display:none}" })
    await page.waitForTimeout(600)

    // Uma grade de clones do componente real: trocar a classe da superfície e a
    // do tamanho é o que o `identityToneFor` e o prop `size` fazem em produção.
    const tinta = await page.evaluate(
        ({ tamanhos }) => {
            const modelo = document.querySelector("[data-slot=avatar]")
            const palco = document.createElement("div")
            palco.id = "palco"
            palco.style.cssText =
                "position:fixed;left:0;top:0;z-index:99999;display:flex;flex-wrap:wrap;gap:24px;padding:24px;background:var(--background)"
            for (let n = 1; n <= 6; n++) {
                for (const [px, cls] of Object.entries(tamanhos)) {
                    const no = modelo.cloneNode(true)
                    no.className = no.className.replace(/\bsize-\d+\b/, cls)
                    no.dataset.probe = `${n}-${px}`
                    const fb = no.querySelector("[data-slot=avatar-fallback]")
                    fb.className = fb.className.replace(
                        /\bbg-identity-\d\b/,
                        `bg-identity-${n}`
                    )
                    // O texto sai para o pixel de baixo dele ser mensurável.
                    fb.style.color = "transparent"
                    palco.appendChild(no)
                }
            }
            document.body.appendChild(palco)

            // A tinta, por canvas: `getComputedStyle` devolve oklch().
            const c = document.createElement("canvas")
            c.width = c.height = 1
            const g = c.getContext("2d")
            g.fillStyle = getComputedStyle(
                document.querySelector("[data-slot=avatar-fallback]")
            ).color
            g.fillRect(0, 0, 1, 1)
            const [r, gg, b] = g.getImageData(0, 0, 1, 1).data
            return [r, gg, b]
        },
        { tamanhos: TAMANHOS }
    )
    await page.waitForTimeout(400)

    for (let n = 1; n <= 6; n++) {
        for (const px of Object.keys(TAMANHOS)) {
            const el = page.locator(`[data-probe="${n}-${px}"]`)
            const medir = async () => {
                const png = await el.screenshot()
                return page.evaluate(
                    async ([b64, fg]) => {
                        const img = new Image()
                        img.src = "data:image/png;base64," + b64
                        await img.decode()
                        const c = document.createElement("canvas")
                        c.width = img.width
                        c.height = img.height
                        const g = c.getContext("2d")
                        g.drawImage(img, 0, 0)
                        const x0 = Math.floor(c.width * 0.25)
                        const x1 = Math.ceil(c.width * 0.75)
                        const y0 = Math.floor(c.height * 0.35)
                        const y1 = Math.ceil(c.height * 0.65)
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
                    [png.toString("base64"), tinta]
                )
            }
            const razao = await medir()
            if (razao < PISO) reprovou = true
            linhas.push({
                tema,
                familia: FAMILIAS[n - 1],
                px: +px,
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
    console.error("\nReprovou: alguma célula ficou abaixo do piso AA.")
    process.exit(1)
}
