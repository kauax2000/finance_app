---
name: design-system-guard
description: Use SOMENTE para conformidade com o design system do Finance App — não para design. Casos - componentes declarados soltos dentro de `src/app/`, cores e medidas cruas em vez de tokens do `globals.css` (causa comum de bug no tema escuro), primitivo cru com equivalente em `src/components/ui/`, `hover:` sem par de toque, formatação de dinheiro ou data fora dos helpers, lacunas do design system que viram proposta (registry do shadcn antes de código autoral), e a fronteira de autorização de `src/components/ui/` + `globals.css`. Casos típicos - "esse texto some no tema escuro", "uso o Button do projeto ou faço um custom?", "esse componente da página deveria virar compartilhado?", "audita os tokens dessa tela". Para criar, redesenhar, revisar, criticar ou polir UI — hierarquia visual, UX, tipografia, cor, motion, acessibilidade, responsividade — a skill é a `impeccable`; esta entra depois, como verificação de conformidade do resultado. Não use para lógica de backend, rotas de API, auth, build ou tipos.
---

# Design system guard

## Por que esta skill existe

O design system do Finance App tem 73 componentes, uma paleta de tokens em
`src/app/globals.css` e uma documentação viva em `/designsystem`. Nada disso
impede o modo clássico de um design system morrer: não de uma vez, mas uma tela
por vez. Alguém precisa de um cartão de métrica, escreve um `StatCard` dentro da
própria página porque é mais rápido, e pronto — nenhuma outra tela enxerga esse
componente. Na tela seguinte outra pessoa escreve o mesmo cartão, um pouco
diferente. Em três meses o design system descreve uma minoria do produto e
ninguém confia nele.

Hoje o produto já tem **1.179 achados em 144 arquivos** (ver
`docs/design/CONFORMIDADE-01.md`). A skill existe para fazer duas coisas
simétricas, e ambas importam:

1. **Puxar da tela para o design system** — nenhum componente nasce em `src/app/`.
2. **Empurrar o design system para a tela** — toda tela compõe a partir de `src/components/ui/`.

Fazer só a primeira produz um design system rico que ninguém usa. Fazer só a
segunda trava o produto no que já existe. As duas juntas fazem o design system
crescer no ritmo das telas, deliberadamente.

## Fronteira com a `impeccable`

A skill de design deste projeto é a `impeccable` — criação, redesign, crítica,
polimento, hierarquia, UX, motion, tipografia. Esta skill não opina sobre design:
ela verifica se o resultado obedece o design system. O fluxo normal é a
`impeccable` produzir ou refinar a tela e esta auditar a conformidade no final.
Quando as duas parecerem se aplicar, a `impeccable` vence.

## A fronteira que não se atravessa sozinho

**Dentro do arquivo da tela: corrigir direto.** Trocar `<button>` por `<Button>`,
substituir `text-emerald-600` pelo token, somar o `active:` que faltava, trocar
um `Intl.NumberFormat` por `currencyBRL`, adicionar o `alt`. São correções
locais, reversíveis e óbvias — pedir permissão para cada uma só gasta o tempo de
quem pediu a tela.

**Em `src/components/ui/` ou `src/app/globals.css`: propor e esperar.** Criar
componente, mudar variant de componente existente, adicionar token. Aqui a
mudança atinge todas as telas presentes e futuras, e um componente criado às
pressas — nome ruim, variants inventadas antes do segundo caso de uso — é mais
caro de desfazer do que de nunca ter criado.

Um `npx shadcn@latest add <x>` também cruza essa fronteira: ele escreve em
`src/components/ui/`. Vale a mesma regra, e mais uma precaução abaixo.

**Esperar não é dissolver.** Quando um componente já está declarado dentro da
tela e a extração depende de aprovação, existe a tentação de "resolver" apagando
a declaração e espalhando o JSX inline nos lugares onde ele era usado. Isso é
pior que o problema original: some a abstração, aparece markup duplicado, a
intenção das variants se perde, e quem aprovar a proposta amanhã terá que
extrair tudo de novo do zero. O componente fica onde está, com as cores
corrigidas para token, e a proposta vai no relatório.

## O CLI do shadcn sobrescreve o que já existe

Instalar um componente reescreve as **dependências** dele. Numa instalação real
deste projeto, `npx shadcn@latest add combobox` reescreveu `button.tsx`,
`input.tsx`, `textarea.tsx` e `dialog.tsx`, e nisso apagou o prop `size` do Input
— uma customização que o `AGENTS.md` exige. O CLI não avisa: ele lista os
arquivos como "Updated".

