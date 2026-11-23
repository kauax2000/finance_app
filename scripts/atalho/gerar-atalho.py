#!/usr/bin/env python3
"""
Gera e assina o atalho "Lançar gasto" que o guia de Minha conta oferece.

O atalho pergunta o código do aparelho ao ser adicionado (pergunta de
importação numa ação Texto, vazia de propósito), e a cada vez:

- com uma entrada (a transação da Carteira, na automação do Apple Pay), manda o
  valor, o estabelecimento e o cartão dela (as propriedades `Amount`, `Merchant`
  e `Card or Pass`), mais o texto da transação como reserva, com
  `source: apple_pay`, e mostra o `resumo`;
- sem entrada, pede uma descrição breve ("Qual foi o gasto?") e manda a frase
  com `source: shortcut`: o lançamento inteligente do app (as regras e, se não
  entender, a IA) tira valor, descrição, categoria e pagamento dela. Lançada, o
  `resumo` vira a notificação. Se a resposta voltar com `codigo` (ex.:
  `sem_valor`), pede campo a campo: "Qual o valor?", "Descrição (opcional)",
  "Categoria" e "Forma de pagamento" (listas do `GET` da Edge), num POST com
  `amount`, `merchant`, `category`, `payment` e `source: shortcut`. A data é
  sempre hoje: sem `date`, a Edge usa o dia de Brasília.

Sem condição "é": a versão de 19/nov/2026 com ela parava no iOS 27 ("Escolha um
valor para cada parâmetro"). Toda condição é "tem qualquer valor".

Todo pedido vai à Edge `capture` com `Authorization: Bearer <código>` e
`X-Atalho-Versao: 3`, e o `resumo` da resposta aparece numa notificação.

Assinar precisa do `shortcuts` do macOS, por isso o arquivo assinado é gerado
aqui e versionado em `public/atalho/`, e não no build:

    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co python3 scripts/atalho/gerar-atalho.py

Sem a variável, lê o `NEXT_PUBLIC_SUPABASE_URL` do `.env.local`.
`--verificar` confere o atalho montado em memória, sem assinar nem gravar.
"""

from __future__ import annotations

import os
import plistlib
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / "public" / "atalho" / "Lançar gasto.shortcut"
VAR = "￼"


def url_da_captura() -> str:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    if not url:
        env = RAIZ / ".env.local"
        for linha in env.read_text().splitlines() if env.exists() else []:
            if linha.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                url = linha.split("=", 1)[1].strip().strip('"')
    if not url:
        sys.exit("Defina NEXT_PUBLIC_SUPABASE_URL.")
    return url.rstrip("/") + "/functions/v1/capture"


def texto(s: str, vars: dict | None = None) -> dict:
    """Um campo de texto com variáveis: `vars` mapeia a posição do VAR à variável."""
    return {
        "Value": {"string": s, "attachmentsByRange": {f"{{{i}, 1}}": v for i, v in (vars or {}).items()}},
        "WFSerializationType": "WFTextTokenString",
    }


def anexo(v: dict) -> dict:
    return {"Value": v, "WFSerializationType": "WFTextTokenAttachment"}


def saida(uid: str, nome: str) -> dict:
    return {"Type": "ActionOutput", "OutputUUID": uid, "OutputName": nome}


ENTRADA = {"Type": "ExtensionInput"}


def propriedade(nome: str) -> dict:
    """Uma propriedade da Entrada (a transação da Carteira): valor, estabelecimento, cartão."""
    return {"Type": "ExtensionInput", "Aggrandizements": [{"Type": "WFPropertyVariableAggrandizement", "PropertyName": nome}]}


def dicionario(pares: list[tuple[str, dict]]) -> dict:
    return {
        "Value": {
            "WFDictionaryFieldValueItems": [
                {"WFItemType": 0, "WFKey": texto(k), "WFValue": v} for k, v in pares
            ]
        },
        "WFSerializationType": "WFDictionaryFieldValue",
    }


