import { AuthFrame } from "@/components/layout/auth-frame"
import { AuthSignedInRedirect } from "@/components/layout/auth-signed-in-redirect"

/**
 * CONTRATO DO CASCO — a casca das telas de acesso vive **aqui**, e não em cada
 * página: o `AuthFrame` monta o `SplitShellRoot` e o painel de marca uma vez,
 * e o painel continua o mesmo nó entre as rotas de `(auth)` — troca de cena,
 * não remonta, e a entrada toca uma vez só. Cada formulário devolve só a
 * coluna (`AuthShell`, com `scene` e, nas telas de status, `icon`) e publica o
 * id da cena; o painel desenha a publicada, ou `defaultSceneFor(pathname)` —
 * o frame nunca lê a query. A cena é uma linha de
 * `components/auth/showcase/scenes.ts`, e a família decide o aparelho: login
 * no navegador, convite no tablet, cadastro e recuperação no celular.
 */

/**
 * =============================================================================
 * CONTRATO DA DIREÇÃO — telas de acesso (jornada G1)
 * =============================================================================
 *
 * THESIS
 *   A tela de acesso mostra o escopo do produto antes de pedir a senha. Recusa
 *   o cartão centrado sobre fundo cinza — o arranjo que a categoria sempre
 *   entrega, e o que estas quatro telas eram.
 *
 * OWN-WORLD
 *   Campo de marca ocupando ~45% da largura no desktop: um **cartão** de
 *   cantos arredondados com o arco-íris da marca, grão pesado e vinheta para o
 *   preto (`@utility brand-field`), e dentro dele o palco do `Showcase`: o
 *   próprio app num aparelho desenhado só com tokens (`DeviceFrame`), uma
 *   colagem de depoimentos ilustrativos e a legenda da cena no pé — tudo
 *   `inert`, `aria-hidden` e marcado "exemplo". Coluna de formulário sobre
 *   `--background`, **sem cartão**; controles no degrau `xl`; título em
 *   `.page-title` (Ledger). A marca é preta e branca; o arco-íris é o único
 *   acento, e mora só nela.
 *
 * STORY
 *   "Este app junta carteira, cartões, contas a pagar e assinaturas" → "entro
 *   com e-mail e senha" → Painel.
 *
 * FIRST VIEWPORT
 *   Esquerda: título, uma linha de apoio, os campos, botão primário de largura
 *   total, uma linha de rodapé. Direita (`side="end"`): wordmark branco no
 *   topo do campo arco-íris e o palco — no login, a janela do navegador com o
 *   painel do app, a busca ⌘K que se digita sozinha até a fatura e a ida e
 *   volta ao celular, parada em até 5s. Nenhum texto corrido sobre o
 *   arco-íris: o que se lê vive em `Card`. No telefone o campo encolhe ao
 *   wordmark (`asideMobile="logo"`), o palco não roda e o formulário ocupa o
 *   resto.
 *
 * FORM
 *   Painel dividido. Direção **fixada pelo usuário**, então o sorteio do
 *   `concept-seed` não rodou — direção fixada vence o dado, por contrato.
 *   Build code-led: sem comp aprovado, a ambição mora aqui.
 *
 * FINISH
 *   unreviewed and undocumented is unfinished; this build ends with the finish
 *   review, the verdict, and the system recorded.
 *
 *   **O registro não é um DESIGN.md**, e o desvio é deliberado: a autoridade de
 *   design deste projeto é o `AGENTS.md` mais o catálogo vivo em
 *   `/designsystem`, cuja taxonomia o `registry.ts` obriga a compilar e o
 *   `taxonomy.test.ts` tranca. Um DESIGN.md seria um segundo registro do mesmo
 *   sistema, contra a regra de fonte única que o próprio `AGENTS.md` estabelece.
 *   O que esta rodada acrescentou está em `/designsystem/brand` (o campo de
 *   marca e as medições do grão) e em `/designsystem/split-shell` (o casco).
 * =============================================================================
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthSignedInRedirect>
            <AuthFrame>{children}</AuthFrame>
        </AuthSignedInRedirect>
    )
}
