# Proposta funcional do app — design

Data: 2026-10-20 · Escopo: **funcionalidades e regras**, não telas.
Fontes: inventário do código (2026-10-20), pesquisa de mercado (2026-10-20) e
o dossiê de ICP em [`docs/produto/2026-10-20-icp.md`](../../produto/2026-10-20-icp.md).

## 1. Intenção

O app nasceu para o dono controlar as despesas da família dele (ele, a esposa e
os filhos) de um jeito melhor que a planilha: dados, categorias, lançamento
rápido na rua e alertas. A ambição é servir a maioria das famílias, não só a
dele.

**O porquê, nas palavras do dono:** o gasto deixa de ser lançado por
"preguiça de abrir o app e preencher tudo na hora". Todo o resto (orçamento,
alertas, relatórios) depende de o dado entrar. Os avisos que o fariam agir
são **"a fatura do cartão chegando alta"** e **"conta vencendo"**.

### ICP

**"O CFO da casa":** a pessoa de 28 a 45 anos que assumiu o dinheiro da
família. Ela é casada ou mora junto, muitas vezes tem filhos, é da classe B/C
(renda familiar de ~R$ 6–25 mil, que pelas faixas da FGV vai do topo da classe C
à A, os 20–25% de cima: tem renda, falta controle) e usa iPhone. Quase tudo é no cartão, com
parcelas e Pix. Já tentou planilha ou um ou dois apps e largou. Os outros da
casa participam pouco.

Contexto de mercado que sustenta as decisões:
- 82% das famílias estão endividadas, e 85% dessas dívidas são de cartão (Peic, ago/2026).
- Compras parceladas são 12,7% das compras no cartão, mas 48,1% do valor (BCB).
- Só ~19% usam app de gestão financeira.
- O cuidado do dinheiro da casa recai muito sobre a mulher: 64% são as maiores responsáveis (Serasa).
- Cerca de metade das pessoas casadas já escondeu um gasto do parceiro.

O dossiê completo fica no arquivo do ICP.

**Anti-ICP:** quem quer gerir investimentos, e o MEI que mistura PJ com PF.

## 2. Objetivos, não-objetivos, anti-objetivos

**Objetivos** (na ordem de entrega):
1. **Alertas confiáveis:** os avisos que já existem disparam de verdade em produção.
2. **Captura sem abrir o app:** lançar pela Siri, por um Atalho ou sozinho ao pagar com Apple Pay. O que o app não tem certeza vai para "a conferir".
3. **Previsão:** um número de "quanto ainda posso gastar" até o próximo salário, a fatura projetada mês a mês e o aviso de fatura alta antes do fechamento.
4. **Família:** papel de convidado (filhos), "quem pagou", carteira dividida com acerto de contas e limite por pessoa.

**Não-objetivos (agora):**
- Open Finance: custa a partir de ~R$ 2,5 mil/mês, a sincronização é frágil e o BC está revisando as regras.
- Importação de OFX, CSV ou PDF.
- Bot de WhatsApp e Android (só quando o produto sair da família iPhone).
- IA paga para entender a frase: começa por regra e histórico.
- Metas de poupança, contas bancárias com saldo e investimentos.
- Monetização e planos (`/plans` segue placeholder).
- Desenho de telas: cada bloco desenha as suas no próprio plano, com o design system.

**Anti-objetivos.** Seria fracasso, mesmo funcionando:
- **Número que não bate:** "seguro para gastar", Painel e alerta dizendo valores diferentes. Uma função só calcula; todos leem dela.
- **Captura que perde dado:** um lançamento pela Siri que some, ou que entra em duplicidade.
- **Transparência forçada:** a carteira pessoal continua privada. Compartilhar é escolha.
- **Lançar exigir decisão:** a captura nunca pergunta nada na hora. Na dúvida, salva e marca "a conferir".
- **Convidado vendo o que não deve:** filho vendo renda, fatura ou gastos dos pais. Isso é falha de segurança, não de UX, e a garantia vem da RLS.

## 3. Restrições

- **O banco de dev é o de produção** (memória do projeto, desde set/2026). O Supabase CLI local não roda. Consequências:
  - nenhuma migração é aplicada e nenhuma Edge Function é publicada sem o dono aprovar na hora;
  - ao testar na prévia, só navegar e ler;
  - o que dá para testar fora do banco vira função pura com teste unitário (`npm run test:unit`, `npm run test:edge`).
