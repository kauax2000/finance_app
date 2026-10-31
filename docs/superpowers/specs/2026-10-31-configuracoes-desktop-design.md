# Configurações no desktop: redesign

Data: 2026-10-31. Primeira tela da revisão de telas do desktop.

## Por quê

Configurações é uma coluna de 576px e 1.878px de altura, com dez blocos em
sequência. Ela tem cinco defeitos medidos na tela e no código:

1. **O alcance não aparece.** O que vale para a carteira e o que vale só para o
   aparelho se alternam, e "Vale só neste aparelho" se repete em cada linha.
2. **Os avisos estão em três lugares**: `NotificationPreferences`, o wireframe
   do lembrete das 20h e o wireframe de insights, todos sobre o mesmo
   `notify_*` da mesma carteira.
3. **Editar a carteira está escondido** num ⋯, e é a ação principal do bloco.
4. **Cinco wireframes** ainda ocupam a tela, e a revisão de tela é o momento de
   transformá-los em design system (AGENTS.md, "Funcionalidade nova entra em
   wireframe").
5. **As peças divergem**: `App no celular` usa `CardHeader`, as outras seções
   usam `PageSection`; `FormSwitch variant="card"` é cartão dentro de cartão; há
   rótulo em caixa alta à mão; a rota não tem `loading.tsx` nem `AdiarMontagem`.

Referências: [Copilot web](https://mobbin.com/screens/de003567-b00f-4c29-839d-f0a7a589f3d9)
e [Quicken](https://mobbin.com/screens/c5b493d8-5c3a-498a-9c7c-3d3929e93296) usam
seções laterais com um painel por vez, e [Square](https://mobbin.com/screens/5a28ed24-8ffd-41dc-b545-226e282f9322)
agrupa linhas com chave em cartões. O comparativo de UX (§ Configurações) mantém a
divisão Carteira × Conta: Minha conta continua separada.

## Decisões do dono

- **Menu lateral** com uma seção por vez à direita.
- **Quatro seções, por alcance**: Carteira, Notificações, Este aparelho, IA e
  privacidade.

## Objetivos

- Achar qualquer ajuste em até dois cliques, sem rolar uma página longa.
- Dizer uma vez, no topo de cada seção, onde o ajuste vale.
- Reunir tudo de notificação em um lugar.
- Tirar os cinco wireframes da tela, com o mesmo comportamento.

## Fora do escopo

- Mudar qualquer peça de `src/components/ui/` ou `globals.css`. Tudo sai do
  catálogo atual. Se algo faltar, para e pergunta ao dono.
- Redesenhar o telefone. Ele só não pode quebrar.
- Minha conta, Membros, ou a página `/me`.
- Mudar regras de negócio, RPCs ou o que cada ajuste grava.

## Anti-objetivos

- Componente declarado em `src/app/`, ou duas árvores `md:hidden` / `hidden md:flex`.
- Estilo especial escrito só nesta tela.
- Perder o caminho "Configurar notificações" do painel de notificações.
- Gravar dado na verificação: o dev usa o banco de produção. Só tema e busca do
  cabeçalho, que são locais, podem ser alternados.

## A tela

```
+-----------------+-------------------------------------+
| > Carteira      | Carteira                            |
|   Notificações  | Vale para Viagem G4 Valley.         |
|   Este aparelho |                                     |
|   IA e          | [ícone] Viagem G4 Valley  [Editar]  |
|   privacidade   |                                     |
|                 | Divisão ...                         |
|                 | Datas e orçamento (só projeto) ...  |
|                 | Sair ou excluir a carteira          |
+-----------------+-------------------------------------+
```

Wireframe indicativo, não é o visual final.

### Casca

- `Tabs orientation="vertical"` **controlado pela URL**, variante e tamanho padrão:
  `value` vem de `useSearchParams().get("secao")` (valor desconhecido ou ausente
  é `carteira`), e `onValueChange` faz `router.replace` com `scroll: false`. A
  seção fica no endereço: `/settings?secao=notificacoes`. **Não use o `urlParam`
  do `Tabs`**: ele lê a URL uma vez, e "Configurar notificações" clicado em
  `/settings` não trocaria a seção aberta.
- **Abaixo de `lg` (1024px)** a orientação vira horizontal com `scrollable`, por
  `window.matchMedia("(min-width: 64rem)")` num `useSyncExternalStore`. É o mesmo
  componente, não uma segunda árvore. O corte não é o `useIsMobile`: em 768px, com
  a barra lateral aberta, sobrariam cerca de 240px para o conteúdo.
- `settings/layout.tsx` usa `Container size="full" className="max-w-4xl"` (896px).
  A coluna do menu mede `w-52` e o conteúdo ocupa o resto, sem passar de 576px
  na largura de leitura se isso ficar melhor na medição.
- `loading.tsx` com `SettingsPageSkeleton` e `AdiarMontagem` em `page.tsx`, como
  em `account/(raiz)`.

### Cabeçalho de seção

`PageSectionHeader` com o título e uma linha de alcance, uma vez só:

| Seção | Alcance |
|---|---|
| Carteira | Vale para {nome da carteira}. |
| Notificações | Vale para você em {nome da carteira}. |
| Este aparelho | Vale só neste aparelho. |
| IA e privacidade | Vale para toda a sua conta. |

As descrições das linhas perdem o "Vale só neste aparelho".

### Carteira

1. **Identidade**: `WorkspaceBrandMark` e nome, com `Button variant="secondary"`
   "Editar" visível para quem é dono, abrindo o `WorkspaceAppearanceEditDialog`
   de hoje. Para quem não é dono, a nota "Só o dono pode alterar nome, ícone e
   cor." O ⋯ sai.
2. **Divisão** (dono, carteira não pessoal): o formulário de
   `ModoEPesosDaCarteiraWireframe` em design system: `Form`, `FormRadioGroup`
   com "Pote único" e "Dividida", uma linha de `FormInput` por adulto,
   `FormSubmit variant="secondary"`. Mesma lógica de gravação, mesmos textos de apoio e o mesmo
   estado "Ainda não disponível" quando `split_mode` não vem do banco.
3. **Datas e orçamento** (dono, carteira de projeto): o formulário de
   `DatasDaCarteiraProjetoWireframe` em design system: `DatePicker` nas duas
   datas, `FormInput money` no orçamento e `FormSubmit variant="secondary"`. Os
   dois formulários ficam separados, porque gravam coisas diferentes, e nenhum é
   `primary`: a tela não tem uma ação principal, e pode mostrar os dois. Ele também é o passo da criação em
   `project-form-dialog.tsx`, que passa a usar a mesma peça.
4. **Sair ou excluir**: uma linha no fim da seção com o que a pessoa pode fazer
   (`Sair da carteira` para quem não é dono; `Excluir carteira` para o dono de
   carteira não pessoal), `Button variant="destructive"`, abrindo os diálogos de
   confirmação de hoje. Dono de carteira pessoal não vê a linha.

Sem carteira: o `EmptyState` da situação diz para criar ou entrar numa carteira.

### Notificações

- `id="notificacoes"` sai. `NOTIFICATION_PREFERENCES_HREF` passa a
  `${ROUTES.SETTINGS}?secao=notificacoes`.
- "Ver histórico" fica como ação do cabeçalho, sem `size` e sem classes à mão.
- **Dois cartões, com título em caixa normal**: "Como avisar" (e-mail, central do
  app, push) e "Sobre o quê" (despesas de outros membros, orçamento, cartões:
  limite, cartões: fatura, contas a pagar, **lembrete de itens a conferir**,
  **insights**).
- Linhas `FormSwitch` planas com separador, sem cartão dentro de cartão.
- Lembrete grava `notify_review`, insights grava `notify_insights`, com os textos
  dos wireframes: "Às 20h, quando houver itens a conferir." e "O que o app notou
  na carteira. No máximo 3 push por semana; o resto fica no Painel."
- O tratamento de push, as mensagens e a folha de instalação ficam iguais. A
  descrição padrão da linha de push ganha "Desligar remove este aparelho de todas
  as carteiras.", porque `unsubscribeFromPush` cancela a inscrição do navegador.

### Este aparelho

Um cartão com Tema (`ThemeToggle`), Busca no cabeçalho (`Tabs`, só do `lg` para
cima) e Lançamento inteligente (`FormSwitch`). Abaixo, App no celular no mesmo
idioma das outras linhas, com o texto de instalação, a ação de instalar no iPhone
e o `SyncStatusChip` de hoje.

### IA e privacidade

Um cartão com o conteúdo do wireframe em design system: quem lê (Groq e
Cloudflare, sem treino), o limite de 30 chamadas por dia, "Tudo que a IA preenche
fica a conferir" e o link da política de privacidade. Sem ação de gravar.

## Limpeza

- Apagar `a-conferir-lembrete-wireframe.tsx` e `ia-configuracoes-wireframe.tsx`.
- Tirar `InsightsAvisoWireframe`, `DatasDaCarteiraProjetoWireframe` e
  `ModoEPesosDaCarteiraWireframe` dos arquivos deles, preservando os outros
  wireframes que moram lá. A lógica de gravação que só eles usam se muda com eles
  para `src/components/settings/`.

## Jornada

Conta como mudança de jornada: muda URL, destino e ações da carteira. Na mesma
mudança: `docs/JORNADAS.md`, `docs/atlas/template.html`,
`python3 docs/atlas/build.py` e republicar o Atlas
(https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL).

## Verificação

- `npm run ds:audit -- src/components/settings "src/app/(app)/settings"`
- `npx tsc --noEmit && npm run lint && npm run test:unit`
- `graphify update .`
- Na prévia (`dev-attach`), em 1280px, 1075px e 1024px, claro e escuro, e 900px e
  375px: trocar de seção, recarregar com `?secao=notificacoes`, abrir Editar e
  cancelar, e ir pelo link "Configurar notificações" estando **já em `/settings`**.
  Sem clicar em Salvar nem em chave que grave.

## Decisões de quem escreveu (não do dono)

- Editar visível no lugar do ⋯, e Sair ou excluir como linha no fim da seção.
- A seção por URL controlada pela página, sem tocar em `ui/`.
- Vertical só do `lg` para cima.
- Os dois formulários da carteira separados, ambos `secondary`.
- O aviso sobre push e "Vale para você em {carteira}".

## Deixado para quem constrói

- Divisão em arquivos dentro de `src/components/settings/`.
- Estrutura interna das linhas, desde que use `Card`, `Separator`, `Item` e
  `FormSwitch` do catálogo.
- Escolha da peça para o título dos dois cartões de Notificações.
