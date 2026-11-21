# Uma cor por forma de pagamento — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seis tokens `--payment-*` e `paymentMethodColor()`. O "Como foi pago" pinta cada forma pela cor dela.

**Architecture:**
- Os tokens ficam em `src/app/globals.css`.
- O mapa forma → cor fica em `src/lib/payment-methods.ts`.
- A tela troca a `RAMPA_DO_PAGAMENTO` pelo mapa.

**Tech Stack:** Tailwind v4 (`@theme`), React 19, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-cor-da-forma-de-pagamento-design.md`. Mockup: `docs/design/painel/como-foi-pago-cores.html`, opção C.

## Global Constraints
- O `AGENTS.md` vale inteiro. Em especial:
  - todo token novo tem par em `.dark`;
  - `npm run ds:catalog` não pode avisar par faltando;
  - "CSS novo só conta depois de servido": confira a regra em `.next/dev/static/chunks/`; se faltar, rode `touch src/app/globals.css`.
- Antes de buscar código, rode `graphify query "<pergunta>"`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run src/components/ui src/components/categories src/lib src/app/designsystem`;
  - `npm run ds:audit -- src/components/categories/detail`.
- Não faça push.
- Faça stage só dos seus arquivos, um por um. Se o `globals.css` tiver mudanças de outra sessão quando você for commitar (`git diff src/app/globals.css` com hunks que não são seus), faça stage só dos seus hunks com `git apply --cached` de um patch filtrado. Nunca reverta o que não é seu.

## Review Focus
1. Dois cartões de crédito no mesmo mês: o segundo a 60%, distinguível do primeiro na barra.
2. `sem-forma` e `other`: o cinza.
3. Tema claro: as seis cores a 3:1 contra `--card`, conferidas pelo script.
4. O cartão de uma forma só pinta o anel na cor da forma.
5. O ladrilho do cartão de crédito com a bandeira continua legível sobre o violeta a 16%.

---

### Task 1: Tokens, mapa e o "Como foi pago" nas cores da forma

**Files:**
- Modify: `src/app/globals.css` (`:root`, `.dark`, `@theme`)
- Modify: `src/lib/payment-methods.ts` (+ teste: `src/lib/payment-methods.test.ts`, crie se não existir)
- Create or Modify: a medida de contraste, no padrão de `scripts/tile-contrast.mjs` ou `scripts/tone-contrast.mjs` (leia os dois e escolha o que acomoda melhor; diga qual no relatório)
- Modify: `src/app/designsystem/docs/colors.tsx` (a fileira "Formas de pagamento")
- Modify: `AGENTS.md` ("Tokens e theme", uma linha)
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` (`configPagamento`, ladrilhos, anel da forma única; saem `RAMPA_DO_PAGAMENTO` e o que ficar sem uso)

**Interfaces (produz):**
- `paymentMethodColor(method: PaymentMethod | "sem-forma" | null | undefined): string` devolve `"var(--payment-pix)"` e as demais. `other`, `sem-forma` e nulo dão `"var(--payment-other)"`.
- Se a tela precisar da classe do ladrilho, a classe `bg-payment-<x>/16` vem de um mapa estático (`paymentMethodTileClassName`) no mesmo arquivo, escrito por extenso. Nada de classe montada (`esperarSemClasseMontada`).
- A forma do `porPagamento` é `f.forma`. Confira em `src/lib/categoria-detalhe.ts` quais valores chegam (inclui `"sem-forma"`).

- [ ] **Step 1: Os testes.**
  - `payment-methods.test.ts`: cada uma das seis formas mais `sem-forma` tem cor, e `credit_card` dá `var(--payment-credit)`.
  - O script de contraste: as seis a ≥ 3:1 contra `--card`, em claro e escuro.

  Confira que os testes falham.
- [ ] **Step 2: Os tokens.** Em OKLCH, com os matizes da tabela do spec, até o script passar nos dois temas. Faça o `@theme` e a fileira da página `colors`.
- [ ] **Step 3: A tela.**
  - `configPagamento` passa a usar `paymentMethodColor(f.forma)`.
  - Uma forma repetida usa a cor a 60% na segunda ocorrência e a 35% na terceira, por `color-mix(in oklab, <cor> <pct>%, transparent)`, montado como string do valor e não como classe.
  - Os ladrilhos ganham a superfície da forma.
  - O anel da forma única usa a cor da forma.
- [ ] **Step 4: Navegador** (http://localhost:3000, só leitura). A Carro: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`. Confira o PIX em verde-água e o crédito em violeta, nos dois temas (`resize_window colorScheme`). Compare com a opção C do mockup.
- [ ] **Step 5:** Os checks passam, e o `ds:catalog` não avisa par faltando. Rode `graphify update .`.
- [ ] **Step 6:** Commit `feat(ds): uma cor por forma de pagamento, e o "Como foi pago" nela`.
