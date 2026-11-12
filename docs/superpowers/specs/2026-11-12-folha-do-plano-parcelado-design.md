# Folha do plano parcelado — design

Data: 12/11/2026. Escolha do dono: a **V1** de
https://claude.ai/artifact/HEtbLqhioccUhnv9EcBgnW ("Folha do plano"), com as
ações de editar e encerrar.

## Por quê

Hoje o "Ver parcelas" do card "Compra parcelada" (detalhe do lançamento) leva a
`/transactions?plan=id`: a lista de transações filtrada. A pessoa sai do que
estava vendo e cai numa lista genérica, que só mostra as parcelas já lançadas e
não diz quanto falta, quando termina nem deixa mexer no plano. O dono quer um
lugar só do plano, sem passar pelo filtro.

## O que é

Uma folha do plano parcelado: no desktop o painel à direita (`Sheet`), no
telefone a gaveta alta (`Drawer`, pelo `Dialog surface="auto"`/`Sheet` que já
decide a superfície). Ela abre por cima do detalhe do lançamento (o
empilhamento que o `Sheet` e o vaul já fazem: a folha de baixo recua).

### Conteúdo, de cima para baixo

1. **Identidade**: o `ColorTile` da categoria, a descrição do plano e, embaixo,
   a categoria e o meio de pagamento (cartão pelo nome, ou "Pix", etc.).
2. **Número principal**: quanto falta (`MoneyDisplay` grande) com a legenda
   "faltam X de N · de R$ total". Plano quitado: o total e um `Badge` "quitado".
   Plano encerrado antes do fim: o que foi lançado e um `Badge` "encerrado".
3. **Barra em segmentos** (`Progress segments`), uma por parcela: lançadas
   cheias, e a parcela do lançamento de onde a folha abriu acesa (`highlight`).
4. **Três números** (`DescriptionList`): valor da parcela, próxima (data; some
   quando não há) e termina em (mês/ano da última).
5. **Parcelas**: a lista das N parcelas (`Item`), cada uma com "k/N", a data, o
   estado (`lançada`, `prevista`; as do plano encerrado que não vão existir,
   `não será lançada`) e o valor. *Chamada minha:* "fatura paga" saiu — o
   `buildInstallmentScheduleRows` devolve `invoicePaid: false` fixo até as
   faturas se integrarem, e buscar isso é consulta nova. A data da prevista é
   a `next_billing_date` mais um mês por parcela (como as projeções de cartão
   já contam); a parcela que não será lançada mostra "—". A linha da parcela aberta fica
   marcada. Tocar numa parcela lançada abre o detalhe dela (troca o lançamento
   da folha de baixo e fecha a do plano). As previstas não são clicáveis.
6. **Ações**, no rodapé da folha (a hierarquia de três ações do sistema):
   - **editar plano** — abre o formulário que já existe, já no escopo "plano"
     (`installmentEditScope = "plan"`), sobre o lançamento de onde a folha
     abriu. Ao salvar, a folha recarrega.
   - **encerrar parcelamento** — `AlertDialog` "Encerrar o parcelamento?"
     explicando que as parcelas já lançadas ficam e as próximas não serão
     lançadas. Confirmar grava `is_active = false` no plano. Só aparece com o
     plano ativo e parcelas por lançar.
   - **excluir compra** — o "cancelar a compra parcelada" que já existe
     (`deleteInstallmentPlanCascade`, RPC
     `delete_workspace_installment_plan_cascade`): `AlertDialog` destrutivo
     dizendo quantas parcelas lançadas vão junto. Confirmar apaga e fecha as
     duas folhas.

### Dados

- O plano já vem no lançamento (`transaction.installment_plan`), e as parcelas
  pelo `useInstallmentSlices` + `summarizeInstallmentPlan`
  (`installment-purchase-section.tsx`), que o detalhe já usa. A folha reusa os
  dois; nada de consulta nova para a lista.
