# Plano: o painel de marca das telas de acesso (mockups animados)

> **Resumo para o dono.** No painel à direita entra uma janela de navegador desenhada com tokens, com o app de verdade dentro. Ela vira celular quando a pessoa vai para Criar conta ou Esqueci a senha, e também numa ida e volta dentro do roteiro do login.
>
> - **No login:** um cursor "Você" clica a busca, a paleta ⌘K sai voando, digita "fatura" e abre a fatura.
> - **Nas bordas:** uma colagem de depoimentos ilustrativos, cada um com o selo "exemplo".
> - **Entre telas:** o painel deixa de remontar e passa a animar.
>
> **Execução:** por subagentes com revisão por tarefa (`superpowers:subagent-driven-development`), em 11 fases (0 a 10) com verificação em cada uma.
>
> **Como foi feito:** pesquisa em quatro frentes (casca, motion, DS e referências), três conceitos independentes, três juízes, síntese, crítico com 38 achados e revisão.

## 1. Contexto

**Por que mexer.** O dono viu a cena do login e achou os mockups "horrorosos". O diagnóstico abaixo foi conferido no código.

1. **Não há herói.** São dois cartões pequenos colados no pé de um campo arco-íris alto: o `StatCard` "Saldo do mês" e o `Card` "Próximas contas". Eles descem porque o `split-shell-aside-body` usa `justify-end`, e a metade de cima fica vazia.
2. **Não há profundidade.** Tudo está de frente, na mesma elevação. Nada se sobrepõe e nada é cortado pela borda do painel.
3. **O número grande, verde e em fonte mono vem do próprio DS.** O `StatCardValue` usa `font-mono` fixo, e o `MoneyDisplay` em `xl`/`2xl` também cai no mono (`FIGURE_SIZES` em `money-display.tsx:41`).
4. **Não há história.** O painel mostra KPI, não o que a pessoa faz no app.
5. **Não há movimento.** O painel remonta a cada rota, porque o `AuthShell` monta um `SplitShell` inteiro por página (`auth-shell.tsx:42`). Em produção ele ainda monta duas vezes na primeira carga: primeiro o fallback do `Suspense`, depois o formulário.
6. **Há um bug de foco.** Quando a tela troca de `AuthShell` para `AuthStatus`, o foco cai no `<body>`. A causa é o ref `anterior` em `split-shell.tsx:108`, que já nasce com o passo novo.

**As três referências do dono e como cada uma entra:**

| Referência | O que o dono pediu | Como entra |
|---|---|---|
| **Emergent** | Janela de navegador com bolinhas e barra de URL, UI viva dentro, etiquetas de cursor com nome sobre a borda, pontos de carrossel embaixo, e "a janela virando celular". | `DeviceFrame` é uma moldura só que muda de forma entre `browser` e `phone`. A mini UI se reorganiza dentro dela, e a navegação passa do trilho lateral para a barra de abas. Há um `PresenceCursor` com nome em **toda** família de cena: no login ele clica a pílula, no cadastro toca o orçamento, no convite aparecem Ana e Rafael. Embaixo ficam os `ShowcaseDots`. Pela D8, o login também faz uma ida e volta navegador→celular→navegador dentro do roteiro. |
| **Lovable** | Barra flutuante sobre o gradiente, com cursor piscando e texto sendo digitado. O que se digita é a paleta ⌘K de verdade. | O cursor "Você" clica a pílula de busca do cabeçalho. Um "fantasma" da pílula voa para fora da janela e vira a barra de um `Command variant="panel"` real, flutuando à frente. Ela digita "fatura", e as linhas aparecem com o trecho casado em negrito. |
| **Amie** | Muitos cartõezinhos inclinados nas bordas, cortados pela borda, com o centro livre. | `ShowcaseScatter` com até 12 depoimentos ilustrativos, cada um com o selo "exemplo" sempre do lado visível. Eles se afastam quando o aparelho muda de forma. |

**Decisões do dono que este plano cumpre:**
- Depoimentos fictícios, cada um com `Badge variant="soft" tone="neutral" size="xs"` "exemplo". Sem métricas, sem nome real, só primeiro nome e inicial, com avatar `AvatarFallback` em tom de identidade.
- ⌘K digitado por roteiro, sem roubar foco.
- Componentes novos do DS desenhados só com tokens: sem imagem, sem MacBook, sem 3D em tempo de execução.
- No telefone, só o wordmark.
- O painel fica à direita (`side="end"`) e o rodapé logo abaixo do formulário.

**Desvio deliberado da referência Emergent:** as bolinhas do navegador ficam **neutras**. Pintá-las com tokens de estado usaria a semântica errada, e pintá-las com cores da marca criaria uma segunda peça de marca na tela. Isso vai listado ao dono na Fase 0.

**Base escolhida.** O conceito A, "Uma janela, duas telas", recebe enxertos do B, "O Mural":
- orçamento de 5s;
- repouso em 2D;
- o voo da pílula;
- afastamento da colagem;
- `MOLA_PALCO`;
- frases;
- selo "dados de exemplo".

Do C, "Atos", vêm a prop `caret` com valor controlado no cmdk, o fecho do ⌘K que abre a fatura, o recorte por `className` e o painel respondendo 80ms depois da coluna. Os 38 achados do crítico estão resolvidos; a conferência está na seção 10.

---

## 2. Direção visual

### O conceito
No centro do campo há uma única janela desenhada com tokens.
- **Na mesa** ela é navegador: login, convite e o fim da recuperação.
- **Em movimento** ela vira celular: cadastro e recuperação.

O mundo dentro dela é sempre o mesmo painel de outubro. Ele se reorganiza quando a janela muda de forma, e cada cena acrescenta uma camada: a paleta, o bloqueio, o aviso, a carteira compartilhada. Sem uma linha de texto, o painel diz que é a mesma conta no computador e no celular.

### As peças memoráveis
1. **O clique e o voo (login).** O cursor "Você" chega à pílula de busca do cabeçalho e clica.
   - Um fantasma opaco da pílula voa para fora da janela e vira a barra da paleta flutuando à frente.
   - A paleta digita "fatura", as linhas entram, ela fecha, e a mini UI abre a "Fatura de outubro".
   - Com a D8, a janela então encolhe até celular, mostra a mesma fatura no bolso e volta. É busca, resultado e "funciona nos dois", e acaba.
2. **A janela que encolhe (login para esqueci).** A janela vira celular e a barra de URL vira a ilha dinâmica. O trilho lateral desliza e vira a barra de abas. A tela de bloqueio desce, e no passo do código a ilha se abre num aviso: "Seu código de acesso chegou".

### O que fica quieto
- O campo fica parado (`brand-field`, sem lava).
- Não há manchete no painel.
- Não há laço ocioso nenhum. O `ChartSparkline` não tem ponto pulsante.
- Todo roteiro termina em no máximo 5s depois da troca de cena.
- Em repouso tudo é 2D. O 3D é só o `rotateY` de até 6° durante a troca de forma.

### Sistema de profundidade
Tudo fica dentro de `ShowcaseStage` (`isolate`, `z` locais). **A profundidade é só sombra e ordem: não há `scale`, `blur` nem `opacity`**, para o selo "exemplo" ficar sempre com 11px.

| Plano | Conteúdo | Tratamento |
|---|---|---|
| 0, campo | `brand-field`, wordmark, pontos | Parado. O wordmark é `relative z-10`. Os pontos são formas `bg-current/40`, sem texto. |
| 1, colagem | Depoimentos `far` e `mid` (`Card variant="elevated" padding="sm"`) | `z-0`. `far` com `shadow-sm`, `mid` com `shadow-md`. |
| 1b, colagem perto | Depoimentos `near` | `z-20 shadow-lg`. Podem cobrir o canto do herói em no máximo 8% da área dele. |
| 2, herói | `DeviceFrame` | `z-10 shadow-xl`. Em repouso fica de frente. |
| 3, flutuantes | Paleta ⌘K, um chip de evento, cursores | `z-30`. Chip e cursores com `shadow-lg`. **A paleta não tem sombra** (AGENTS:826-832): fica só o `ring-1 ring-foreground/10` do componente e a placa opaca. Sobrepõem a borda do herói em cerca de 12%. No máximo um chip por cena. |

### Regras de composição no painel alto
- **Palco.** `ShowcaseStage` é `absolute inset-0` dentro do aside. O `AuthBrandPanel` passa ao `SplitShellAside` a classe `@3xl/split-shell:relative @3xl/split-shell:isolate @3xl/split-shell:overflow-clip`. O `overflow: clip` respeita o `rounded-modal`.
- **Zona do wordmark.** Nada pousa no retângulo de 40cqw × 14cqh no canto superior esquerdo.
- **Herói.** Centra a 52% da altura do palco.
  - Navegador: largura `min(86cqw, 140cqh)`, proporção 16/10.
  - Celular: altura `min(76cqh, 160cqw)`, proporção 9/19,5.
- **Centro livre.** A colagem nunca entra na caixa do herói mais 8%. O afastamento é navegador `kx 1,00 / ky 1,12` e celular `kx 1,14 / ky 1,00`.
- **Tinta.** O `brand-field` herda `color: oklch(0.985 0 0)` (globals.css:1705). Por isso **toda superfície desenhada declara a própria tinta**:
  - `DeviceFrameScreen`: `bg-background text-foreground`;
  - barra do navegador: `bg-muted text-muted-foreground`;
  - tela de bloqueio, ilha-aviso e barra de status: `text-foreground`, ou o par claro sobre `--device-bezel`.
  
  O teste de versões do `DeviceFrame` cobra isso.
- **Texto só em superfície opaca.** Sobre o arco-íris pousam só o wordmark, os pontos e, pela D2, as pílulas de nome dos cursores.
- **Uma peça de marca por tela, e ela é o campo.** Nada de `variant="brand"` no palco. Nenhum `CommandDialog`.

### Claro e escuro
- O campo é o mesmo nos dois temas.
- Cartões em `bg-card`, tela em `bg-background`, barra em `bg-muted`. A paleta usa a tinta de placa, opaca no palco (D1).
- A moldura do celular usa o token novo `--device-bezel`, quase preto nos dois temas.

### Tamanhos por container query
O palco é `container-type: size` com o nome `showcase`.

