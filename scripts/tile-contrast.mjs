// Mede o contraste do ícone contra a superfície chapada do `ColorTile`.
// Precisa do dev server em :3000.
//
//   node scripts/tile-contrast.mjs
//
// Por que um script e não uma asserção de CSS: a cor não é do sistema, é um
// hexadecimal que a pessoa gravou no banco, e a superfície o normaliza com
// `oklch(from var(--tile-color) 0.76 clamp(0, (c - 0.02) * 10, 0.2) h)` (a
// `tile-vivid`). A conta fecha no papel para uma cor; o que esta grade responde
// é se ela fecha para as doze que o produto alcança, nos dois temas e nos
// quatro degraus — inclusive o branco e o preto, que o seletor livre da
// carteira ainda permite.
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
// Desde a rodada 184 são duas versões, `tile-vivid` (0,76, croma cheio, tinta
// escura) e `tile-soft` (0,95, a tinta no tom forte do matiz), e as duas são
// medidas — o clone troca a classe da versão. Quem mexer em claridade, croma
// ou tinta de qualquer uma delas remede aqui.
import { abrirNavegador, abrirPagina, concluir, linha, piorRazao, TEMAS } from "./lib/contrast.mjs"

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

const browser = await abrirNavegador()
const linhas = []

for (const tema of TEMAS) {
    const { ctx, page } = await abrirPagina(browser, tema, "/designsystem/color-tile", {
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
        seletor: "[data-slot=color-tile] svg",
        semPortal: true,
        espera: 600,
    })

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
            for (const tint of ["vivid", "soft"])
            for (let i = 0; i < cores.length; i++) {
                for (const [nome, cls] of Object.entries(tamanhos)) {
                    const no = modelo.cloneNode(true)
                    no.className = no.className
                        .replace(/\bsize-\d+\b/, cls)
                        .replace(/\btile-(vivid|soft)\b/, `tile-${tint}`)
                    no.style.setProperty("--tile-color", cores[i].valor)
                    no.dataset.probe = `${tint}-${i}-${nome}`
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

    for (const tint of ["vivid", "soft"])
    for (let i = 0; i < CORES.length; i++) {
        for (const nome of Object.keys(TAMANHOS)) {
            const probe = `${tint}-${i}-${nome}`
            // A caixa onde o glifo pousa: 25–75% nos dois eixos.
            const razao = await piorRazao(page, page.locator(`[data-probe="${probe}"]`), tintas[probe], {
                x: [0.25, 0.75],
                y: [0.25, 0.75],
            })
            linhas.push(linha({ tema, tint, cor: CORES[i].nome, degrau: nome }, razao, PISO))
        }
    }
    await ctx.close()
}

await browser.close()
const piorDe = (ls) => ls.reduce((a, b) => (a.razao <= b.razao ? a : b))
concluir(linhas, PISO, "alguma célula ficou abaixo do piso da WCAG 1.4.11.", () => {
    const pior = piorDe(linhas)
    // Por tema, porque é assim que a régua se lê. Até a rodada 184 cada tema
    // tinha a sua receita (véu de 12% contra 18%, tinta de 0,42 contra 0,78), e
    // uma delas podia afundar sozinha.
    for (const tema of TEMAS) {
        const p = piorDe(linhas.filter((l) => l.tema === tema))
        console.log(`${tema.padEnd(5)} pior: ${p.razao.toFixed(2)}:1   (${p.cor}, ${p.degrau}, ${p.tint})`)
    }
    console.log(
        `\n${linhas.length} células   pior caso: ${pior.razao.toFixed(2)}:1 ` +
            `(${pior.cor}, ${pior.degrau}, ${pior.tema}, ${pior.tint})   piso: ${PISO}:1`
    )
})
