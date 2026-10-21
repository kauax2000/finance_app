# Proposta funcional do app — design

Versão 2, de 2026-10-21. Escopo: **funcionalidades e regras**, não telas.

Fontes:
- inventário do código (20/10);
- pesquisa de mercado (20/10);
- dossiê de ICP em [`docs/produto/2026-10-20-icp.md`](../../produto/2026-10-20-icp.md);
- estratégia de produto em [`docs/produto/2026-10-21-estrategia-de-produto.md`](../../produto/2026-10-21-estrategia-de-produto.md), que traz posicionamento, entregas ranqueadas, planos e oferta;
- saídas das founder skills em [`founder/`](../../../founder);
- os 15 pontos do dono (21/10), marcados neste texto como **(P1)** a **(P15)**.

## 1. Intenção

O app nasceu para o dono controlar as despesas da família (ele, a esposa e os filhos) melhor do que a planilha: dados, categorias, lançamento rápido na rua e alertas. A ambição é servir a maioria das famílias brasileiras, não só a dele, e não só quem usa iPhone **(P2)**.

**O porquê, nas palavras do dono:**
- O gasto não é lançado por "preguiça de abrir o app e preencher tudo na hora".
- Os avisos que o fariam agir são "fatura do cartão chegando alta" e "conta vencendo".

**Visão:** o app deve ser inteligente e se provar.
- Dá dicas e resumos em cada funcionalidade **(P8)**.
- Passa segurança e modernidade, com sensação premium **(P15)**.
- O visual é o ponto-chave. Os apps nativos iOS e Android vêm logo depois do PWA.

### ICP
**"O CFO da casa":** quem assumiu o dinheiro da família.
- Tem de 28 a 45 anos e é casado ou mora junto, muitas vezes com filhos.
- A renda familiar vai de ~R$ 6 a 25 mil (o topo da classe C até a A, segundo a FGV): tem renda, falta controle.
- Usa principalmente cartão, com parcelas e Pix.
- Já tentou planilha ou app e largou.
- Usa iPhone ou Android (o Android tem 72% do mercado).

O detalhe está no dossiê. **Anti-ICP:** quem gere investimentos, e o MEI que mistura PJ com PF.

### Entregas de valor, em ordem (P11)
1. Fatura que bate.
2. Lançar sem esforço.
3. Saber quanto ainda dá para gastar.
4. Avisar antes e explicar depois.
5. Família no mesmo número, com privacidade.
6. Dados seus, sem conectar o banco.
7. Premium que se prova.

A justificativa de cada uma está na estratégia, §2.

## 2. Objetivos, não-objetivos, anti-objetivos

**Objetivos:** os blocos 1 a 8 (§5–§12), na ordem do §14.

**Não-objetivos (agora):**
- **Open Finance.** Ficar sem ele é posicionamento (**P13**: "sem conectar o banco"), não falta de recurso. O que ele faria vem por outros caminhos: captura pelo celular, PDF da fatura e importação.
- **Metas de poupança, contas bancárias com saldo e investimentos.**
- **App nativo.** Vem logo depois do PWA (§13), mas fica fora deste documento. O que entra aqui é só o que não pode quebrar depois: o direito de uso multicanal.
- **Desenho de telas.** Cada bloco desenha as suas no próprio plano, com o design system.

**Anti-objetivos.** Seria fracasso, mesmo funcionando:
- **Número que não bate.** O "seguro para gastar", o Painel, o alerta e a fatura conferida dizendo valores diferentes. Uma função calcula; todos leem dela.
- **Captura que perde dado ou duplica.**
- **Lançar exigir decisão.** Na dúvida, o app salva e marca "a conferir".
- **Convidado vendo o que não deve.** É falha de segurança, e a garantia está no banco (RLS e RPCs), nunca só na tela.
- **Cobrar pelo ato de lançar.** Paywall depois que a pessoa inseriu dados, cobrança surpresa, cancelamento difícil.
- **IA que treina com o dado da pessoa.** Nenhum free tier que use os dados para treino, em produção.
- **Insight que vira ruído ou sermão.** Todo aviso tem ação, e há teto de push.

## 3. Restrições

- **O banco de dev é o de produção**, e o Supabase CLI local não roda.
  - Nenhuma migração é aplicada e nenhuma Edge Function é publicada sem o dono aprovar na hora.
  - Na prévia, só navegar e ler.
  - A lógica vira função pura com teste (`npm run test:unit`, `npm run test:edge`).
