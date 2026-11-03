# Lançar gasto sem abrir o app

## Para o dono: publicar o atalho pronto

O guia "Conectar o iPhone" do app oferece o botão **Abrir o atalho**, que leva a
um atalho já montado. Você monta esse atalho uma vez e publica o link. Sem o
link, o guia mostra "O atalho pronto ainda não está disponível." e ensina a
montar à mão.

1. No app **Atalhos**, crie um atalho chamado **Lançar gasto**.
2. Primeira ação: **Se** a **Entrada do atalho** tem algum valor. Com a entrada
   (a transação da Carteira: valor, comerciante e cartão), monte o corpo com os
   campos separados da seção 4. Senão, use **Ditar texto** (Português do Brasil)
   e monte o corpo com `text`, como na seção 3.
3. **Obter conteúdo de URL**, com `POST` para `<URL>`, o cabeçalho
   `Authorization` = `Bearer ` seguido do código, e o corpo JSON da seção 2.
4. **Obter valor do dicionário** (`resumo`) e **Mostrar notificação** com ele.
5. Em **Configurações do atalho** › **Perguntas de importação**, crie uma
   pergunta para o campo do código, com o texto "Cole o código do aparelho".
   Cada pessoa cola o próprio código ao adicionar o atalho, e o seu fica de fora.
6. Teste com um código seu. Depois **tire o seu código** do atalho (a pergunta
   de importação fica vazia) e revogue esse código no app.
7. **Compartilhar** › **Copiar link do iCloud**.
8. Ponha o link em `NEXT_PUBLIC_CAPTURE_SHORTCUT_URL`, na Vercel e no
   `.env.local`, e refaça o deploy. A variável é lida na compilação.

O resto deste guia é a referência de quem monta à mão.

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
| `<URL>` | o endereço da captura | Minha conta › "Lançar sem abrir o app" › Conectar aparelho › passo 2 › "Montar à mão" › Endereço |
| `<TOKEN>` | o seu token pessoal, que o app chama de "código do aparelho" | Minha conta › "Lançar sem abrir o app" › Conectar aparelho (passo 1 o cria; ele aparece nos passos 1 e 2, e some ao fechar o guia) |

## 1. Crie o token

1. Abra o app e vá a **Minha conta**.
2. Na seção "Lançar sem abrir o app", toque em **Conectar aparelho** (ou em
   **Conectar o iPhone**, quando ainda não há nenhum) e escreva o nome do
   aparelho, por exemplo "iPhone da Ana".
3. Escolha a **carteira padrão**. É nela que o gasto cai quando o cartão citado
   não diz outra carteira.
4. Toque em **Criar código**.
5. Copie o código na hora, se o navegador não o copiou sozinho. Ele **não aparece
   de novo**. Se perder o código, desconecte o aparelho e crie outro.

Cada pessoa tem no máximo 10 tokens ativos.

> **Cuidado ao compartilhar o atalho.** O token fica gravado dentro do atalho.
> Quem recebe o atalho recebe também o token, e isso vale para o link do
> iCloud, a exportação do arquivo e o envio por mensagem. Se você compartilhou
> o atalho, desconecte o aparelho no app e crie um novo código (seção 6).

## 2. O pedido que todos os caminhos fazem

Os três caminhos fazem o mesmo pedido:

- método `POST` para `<URL>`;
- cabeçalho `Authorization: Bearer <TOKEN>`;
- cabeçalho `Content-Type: application/json`;
- um corpo JSON, de até 16 KB.

A foto de recibo é a exceção: ela vai como **Formulário** (`multipart/form-data`),
de até 10 MB, com o campo `file` (a imagem em JPG, PNG ou WebP) e os campos
`text`, `source` e `id` opcionais. Veja a seção 5.

O corpo pode ter **uma frase**:

```json
{ "text": "42,90 mercado nubank", "source": "shortcut" }
```

Ou pode ter **os campos separados**:

```json
{ "amount": "42,90", "merchant": "Mercado", "card": "Nubank", "source": "apple_pay" }
```

Os campos opcionais são estes:

