# Lançar gasto sem abrir o app

## Para o dono: o atalho pronto

O guia "Adicionar atalho" do app tem 6 passos, sem escolha de modo, e o botão
**Baixar o atalho** entrega o arquivo assinado `public/atalho/Lançar gasto.shortcut`.
O último passo mostra a Siri ("E aí Siri, Lançar gasto") e, abaixo, as abas
Botão, Costas, Bloqueio e Ícone. Não há link do iCloud nem variável de
ambiente.

O arquivo servido hoje parte da primeira versão de 19/nov/2026 (commit `33fad78e`), a que a Siri abre, sem a condição "é" e sem o formulário: sem Entrada do atalho, ele pergunta "Qual foi o gasto?" e manda a frase ao lançamento inteligente do app.

Os arquivos são gerados e assinados por:

```bash
python3 scripts/atalho/gerar-atalho.py
```

Ele grava um arquivo só, "Lançar gasto": sem o cabeçalho `X-Atalho-Gatilho` e
respondendo com notificação, sem **Mostrar resultado**. Até 19/nov/2026 havia
dois arquivos (voz e toque, "Lançar gasto rápido"); com a voz mandando o
cabeçalho e o **Mostrar resultado**, a Siri passou a dizer que não conseguia
abrir o atalho, e o arquivo original voltou como o único. O token novo é criado
sem gatilho (`atalho_gatilho` nulo), e a lista mostra o nome guardado,
"Lançar gasto". Ele precisa do comando `shortcuts` do macOS e lê o `NEXT_PUBLIC_SUPABASE_URL`
do ambiente ou do `.env.local`. **Rode de novo se o endereço do Supabase
mudar**, e versione o arquivo novo. `python3 scripts/atalho/gerar-atalho.py
--verificar` confere o atalho sem assinar nem gravar.

O atalho tem, nesta ordem:

1. Uma ação **Texto** vazia, com a pergunta de importação "Cole o código do
   aparelho que o Finance mostrou.". Cada pessoa cola o próprio código ao
   adicionar o atalho.