- **Mudança de rota, destino ou fluxo atualiza** `docs/JORNADAS.md` e o Atlas.
- **Tela nova segue o design system.** Componente ou variant nova em `src/components/ui/` exige ok do dono (invariante 6).
- **Fuso:** `America/Sao_Paulo` (`app_today()`).
- **Limites do PWA:**
  - No iOS não há share target nem leitura de notificação. O que roda fora do app é o Atalhos.
  - No Android, o PWA instalado tem Web Share Target e atalhos do ícone.
  - Ler notificação de banco é só com app nativo.
- **Contas de terceiros que o dono abre** (pré-requisitos; ninguém cria conta por ele):
  - Asaas;
  - Meta Business com o WhatsApp Cloud API e um número dedicado;
  - Google AI (Gemini) com billing ligado;
  - Cloudflare (Workers AI).
  - O CNPJ é exigido pelo Asaas, e pelo Pix Automático só depois de 6 meses.

## 4. O que já existe e se reaproveita

- Carteiras pessoal e compartilhada; papéis `owner` e `member`; convite por e-mail ou link.
- Transação com `user_id` imutável e fila offline.
- Fatura calculada no cliente (`credit-card-billing.ts`). A compra no crédito conta no mês do fechamento (`expense-month-attribution.ts`).
- Parcelas lançadas uma a uma pelo cron e projetadas no cliente.
- Assinaturas, contas a pagar (`bills`/`bill_instances`, nunca usadas pelo dono **(P6)**) e orçamento por categoria e mês.
- Notificações no app, por push e por e-mail, com preferências por carteira.
- `delete-user` (apagar conta) e a exportação CSV, que hoje existe só nas assinaturas.

**Órfãos a resolver no bloco que os substitui:**
- `transaction_splits`;
- `transactions.is_recurring` e `recurring_interval`;
- `credit_card_category_spend_alerts`, que fica fora deste escopo.

## 5. Bloco 1 — Alertas confiáveis

**Problema.** Os crons de `credit-card-calendar-alerts` e `evaluate-bills-reminders` e o webhook de `notify-transaction-created` existem só no Dashboard. As Edge Functions revisadas em 17/out não foram publicadas (lacuna 8).

**Decidido:**
- Os dois crons e o gatilho de transação nova passam para migração, com `pg_cron` e `pg_net`. O segredo fica no Vault.
- O gatilho substitui o webhook do Dashboard. Removê-lo é um passo documentado do dono.
- `dispatch-notifications` deixa de aceitar pedidos em produção.
- `NOTIFICATION_DEPLOYMENT.md` vira roteiro em ordem: Vault → migração → deploy → teste de fumaça.
- A lacuna 8 fecha no `JORNADAS.md`.

**Fica para quem constrói:** o formato do segredo e os nomes dos jobs.

## 6. Bloco 2 — Fatura que bate, e anexos (P7, P10, P5)

A dor nº 1: "a fatura não bate". O número do app tem de bater com o do banco. Quando não bate, o app diz exatamente onde.

### Estorno e total do banco
- **Estorno no cartão.** Uma receita com forma `credit_card` e cartão abate a fatura do ciclo. Hoje `credit-card-billing.ts` soma só despesas, por volta da linha 300. A frase livre aceita "estorno 80 nubank".
- **Total do banco.** Ao fechar a fatura, a pessoa informa o total cobrado, ou ele vem do PDF.
  - Fica gravado no fechamento da fatura (`bank_total`). Onde guardar é com quem constrói: em `credit_card_invoice_payments` ou numa tabela de fechamento.
  - O app mostra a diferença ("faltam R$ 63 nesta fatura").
  - Pagamento e previsão usam o total do banco quando ele existe.

### Conferir a fatura pelo PDF (P7)
A pessoa envia o PDF pelo app, pelo WhatsApp, pelo "compartilhar" do Android ou pelo Atalho do iOS.

1. **Texto.** A camada de texto é extraída no **cliente**, com pdf.js. Se o PDF tiver senha, o app pede. Antes de qualquer envio, as linhas de identificação (nome, CPF, endereço) saem por regex.
2. **Estrutura.** Só o texto vai à IA paga, que não treina com o dado (Gemini 2.5 Flash, ver §8). A resposta é um JSON:
   - os itens: `data`, `descrição`, `valor`, `parcela k/n`, `é estorno`;
   - os totais: total, fechamento, vencimento.