def acao(ident: str, **params) -> dict:
    return {"WFWorkflowActionIdentifier": f"is.workflow.actions.{ident}", "WFWorkflowActionParameters": params}


def cabecalhos(codigo: str) -> dict:
    return dicionario([
        ("Authorization", texto(f"Bearer {VAR}", {7: saida(codigo, "Texto")})),
        ("X-Atalho-Versao", texto("3")),
    ])


def pedido(uid: str, url: str, codigo: str, metodo: str, corpo: list[tuple[str, dict]] | None = None) -> dict:
    params = dict(UUID=uid, WFURL=url, WFHTTPMethod=metodo, ShowHeaders=True, WFHTTPHeaders=cabecalhos(codigo))
    if corpo is not None:
        params.update(WFHTTPBodyType="JSON", WFJSONValues=dicionario(corpo))
    return acao("downloadurl", **params)


def chave(uid: str, nome: str, de: str) -> dict:
    return acao("getvalueforkey", UUID=uid, WFDictionaryKey=nome, WFInput=anexo(saida(de, "Conteúdo do URL")))


def notificar(de: str) -> dict:
    return acao(
        "notification",
        WFNotificationActionTitle=texto("Finance"),
        WFNotificationActionBody=texto(VAR, {0: saida(de, "Valor do Dicionário")}),
    )


def tem_valor(grupo: str, de: str) -> dict:
    """Se o valor do dicionário `de` tem qualquer valor (100). Nunca o "é": no iOS 27 ele parava o atalho."""
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=0, WFCondition=100,
                WFInput={"Type": "Variable", "Variable": anexo(saida(de, "Valor do Dicionário"))})


def senao(grupo: str) -> dict:
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=1)


def fim_se(grupo: str) -> dict:
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=2)


