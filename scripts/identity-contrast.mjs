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
//
// Desde a rodada 184 são duas versões, e as duas são medidas: `vivid` (a cor
// cheia com a tinta escura) e `soft` (quase branca, com a letra no tom forte
// da família) — por isso a tinta é lida em cada clone, e não uma vez só. A
// família entra pela classe `identity-N`, que publica as variáveis; até a 183
// o script trocava `bg-identity-N`, e depois da troca de classe ele mediu a
// família 1 seis vezes sem acusar nada.
import { abrirNavegador, abrirPagina, concluir, linha, piorRazao, TEMAS } from "./lib/contrast.mjs"

const PISO = 4.5
const FAMILIAS = ["ember", "gold", "grove", "ocean", "iris", "bloom"]
const TAMANHOS = { 24: "size-6", 40: "size-10", 56: "size-14" }

const browser = await abrirNavegador()
const linhas = []

for (const tema of TEMAS) {
    const { ctx, page } = await abrirPagina(browser, tema, "/designsystem/avatar", {
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
        seletor: "[data-slot=avatar-fallback]",
        semPortal: true,
        espera: 600,
    })

    // Uma grade de clones do componente real: trocar a classe da superfície e a
    // do tamanho é o que o `identityToneFor` e o prop `size` fazem em produção.
    const tinta = await page.evaluate(
        ({ tamanhos }) => {
            const modelo = document.querySelector("[data-slot=avatar]")
            const palco = document.createElement("div")
            palco.id = "palco"
            palco.style.cssText =
                "position:fixed;left:0;top:0;z-index:99999;display:flex;flex-wrap:wrap;gap:24px;padding:24px;background:var(--background)"
            // A tinta, por canvas: `getComputedStyle` devolve oklch().
            const c = document.createElement("canvas")
            c.width = c.height = 1
            const g = c.getContext("2d")
            const rgb = (cor) => {
                g.clearRect(0, 0, 1, 1)
                g.fillStyle = cor
                g.fillRect(0, 0, 1, 1)
                return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3)
            }
            const tintas = {}
            document.body.appendChild(palco)
            for (const tint of ["vivid", "soft"]) {
                for (let n = 1; n <= 6; n++) {
                    for (const [px, cls] of Object.entries(tamanhos)) {
                        const no = modelo.cloneNode(true)
                        no.className = no.className.replace(/\bsize-\d+\b/, cls)
                        no.dataset.probe = `${tint}-${n}-${px}`
                        const fb = no.querySelector("[data-slot=avatar-fallback]")
                        fb.className =
                            fb.className.replace(/(^|\s)identity-\d(?=\s|$)/g, " ") +
                            ` identity-${n}`
                        fb.dataset.tint = tint
                        palco.appendChild(no)
                        tintas[`${tint}-${n}-${px}`] = rgb(getComputedStyle(fb).color)
                        // O texto sai para o pixel de baixo dele ser mensurável.
                        fb.style.color = "transparent"
                    }
                }
            }
            return tintas
        },
        { tamanhos: TAMANHOS }
    )
    await page.waitForTimeout(400)

    for (const tint of ["vivid", "soft"])
    for (let n = 1; n <= 6; n++) {
        for (const px of Object.keys(TAMANHOS)) {
            const probe = `${tint}-${n}-${px}`
            // A caixa onde as letras pousam: 25–75% na horizontal, 35–65% na vertical.
            const razao = await piorRazao(page, page.locator(`[data-probe="${probe}"]`), tinta[probe], {
                x: [0.25, 0.75],
                y: [0.35, 0.65],
            })
            linhas.push(linha({ tema, tint, familia: FAMILIAS[n - 1], px: +px }, razao, PISO))
        }
    }
    await ctx.close()
}

await browser.close()
concluir(linhas, PISO, "alguma célula ficou abaixo do piso AA.")
