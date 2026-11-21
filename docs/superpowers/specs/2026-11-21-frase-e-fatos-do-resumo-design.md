# Frase do resumo (D3) e fatos do mês (B2) — design curto

Data: 21/11/2026. Aprovado pelo dono na comparação `.superpowers/brainstorm/75919-1795230631/content/frase-opcoes-4.html`: "para o resumo vamos usar o D3" e "adicione os cards do B2 exatamente como está aqui nos insights".

## Intenção
A frase do resumo hoje é um parágrafo longo e cinza que mistura o veredito, o que puxou o mês e o que vem. A pessoa precisa ler o veredito de relance e chegar aos detalhes com um toque.

## O que muda
1. **Frase (D3)**, no cartão "Em resumo":
   - **Veredito** em Ledger, grande e branco: "Novembro: **R$ 3.062,54**, em linha com a sua média." O valor fica na tinta da cor da categoria.
   - **Explicação** embaixo, menor e cinza, em sans: "A parcela do <u>Consórcio Mãe</u> (**R$ 2.000**) puxou o mês. Dezembro já tem **R$ 442,54** previstos. A média dos últimos 6 meses é R$ 2.906,77." O nome do lançamento é sublinhado e abre o detalhe dele.
   - **Rodapé**: "Feito com os 9 lançamentos de novembro e os últimos 6 meses", com dois botões: "Ver o lançamento" (abre o detalhe do lançamento que puxou) e "Ver dezembro" (rola até a seção "Já comprometido"). Cada botão só aparece com o fato dele.
2. **Fatos do mês (B2)** no topo da seção "Para ficar de olho", antes dos insights. São três minicartões lado a lado (empilham no telefone), cada um com ladrilho de 32, rótulo pequeno, título, valor à direita e seta quando abre algo:
   - "Puxou o mês" · nome do lançamento · valor · abre o detalhe (ladrilho na cor da categoria).
   - "Já previsto" · nome do próximo mês · valor · rola até "Já comprometido" (ladrilho azul da paleta).
   - "Total do mês" · "média R$ X" · total lançado · sem ação (ladrilho cinza).

## Regras de conteúdo
- O mês aparece sem o ano ("Novembro", "Dezembro").
- O nome do lançamento perde o sufixo de parcela ("Consórcio Mãe - 3/6" vira "Consórcio Mãe").
- "Puxou o mês" (na frase e no cartão) segue a regra de hoje: 2 compras ou mais, e o maior acima de 40% do lançado.
- Mês aberto com previsto: "Novembro até agora: R$ X; deve fechar acima da sua média." O "Ainda vêm R$ X neste mês." fica na explicação.
- Sem média ou com lançado ≤ 0: o veredito é só "Novembro: R$ X.", e a explicação perde a frase da média. O rodapé diz só "Feito com os N lançamentos de novembro".
- Mês vazio: a frase continua "Nenhum gasto com Carro em novembro…", sem explicação nem rodapé.
- Receita: os mesmos textos, com "entrada" no lugar de "gasto" onde a frase diz o tipo.

## Abordagens consideradas
- **B2** (minicartões no lugar da frase), **C1/C2** (linhas e linha do tempo) e **D1/D2** (parágrafo lapidado): o dono escolheu a D3 para a frase e levou os cartões da B2 para os insights.

## Decisões do construtor (minhas)
- O botão do rodapé diz "Ver o lançamento", e não o nome dele: nomes longos estouram o botão.
- Os dois botões do rodapé são `secondary` (par de mesmo peso, regra do AGENTS).
- A cor do valor no veredito é a tinta do `tile-tonal` da categoria.

## Mudança de plano (21/11/2026)
Depois de ver a D3 na tela, o dono pediu: "remova o resumo". A frase (e a seção "Em resumo") saiu inteira; ficam os fatos do mês (B2) no topo de "Para ficar de olho".
