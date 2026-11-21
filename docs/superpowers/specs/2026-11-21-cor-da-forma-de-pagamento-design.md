# Uma cor por forma de pagamento — design curto

**Por quê.** A barra e a lista do "Como foi pago" usavam a rampa dos gráficos: verde-azulado e índigo, distribuídos pela ordem. Essas cores não aparecem em mais nada da página e não dizem nada sobre a forma. O dono escolheu a opção **C** (21/11/2026): cada forma tem a sua cor fixa, a mesma em qualquer categoria.

**Mockup:** `docs/design/painel/como-foi-pago-cores.html`, opção C.

## Abordagens
- **A.** Tons da cor da categoria. Recusada.
- **B.** A maior forma na cor da categoria, as outras em cinza. Recusada.
- **C (escolhida).** Uma cor fixa por forma.

## As cores

São seis tokens novos em `globals.css`, `--payment-<forma>`, com o par em `.dark`:

| Forma | Token | Matiz |
| --- | --- | --- |
| PIX | `--payment-pix` | verde-água (~185) |
| Cartão de crédito | `--payment-credit` | violeta (~290) |
| Cartão de débito | `--payment-debit` | azul (~250) |
| Dinheiro | `--payment-cash` | dourado (~85) |
| TED / débito em conta | `--payment-ted` | rosa (~350) |
| Outro e sem forma | `--payment-other` | cinza (o `--muted-foreground`) |

**Ruling (minha):** o mockup pintava o dinheiro de verde e o TED de âmbar.
- O verde virou dourado: verde lê como `success`/`income` (invariante 3).
- O âmbar virou rosa: âmbar lê como `warning`.
- Os matizes também ficam longe do coral da marca de categoria mais comum.

**Medida:**
- As cores são marca não textual: barra, ponto e ladrilho.
- Cada uma mede ao menos 3:1 contra `--card` nos dois temas (WCAG 1.4.11).
- As seis se distinguem entre si.
- A medida entra num script ou num teste, no padrão de `scripts/tone-contrast.mjs` ou `tile-contrast.mjs`.

**Utilitários:** os tokens viram cores do Tailwind (`bg-payment-pix` etc.), pelo `@theme`.

**Ladrilho:** a superfície do ícone é a cor da forma a 16% (`bg-payment-pix/16`), e o ícone fica na tinta normal (`text-foreground`/`text-muted-foreground`). A bandeira do cartão continua a mesma.

## Duas formas iguais
Dois cartões de crédito diferentes dividiriam o violeta. A segunda forma do mesmo tipo usa a cor a 60%, e a terceira a 35% (na barra, no ponto e no ladrilho). Ordem do maior valor ao menor.

## Onde vale agora
- O "Como foi pago" do detalhe da categoria: a barra, a lista e o anel do cartão de uma forma só.
- A cor mora num lugar só: `paymentMethodColor(method)` em `src/lib/payment-methods.ts`, que devolve `var(--payment-…)`. A tela não escolhe cor.
- **Fora:** outras telas que mostram a forma de pagamento (transações, formulário) não mudam agora.

## Design system
- Tokens novos (invariante 6, com autorização permanente do dono).
- Na página `/designsystem/colors`, uma fileira "Formas de pagamento" com as seis amostras.
- Uma linha no `AGENTS.md`, em "Tokens e theme": o que são e que não são `income`/`success`.
- A `RAMPA_DO_PAGAMENTO` da tela sai.