3. **Validação.** A soma dos itens tem de dar o total declarado. Se não der, a leitura fica **"incompleta"** e a diferença aparece. Nunca se esconde.
4. **Conferência.** Uma função pura `conferirFatura(itensDoBanco, lancamentos)`, com tabela de testes, compara por valor exato, data ±3 dias e descrição parecida. O resultado vem em cinco grupos:
   - **bate**;
   - **falta no app**: importar todos ou só os escolhidos, como "a conferir", com categoria pelo histórico;
   - **só no app**: talvez de outro ciclo ou de outro cartão;
   - **valor diferente**;
   - **parcela fora de sequência**.
5. **O PDF fica guardado** como anexo daquele fechamento.

### Começar com histórico (bônus "Mudança sem esforço")
- **A última fatura em PDF** entra pelo mesmo leitor e vira lançamentos, todos marcados "a conferir".
- **A planilha** (CSV ou Google Sheets exportado) entra com mapeamento de colunas: data, descrição, valor e categoria opcional.
  - Categorias novas são criadas por nome.
  - A importação é desfazível em lote: a transação ganha um `import_batch_id`.

### Anexos (P5)
- **Tabela.** `attachments(id, workspace_id, transaction_id?, bill_instance_id?, invoice_ref?, path, mime, size_bytes, created_by, created_at)`.
- **Armazenamento.** Bucket privado, com o caminho `{workspace_id}/{uuid}`.
  - A política em `storage.objects` vai pela participação na carteira; o convidado vê só os anexos dele.
  - O acesso é por URL assinada de 1 h.
  - Tamanho até 10 MB. Tipos aceitos: `image/*` e `application/pdf`.
- **Imagem.** Comprimida no cliente para WebP de 1600 px, qualidade 0,8, com `canvas.toBlob`. Recodificar assim também tira o EXIF e o GPS.
- **Usos.** Nota fiscal ou recibo junto de uma cobrança, para ver depois; o boleto numa conta a pagar; o PDF da fatura.
- **Apagar.** Apagar o lançamento apaga o objeto pela API de Storage. Um job semanal limpa os órfãos.
- **Cota.** Grátis: 50 anexos. Família: 5 GB.

## 7. Bloco 3 — Captura sem abrir o app (P2, P3)

### Canais
| Canal | Plataforma | O que chega |
|---|---|---|
| Frase livre no "+" do app | todas | "42 mercado nubank em 3x" |
| **WhatsApp** (Cloud API oficial) | todas | texto, **áudio**, foto de nota ou comprovante, PDF de fatura |
| Atalho + automação "Transação" (Apple Pay) | iPhone | valor, estabelecimento, cartão, sem digitar |
| Atalho de Siri e folha de compartilhar | iPhone | voz, texto, imagem, PDF |
| **Web Share Target** do PWA instalado | Android | print, comprovante PDF, texto compartilhado do app do banco |
| Atalhos do ícone (`shortcuts` no manifest) | Android e desktop | "Nova despesa", "A conferir" |

Um guia opcional mostra o Tasker/MacroDroid para ler a notificação do banco no Android. É só documentação, para quem é avançado.

### Ponto de entrada
- **Edge Function `capture`.** Recebe pelo **token pessoal de captura** (Atalhos e share target) ou pelo vínculo do WhatsApp. O pedido traz `{ text }`, `{ amount, merchant, card }` ou um arquivo.
- **Token de captura:**
  - guardado só em hash, revogável, um por aparelho, mostrado uma vez só;
  - ligado à pessoa e a uma **carteira padrão**;
  - um cartão reconhecido leva o lançamento à carteira do cartão (`wallet_alias` ou o nome dito), desde que a pessoa seja membro dela. *[decisão minha]*
- **Idempotência.** O id do pedido (ou o id da mensagem do WhatsApp) vira `transactions.client_id`.
- **Depois de salvar,** a função roda os avaliadores de orçamento e de limite. Não há cliente para chamá-los.

### WhatsApp
- **Número:** um só, do produto, na Cloud API oficial. Não oficiais (Z-API, Baileys) estão fora: risco de banimento e de dado.
- **Vincular:** o app mostra "mande `vincular 482913`". O webhook liga o telefone à pessoa em `whatsapp_links(user_id, phone, verified_at)`.
- **Convite:** o cônjuge convidado pelo WhatsApp aceita uma vez no navegador (link mágico) e depois só lança pelo WhatsApp, **sem instalar nada**.
- **Webhook:** a Edge `whatsapp-webhook` valida `X-Hub-Signature-256`. Por tipo de conteúdo:
  - **texto:** vai ao parser;
  - **áudio:** transcrição (Whisper no Cloudflare), depois o parser;
  - **imagem:** leitura de nota ou comprovante (Gemini Flash-Lite), depois o parser, e a imagem vira anexo;
  - **PDF:** vai à conferência de fatura (§6).
