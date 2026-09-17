// Mede a amplitude do grão do campo de marca — o método que o comentário de
// `--brand-grain` em globals.css cita. Precisa do dev server em :3000.
//
//   node scripts/brand-grain-ab.mjs
//
// Para cada tema e cada variante, captura /login a 1440×900, recorta um retalho
// sem texto do campo (à direita do wordmark, acima da pilha de cartões) e
// devolve o desvio-padrão da **diferença entre pixels vizinhos** da luminância
// Rec. 709 (0,2126R + 0,7152G + 0,0722B). A diferença, e não a luminância
// crua: o degradê varia ~15 unidades ao longo do retalho e afogava o grão —
// as quatro variantes mediam 15,26 iguais. Vizinho menos vizinho cancela o
// que é suave e sobra o que é textura. σ sem método não compara: quem mudar o
// grão remede os dois lados aqui.
import { chromium } from "playwright"

const grain = (slope, alpha, freq = 0.75) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='${slope}' intercept='0'/%3E%3CfeFuncG type='linear' slope='${slope}' intercept='0'/%3E%3CfeFuncB type='linear' slope='${slope}' intercept='0'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='${alpha}'/%3E%3C/svg%3E")`

// `atual` não injeta nada: mede o token como está no globals.css.
const VARIANTES = {
  "sem grão": "none",
  atual: null,
  "alfa 1": grain(1, 1),
  "slope 0.6 (campo verde)": grain(0.6, 0.85),
}

const browser = await chromium.launch()
const out = {}
for (const theme of ["light", "dark"]) {
  for (const [nome, css] of Object.entries(VARIANTES)) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme)
    const page = await ctx.newPage()
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" })
    await page.addStyleTag({ content: "nextjs-portal{display:none}" })
    if (css) await page.addStyleTag({ content: `aside{--brand-grain:${css} !important}` })
    // A animação move o degradê; parada, o σ mede só o grão.
    await page.addStyleTag({ content: "*{animation:none !important}" })
    await page.waitForTimeout(300)
    const box = await page.locator("aside").boundingBox()
    const bg = await page.locator("aside").evaluate((el) => getComputedStyle(el).backgroundImage)
    if (css === "none" && !bg.includes("none")) throw new Error("override não aplicado: " + bg.slice(-60))
    if (process.env.CROP) await page.screenshot({ path: `${process.env.CROP}/${theme}-${nome.replace(/[^a-z0-9]+/gi, "-")}.png`, clip: { x: box.x + 300, y: box.y + 40, width: 220, height: 140 } })
    const png = await page.screenshot({ clip: { x: box.x + 300, y: box.y + 40, width: 220, height: 140 } })
    const sigma = await page.evaluate(async (b64) => {
      const img = new Image()
      img.src = "data:image/png;base64," + b64
      await img.decode()
      const c = document.createElement("canvas")
      c.width = img.width; c.height = img.height
      const g = c.getContext("2d"); g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, c.width, c.height).data
      const L = []
      for (let i = 0; i < d.length; i += 4) L.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])
      const D = []
      for (let y = 0; y < c.height; y++)
        for (let x = 1; x < c.width; x++) D.push(L[y * c.width + x] - L[y * c.width + x - 1])
      const m = D.reduce((a, b) => a + b, 0) / D.length
      return Math.sqrt(D.reduce((a, b) => a + (b - m) ** 2, 0) / D.length)
    }, png.toString("base64"))
    out[`${theme} · ${nome}`] = +sigma.toFixed(2)
    await ctx.close()
  }
}
await browser.close()
console.log(JSON.stringify(out, null, 2))