- **Toda mudança de rota, destino ou fluxo atualiza** `docs/JORNADAS.md` e o Atlas (regra do `AGENTS.md`).
- **Tela nova segue o design system:** componente novo ou variant nova em `src/components/ui/` exige ok do dono (invariante 6).
- **Fuso:** "hoje" é `America/Sao_Paulo` (`app_today()`), como já é.
- **PWA no iPhone:** sem widget, sem share sheet, sem ler notificação. O que roda fora do app é o app Atalhos chamando uma URL.

## 4. O que já existe e se reaproveita

- Carteiras pessoal e compartilhada; papéis `owner` e `member`; convite por e-mail ou link.
- Transação com `user_id` imutável (o autor) e fila offline.
- Fatura calculada no cliente (`src/lib/credit-card-billing.ts`). Compra no crédito conta no mês do fechamento (`expense-month-attribution.ts`). Parcelas são lançadas uma por vez pelo cron e projetadas no cliente.
- Assinaturas, contas a pagar (`bills`/`bill_instances`) e orçamento por categoria e mês.
- Notificações nos três canais (no app, push e e-mail), com preferências por carteira. Os produtores são:
  - `evaluate-budgets` e `evaluate-credit-card-alerts`, chamados pelo cliente;
  - `credit-card-calendar-alerts` e `evaluate-bills-reminders`, por cron criado à mão;
  - `notify-transaction-created`, por Database Webhook criado à mão.

Código órfão a resolver no bloco em que for substituído:
- `transaction_splits` (divisão por categoria, sem uso);
- `transactions.is_recurring` e `recurring_interval`;
- `credit_card_category_spend_alerts` (tabela sem tela; fica fora deste escopo).

## 5. Bloco 1 — Alertas confiáveis

**Problema.** Os crons de `credit-card-calendar-alerts` e `evaluate-bills-reminders` e o webhook de `notify-transaction-created` vivem só no Dashboard. As Edge Functions revisadas em 17/out não foram publicadas (lacuna 8). A pessoa pode não estar recebendo o aviso de conta vencendo.

**Decidido:**
- Os dois crons e o gatilho de transação nova passam para migração, com `pg_cron` e `pg_net` (já habilitados no baseline). O segredo vem do Vault, nunca escrito na migração.
- O gatilho de transação nova substitui o webhook do Dashboard. Depois de aplicar, o webhook manual é removido para não disparar duas vezes. Isso é um passo do dono, documentado.
- `dispatch-notifications` deixa de aceitar pedidos em produção (lacuna 8).
- `NOTIFICATION_DEPLOYMENT.md` vira um roteiro de publicação em ordem: segredos no Vault → migração → deploy das funções → teste de fumaça. A publicação é feita pelo dono ou com o ok dele.
- Fecha a lacuna 8 no `JORNADAS.md`.

**Fica para quem constrói:** o formato exato do segredo no Vault e o nome dos jobs.

## 6. Bloco 2 — Captura sem abrir o app

### Canais
1. **Apple Pay (automação "Transação" do Atalhos, iOS 17+).** Dispara ao pagar pela Wallet e manda valor, estabelecimento e nome do cartão.
2. **Siri / Atalho de texto ou voz.** "Gastei 42 no mercado" chega como frase livre.
3. **O "+" do app** aceita a mesma frase livre num campo único, além do formulário de hoje.

### Ponto de entrada
- Uma Edge Function `capture` recebe um `POST` autenticado por um **token pessoal de captura**, nunca pela sessão. O pedido traz `{ text }` ou `{ amount, merchant, card }`.
- A resposta é uma frase curta para a Siri falar: "Anotado: R$ 42,00 em Mercado, no Nubank. Confira no app se precisar."
- Token:
  - gerado no app, guardado só como hash, com `last_used_at`;
  - revogável;
  - ligado a uma pessoa e a uma **carteira padrão**. *[decisão minha]*
    O destino de cada captura sai assim: o cartão casado (`wallet_alias` ou o
    nome dito) leva o lançamento à carteira do cartão, se a pessoa for membro
    dela. Sem cartão casado, vai para a carteira padrão. A busca do cartão
    corre em todas as carteiras da pessoa;
  - um por aparelho. O texto do token aparece uma vez só, ao gerar.