- **Confirmação:** marcar como lida é o "anotei". **Responder só em erro, em ambiguidade e na primeira vez** (custo: 1.000 respostas de serviço grátis por mês; acima disso, pago).
- **Avisos:** vão por **Web Push**, nunca por template do WhatsApp.
- **Plano:** o WhatsApp é do plano Família. No Grátis, só durante o teste.

### Da frase ao lançamento
- **Parser `interpretarFrase`:** função pura, compartilhada entre a Edge e o cliente, com tabela de testes. Entende:
  - valor ("42", "42,90", "R$ 42", "1.234,56" e o básico por extenso);
  - data ("ontem", "dia 12");
  - "em 10x";
  - receita ("recebi"), estorno;
  - cartão ou forma ("nubank", "pix", "débito");
  - o resto vira descrição.
- **Preenchimento pelo histórico, sem tabela nova.** A transação mais recente da carteira com a mesma descrição normalizada dá a categoria, a forma e o cartão. Corrigir ensina.
- **IA só no que o parser não resolve, e só no plano Família:** frase confusa, áudio, foto. Ver §8.
- **Apple Pay:**
  - o estabelecimento vira a descrição;
  - o nome do cartão na Wallet casa com `credit_cards.wallet_alias`, gravado na primeira conferência;
  - sem casamento, o lançamento vai para "a conferir".

### "A conferir"
- `transactions.needs_review boolean` e `transactions.source`, com os valores:
  - `app`, `quick_text`, `shortcut`, `apple_pay`, `whatsapp`, `share`;
  - `import_pdf`, `import_sheet`, `recurring`.
- O lançamento entra **sempre** e fica marcado quando há dúvida.
- A lista "A conferir": confirmar com 1 toque; editar tira a marca.
- A contagem aparece no Painel.
- Às 20h, um lembrete se houver itens; dá para desligar.

### Regras
- A captura respeita a RLS como se a pessoa tivesse lançado.
- **Lançar à mão e a frase livre no app são grátis para sempre.** Os canais automáticos e a IA são do Família, liberados no teste reverso.
- **No `JORNADAS.md`:** a jornada de vincular WhatsApp, a de instalar o Atalho, a de compartilhar no Android e a da lista "a conferir".

## 8. IA no app (P3)

**Não existe IA grátis que sirva para dado financeiro real.**
- Os free tiers do Gemini, do Mistral e os `:free` do OpenRouter podem treinar com o dado ou ter revisão humana.
- A IA paga e barata custa centavos.

| Tarefa | Provedor | Custo |
|---|---|---|
| Transcrever áudio pt-BR | Cloudflare Workers AI, Whisper turbo (não treina) | cota grátis cobre ~1.900 usuários |
| Frase confusa e foto de nota/comprovante | Gemini 2.5 Flash-Lite pago (não treina) | ~US$ 0,01 por usuário/mês |
| Fatura PDF (a partir do texto) | Gemini 2.5 Flash pago | centavos por fatura |
| Resumos e dicas (§11) | Gemini 2.5 Flash-Lite pago | centavos |
| Reserva | Claude Haiku 5.5 | US$ 0,10 / 0,50 por MTok |

- **Um módulo só**, `supabase/functions/_shared/ia.ts`, com `transcrever`, `interpretar`, `lerImagem`, `lerFatura` e `resumir`.
  - Toda saída vem em JSON com schema e é validada.
  - Saída inválida vira "a conferir", nunca um lançamento errado silencioso.
- **Teto de custo por casa:** 300 chamadas por mês, com registro de uso.
- **Privacidade:**
  - nome, CPF e endereço saem antes do envio;
  - a política de privacidade cita a transferência internacional e o DPA do provedor;
  - os segredos ficam só nas Edge Functions.
- **Desenvolvimento:** free tier só com dado sintético.

## 9. Bloco 4 — Planos e confiança (P4, P14, P15)

Detalhe comercial na estratégia §3–§4 e em `founder/pricing.md` e `founder/offer.md`.

### Direito de uso
- **Tabela** `billing_subscriptions(user_id, provider: asaas|apple|google, provider_ref, plan: familia, interval: month|year, status: trialing|active|past_due|canceled|expired, trial_ends_at, current_period_end, cancel_at_period_end, price_cents, founder bool)`.
  - O nome evita confusão com `workspace_subscriptions`, as assinaturas do usuário.
