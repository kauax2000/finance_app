# Lançar gasto sem abrir o app

Este guia liga o iPhone ao app para lançar um gasto sem abri-lo. Há três caminhos:

- o Atalho "Lançar gasto", por voz;
- a automação do Apple Pay;
- a folha de compartilhar, com foto de recibo.

Todos fazem o mesmo pedido ao app. O que o app não entende com certeza vai para
"A conferir", e você confirma depois.

Neste guia, dois marcadores ocupam o lugar dos seus dados. **Nunca publique o
valor real de nenhum deles.**

| Marcador | O que é | Onde achar |
| --- | --- | --- |
| `<URL>` | o endereço da captura | Minha conta › "Captura sem abrir o app" › Endereço |
| `<TOKEN>` | o seu token pessoal | Minha conta › "Novo token" (aparece uma vez só) |

## 1. Crie o token

1. Abra o app e vá a **Minha conta**.
2. Na seção "Captura sem abrir o app", escreva o nome do aparelho, por exemplo
   "iPhone da Ana".
3. Escolha a **carteira padrão**. É nela que o gasto cai quando o cartão citado
   não diz outra carteira.
4. Toque em **Novo token**.
5. Copie o token na hora. Ele **não aparece de novo**. Se perder o token, revogue
   e crie outro.

Cada pessoa tem no máximo 10 tokens ativos.

## 2. O pedido que todos os caminhos fazem

Os três caminhos fazem o mesmo pedido:

- método `POST` para `<URL>`;
- cabeçalho `Authorization: Bearer <TOKEN>`;
- cabeçalho `Content-Type: application/json`;
- um corpo JSON, de até 16 KB.

O corpo pode ter **uma frase**:

```json
{ "text": "42,90 mercado nubank", "source": "shortcut" }
```

Ou pode ter **os campos separados**:

```json
{ "amount": "42,90", "merchant": "Mercado", "card": "Nubank", "source": "apple_pay" }
```

Os campos opcionais são estes:

- `date`, no formato `AAAA-MM-DD`. Sem ele, vale o dia de hoje em Brasília.
- `id`, um identificador seu, de até 200 caracteres. O mesmo `id` reenviado não
  duplica o gasto: o app devolve o lançamento que já existe. Sem `id`, cada
  pedido vira um lançamento.
- `source`: `shortcut`, `apple_pay` ou `share`. O padrão é `shortcut`.

A frase em `text` tem no máximo 500 caracteres.

### O valor

O `amount` aceita o formato brasileiro, como `42,90`, `1.234,56` ou
`R$ 1.234,56`. Ele aceita também um número sem formatação, como `42.9`.

O formato americano, como `1,234.50`, é **recusado**. Por isso, deixe a região
do iPhone em **Brasil** (Ajustes › Geral › Idioma e Região). Se não puder,
passe o número sem formatação.

### A resposta

Quando dá certo, o app responde com este JSON:

```json
{ "ok": true, "id": "…", "needs_review": false, "resumo": "R$ 42,90 · Mercado · Nubank" }
```

Com `needs_review: true`, o gasto foi gravado, mas espera você conferir no app.

Quando dá errado, a resposta traz `error`:

| Código | Quando |
| --- | --- |
| 401 | `Token inválido.`: o token foi revogado, está errado ou não existe. |
| 402 | A carteira padrão está sem plano ativo. |
| 413 | O corpo passou de 16 KB. |
| 422 | O app não achou o valor, por exemplo "Não entendi o valor. Ex.: 42 mercado". Nada foi gravado. |

## 3. O Atalho "Lançar gasto" (voz)

No app **Atalhos**, crie um atalho chamado "Lançar gasto" com estas ações, nesta
ordem:

1. **Ditar texto**. O idioma é Português (Brasil).
2. **Obter conteúdo de URL**, com estes ajustes:
   - URL: `<URL>`;
   - Método: `POST`;
   - Cabeçalhos: `Authorization` = `Bearer <TOKEN>`;
   - Corpo da solicitação: `JSON`;
   - campo `text` (Texto) = a variável **Texto Ditado**;
   - campo `source` (Texto) = `shortcut`.
3. **Obter valor do dicionário**, com a chave `resumo` do **Conteúdo do URL**.
4. **Mostrar resultado**, com o **Valor do dicionário**.

Para usar, diga "E aí Siri, lançar gasto" e fale a frase, por exemplo "42 e 90
mercado no nubank".

Se o resultado vier vazio, troque a chave do passo 3 por `error`. Assim o
atalho mostra o motivo do erro.

## 4. A automação do Apple Pay (iOS 17 ou mais)

Esta automação lança cada compra feita com o Apple Pay.

1. No app Atalhos, abra **Automação** › **Nova automação** › **Transação**.
2. Escolha os cartões da Wallet que devem lançar. Marque **Executar
   imediatamente**.
3. Adicione **Obter conteúdo de URL**, com estes ajustes:
   - URL: `<URL>`;
   - Método: `POST`;
   - Cabeçalhos: `Authorization` = `Bearer <TOKEN>`;
   - Corpo da solicitação: `JSON`, com estes campos:
     - `amount` (Texto) = a variável **Valor**;
     - `merchant` (Texto) = a variável **Comerciante**;
     - `card` (Texto) = a variável **Cartão**;
     - `source` (Texto) = `apple_pay`.

### O app aprende o cartão

O nome que a Wallet dá ao cartão nem sempre é o nome que ele tem no app. Quando o
app não reconhece o cartão, o gasto vai para "A conferir", com o nome da Wallet
guardado.

Para ensinar o app, faça assim:

1. Abra o gasto e escolha o cartão certo.
2. No quadro "A conferir", toque em **Lembrar '<nome da Wallet>' como este
   cartão**.

Daí em diante, as compras com esse cartão da Wallet já chegam com o cartão
certo.

## 5. A folha de compartilhar (foto de recibo)

Crie outro atalho e ligue **Mostrar na Folha de Compartilhar**, aceitando
**Imagens**. Adicione estas ações:

1. **Extrair texto da imagem**, com a **Entrada do atalho**.
2. **Obter conteúdo de URL**, com o mesmo pedido da seção 3:
   - `text` = o **Texto** extraído;
   - `source` = `share`.
3. **Obter valor do dicionário** (`resumo`) e **Mostrar resultado**.

O app lê só texto. A imagem não é enviada.

## 6. Perdeu o aparelho? Revogue o token

Em **Minha conta** › "Captura sem abrir o app", toque em **Revogar** no token do
aparelho. Daí em diante, qualquer pedido com ele recebe `401 Token inválido.`.

O token revogado continua na lista, marcado "revogado". Para voltar a lançar,
crie um token novo.

## 7. Opcional: Android avançado

No Android não há Atalhos, mas o **Tasker** ou o **MacroDroid** fazem o mesmo
pedido:

1. Crie um gatilho de **notificação** do app do banco, por exemplo "Compra
   aprovada".
2. Crie uma ação **HTTP Request**, com estes ajustes:
   - método `POST` para `<URL>`;
   - cabeçalho `Authorization: Bearer <TOKEN>`;
   - tipo `application/json`;
   - corpo `{ "text": "<o texto da notificação>", "source": "share" }`.

O texto da notificação costuma trazer o valor, a loja e o final do cartão, e o
app lê como uma frase. O que ele não entender com certeza vai para "A conferir".
