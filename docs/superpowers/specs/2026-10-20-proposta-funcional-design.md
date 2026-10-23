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
- **Prender o dado da pessoa.** Sem plano, nada se apaga e exportar continua sempre liberado. Também é anti-objetivo a cobrança surpresa (o teste não pede cartão) e o cancelamento difícil.
- **IA que treina com o dado da pessoa.** Nenhum free tier que treine com os dados, em produção. O Cloudflare Workers AI não treina.
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
  - Groq (com ZDR ligado) e Cloudflare (Workers AI), nos planos grátis.
  - O CNPJ é exigido pelo Asaas, e pelo Pix Automático só depois de 6 meses.
- **Tudo no plano gratuito até a primeira receita** (decisão do dono, 21/10). Nada pago entra antes das assinaturas pagarem por ele.

  | Serviço | Grátis | O limite que pesa | Gatilho para pagar |
  |---|---|---|---|
  | Supabase Free | banco 500 MB, storage 1 GB, egress 5 GB, 500 mil chamadas de Edge/mês | o projeto **pausa após 7 dias sem uso**; **sem backup diário para baixar** | ~2 assinaturas pagam o Pro (US$ 25). Até lá, `pg_dump` semanal guardado fora (a montar no Bloco 1) |
  | Hospedagem do Next | Vercel Hobby | **a Vercel Hobby proíbe uso comercial** | ao ligar a cobrança (Bloco 4): Vercel Pro (US$ 20) ou Cloudflare com OpenNext. Decidir no plano do Bloco 4 |
  | Resend Free | 3.000 e-mails/mês, 100/dia | o teto diário | push primeiro; e-mail só no essencial (conta, cobrança, aviso de renovação) |
  | Groq (principal) e Cloudflare Workers AI (reserva) | ~1.000 req/dia por modelo + 10 mil neurons/dia; **nenhum dos dois treina com o dado** | as cotas diárias | sem cota, o app cai para o parser e "a conferir"; a Groq paga custa centavos |
  | WhatsApp Cloud API | receber é grátis; 1.000 respostas/mês grátis | as respostas | o app só responde em erro e corta as respostas em 900/mês |
  | Asaas | sem mensalidade | taxa por cobrança, paga pela própria receita | — |
- **Anexos com 1 GB total:** cota de **25 MB por assinante** (~100 fotos comprimidas) enquanto o Supabase for Free. A cota sobe no Pro.

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
2. **Estrutura, determinística primeiro.** Um leitor de linhas por regex (data dd/mm, descrição, valor, "k/n" de parcela, sinal de estorno) cobre o formato comum das faturas brasileiras. Ele tem tabela de testes com amostras anonimizadas de Nubank, Itaú, Inter, C6, Bradesco e Santander. Só quando a soma não fecha o texto vai à IA gratuita, que não treina com o dado (§8). Em qualquer caminho, a saída é um JSON:
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

### Importar extrato do banco (CSV/OFX)
- O caminho mais exato para a fatura e o extrato, sem IA: o arquivo que o banco exporta (o Nubank exporta CSV e OFX).
- Mapeia data, descrição e valor, mais a parcela quando vem na descrição.
- Usa a mesma conferência (`conferirFatura`) e a mesma importação em lote desfazível.

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
- **Cota.** 25 MB por assinante enquanto o Supabase for Free (§3). Sobe com o Pro.

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
  - **imagem:** leitura de nota ou comprovante (visão no Cloudflare Workers AI, grátis), depois o parser, e a imagem vira anexo;
  - **PDF:** vai à conferência de fatura (§6).
- **Confirmação:** marcar como lida é o "anotei". **Responder só em erro, em ambiguidade e na primeira vez.** O teto é de 900 respostas por mês: dentro das 1.000 grátis, e depois disso só o "lido".
- **Avisos:** vão por **Web Push**, nunca por template do WhatsApp.
- **Plano:** o WhatsApp vale no teste e no plano Família.

### Da frase ao lançamento
- **Parser `interpretarFrase`:** função pura, compartilhada entre a Edge e o cliente, com tabela de testes. Entende:
  - valor ("42", "42,90", "R$ 42", "1.234,56" e o básico por extenso);
  - data ("ontem", "dia 12");
  - "em 10x";
  - receita ("recebi"), estorno;
  - cartão ou forma ("nubank", "pix", "débito");
  - o resto vira descrição.
