#!/usr/bin/env python3
"""
Gera e assina o atalho "Lançar gasto" que o guia de Minha conta oferece.

O atalho pergunta o código do aparelho ao ser adicionado (pergunta de
importação numa ação Texto, vazia de propósito), e a cada vez:

- com uma entrada (a transação da Carteira, na automação do Apple Pay), manda o
  texto dela com `source: apple_pay` e mostra o `resumo`;
- sem entrada, pede uma descrição breve ("Qual foi o gasto?") e manda a frase
  com `source: shortcut`: o lançamento inteligente do app (as regras e, se não
  entender, a IA) tira valor, descrição, categoria e pagamento dela. A resposta
  sempre traz o `resumo` ("Gasto lançado: …" ou "Não lançado: …").

Sem condição "é" nem formulário: a versão de 19/nov/2026 com eles parava no iOS
27 ("Escolha um valor para cada parâmetro").

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


def fim_se(grupo: str) -> dict:
    return acao("conditional", GroupingIdentifier=grupo, WFControlFlowMode=2)


def atalho(url: str, frase_de_teste: str | None = None) -> dict:
    u = lambda: str(uuid.uuid4()).upper()  # noqa: E731
    codigo, entrada_se = u(), u()
    frase, r_frase, resumo_frase = u(), u(), u()
    r_pay, resumo_pay = u(), u()
    acoes = [
        # 0: o código do aparelho, preenchido pela pergunta de importação.
        acao("gettext", UUID=codigo, WFTextActionText=texto("")),
        # Com Entrada (a transação da Carteira, no Apple Pay): manda o texto dela.
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=0, WFCondition=100, WFInput={"Type": "Variable", "Variable": anexo(ENTRADA)}),
        pedido(r_pay, url, codigo, "POST", [("text", texto(VAR, {0: ENTRADA})), ("source", texto("apple_pay"))]),
        chave(resumo_pay, "resumo", r_pay),
        notificar(resumo_pay),
        acao("conditional", GroupingIdentifier=entrada_se, WFControlFlowMode=1),
        # Sem Entrada: uma descrição breve, e o lançamento inteligente do app faz o resto.
        # No teste a frase fixa entra no lugar da pergunta, para o pedido sair sem ninguém digitar.
        acao("gettext", UUID=frase, WFTextActionText=texto(frase_de_teste))
        if frase_de_teste
        else acao("ask", UUID=frase, WFInputType="Text", WFAskActionPrompt=texto("Qual foi o gasto? Ex.: 42 mercado nubank")),
        pedido(r_frase, url, codigo, "POST", [
            ("text", texto(VAR, {0: saida(frase, "Texto" if frase_de_teste else "Entrada Fornecida")})),
            ("source", texto("shortcut")),
        ]),
        chave(resumo_frase, "resumo", r_frase),
        notificar(resumo_frase),
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
    assert [p["WFHTTPMethod"] for p in pedidos] == ["POST", "POST"], pedidos
    for p in pedidos:
        itens = p["WFHTTPHeaders"]["Value"]["WFDictionaryFieldValueItems"]
        cab = {i["WFKey"]["Value"]["string"]: i["WFValue"]["Value"] for i in itens}
        assert set(cab) == {"Authorization", "X-Atalho-Versao"}, cab
        assert cab["Authorization"]["string"].startswith("Bearer ")
        assert [v.get("OutputUUID") for v in cab["Authorization"]["attachmentsByRange"].values()] == [codigo]
        assert p["WFHTTPBodyType"] == "JSON"
        corpo = [i["WFKey"]["Value"]["string"] for i in p["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]]
        assert corpo == ["text", "source"], corpo

    # Uma pergunta só, a descrição; nenhuma condição além do "tem qualquer valor" da Entrada.
    ids = [_id(a) for a in acoes]
    assert ids.count("ask") == 1 and not {"choosefromlist", "choosefrommenu", "dictatetext", "showresult", "exit"} & set(ids), ids
    conds = [a["WFWorkflowActionParameters"] for a in acoes if _id(a) == "conditional"]
    assert [c["WFControlFlowMode"] for c in conds] == [0, 1, 2]
    assert conds[0]["WFCondition"] == 100 and "WFConditionalActionString" not in conds[0]
    assert len({c["GroupingIdentifier"] for c in conds}) == 1
    assert ids[-3:] == ["getvalueforkey", "notification", "conditional"], ids
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