**Larguras do aside.** O aside ocupa 5fr de 11fr, menos 20px. O nível XS é o normal em notebook pequeno.

| Nível | Largura do palco | Janela típica (estimada; medir no preview) | Cartões | Cartão | Frase | Herói |
|---|---|---|---|---|---|---|
| XS | menor que 28rem | 768–1030px (1024px dá ~445px) | 3 (s0–s2) | `w-44` | `text-xs` | Navegador a 92cqw; mini UI em uma coluna; chip escondido |
| S | 28–36rem | 1030–1300px | 6 (s0–s5) | `w-48` | `text-xs` | Completo |
| M | 36–48rem | 1300–1720px | 9 (s0–s8) | `w-56` | `text-sm` | Completo |
| L | 48rem ou mais | acima de 1720px | 12 (s0–s11) | `w-56` | `text-sm` | Completo; paleta até 28rem |
| Baixo (`showcase-short`, altura < 44rem) | — | janelas de ~740px de altura ou menos | Some s5, s6 e s9 | — | — | Celular a 70cqh; pontos a 3cqh do pé |

**A mini UI do navegador é desenhada para cerca de 480px de largura**, que é o navegador a 1280×800, nos tamanhos reais do DS. Ela nunca usa `transform: scale()`, porque a medição de layout do motion quebra sob ancestral escalado.

---

## 3. Cena por cena

### Data fictícia única
**"Hoje" é quinta-feira, 9 de outubro, 9:41.** Todo rótulo relativo deriva dessa data. Não se usa `Date`.

### O mundo comum: `AuthMiniApp`
Todo valor passa por `MoneyDisplay`. Em `xl`/`2xl` o `MoneyDisplay` sempre leva `mono={false}`.

- **Pessoa:** "Você", com `Avatar size="xs"` e `AvatarFallback tint="soft"` "VC" (`identity-3`).
- **Saldo de outubro:** `MoneyDisplay value={4182.6} size="2xl" mono={false}`. Ao lado, `Badge variant="soft" tone="income" size="xs"` com "+7,8% vs setembro" (4.182,60 ÷ 3.880).
- **Entradas e saídas:** R$ 7.850,00 e R$ 3.667,40. A diferença fecha com o saldo.
- **Gráfico:** `ChartSparkline variant="area"`, com 12 pontos do saldo de cada mês nos últimos 12 meses: 1.020, 1.480, 1.310, 2.150, 2.040, 2.690, 2.580, 3.120, 3.460, 3.390, 3.880, 4.182,60. Não tem eixos, tooltip nem `animate-ping`; é o mesmo gráfico do `StatCardChart`.
- **Próximas contas:** `ItemGroup variant="divided"` com `Item size="sm"` e `ColorTile tint="soft" size="xs"` (de `TILE_PALETTE`).

  | Ícone | Conta | Vencimento | Selo | Valor |
  |---|---|---|---|---|
  | `HomeIcon` | Aluguel | vence amanhã | — | R$ 2.150,00 |
  | `CreditCardIcon` | Fatura do cartão final 4821 | vence dia 12 | `Badge tone="warning" size="xs"` "em 3 dias" | R$ 1.284,60 |
  | `BoltIcon` | Energia | vence dia 18 | — | R$ 186,40 |

- **Selo de honestidade:** `Badge variant="soft" tone="neutral" size="xs"` "dados de exemplo", no cabeçalho, nas duas formas.
- **URL:** breadcrumb, nunca domínio. `LockClosedIcon` (16/solid) seguido de "Finance › Painel", "Finance › Fatura" ou "Finance › Carteiras › Casa".
- **Navegação:** slot `nav` do `DeviceFrame` com `HomeIcon`, `CreditCardIcon`, `ChartPieIcon` e `UsersIcon` (20/solid, `size-5`). No navegador é o trilho; no celular, a barra de abas.

### Login

**`login`** (também é o fallback do `Suspense`)
- Aparelho: navegador, desktop.
- Roteiro: o da seção 5.
- Colagem: família login. Pontos: capítulo 1 de 3.

**`login.session-expired`**
- Chip (`anchor="top-start"`): `Card padding="sm"` com `ColorTile` e `LockClosedIcon`, "Sessão encerrada" e "Seus dados continuam aqui".
- Roteiro curto: o cursor clica, digita "painel" e aparece a linha "Continuar de onde parou", com descrição "Painel · outubro". A paleta fecha e a mini UI fica no painel. Total ~3s.

**`login.password-updated`**
- Chip "Senha atualizada" / "Sessões antigas encerradas", com `ColorTile` (`TILE_INCOME_DEFAULT`) e `CheckIcon`. Usa `layoutId="auth-success-chip"`, o mesmo da `recovery.done`, então não se move no redirecionamento.
- Roteiro curto: digita "segurança" e aparecem "Senha alterada" (`Badge tone="success" size="xs"` "agora") e "Sessões ativas" ("1 aparelho"). A paleta fecha.

### Cadastro

**`register`** (também é o fallback)
- **Aparelho:** celular. Por link direto, o servidor já entrega o celular (D4).
- **Tela:** o painel no layout de telefone, mais o bloco "Orçamento · Casa", que entra depois da troca de forma:
  - `Progress bands={BUDGET_BANDS}` "Mercado", R$ 612,00 de R$ 900,00 (68%);
  - "Contas da casa", R$ 1.430,00 de R$ 1.600,00 (89%);
  - `AvatarGroup size="sm"` com Ana C. (`identity-1`), Rafael T. (`identity-5`) e você. O grupo carrega `data-showcase-anchor="budget"`.
- **Cursor:** "Você" (`tone={3}`) entra pela borda de baixo e pousa sobre "Mercado", sem clique. Ele para.
- **Chip** (`anchor="start"`): `ComputerDesktopIcon`, "Mesmo painel no computador" e `Badge tone="success" size="xs"` "sincronizado".
- Colagem: família cadastro. Pontos: capítulo 2, metade.

**`register.confirm`**
- A ilha se abre no aviso: `EnvelopeIcon`, "Confirme seu e-mail", "Toque no link para ativar sua conta" e "agora".
- O véu `bg-overlay` cobre a tela.
- O chip e o cursor saem. Pontos: capítulo 2, cheio.

**`register.confirm-invite`**
- Só quando `nextPath?.startsWith("/invites/accept")`.
- O aviso diz "Confirme e entre na Casa" e "Ana C. convidou você para a carteira", com um `AvatarGroup size="xs"`.

### Esqueci minha senha (no celular)

**`recovery.email`** (também é o fallback)
- **Aparelho:** celular. A camada de bloqueio desce sobre o painel.
- **Bloqueio:** "9:41" em `text-5xl font-semibold nums` (sans) e "quinta-feira, 9 de outubro" em `text-sm text-muted-foreground`.
- **Chip** (`anchor="hero-bottom"`): `Card variant="elevated" padding="sm"` com `Timeline orientation="horizontal" marker="icon"`:
  - `EnvelopeIcon` "Código enviado", que é o passo atual;
  - `KeyIcon` "Código conferido";
  - `LockClosedIcon` "Nova senha".
- Pontos: capítulo 3, 25%.

**`recovery.code`**
- A ilha vira o aviso: `KeyIcon`, "Mail · agora", "Seu código de acesso chegou" e "Use os 6 dígitos para continuar".
- Nenhum dígito aparece e não há `InputOTP`.
- Timeline: passo 2 atual. Pontos: 50%.

**`recovery.password`**
- O bloqueio sobe e mostra a tela "Nova senha".
- **O campo é desenhado:** um `div` com a borda e o raio de campo do DS, contendo `span`s "•", um por caractere, mais o `type-caret`. **Não há `<input>`.**
- O `PasswordRequirements` do app recebe "Casa*2026verão" letra a letra. São 14 caracteres e 14 pontos.
- Linha `Item` com `ShieldCheckIcon`: "Sessões em outros aparelhos serão encerradas".
- Timeline: passo 3. Pontos: 75%.

**`recovery.link-checking`**
- `Spinner` padrão e a linha `Item` "Conferindo seu link…".
- Timeline: passo 2.

**`recovery.link-expired`**
- Aviso apagado com `ClockIcon` (`TILE_EXPENSE_DEFAULT`), "Este link expirou" e "Peça um novo código". A tela vai a `opacity-60`.
- Timeline: passo 1 atual, os outros `upcoming`. Pontos: 25%.

**`recovery.done`**
- O celular volta a navegador.
- Chip "Senha atualizada" (`layoutId="auth-success-chip"`, `anchor="top-start"`). A timeline sai com todos os passos `done`.
- A colagem respira uma vez. Pontos: 100%.

### Convite

**`invite.loading`** (ocupado)
- Navegador, com a carteira em `Skeleton`/`SkeletonText` na mesma geometria. URL "Finance › Carteiras". Pontos: capítulo 1.

**`invite.idle`** ("Nada para fazer aqui")
- A carteira resolvida, sem cursores e sem chip. A tela fica a `opacity-60`, sem cartão de erro.

**`invite.gate`**
- `Card` com `CardToolbar variant="title"` "Carteira compartilhada · Casa".
- `AvatarGroup size="sm"` com Ana C., Rafael T. e `AvatarGroupAdd` (`data-showcase-anchor="avatar-add"`).
- Linhas:
  - Aluguel, R$ 2.150,00, "dividido por 3";
  - Internet, R$ 119,90 (`data-showcase-anchor="row-internet"`);
  - Feira de sábado, R$ 214,90.
- Cursores: "Ana" (`tone={1}`) entra pela borda direita e pousa no `avatar-add`. "Rafael" (`tone={5}`) já está pousado em `row-internet`. Os dois param.

**`invite.accepted`**
- O cursor "Você" (`tone={3}`) entra pela borda de baixo até `avatar-add`.
- O espaço vira o avatar "VC" com a mola do `AvatarGroup`.
- Chip (`anchor="bottom-end"`): "Você entrou na Casa".

**`invite.error`**
- Tela a 60%, cursores saem, e entra um `Card` com `LinkSlashIcon`, "Convite indisponível" e "Peça um link novo a quem convidou".

---

## 4. A janela que vira celular