- **Preenchimento pelo histórico, sem tabela nova.** A transação mais recente da carteira com a mesma descrição normalizada dá a categoria, a forma e o cartão. Corrigir ensina.
- **IA só no que o parser não resolve:** frase confusa, áudio, foto. Ver §8.
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
- **Tudo vale no teste de 14 dias e no plano Família.** Depois do teste, sem plano, o lançamento para (ver §9).
- **No `JORNADAS.md`:** a jornada de vincular WhatsApp, a de instalar o Atalho, a de compartilhar no Android e a da lista "a conferir".

## 8. IA no app (P3): só grátis até a primeira receita

**Decisão do dono:** nesta versão a IA só entra se for grátis. Ela tem também de **não treinar com o dado**, por ser dado financeiro. Pesquisa de 21/10, com fontes oficiais:

| Provedor | Grátis | Treina? | Uso | Papel |
|---|---|---|---|---|
| **Groq** | ~1.000 req/dia por modelo de texto; Whisper com ~8 h de áudio/dia | **Não**: o contrato proíbe (§4.2). Com o **ZDR ligado**, não guarda nada | produção permitida | **principal** |
| **Cloudflare Workers AI** | 10 mil neurons/dia (~214 min de áudio, ou ~1.400 frases, ou ~160 recibos) | **Não** | produção permitida; proíbe processar número completo de cartão | **reserva** |
| No aparelho | ditado do teclado; "Extrair texto da imagem" e "Usar Modelo" no Atalhos do iOS (iPhone 15 Pro em diante) | o dado não sai do aparelho por nossa conta | — | **opcional** |

**Ficam fora**, pelos motivos abaixo:
- **Gemini free, Mistral free e os `:free` do OpenRouter:** treinam com o dado.
- **SambaNova, NVIDIA e Cohere trial:** só servem para avaliação ou não declaram o que fazem com o dado.
- **GitHub Models:** encerrado em 30/07/2026.
- **Cerebras, Hugging Face e Together:** sem tier grátis útil.
- **Chrome Prompt API:** não roda no celular e não aceita português.
- **Oracle hospedada por nós:** último recurso.

| Tarefa | Caminho, em ordem |
|---|---|
| Frase ("42 mercado nubank em 3x") | **parser** e histórico → Groq `gpt-oss-20b` em JSON mode → Cloudflare `qwen3-30b-a3b` → formulário pré-preenchido com "Não entendi, confira" |
| Áudio no app | o **ditado do teclado** (o app só recebe o texto) |
| Áudio no WhatsApp | Groq Whisper turbo → Cloudflare Whisper → fila até a cota virar |
| Foto de recibo ou comprovante | **OCR no aparelho** quando der (o Atalho do iOS manda o texto) → caminho da frase. Senão, imagem → Groq `qwen3.8-27b` (visão) → Cloudflare `llama-4-scout` |
| Fatura | **CSV ou OFX exportado pelo banco** (o Nubank exporta; sem IA, exato) → leitor determinístico do texto do PDF → Groq `gpt-oss-120b` por página → Cloudflare |
| Resumos e dicas (§11) | modelos de frase em pt-BR, sem IA |

**Regras:**
- **Um módulo só:** `supabase/functions/_shared/ia.ts`, com `transcrever`, `interpretar`, `lerImagem` e `lerFatura`.
  - A cadeia de provedores é configuração.
  - As APIs da Groq e da Cloudflare são compatíveis com a da OpenAI.
  - Toda saída vem em JSON com schema e é validada. A saída inválida vira "a conferir", nunca um lançamento errado em silêncio.
- **Antes de enviar,** saem nome, CPF, endereço e **qualquer número de cartão completo** (a Cloudflare proíbe processá-lo no plano grátis).
- **Sem cota, o app não para.** O app passa ao próximo da cadeia, depois ao parser e por fim a "a conferir".
  - Há teto diário por pessoa, e as frases repetidas ficam em cache.
  - Os 429 são registrados. Quando chegarem perto do teto todo dia, é a hora de pagar: a Groq paga custa centavos.
- **Com receita, ou com créditos de startup** (AWS Activate US$ 1.000, Google Start, Microsoft; exigem empresa e site): Gemini no Vertex ou Claude no Bedrock entram pela mesma interface.
- **A confirmar no Bloco 3:**
  - se o ZDR aparece na conta grátis da Groq;
  - os limites reais em `console.groq.com/settings/limits`;
  - o DPA e a retenção da Cloudflare.
