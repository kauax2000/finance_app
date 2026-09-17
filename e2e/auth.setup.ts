import { mkdir } from "node:fs/promises"
import path from "node:path"
import { test as setup } from "@playwright/test"

const storageState = path.join(
    process.cwd(),
    "playwright",
    ".auth",
    "user.json"
)

/**
 * Saves session cookies/localStorage for authenticated E2E.
 * Requires E2E_EMAIL and E2E_PASSWORD (same Supabase project as the dev server).
 */
setup("authenticate", async ({ page }) => {
    const email = process.env.E2E_EMAIL?.trim()
    const password = process.env.E2E_PASSWORD?.trim()
    if (!email || !password) {
        throw new Error(
            "E2E_EMAIL and E2E_PASSWORD must be set for the setup project (see package.json scripts)."
        )
    }

    await mkdir(path.dirname(storageState), { recursive: true })

    await page.goto("/login")

    // Espera a hidratação antes de tocar no formulário. Sem isso o passo é
    // uma corrida que o servidor de desenvolvimento frio perde de dois jeitos:
    // o `fill` é apagado quando o React assume os campos controlados, e o
    // clique em "Entrar" vira envio nativo — a página recarrega em `/login?`
    // e o `waitForURL` abaixo espera um redirecionamento que nunca vem.
    await page.waitForFunction(() => {
        const form = document.querySelector("form")
        return Boolean(
            form && Object.keys(form).some((k) => k.startsWith("__reactProps$"))
        )
    })

    await page.locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Entrar" }).click()

    // O redirecionamento e o alerta da tela correm juntos. Esperar só pelo
    // primeiro transforma qualquer login recusado — senha errada, Supabase
    // local fora do ar, campo invalidado — em 60s de silêncio seguidos de um
    // timeout que não diz nada.
    //
    // O alerta é procurado pelas peças do app (`Alert`, `FieldError`,
    // `FormError`), e não por `role="alert"`: o Next põe em toda página um
    // anunciador de rota com esse papel, vazio. Ele ganhava a corrida com o
    // botão ainda em "Entrando…" e o setup falhava com mensagem em branco — e,
    // num login certo, ele recebe o título da página nova. O `hasText` descarta
    // uma peça que monte antes do texto.
    const alerta = page
        .locator('[data-slot="alert"], [data-slot="field-error"], [data-slot="form-error"]')
        .filter({ hasText: /\S/ })
        .first()
    const motivo = await Promise.race([
        page
            .waitForURL((u) => !u.pathname.includes("/login"), {
                timeout: 60_000,
            })
            .then(() => null),
        alerta
            .waitFor({ state: "visible", timeout: 60_000 })
            .then(() => alerta.innerText())
            // Se nenhum alerta aparecer, este ramo some em vez de rejeitar: quem
            // manda na falha é o timeout do redirecionamento, acima.
            .catch(() => new Promise<never>(() => {})),
    ])
    if (motivo !== null) {
        throw new Error(`Login recusado pela tela: ${motivo.trim()}`)
    }

    await page.context().storageState({ path: storageState })
})
