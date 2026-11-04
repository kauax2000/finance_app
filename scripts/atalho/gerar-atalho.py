#!/usr/bin/env python3
"""
Gera e assina o atalho "Lançar gasto" que o guia de Minha conta oferece.

O atalho pergunta o código do aparelho ao ser adicionado (pergunta de
importação numa ação Texto, vazia de propósito), e a cada vez:

- com uma entrada (a transação da Carteira, na automação do Apple Pay), manda o
  texto dela com `source: apple_pay` e mostra o `resumo`;
- sem entrada, pede ao `GET` da Edge o modo da conta e as listas do formulário.
  Um erro do `GET` (com `resumo`) vira a notificação e o atalho para. No modo
  `frase` (ou sem `modo`, Edge antiga), pergunta "Qual foi o gasto?" e manda com
  `source: shortcut`; se a resposta vier com `codigo: "sem_valor"`, segue para o
  formulário, senão mostra o `resumo`. No modo `formulario`, vai direto a ele:
  "Qual o valor?", "Descrição (opcional)", "Categoria", "Forma de pagamento" e
  "Data" ("Hoje" ou "Outro dia", em `yyyy-MM-dd`), num POST com `amount`,
  `merchant`, `category`, `payment`, `date` e `source: shortcut`.

Todo pedido vai à Edge `capture` com `Authorization: Bearer <código>` e
`X-Atalho-Versao: 2`, e o `resumo` da resposta aparece numa notificação.

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


def variavel(nome: str) -> dict:
    return {"Type": "Variable", "VariableName": nome}


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
        ("X-Atalho-Versao", texto("2")),
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


def se(grupo: str, de: str, condicao: int, valor: str | None = None) -> dict:
    """Se o valor do dicionário `de` ...: 100 tem valor, 5 não é `valor` (texto)."""
    params = dict(GroupingIdentifier=grupo, WFControlFlowMode=0, WFCondition=condicao,
                  WFInput={"Type": "Variable", "Variable": anexo(saida(de, "Valor do Dicionário"))})
    if valor is not None:
        params["WFConditionalActionString"] = valor
    return acao("conditional", **params)


def fim_se(grupo: str) -> dict:
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=2)


def atalho(url: str, frase_de_teste: str | None = None) -> dict:
    u = lambda: str(uuid.uuid4()).upper()  # noqa: E731
    codigo, entrada_se, menu = u(), u(), u()
    opcoes, erro_get, erro_se, modo, modo_se = u(), u(), u(), u(), u()
    frase, r_frase, cod_frase, cod_se, resumo_frase = u(), u(), u(), u(), u()
    r_pay, resumo_pay = u(), u()
    valor, desc, cats, cat, pags, pag, hoje, outro, outro_fmt = (u() for _ in range(9))
    r_form, resumo_form = u(), u()
    acoes = [
        # 0: o código do aparelho, preenchido pela pergunta de importação.
        acao("gettext", UUID=codigo, WFTextActionText=texto("")),
        # Com Entrada (a transação da Carteira, no Apple Pay): manda o texto dela.
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=0, WFCondition=100, WFInput={"Type": "Variable", "Variable": anexo(ENTRADA)}),
        pedido(r_pay, url, codigo, "POST", [("text", texto(VAR, {0: ENTRADA})), ("source", texto("apple_pay"))]),
        chave(resumo_pay, "resumo", r_pay),
        notificar(resumo_pay),
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=1),
        # Sem Entrada: o GET diz o modo da conta e traz as listas do formulário.
        pedido(opcoes, url, codigo, "GET"),
        chave(erro_get, "resumo", opcoes),
        se(erro_se, erro_get, 100),
        notificar(erro_get),
        acao("exit"),
        fim_se(erro_se),
        chave(modo, "modo", opcoes),
        # Sem `modo` (Edge antiga, resposta estranha) também cai na frase.
        se(modo_se, modo, 5, "formulario"),
        # No teste a frase fixa entra no lugar da pergunta, para o pedido sair sem ninguém digitar.
        acao("gettext", UUID=frase, WFTextActionText=texto(frase_de_teste))
        if frase_de_teste
        else acao("ask", UUID=frase, WFInputType="Text", WFAskActionPrompt=texto("Qual foi o gasto? Ex.: 42 mercado nubank")),
        pedido(r_frase, url, codigo, "POST", [
            ("text", texto(VAR, {0: saida(frase, "Texto" if frase_de_teste else "Entrada Fornecida")})),
            ("source", texto("shortcut")),
        ]),
        chave(cod_frase, "codigo", r_frase),
        # Frase sem valor segue para o formulário; qualquer outra resposta encerra aqui.
        se(cod_se, cod_frase, 5, "sem_valor"),
        chave(resumo_frase, "resumo", r_frase),
        notificar(resumo_frase),
        acao("exit"),
        fim_se(cod_se),
        fim_se(modo_se),
        # O formulário, campo a campo.
        acao("ask", UUID=valor, WFInputType="Number", WFAskActionPrompt=texto("Qual o valor?")),
        acao("ask", UUID=desc, WFInputType="Text", WFAskActionPrompt=texto("Descrição (opcional)")),
        chave(cats, "categorias", opcoes),
        acao("choosefromlist", UUID=cat, WFInput=anexo(saida(cats, "Valor do Dicionário")), WFChooseFromListActionPrompt=texto("Categoria")),
        chave(pags, "pagamentos", opcoes),
        acao("choosefromlist", UUID=pag, WFInput=anexo(saida(pags, "Valor do Dicionário")), WFChooseFromListActionPrompt=texto("Forma de pagamento")),
        acao("choosefrommenu", GroupingIdentifier=menu, WFControlFlowMode=0, WFMenuPrompt="Data", WFMenuItems=["Hoje", "Outro dia"]),
        acao("choosefrommenu", GroupingIdentifier=menu, WFControlFlowMode=1, WFMenuItemTitle="Hoje"),
        acao("format.date", UUID=hoje, WFDateFormatStyle="Custom", WFDateFormat="yyyy-MM-dd", WFDate=texto(VAR, {0: {"Type": "CurrentDate"}})),
        acao("setvariable", WFVariableName="data", WFInput=anexo(saida(hoje, "Data Formatada"))),
        acao("choosefrommenu", GroupingIdentifier=menu, WFControlFlowMode=1, WFMenuItemTitle="Outro dia"),
        acao("ask", UUID=outro, WFInputType="Date", WFAskActionPrompt=texto("Data")),
        acao("format.date", UUID=outro_fmt, WFDateFormatStyle="Custom", WFDateFormat="yyyy-MM-dd", WFDate=texto(VAR, {0: saida(outro, "Entrada Fornecida")})),
        acao("setvariable", WFVariableName="data", WFInput=anexo(saida(outro_fmt, "Data Formatada"))),
        acao("choosefrommenu", GroupingIdentifier=menu, WFControlFlowMode=2),
        pedido(r_form, url, codigo, "POST", [
            ("amount", texto(VAR, {0: saida(valor, "Entrada Fornecida")})),
            ("merchant", texto(VAR, {0: saida(desc, "Entrada Fornecida")})),
            ("category", texto(VAR, {0: saida(cat, "Item Escolhido")})),
            ("payment", texto(VAR, {0: saida(pag, "Item Escolhido")})),
            ("date", texto(VAR, {0: variavel("data")})),
            ("source", texto("shortcut")),
        ]),
        chave(resumo_form, "resumo", r_form),
        notificar(resumo_form),
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


def _txt(v) -> str:
    return v["Value"]["string"] if isinstance(v, dict) else v


def verificar() -> None:
    """Confere o atalho montado em memória: o que, se errado, dá 401 para todo mundo ou perde o formulário."""
    dados = atalho("https://exemplo.supabase.co/functions/v1/capture")
    plistlib.loads(plistlib.dumps(dados, fmt=plistlib.FMT_BINARY))
    acoes = dados["WFWorkflowActions"]
    (pergunta,) = dados["WFWorkflowImportQuestions"]
    alvo = acoes[pergunta["ActionIndex"]]
    assert pergunta["ActionIndex"] == 0 and _id(alvo) == "gettext"
    assert alvo["WFWorkflowActionParameters"]["WFTextActionText"]["Value"]["string"] == ""
    codigo = alvo["WFWorkflowActionParameters"]["UUID"]

    pedidos = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "downloadurl"]
    assert [p["WFHTTPMethod"] for p in pedidos] == ["POST", "GET", "POST", "POST"], pedidos
    for p in pedidos:
        itens = p["WFHTTPHeaders"]["Value"]["WFDictionaryFieldValueItems"]
        cab = {i["WFKey"]["Value"]["string"]: i["WFValue"]["Value"] for i in itens}
        assert set(cab) == {"Authorization", "X-Atalho-Versao"}, cab
        assert cab["Authorization"]["string"].startswith("Bearer ")
        assert [v.get("OutputUUID") for v in cab["Authorization"]["attachmentsByRange"].values()] == [codigo]
        assert cab["X-Atalho-Versao"]["string"] == "2"
    corpos = [
        [i["WFKey"]["Value"]["string"] for i in p["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]]
        for p in pedidos if p["WFHTTPMethod"] == "POST"
    ]
    assert all(p["WFHTTPBodyType"] == "JSON" for p in pedidos if p["WFHTTPMethod"] == "POST")
    assert corpos == [["text", "source"], ["text", "source"], ["amount", "merchant", "category", "payment", "date", "source"]], corpos
    assert "WFJSONValues" not in pedidos[1]

    perguntas = [
        (_id(a), a["WFWorkflowActionParameters"].get("WFInputType"),
         _txt(a["WFWorkflowActionParameters"].get("WFAskActionPrompt") or a["WFWorkflowActionParameters"].get("WFChooseFromListActionPrompt") or a["WFWorkflowActionParameters"].get("WFMenuPrompt")))
        for a in acoes if _id(a) in ("ask", "choosefromlist") or (_id(a) == "choosefrommenu" and a["WFWorkflowActionParameters"]["WFControlFlowMode"] == 0)
    ]
    assert perguntas[1:6] == [
        ("ask", "Number", "Qual o valor?"),
        ("ask", "Text", "Descrição (opcional)"),
        ("choosefromlist", None, "Categoria"),
        ("choosefromlist", None, "Forma de pagamento"),
        ("choosefrommenu", None, "Data"),
    ], perguntas
    (menu,) = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "choosefrommenu" and a["WFWorkflowActionParameters"]["WFControlFlowMode"] == 0]
    assert menu["WFMenuItems"] == ["Hoje", "Outro dia"]
    casos = [a["WFWorkflowActionParameters"]["WFMenuItemTitle"] for a in acoes if _id(a) == "choosefrommenu" and a["WFWorkflowActionParameters"]["WFControlFlowMode"] == 1]
    assert casos == ["Hoje", "Outro dia"]
    for a in acoes:
        if _id(a) == "format.date":
            assert a["WFWorkflowActionParameters"]["WFDateFormat"] == "yyyy-MM-dd"

    # A frase sem valor abre o formulário: o "não é sem_valor" vem depois do POST da frase e antes do formulário.
    i_cond = [i for i, a in enumerate(acoes) if _id(a) == "conditional" and a["WFWorkflowActionParameters"].get("WFConditionalActionString") == "sem_valor"]
    assert len(i_cond) == 1, "falta a condição sem_valor"
    cond = acoes[i_cond[0]]["WFWorkflowActionParameters"]
    assert cond["WFCondition"] == 5
    i_posts = [i for i, a in enumerate(acoes) if _id(a) == "downloadurl"]
    i_valor = next(i for i, a in enumerate(acoes) if _id(a) == "ask" and a["WFWorkflowActionParameters"].get("WFInputType") == "Number")
    assert i_posts[2] < i_cond[0] < i_valor < i_posts[3]
    origem = cond["WFInput"]["Variable"]["Value"]["OutputUUID"]
    (le_codigo,) = [a for a in acoes if a["WFWorkflowActionParameters"].get("UUID") == origem]
    assert le_codigo["WFWorkflowActionParameters"]["WFDictionaryKey"] == "codigo"

    # Blocos de controle bem fechados.
    for tipo in ("conditional", "choosefrommenu"):
        abertos: list[str] = []
        for a in acoes:
            if _id(a) != tipo:
                continue
            p = a["WFWorkflowActionParameters"]
            if p["WFControlFlowMode"] == 0:
                abertos.append(p["GroupingIdentifier"])
            elif p["WFControlFlowMode"] == 2:
                assert abertos.pop() == p["GroupingIdentifier"]
            else:
                assert abertos[-1] == p["GroupingIdentifier"]
        assert not abertos
    assert not any(_id(a) == "dictatetext" for a in acoes)
    for a in acoes:
        if _id(a) == "setvariable":
            assert a["WFWorkflowActionParameters"]["WFInput"].get("WFSerializationType") != "WFTextTokenString"
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