- **`workspace_plan(workspace_id)`:** o plano é Família se o **dono** da carteira tiver plano ativo ou em teste.
  - Os membros herdam o plano dentro daquela carteira.
  - A função nasce no Bloco 2 devolvendo `familia` para todos e passa a valer neste bloco.
- **Quem garante é o servidor.** As Edge Functions de captura automática, IA, PDF e anexos checam o plano. A tela só reflete.

### Cobrança: Asaas
- **Checkout** pela Edge `billing-checkout`, criado no servidor. O CPF da pessoa é pedido no checkout, porque o Asaas exige.
- **Formas:** cartão recorrente e Pix. O Pix Automático entra quando o CNPJ tiver 6 meses.
- **Webhook** `asaas-webhook`, validado pelo `asaas-access-token`, faz upsert do status.
- **NFS-e automática** em toda cobrança.

### Regras de cobrança honesta
- **Teste reverso.** Toda conta nova entra no Família por 14 dias, sem cartão.
  - No dia 12, aviso e o **relatório do teste** (o que o app lançou e achou).
  - No dia 14, a conta volta ao Grátis.
  - No lançamento do plano, quem já usa o app também ganha 14 dias.
  - O dono e a família dele recebem um plano vitalício manual. *[decisão minha]*
- **Cancelar em 1 toque.** A Edge `billing-cancel` marca `cancel_at_period_end`.
- **Aviso 7 dias antes de renovar** (anual), por push e e-mail, via cron.
- **Arrependimento de 7 dias (CDC art. 49).** Um botão de reembolso visível nesses 7 dias; o estorno sai pela API do Asaas.
- **"Bateu ou devolvemos."** No 1º mês pago, pelo suporte, é processo manual documentado; não se automatiza.
- **Voltar ao Grátis nunca apaga dado.** Os membros continuam, com lançamento manual e leitura. Os canais automáticos, a IA e os anexos novos param, e convites novos ficam bloqueados acima de 1. *[decisão minha]*
- **Preço na porta.** `/plans` mostra o preço também a quem não entrou.
- **Fundadores:** R$ 119 no 1º ano até 31/01/2027, com o preço mantido enquanto ativo.

### Jornada depois da compra ou do início do teste (P14)
Um assistente de 4 passos. Cada passo mostra o que o app fará sozinho e deixa ligar e testar ali mesmo:
1. **"O que eu lanço por você".**
   - Os canais por plataforma, com o primeiro lançamento feito na hora.
   - O pedido do PDF da última fatura: a conferência é o "aha".
2. **"Como eu decido".** A categoria pelo histórico; na dúvida, "a conferir".
3. **"O que eu aviso".** Os alertas ligados e a data do próximo de cada um.
4. **"Quem vê o quê".** Os papéis e o convite do cônjuge pelo WhatsApp.

### Piloto Automático e Cofre aberto (P14, P15)
- **Piloto Automático.** Mostra o que o app fez sozinho, com origem, hora e desfazer:
  - transações com `source` diferente de `app`;
  - categorias definidas automaticamente;
  - importações (desfazer em lote);
  - lançamentos do cron (`source = recurring`).
  - Não precisa de tabela nova, só de `source`. Os crons de assinatura e de parcela passam a gravá-lo.
- **Cofre aberto.** Explica o que guardamos, onde, quem vê e por que pedimos cada dado. Também tem:
  - "não pedimos senha de banco";
  - **exportar tudo** (CSV por tabela das carteiras da pessoa, num ZIP), no Grátis também;
  - **apagar a conta** (o `delete-user`, que já existe).
- **Premium que se prova.** O relatório de valor do mês (§11) é o recibo do que a assinatura entregou.

## 10. Bloco 5 — Previsão (P12)

### Receita recorrente
`workspace_subscriptions.kind` passa a aceitar `expense` | `income`. O salário vira uma receita recorrente lançada pelo cron.

### "Seguro para gastar"
`seguroParaGastar(carteira, hoje)` é uma função pura e a única fonte do número.
- **Regime de caixa**, no ciclo da carteira: de `workspaces.cycle_start_day` (padrão 1) até a véspera do mesmo dia no mês seguinte. *[decisão minha]*
- **Sem saldo de partida.** É o orçamento do ciclo. *[decisão minha]*
- **A conta:**
  - receitas do ciclo, recebidas e previstas,
  - − despesas fora do crédito, pagas e previstas,
  - − faturas que vencem no ciclo (com parcelas projetadas, estornos e o total do banco quando houver),
  - − reserva opcional (`workspaces.monthly_savings_target`),
  - = **seguro para gastar**, também dividido por dia.