Antes de instalar, fotografe a pasta; depois, devolva ao estado anterior todo
arquivo que já existia:

```bash
SNAP=$(mktemp -d) && cp src/components/ui/*.tsx "$SNAP/"
npx shadcn@latest add <nome> --yes --overwrite
for f in src/components/ui/*.tsx; do
  b=$(basename "$f")
  [ -f "$SNAP/$b" ] && ! cmp -s "$f" "$SNAP/$b" && cp "$SNAP/$b" "$f" && echo "preservado: $b"
done
```

## Modo 1 — antes de escrever a tela

Este é o modo barato. Uma tela escrita certa custa muito menos que uma tela
consertada.

**1. Ler o catálogo.** Sempre a partir da raiz do projeto:

```bash
npm run ds:catalog
```

Ele lista os componentes de `src/components/ui/` com seus `variant`s e `size`s
reais, a casca do app em `src/components/layout/`, e todos os tokens lidos do
`globals.css` naquele momento — inclusive um aviso quando um token existe em
`:root` sem par em `.dark`, que é a origem mais comum de "isso some no tema
escuro". Nunca presuma de memória o que existe.

**2. Ler a página do componente.** `/designsystem/<slug>` tem a demonstração ao
vivo, a tabela de props curada e as decisões que não cabem numa prop. As páginas
de **Padrões** (`dinheiro`, `datas`, `formularios`, `mobile-toque`,
`vazio-carregando`, `graficos`, `chips-status`) valem mais que qualquer página de
componente: são as decisões que atravessam telas.

**3. Mapear a tela para o catálogo.** Antes de escrever JSX, percorra os
elementos que a tela precisa e aponte cada um para um componente. Os que sobrarem
sem correspondência são o assunto do passo 4.

**4. Para o que falta: registry do shadcn antes de código autoral.**

```bash
npx shadcn@latest view <nome>     # inspecionar antes de instalar
```

Componente autoral é para o que o registry não cobre: algo com semântica do
domínio financeiro (um `MoneyDisplay`, um `StatCard`). Ver
`references/conventions.md`.

**5. Escrever a tela compondo só do design system**, e rodar o Modo 2 no final.

## Modo 2 — auditoria

```bash
npm run ds:audit -- src/app/(app)/transactions/page-client.tsx
npm run ds:audit                        # src/app + src/components
npm run ds:audit -- --rule D3           # só uma regra
npm run ds:audit -- --json              # para consumo por script
```

O script é deliberadamente burro: acha padrões e diz onde, sem opinião sobre o
que fazer. Confie nos achados dele em vez de reler o arquivo procurando literal a
olho — ele não cansa e não erra diferente a cada vez. Mas **leia o arquivo** para
entender a tela antes de mexer: o script vê linhas, não intenção.

### O que fazer com cada achado

| Regra | O que é | Ação |
|---|---|---|
| **A** | componente declarado dentro de `src/app/` | Extrair é **proposta** — ver `references/promotion.md`. Até o ok chegar, o componente fica onde está. Se for layout genuinamente exclusivo daquela rota, ele fica de vez: diga isso no relatório em vez de mover calado. |
| **A2** | `cva()` fora de `components/ui/` | Sempre acompanha um caso A. Move junto com o componente. |
| **C** | primitivo cru com equivalente no DS | **Corrigir direto.** Trocar a tag e adicionar o import. |
| **C'** | primitivo cru sem equivalente | **Lacuna.** Propor e esperar. Não escrever o componente à mão sem checar o registry. |
| **D** | cor literal em hex ou `rgb()` | **Corrigir direto** para o token mais próximo em **intenção**, não em aparência. |
| **D2** | valor arbitrário | Ver a tabela de substituições abaixo. Nem todo arbitrário é violação. |
| **D3** | paleta padrão do Tailwind | **Corrigir direto.** `bg-white` → `bg-card`, `text-gray-600` → `text-muted-foreground`, `text-emerald-600` → `text-income` ou `text-success`. |
| **F** | semântica / acessibilidade | **Corrigir direto.** `<div onClick>` → `<Button>`, `alt` na imagem, `aria-label` no botão só-ícone. |
| **H** | `hover:` sem `active:` | **Corrigir direto** somando `active:` ou `group-active:`. Nunca removendo o `hover:` — ver abaixo. |
| **I** | `Intl.*` ou `toLocaleString` inline | **Corrigir direto** para `@/lib/formatters` ou `@/lib/transaction-date`. |

### D2 — quando o valor arbitrário tem token

