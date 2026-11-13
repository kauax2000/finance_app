# Parcelas mês a mês (P4g) — design curto

**Por quê:** quase todo card do detalhe do lançamento tem uma barra, e a pessoa se perde. O card de impacto da parcela ("Parcelas em novembro") troca a barra por ladrilhos mês a mês, com o pico marcado (escolha do dono, 13/11/2026, mockup P4g).

**O que muda**
- O quadro do `ImpactoDaParcela` (detalhe e formulário) deixa de ter o número grande, a barra (`Progress`) e a legenda "outras · esta compra".
- No lugar: 4 ladrilhos, um por mês, a partir do primeiro mês com cobrança desta compra (ou do mês de hoje, se for depois). Cada ladrilho: o mês ("nov"), o total de parcelas do mês com esta compra, e embaixo "+ R$ 60 esta" em laranja (`text-warning`) ou "sem esta" em cinza.
- O primeiro ladrilho tem contorno laranja; o mês do pico (`pico.mes`) tem contorno claro e " · pico" no rótulo. Se forem o mesmo, fica o laranja com " · pico".
- O título vira "Parcelas mês a mês". "X% da renda recorrente", quando existe, fica numa legenda sob os ladrilhos. As frases de baixo (a menos por mês, cartão, limite) e o aviso de cima ficam como estão.

**Abordagens consideradas:** valores só (P1), anel (P2), conta (P3), antes/depois (P4d/P4f), tabela (P4e). Escolhida a P4g: mostra quando a compra deixa de pesar e o pior mês, sem barra.

**Não-objetivos:** mudar o pico, o aviso, as frases ou a previsão; mexer em `ui/`.

**Restrições:** tokens do design system (laranja = `warning`, como a barra de parcelas da folha do plano); valores por `MoneyDisplay`; a soma mês a mês sai da mesma conta do pico (`expandAllPlanCharges` por mês de cobrança, em centavos).