- "Encerrar" é `update workspace_installment_plans set is_active = false` pelo
  cliente: a RLS de update já permite ao adulto da carteira. Sem migração.
  Com `is_active = false` o gerador para e as projeções de cartão
  (`credit-card-installment-projection.ts`) já ignoram o plano.
- Depois de editar, encerrar ou excluir: invalidar o que hoje é invalidado
  quando uma transação muda (`dispatchFinanceTransactionsMutated` e as
  consultas do detalhe).

## Objetivos

- Ver o plano inteiro sem sair do detalhe: quanto falta, quando termina, cada
  parcela e o estado dela.
- Editar, encerrar e excluir o plano dali.

## Fora

- **Reativar** um plano encerrado (recalcular a próxima data sem gerar um
  acúmulo de parcelas atrasadas pede regra própria). Fica para depois.
- Outras entradas: a prévia do calendário ("Ver origem: parcela"), o ⌘K
  ("Compras parceladas") e o chip "Parcelada" da tabela seguem levando a
  `/transactions?plan=id`. Só o "Ver parcelas" do card do detalhe muda.
- Uma tela de todas as compras parceladas (a V4).
- Mudar o card "Compra parcelada" em si (o dono pediu para deixar como está).

## Anti-objetivos

- Encerrar nunca apaga uma parcela lançada.
- Nenhuma ação destrutiva sem `AlertDialog`.
- Nada escrito no banco além do que a pessoa confirmou (o banco de
  desenvolvimento é o de produção).

## Restrições

- Tudo com componentes do design system (decisão do dono, 12/11): sem
  wireframe. A folha é uma composição em `src/components/transactions/`, não um
  componente novo em `ui/`. Se faltar peça no catálogo, para e pergunta
  (`AGENTS.md`, invariante 6).
- Convidado: o plano é invisível para ele (RLS de select só para adulto), então
  para o convidado o "Ver parcelas" continua o link de hoje.
- Mudança de jornada: atualizar `docs/JORNADAS.md`, `docs/atlas/template.html`,
  rodar `python3 docs/atlas/build.py` e republicar o Atlas.
- Telefone: a folha é gaveta, o rodapé fica preso e o meio rola
  (`DialogBody`); tocar fora fecha.

## Chamadas minhas (depois da leitura do revisor)

- **Quitado × encerrado**: o gerador já grava `is_active = false` quando lança
  a última parcela. Então: `is_active` e parcelas por lançar = ativo;
  `!is_active` e `generated_count >= total_installments` = quitado;
  `!is_active` e `generated_count < total_installments` = encerrado.
- **Onde muda**: só o link "ver parcelas" do `BlocoParcelada`
  (`detalhe/bloco-parcelada.tsx`), que vive dentro do `TransactionDetailSheet`.
  O `InstallmentPurchaseSection` antigo não é tocado.
- **Editar**: o formulário ganha uma prop para abrir já no escopo "plano"; o
  seletor de escopo continua visível dentro dele. O formulário abre por cima
  da folha do plano; ao salvar, fecha e a folha relê o plano e as parcelas.
- **Tocar numa parcela**: o dono do lançamento selecionado é quem monta o
  `TransactionDetailSheet` (a tela de transações). A folha do plano avisa o
  detalhe, que repassa ao dono; a folha do plano fecha.
- **Excluir**: a RPC apaga o plano e as parcelas; a contagem "N parcelas
  lançadas vão junto" vem das parcelas já carregadas.
- **Encerrar** é um `update` só de `is_active`: o único gatilho de update no
  plano é o de `split_weights`, que não dispara.

## Decidido pelo construtor

- Como a folha recebe o plano e o lançamento (props a partir do detalhe).
- Os textos exatos dos diálogos, dentro do tom do app.
- Os testes, no padrão do repositório (funções puras em `lib/` e testes que leem
  a fonte).
