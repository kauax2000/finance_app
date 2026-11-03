#!/usr/bin/env python3
"""
Gera e assina o atalho "Lançar gasto" que o guia de Minha conta oferece.

O atalho pergunta o código do aparelho ao ser adicionado (pergunta de
importação numa ação Texto, vazia de propósito), e a cada vez:

- com uma entrada (a transação da Carteira, na automação do Apple Pay), manda o
  texto dela com `source: apple_pay`;
- sem entrada (Siri ou toque), pede o gasto por ditado e manda com
  `source: shortcut`;

num POST para a Edge `capture` com `Authorization: Bearer <código>`, e mostra o
`resumo` da resposta numa notificação.

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


def atalho(url: str, frase_de_teste: str | None = None) -> dict:
    codigo, ditado, resposta, resumo, pay, voz = (str(uuid.uuid4()).upper() for _ in range(6))
    se = str(uuid.uuid4()).upper()
    acoes = [
        # 0: o código do aparelho, preenchido pela pergunta de importação.
        acao("gettext", UUID=codigo, WFTextActionText=texto("")),
        acao("conditional", GroupingIdentifier=se, WFControlFlowMode=0, WFCondition=100, WFInput={"Type": "Variable", "Variable": anexo(ENTRADA)}),
        acao("setvariable", WFVariableName="frase", WFInput=anexo(ENTRADA)),
        acao("gettext", UUID=pay, WFTextActionText=texto("apple_pay")),
        acao("setvariable", WFVariableName="origem", WFInput=anexo(saida(pay, "Texto"))),
        acao("conditional", GroupingIdentifier=se, WFControlFlowMode=1),
        # No teste o simulador não dita: a frase fixa entra no lugar do ditado.
        acao("gettext", UUID=ditado, WFTextActionText=texto(frase_de_teste))
        if frase_de_teste
        else acao("dictatetext", UUID=ditado),
        acao("setvariable", WFVariableName="frase", WFInput=anexo(saida(ditado, "Texto" if frase_de_teste else "Texto Ditado"))),
        acao("gettext", UUID=voz, WFTextActionText=texto("shortcut")),
        acao("setvariable", WFVariableName="origem", WFInput=anexo(saida(voz, "Texto"))),
        acao("conditional", GroupingIdentifier=se, WFControlFlowMode=2),
        acao(
            "downloadurl",
            UUID=resposta,
            WFURL=url,
            WFHTTPMethod="POST",
            WFHTTPBodyType="JSON",
            ShowHeaders=True,
            WFHTTPHeaders=dicionario([("Authorization", texto(f"Bearer {VAR}", {7: saida(codigo, "Texto")}))]),
            WFJSONValues=dicionario([
                ("text", texto(VAR, {0: variavel("frase")})),
                ("source", texto(VAR, {0: variavel("origem")})),
            ]),
        ),
        acao("getvalueforkey", UUID=resumo, WFDictionaryKey="resumo", WFInput=anexo(saida(resposta, "Conteúdo do URL"))),
        acao(
            "notification",
            WFNotificationActionTitle=texto("Finance"),
            WFNotificationActionBody=texto(VAR, {0: saida(resumo, "Valor do Dicionário")}),
        ),
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


def verificar() -> None:
    """Confere o atalho montado em memória: o que, se errado, dá 401 para todo mundo."""
    dados = atalho("https://exemplo.supabase.co/functions/v1/capture")
    plistlib.loads(plistlib.dumps(dados, fmt=plistlib.FMT_BINARY))
    acoes = dados["WFWorkflowActions"]
    (pergunta,) = dados["WFWorkflowImportQuestions"]
    alvo = acoes[pergunta["ActionIndex"]]
    assert pergunta["ActionIndex"] == 0 and alvo["WFWorkflowActionIdentifier"] == "is.workflow.actions.gettext"
    assert alvo["WFWorkflowActionParameters"]["WFTextActionText"]["Value"]["string"] == ""
    codigo = alvo["WFWorkflowActionParameters"]["UUID"]
    (pedido,) = [a["WFWorkflowActionParameters"] for a in acoes if a["WFWorkflowActionIdentifier"].endswith(".downloadurl")]
    assert pedido["WFHTTPMethod"] == "POST" and pedido["WFHTTPBodyType"] == "JSON"
    (cabecalho,) = pedido["WFHTTPHeaders"]["Value"]["WFDictionaryFieldValueItems"]
    assert cabecalho["WFKey"]["Value"]["string"] == "Authorization"
    valor = cabecalho["WFValue"]["Value"]
    assert valor["string"].startswith("Bearer ")
    assert [v.get("OutputUUID") for v in valor["attachmentsByRange"].values()] == [codigo]
    chaves = [i["WFKey"]["Value"]["string"] for i in pedido["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]]
    assert chaves == ["text", "source"], chaves
    for a in acoes:
        if a["WFWorkflowActionIdentifier"].endswith(".setvariable"):
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