| Arbitrário | Token | Por quê |
|---|---|---|
| `text-[10px]`, `text-[11px]` | `text-2xs` | 205 ocorrências no produto. É o degrau abaixo de `text-xs`. |
| `text-[0.8rem]` | `text-control-sm` | O tamanho de texto dos controles `size="sm"`. |
| `z-[100]`, `z-[70]`, `z-[60]` | `z-(--z-toast)`, `z-(--z-popover)`, … | A escala nomeada está na página **Camadas**. |
| duração e curva em ms | `duration-(--duration-*)`, `ease-(--ease-*)` | Ver a página **Movimento**. |

**O que não é violação:** `w-[...]` e `h-[...]` de esqueleto, que existem para
casar com a largura do conteúdo real; qualquer coisa com `var()`, `env()` ou
`calc()`, que o script já ignora; e `w-[var(--radix-popover-trigger-width)]`, que
não tem substituto.

### H — a política de hover deste projeto

`hover:` compila para `@media (hover: hover)`, e um telefone responde
`hover: none`. A resposta **não** é remover `hover:` do código: a decisão do
projeto é manter a variante padrão do Tailwind v4, para iPad com trackpad
continuar tendo hover. O que falta é **somar** `active:` ou `group-active:` em
superfícies tocáveis. `src/lib/tailwind-hover-policy.test.ts` falha se alguém
redefinir a variante para `:hover` puro.

### Escolher o token certo

Ao substituir uma cor crua, o critério é o **papel** dela na interface, não o
valor hexadecimal mais próximo. Um `#6B7280` em texto secundário vira
`text-muted-foreground` mesmo que o oklch não bata exatamente. Casar por
aparência produz telas que quebram no tema escuro, que é justamente o problema
que o token resolve.

Neste produto, uma distinção extra importa: **`success`/`destructive` não são
`income`/`expense`**. Verde de "deu certo" e verde de "entrou dinheiro" são
coisas diferentes, e os tokens de dinheiro são mais saturados de propósito.

Se nenhum token expressa o papel daquela cor, o token está faltando. Isso é
proposta de alteração no `globals.css` — cruza a fronteira, então apresenta e
espera. Não é motivo para abrir exceção e deixar o literal.

## Quando um componente merece existir

Três perguntas. Se a resposta for não para alguma, ele ainda não deve nascer:

1. **Tem semântica própria?** Um nome que descreve o que ele é no produto, não
   como ele parece. `MoneyDisplay` sim; `GrayBoxWithBorder` não.
2. **O reuso é previsível?** Existe uma segunda tela plausível que vai precisar
   dele — não hipotética, mas identificável agora.
3. **As variants vêm do uso real?** Cada `variant` corresponde a um caso que
   existe hoje. Variant inventada "para o futuro" envelhece errada e ninguém
   remove.

Falhou alguma? O bloco fica na tela como markup composto de tokens. Isso não é
dívida — é a resposta certa até haver evidência de que é um componente.

## Formato do relatório

```markdown
## Auditoria de design system — <tela>

**Conformidade:** X erros · Y avisos · Z lacunas no DS

### Corrigido na tela
- `arquivo:linha` — <o que era> → <o que virou>

### Lacunas do design system (aguardando seu ok)
- **<Componente>** — <onde apareceu> · `npx shadcn@latest add <x>` | autoral
  - variants propostas: <lista, cada uma justificada por um uso real>

### Nada a fazer
- <o que já estava conforme, em uma linha>
```

**Tela conforme produz relatório curto que diz isso.** Não invente achado para
justificar a auditoria. Uma skill que sempre encontra alguma coisa é uma skill
que passa a ser ignorada, e aí ela não protege mais nada.

## Depois de mexer

```bash
npx tsc --noEmit
npm run lint
npm run test:unit
```

Trocar primitivo por componente do design system muda tipos de props —
`<input onChange>` e `<Input size="sm">` não são a mesma coisa. O typecheck pega
isso. **Base de comparação:** hoje o projeto tem 2 erros de tipo pré-existentes
(`payment-events.test.ts`, `mutation-gateway.test.ts`) e 85 avisos de lint. Se o
número subir, foi você.

## Referências

- `references/conventions.md` — o padrão de componente deste projeto (Radix +
  `cva` + `data-slot` + `cn`). Ler antes de escrever qualquer componente novo.
- `references/promotion.md` — como promover um bloco da tela para o design system
  sem quebrar a tela no caminho.
- `/designsystem` — a documentação viva. Ligada em produção por
  `NEXT_PUBLIC_DS_DOCS`; sempre disponível em desenvolvimento.
