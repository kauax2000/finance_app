# Conferir fatura com correções — design

Data: 09/11/2026. Bloco 2 ("Fatura que bate"), em wireframe.

## Por quê

Em 09/11 a fatura Bradesco de outubro do dono foi conciliada à mão, pelo chat. Ele
comparou o PDF com o app, achou o porquê de cada diferença e corrigiu os lançamentos
até a fatura do app ficar igual à do banco (R$ 9.480,97). A feature faz esse trabalho
dentro do app, para qualquer pessoa.

## O que já existe

O bloco "Conferir fatura" do detalhe do cartão
(`src/components/wireframe/conferir-fatura-wireframe.tsx`) faz quatro coisas:

- **Lê o arquivo do banco**: PDF (com senha e com IA quando o texto não basta), CSV e
  OFX.
- **Compara com o app** (`conferirNoCiclo`, em `src/lib/fatura/ciclo.ts`) e separa o
  resultado em: bate, falta no app, só no app, valor diferente e parcela fora de
  sequência.
- **Corrige só um caso**: importa o que falta no app.
- **Guarda o total do banco** de cada ciclo (`credit_card_statement_totals`).

## O que a pessoa vê

1. A pessoa envia a fatura e o app compara.
2. **Se não houver diferença de nenhum tipo**, a tela diz **"100% igual ao banco"**
   e mostra os dois totais e o ciclo. A fatura fica **aprovada** automaticamente: o
   app grava o total do banco e a data da aprovação, e o bloco passa a mostrar
   "Aprovada em dd/mm".
3. **Se houver diferença**, a tela mostra o **porquê**, agrupado por motivo. Cada
   grupo mostra quanto pesa na diferença, e cada diferença traz a correção sugerida.

   | Motivo | Correção sugerida |
   | --- | --- |
   | Fora do período: compra que o banco cobrou neste ciclo, mas que está numa data fora dele no app | Mudar a data para o primeiro dia do ciclo. A data real vai para a descrição, como " · compra em dd/mm" (a mesma regra do `ajustarAoCiclo`). |
   | Falta no app | Criar o lançamento, com a categoria de uma compra parecida (`prepararItens`). |
   | Valor diferente | Usar o valor do banco. Se o lançamento é de uma assinatura, o valor da assinatura também muda, para as próximas cobranças saírem certas. |
   | Parcela fora de sequência | Usar o número da parcela que o banco mostra. |
   | Só no app (está no app e não está na fatura) | **Nenhuma sugestão.** A pessoa escolhe entre Apagar, Mudar a forma de pagamento (Pix, TED, débito, dinheiro ou outro) e Manter. Nenhuma das três vem marcada. |

4. **Dois caminhos para aprovar**, lado a lado:
   - **"Aprovar todas (N)"** aplica todas as sugestões e as escolhas já feitas para
     "só no app". O que ficou sem escolha não muda.
   - **"Revisar uma por uma"** abre uma fila com uma diferença por vez, com
     "Corrigir" e "Pular". Um item "só no app" mostra as três escolhas, e "Pular"
     vale como Manter. No fim da fila aparecem o novo total e "Aplicar escolhidas".
5. **As correções aplicadas juntas viram um lote, com "Desfazer".** O desfazer vale
   enquanto a pessoa estiver na tela.
6. Depois de aplicar, o app compara de novo. Se não sobrar diferença, o passo 2
   acontece.
7. **Uma fatura aprovada volta a "a conferir"** quando a soma do app no ciclo deixa
   de ser igual ao total do banco, por exemplo porque alguém editou um lançamento
   depois.

## Fora

- Fechamento com dia diferente a cada fatura.
- A revisão visual da tela no design system: tudo fica em wireframe, e a revisão
  repagina depois.
- Guardar o histórico das correções além da sessão.

## Restrições

- **Wireframe**, pela regra do `AGENTS.md`:
  - os arquivos ficam em `src/components/wireframe/`;
  - os controles são nativos, sem nenhuma peça de `src/components/ui/`;
  - a tela funciona de verdade.
- **O banco de dev é o de produção**:
  - nos testes, o `supabase` é sempre mockado;
  - no navegador, a tela só é aberta e lida, sem clicar em aplicar, aprovar nem
    gravar;
  - a migração só vai para produção com o pedido explícito do dono, e tem de
    funcionar com o front da `main` (colunas novas anuláveis).
- **A conferência é de quem já pode conferir hoje**: o titular do cartão e o dono
  da carteira.
- **O fluxo de conferir ganha passos**: aplicar, revisar uma por uma e desfazer.
  Isso conta como mudança de jornada, então `docs/JORNADAS.md` e o Atlas são
  atualizados na mesma mudança.