2. **Se** há **Entrada do atalho**: a frase é a entrada (a transação da
   Carteira) e a origem é `apple_pay`. Senão, **Pedir Entrada** ("Qual foi o
   gasto?"), e a origem é `shortcut`: tocado ou pelo Botão de Ação, a pessoa
   digita na caixa que abre no topo da tela; pela Siri, responde em voz.
3. **Obter conteúdo de URL**: `POST` para a Edge `capture`, com o cabeçalho
   `Authorization` = `Bearer ` seguido do Texto da ação 1 (o `Bearer ` fica no
   cabeçalho, fora da pergunta), e o corpo JSON `{ "text", "source" }`.
4. **Mostrar notificação** com o `resumo` da resposta. A Edge sempre manda um: "Gasto lançado: R$ 42,00 · Mercado · Nubank" (ou "Receita lançada", com "· a conferir" quando o gasto vai para A conferir) e, em qualquer erro, "Não lançado: <motivo>". Assim a notificação nunca chega vazia.

As telas do guia são capturas do iOS 27 na moldura do iPhone
(`scripts/atalho/moldura.py`, sobre o PSD de `docs/design/mockups/`).

### Versão 2: frase ou formulário (3/nov/2026 a 19/nov/2026)

A versão 2 fazia um `GET` com o modo da conta e, no modo formulário, perguntava valor,
descrição, categoria, pagamento e data. As condições "é" dela paravam no iOS 27
("Escolha um valor para cada parâmetro"), e saíram em 19/nov/2026: o atalho de hoje só
pergunta a frase e manda com `source: "shortcut"`, e a Edge (as regras e, se preciso, a
IA) faz o resto. O `GET` continua na Edge, sem uso pelo atalho. O cabeçalho
`X-Atalho-Versao: 2` segue indo, para o app não pedir para baixar de novo.

O resto deste guia é a referência de quem monta à mão.

Este guia liga o iPhone ao app para lançar um gasto sem abri-lo. Há três caminhos:

- o Atalho "Lançar gasto", por voz ou digitando;
- a automação do Apple Pay;
- a folha de compartilhar, com foto de recibo.

Todos fazem o mesmo pedido ao app. O que o app não entende com certeza vai para
"A conferir", e você confirma depois.

Neste guia, dois marcadores ocupam o lugar dos seus dados. **Nunca publique o
valor real de nenhum deles.**

| Marcador | O que é | Onde achar |
| --- | --- | --- |
| `<URL>` | o endereço da captura | o `NEXT_PUBLIC_SUPABASE_URL` do projeto seguido de `/functions/v1/capture` (o app não o mostra: ele já vem dentro do atalho baixado) |
| `<TOKEN>` | o seu token pessoal, que o app chama de "código do atalho" | Configurações › "Lançar pelo iPhone" › Adicionar atalho (o passo 1 o cria; aparece no passo 5, e some ao fechar o guia) |

## 1. Crie o token

1. Abra o app e vá a **Configurações**.
2. Na seção "Lançar pelo iPhone", toque em **Adicionar atalho**.
3. No passo 1, **Escolha a carteira** onde os gastos vão cair. O atalho se chama
   "Lançar gasto"; adicionar outro não substitui o que já existe (só "Baixar o
   atalho de novo" substitui).
4. Toque em **Criar código**.
5. Copie o código na hora, se o navegador não o copiou sozinho. Ele **não aparece
   de novo**. Se perder o código, desconecte o atalho e crie outro.

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

## 3. O Atalho "Lançar gasto" (voz ou texto)

No app **Atalhos**, crie um atalho chamado "Lançar gasto" com estas ações, nesta
ordem:

1. **Pedir Entrada**, do tipo Texto, com a pergunta "Qual foi o gasto?".
2. **Obter conteúdo de URL**, com estes ajustes:
   - URL: `<URL>`;
   - Método: `POST`;
   - Cabeçalhos: `Authorization` = `Bearer <TOKEN>`;
   - Corpo da solicitação: `JSON`;
   - campo `text` (Texto) = a variável **Entrada Fornecida**;
   - campo `source` (Texto) = `shortcut`.
3. **Obter valor do dicionário**, com a chave `resumo` do **Conteúdo do URL**.
4. **Mostrar resultado**, com o **Valor do dicionário**.

Para usar, diga "E aí Siri, lançar gasto" e responda a frase, por exemplo "42 e
90 mercado no nubank". Tocado ou pelo Botão de Ação, o atalho abre uma caixa no
topo da tela para digitar a mesma frase.

Se o resultado vier vazio, troque a chave do passo 3 por `error`. Assim o
atalho mostra o motivo do erro.

## 4. A automação do Apple Pay (iOS 17 ou mais)

Esta automação lança cada compra feita com o Apple Pay.

No app, ela aparece em **Configurações** › "Lançar pelo iPhone", no cartão
**Lançar ao pagar com Apple Pay**, que surge depois de adicionar um atalho:
"Configurar" abre um guia de 5 passos: abrir o app Atalhos; Automação › **+**;
colar a frase pronta em **Descrever um atalho** (iOS 27), que o guia mostra com o
botão Copiar; conferir e salvar; e a notificação depois de pagar. A frase é:

> Quando eu pagar com qualquer cartão da Carteira, executar na hora o atalho
> Lançar gasto com a compra, sem pedir confirmação.

Sem a caixa de descrever (iOS 26 ou anterior), o caminho é à mão, como abaixo. Os
passos são também a referência de quem monta a automação sem o atalho pronto.

1. No app Atalhos, abra **Automação** › **+** › **Transação**.
2. Em **Cartão**, toque em **Escolher** e marque os cartões. Marque **Executar
   Imediatamente** e toque em **Seguinte**.
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

Em **Configurações** › "Lançar pelo iPhone", toque em **Desconectar** no
atalho e confirme em "Desconectar este atalho?". Daí em diante, qualquer pedido com ele recebe `401 Token inválido.`.

O atalho desconectado sai da lista. Para voltar a lançar, conecte de novo.

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
