import { AuthSignedInRedirect } from "@/components/layout/auth-signed-in-redirect"

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
 *   preto (`@utility brand-field`), e na frente uma pilha de cartões do
 *   próprio produto; coluna de formulário sobre `--background`, **sem
 *   cartão**; controles no degrau `xl`; título em `.page-title` (Ledger).
 *   A marca é preta e branca; o arco-íris é o único acento, e mora só nela.
 *
 * STORY
 *   "Este app junta carteira, cartões, contas a pagar e assinaturas" → "entro
 *   com e-mail e senha" → Painel.
 *
 * FIRST VIEWPORT
 *   Esquerda: wordmark branco no topo do campo arco-íris; embaixo, o cartão
 *   da carteira — saldo, três áreas com número, a frase de fecho na nota —
 *   com duas arestas de cartão aparecendo atrás. Nenhum texto corrido sobre o
 *   arco-íris. Direita: título, uma linha de apoio, os campos, botão primário
 *   de largura total, uma linha de rodapé. No telefone o campo vira um cartão
 *   de marca no topo, com a grade 2×2 dos números dentro de um cartão, e o
 *   formulário ocupa o resto.
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
    return <AuthSignedInRedirect>{children}</AuthSignedInRedirect>
}