- `date`, no formato `AAAA-MM-DD`. Ele só vale com os campos separados
  (`amount`), como no Apple Pay. Com `text`, o app ignora o `date` e lê a data
  da própria frase ("ontem", "dia 25"). Sem data, vale o dia de hoje em
  Brasília.
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
{ "ok": true, "id": "…", "needs_review": false, "resumo": "R$ 42,90 · Mercado · Nubank", "ia": false, "anexo": null }
```

Com `needs_review: true`, o gasto foi gravado, mas espera você conferir no app.

- `ia: true` diz que a IA leu a foto ou a frase. Esse gasto sempre vai para "A
  conferir".
- `anexo` diz se a foto ficou guardada no gasto: `true`, `false` (o gasto foi
  gravado, mas a foto não, por exemplo com o espaço de anexos da carteira cheio)
  ou `null` quando não houve foto.

Uma compra parcelada ("300 geladeira em 3x") vira um parcelamento de verdade, e
o `id` é o da 1ª parcela. O `resumo` também mostra a 1ª parcela e o valor dela
("R$ 100,00 · Geladeira (1/3)"), não o total.

Quando dá errado, a resposta traz `error`:

| Código | Quando |
| --- | --- |
| 401 | `Token inválido.`: o token foi revogado, está errado ou não existe. |
| 402 | A carteira padrão está sem plano ativo. |
| 413 | O corpo passou de 16 KB, ou a foto passou de 10 MB. |
| 422 | O app não achou o valor, por exemplo "Não entendi o valor. Ex.: 42 mercado". Nada foi gravado. |
| 422 | `Envie uma foto (JPG, PNG ou WebP).`: o arquivo não é uma dessas imagens (HEIC também não é). |
| 422 | `PDF de fatura: use Conferir fatura no app.`: PDF não vai pela captura. |
| 422 | `Não entendi a foto. Mande o valor no texto.`: nem a IA nem o `text` trouxeram o valor. |

Quando o app não entende a frase, ele pede ajuda à IA antes de desistir.

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
     - `amount` (Texto) = **Valor**;
     - `merchant` (Texto) = **Comerciante**;
     - `card` (Texto) = **Cartão**, que em algumas versões do iOS se chama
       **Cartão ou Passe**;
     - `source` (Texto) = `apple_pay`.

Valor, Comerciante e Cartão não aparecem como variáveis soltas. Eles são
**propriedades da Entrada do atalho**: toque na variável **Entrada do atalho** e
escolha a propriedade. Os nomes mudam um pouco entre versões do iOS e entre
idiomas (em inglês: Amount, Merchant, Card or Pass). Escolha a propriedade com
o valor da compra, a do nome da loja e a do cartão usado.

### O app aprende o cartão

O nome que a Wallet dá ao cartão nem sempre é o nome que ele tem no app. O gasto
vai para "A conferir", com o nome da Wallet guardado, nestes dois casos:

- o app não reconhece o cartão;
- o app só reconhece o cartão em parte, como "Nubank" na Wallet e "Nubank
  Ultravioleta" no app. Aí o cartão já vem escolhido.

Para ensinar o app, faça assim:

1. Abra o gasto e confira o cartão. Se não houver cartão, escolha o certo.
2. No quadro "A conferir", toque em **Lembrar '<nome da Wallet>' como este
   cartão**.

Cada cartão guarda um nome da Wallet só. Se o cartão já tinha outro, o botão
diz **Trocar '<antigo>' por '<novo>'**.

Daí em diante, as compras com esse cartão da Wallet já chegam com o cartão
certo.

## 5. A folha de compartilhar (foto de recibo)

Crie outro atalho e ligue **Mostrar na Folha de Compartilhar**, aceitando
**Imagens**. Adicione estas ações:

1. **Redimensionar imagem**, com a **Entrada do atalho**, para a largura de
   **1600** (altura automática). Um recibo continua legível e fica com poucas
   centenas de KB. A foto cheia do iPhone tem vários MB: o espaço de anexos é de
   25 MB por carteira e acabaria em poucos recibos, e a IA não lê imagem acima
   de 4 MB.
2. **Converter imagem**, com a **Imagem Redimensionada**, para **JPEG**. A foto
   do iPhone costuma ser HEIC, e o app não aceita HEIC.
3. **Obter conteúdo de URL**, com estes ajustes:
   - URL: `<URL>`;
   - Método: `POST`;
   - Cabeçalhos: `Authorization` = `Bearer <TOKEN>`;
   - Corpo da solicitação: **Formulário**, com estes campos:
     - `file` (Arquivo) = a **Imagem Convertida**;
     - `source` (Texto) = `share`.
4. **Obter valor do dicionário** (`resumo`) e **Mostrar resultado**.

A IA lê a foto, o gasto vai para "A conferir" e a foto fica guardada nele. Se
quiser, mande também o campo `text` com o valor ("42,90"): o valor escrito vence
o lido da foto, e sem IA disponível é ele que salva o gasto.

**Alternativa sem IA:** no lugar dos passos 1 a 3, use **Extrair texto da
imagem** com a **Entrada do atalho** e mande o **Texto** extraído no campo
`text`, com o mesmo pedido JSON da seção 3. Assim a imagem não sai do iPhone.

## 6. Perdeu o aparelho? Revogue o token

Em **Minha conta** › "Lançar sem abrir o app", toque em **Desconectar** no
aparelho e confirme em "Desconectar este aparelho?". Daí em diante, qualquer pedido com ele recebe `401 Token inválido.`.

O aparelho desconectado sai da lista. Para voltar a lançar, conecte de novo.

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