- A compra de hoje no crédito aparece como "já comprometido na próxima fatura".
- **Tabela de casos:**
  - com e sem renda recorrente;
  - `cycle_start_day` 1, 5 e 31;
  - fatura que vence no último dia;
  - estorno;
  - total do banco.

### Linha do tempo de 6 meses
`projecaoMensal(carteira, meses = 6)`: por mês, entra, sai (faturas por cartão com parcelas, contas, assinaturas) e sobra. Mostra o fim de cada parcelamento e o primeiro mês negativo.

### Previsão inteligente da parcela no lançamento (P12)
**`impactoDaParcela(plano, projecao, cartão)`**, função pura. Responde **antes de salvar**, no formulário e na frase:
- **a parcela e o fim:** "R$ 300 até jun/2027";
- **o pico:** quanto as parcelas somam por mês daqui para a frente, com e sem esta compra;
- **as próximas 3 faturas** do cartão, antes e depois;
- **o % da renda recorrente** comprometido com parcelas;
- **o 1º mês em que o "seguro para gastar" fica negativo**, se ficar;
- **o limite do cartão:** o disponível já descontadas as parcelas futuras. Avisa se a compra não cabe.

O mesmo quadro aparece no detalhe do lançamento parcelado, e quando o Apple Pay ou o WhatsApp lança "em 10x".

### Orçamento que se repete *[decisão minha]*
- `budgets.repeats boolean default true`. Continua uma linha por mês.
- No dia 1, um job idempotente (`pg_cron` e também ao abrir o Painel) copia as linhas com `repeats` do mês anterior.
- **Migração:** só o mês corrente ganha `repeats = true`.
- **Encerrar** um orçamento é desligar `repeats`.

### Mês de uma compra no crédito, em todo lugar *[decisão minha]*
O orçamento e o limite por pessoa contam a compra pelo **mês do fechamento**. O `evaluate-budgets` passa a usar o `_shared/credit-card-cycle.ts`.

### Alerta de fatura alta
**`cc_invoice_trending_high`**, no cron diário.
- **Dispara** quando a fatura aberta mais as parcelas que vão cair nela passam de **120% da média das últimas 3** faturas.
- **A mensagem** dá o valor previsto, quanto acima do normal e quanto sobra no mês do vencimento.
- **Frequência:** uma vez por ciclo.

A conta do "sobra" roda no servidor. **Fica para quem constrói:** um módulo puro compartilhado entre o cliente e o Deno, ou um porte, desde que um teste de tabela trave os dois iguais.

## 11. Bloco 6 — Inteligência, sugestões e contas a pagar (P6, P8)

### Motor de insights
- **Tabela** `insights(workspace_id, user_id?, kind, dedupe_key, payload jsonb, status: new|seen|dismissed|acted, created_at)`.
- **Quem produz:** o cron diário e os eventos (fatura fechou, mês virou, lançamento novo).
- **A regra decide; a IA só redige.** Os textos de resumo e relatório vêm da IA no plano Família. No Grátis, um modelo de frase em pt-BR.
- **Regras:**
  - todo insight tem **uma ação** ou um "entendi";
  - "não mostrar mais este tipo";
  - teto de **3 push por semana** por pessoa, com o resto só no app;
  - tom neutro, nunca sermão ("culpado" é proibido).
- **O convidado** recebe só os insights do próprio limite.

### Catálogo inicial
| Momento | Insight | Ação |
|---|---|---|
| **Fatura fechou** | Resumo: total contra a média e o mês anterior (↑/↓ %), as 3 categorias que mais pesaram, as maiores compras, parcelas novas e as que acabaram, estornos, diferença para o banco | Ver fatura / conferir PDF |
| **Mês virou** | **Relatório de valor:** o que o app lançou sozinho, o que a conferência achou, os avisos que evitaram juros, o seguro para gastar cumprido ou não | Ver mês |
| **Recorrência detectada** | Mesma descrição, valor ±10%, em 3 meses seguidos (ou 2 meses no mesmo dia ±3), sem vínculo: "Netflix todo mês — virar assinatura?" ou "Luz todo dia 10 — virar conta a pagar?" | Criar com 1 toque, ligando os lançamentos passados |
| **Gasto atípico** | Categoria ou estabelecimento acima de 2× a média de 3 meses | Ver lançamentos |
| **Assinatura mudou de preço** | "Spotify subiu de R$ 21,90 para R$ 23,90" | Atualizar valor |
| **Possível duplicidade** | Mesmo valor, estabelecimento e dia | Apagar um |
| **Parcelas acabando** | "Em março acaba a TV: sobram R$ 250 por mês" | Ver previsão |
| **Seguro para gastar baixo** | Abaixo de 10% da renda do ciclo | Ver o que pesa |
| **Sazonal** | O início de ano pelo histórico do ano anterior (IPVA, IPTU, material) | Criar conta a pagar |
| **"A conferir" acumulando** | Mais de 5 itens | Conferir agora |
| **Limite da pessoa** | 80% e 100% | Ver limite |