def atalho(url: str, frase_de_teste: str | None = None) -> dict:
    u = lambda: str(uuid.uuid4()).upper()  # noqa: E731
    codigo, entrada_se = u(), u()
    frase, r_frase, resumo_frase, cod_frase, cod_se = u(), u(), u(), u(), u()
    r_pay, resumo_pay = u(), u()
    opcoes, erro_get, erro_se = u(), u(), u()
    valor, desc, cats, cat, pags, pag = (u() for _ in range(6))
    r_form, resumo_form = u(), u()
    acoes = [
        # 0: o código do aparelho, preenchido pela pergunta de importação.
        acao("gettext", UUID=codigo, WFTextActionText=texto("")),
        # Com Entrada (a transação da Carteira, no Apple Pay): manda as propriedades dela e o texto como reserva.
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=0, WFCondition=100, WFInput={"Type": "Variable", "Variable": anexo(ENTRADA)}),
        pedido(r_pay, url, codigo, "POST", [
            ("amount", texto(VAR, {0: propriedade("Amount")})),
            ("merchant", texto(VAR, {0: propriedade("Merchant")})),
            ("card", texto(VAR, {0: propriedade("Card or Pass")})),
            ("text", texto(VAR, {0: ENTRADA})),
            ("source", texto("apple_pay")),
        ]),
        chave(resumo_pay, "resumo", r_pay),
        notificar(resumo_pay),
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=1),
        # Sem Entrada: uma descrição breve, e o lançamento inteligente do app faz o resto.
        # No teste a frase fixa entra no lugar da pergunta, para o pedido sair sem ninguém digitar.
        acao("gettext", UUID=frase, WFTextActionText=texto(frase_de_teste))
        if frase_de_teste
        else acao("ask", UUID=frase, WFInputType="Text", WFAskActionPrompt=texto("Qual foi o gasto?")),
        pedido(r_frase, url, codigo, "POST", [
            ("text", texto(VAR, {0: saida(frase, "Texto" if frase_de_teste else "Entrada Fornecida")})),
            ("source", texto("shortcut")),
        ]),
        # A frase que não lançou volta com `codigo` (ex.: sem_valor): aí o atalho pede campo a campo.
        chave(cod_frase, "codigo", r_frase),
        tem_valor(cod_se, cod_frase),
        # As listas de categoria e pagamento vêm do GET; erro nele (com `resumo`) vira a notificação.
        pedido(opcoes, url, codigo, "GET"),
        chave(erro_get, "resumo", opcoes),
        tem_valor(erro_se, erro_get),
        notificar(erro_get),
        senao(erro_se),
        acao("ask", UUID=valor, WFInputType="Number", WFAskActionPrompt=texto("Qual o valor?")),
        # O espaço deixa o Pronto valer com o campo vazio; a Edge apara o `merchant`.
        acao("ask", UUID=desc, WFInputType="Text", WFAskActionPrompt=texto("Descrição (opcional)"), WFAskActionDefaultAnswer=texto(" ")),
        chave(cats, "categorias", opcoes),
        acao("choosefromlist", UUID=cat, WFInput=anexo(saida(cats, "Valor do Dicionário")), WFChooseFromListActionPrompt=texto("Categoria")),
        chave(pags, "pagamentos", opcoes),
        acao("choosefromlist", UUID=pag, WFInput=anexo(saida(pags, "Valor do Dicionário")), WFChooseFromListActionPrompt=texto("Forma de pagamento")),
        pedido(r_form, url, codigo, "POST", [
            ("amount", texto(VAR, {0: saida(valor, "Entrada Fornecida")})),
            ("merchant", texto(VAR, {0: saida(desc, "Entrada Fornecida")})),
            ("category", texto(VAR, {0: saida(cat, "Item Escolhido")})),
            ("payment", texto(VAR, {0: saida(pag, "Item Escolhido")})),
            ("source", texto("shortcut")),
        ]),
        chave(resumo_form, "resumo", r_form),
        notificar(resumo_form),
        fim_se(erro_se),
        # A frase que lançou só notifica.
        senao(cod_se),
        chave(resumo_frase, "resumo", r_frase),
        notificar(resumo_frase),
        fim_se(cod_se),
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=2),
    ]
    return {
        "WFWorkflowClientVersion": "2607.0.2",
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowIcon": {"WFWorkflowIconStartColor": 4282601983, "WFWorkflowIconGlyphNumber": 59511},
        "WFWorkflowTypes": ["Watch"],
        "WFWorkflowInputContentItemClasses": ["WFStringContentItem", "WFGenericFileContentItem"],
        "WFWorkflowImportQuestions": [
            {
                "ActionIndex": 0,
                "Category": "Parameter",
                "DefaultValue": "",
                "ParameterKey": "WFTextActionText",
                "Text": "Cole o código do aparelho que o Finance mostrou.",
            }
        ],
        "WFWorkflowActions": acoes,
    }


def _id(a: dict) -> str:
    return a["WFWorkflowActionIdentifier"].removeprefix("is.workflow.actions.")