- O app oferece o Atalho pronto para instalar (link do iCloud com o token preenchido, ou instrução passo a passo). **Fica para quem constrói** escolher o caminho, depois de medir qual funciona no iOS atual.
- **Idempotência:** o Atalho manda um id do pedido, guardado em `transactions.client_id` (que já existe). Repetir o pedido não duplica.
- Depois de salvar, a função roda os mesmos avaliadores que o cliente roda hoje (orçamento, limite do cartão), porque não há cliente para chamá-los.

### Da frase ao lançamento
Função pura `interpretarFrase`, sem rede e com teste, usada pela Edge e pelo "+":
- **Valor:** "42", "42,90", "R$ 42", "1.234,56", "mil e duzentos" (por extenso: só o básico; **fica para quem constrói** o limite).
- **Data:** hoje por padrão; aceita "ontem" e "dia 12".
- **Parcelas:** "em 10x" → compra parcelada (usa a RPC de parcelamento existente).
- **Receita:** "recebi 500 freela" → receita.
- **Cartão ou forma:** nome do cartão ("nubank", "inter"), "pix", "dinheiro", "débito".
- **O resto vira descrição.**

Depois vem o **preenchimento pelo histórico, sem tabela nova**. A transação mais recente da mesma carteira cuja descrição normalizada (minúscula, sem acento) bate com a palavra-chave dá a categoria, a forma de pagamento e o cartão. Corrigir uma transação é o que ensina o app: a correção vira a "mais recente".

Para o Apple Pay:
- o estabelecimento vira a descrição;
- o nome do cartão da Wallet casa com um cartão cadastrado por um apelido, `credit_cards.wallet_alias`, gravado quando a pessoa confere o primeiro lançamento daquele cartão;
- sem casamento, o lançamento entra em "a conferir".

### "A conferir"
- Duas colunas novas em `transactions`:
  - `needs_review boolean default false`;
  - `source text`, com os valores `app`, `shortcut`, `apple_pay` e `quick_text`.
- O lançamento entra **sempre** e fica marcado quando falta categoria, quando o cartão não casou ou quando a frase foi ambígua.
- Uma lista "A conferir" junta esses itens. Confirmar é um toque; corrigir abre o formulário. Qualquer edição salva tira a marca.
- O Painel mostra a contagem.
- Um lembrete diário (push, às 20h) avisa se houver itens a conferir. É opt-out nas preferências.

### Regras
- O lançamento por captura respeita a RLS como se a pessoa tivesse lançado: o autor é o dono do token.
- Captura nunca é bloqueada por plano.
- **A acrescentar no `JORNADAS.md`:** a jornada de gerar e instalar o Atalho, e a da lista "a conferir".

## 7. Bloco 3 — Previsão

### Receita recorrente
`workspace_subscriptions` ganha `kind` (`expense` | `income`, padrão `expense`). O salário vira uma recorrência de receita. O cron existente lança a receita no dia, do mesmo jeito que lança a assinatura.

### "Seguro para gastar"
Uma função pura `seguroParaGastar(carteira, hoje)` no cliente, testada, é a única fonte do número. O Painel e o alerta de fatura leem dela.

- **Regime de caixa** (o dinheiro que entra e sai da conta) dentro do **ciclo
  da carteira**: de `workspaces.cycle_start_day` (padrão 1) até a véspera do
  mesmo dia no mês seguinte. Quem recebe no dia 5 põe 5. Com duas rendas
  (dias 5 e 20), as duas caem no mesmo ciclo. *[decisão minha]*
- **Não há saldo de partida** (conta bancária é não-objetivo). O número é o
  orçamento do ciclo, e a sobra do ciclo anterior não entra. *[decisão minha]*
- **A conta:**
  - receitas do ciclo, as recebidas e as previstas,
  - − despesas do ciclo fora do crédito (Pix, débito, dinheiro, TED), as pagas e as previstas (assinaturas, parcelas, contas a pagar pendentes),
  - − faturas que vencem no ciclo (abertas ou fechadas, com as parcelas projetadas e os estornos),
  - − reserva mensal (`workspaces.monthly_savings_target`, opcional),
  - = **seguro para gastar**. Mostra também o valor por dia até o fim do ciclo.
