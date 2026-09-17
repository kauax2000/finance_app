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
 *   Campo de `--primary` ocupando ~45% da largura no desktop, com grão e
 *   vinheta (`@utility brand-field`, que também inverte a paleta local);
 *   coluna de formulário sobre `--background`, **sem cartão**; controles no
 *   degrau `xl`; título em `.page-title` (Ledger).
 *
 * STORY
 *   "Este app junta carteira, cartões, contas a pagar e assinaturas" → "entro
 *   com e-mail e senha" → Painel.
 *
 * FIRST VIEWPORT
 *   Esquerda: wordmark no topo do campo verde, quatro linhas no centro com o
 *   nome e o número de cada área, uma frase de fecho embaixo. Direita: título,
 *   uma linha de apoio, os campos, botão primário de largura total, uma linha
 *   de rodapé. No telefone o campo verde vira faixa de marca e o formulário
 *   ocupa o resto.
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