def verificar() -> None:
    """Confere o atalho montado em memória: o que, se errado, dá 401 para todo mundo ou quebra no iOS."""
    dados = atalho("https://exemplo.supabase.co/functions/v1/capture")
    plistlib.loads(plistlib.dumps(dados, fmt=plistlib.FMT_BINARY))
    acoes = dados["WFWorkflowActions"]
    (pergunta,) = dados["WFWorkflowImportQuestions"]
    alvo = acoes[pergunta["ActionIndex"]]
    assert pergunta["ActionIndex"] == 0 and _id(alvo) == "gettext"
    assert alvo["WFWorkflowActionParameters"]["WFTextActionText"]["Value"]["string"] == ""
    codigo = alvo["WFWorkflowActionParameters"]["UUID"]

    pedidos = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "downloadurl"]
    assert [p["WFHTTPMethod"] for p in pedidos] == ["POST", "POST", "GET", "POST"], pedidos
    for p in pedidos:
        itens = p["WFHTTPHeaders"]["Value"]["WFDictionaryFieldValueItems"]
        cab = {i["WFKey"]["Value"]["string"]: i["WFValue"]["Value"] for i in itens}
        assert set(cab) == {"Authorization", "X-Atalho-Versao"}, cab
        assert cab["Authorization"]["string"].startswith("Bearer ")
        assert cab["X-Atalho-Versao"]["string"] == "3"
        assert [v.get("OutputUUID") for v in cab["Authorization"]["attachmentsByRange"].values()] == [codigo]
    corpos = [
        [i["WFKey"]["Value"]["string"] for i in p["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]]
        for p in pedidos if p["WFHTTPMethod"] == "POST"
    ]
    assert corpos == [["amount", "merchant", "card", "text", "source"], ["text", "source"], ["amount", "merchant", "category", "payment", "source"]], corpos
    pay = next(p for p in pedidos if p["WFHTTPMethod"] == "POST")
    campos = {i["WFKey"]["Value"]["string"]: i["WFValue"]["Value"] for i in pay["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]}
    nomes = {k: [a["PropertyName"] for a in v["attachmentsByRange"]["{0, 1}"].get("Aggrandizements", [])] for k, v in campos.items() if k in ("amount", "merchant", "card")}
    assert nomes == {"amount": ["Amount"], "merchant": ["Merchant"], "card": ["Card or Pass"]}, nomes
    assert campos["text"]["attachmentsByRange"]["{0, 1}"] == ENTRADA

    ids = [_id(a) for a in acoes]
    prompts = [a["WFWorkflowActionParameters"]["WFAskActionPrompt"]["Value"]["string"] for a in acoes if _id(a) == "ask"]
    assert prompts == ["Qual foi o gasto?", "Qual o valor?", "Descrição (opcional)"], prompts
    assert not {"dictatetext", "showresult", "exit", "choosefrommenu", "format.date"} & set(ids), ids
    # Toda condição é "tem qualquer valor" (100): nenhum "é".
    conds = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "conditional"]
    assert all(c["WFCondition"] == 100 and "WFConditionalActionString" not in c for c in conds if c["WFControlFlowMode"] == 0), conds
    for tipo in ("conditional",):
        abertos: list[str] = []
        for a in acoes:
            if _id(a) != tipo:
                continue
            q = a["WFWorkflowActionParameters"]
            if q["WFControlFlowMode"] == 0:
                abertos.append(q["GroupingIdentifier"])
            elif q["WFControlFlowMode"] == 2:
                assert abertos.pop() == q["GroupingIdentifier"]
            else:
                assert abertos[-1] == q["GroupingIdentifier"]
        assert not abertos
    # O formulário só existe dentro do "codigo tem valor": a frase que lançou não pergunta mais nada.
    i_cod = next(i for i, a in enumerate(acoes) if _id(a) == "getvalueforkey" and a["WFWorkflowActionParameters"]["WFDictionaryKey"] == "codigo")
    i_valor = prompts and next(i for i, a in enumerate(acoes) if _id(a) == "ask" and a["WFWorkflowActionParameters"]["WFInputType"] == "Number")
    assert i_cod < i_valor
    print("ok")


def main() -> None:
    if sys.argv[1:2] == ["--verificar"]:
        return verificar()
    # `--teste URL SAIDA`: o mesmo atalho contra outro endereço e com uma frase fixa, para conferir o pedido.
    if sys.argv[1:2] == ["--teste"]:
        url, saida_ = sys.argv[2], Path(sys.argv[3])
        dados = atalho(url, "42 mercado teste")
    else:
        url, saida_ = url_da_captura(), SAIDA
        dados = atalho(url)
    saida_.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as d:
        cru = Path(d) / "Lançar gasto.shortcut"
        plistlib.dump(dados, cru.open("wb"), fmt=plistlib.FMT_BINARY)
        subprocess.run(["shortcuts", "sign", "--mode", "anyone", "--input", str(cru), "--output", str(saida_)], check=True)
    print(saida_)


if __name__ == "__main__":
    main()