- A compra de hoje no crédito não reduz este ciclo, porque cai numa fatura que vence no seguinte. O Painel mostra ao lado "já comprometido na próxima fatura".
- Com tabela de casos: ciclo com e sem renda recorrente, `cycle_start_day` 1, 5 e 31, fatura que vence no último dia do ciclo, estorno.

### Linha do tempo de 6 meses
`projecaoMensal(carteira, meses = 6)`: por mês, quanto entra, quanto sai (as faturas por cartão com as parcelas futuras, as contas, as assinaturas) e quanto sobra. Mostra o mês em que uma parcela termina e o primeiro mês negativo.

### Orçamento que se repete
*[decisão minha, depois da revisão]*
- **Copiar adiante** em vez de "vale até a próxima linha".
  - `budgets` ganha `repeats boolean default true`. Continua uma linha por mês, e a deduplicação `threshold_*_sent_at` fica onde está.
  - No dia 1 de cada mês, um job copia para o mês novo as linhas com `repeats` do mês anterior. O job é idempotente e roda pelo `pg_cron` e também ao abrir o Painel, como o `catch_up_recurring_billing`.
- **Migração:** só as linhas do mês corrente ganham `repeats = true`. Meses antigos não ressuscitam.
- **Encerrar** um limite é desligar `repeats` e, se a pessoa quiser, apagar a linha do mês. A constraint `amount > 0` não muda.
- **Mudar o valor** muda a linha do mês, e a cópia seguinte leva o valor novo.

### Fatura que bate com o banco
O dossiê achou a maior raiva das avaliações dos concorrentes: o total da fatura
não bate com o do banco. As causas são parcela mal tratada e estorno ignorado.

- **Estorno no cartão:** uma receita com forma `credit_card` e cartão abate a
  fatura do ciclo em que cai. Hoje `credit-card-billing.ts` soma só despesas
  (por volta da linha 300). A frase livre aceita "estorno 80 nubank".
- **Conferir a fatura:**
  - ao fechar, a pessoa pode informar o total que o banco cobrou, gravado em
    `credit_card_invoice_payments.bank_total` ou numa tabela de fechamento
    (**fica para quem constrói** escolher qual);
  - o app mostra a diferença ("faltam R$ 63 lançados nesta fatura");
  - o pagamento e a previsão passam a usar o total do banco quando ele existe.

### Mês de uma compra no crédito, em todo lugar
*[decisão minha]* Os alertas de orçamento e de limite por pessoa passam a
contar a compra no crédito pelo **mês do fechamento da fatura**, como a tela da
categoria já faz (`expense-month-attribution.ts`).

O `evaluate-budgets` usa o `_shared/credit-card-cycle.ts`, que já existe. É
mudança de comportamento para quem já usa o app, e é intencional: hoje o alerta
e a tela discordam.

### Alerta de fatura alta
Novo tipo `cc_invoice_trending_high`, produzido pelo cron diário de `credit-card-calendar-alerts`. Dispara quando a fatura aberta, somada às parcelas que ainda vão cair nela, passa de 120% da média das últimas 3 faturas fechadas (sem histórico, não dispara).

A mensagem diz o cartão, o valor previsto, quanto acima do normal e quanto sobra no mês do vencimento:
> "Nubank fecha dia 3 com R$ 4.180 previstos, 25% acima do normal. Em novembro sobram R$ 300."

Dispara uma vez por ciclo; volta a disparar no ciclo seguinte. O tópico é o "cartão (fatura e vencimento)", que já existe.

**Fica para quem constrói:** a conta do "sobra no mês" roda no servidor dentro da Edge, então a lógica do `seguroParaGastar` precisa existir onde a Edge alcança. Pode ser um módulo puro compartilhado entre o cliente e o Deno ou um porte com o mesmo teste de tabela. O que decide é ter um caso de teste que trave os dois iguais.

## 8. Bloco 4 — Família

### Papéis
`workspace_members.role` ganha `guest`.