**Regra de sugestão de recorrência:** lançamento por cartão de crédito ou débito automático sugere **assinatura** (o app lança sozinho). Pix ou boleto sugere **conta a pagar** (o app lembra e a pessoa confirma).

### Revisão de Contas a pagar (P6)
A funcionalidade nunca foi usada nem revisada. O bloco começa com uma **auditoria funcional do fluxo inteiro**, ponta a ponta, em código e jornada, e corrige o que achar. Depois:
- **Assinatura e conta a pagar ficam distintas:**
  - assinatura: cobra sozinha, e o app lança;
  - conta a pagar: a pessoa paga, e o app lembra e confirma.
  - O Pix Automático é assinatura.
- **Valor variável** (luz, água): o valor estimado vem da média; ao pagar, confirma-se o real.
- **Casamento automático.** Um lançamento (de qualquer canal) que parece pagar uma conta pendente (descrição parecida, valor ±15%, data ±5 dias) gera a pergunta "isso pagou a conta Luz?". Um toque liga os dois, sem lançar duas vezes.
- **O boleto como anexo** da instância.
- **Sem "Beta"** quando a auditoria e as correções fecharem.

## 12. Bloco 7 — Família e carteiras (P1)

### Carteiras com propósito: a forma dupla (P1)
São dois jeitos de separar dinheiro, para dois casos diferentes.
1. **Projeto dentro da carteira:** **mesma gente, mesmo dinheiro.** Exemplo: a viagem da família paga no cartão da família.
   - `projects(workspace_id, name, starts_on, ends_on, budget_total, archived_at)` e `transactions.project_id`.
   - A fatura do cartão continua inteira na carteira.
   - O projeto tem orçamento total, gasto, quanto falta e o resumo ao terminar. Depois é arquivado.
2. **Carteira de projeto:** **outra gente ou outro dinheiro.** Exemplos: a viagem com amigos, a obra dividida entre irmãos.
   - `workspaces.purpose`: `everyday` (padrão; ciclo, orçamento que se repete, seguro para gastar) ou `project` (datas e orçamento total, sem ciclo; costuma ser dividida).

- **Regra mostrada na hora de escolher:** "Vai usar o cartão da casa e são as mesmas pessoas? É um projeto. Gente de fora ou dinheiro separado? É uma carteira."
- **Modelos de exemplo** ao criar uma carteira ou no primeiro uso (as carteiras "existem como exemplo"). Cada modelo já traz propósito, modo e categorias:
  - **Casa** (dia a dia, pote único);
  - **Casal** (dia a dia, dividida);
  - **Pessoal**;
  - **Viagem** (projeto);
  - **Reforma** (projeto);
  - **Evento** (projeto).
- **O primeiro uso** cria a Casa a partir do modelo.

### Papéis
`workspace_members.role` ganha `guest`.

| | Dono | Membro | Convidado |
|---|---|---|---|
| Lançar despesa | sim | sim | sim (autor = ele) |
| Ver transações | todas | todas (as privadas, mascaradas) | só as dele |
| Editar/excluir | tudo | tudo (privadas: só o autor) | só as dele |
| Categorias e cartões | gerencia | gerencia | só lê |
| Orçamento, faturas, previsão, contas, insights da casa | vê | vê | não |
| O próprio limite | vê | vê | vê |
| Convites e membros | gerencia | não | não |

A RLS e as RPCs de pacote são a garantia. O convite escolhe o papel, e o dono pode trocá-lo depois.

### Gasto privado entre adultos (painel: objeção nº 2)
- `transactions.is_private`. Os outros adultos veem só "Gasto pessoal de Fulana — R$ 120", sem descrição, categoria, estabelecimento nem anexo.
- **O valor entra em todos os totais**: o número da casa continua batendo.
- **O mascaramento mora no banco**, em view ou RPC com `security definer` que mascara para quem não é o autor, e nunca só na tela.
- **Fica para quem constrói:** o mecanismo exato. Não pode ser possível ler as colunas originais por `select` direto.
- A carteira pessoal continua sendo a privacidade total.