### Construção
- **A moldura.** `DeviceFrame` é um `motion.div layout` que preenche a `ShowcaseHero`. O tamanho vem do CSS (`@utility showcase-stage`, por `data-form`), e a projeção de layout anima o `transform`.
- **O raio.**
  - O `DeviceFrame` renderiza duas sondas `<span hidden className="rounded-surface">` e `<span hidden className="rounded-modal">`.
  - Num `useLayoutEffect` de montagem lê `getComputedStyle(sonda).borderTopLeftRadius`, que já vem resolvido em px.
  - Passa o valor da forma atual a `style.borderRadius`, que é o que o motion corrige.
  - O token continua sendo a fonte, e nenhum número de raio fica no arquivo.
- **A tela.** `DeviceFrameScreen` é `motion.div layout` e corrige a distorção dos filhos. Toda peça da mini UI é `ShowcasePiece` (`layout="position"`): ela só translada, então o texto nunca estica. O que existe numa forma só entra e sai por `ShowcaseSwap` (`AnimatePresence mode="popLayout"`).
- **A forma vem do contexto.** A mini UI lê `form` por `useDeviceFrame()`, não por container query.
- **Barra e ilha são o mesmo elemento** (`layoutId` interno). As duas camadas trocam opacidade em 200ms. As três bolinhas neutras (`bg-foreground/15`) somem em 120ms.
- **Navegação que muda de lugar.** O slot `nav` (`{ icon, active }[]`) renderiza cada ícone num `motion.span layout="position" layoutId={"nav-" + i}`. No navegador é a coluna à esquerda; no celular, a linha `border-t` embaixo. Os ícones voam do trilho para a barra de abas. Trilho, barra de abas e barra de status são **partes desenhadas do `DeviceFrame`**, porque o `BottomBar` é `fixed … md:hidden` e não vive em mockup. Isso entra nas quatro perguntas.
- **Barra de status:** "9:41", `SignalIcon`, `WifiIcon` e `Battery100Icon` (16/solid). Entra a partir de 40% da troca.
- **Moldura do celular:** `bg-(--device-bezel)` com `p-1.5`. A tela usa `concentric`.
- **Ilha vira aviso.** Com `notification` no celular, a ilha se expande (layout, `MOLA`) num cartão `rounded-surface text-foreground bg-card`. No navegador, o slot é um cartão no canto superior direito da tela.
- **Giro.** O `rotateY` faz `[0, ∓6, 0]` em keyframes na mesma mola. O sinal segue a ordem das famílias `login(0) → invite(1) → register(2) → recovery(3)`: índice subindo é negativo, descendo é positivo. Login e convite não mudam de forma entre si. O palco é `perspective-distant`, e o `will-change` só existe durante o voo.
- **Recharts.** O DOM muda de tamanho uma vez, no começo da troca. O `ResponsiveContainer` do `ChartSparkline` redimensiona uma vez só.

### A mini UI nas duas formas (navegador desenhado para ~480px)

| Peça | Navegador | Celular |
|---|---|---|
| Cabeçalho (navegador, `ShowcaseSwap`) | `TopBar position="static" size="sm"` com `AppLogo`, título "Painel", `TopBarSearch listen={false} onOpen={noop}` (com `data-showcase-anchor="search"`) e o `Avatar` "VC". O selo "dados de exemplo" vai para a linha do saldo. | — |
| Trilho / abas | Slot `nav` à esquerda | Slot `nav` embaixo |
| Cabeçalho (celular) | — | "Outubro" `font-medium`, selo e `Avatar` |
| Saldo e gráfico | Uma linha com **dois cartões**: saldo (`Card padding="sm"`) e `ChartSparkline` (`h-16`) | Empilhados: saldo, depois sparkline `h-20` |
| Próximas contas | **2 linhas** (Aluguel, Fatura) abaixo da linha de cartões | 2 linhas |
| XS | Uma coluna: saldo, sparkline e 1 conta | — |

**Peças sem quebra de viewport.** O viewport real é desktop, então os `md:` do DS aplicam. Isso é aceitável quando só muda escala de texto ou recuo (`text-base md:text-sm`), porque o mockup inteiro fica na escala desktop. É proibido nas peças da forma celular qualquer componente cujo `md:` mude visibilidade ou layout:
- `TopBarSearch` (`hidden md:flex`), que fica só no navegador;
- `BottomBar`;
- qualquer `Timeline` com orientação responsiva.

A subtarefa 8b audita cada peça usada no celular (Card, Item, MoneyDisplay, Badge, Avatar, Progress, ColorTile, ChartSparkline, Timeline, Spinner, Skeleton) e registra a lista num comentário de `mini-app.tsx`.

**Verificação:** a 1280×800, nenhum `ItemTitle` ou `MoneyDisplay` fica truncado (`scrollWidth <= clientWidth`).

### Tempos

| Instante | O que acontece | Curva |
|---|---|---|
| 0 | A coluna troca ou desliza. Saem as peças da forma velha, a paleta (fantasma de volta), o chip e os cursores. | 150ms `SAIDA` |
| 80ms | A moldura, a tela, as peças e os ícones de navegação andam. Começa o giro. A barra vira ilha. | `MOLA_PALCO` `{ type: "spring", stiffness: 220, damping: 30 }`, ~650ms |
| ~340ms | Entram a barra de status, ou o cabeçalho no caminho de volta. | `MOLA` |
| ~400ms | Entra o chip. A colagem já se afasta desde 80ms. | `MOLA` |
| ~730ms | Repouso. O `DeviceFrame` emite `onSettled`, que o palco usa para medir as âncoras dos cursores. | — |

- **Movimento reduzido:** `MotionConfig reducedMotion="user"`. Layout e giro pulam; ficam as opacidades.
- **Caminho reserva** (se o spike reprovar): moldura `absolute` com `width`/`height` em transição `var(--duration-gentle) var(--ease-emphasized)` e `contain: layout paint`. O gráfico monta no `transitionend`.

---

## 5. O ⌘K sendo digitado

### Peças
- `Command variant="panel" shouldFilter={false} value={selecionada}`.
- `CommandInput value={digitado} caret placeholder=""`. Com o valor controlado, o `CommandHighlight` negrita o trecho casado (`command.tsx:951`).
- `CommandList`, `CommandGroup`, `CommandItem`. **Nunca `shortcut`**, porque ele pendura um `keydown` no `document` (`command.tsx:881-890`).
- Nas linhas: `CommandItemIcon`, `CommandItemContent`, `CommandItemTitle` com `CommandHighlight`, `CommandItemDescription` e `CommandItemMeta` com `MoneyDisplay size="sm"` e `Badge size="xs"`.
- `CommandShortcut` estático com `Kbd` "↵", e `CommandDock`.
- **Entrada da placa:** a `command-reveal` anima só as linhas e os títulos de grupo (globals.css:2446). A placa em si entra e sai pelo `ShowcaseFloat` do DS: entrada em `MOLA` (opacidade mais 8px), saída em 150ms `SAIDA`. As linhas cascateiam pela `command-reveal`.
- **Sem o passo "Enter aprofunda":** exigiria sobrescrever o `data-selected:bg-foreground/9`. O fechamento por si só marca o Enter.

### O voo da pílula: `ShowcaseFlight` (DS, dentro de `ui/showcase.tsx`)
```ts
<ShowcaseFlight layoutId="auth-search" active={boolean} className="rounded-full">
  {conteúdo real}
</ShowcaseFlight>
```
- Cada ponto de pouso é um `ShowcaseFlight` com o mesmo `layoutId`: um no cabeçalho, em volta do `TopBarSearch`, e outro no topo da paleta, em volta do `CommandInput`.
- Só o ponto `active` renderiza o fantasma: `motion.div layout layoutId`, `absolute inset-0 bg-popover ring-1 ring-foreground/10 rounded-full`, com o raio em px em `style`.
- O conteúdo real de um ponto inativo fica com `opacity-0`. O lugar continua ocupado, então o cabeçalho não pula.
- O conteúdo real do ponto ativo aparece em 150ms no `onLayoutAnimationComplete` do fantasma.
- O fantasma não tem texto, então nada estica: ele só muda de tamanho, de ~180px para até 28rem.

### O cursor
- **Prop nova `caret`** em `SearchInput`, repassada pelo `CommandInput`.
- Grade de uma célula: por cima do campo, `<span aria-hidden className="invisible whitespace-pre">{valor}</span><span className="type-caret"/>`, na mesma escala de texto.
- Quando `caret` está ligado, o campo nativo usa `caret-transparent`.
- **`@utility type-caret`:** `w-0.5 h-[1lh] bg-foreground`, visível no estilo base, piscando por `@keyframes caret-blink { 50% { opacity: 0 } }`, `steps(1)`, 1s, infinito, sem `fill`. No movimento reduzido ele congela aceso.

### Roteiro `palette-login`
`t` conta a partir da troca de cena. Na primeira carga, a partir da hidratação.

| t (ms) | Batida |
|---|---|
| 500 | O cursor "Você" (`tone={3}`) entra pela borda inferior direita do palco até a âncora `search` (`MOLA`, ~400ms). |
| 900 | Clique: o cursor encolhe e volta, e a pílula faz `scale` 0,97 e volta (`MOLA`). Se o ícone for `CursorArrowRaysIcon` (D9), ele aparece só aqui. |
| 1.000 | O fantasma voa do cabeçalho para a paleta (`MOLA_PALCO`) e pousa a 58% da altura do herói, com 80% da largura dele (máximo 28rem). O véu `bg-overlay` entra na tela em 200ms. O cursor sai em 150ms. |
| 1.250 | A placa entra (`ShowcaseFloat`) e as linhas cascateiam. O `CommandInput` aparece. |
| 1.400 | Digita "fatura" com os atrasos [70, 95, 60, 120, 80, 90]; termina em ~1.915. Grupo "Faturas": "Fatura de outubro", "cartão final 4821 · vence dia 12", `Badge tone="warning" size="xs"` "em 3 dias", R$ 1.284,60; e "Fatura de setembro", `Badge tone="success" size="xs"` "paga", R$ 1.102,35. Grupo "Ações": "Pagar fatura" com `CommandShortcut` ↵. "Fatura de outubro" fica selecionada. |
| 2.400 | A paleta fecha: a placa sai em 150ms e o fantasma volta ao cabeçalho. O véu sai. |
| 2.650 | `ShowcaseSwap effect="rise"` troca a tela para "Fatura de outubro": `DescriptionList` com "Fechou" 05/10, "Vence" 12/10 e "Limite usado" com `Progress` a 38%; depois as linhas Mercado do bairro (28/09) R$ 186,32, Streaming (22/09) R$ 39,90 e Farmácia (02/10) R$ 72,15. URL "Finance › Fatura". |
| 3.050 | **(D8)** O navegador encolhe até celular, e a fatura se reorganiza no bolso (`MOLA_PALCO`, ~650ms). |
| 4.000 | **(D8)** Volta ao navegador. |
| ~4.650 | Repouso. **Total abaixo de 5s.** Não repete. Sem D8, o repouso fica em ~3.050. |