- **Privacidade:** a política de privacidade cita a transferência internacional. Os segredos ficam só nas Edge Functions.

## 9. Bloco 4 — Planos e confiança (P4, P14, P15)

Detalhe comercial na estratégia §3–§4 e em `founder/pricing.md` e `founder/offer.md`.

### Direito de uso
- **Tabela** `billing_subscriptions(user_id, provider: asaas|apple|google, provider_ref, plan: familia, interval: year, status: trialing|active|past_due|canceled|expired, trial_ends_at, current_period_end, cancel_at_period_end, price_cents, founder bool)`.
  - O nome evita confusão com `workspace_subscriptions`, as assinaturas do usuário.
- **A unidade do plano é o assinante (uma pessoa)** *[decisão minha]*:
  - cobre **todas as carteiras de que ele é dono**;
  - "até 6 pessoas" conta as pessoas distintas, fora o assinante, em todas essas carteiras;
  - **cobre também as pessoas convidadas para essas carteiras** (até 5 além do assinante), inclusive a carteira pessoal de cada uma. O cônjuge e os filhos não pagam à parte.
  - Quem cria conta sem convite ganha o próprio teste.
- **`workspace_plan(workspace_id)`:** o plano é Família se o **dono** da carteira tiver plano ativo ou em teste.
- **Captura:** o plano é conferido na **carteira padrão** do token ou do vínculo do WhatsApp, **antes** de qualquer chamada de IA.
  - Os membros herdam o plano dentro daquela carteira.
  - A função nasce no Bloco 2 devolvendo `familia` para todos e passa a valer neste bloco.
- **Quem garante é o servidor.** As Edge Functions e a RLS de escrita checam o plano. A tela só reflete.

### Cobrança: Asaas
- **Checkout** pela Edge `billing-checkout`, criado no servidor. O CPF da pessoa é pedido no checkout, porque o Asaas exige.
- **Só anual** (decisão do dono, 21/10). O mensal tem churn alto.
  - **No lançamento, só cartão**, em 12x sem juros para a pessoa (a taxa do parcelamento fica com a casa).
    - A **renovação é automática**: o cartão fica guardado no Asaas.
    - Sem Pix avulso e sem desconto à vista. O Pix avulso não renova sozinho, e cada renovação viraria uma nova venda (decisão do dono, 21/10).
  - **Perda involuntária** (cartão vencido ou recusado):
    - novas tentativas automáticas de cobrança;
    - aviso "atualize seu cartão" por push e e-mail;
    - 7 dias de tolerância antes de a conta ir para "só leitura".
  - **Pix Automático anual** entra quando o CNPJ completar 6 meses. Ele também renova sozinho. Desconto pequeno, ou nenhum.
  - A renovação é anual, com o aviso 7 dias antes.
- **Webhook** `asaas-webhook`, validado pelo `asaas-access-token`, faz upsert do status.
- **NFS-e automática** em toda cobrança.

### Regras de cobrança honesta
- **Sem plano grátis: teste de 14 dias, sem cartão** (decisão do dono, 21/10).
  - **Por quê:** o paywall depois do teste converte ~5× mais que o freemium (RevenueCat 2026: 10,7% contra 2,1%), com retenção parecida.
  - **O que mantém a confiança:** o teste não pede cartão, então não existe cobrança surpresa.
  - No dia 12, aviso e o **relatório do teste**: o que o app lançou, achou e avisou.
  - **No dia 14, sem assinatura, a conta fica em "só leitura":**
    - tudo continua visível;
    - **exportar tudo** e apagar a conta continuam sempre liberados;
    - lançar, capturar e importar param.
    - Nada se apaga. Assinar devolve tudo na hora.
  - No lançamento do plano, quem já usa o app ganha 14 dias.
  - O dono e a família dele recebem um plano vitalício manual. *[decisão minha]*
- **Cancelar em 1 toque.** A Edge `billing-cancel` marca `cancel_at_period_end`.
- **Aviso 7 dias antes de renovar**, por push e e-mail, via cron.
- **Arrependimento de 7 dias (CDC art. 49).** Um botão de reembolso visível nesses 7 dias; o estorno sai pela API do Asaas.
- **"Bateu ou devolvemos."** No 1º mês pago, pelo suporte, é processo manual documentado; não se automatiza.
- **Plano que acaba (teste ou assinatura) nunca apaga dado nem desliga proteção.**
  - A conta e os membros vão para "só leitura".
  - O mascarado continua mascarado e o convidado continua restrito.
  - Exportar continua liberado.