### Quem pagou, modo da carteira e acerto
- **Quem pagou:** `transactions.paid_by` (padrão: o autor).
- **Modo da carteira:** `workspaces.split_mode`, `pooled` (padrão) ou `split`.
- **Regra de divisão** entre os **membros**: igual ou por pesos. Livre por despesa.
- **Partes:** `transaction_shares`, geradas por **trigger** para valer em toda origem.
  - A soma sempre fecha; o centavo que sobra vai para quem pagou.
  - A regra de uma compra parcelada mora no plano de parcelamento.
- **Despesa de convidado:** o `paid_by` dela é o **responsável** (`sponsor_user_id`, por padrão quem convidou). O filho nunca entra no saldo.
- **Saldo** = pago − partes ± acertos. "Acertar" grava em `settlements`; o Pix acontece fora do app.
- Trocar de modo não apaga nada.
- `transaction_splits` é removido.

### Limite por pessoa
- `workspace_member_limits`: mensal, repete. A compra no crédito conta pelo mês do fechamento.
- Avisa em 80% e 100%, à pessoa e ao dono.

### Notificações
O convidado recebe só o próprio limite. A despesa do convidado avisa o dono e os membros.

## 13. Depois do PWA: apps nativos (P15)

Decisão do dono: iOS e Android nativos logo depois do PWA. Para não quebrar:
- **O direito de uso é multicanal desde já** (§9). A assinatura feita na web vale no app.
- **No iOS** entra o IAP ao lado do link externo, conforme a regra da Apple no Brasil desde 18/06/2026. O RevenueCat só entra com o app nativo.
- **No Android nativo,** ler a notificação do banco (`NotificationListenerService`) vira o canal de captura mais forte.
- **A API de captura (`capture`) já é a porta** que o app nativo vai usar.

## 14. Entrega

Cada bloco é um projeto com plano próprio. A ordem segue o valor e a dependência:

| # | Bloco | Por que nesta posição |
|---|---|---|
| 1 | Alertas confiáveis (§5) | barato, e destrava os avisos de todo o resto |
| 2 | Fatura que bate + anexos (§6) | dor nº 1; os anexos são a infra do PDF; nasce o `workspace_plan()` |
| 3 | Captura + IA (§7, §8) | causa nº 1 de abandono; WhatsApp e Android alcançam a maioria |
| 4 | Planos e confiança (§9) | com 2 e 3 prontos, o pago já entrega o que a planilha não faz |
| 5 | Previsão (§10) | o "quanto posso gastar" e a parcela inteligente |
| 6 | Inteligência + contas a pagar (§11) | lê tudo o que os blocos anteriores produzem |
| 7 | Família e carteiras (§12) | papéis, privacidade, divisão e propósito |

**Cada bloco termina com:**
- tipos atualizados à mão em `src/types/database.ts`;
- `npx tsc --noEmit && npm run lint && npm run test:unit` verdes, e `test:edge` quando houver Edge;
- `JORNADAS.md` e Atlas, quando mexer em jornada;
- a **lista do que vai para produção** (migrações, segredos, deploy, contas de terceiros), entregue ao dono para aprovar.

## 15. Decisões tomadas por mim (para o dono conferir)

1. O "seguro para gastar" é o orçamento do ciclo, sem saldo bancário, e o ciclo começa no dia escolhido.
2. O orçamento se repete por cópia no dia 1, e só a partir do mês corrente.
3. A compra no crédito conta pelo mês do fechamento em todo lugar, alertas inclusive.
4. A captura vai para a carteira do cartão reconhecido; sem ele, para a carteira padrão do token.
5. O convidado na carteira dividida tem um responsável que paga por ele.
6. Voltar ao Grátis não remove ninguém: os canais automáticos e a IA param.
7. O dono e a família dele recebem plano vitalício manual.
8. Teto de 3 push por semana para insights.
9. Ao WhatsApp o app só responde em erro ou ambiguidade; os avisos vão por push.
10. Teto de 300 chamadas de IA por casa por mês.

## 16. O que fica para quem constrói

- A forma de cada tela, dentro do design system (perguntar antes de criar componente).
- Nomes de colunas e funções não fixados aqui.
- O formato do Atalho e do guia do Tasker.
- Os limiares (120% da fatura, 2× no atípico, ±10% na recorrência), ajustáveis com aviso.
- A ordem interna das tarefas de cada bloco.
