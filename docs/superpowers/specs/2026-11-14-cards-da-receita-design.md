# Os cards da receita no detalhe — design

**Pedido (14/11/2026):** melhorar o card "Receitas de novembro" do detalhe de
uma receita. Hoje ele mostra só o total verde (e, no mês corrente com receita
recorrente, "de R$ X esperados"). O dono escolheu, entre as versões do
artefato (https://claude.ai/artifact/WuDXM3myTKR4kGAxRXCgZ2), **R5, depois
R2 e R3, em três cards separados**, nessa ordem.

**Por quê:** o detalhe da despesa responde "isso pesa?" com cards de
contexto; a receita merece o mesmo: quanto ela é do mês, quanto sobra, e se a
renda está subindo.

## Abordagens consideradas

R1 (só a fatia), R2 (entrou/saiu/sobra), R3 (seis meses), R4 (lista), R5 (R1 +
esperado) e um card único juntando R5, R2 e R3. Escolhido: **R5, R2 e R3 em
três cards** (`BlocoContexto` cada um), na ordem.

## Os três cards

1. **Receitas de <mês>** (R5, o `BlocoReceitas` de hoje, redesenhado)
   - O total do mês grande, em `income`. No mês corrente com esperado > 0,
     ao lado: "de R$ <esperado>".
   - A barra (`Progress`): o máximo é o esperado (se maior que o total) ou o
     total; o valor é o total; a fatia desta receita acesa (`highlight`), na
     cor de receita.
   - A legenda: ponto na cor + "Esta, R$ <valor>" e, depois do " · ":
     - mês corrente com esperado > total: "faltam R$ <esperado − total> para entrar";
     - senão: "<n>% do que entrou em <mês>" (inteiro arredondado).
   - Link: o "Ver as N" de hoje. A manchete (`useFatiaDaManchete`) não muda.
2. **Saldo de <mês>** (R2)
   - Três colunas: **entrou** (verde, `income`), **saiu** (vermelho,
     `expense`), **sobra** (neutro; negativo em `expense`).
   - As contas são as do Painel (`aggregateIncomeExpenseForMonth`, receita
     pelo calendário, despesa pelo mês de despesa, estorno abatendo).
   - Link "Ver o mês": Transações filtradas pelo período do mês.
3. **Receitas nos últimos 6 meses** (R3)
   - Seis barras (o mês da receita e os cinco anteriores), o mês da receita
     aceso em `income` e os outros neutros, como as barras do histórico.
   - Eixo: o primeiro mês e o mês da receita (em negrito).
   - Selo no canto (`canto` do `BlocoContexto`): diferença para o mês
     anterior, "↑ R$ <d> sobre <mês>" (tom `success`) ou "↓ R$ <d> abaixo de
     <mês>" (tom `warning`); sem receita no mês anterior, sem selo.
   - Aparece só com receita em pelo menos 2 dos 6 meses.

## Restrições

- Só componentes e tokens existentes; `income`/`expense` para dinheiro,
  nunca `success`/`destructive` (invariante 3).
- Esqueleto `BlocoContextoEsqueleto` enquanto carrega; erro de consulta
  esconde o card (como hoje).
- Nenhuma gravação no banco.

## Fica para quem constrói

- Como desenhar as três colunas (o `DescriptionList` do sistema é o
  candidato).
- Reaproveitar a consulta do mês entre os cards (o React Query já dedup pela
  chave).