Os roteiros `palette-session` e `palette-security` seguem o mesmo esqueleto sem D8: cursor, clique, uma consulta, fechar e o painel, em cerca de 3s.

O roteiro `masked-password` (`recovery.password`) começa em +300ms e digita 14 caracteres em ~1,4s.

### Quando toca
- Uma vez por entrada na cena.
- Só com `useShowcase().active`, que é `useInView` sobre o palco. No telefone o aside é `display:none`, e o roteiro nunca começa.
- `document.visibilityState === "hidden"` leva ao estado final.
- **Pulo pelo foco:** um `focusin` em `[data-slot=split-shell-main]` só pula quando o `e.target` casa `input, textarea, select, button, a, [role=combobox]` e não é `[tabindex="-1"]`. O foco programático no `H1` não pula. O pulo vale só para o roteiro **em execução**, sem marca permanente por cena.
- A troca de cena cancela os timers.

### Motor: lógica pura, gancho fino
- **`src/lib/scene-script.ts`** (puro, testável em `environment: "node"`):
  ```ts
  type ScriptBeat = "cursor" | "press" | "open" | "type" | "select" | "close" | "swap" | "morph" | "morph-back" | "done"
  type ScriptFrame = { at: number; beat: ScriptBeat; text?: string; selected?: string }
  type ScriptState = { status: "idle" | "running" | "done"; index: number }
  type ScriptEvent = { type: "start" } | { type: "tick" } | { type: "skip" } | { type: "hidden" } | { type: "scene" }
  export function planScript(script: SceneScriptId): ScriptFrame[]
  export function frameAt(plan: ScriptFrame[], index: number): ScriptFrame // acumula text/selected até o índice
  export function finalFrame(plan: ScriptFrame[]): ScriptFrame             // movimento reduzido, skip e hidden
  export function reduceScript(state: ScriptState, event: ScriptEvent, plan: ScriptFrame[]): ScriptState
  ```
  O tremor dos atrasos é uma tabela fixa, sem `Math.random` nem `Date`.
- **`src/hooks/use-scene-script.ts`**:
  ```ts
  function useSceneScript(script: SceneScriptId | null, opts: { active: boolean; reduced: boolean }):
    { frame: ScriptFrame; skip(): void }
  ```
  É uma cadeia de `setTimeout` que despacha `tick` e limpa na desmontagem ou ao trocar `script`. Com `reduced`, devolve `finalFrame` direto. Fica em cerca de 14 renders por segundo, só na subárvore da paleta, com `AuthMiniApp` em `memo`.
- **Carga:** `palette-demo.tsx` entra por `next/dynamic(() => import(...), { ssr: false })` dentro do `AuthShowcase` (cliente; o `ssr: false` é proibido só em Server Component, `lazy-loading.md:94`). Só é pedido quando `active` fica verdadeiro, então o telefone nunca baixa o cmdk.

### Movimento reduzido
Mostra um quadro só: a paleta aberta em "fatura", com "Fatura de outubro" selecionada e o cursor aceso, sobre o painel. A D8 não roda.

### Inerte
- `ShowcaseStage` com `inert` e `aria-hidden`.
- Nenhum `autoFocus`. `TopBarSearch` sempre com `listen={false}`.
- O único `<input>` do palco é o do cmdk, com `id` automático.

---

## 6. A colagem de depoimentos ilustrativos

### Posições (`SHOWCASE_SLOTS` em `ui/showcase.tsx`)
`x` e `y` são o centro do cartão em % do palco. `edge` é a borda que corta o cartão. `delay` é o `--slot-delay`.

| Slot | x, y | rot | profundidade | edge | a partir de | some no "baixo" | delay |
|---|---|---|---|---|---|---|---|
| s0 | 84, 9 | +6° | near | top | XS | — | 0 |
| s1 | 6, 88 | −7° | near | start | XS | — | 25 |
| s2 | 92, 86 | +4° | mid | end | XS | — | 50 |
| s3 | 97, 40 | −5° | far | end | S | — | 75 |
| s4 | 2, 30 | +5° | mid | start | S | — | 100 |
| s5 | 50, 97 | −2° | far | bottom | S | sim | 125 |
| s6 | 60, 4 | −4° | mid | top | M | sim | 150 |
| s7 | 3, 62 | −3° | far | start | M | — | 175 |
| s8 | 98, 66 | +7° | mid | end | M | — | 200 |
| s9 | 30, 96 | +3° | mid | bottom | L | sim | 225 |
| s10 | 76, 98 | −6° | far | bottom | L | — | 250 |
| s11 | 99, 14 | −8° | far | end | L | — | 275 |

**Afastamento e camadas.**
- O invólucro **de fora** (irmão dos outros dentro de `ShowcaseScatter`) recebe o `translate` do afastamento (`calc((var(--slot-x) - 50) * (var(--clear-kx) - 1) * 1cqw) …`) em `var(--duration-spring) var(--ease-spring)`, com atraso `var(--slot-delay)`.
- O de fora também recebe a entrada `showcase-enter`, com o mesmo `--slot-delay`. Não usa a `stagger-ladder`, cujo `:nth-child` não funciona aqui.
- O invólucro **de dentro** leva `rotate` e o respiro (`scale` por keyframes). Como não há escala de profundidade, nada colide.

### O cartão (`AuthTestimonialCard`, camada do app)
- `Card variant="elevated" padding="sm"`, com a largura do nível.
- Lê o `data-edge` publicado pelo `ShowcaseScatterItem` (variante `group-data-[edge=…]`) e põe o selo do lado voltado para o centro do palco:
  - `edge="end"`: selo à **esquerda**, no topo (`me-auto`, ordem antes do nome);
  - `edge="start"`: selo à direita, no topo (`ms-auto`);
  - `edge="top"`: selo na **linha de baixo**, depois da frase;
  - `edge="bottom"`: selo no topo, à direita.
- Linha do autor: `Avatar size="xs"` com `AvatarFallback tint="soft"` (`identityToneFor(null, nome)`) e o nome em `text-xs font-medium`.
- A frase entre aspas curvas, em `leading-snug text-pretty`, com no máximo três linhas.
- Sem nota, sem total, sem empresa, sem dinheiro, sem dígitos.
- **Verificação:** em cada nível, o retângulo de todo selo visível fica dentro do retângulo do palco.

### As 14 frases
1. Marina S.: "Quitei o cartão sem pressa. Ver a fatura crescer dia a dia mudou meu mês."
2. Lucas P.: "Dividir o aluguel com a Bia virou um clique. Acabou a planilha no grupo."
3. Camila R.: "Achei três assinaturas que eu nem lembrava. Cancelei todas no mesmo dia."
4. Caio R.: "Coloquei um teto pro mercado e cheguei no fim do mês com folga."
5. Juliana M.: "Agora sei o dia em que a fatura fecha e compro depois dele."
6. Thiago N.: "Eu e minha esposa vemos a mesma carteira. Ninguém mais pergunta quem pagou."
7. Diego F.: "Primeira vez que chego no fim do mês sabendo para onde foi cada real."
8. Lúcia F.: "O aviso chega antes do vencimento. Nunca mais paguei multa na conta de luz."
9. André V.: "Separei a reserva de emergência aos poucos e não mexi mais nela."
10. Beatriz N.: "Parcelo menos desde que vi todas as parcelas juntas numa tela só."
11. Gabriel O.: "Uso no computador no trabalho e no celular no mercado. É a mesma conta."
12. Renato C.: "Chamei minha mãe pra carteira da casa. Ela lança a feira pelo celular."
13. Helena B.: "Esqueci a senha e voltei com um código no e-mail, sem chamar ninguém."
14. Patrícia O.: "Troquei de celular e entrei de novo em segundos. Estava tudo lá."

### Distribuição

| Família | s0 | s1 | s2 | s3 | s4 | s5 | s6 | s7 | s8 | s9 | s10 | s11 | Trocam vindo do login |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| login | 1 | 5 | 7 | 3 | 10 | 8 | 9 | 2 | 4 | 6 | 11 | 14 | — |
| cadastro | 1 | 11 | 7 | 3 | 4 | 8 | 9 | 12 | 10 | 6 | 5 | 14 | s1, s4, s7, s8, s10 |
| recuperação | 13 | 5 | 7 | 3 | 14 | 8 | 9 | 2 | 4 | 6 | 11 | 10 | s0, s4, s11 |
| convite | 1 | 12 | 7 | 6 | 10 | 8 | 9 | 2 | 4 | 3 | 11 | 14 | s1, s3, s9 |

### Movimento
- **Troca de família.** A chave do item é o id da frase.
  - Saída: opacidade 0, `rotate` +2° e `scale` 0,97, em 160ms `SAIDA`.
  - Entrada: `MOLA`, a partir de 8px mais para fora, com escalonamento de 50ms e teto de 4. Começa 200ms depois da troca.
- **Troca de passo dentro da família:** nada muda.
- **Respiro** (só em `recovery.done`): uma vez, `@keyframes showcase-ripple { 50% { scale: 1.04 } }` no invólucro de dentro, com `animation-delay: var(--slot-delay)`.
- **Ocioso:** nada.

---

## 7. Coreografia

### Primeira carga
- O HTML do servidor já é o quadro final da cena padrão. O painel mora no layout, fora do `Suspense`, então não monta duas vezes.
- A entrada é só CSS (`showcase-enter`, que reaproveita `rise`):
  1. colagem com `--slot-delay`;
  2. herói com +120ms;
  3. pontos com +300ms.
