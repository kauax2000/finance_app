# Mapa das lacunas abertas

Gerado em 26/10/2026 a partir de `docs/JORNADAS.md` §19 (branch `finance-app-2.0`), com leitura pontual do código, e atualizado no Bloco 9 (as lacunas que ele fechou saíram, e as que abriu entraram). Só leitura: nada foi alterado no app.

## Resumo

- Lacunas abertas na tabela: **75** (de #1 a #99, com furos de numeração).
- Excluídas por serem feature nova ou escolha de produto: **5**. Mapeadas: **70**.
- Por categoria: A bug ou risco real **15** · B UX e tela **31** · C operação e deploy **19** · D dívida técnica **5**.
- Bloqueiam o lançamento do 2.0: **15** (#8, #12, #14, #26, #28, #29, #36, #40, #43, #58, #67, #69, #78, #90, #99).
- Esforço: P = horas, M = um dia, G = vários dias.

### As 10 mais importantes antes do lançamento, em ordem

1. Validar o SQL do 7B (o titular) e o do Bloco 9 num ramo de teste, com o `bloco9.test.sql`; nunca rodaram (#67, #99)
2. Validar as migrações do 7C e o `divisao.test.sql` (32 casos) num ramo de teste; `transaction_splits` tem de ser 0 (#69)
3. Sandbox do Asaas: primeira chamada real, responder o §0 do roteiro (#90)
4. Confirmar o token do cartão no `PAYMENT_CONFIRMED`; sem ele, toda renovação cai em `past_due` (#78)
5. Publicar o Bloco 9 na ordem: `workspace-invites-accept`, a migração, a `capture`; o resto só com o 2.0 (#99)
6. Publicar na ordem certa os Blocos 1 a 7A (migração, Edge, front) e fazer o teste de fumaça (#8, #12, #14, #26, #28, #36, #40, #43, #58)
7. Trocar 'região a confirmar' pela região real do projeto Supabase no Cofre (#29)
8. Decidir o que fazer com o estorno lançado antes do Bloco 9, que não desconta o orçamento (#92)
9. Avisar também a segunda fatura que vence no mesmo dia (#94)
10. Tratar o reenvio simultâneo da captura com foto, que sobe dois anexos (#95)

### Excluídas (só o número e o motivo)

- #20: WhatsApp adiado (feature futura)
- #42: desvio consciente (cron diário)
- #59: de propósito (convidado lê diretório)
- #74: de propósito (política de leitura)
- #75: de propósito (Pix fora do app)

### Notas de leitura

- **#4 parece já fechada**: `ChangePasswordDialog.tsx` já importa `isPasswordValid`; a tabela está desatualizada.
- Lacunas 'Bloco X: nada publicado' (#12, #14, #26, #28, #36, #40, #43, #58, #67, #69, #90, #99) são estado de entrega, não defeito. Bloqueiam porque o lançamento é justamente publicá-las; o esforço é o do roteiro `supabase/BLOCO_*_DEPLOYMENT.md`.
- Confirmado no código: #7 (texto de SQL na tela de membros), #52 (assunto 'Convite para o workspace' em `workspace-invites-create`), #29 (wireframe do Cofre), #56 (`use-workspaces.ts` com `staleTime` de 5 min), #73 (`/previsao` sem guarda de carteira de projeto).

## (A) Bug ou risco real

| # | O que está errado ou falta | Bloco | Esforço | Bloqueia? | Motivo |
|---|---|---|---|---|---|
| 21 | A foto vai à IA sem redação (cartão mascarado ou documento inteiro), primeiro à Groq, depois à Cloudflare. | Bloco 3B: IA | M | não | está dito em `/privacidade`; avaliar aviso na hora do envio |
| 37 | Se a reprogramação da agenda falhar após gravar a conta (só replay offline), o replay seguinte não a refaz. | Bloco 6A: Contas | M | não | só falha dupla offline |
| 38 | Conta `one_time` com `end_date` antes do 1º vencimento aparece 'Concluída' sem ter sido paga. | Bloco 6A: Contas | P | não | entrada incomum; validar no formulário ou na regra |
| 49 | O convidado lê `workspaces.monthly_savings_target` pela API (leitura é de membro). | Bloco 7A: Papéis | M | não | dado de baixa sensibilidade; tela não mostra |
| 53 | O limite é avaliado só ao salvar; na edição confere o limite do autor, não de quem editou; excluir, mudar limite ou fechamento não reavalia nem retira aviso. | Bloco 7A: Papéis | M | não | aviso pode ficar errado; valor correto |
| 70 | Despesa lançada antes de outro adulto entrar numa carteira dividida fica com quem estava; só editar valor, data, tipo etc. refaz as partes. | Bloco 7C: Divisão | M | não | saldo coerente com o histórico; confirmar a expectativa |
| 76 | Mudar pesos, peso do plano ou quem é adulto vale só para a frente; despesa do dia da virada ou de pote único após voltar a `split` fica sem parte e fora do saldo até editar. | Bloco 7C: Divisão | M | não | saldo incompleto em casos de borda |
| 77 | O resumo do projeto agrupa por autor, não por `paid_by`; e o projeto escolhido se perde em silêncio ao trocar para Parcelada ou escopo 'plano'. | Bloco 7C: Divisão | M | não | número do resumo e escolha perdida sem aviso |
| 91 | Apagar a conta apaga o plano mas não pede ao Asaas a exclusão do cadastro, cobranças e NFS-e (a nota tem guarda fiscal); política e Cofre avisam. | Bloco 8: Cobrança | M | não | está dito na política; revisar com o jurídico (LGPD) |
| 92 | O estorno no cartão lançado antes do Bloco 9 tem categoria de receita (ou nenhuma) e não desconta o orçamento; ao abri-lo, a categoria é limpa e pede uma de despesa. | Bloco 9: Correções | M | não | sem migração de dados; só desconta depois de revisado |
| 93 | Um aviso já entregue por push ou e-mail não se recolhe, mesmo que o fato mude depois. | Bloco 9: Correções | M | não | só o que falhou na entrega é reenviado |
| 94 | Duas faturas podem vencer no mesmo dia (fecha 30 e vence 31 em mês de 30 dias; fecha 28 e vence 30, fevereiro para março); o Painel mostra as duas, mas a `credit-card-calendar-alerts` só avisa a primeira. | Bloco 9: Correções | P | não | falta um aviso nesse dia |
| 95 | Captura: dois reenvios simultâneos da mesma compra parcelada com foto sobem dois anexos (o plano é um só); com destino diferente entre os reenvios, nascem dois planos. | Bloco 9: Correções | M | não | corrida rara |
| 96 | O 'Apagar um' de um convidado que não enxerga um dos dois lançamentos marca o insight como resolvido sem apagar. | Bloco 9: Correções | P | não | o repetido continua na lista |
| 97 | Aviso de cobrança sem destino (sem carteira e e-mail rejeitado) fica pendente e é tentado uma vez por dia, sem teto. | Bloco 9: Correções | P | não | ruído nos logs até alguém consertar o e-mail |

## (B) UX e tela

| # | O que está errado ou falta | Bloco | Esforço | Bloqueia? | Motivo |
|---|---|---|---|---|---|
| 1 | Carteira pessoal mostra o formulário de convite; o servidor só recusa depois do envio. | Base: Membros | P | não | só confusão de tela |
| 3 | `/account/sessions` e `/account/activity` mandam para `/login` sem `next`; a pessoa não volta à página. | Base: Acesso | P | não | só perde o retorno |
| 4 | Política de senha na troca dentro do app. PROVÁVEL JÁ FECHADA: `ChangePasswordDialog` hoje usa `isPasswordValid`; confirmar e mover para as fechadas. | Base: Acesso | P | não | código já confere a política |
| 5 | Detalhe da assinatura só abre por estado da tela; sem `?id=`, o toast de criada não tem 'Ver'. | Base: Assinaturas | P | não | só falta atalho |
| 6 | Excluir transação é físico e sem volta: sem `deleted_at`, o 'Desfazer' não existe. | Base: Lançamentos | G | não | há confirmação antes de apagar |
| 7 | Erro de carga de membros mostra ao usuário o nome do arquivo SQL e a RPC (texto de desenvolvedor). | Base: Membros | P | não | só texto |
| 24 | Parcelas futuras lançadas pelo cron nascem sem a marca 'a conferir' e com `source` recurring. | Bloco 4/3A | M | não | só perde a marca |
| 25 | Sem service worker ativo, o compartilhar do Android cai no route handler e a foto ou PDF some sem aviso. | Bloco 3A: Captura | M | não | só na 1ª instalação e troca de versão |
| 30 | Nenhuma tela de acesso leva a `/precos`; a porta pública do preço ninguém encontra. | Bloco 4: Planos | P | não | só descoberta |
| 31 | 'Em aberto' do Painel não soma assinaturas do cartão que vão cair; `/previsao` soma. Mesma fatura, dois valores. | Bloco 5: Previsão | M | não | decisão da revisão de tela |
| 32 | Aviso de fatura alta não diz quanto sobra no mês do vencimento (exigiria 2ª implementação do seguro em Deno). | Bloco 5: Previsão | G | não | o link leva à previsão, que mostra |
| 34 | Com 'em 10x' na frase rápida, o quadro de impacto da parcela aparece duas vezes. | Bloco 5: Previsão | P | não | só duplicação visual |
| 44 | A notificação de recorrência leva a `?new=1` com formulário vazio; o 'Criar' de um toque só existe no Painel. | Bloco 6B: Insights | M | não | só atrito |
| 45 | Não há tela para 'Voltar a mostrar' um tipo de insight silenciado. | Bloco 6B: Insights | M | não | policy existe, falta a tela |
| 47 | O gasto atípico não tem piso de valor (média R$ 10 e mês R$ 21 viram 'acima do comum'). | Bloco 6B: Insights | P | não | ruído limitado a 5 por execução |
| 50 | Subir o limite no meio do mês não reabre os avisos de 80% e 100% do mês. | Bloco 7A: Papéis | M | não | vale no mês seguinte |
| 51 | A importação (extrato e planilha) não avalia o limite da pessoa; o aviso só sai no próximo lançamento. | Bloco 7A: Papéis | M | não | aviso atrasado, valor conta |
| 52 | O e-mail do convite diz 'workspace' (assunto e corpo), não 'carteira'. | Bloco 7A: Papéis | P | não | só texto; trocar antes de convidar gente |
| 54 | O insight `limite_pessoa` do convidado não aparece para ele; só o aviso no sino. | Bloco 7A: Papéis | M | não | o sino já avisa |
| 55 | A folha de detalhe lê `workspace_installment_plans`, agora só do adulto; compra parcelada do convidado perde 'parcela x de y'. | Bloco 7A: Papéis | P | não | só rótulo |
| 56 | O papel pode ficar até 5 min velho no cliente (`staleTime` das carteiras): quem virou convidado vê a navegação da casa até a próxima busca. | Bloco 7A: Papéis | P | não | a RLS protege; ele vê vazio |
| 63 | O titular que não é dono não consegue se tirar do cartão pela tela (seletor só do dono). | Bloco 7B: Titular | P | não | pede ao dono |
| 65 | Fatura fechou, aviso de fatura e limite de um cartão com titular vão só ao titular e aos donos; membro adulto sem ser titular deixa de receber o resumo. | Bloco 7B: Titular | P | não | regra de privacidade escolhida (Ruling 5 e 7); confirmar com o dono |
| 72 | Quem saiu aparece como 'Ex-membro' sem nome (com sufixo de id só no acerto); linha antiga sem `paid_by` também lê 'Ex-membro'. | Bloco 7C: Divisão | M | não | só nome; saldo fecha em 0 |
| 73 | A carteira de projeto não tem previsão, mas só o link do Painel some: `/previsao` direta abre nela, e insight de seguro e quadro de impacto seguem calculando. A rota não tem guarda. | Bloco 7C: Divisão | P | não | tela sem sentido, sem dano |
| 80 | A exportação do Cofre não traz a linha do plano (`billing_subscriptions` é só da service role). | Bloco 8: Cobrança | P | não | o plano aparece em `/plans`; incluir via `meu_plano()` |
| 82 | Reembolso pendente (202) não muda `meu_plano`: ao recarregar, 'Pedir reembolso' volta e outro toque devolve a mesma mensagem. | Bloco 8: Cobrança | P | não | só confusão até o cron |
| 83 | Voltar da fatura do Asaas pelo botão do navegador pode deixar o botão preso em 'Abrindo…' (bfcache); recarregar resolve. | Bloco 8: Cobrança | P | não | há contorno |
| 84 | A tela esconde 'Assinar' pelo papel da carteira atual, mas o servidor recusa quem é convidado em qualquer carteira; dono pessoal e convidado noutra vê o botão e recebe erro. | Bloco 8: Cobrança | P | não | servidor protege |
| 89 | Assinatura cancelada e já vencida bloqueia novo checkout ('Você já tem um plano ativo') até o cron expirá-la, até 1 dia. | Bloco 8: Cobrança | P | não | espera de até um dia |
| 98 | A importação por conta sugere a categoria pelo histórico sem olhar o tipo: um crédito pode ganhar a categoria de despesa de um débito parecido (já era assim antes do Bloco 9). | Bloco 9: Correções | P | não | a pessoa revisa na tela |

## (C) Operação e deploy

| # | O que está errado ou falta | Bloco | Esforço | Bloqueia? | Motivo |
|---|---|---|---|---|---|
| 8 | Notificações: banco e funções no ar desde 21/10; falta o front novo, apagar `dispatch-notifications`, teste de fumaça com 2 pessoas e backup semanal. | Bloco 1: Alertas | M | sim | parte do fechamento do 1º lote em produção |
| 12 | Bloco 2 (estorno, conferência, importação, anexos): banco no ar, front não publicado; falta o front e o teste de fumaça. | Bloco 2: Fatura | M | sim | é parte do que o lançamento publica |
| 14 | Bloco 3A (captura sem abrir o app): nada publicado. | Bloco 3A: Captura | M | sim | é parte do que o lançamento publica |
| 19 | Link do guia do Atalho dá 404 até o `finance-app-2.0` ir para `main`. | Bloco 3A: Captura | P | não | some sozinho no merge; conferir depois |
| 22 | O modelo de visão da Groq é preview e pode sair sem aviso; a Cloudflare cobre. | Bloco 3B: IA | P | não | há fallback; monitorar |
| 26 | Bloco 3B (IA e privacidade): nada publicado. | Bloco 3B: IA | M | sim | é parte do que o lançamento publica |
| 28 | Bloco 4 (planos, só leitura, `/precos`, Piloto, Cofre aberto): nada publicado. | Bloco 4: Planos | M | sim | é parte do que o lançamento publica |
| 29 | O Cofre diz 'região a confirmar' em cada dado; trocar após conferir a região do projeto Supabase. | Bloco 4: Planos | P | sim | texto de confiança provisório no produto |
| 36 | Bloco 5 (previsão, receita recorrente, fatura alta): nada publicado; cuidados de ordem com a Edge de calendário. | Bloco 5: Previsão | M | sim | é parte do que o lançamento publica |
| 39 | No 1º dia após o deploy, o passo 0 cria vencidas atrasadas e uma conta pode receber até 2 avisos de atraso. | Bloco 6A: Contas | P | não | ruído só no dia do deploy |
| 40 | Bloco 6A (contas a pagar revista): nada publicado; migração antes do front. | Bloco 6A: Contas | M | sim | é parte do que o lançamento publica |
| 43 | Bloco 6B (insights): nada publicado; Edge `insights-daily` só sobe com o front. | Bloco 6B: Insights | M | sim | é parte do que o lançamento publica |
| 58 | Bloco 7A (papéis e limites): nada publicado; migração antes das Edges de convite, ninguém convidado como guest antes do front. | Bloco 7A: Papéis | M | sim | é parte do que o lançamento publica |
| 67 | Bloco 7B (titular do cartão; o gasto privado saiu no Bloco 9): nada publicado; o SQL nunca rodou contra um banco (nem o pgTAP): validar a migração num ramo de teste, e o `bloco9.test.sql` cobre o titular que sai. | Bloco 7B: Titular | M | sim | SQL de gatilho sem nenhuma execução real |
| 69 | Bloco 7C (projetos, modelos e divisão): nada publicado; duas migrações nunca rodaram contra um banco; exigir `transaction_splits` vazio e rodar `divisao.test.sql` (32 casos) num ramo de teste. | Bloco 7C: Divisão | G | sim | SQL de dinheiro sem nenhuma execução real |
| 78 | A renovação automática depende de o Asaas devolver o token do cartão no `PAYMENT_CONFIRMED` da fatura hospedada (a doc não confirma); sem ele, todo aniversário vira `past_due`. O aviso de renovação sem token manda 'confirmar o cartão', mas a tela só oferece 'Atualizar cartão' depois da falha. | Bloco 8: Cobrança | M | sim | modelo de receita recorrente não verificado; só o Sandbox responde |
| 88 | Estorno pendente que o Asaas sempre recusa é tentado todo dia só com log; sem alerta (acompanhamento manual, §8 do roteiro). | Bloco 8: Cobrança | P | não | há procedimento manual |
| 90 | Bloco 8 (cobrança Asaas): nada publicado e nenhuma linha jamais chamou o Asaas; o Sandbox é a primeira vez e o §0 lista perguntas sem resposta na doc. | Bloco 8: Cobrança | G | sim | cobrança nunca testada contra o gateway |
| 99 | Bloco 9 (correções antes do lançamento): nada publicado; `workspace-invites-accept` antes da migração `20261102120000_bloco9.sql`, `capture` depois, o resto só com o 2.0; o `bloco9.test.sql` (20 casos) roda no projeto de teste. | Bloco 9: Correções | M | sim | é parte do que o lançamento publica |

## (D) Dívida técnica

| # | O que está errado ou falta | Bloco | Esforço | Bloqueia? | Motivo |
|---|---|---|---|---|---|
| 2 | O provider global expõe 'abrir convite', mas nada o chama (código morto). | Base: Membros | P | não | sem efeito para a pessoa |
| 9 | Exclusão em lote, parcelada, offline e desfazer de importação deixam o objeto do anexo no bucket até o cron de domingo. | Bloco 2: Fatura | P | não | só ocupa armazenamento do projeto |
| 18 | Item do Apple Pay antigo com casamento parcial não tem `walletCard` e não oferece 'Lembrar'. | Bloco 3A: Captura | P | não | só dado gravado antes do ajuste |
| 64 | Adulto que apaga anexo de outro adulto deixa o objeto no bucket até o cron de domingo. | Bloco 7B: Titular | P | não | só armazenamento |
| 71 | Apagar o plano parcelado direto na tabela solta as parcelas e o gatilho as redivide pelos pesos da carteira (perde pesos próprios). | Bloco 7C: Divisão | P | não | o botão do app apaga as parcelas junto; só acesso direto |
