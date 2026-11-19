# Atalho em dois arquivos: voz e toque — desenho

Data: 19/11/2026 · Branch `finance-app-2.0` · Substitui as cinco variantes de
`2026-11-19-atalho-por-gatilho-design.md`.

## Por quê

O gatilho (Botão de Ação, Toque atrás, Tela bloqueada, Ícone) se liga em Ajustes;
o arquivo não muda nada nisso. O único comportamento que muda é a voz: a Siri fala
o resultado. Então são dois arquivos, e o nome diz qual é qual, porque a pessoa
pode instalar os dois.

## Decidido com o dono

- Dois arquivos: **voz** e **toque**.
- Nomes (opção A): voz = **Lançar gasto** (a frase da Siri continua "E aí Siri,
  Lançar gasto"); toque = **Lançar gasto rápido**.
- O último passo do toque mostra como pôr o atalho em cada lugar; o da voz é a Siri.

## Decisões minhas (o dono pode corrigir)

- Arquivos em `public/atalho/Lançar gasto.shortcut` (voz) e
  `public/atalho/Lançar gasto rápido.shortcut` (toque). As pastas
  `public/atalho/{siri,acao,toque,bloqueio,inicio}/` saem.
- Voz manda `X-Atalho-Gatilho: siri` e usa `showresult` fora do ramo Apple Pay;
  toque manda `X-Atalho-Gatilho: toque` e usa `notification`. Sem migração nem
  deploy: a Edge e o check já aceitam `siri` e `toque`.
- `next.config.ts`: cada arquivo baixa com o próprio nome no `Content-Disposition`.
- Passo 1: `RadioGroup variant="card"` com duas opções, `Voz` (ícone microfone,
  "Fale o gasto pela Siri") e `Toque` (ícone toque, "Um toque no Botão de Ação, nas
  costas do iPhone, na Tela Bloqueada ou num ícone"). Ícone de 16 do próprio
  `RadioGroupItem` (nenhuma mudança em `src/components/ui/`).
- Passo 3 baixa o arquivo da escolha.
- Último passo:
  - Toque: `Tabs` com Botão de Ação, Toque atrás, Tela bloqueada e Ícone; cada aba
    o caminho em Ajustes e a tela do iPhone (as imagens que já existem), com
    "Lançar gasto rápido" no texto.
  - Voz: "Diga 'E aí Siri, Lançar gasto'. Ela pergunta e responde falando."
  - Nos dois, um link para baixar também o outro arquivo (o mesmo código serve).
- `substituir`: `atalho_gatilho === "siri"` abre em Voz; qualquer outro, em Toque.
- Lista de aparelhos: `siri` → "Siri"; `toque`, `acao`, `bloqueio`, `inicio` → "Toque".

## Fora

- Ligar o gatilho sozinho (impossível no iOS).
- Mudança de banco ou Edge.

## Verificação

`--verificar` do gerador para os dois; `curl -I` nos dois arquivos no dev mostra o
nome certo; `conta.test.ts`, `tsc`, `lint`, `ds:audit` do guia; no iPhone, instalar os
dois e ver os nomes.
