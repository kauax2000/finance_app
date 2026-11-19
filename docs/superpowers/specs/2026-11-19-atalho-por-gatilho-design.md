# Atalho por gatilho — desenho

Data: 19/11/2026 · Branch: `finance-app-2.0` · Pedido do dono nesta sessão.

## Intenção

Hoje o guia "Conectar o iPhone" (`GuiaDoAtalho`) baixa um arquivo só e, no último
passo, pergunta "Como abrir o atalho" (Siri, Botão, Toque, Bloqueio, Ícone). O dono
quer o contrário: **escolher o gatilho antes de baixar**, e o arquivo baixado já sair
certo para ele. Cada arquivo sabe o próprio gatilho e avisa o app.

## Metas

- O passo 1 do guia é a escolha do gatilho; o resto do guia segue a escolha.
- Um arquivo assinado por gatilho, todos importados com o nome **Lançar gasto**.
- Siri é falada; os outros quatro são digitados (o comportamento de hoje).
- Cada pedido do atalho manda o gatilho; a Edge guarda no aparelho e a lista de
  aparelhos mostra ("iPhone do Kauã · Toque atrás").
- O último passo mostra só o caminho do gatilho escolhido.

## Fora do escopo

- **Ligar o gatilho sozinho.** O iOS não deixa arquivo nem app ligar Tocar atrás,
  Botão de Ação ou controle da tela bloqueada: é sempre a pessoa, em Ajustes.
- Frase da Siri personalizada: o nome é fixo, "Lançar gasto".
- Código do aparelho dentro do arquivo: o arquivo é assinado num Mac e servido
  estático; o código continua colado na pergunta de importação.

## Anti-metas

- Um gatilho que muda o fluxo de perguntas além da voz da Siri.
- Arquivo baixado com outro nome ("Lançar gasto (Siri)"): a Siri e os seletores de
  Ajustes procuram "Lançar gasto".

## Restrições

- Assinar exige `shortcuts sign` do macOS: os arquivos são gerados por
  `scripts/atalho/gerar-atalho.py` e versionados em `public/atalho/`, não no build.
- O iOS 27 não lê o "é" do Se gravado fora do app; comparações usam a busca em
  dicionário + "tem qualquer valor" (commit `c6986fbf`).
- `dev usa banco de produção`: migração e deploy da Edge só com o ok do dono, no
  passo próprio do plano.
- Jornada mudou: `docs/JORNADAS.md`, `docs/atlas/template.html`, `build.py` e
  republicar o Atlas na mesma mudança.

## Abordagens consideradas

- **A. Dois arquivos (Siri e digitado).** Simples, mas o app não sabe o gatilho.
- **B. Um arquivo por gatilho (escolhida pelo dono).** Cinco arquivos, cada um manda
  o gatilho; o app registra e mostra. Custa manter cinco variantes do mesmo gerador.
- **C. Um arquivo que descobre o gatilho.** Descartada: o atalho não sabe quem o abriu.

## Desenho

### Gerador

- `atalho(url, gatilho)` com `gatilho ∈ {siri, acao, toque, bloqueio, inicio}`.
- Todo pedido leva `X-Atalho-Gatilho: <gatilho>` além de `X-Atalho-Versao: 2`.
- **Siri:** onde hoje há `notification`, há `showresult` (Mostrar resultado), que a
  Siri fala. As perguntas são as mesmas: pela Siri elas já são faladas e ouvidas.
- Os outros quatro: idênticos ao arquivo de hoje, só muda o cabeçalho.
- Saída: `public/atalho/<gatilho>/Lançar gasto.shortcut` (o nome do arquivo vira o
  nome do atalho). O `public/atalho/Lançar gasto.shortcut` da raiz continua, sem
  cabeçalho de gatilho (ver "Deixado ao construtor").
- `--verificar` confere as cinco variantes: o cabeçalho certo em todo pedido, e a
  Siri sem `notification` e com `showresult` no lugar de cada uma.

### Edge e banco

- Coluna `capture_tokens.atalho_gatilho text` com `check` nos cinco valores, e
  `grant select (atalho_gatilho)` (o select é por coluna, como `atalho_versao`).
- `usoDoToken` aceita o cabeçalho do gatilho como aceita o da versão: só grava com
  valor válido; sem cabeçalho (Apple Pay, compartilhar) não apaga o que havia.
- `COLUNAS` de `aparelhos-de-captura.ts`, o tipo em `lib/supabase.ts` e
  `types/database.ts` ganham a coluna.

### Guia (`GuiaDoAtalho`)

Sete passos:

1. **Como você vai abrir?** — `RadioGroup variant="card"` com os cinco gatilhos
   (rótulo + uma linha: "Siri — fale o gasto", "Toque atrás — três toques nas
   costas", "Botão de Ação", "Tela bloqueada", "Ícone na tela de início").
2. **Dê um nome a este iPhone** — o passo 1 de hoje (nome, carteira, Criar código).
3. **Baixe o atalho** — baixa `public/atalho/<gatilho>/Lançar gasto.shortcut`
   (o `baixarPeloSafari` passa a receber o caminho).
4. **Abra o arquivo** · 5. **Configurar Atalho** · 6. **Cole o código** — como hoje.
7. **Ligue o gatilho** — só o texto e a tela do gatilho escolhido (`COMO_ABRIR`),
   sem as abas. Na Siri: "Diga 'E aí Siri, Lançar gasto'. Ela pergunta e responde
   falando."

- Voltar ao passo 1 depois do código criado pode trocar o gatilho: o arquivo do
  passo 3 segue a escolha nova (o código não muda).
- "Baixar o atalho de novo" (`substituir`) abre com o gatilho do aparelho marcado,
  quando houver.
- Os fantasmas da `CaixaDoPasso` passam a ser os sete passos, com o último em cada
  gatilho (a caixa tem a altura do maior, como hoje).

### Lista de aparelhos

- A linha ganha o gatilho depois da carteira: "Casa · Toque atrás · último gasto
  ontem". Sem gatilho (atalho antigo), a linha fica como hoje.

## Deixado ao construtor

- O arquivo antigo na raiz de `public/atalho/`: manter (links de fora e o guia do
  Apple Pay podem apontar para ele) e regerá-lo igual ao `inicio`, sem cabeçalho de
  gatilho, para não marcar um gatilho falso.
- Rótulos curtos dos gatilhos na lista (`Siri`, `Botão de Ação`, `Toque atrás`,
  `Tela bloqueada`, `Ícone`).
- Testes: `usoDoToken` (gatilho válido, inválido, ausente), o teste de fonte do
  guia (`conta.test.ts`) para o caminho do arquivo por gatilho.

## Verificação

- `python3 scripts/atalho/gerar-atalho.py --verificar`.
- `npx tsc --noEmit && npm run lint && npm run test:unit`.
- `npm run ds:audit -- src/components/account/guia-do-atalho.tsx`.
- No iPhone (dono): baixar Toque atrás e Siri, lançar um gasto em cada, ver a lista
  mostrar o gatilho; pela Siri a resposta é falada.