- **Preço na porta.** `/plans` mostra o preço também a quem não entrou.
- **Preço** (proposta minha dentro da faixa do dono, de R$ 19,90 a R$ 29):
  - **Família: 12x de R$ 29,90 no cartão (R$ 358,80/ano)**, só anual;
  - **Fundadores**, até 31/01/2027: **12x de R$ 19,90 (R$ 238,80/ano), congelado enquanto ativo** (`founder = true`). Cancelou, perde o preço.
    - É 33% sobre um preço que existe de verdade, sem âncora falsa.
    - Respeita o piso de R$ 19,90 do dono.
  - O detalhe está em `founder/pricing.md`.

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
  - **exportar tudo** (CSV por tabela das carteiras da pessoa, num ZIP), sempre liberado, com ou sem plano;
  - **apagar a conta** (o `delete-user`, que já existe).
- **Premium que se prova.** O relatório de valor do mês (§11) é o recibo do que a assinatura entregou.

## 10. Bloco 5 — Previsão (P12)

### Receita recorrente
`workspace_subscriptions.kind` passa a aceitar `expense` | `income`. O salário vira uma receita recorrente lançada pelo cron.

### "Seguro para gastar"
`seguroParaGastar(carteira, hoje)` é uma função pura e a única fonte do número.
- **Regime de caixa, no mês do calendário.** *[decisão minha, revista: o `cycle_start_day` saiu]*
  - O app inteiro fala do mesmo mês: Painel, orçamento, relatório.
  - O salário do dia 5 cai dentro do mês dele.
  - Os dois números têm nomes e regimes diferentes, e cada tela diz qual mostra:
    - **"seguro para gastar"** é **caixa**: o dinheiro que sai no mês, e a fatura conta no mês do vencimento;
    - o **orçamento e o limite por pessoa** são **competência**: a compra no crédito conta no mês do fechamento.
  - **"Número que não bate"** quer dizer dois lugares mostrando o **mesmo** número com valores diferentes. Caixa e competência são números diferentes e não se misturam no mesmo rótulo.
- **Sem saldo de partida.** É o orçamento do mês. *[decisão minha]*
- **A conta:**
  - receitas do ciclo, recebidas e previstas,
  - − despesas fora do crédito, pagas e previstas,
  - − faturas que vencem no ciclo (com parcelas projetadas, estornos e o total do banco quando houver),
  - − reserva opcional (`workspaces.monthly_savings_target`),
  - = **seguro para gastar**, também dividido pelos dias que faltam no mês.
- A compra de hoje no crédito aparece como "já comprometido na próxima fatura".
- **Tabela de casos:**
  - com e sem renda recorrente;
  - meses de 28, 30 e 31 dias;
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
- **A regra decide, e o texto sai de modelos de frase em pt-BR.** A IA não entra nesta versão (§8).
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

### Plano
**Tudo é do Família**, e não há plano grátis. Sem plano, a carteira fica em "só leitura" (§9). Nada que protege alguém se desliga:
- o mascarado continua mascarado;
- o convidado continua restrito;
- os limites e o saldo da carteira dividida continuam visíveis.

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

**Conta do filho (decisão do dono):** todo membro, filho inclusive, tem conta própria com e-mail.
- O filho entra como `guest` pelo convite de e-mail que já existe.
- O convite feito pelo responsável é o consentimento dos pais (LGPD art. 14), e o texto do convite diz isso.
- Depois de vincular, o filho pode lançar pelo app ou pelo WhatsApp.

### Gasto privado entre adultos (painel: objeção nº 2)
- `transactions.is_private`. Os outros adultos veem só "Gasto pessoal de Fulana — R$ 120", sem descrição, categoria, estabelecimento nem anexo.
- **Onde o privado vale** *[decisão minha]*:
  - num cartão da casa, o titular lê a fatura no banco e o privado seria uma promessa falsa;
  - por isso só pode ser privada a compra paga por Pix, débito ou dinheiro, ou num cartão cujo **titular é o autor** (`credit_cards.holder_user_id`, coluna nova).