| | Dono | Membro | Convidado |
|---|---|---|---|
| Lançar despesa | sim | sim | sim (autor = ele) |
| Ver transações | todas | todas | só as dele |
| Editar/excluir | tudo | tudo | só as dele |
| Categorias e cartões | gerencia | gerencia | só lê (para lançar) |
| Orçamento, faturas, previsão, contas | vê | vê | não vê |
| O próprio limite e quanto resta | vê | vê | vê |
| Convites e membros | gerencia | não | não |

- **A RLS é a garantia.** Toda política de leitura e escrita das tabelas da carteira passa a distinguir `guest`. As RPCs `security definer` que devolvem pacotes (Painel, contas, categoria) recusam ou filtram para o convidado.
- O convite escolhe o papel: membro ou convidado.
- O dono pode trocar o papel depois (os helpers `logFamilyRoleChanged` já existem).

### Quem pagou
- `transactions.paid_by uuid`, com padrão no autor e editável por dono e membro.
- Na carteira de pote único serve só para saber de quem é o gasto; na dividida, alimenta o acerto.

### Modo da carteira compartilhada
`workspaces.split_mode`: `pooled` (padrão) ou `split`.

**`pooled` (pote único).** É a família do dono: um provedor, ninguém deve a ninguém, sem divisão nem acerto.

**`split` (dividida).** Para casal de renda dupla, irmãos que cuidam dos pais ou república.
- A carteira tem uma regra padrão de divisão entre os **membros** (convidados ficam fora): igual ou por pesos (proporcional à renda, com o peso informado à mão).
- Cada despesa pode trocar a regra por valores livres.
- As partes ficam em `transaction_shares(transaction_id, user_id, amount)`. *[decisão minha]*
  - Um **trigger no banco** as gera e as regenera, para valer em toda origem: o app, a captura e o cron das parcelas e assinaturas.
  - A soma das partes é sempre igual ao valor; o centavo que sobra vai para quem pagou.
  - A regra livre de uma compra parcelada mora no plano de parcelamento (em percentuais) e vale para todas as parcelas futuras.
  - Editar uma parcela só muda aquela parcela.
- **Despesa de convidado na carteira dividida** *[decisão minha]*: o convidado
  tem um **responsável** (`workspace_members.sponsor_user_id`, por padrão quem
  convidou). O `paid_by` da despesa dele é o responsável, e as partes seguem a
  regra da carteira. O filho nunca entra no saldo.
- **Saldo entre pessoas** = o que cada um pagou (`paid_by`) − as partes dele ± os acertos.
- "Acertar" grava em `settlements(workspace_id, from_user, to_user, amount, date, note)`. O Pix em si acontece fora do app.
- Trocar de modo não apaga nada. Voltar a `pooled` só esconde o saldo.
- `transaction_splits` (o órfão) é removido aqui.

### Limite por pessoa
- `workspace_member_limits(workspace_id, user_id, amount)`: um teto mensal que se repete, como o orçamento.
- A conta usa as despesas em que a pessoa é `paid_by`, ou o autor quando ela é convidada. A compra no crédito conta pelo mês do fechamento.
- Avisa em 80% e 100%, para a pessoa e para o dono, num tópico novo, "limite por pessoa", com deduplicação por mês.

### Notificações
- O convidado só recebe os avisos do próprio limite.
- O aviso de "despesa lançada por outro membro" não sai para o convidado.
- A despesa do convidado avisa o dono e os membros, como hoje.

## 9. O que fica para quem constrói

- A forma de cada tela, dentro do design system; perguntar antes de criar componente.
- Os nomes de colunas e funções que este documento não fixou.
- O formato do Atalho distribuído.
- O limite do valor por extenso no parser.
- O limiar exato do alerta de fatura alta, se 120% se mostrar ruidoso nos dados reais. Ajustar exige avisar.
- A ordem interna das tarefas de cada bloco.

## 10. Entrega

Um plano por bloco, na ordem 1 → 2 → 3 → 4. Cada bloco termina com:
- tipos (`npm run db:types` não roda sem banco local, então os tipos são atualizados à mão em `src/types/database.ts`);
- `npx tsc --noEmit && npm run lint && npm run test:unit` verdes, e `npm run test:edge` quando houver Edge;
- `JORNADAS.md` e Atlas atualizados quando o bloco mexer em jornada;
- a lista do que precisa ser aplicado em produção (migrações, segredos, deploy), entregue ao dono para aprovar.
