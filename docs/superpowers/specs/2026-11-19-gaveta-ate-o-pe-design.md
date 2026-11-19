# A lista da gaveta vai até o pé do telefone — design curto

Data: 19/11/2026 · Tamanho: mudança pequena · Aprovado pelo dono (mudança em `src/components/ui/`)

## Intenção

Nas gavetas de baixo sem rodapé (Filtros, Notificações e todas as outras), a lista
para acima de uma faixa vazia de vidro (24px + barra de gestos). O dono quer a lista
indo até o pé do telefone, como no iOS.

## Causa

`DrawerContent` (`src/components/ui/drawer.tsx`) guarda `pb-(--drawer-safe)`
(`--drawer-safe` = 24px + `env(safe-area-inset-bottom)`) na superfície. O meio que
rola (`[data-drawer-meio]`) termina acima disso.

## Abordagens

- **A — o respiro entra no meio que rola (escolhida).** Sem rodapé, a superfície não
  guarda `pb`; o meio ganha `pb-(--drawer-safe)` por dentro. A lista passa por trás da
  barra de gestos, e o último item, rolado até o fim, ainda assenta acima dela.
- B — só tirar os 24px e manter a barra de gestos fora da lista. Sobra faixa; recusada.
- C — mexer em cada tela. Recusada: a causa é do componente.

## Design

1. `DrawerContent` de baixo **sem** `[data-slot=dialog-footer]` dentro: `pb-0`. Com
   rodapé, nada muda (o rodapé translúcido já desce sobre a área segura).
2. O meio (`[data-drawer-meio]`, que pode ser filho direto ou neto) leva
   `padding-bottom: var(--drawer-safe)` nas gavetas de baixo sem rodapé; a variável
   continua declarada na superfície.
3. A dissolução de borda (`scroll-fade-y`) segue como está.
4. Teste de fonte em `drawer-versions.test.ts` (ou `glass.test.ts`, onde a regra do
   `pb-(--drawer-safe)` já é cobrada) trancando as duas regras.

## Não-objetivos

Gaveta de cima, gaveta com rodapé, desktop (`Sheet`), o `Dialog`.

## Fica com o construtor

O seletor exato (Tailwind arbitrário ou CSS em `globals.css`) e onde o teste mora.
Conferir no simulador: Filtros de Transações e Notificações, rolados até o fim.
