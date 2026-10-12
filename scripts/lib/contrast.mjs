// O esqueleto dos três medidores de contraste — `tone-`, `tile-` e
// `identity-contrast.mjs`: abrir uma página do catálogo num tema, ler o pior
// pixel de uma captura e fechar com a tabela e o pior caso. O que cada um mede
// (os tokens, as células, o piso, a frase de reprovação) continua no script.
import { chromium } from "playwright"

export const TEMAS = ["light", "dark"]

// ds-kit.tsx:812-827, verbatim.
export const lum = ([r, g, b]) => {
    const f = (u) => {
        const c = u / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export const contraste = (a, b) => {
    const [hi, lo] = a > b ? [a, b] : [b, a]
    return (hi + 0.05) / (lo + 0.05)
}

export const abrirNavegador = () => chromium.launch()

/**
 * Uma página do dev server em :3000 no `tema`, pronta para medir: espera o
 * `seletor` aparecer, esconde o indicador do Next se pedido, e dá `espera` ms
 * para a página assentar. Quem chama fecha o `ctx`.
 */
export async function abrirPagina(
    browser,
    tema,
    caminho,
    { viewport, deviceScaleFactor, seletor, semPortal = false, espera }
) {
    const ctx = await browser.newContext(
        deviceScaleFactor === undefined ? { viewport } : { viewport, deviceScaleFactor }
    )
    await ctx.addInitScript((t) => localStorage.setItem("theme", t), tema)
    const page = await ctx.newPage()
    await page.goto(`http://localhost:3000${caminho}`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(seletor)
    if (semPortal) await page.addStyleTag({ content: "nextjs-portal{display:none}" })
    await page.waitForTimeout(espera)
    return { ctx, page }
}

/**
 * O pior contraste entre a tinta `fg` e os pixels opacos da caixa central da
 * captura de `alvo` — `caixa` em frações da largura e da altura, generosa de
 * propósito: ela inclui a folga em volta do conteúdo e exclui o fio da aresta.
 * O navegador decodifica a captura; a conta é a de cima.
 */
export async function piorRazao(page, alvo, fg, caixa) {
    const png = await alvo.screenshot()
    const pixels = await page.evaluate(
        async ([b64, { x, y }]) => {
            const img = new Image()
            img.src = "data:image/png;base64," + b64
            await img.decode()
            const c = document.createElement("canvas")
            c.width = img.width
            c.height = img.height
            const g = c.getContext("2d")
            g.drawImage(img, 0, 0)
            const x0 = Math.floor(c.width * x[0])
            const x1 = Math.ceil(c.width * x[1])
            const y0 = Math.floor(c.height * y[0])
            const y1 = Math.ceil(c.height * y[1])
            return Array.from(g.getImageData(x0, y0, x1 - x0, y1 - y0).data)
        },
        [png.toString("base64"), caixa]
    )
    const lFg = lum(fg)
    let pior = Infinity
    for (let k = 0; k < pixels.length; k += 4) {
        if (pixels[k + 3] < 200) continue
        const r = contraste(lFg, lum([pixels[k], pixels[k + 1], pixels[k + 2]]))
        if (r < pior) pior = r
    }
    return +pior.toFixed(2)
}

/** Uma linha da tabela: os campos do script, a razão e se ela passa do piso. */
export const linha = (campos, razao, piso) => ({ ...campos, razao, ok: razao >= piso ? "sim" : "NÃO" })

/**
 * A tabela, o resumo e a saída com 1 se alguma linha ficou abaixo do piso. O
 * resumo padrão é o pior caso contra o piso.
 */
export function concluir(linhas, piso, reprovacao, resumo) {
    console.table(linhas)
    if (resumo) resumo()
    else {
        const pior = Math.min(...linhas.map((l) => l.razao))
        console.log(`\npior caso: ${pior.toFixed(2)}:1   piso: ${piso}:1`)
    }
    if (linhas.some((l) => l.razao < piso)) {
        console.error(`\nReprovou: ${reprovacao}`)
        process.exit(1)
    }
}
