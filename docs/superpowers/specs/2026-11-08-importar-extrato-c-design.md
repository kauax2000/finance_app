# Importar extrato, versão C — design

Data: 08/11/2026. Escolha do dono: **versão C** do comparativo (dois passos,
conferência que se edita), "melhorada ao máximo", com um pedido explícito:
**com uma lista grande, o diálogo não pode se perder** — a lista fica reduzida e
há um jeito de **expandir para a tela cheia**. O dono pulou as perguntas; o que
está marcado **(decisão do Claude)** é meu. Maquete:
`scratchpad/importar/c.html` (mostrada no navegador, 08/11).

## Por quê

O diálogo de hoje (`importar-extrato-dialog.tsx`) trava em cinco pontos:

- pede "Extrato do banco" ou "Planilha" antes do arquivo;
- não aceita arrastar o arquivo, e o destino são dois controles;
- o passo Colunas são quatro selects às cegas;
- "Valor negativo é despesa" é um interruptor escondido que inverte tudo;
- a conferência não deixa tirar linha, trocar categoria nem ver o que já existe.

## Objetivo

Importar um extrato em **dois passos** (Arquivo → Conferir), com o passo
Colunas só quando a dedução falha, e uma conferência em que a pessoa decide o
que entra — sem o diálogo crescer sem limite.

## O fluxo

### 1. Arquivo

- **Área de soltar**: o `Card variant="dashed"` (o "vazio ou adicionar" do
  sistema) aceita arrastar e soltar; dentro, "Arraste o arquivo aqui" e o
  botão "escolher no computador". Com arquivo, vira o `Item` do arquivo (nome,
  tamanho, **quantos lançamentos e o período**) com × para trocar. Sem
  componente novo em `ui/` (decisão do Claude: o `Card dashed` já existe para
  isso).
- **Sem a escolha Extrato/Planilha**: OFX é extrato; CSV é extrato, e passa a
  `import_sheet` só quando o mapeamento traz a coluna de categoria
  (decisão do Claude: é a diferença que existe no código hoje).
- **Destino num campo só**: "Para onde vão", um `Select` com dois grupos —
  Cartões (`nome · •••• 1234`, com o ladrilho da cor) e Contas (Pix, Débito,
  Outro).
- **Dedução do CSV**, mostrada numa linha de confirmação ("✓ Colunas
  reconhecidas: Data, Descrição, Valor. Gasto é negativo."):
  - cabeçalho: a 1ª linha é cabeçalho quando a célula da coluna de data não é
    data;
  - colunas pelo nome do cabeçalho, sem acento e sem caixa: data (`data`,
    `date`, `dt`), descrição (`descri`, `historico`, `lancamento`, `estabelec`,
    `memo`), valor (`valor`, `amount`, `quantia`, `montante`), categoria
    (`categoria`, `category`); sem cabeçalho, pelo conteúdo (a coluna que é
    data em ≥80% das linhas, a numérica, a de texto mais longo);
  - sinal: na **conta**, negativo é gasto; no **cartão**, positivo é gasto
    (o `negativoEhDespesaPadrao` de hoje) — e se o arquivo contradiz (ex.: na
    conta, mais de 80% positivos), vale o que o arquivo mostra;
  - se data ou valor não forem achados, o passo **Colunas** aparece entre os
    dois, com a prévia do arquivo e o papel no topo de cada coluna (a versão A
    do comparativo) e a pergunta "Neste arquivo, −12,34 é: um gasto / uma
    entrada".

### 2. Conferir (o coração)

Título "48 lançamentos para o Nubank", descrição "De 1 a 28 de outubro.
Desmarque o que não quer trazer."

- **Resumo em chips**: "Vão entrar 46 de 48", "Saídas −R$ …", "Entradas
  +R$ …", "2 já existem" (tom de aviso), "9 sem categoria" (atalho que aplica o
  filtro).
- **Lista**: uma linha por lançamento — caixa, data, descrição (com "(k/n)"
  da parcela), **categoria editável** (um `Combobox` de categoria; a sugerida
  pelo histórico já vem escolhida; a da planilha também), valor colorido
  (despesa/receita, tokens de dinheiro).