- No movimento reduzido, os atrasos vão a 0 com `!important`.
- Todo `AnimatePresence` usa `initial={false}`.
- O gráfico monta quando `active` fica verdadeiro, com o desenho de entrada do Recharts, numa caixa de altura fixa.
- O roteiro começa a 500ms da hidratação.
- **Com `?reason=`**, o chip entra em `MOLA` depois da hidratação.

### A coluna nas trocas de rota
Numa troca de rota a coluna velha some sem saída, e a nova entra deslizando (`split-shell-step`). Para que isso valha nos dois sentidos, o `LoginForm` passa `step={reason ?? "default"}`, e hoje ele não passa nenhum. É só entrada, de propósito. O painel responde 80ms depois.

### Todas as transições

| Origem → destino | Sai | Entra | Vira | Tempo e curva |
|---|---|---|---|---|
| login → cadastro | Paleta (o fantasma volta), chip, cursor, cabeçalho | Barra de status; bloco "Orçamento · Casa" (+250ms); cursor (+450ms); chip (+400ms) | Navegador → celular; URL → ilha; trilho → abas | Saídas 150ms `SAIDA`; moldura `MOLA_PALCO`; entradas `MOLA` com escalonamento de 50ms; 5 trocas de cartão mais afastamento |
| cadastro → login | Chip, cursor, orçamento | Cabeçalho; roteiro (+500ms) | Celular → navegador (giro +) | Inverso |
| login → esqueci | Paleta, chip, cursor, cabeçalho | Bloqueio desce (+350ms); timeline (+400ms) | Navegador → celular | Bloqueio 300ms `--ease-emphasized`; 3 trocas de cartão |
| esqueci → login | Timeline, bloqueio (sobe 200ms) | Cabeçalho, roteiro | Celular → navegador | Inverso |
| login ↔ convite | Paleta, chip, cursor | Carteira (esqueleto ou porta), cursores | — (mesma forma) | 150ms / `MOLA`; 3 trocas |
| e-mail → código | — | Aviso | Ilha → aviso | `MOLA`; a timeline anima sozinha |
| código → e-mail | Aviso | — | Aviso → ilha | 150ms `SAIDA` |
| código → nova senha | Aviso, bloqueio | "Nova senha"; digitação (+300ms) | O bloqueio sobe | 300ms `--ease-emphasized` |
| nova senha → senha atualizada | Timeline, "Nova senha" | Chip de sucesso (+450ms); respiro | Celular → navegador | `MOLA_PALCO` mais `MOLA` |
| senha atualizada → /login?reason=password-updated | — | Roteiro "segurança" (+500ms) | O chip fica | Família login |
| conferindo → nova senha / expirado | `Spinner` | Tela / aviso apagado | Ilha → aviso | `MOLA`; escurece em 300ms `--ease-out` |
| expirado → /forgot-password | Aviso | Bloqueio limpo | — | 150ms / `MOLA` |
| cadastro → confirme | Chip, cursor | Aviso, véu | Ilha → aviso | `MOLA`; a coluna foca o `H1` |
| convite: carregando → porta / ocioso | Esqueleto (200ms) | Carteira; cursor Ana (+200ms, só na porta) | — | `MOLA`; os cursores medem depois do `onSettled` |
| porta → aceito | — | Cursor "Você" (+150ms), avatar, chip (+500ms) | Espaço → avatar | Mola do `AvatarGroup` |
| qualquer → erro do convite | Cursores | `Card` de erro | Tela a 60% | 300ms `--ease-out`, depois `MOLA` |
| Pontos | — | — | A pílula ativa muda (`layoutId`) e o preenchimento muda de largura | `MOLA` |
| Interrupção | `popLayout` solta o que sai; `reduceScript(scene)` cancela | — | As molas recomeçam do valor atual | Nada se acumula |

### Ocioso
- O único laço é o cursor da paleta aberta, que some antes de 5s.
- Os cursores de presença chegam e param.
- Nenhum `requestAnimationFrame`.

### Movimento reduzido
- Layout, giro e deslocamentos pulam, e ficam as opacidades.
- Os roteiros mostram o quadro final.
- Os cursores aparecem já pousados.

### Convivência com a coluna
- O `key={step}`, o deslizamento e o foco no `H1` ficam na página.
- O painel nunca recebe foco. O foco programático no `H1` não dispara o pulo do roteiro (seção 5).

---

## 8. Arquitetura

### Continuidade entre rotas (opção a′)
```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSignedInRedirect>
      <AuthFrame>{children}</AuthFrame>
    </AuthSignedInRedirect>
  )
}
```

**`src/components/layout/auth-frame.tsx`** (cliente):
- Provê `AuthSceneProvider`.
- Renderiza `<SplitShellRoot side="end" asideMobile="logo" aside={<AuthBrandPanel><AuthShowcase scene={cena}/></AuthBrandPanel>}>{children}</SplitShellRoot>`.
- Calcula `cena = publicada ?? defaultSceneFor(usePathname())`. Nunca usa `useSearchParams`.

| Caminho | Cena padrão |
|---|---|
| /login | `login` |
| /register | `register` |
| /forgot-password | `recovery.email` |
| /reset-password | `recovery.link-checking` |
| /invites/accept | `invite.loading` |

### A divisão do `SplitShell` (precisa de aprovação, Fase 0)
- **`SplitShellRoot`:** as linhas 115-145 e 194-196 de hoje. Props `aside`, `side`, `ratio`, `asideMobile`, `className`.
- **`SplitShellMain`:** as linhas 151-193 mais o foco das linhas 105-113. Props `title`, `description`, `media`, `back`, `footer`, `step` e `children`.
- **`SplitShell`** passa a ser `<SplitShellRoot><SplitShellMain/></SplitShellRoot>`. As strings de `split-shell-versions.test.ts` continuam valendo.
- `RECOLHE_COM_O_TECLADO` continua funcionando.

### O `AuthShell` só com a coluna
```ts
export function AuthShell(props: {
  scene: AuthSceneId
  title: string
  description?: ReactNode
  icon?: "mail" | "done" | "expired" | "invite"
  back?: ReactNode
  footer?: ReactNode   // continua DEPOIS de children, dentro do corpo; nunca vai para o slot footer do SplitShellMain
  step?: string | number
  children?: ReactNode
})
```
- Renderiza `<SplitShellMain …>{children}{footer}</SplitShellMain>`, como em `auth-shell.tsx:53-55`, e chama `useAuthScene(scene)` (`useLayoutEffect` publica e limpa).
- **`auth-status.tsx` é apagado.** Todo ramo devolve `<AuthShell>` no mesmo lugar da árvore. Os ramos de status levam `step` explícito: `"confirm"`, `"done"`, `"link-expired"`, `"gate"`, `"accepted"` e `"idle"`.
- **`signup-form.tsx`** escolhe `register.confirm-invite` e o texto do `Alert` "volta para concluir o convite" só quando `nextPath?.startsWith("/invites/accept")`.

### Do formulário ao painel

| Formulário | Estado | Cena |
|---|---|---|
| `login-form.tsx` | `reason` (e `step={reason ?? "default"}`) | `login`, `login.session-expired`, `login.password-updated` |
| `signup-form.tsx` | formulário | `register` |
| | confirme | `register.confirm`, ou `register.confirm-invite` com next de convite |
| `password-recovery-form.tsx` | passo | `recovery.email`, `.code`, `.password`, `.done` |
| | `linkValid === null` | `recovery.link-checking` |
| | `linkValid === false` | `recovery.link-expired` |
| `invites/accept/page-client.tsx` | ocupado | `invite.loading` |
| | ocioso | `invite.idle` |
| | porta, erro, aceito | `invite.gate`, `invite.error`, `invite.accepted` |
| As 5 `page.tsx` | fallback | Só o id |

### Tipos de cena (`scene-context.tsx` e `scenes.ts`): o contrato das subtarefas 8b–8g
```ts
export type AuthSceneId =
  | "login" | "login.session-expired" | "login.password-updated"
  | "register" | "register.confirm" | "register.confirm-invite"
  | "recovery.email" | "recovery.code" | "recovery.password"
  | "recovery.link-checking" | "recovery.link-expired" | "recovery.done"
  | "invite.loading" | "invite.idle" | "invite.gate" | "invite.accepted" | "invite.error" // 17

export type SceneFamily = "login" | "invite" | "register" | "recovery" // ordem do giro: 0..3
export type SceneScreen =
  | "dashboard" | "invoice" | "budget" | "lock" | "new-password" | "link-checking"
  | "wallet-loading" | "wallet"
export type SceneOverlay =
  | "none" | "notice-confirm" | "notice-confirm-invite" | "notice-code"
  | "notice-expired" | "invite-error" | "dim"
export type SceneChip =
  | "none" | "session-expired" | "success" | "synced" | "timeline" | "invite-accepted"
export type SceneCursor = {
  name: "Você" | "Ana" | "Rafael"; tone: 1 | 3 | 5
  anchor: "search" | "budget" | "avatar-add" | "row-internet"
  from: "end" | "bottom" | "top" | "start"; delay: number; click?: boolean
}
export type SceneScriptId = "palette-login" | "palette-session" | "palette-security" | "masked-password"
export type SceneSpec = {
  family: SceneFamily
  form: "browser" | "phone"
  screen: SceneScreen
  overlay: SceneOverlay
  chip: SceneChip
  timeline?: { current: 0 | 1 | 2 | 3; expired?: boolean }
  cursors: SceneCursor[]          // o cursor do roteiro do login é dirigido pelo script, não daqui
  dots: { chapter: 0 | 1 | 2; fill: 0.25 | 0.5 | 0.75 | 1 }
  script: SceneScriptId | null
  celebrate?: boolean
}
export const SCENES: Record<AuthSceneId, SceneSpec>
```

### Arquivos

**Criar, camada do app** (nenhum importa `motion`):

