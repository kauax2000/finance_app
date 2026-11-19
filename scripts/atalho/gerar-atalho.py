#!/usr/bin/env python3
"""
Gera e assina o atalho "Lançar gasto" que o guia de Minha conta oferece.

O atalho pergunta o código do aparelho ao ser adicionado (pergunta de
importação numa ação Texto, vazia de propósito), e a cada vez:

- com uma entrada (a transação da Carteira, na automação do Apple Pay), manda o
  texto dela com `source: apple_pay` e mostra o `resumo`;
- sem entrada, pede ao `GET` da Edge o modo da conta e as listas do formulário.
  Um erro do `GET` (com `resumo`) vira a notificação e o atalho para; a Edge sem
  `GET` responde 405 com `resumo`, e o atalho também para ali. No modo `frase`
  (ou outro `modo` qualquer), pergunta "Qual foi o gasto?" e manda com
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
import re
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PASTA = RAIZ / "public" / "atalho"
VAR = "￼"
# Um arquivo só, o original, para a Siri e para o toque: sem cabeçalho de gatilho e com
# notificação. Com dois arquivos (o de voz com `X-Atalho-Gatilho` e "Mostrar resultado"), a
# Siri passou a dizer que não conseguia abrir o atalho (19/11/2026).
MODOS = {"voz": (None, "Lançar gasto")}


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


def cabecalhos(codigo: str, gatilho: str | None = None) -> dict:
    return dicionario([
        ("Authorization", texto(f"Bearer {VAR}", {7: saida(codigo, "Texto")})),
        ("X-Atalho-Versao", texto("2")),
        *([("X-Atalho-Gatilho", texto(gatilho))] if gatilho else []),
    ])


def pedido(uid: str, url: str, codigo: str, metodo: str, corpo: list[tuple[str, dict]] | None = None, gatilho: str | None = None) -> dict:
    params = dict(UUID=uid, WFURL=url, WFHTTPMethod=metodo, ShowHeaders=True, WFHTTPHeaders=cabecalhos(codigo, gatilho))
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


def se(grupo: str, de: str | dict, condicao: int = 100) -> dict:
    """Se o valor do dicionário `de` (ou a variável `de`) tem valor (100)."""
    alvo = de if isinstance(de, dict) else saida(de, "Valor do Dicionário")
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=0, WFCondition=condicao,
                WFInput={"Type": "Variable", "Variable": anexo(alvo)})


def se_igual(grupo: str, de: str | dict, valor: str) -> list[dict]:
    """Se `de` é `valor`, sem o "é" do Se: o iOS 27 não lê o valor do "é" gravado fora do app.

    Procura `x<de>` num dicionário que só tem `x<valor>` e testa "tem qualquer valor".
    O `x` deixa a chave nunca vazia (o `codigo` falta quando a frase lança).
    """
    alvo = de if isinstance(de, dict) else saida(de, "Valor do Dicionário")
    tabela, achado = str(uuid.uuid4()).upper(), str(uuid.uuid4()).upper()
    return [
        acao("dictionary", UUID=tabela, WFItems=dicionario([(f"x{valor}", texto("sim"))])),
        acao("getvalueforkey", UUID=achado, WFDictionaryKey=texto(f"x{VAR}", {1: alvo}),
             WFInput=anexo(saida(tabela, "Dicionário"))),
        se(grupo, achado),
    ]


def senao(grupo: str) -> dict:
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=1)


def marcar(uid: str, valor: str) -> list[dict]:
    """`irAoFormulario` = `valor`: o texto numa ação e a variável lendo a saída dela."""
    return [
        acao("gettext", UUID=uid, WFTextActionText=texto(valor)),
        acao("setvariable", WFVariableName="irAoFormulario", WFInput=anexo(saida(uid, "Texto"))),
    ]


def fim_se(grupo: str) -> dict:
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=2)


def atalho(url: str, modo: str | None = None, frase_de_teste: str | None = None) -> dict:
    gatilho = MODOS[modo][0] if modo else None
    pedido_ = lambda *a: pedido(*a, gatilho=gatilho)  # noqa: E731
    u = lambda: str(uuid.uuid4()).upper()  # noqa: E731
    codigo, entrada_se, menu = u(), u(), u()
    opcoes, erro_get, erro_se, modo, modo_se = u(), u(), u(), u(), u()
    frase, r_frase, cod_frase, cod_se, resumo_frase = u(), u(), u(), u(), u()
    r_pay, resumo_pay = u(), u()
    valor, desc, cats, cat, pags, pag, hoje, outro, outro_fmt = (u() for _ in range(9))
    r_form, resumo_form = u(), u()
    nao, sim_modo, sim_frase, form_se = u(), u(), u(), u()
    acoes = [
        # 0: o código do aparelho, preenchido pela pergunta de importação.
        acao("gettext", UUID=codigo, WFTextActionText=texto("")),
        # Com Entrada (a transação da Carteira, no Apple Pay): manda o texto dela.
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=0, WFCondition=100, WFInput={"Type": "Variable", "Variable": anexo(ENTRADA)}),
        pedido_(r_pay, url, codigo, "POST", [("text", texto(VAR, {0: ENTRADA})), ("source", texto("apple_pay"))]),
        chave(resumo_pay, "resumo", r_pay),
        notificar(resumo_pay),
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=1),
        # Sem Entrada: o GET diz o modo da conta e traz as listas do formulário.
        pedido_(opcoes, url, codigo, "GET"),
        chave(erro_get, "resumo", opcoes),
        se(erro_se, erro_get, 100),
        notificar(erro_get),
        acao("exit"),
        fim_se(erro_se),
        chave(modo, "modo", opcoes),
        # Só o "sim" abre o formulário, uma vez só, depois dos dois caminhos que podem pedi-lo.
        *marcar(nao, "nao"),
        *se_igual(modo_se, modo, "formulario"),
        *marcar(sim_modo, "sim"),
        # Qualquer outro `modo` cai na frase.
        senao(modo_se),
        # No teste a frase fixa entra no lugar da pergunta, para o pedido sair sem ninguém digitar.
        acao("gettext", UUID=frase, WFTextActionText=texto(frase_de_teste))
        if frase_de_teste
        else acao("ask", UUID=frase, WFInputType="Text", WFAskActionPrompt=texto("Qual foi o gasto? Ex.: 42 mercado nubank")),
        pedido_(r_frase, url, codigo, "POST", [
            ("text", texto(VAR, {0: saida(frase, "Texto" if frase_de_teste else "Entrada Fornecida")})),
            ("source", texto("shortcut")),
        ]),
        chave(cod_frase, "codigo", r_frase),
        # Frase sem valor segue para o formulário; a que lançou (codigo vazio) só notifica.
        *se_igual(cod_se, cod_frase, "sem_valor"),
        *marcar(sim_frase, "sim"),
        senao(cod_se),
        chave(resumo_frase, "resumo", r_frase),
        notificar(resumo_frase),
        fim_se(cod_se),
        fim_se(modo_se),
        # O formulário, campo a campo.
        *se_igual(form_se, variavel("irAoFormulario"), "sim"),
        acao("ask", UUID=valor, WFInputType="Number", WFAskActionPrompt=texto("Qual o valor?")),
        # O espaço deixa o Pronto valer com o campo vazio; a Edge apara o `merchant`.
        acao("ask", UUID=desc, WFInputType="Text", WFAskActionPrompt=texto("Descrição (opcional)"), WFAskActionDefaultAnswer=texto(" ")),
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
        pedido_(r_form, url, codigo, "POST", [
            ("amount", texto(VAR, {0: saida(valor, "Entrada Fornecida")})),
            ("merchant", texto(VAR, {0: saida(desc, "Entrada Fornecida")})),
            ("category", texto(VAR, {0: saida(cat, "Item Escolhido")})),
            ("payment", texto(VAR, {0: saida(pag, "Item Escolhido")})),
            ("date", texto(VAR, {0: variavel("data")})),
            ("source", texto("shortcut")),
        ]),
        chave(resumo_form, "resumo", r_form),
        notificar(resumo_form),
        fim_se(form_se),
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

    # Só "tem qualquer valor": o "é" com texto gravado aqui abre vazio no iOS 27.
    conds = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "conditional" and a["WFWorkflowActionParameters"]["WFControlFlowMode"] == 0]
    assert all(c["WFCondition"] == 100 and "WFConditionalActionString" not in c for c in conds), conds
    por_uuid = {a["WFWorkflowActionParameters"].get("UUID"): a for a in acoes}
    origem = lambda c: c["WFInput"]["Variable"]["Value"]  # noqa: E731
    por_valor, alvo_de = {}, {}
    for c in conds:
        if "OutputUUID" not in origem(c):
            continue
        busca = por_uuid[origem(c)["OutputUUID"]]["WFWorkflowActionParameters"]
        tabela = por_uuid.get(busca["WFInput"]["Value"]["OutputUUID"])
        if tabela is None or _id(tabela) != "dictionary":
            continue
        (item,) = tabela["WFWorkflowActionParameters"]["WFItems"]["Value"]["WFDictionaryFieldValueItems"]
        assert _txt(busca["WFDictionaryKey"]) == "x" + VAR and _txt(item["WFKey"]).startswith("x")
        valor = _txt(item["WFKey"])[1:]
        por_valor[valor], alvo_de[valor] = c, busca["WFDictionaryKey"]["Value"]["attachmentsByRange"]["{1, 1}"]
    leitura = lambda v: por_uuid[alvo_de[v]["OutputUUID"]]["WFWorkflowActionParameters"]  # noqa: E731
    assert leitura("formulario")["WFDictionaryKey"] == "modo"
    assert leitura("sem_valor")["WFDictionaryKey"] == "codigo"
    assert alvo_de["sim"] == variavel("irAoFormulario")

    # O sinalizador: "nao" antes dos caminhos, "sim" só dentro do modo formulario e do sem_valor.
    marcas = [
        (i, next(b for b in acoes if b["WFWorkflowActionParameters"].get("UUID") == a["WFWorkflowActionParameters"]["WFInput"]["Value"]["OutputUUID"])["WFWorkflowActionParameters"]["WFTextActionText"]["Value"]["string"])
        for i, a in enumerate(acoes) if _id(a) == "setvariable" and a["WFWorkflowActionParameters"]["WFVariableName"] == "irAoFormulario"
    ]
    assert [m for _, m in marcas] == ["nao", "sim", "sim"], marcas
    i_de = {v: next(i for i, a in enumerate(acoes) if a["WFWorkflowActionParameters"] is c) for v, c in por_valor.items()}
    grupo = lambda v: por_valor[v]["GroupingIdentifier"]  # noqa: E731
    fim = lambda g, modo: next(i for i, a in enumerate(acoes) if _id(a) == "conditional" and a["WFWorkflowActionParameters"]["GroupingIdentifier"] == g and a["WFWorkflowActionParameters"]["WFControlFlowMode"] == modo)  # noqa: E731
    assert marcas[0][0] < i_de["formulario"] < marcas[1][0] < fim(grupo("formulario"), 1)
    assert i_de["sem_valor"] < marcas[2][0] < fim(grupo("sem_valor"), 1)

    # A frase que lançou só notifica: o "Senão" do sem_valor tem a notificação e nenhum pedido nem pergunta.
    ramo = acoes[fim(grupo("sem_valor"), 1) + 1:fim(grupo("sem_valor"), 2)]
    assert [_id(a) for a in ramo] == ["getvalueforkey", "notification"], [_id(a) for a in ramo]
    assert not any(_id(a) == "exit" for a in acoes[i_de["formulario"]:]), "a frase não sai antes do fim"

    # O formulário inteiro mora dentro do "Se irAoFormulario é sim", depois dos dois caminhos.
    i_posts = [i for i, a in enumerate(acoes) if _id(a) == "downloadurl"]
    i_valor = next(i for i, a in enumerate(acoes) if _id(a) == "ask" and a["WFWorkflowActionParameters"].get("WFInputType") == "Number")
    assert fim(grupo("formulario"), 2) < i_de["sim"] < i_valor < i_posts[3] < fim(grupo("sim"), 2)
    assert i_posts[2] < i_de["sem_valor"]
    (desc,) = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "ask" and _txt(a["WFWorkflowActionParameters"]["WFAskActionPrompt"]) == "Descrição (opcional)"]
    assert _txt(desc["WFAskActionDefaultAnswer"]) == " "

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

    # O arquivo é igual ao original: sem cabeçalho de gatilho e sem "Mostrar resultado".
    sem_uuid = lambda d: re.sub(r"[0-9A-F]{8}-[0-9A-F-]{27}", "", str(d))  # noqa: E731
    voz = atalho("https://exemplo.supabase.co/functions/v1/capture", "voz")
    assert sem_uuid(voz) == sem_uuid(atalho("https://exemplo.supabase.co/functions/v1/capture"))
    assert "X-Atalho-Gatilho" not in str(voz) and "showresult" not in str(voz)
    print("ok")


def assinar(dados: dict, saida_: Path) -> None:
    saida_.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as d:
        cru = Path(d) / "Lançar gasto.shortcut"
        plistlib.dump(dados, cru.open("wb"), fmt=plistlib.FMT_BINARY)
        subprocess.run(["shortcuts", "sign", "--mode", "anyone", "--input", str(cru), "--output", str(saida_)], check=True)
    print(saida_)


def main() -> None:
    if sys.argv[1:2] == ["--verificar"]:
        return verificar()
    # `--teste URL SAIDA`: o mesmo atalho contra outro endereço e com uma frase fixa, para conferir o pedido.
    if sys.argv[1:2] == ["--teste"]:
        url, saida_ = sys.argv[2], Path(sys.argv[3])
        dados = atalho(url, frase_de_teste="42 mercado teste")
        return assinar(dados, saida_)
    url = url_da_captura()
    for m, (_g, nome) in MODOS.items():
        assinar(atalho(url, m), PASTA / f"{nome}.shortcut")


if __name__ == "__main__":
    main()
