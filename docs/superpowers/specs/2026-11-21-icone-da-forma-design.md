# O ícone de cada forma de pagamento (opção A) — design curto

**Por quê.** No "Como foi pago", o ícone do PIX é um QR code genérico, em cinza, sobre um verde-água quase invisível. O do cartão é a bandeira num retângulo branco que sai do círculo. Nenhum dos dois usa a cor da forma, que a barra e a bolinha já mostram. O dono escolheu a **A** (21/11/2026).

**Mockup:** `docs/design/painel/icone-da-forma.html`, opção A.

## Abordagens
- **A (escolhida).** O ícone na cor da forma, sobre o círculo num tom claro dela. A bandeira vai num selo no canto.
- **B.** O ladrilho inteiro na cor, com o ícone escuro. Recusada.
- **C.** Um mini cartão em degradê. Recusada: transforma PIX e dinheiro em "cartão".

## Como fica
- **Ladrilho.** É o círculo de 32px que já existe (`ItemMedia variant="tile"`).
  - O fundo é a cor da forma a 18%: `color-mix(in oklab, var(--payment-x) 18%, transparent)`.
  - O ícone tem 16px (`size-4`, Heroicons `16/solid`), na cor cheia da forma.
- **Ícone por forma:**
  - **PIX:** o símbolo do PIX, o losango. É uma marca desenhada, nova em `src/components/icons/pix-icon.tsx`, com `currentColor` e `aria-hidden`. Entra na lista de SVG desenhado do auditor (`DRAWN_SVG_FILES`), como as bandeiras.
  - **Crédito e débito:** `CreditCardIcon`.
  - **Dinheiro:** `BanknotesIcon`.
  - **TED:** `ArrowsRightLeftIcon`.
  - **Outro e sem forma:** `EllipsisHorizontalIcon`.
- **Bandeira (só no crédito).** Fica num selo pequeno no canto de baixo à direita do ladrilho, fora do recorte.
  - O selo é a `CreditCardBrandChip` num tamanho menor: uma prop `size="xs"` nova, cerca de 12 × 18px.
  - Tem um anel na cor do cartão (`ring-2 ring-card`), como o canto do `Avatar`.
  - Sem bandeira conhecida, não há selo.
- **Forma repetida.** O tom de 60% ou 35% da regra de forma repetida vale para o fundo e para o ícone.
- **Cartão de uma forma só.** O miolo do anel usa o mesmo ícone, na cor da forma. No crédito, a bandeira continua como está hoje.
- **Contraste.** O ícone sobre o fundo de 18% precisa de ao menos 3:1 nos dois temas (é uma marca não textual). A medida entra em `scripts/payment-contrast.mjs`.

## Onde mora
- **O mapa forma → ícone:** `paymentMethodIcon(method)`, num arquivo `.tsx` ao lado de `payment-methods.ts` (por exemplo `src/lib/payment-method-icon.tsx`). A tela não escolhe ícone, e o `ICONE_DA_FORMA` da tela sai.
- **O ladrilho completo:** se o `ItemMedia` não comporta o selo no canto, a composição fica na tela, com peças do DS. Se ele se repetir em outra tela, vira componente depois. Nenhum `function` de componente em `src/app/`.