| Caminho | Conteúdo |
|---|---|
| `src/components/layout/auth-frame.tsx` | Frame persistente |
| `src/components/auth/showcase/scene-context.tsx` | Tipos, `AuthSceneProvider`, `useAuthScene`, `defaultSceneFor` |
| `src/components/auth/showcase/scenes.ts` | `SCENES` (a única tabela a editar) |
| `src/components/auth/showcase/auth-showcase.tsx` | Orquestração: 80ms, celebração, `useShowcase().active`, filtro do `focusin`, `next/dynamic` da paleta |
| `src/components/auth/showcase/mini-app.tsx` | Painel nas duas formas, fatura, carteira e esqueleto; lista das peças sem quebra de viewport |
| `src/components/auth/showcase/phone-screens.tsx` | Bloqueio, avisos, "Nova senha" (campo desenhado), conferindo, expirado, timeline |
| `src/components/auth/showcase/palette-demo.tsx` | `Command` com `useSceneScript` |
| `src/components/auth/showcase/testimonials.tsx` | Frases, distribuição, `AuthTestimonialCard` |
| `src/components/auth/showcase/showcase.test.ts` | Seção 9, 8a e 8h |

**Criar, lógica:**
- `src/lib/scene-script.ts` e `src/lib/scene-script.test.ts`;
- `src/hooks/use-scene-script.ts`, que é só o executor.

**Criar, DS:**
- `ui/device-frame.tsx`, `ui/showcase.tsx`, `ui/presence-cursor.tsx`;
- os `-versions.test.ts` deles e `search-input-versions.test.ts`;
- `src/app/designsystem/docs/{device-frame,showcase,presence-cursor}.tsx`.

**Modificar:**

| Arquivo | Mudança |
|---|---|
| `src/components/ui/split-shell.tsx` | Root e Main |
| `src/components/ui/search-input.tsx`, `command.tsx` | `caret` |
| `src/app/globals.css` | Abaixo |
| `src/lib/spring.ts` | `MOLA_PALCO` e `SAIDA = { duration: 0.15, ease: [0.65, 0, 0.35, 1] }`, espelho de `--ease-in-out` |
| `src/app/(auth)/layout.tsx` | Layout e comentário de contrato |
| `auth-shell.tsx`, `auth-brand-panel.tsx` | Só a coluna; recorte; `AppWordmark className="relative z-10"` |
| Os 4 formulários e as 5 `page.tsx` | Id de cena, `AuthShell icon`, `step` do login, condição do convite |
| `auth-shell.test.ts`, `split-shell-versions.test.ts`, `command-versions.test.ts` | Seção 9 |
| `registry.ts` | `DeviceFrame` e `PresenceCursor` (camada que o `taxonomy.test.ts` aceitar), `Showcase` como **Organismo** |
| `docs/split-shell.tsx`, `docs/search-input.tsx`, `docs/command.tsx` | Documentação |
| `AGENTS.md` | Bullets e a exceção do gráfico (Fase 10) |
| `docs/JORNADAS.md` (linhas 99-103 e 190), `docs/atlas/template.html:441` | "A casca vive no layout de (auth); o formulário publica o id da cena." Depois, `python3 docs/atlas/build.py` e republicar o Atlas como em 53c6c33. |
| `docs/design/HISTORICO-DESIGN-SYSTEM.md` | Rodada 254 ou a próxima livre |

**Apagar:** `src/components/auth/auth-status.tsx` e `src/components/auth/scenes/*`.

### Componentes novos do DS
Nascem completos segundo `COMPONENTE-NOVO.md`.

| Nome | Camada | API | Compõe | Teste e docs |
|---|---|---|---|---|
| **`DeviceFrame`**, `DeviceFrameSkeleton`, `useDeviceFrame` | Átomo; sobe para Molécula se o `taxonomy.test.ts` cobrar pelo `Skeleton` | `form`, `url?`, `notification?`, `nav?: { icon: HeroIcon; active?: boolean }[]`, `onSettled?()`, `className`, `children` | Barra ↔ ilha, trilho ↔ abas, barra de status, ilha → aviso, giro, sondas de raio, `@container/screen` | Proíbe `<img>`, `next/image`, rAF e raio em número. Exige `text-foreground` na tela e nas superfícies, `data-form`, as sondas `rounded-surface`/`rounded-modal` e `useReducedMotion`. Docs: Eixo `form` (trocar anima, com a `DocNote` da exceção), Interruptores `url`/`notification`/`nav`, iPhone, esqueleto, `PropsTable` |
| **`Showcase`** | **Organismo** | `ShowcaseStage` (`inert`, `aria-hidden`, `data-opaque`, `container-type: size`, `perspective-distant`, `MotionConfig`, `LayoutGroup`, `useShowcase(): { active; settled; anchorRect(id) }`); `ShowcaseHero form`; `ShowcaseScatter clear` + `ShowcaseScatterItem slot itemKey` (publica `data-edge`); `ShowcaseFloat anchor` (com presença: entrada `MOLA`, saída `SAIDA`); `ShowcaseFlight layoutId active`; `ShowcasePiece`; `ShowcaseSwap swapKey effect`; `ShowcaseCursor name tone anchor from delay click` (mede `[data-showcase-anchor]` em relação ao palco depois do `settled` e a cada mudança do `ResizeObserver` do palco, e posiciona um `PresenceCursor` na camada flutuante); `ShowcaseDots count active fill` | `DeviceFrame`, `PresenceCursor`, motion | Exige `inert`/`aria-hidden`, `reducedMotion="user"`, 12 slots com `edge` e `delay`. Proíbe `blur`, `opacity-` e `scale-` nos itens da colagem, e rAF. Docs: palco genérico, mais a seção "No app" com o Eixo das 17 cenas |
| **`PresenceCursor`** | Átomo | `name`, `tone: 1..6`, `at: { x: number; y: number }` (px no pai posicionado), `from?`, `pressed?` | Ponteiro (D9) e uma pílula `rounded-full rounded-tl-xs` com a `@utility identity-N`; `layout` em `MOLA` | Exige o par de identidade e o movimento reduzido; contraste por `identity-contrast.mjs` |
| **`caret`** em `SearchInput`/`CommandInput` | Mudança em existente | `caret?: boolean` | Reflexo invisível mais `type-caret` | `search-input-versions.test.ts` novo e asserção em `command-versions.test.ts`; Interruptor nos docs |
| **`SplitShellRoot` + `SplitShellMain`** | Mudança em template existente | Acima | — | Seção "Aside persistente no layout" |

### `globals.css`
- **Tokens:** `--device-bezel` e `--device-bezel-edge` em `:root` e `.dark`.
- **Variante:** `@custom-variant showcase-short (@container showcase (height < 44rem));`.
- **Escopo opaco (D1):**
  - `reduced-transparency` ganha o ramo `&:is([data-opaque][data-opaque] *) { @slot; }`;
  - `glass-surface` ganha `&:is([data-opaque][data-opaque] *) { backdrop-filter: none; -webkit-backdrop-filter: none; }`.
  - A especificidade (0,3,0) vence (0,2,0) por construção, e o spike mede no escuro.
- **Utilities novas,** depois de `no-scrollbar`, perto de `split-shell-step`, fora do bloco das sobreposições:
  - `caret-blink` e `type-caret`;
  - `showcase-enter` (`rise`, com `animation-delay: var(--slot-delay, 0s)` e o atraso zerado com `!important` no movimento reduzido);
  - `showcase-stage` (tamanhos do herói por `data-form` em `cqw`/`cqh`, documentados);
  - `showcase-ripple`.
- Nenhum segundo `@keyframes rise`. Nenhum `animate-[…]`.

### O que NÃO fazer
- Nenhum componente em `src/app/`.
- Nenhuma imagem, MacBook, three.js ou Spline.
- Nenhum `experimental.viewTransition`.
- Nenhum `useSearchParams` no frame.
- Nenhum `motion` em `components/auth/`.
- Nenhum `shortcut=`. `TopBarSearch` nunca com `listen` ligado.
- Nenhum `InputOTP`.
- No palco, nenhum `<input>` além do cmdk, e nenhum `<form>`, `type="password"`, `id=`, `name=` ou `<Alert`.
- Nenhum `transform: scale()` de tela.
- Nenhuma sombra na paleta.
- Nenhum `ChartArea marker`.
- Nenhuma cor crua e nenhum raio em número.
- Nenhum `variant="brand"`.
- Nenhum `brand-lava`.
- Nenhum rAF.
- Nunca submeter formulário de acesso.

---

## 9. Fases de implementação

Cada fase vira tarefas para subagentes, com revisão por tarefa. Toda fase roda `npx tsc --noEmit`, `npm run lint` e `npx vitest run`. Os testes de lógica são de funções puras, porque o vitest roda em `environment: "node"`. Nenhuma dependência nova.

**Fase 0: decisões.**
- D1 a D9 já estão fechadas (seção 10).
- **Perguntas de impacto** sobre mudanças em peças existentes, que a aprovação de componentes novos não cobre:
  - a divisão do `SplitShell`;
  - o `caret`;
  - o ramo novo do `reduced-transparency`;
  - o ramo `data-opaque` do `glass-surface`;
  - a variante `showcase-short`;
  - a exceção do gráfico no AGENTS.
- Listar o desvio das bolinhas neutras.
- As quatro perguntas de `DeviceFrame` (incluindo trilho, abas e barra de status como partes desenhadas), `Showcase` e `PresenceCursor`.
- **Entrega:** respostas registradas no histórico.

**Fase 1: spike descartável** (rascunho no catálogo).
- **Montagem:** a moldura `layout` com `rotateY` sob `perspective-distant`, filhos `layout="position"`, sondas de raio, `ChartSparkline`, `ShowcaseFlight` com um `TopBarSearch` e um `CommandInput`, e o slot `nav` trocando de lugar.
- **Critérios:**
  - sem salto na medição;
  - cantos sem distorção durante o voo, confirmado por captura no meio da animação;
  - texto nítido em repouso;
  - um único resize do Recharts;
  - fantasma sem texto esticado;
  - no escuro, a placa com `[data-opaque]` medida em `getComputedStyle` com alfa 1;
  - `caret` alinhado em `text-base` e `md:text-sm`.
- **Saída:** "projeção aprovada" ou "caminho reserva".

**Fase 2: continuidade e foco** (sem visual novo).
- **Trabalho:**
  - Root e Main, `AuthFrame`, `scene-context`;
  - `AuthShell` só com a coluna e `AuthStatus` apagado;
  - os 4 formulários (com o `step` do login, `invite.idle` e a condição do convite) e as 5 páginas;
  - o `AuthShowcase` provisório mapeando ids para as cenas antigas.