- **Fatura e conferência de um cartão:**
  - o PDF e o resultado da conferência são visíveis só ao **titular do cartão** e ao **dono da carteira**;
  - uma linha do banco que casa com um gasto privado aparece mascarada para quem não é o autor.
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
| 4 | Planos e confiança (§9), sem o gateway | com 2 e 3 prontos, o pago já entrega o que a planilha não faz; o checkout do Asaas fica para o 8 |
| 5 | Previsão (§10) | o "quanto posso gastar" e a parcela inteligente |
| 6 | Inteligência + contas a pagar (§11) | lê tudo o que os blocos anteriores produzem |
| 7 | Família e carteiras (§12) | papéis, privacidade, divisão e propósito |
| 8 | Cobrança pelo Asaas (§9, "Cobrança: Asaas") | por último, antes de o 2.0 ir para `main`: o 4 entrega o direito de uso, as telas e a confiança sem gateway, e a cobrança só liga no lançamento (decisão do dono, 23/10) |

**Cada bloco termina com:**
- tipos atualizados à mão em `src/types/database.ts`;
- `npx tsc --noEmit && npm run lint && npm run test:unit` verdes, e `test:edge` quando houver Edge;
- `JORNADAS.md` e Atlas, quando mexer em jornada;
- a **lista do que vai para produção** (migrações, segredos, deploy, contas de terceiros), entregue ao dono para aprovar.

## 15. Decisões tomadas por mim (para o dono conferir)

1. O "seguro para gastar" é caixa no mês do calendário, sem saldo bancário. O orçamento é competência. Cada número diz o regime dele.
2. O orçamento se repete por cópia no dia 1, e só a partir do mês corrente.
3. A compra no crédito conta pelo mês do fechamento em todo lugar, alertas inclusive.
4. A captura vai para a carteira do cartão reconhecido; sem ele, para a carteira padrão do token.
5. O convidado na carteira dividida tem um responsável que paga por ele.
6. Sem plano, a conta vai para "só leitura" e não remove ninguém; exportar e apagar continuam sempre liberados.
7. O dono e a família dele recebem plano vitalício manual.
8. Teto de 3 push por semana para insights.
9. Ao WhatsApp o app só responde em erro ou ambiguidade; os avisos vão por push.
10. A IA é grátis e sem treino: primeiro o parser, depois a Groq (com ZDR) e, na reserva, a Cloudflare. Sem cota, cai no determinístico.
11. O plano é do assinante e cobre todas as carteiras dele e as pessoas convidadas, até 5, com a carteira pessoal de cada uma.
12. Gasto privado só fora do cartão compartilhado. PDF e conferência de cartão ficam só com o titular e o dono.
13. Preço: 12x de R$ 29,90 no cartão (R$ 358,80/ano), aprovado pelo dono em 21/10.
14. Fundadores: 12x de R$ 19,90, congelado enquanto ativo, até 31/01/2027 (aprovado). Só cartão no lançamento; Pix Automático quando o CNPJ completar 6 meses (decisão do dono).
15. Anexos: 25 MB por assinante enquanto o Supabase for Free.

**Decidido pelo dono (21/10):**
- todo membro tem conta com e-mail, filhos inclusive;
- **não existe plano grátis**: teste de 14 dias e depois a assinatura;
- preço entre R$ 19,90 e R$ 29 por mês, **cobrado só no anual** (sem plano mensal);
- **o WhatsApp é implementado** (Bloco 3);
- **IA, WhatsApp e infraestrutura só no plano gratuito** até a primeira receita.

**Em aberto, só trava o Bloco 4:** o CNPJ. Asaas e AbacatePay exigem CNPJ, e a escolha do gateway fica para o plano do Bloco 4.

**A conferir antes de prometer:** a região do projeto Supabase. "Dados no Brasil" só entra no Cofre aberto se for `sa-east-1`. A IA (Groq e Cloudflare) é transferência internacional, e o Cofre aberto diz isso com todas as letras.

## 16. O que fica para quem constrói

- A forma de cada tela, dentro do design system (perguntar antes de criar componente).
- Nomes de colunas e funções não fixados aqui.
- O formato do Atalho e do guia do Tasker.
- Os limiares (120% da fatura, 2× no atípico, ±10% na recorrência), ajustáveis com aviso.
- A ordem interna das tarefas de cada bloco.