- **Já existe**: mesma data, mesmo valor e mesmo destino (cartão ou forma)
  de um lançamento da carteira. Vem **desmarcado**, com o `Badge` "já existe";
  passar ou tocar mostra o lançamento existente (descrição e data). A pessoa
  pode marcar de volta.
- **Filtro**: `ToggleGroup` Todos · Saídas · Entradas · Já existem · Sem
  categoria.
- **Lista grande, diálogo inteiro**:
  - **Compacto (padrão)**: no máximo **6 linhas** visíveis, a última
    dissolvendo; embaixo "Ver os 48 lançamentos". O diálogo fica no tamanho
    `lg`/`xl` de sempre.
  - **Expandir**: o botão ⤢ no canto da lista (e o "Ver os 48") faz o **mesmo
    diálogo** crescer até `size="full"` (na mola de altura que o `Dialog` já
    tem); ⤡ recolhe. Nada se perde: marcações, categorias e filtro continuam.
  - **Na tela cheia**: o `DataTable` com busca, o filtro acima, ordenação por
    data e valor, seleção com a barra flutuante — "Pôr categoria" e "Deixar de
    fora" para as marcadas — e a soma das selecionadas (`selectionSummary`).
  - Com 6 linhas ou menos, nem o ⤢ nem o "Ver os" aparecem.
- **Colunas**: a linha recolhida "Colunas: Data · Descrição · Valor · gasto é
  negativo — Ajustar" abre a prévia de colunas no lugar da lista; ao confirmar,
  a lista é relida (as marcações se perdem só se a leitura mudar).
- **Rodapé**: Voltar · **Importar 46 lançamentos** (desabilitado com 0).

### 3. Feito

"46 lançamentos importados", com o que ficou de fora ("2 ficaram de fora
porque já existiam") e as pendências ("9 sem categoria, marcados a
conferir"). Ações: **Desfazer importação** (como hoje) e o primário **Ver os 9
sem categoria** (aplica A conferir + Sem categoria), ou **Revisar agora**
quando não há sem categoria.

### Telefone

A mesma árvore na gaveta (`Dialog surface="auto"`): linhas viram `Item`
(caixa · descrição e data/categoria · valor), o compacto mostra 6, "Ver os 48"
leva a gaveta à altura toda (`fill`) com busca e filtro. Alvos de 44.

## Fora do escopo / anti-objetivos

- PDF de fatura, Open Finance, a frase do lançamento inteligente.
- Mudar o que acontece ao gravar: `needs_review`, `client_id` gerado uma vez
  (repetir não duplica), `import_batch_id` e o desfazer continuam iguais.
- Anti-objetivo: um lançamento entrar duplicado sem a pessoa ver o aviso; o
  diálogo crescer com a lista; um passo Colunas obrigatório no caso comum.

## Restrições

- `AGENTS.md`: tudo é componente do sistema (`Dialog`, `Card dashed`,
  `Select`, `Combobox`, `DataTable`, `ToggleGroup`, `Badge`, `Item`,
  `MoneyDisplay`, `EmptyState`); nenhum componente novo em `ui/` sem
  pergunta. Se `Dialog` precisar trocar `size` em tempo de execução e não
  souber, é mudança em `ui/` — perguntar antes.
- É **mudança de jornada** (passos do fluxo mudam): `docs/JORNADAS.md`, o
  Atlas (`docs/atlas/template.html`, `build.py`) e a republicação no mesmo
  URL do Atlas.
- Banco de dev é produção: a busca de "já existe" é leitura; testar
  importação de verdade só com o `teste-importacao.csv` e com o pedido do dono.
- Sem prettier, sem push.

## O que fica para quem constrói

- O limiar exato da dedução de cabeçalho/sinal (os números acima são o ponto
  de partida).
- A consulta de "já existe": por janela de datas do lote, `workspace_id`,
  destino e valor; casar no cliente.