- **Testes de fonte:**
  - `split-shell-versions` exporta Root e Main;
  - `auth-shell.test.ts`: `asideMobile="logo"` mora em `auth-frame.tsx`; nenhum `<AuthStatus` e nenhum import de `auth-status`; cada ramo de retorno dos formulários é `<AuthShell` com `scene="`; nenhum `useSearchParams` no frame; `auth-shell.tsx` tem `{children}` antes de `{footer}` e não passa `footer=` ao `SplitShellMain`; `signup-form.tsx` contém `startsWith("/invites/accept")`.
- **Verificação ao vivo** (só navegação, deslogado):
  - de /login para /forgot-password a `stat-card-reveal` não toca de novo;
  - o painel continua o mesmo nó (marcar `data-probe` pelo console e conferir depois da navegação);
  - `/invites/accept?token=x` deslogado é seguro (define `authGate` antes de qualquer rede, `page-client.tsx:58-63`) e mostra a porta, com `activeElement` = `H1` depois da troca de passo;
  - `/reset-password` sem token mostra conferindo e depois expirado, com foco no `H1`;
  - em `next build && next start`, o painel está no HTML e entra uma vez só.

  Os focos de confirm, done e accepted não são alcançáveis sem submeter; ficam cobertos pelo teste de fonte.

**Fase 3: fundações.**
- **Trabalho:** tokens, `MOLA_PALCO`, `SAIDA`, as utilities, a variante e o escopo opaco.
- **Testes:**
  - `type-caret` com estilo base visível e keyframes sem `forwards`/`both`;
  - utilities depois de `no-scrollbar`;
  - `glass.test.ts`, `overlay-motion.test.ts` e `ds:catalog` passam.

**Fase 4: `DeviceFrame`** (nascimento completo).
- **Verificação no catálogo:**
  - as duas formas, a troca animada, o `nav` mudando de lugar e o aviso;
  - os dois temas, o iPhone e o console limpo;
  - raio em px por `getComputedStyle`;
  - nenhum texto branco sobre branco no claro.

**Fase 5: `Showcase`** (nascimento completo; a seção "No app" fica vazia).
- **Verificação:**
  - os níveis a 330, 480, 640 e 900px de largura, e o "baixo" com 660px de altura;
  - afastamentos;
  - `element.inert`;
  - os selos dentro do palco em todo nível.

**Fase 6: `PresenceCursor` e `caret`.**
- **Trabalho:** nascimento do `PresenceCursor` e a mudança do `caret`, com testes e docs.
- **Contraste:** `tone-contrast.mjs` e `identity-contrast.mjs` medem as pílulas nos dois temas. Pela D2, também sobre os pontos claro e escuro do `brand-field`.

**Fase 7: roteiro.**
- **Trabalho:** `scene-script.ts` e `use-scene-script.ts`.
- **Testes puros:**
  - para todo `SceneScriptId`, o último `at` fica em no máximo 5.000ms (o `palette-login` com D8 também);
  - `planScript` é determinístico, chamado duas vezes com igualdade profunda;
  - `reduceScript`: `skip` e `hidden` levam a `done`, e `scene` leva a `idle`;
  - `finalFrame("palette-login")` traz `text: "fatura"` e `selected: "Fatura de outubro"`;
  - os atrasos não contêm `Math.random` nem `Date` (teste de fonte).

**Fase 8: o showcase do app.**
- **8a.** `testimonials.tsx` e a colagem.
  - Teste: 14 frases, cada uma com 90 caracteres ou menos, sem `/\d/` e sem `R$`.
  - Teste: nome no formato `/^\p{Lu}\p{Ll}+ \p{Lu}\.$/u`.
  - Teste: o cartão contém "exemplo" e trata os quatro `data-edge`.
- **8b.** `mini-app.tsx` nas duas formas, para ~480px, com a auditoria das quebras de viewport.
- **8c.** `scenes.ts`, `auth-showcase.tsx` e a ligação com o frame.
- **8d.** Login e a paleta: `ShowcaseFlight`, cursor e D8.
- **8e.** Cadastro.
- **8f.** Recuperação.
- **8g.** Convite.
- **8h.** Apagar `scenes/*` e redirecionar os banimentos.
- **Testes de fonte em `components/auth/showcase` e `ui/showcase.tsx`:**
  - nenhum `from "motion`, exceto no DS;
  - nenhum `shortcut=`;
  - `TopBarSearch` sempre com `listen={false}`;
  - `MoneyDisplay` em `xl`/`2xl` sempre com `mono={false}`;
  - nenhum `InputOTP`, `<input`, `<form`, `type="password"`, ` id=`, ` name=` ou `<Alert`;
  - nenhum `marker=`.
- **Verificação ao vivo:** /login, /login?reason=session-expired, /login?reason=password-updated, /register, /forgot-password, /reset-password sem token, /invites/accept sem token (erro) e `?token=x` deslogado (porta). Os outros estados pelo Eixo de cena no catálogo.

**Fase 9: polimento e matriz.**
- **Ferramenta:** um script Playwright **descartável, no scratchpad da sessão, fora do repositório**. Ele só navega: nenhum `fill`, nenhum clique em submit.
  - Antes de tudo, limpa `localStorage` das chaves `sb-*`. Nunca chama `signOut`.
  - Nunca abre `/invites/accept?token=` logado.
  - Usa `page.emulateMedia({ reducedMotion: "reduce" })`, CDP `Emulation.setCPUThrottlingRate` em 4× com trace de quadros longos, e contextos com `hasTouch`.
- **Matriz:**
  - 1024×700, 1280×800, 1440×900, 1920×1080 e 800×1000, nos dois temas;
  - **tablet de toque 768×1024 e 1024×768**: linhas de 44px (`MENU_TOUCH_TARGET`), dock e `Kbd` escondidos, painel ainda bonito;
  - movimento reduzido;
  - telefone 390×844: só o wordmark, sem request do pedaço da paleta, e `useShowcase().active` falso;
  - truncamento a 1280×800;
  - selos dentro do palco;
  - tempos medidos no meio da animação;
  - interrupção com cliques rápidos entre login e esqueci, só nos links;
  - `npm run ds:audit`.

**Fase 10: registro.**
- **AGENTS:**
  - bullets de `DeviceFrame`, `Showcase` (Organismo) e `PresenceCursor`;
  - Root e Main, e o aside persistente;
  - `AuthShell` com `scene` e `icon`, e o `AuthStatus` extinto;
  - o escopo opaco;
  - `MOLA_PALCO` e `SAIDA`;
  - **exceção nomeada no bullet de Gráficos:** "no `Showcase`, o gráfico monta só com o palco visível, para não nascer com largura 0 no telefone; o movimento continua o do Recharts".
- **Docs:** JORNADAS, Atlas (rebuild e republicação), histórico, comentário de contrato.
- **Fechamento:** verificação final em `next build && next start`, só navegando.

---

## 10. Riscos, mitigação e decisões pendentes

### Riscos

| Risco | Mitigação |
|---|---|
| Projeção dentro de um pai com perspectiva | Repouso a 0°; spike; caminho reserva |
| Cantos distorcidos | Raio em px pelas sondas |
| Texto esticado no voo da pílula | O fantasma não tem texto; o real só aparece no pouso |
| Placa translúcida no escuro | Especificidade (0,3,0); medição no spike |
| Texto branco no mockup | `text-foreground` declarado e testado |
| UI do navegador apertada | Desenho para ~480px; verificação de truncamento |
| Recharts com largura 0 / pulso infinito | `active`; `ChartSparkline` sem marcador |
| WCAG 2.2.2 | ≤5s com D8; sem laço; pulo no `focusin` real; quadro final no movimento reduzido |
| Colisão com o formulário real | Proibição de `id`, `name`, `<input>`, `password` e `<Alert` no palco, por teste |
| Selo cortado | `data-edge`; verificação geométrica |
| LCP e hidratação | O `H1` é o LCP; quadro final do servidor; `initial={false}`; sem `Date` nem acaso |
| Peso no telefone | cmdk por `next/dynamic` só com `active` |
| Bagunça visual | Um chip por cena, níveis, "baixo", zona do wordmark |
| Conteúdo enganoso | "exemplo", "dados de exemplo", sem dígitos de código, breadcrumb, sem marcas |
| Cursores errando o alvo ao reorganizar | Medição por âncora depois do `settled` e no resize |
| Página do catálogo importando o app | Se o `doc-pages.test.ts` reprovar, a seção "No app" vira rascunho e sai na fase 10 |

### Decisões tomadas

D1, D7, D8 e D9 foram respondidas pelo dono em 12/10/2026. D2 a D6 seguem a recomendação.

| | Decisão |
|---|---|
| **D1** | A paleta flutua **à frente** da janela, saindo da pílula de busca, com o escopo opaco no palco. *(dono)* |
| **D2** | As pílulas de nome dos cursores podem tocar o arco-íris, como exceção nomeada no AGENTS, com o contraste medido sobre os pontos claro e escuro do campo. |
| **D3** | Os pontos são os capítulos Entrar, Criar conta e Recuperar. O convite conta como Entrar. |
| **D4** | O cadastro aberto por link direto já nasce em celular. |
| **D5** | O raio do aparelho usa a escala existente (`rounded-surface` e `rounded-modal`), sem degrau novo. |
| **D6** | O ⌘K toca uma vez por entrada na cena e termina na fatura. |
| **D7** | O campo fica **parado**, sem `brand-lava`. *(dono)* |
| **D8** | No login, depois da fatura, a janela faz **a ida e volta navegador→celular→navegador** (~1,6s), dentro dos 5s e sem repetir. *(dono)* |
| **D9** | O ponteiro do cursor é uma **seta desenhada**, uma exceção nomeada em `DRAWN_SVG_FILES` do auditor, como o logo e o `Spinner`. *(dono)* |

**Já aprovado pelo dono antes deste plano:**
- depoimentos **ilustrativos marcados** com "exemplo";
- a digitação é a **busca ⌘K**;
- **componentes novos do DS** desenhados com tokens, sem imagem;
- o `SplitShell media`, já entregue.

**Aprovadas junto com este plano** (a resposta do dono pediu que fossem apresentadas aqui antes de implementar):

| Mudança em peça existente | Quem consome hoje |
|---|---|
| A divisão do `SplitShell` em `SplitShellRoot` e `SplitShellMain`, mantendo o `SplitShell` composto | Só as telas de acesso e o catálogo |
| A prop `caret` em `SearchInput` e `CommandInput` | Opt-in; as buscas atuais não mudam |
| O ramo `[data-opaque]` em `reduced-transparency` e em `glass-surface` | Só dentro do palco |
| A variante `showcase-short`, os tokens `--device-bezel` e `--device-bezel-edge`, e as utilities `type-caret`, `caret-blink`, `showcase-enter`, `showcase-stage` e `showcase-ripple` | Novos; ninguém mais consome |
| A exceção do gráfico no AGENTS (monta só com o palco visível) | Só o palco |

**Ficou de fora de propósito:** o composto estático de navegador e celular juntos no movimento reduzido.

### Conferência dos achados do crítico
| Achados | Onde estão resolvidos |
|---|---|
| 1 | §4, sondas de raio |
| 2 | §5, `ShowcaseFlight` |
| 3 e 17 | §2 e §6, profundidade sem escala |
| 4 | §6, `--slot-delay` no invólucro de fora |
| 5 | §5, filtro do `focusin` |
| 6 | §2, tinta |
| 7 | §5, placa pelo `ShowcaseFloat` |
| 8 | §2 e §4, níveis corrigidos e mini UI para ~480px |
| 9 | §3, `ChartSparkline` |
| 10 | §8, `ShowcaseCursor` por âncora |
| 11 | §3, §8 e §9, campo desenhado e proibições |
| 12 | §5 e §9, lógica pura |
| 13 | D8 |
| 14 | §3 e §5, cursores em todas as famílias; D9 |
| 15 | §1, desvio listado |
| 16 | §6, `data-edge` |
| 18 | Organismo |
| 19 | §2, paleta sem sombra |
| 20 | `TopBar position="static"`; trilho, abas e barra de status no `DeviceFrame` |
| 21 | Fase 10, exceção nomeada |
| 22 | Fase 0, perguntas de impacto |
| 23 | (0,3,0) |
| 24 | §8, `AuthShell` e teste |
| 25 | JORNADAS e Atlas |
| 26 | Passo "Enter aprofunda" removido |
| 27 | `startsWith("/invites/accept")` |
| 28 | `invite.idle` |
| 29 | `step` do login e entrada só na coluna |
| 30 | §3, data única, 14 pontos, frases 1 e 8 corrigidas |
| 31 | Início a 500ms; total ≤5s |
| 32 | Playwright descartável |
| 33 e 34 | Fase 2 e Fase 9, segurança e checagens ao vivo |
| 35 | Tablet de toque |
| 36 | §8, tipos; §5, assinaturas; `ShowcaseFloat` sem `from`; ordem do giro |
| 37 | `next/dynamic` |
| 38 | §4, auditoria das quebras de viewport |

**Correção própria:** o selo de variação estava em "+8,4%" e passou a "+7,8%", que é a conta real de 3.880 para 4.182,60.

### Achados do crítico recusados
Nenhum foi recusado. Três foram aceitos com outra solução:
- **#17:** em vez de limitar a escala a 0,95, a profundidade passou a ser só sombra e ordem. O selo fica sempre com 11px e isso também resolve o #3.
- **#26:** o passo "Enter aprofunda" foi removido em vez de criar uma sobrescrita.
- **#32:** o script de verificação fica fora do repositório, porque é ferramenta de uma sessão e não suíte.

### Verificação de ponta a ponta (resumo)
- **Toda fase:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` e `npm run ds:audit -- <arquivos>`.
- **Testes:**
  - lógica pura (`scene-script.ts`, frases e distribuição);
  - testes de fonte que trancam as proibições da seção 8;
  - `*-versions.test.ts` de cada componente novo.
- **Ao vivo, só navegando** (o banco é o de produção):
  - o preview `dev-attach` em :3000 cobre /login (também com `?reason=`), /register, /forgot-password, /reset-password sem token e /invites/accept (sem token e com `?token=x` deslogado);
  - os estados que exigem envio são verificados pelo Eixo de cena no catálogo;
  - no fim, `next build && next start` para conferir a primeira carga.
- **Matriz da Fase 9:** larguras de 1024 a 1920 e 800×1000, nos dois temas; tablet de toque; movimento reduzido; telefone só com o wordmark; cliques rápidos entre telas, só nos links.
- **Documentação:** JORNADAS, o Atlas (`python3 docs/atlas/build.py` e republicação no mesmo URL), o AGENTS e o histórico.

### Critical Files for Implementation
- /Users/kaualeandro/Desktop/Finance App/finance-app-dev/src/components/ui/split-shell.tsx
- /Users/kaualeandro/Desktop/Finance App/finance-app-dev/src/app/(auth)/layout.tsx
- /Users/kaualeandro/Desktop/Finance App/finance-app-dev/src/components/layout/auth-shell.tsx
- /Users/kaualeandro/Desktop/Finance App/finance-app-dev/src/components/ui/command.tsx (e /Users/kaualeandro/Desktop/Finance App/finance-app-dev/src/components/ui/search-input.tsx)
- /Users/kaualeandro/Desktop/Finance App/finance-app-dev/src/app/globals.css
---

## 11. Emendas da Fase 0 (as quatro perguntas, respondidas em 12/10/2026)

O dono marcou **todas** as opções recomendadas e também três extras. Elas entram no escopo, e o que fica abaixo vence qualquer trecho anterior que conflite.

**Redesenho:**
- `DeviceFrame` com duas formas;
- colagem por tamanho;
- cursor com seta e pílula;
- **forma `tablet`** (extra).

**Peças:**
- as do `DeviceFrame`;
- as do `Showcase`;
- `caret`;
- **legenda da cena** (extra).

**Comportamento:**
- troca de forma animada;
- palco decorativo e acessível;
- cursores que acham o alvo;
- **paralaxe no mouse** (extra).

**App:** as 5 telas de acesso.

### 11.1 Forma `tablet` no `DeviceFrame`
- **API:** `form: "browser" | "tablet" | "phone"`.
- **Tablet:** proporção 4/3, de pé (3:4) no palco alto. Moldura `--device-bezel` com `p-2`, raio `rounded-modal`, sem barra de URL nem ilha. Barra de status fina com "9:41" e bateria.
- **Navegação:** o slot `nav` vira um trilho estreito à esquerda, como no navegador, sem rótulos.
- **Tamanho no palco:** altura `min(72cqh, 120cqw)`. O afastamento da colagem fica em `kx 1,08 / ky 1,06`.
- **Uso:** a família **convite** passa a ser `tablet` (o tablet da casa, de quem divide a carteira). Isso vale para `invite.loading`, `idle`, `gate`, `accepted` e `error`. Login continua `browser`; cadastro e recuperação continuam `phone`.
- **Giro:** a ordem continua `login(0) → invite(1) → register(2) → recovery(3)`. Login ↔ convite agora também troca de forma (navegador ↔ tablet), com a mesma mola e o mesmo giro.
- **D8 sem mudança:** a ida e volta do login continua navegador → celular → navegador, ≤5s.
- **Tabela de transições (§7):** a linha "login ↔ convite" ganha "Vira: navegador ↔ tablet; URL some; a moldura engrossa".
- **Testes e docs:** o Eixo `form` dos docs tem três valores. O teste exige `data-form` nos três e a tabela de tamanhos por extenso na `@utility showcase-stage`.

### 11.2 Legenda da cena: `ShowcaseCaption` (peça do `Showcase`)
- **API:** `<ShowcaseCaption title description />`.
- **Forma:** um `Card variant="elevated" padding="sm"` no pé do palco, à esquerda, com os `ShowcaseDots` dentro dele, à direita. Assim os pontos deixam de pousar soltos no campo.
- **Tipografia:** título em `text-sm font-medium` e descrição em `text-xs text-muted-foreground`, **sans**. A Ledger fica só em `.page-title`, `.wordmark` e no numeral do `EmptyStateCode`.
- **Lugar:** entra na zona livre do pé. Os slots s5, s9 e s10 da colagem, que pousam no pé, sobem 6cqh quando a legenda existe. O nível XS esconde a descrição.
- **Troca entre famílias:** `ShowcaseSwap effect="rise"` no texto, com o cartão parado.
- **Texto por família** (sem dígitos, sem promessa de resultado):
  - login: "Seu mês num relance" / "A mesma conta no computador e no celular.";
  - cadastro: "Comece pela casa" / "Orçamentos e contas divididas desde o primeiro dia.";
  - recuperação: "Acesso de volta em segundos" / "Um código no seu e-mail e uma senha nova.";
  - convite: "Uma carteira para a casa toda" / "Cada pessoa lança do próprio aparelho.".
- `SceneSpec` ganha o campo `caption`, preenchido por família.

### 11.3 Paralaxe no mouse
- **No `ShowcaseStage`:**
  - prop `parallax?: boolean`, padrão `false` (o app liga);
  - `useMotionValue` para x/y normalizados, `useSpring` com `MOLA` e `useTransform` por profundidade;
  - deslocamento máximo: `far` 2px, `mid` 4px, herói 6px, flutuantes 8px, em sentido oposto ao ponteiro.
- **Ouvinte:** `pointermove` no **elemento pai não inerte** do palco (o aside), **nunca no `document`**, porque o `use-brand-glow` é o único ouvinte montado em `document` em repouso. Também `pointerleave`, que volta tudo a 0 pela mola.
- **Quando desliga:** responde só a cursor (`ehCursor(e)`, `lib/pointer.ts`) e só com `(hover: hover)`. Fica desligado sob `deDedo` (moldura do iPhone), com movimento reduzido (`useReducedMotion`) e com `active` falso.
- **Sem `requestAnimationFrame`:** os valores de movimento do `motion` agendam os quadros, e não há `setState` por evento. O teste do `Showcase` proíbe rAF e `document.addEventListener("pointermove"`, e exige `ehCursor` e `useReducedMotion`.
- **Durante a troca de forma:** a paralaxe fica congelada em 0. Ela só soma ao `transform` em repouso, e o alvo volta a 0 enquanto `settled` é falso.
- **Docs:** um Interruptor "paralaxe" na página do `Showcase`.
