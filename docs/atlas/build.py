"""Gera docs/atlas/atlas-jornadas.html a partir de docs/JORNADAS.md e docs/atlas/template.html.

Uso, na raiz do repositório: python3 docs/atlas/build.py

No template, @@Dn@@ recebe o n-ésimo bloco Mermaid do JORNADAS.md e @@Tn@@ a
n-ésima tabela, contando do zero e na ordem do arquivo. Adicionar ou remover um
diagrama ou uma tabela no JORNADAS.md desloca os índices: ajuste o template e as
contagens do assert abaixo.
"""
import re, html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
md = (ROOT / "docs/JORNADAS.md").read_text()
tpl = (ROOT / "docs/atlas/template.html").read_text()

INIT = '%%{init: {"theme":"base","themeVariables":{"darkMode":true,"background":"#121917","primaryColor":"#18211f","primaryTextColor":"#e8efec","primaryBorderColor":"#3b4a45","lineColor":"#6c7a75","textColor":"#c9d4d0","edgeLabelBackground":"#121917","fontFamily":"Inter, system-ui, sans-serif","fontSize":"14px"},"flowchart":{"useMaxWidth":true,"curve":"basis","padding":12}}}%%'
CLASSES = """
    classDef route fill:#14231f,stroke:#52c49c,color:#e8efec
    classDef dialog fill:#1a2220,stroke:#5b6a65,color:#dfe7e4
    classDef decision fill:#2a2415,stroke:#e2b85e,color:#f3e6c6
    classDef backend fill:#142130,stroke:#7ab3e6,color:#d7e7f6
    classDef journey fill:#52c49c,stroke:#52c49c,color:#0c1110,font-weight:bold"""
# ordem importa: formas de dois caracteres antes das de um
SHAPES = [(r'\[\("', "backend"), (r'\(\("', "journey"), (r'\(\["', "dialog"), (r'\{"', "decision"), (r'\["', "route")]

def diagram(src):
    body = re.sub(r"^%%\{init.*\}%%\n", "", src)
    kinds = {}
    for m in re.finditer(r'(?<![\w"])([A-Za-z]\w*)(\[\("|\(\("|\(\["|\{"|\[")', body):
        for pat, kind in SHAPES:
            if re.fullmatch(pat, m.group(2)):
                kinds.setdefault(m.group(1), kind)
                break
    lines = [INIT, body.rstrip(), CLASSES]
    for kind in ("route", "dialog", "decision", "backend", "journey"):
        ids = [i for i, k in kinds.items() if k == kind]
        if ids:
            lines.append(f"    class {','.join(ids)} {kind}")
    return '<pre class="mermaid">' + html.escape("\n".join(lines), quote=False) + "</pre>"

def inline(t):
    t = html.escape(t, quote=False)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", t)

def table(block):
    rows = [r.strip().strip("|").split(" | ") for r in block.strip().splitlines()]
    head, body = rows[0], rows[2:]
    th = "".join(f"<th>{inline(c.strip())}</th>" for c in head)
    tr = "".join("<tr>" + "".join(f"<td>{inline(c.strip())}</td>" for c in r) + "</tr>" for r in body)
    return f'<div class="table-wrap"><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'

diagrams = re.findall(r"```mermaid\n(.*?)```", md, re.S)
tables = re.findall(r"((?:^\|.*\|\n)+)", md, re.M)
# 32 tabelas (a T21 é a de regras técnicas da jornada 19, Conectar uma IA; antes eram 31: uma a menos na jornada 17, que perdeu "Quem vê o quê", e uma a mais nas lacunas fechadas do Bloco 9 e outra nas do 9b): a da legenda, dezoito de "Regras técnicas" mais a dos papéis, a de quem vê o quê e a dos
# modelos de carteira (as novas, T11, T12, T13, T14, T16, T17, T19 e T21, são as jornadas 11 e 12 do
# Bloco 4, a 13 do Bloco 5, a 14 do Bloco 6B, a 15 e a 16 do Bloco 7A, a 17 do Bloco 7B e a 18 do
# Bloco 7C; a T15 é a tabela de papéis da jornada 15, a T18 a de quem vê o quê da 17 e a T20 a dos
# modelos de carteira da 18), a de lacunas abertas e as sete de lacunas fechadas. As de lacunas ficam
# no fim do arquivo e o template as escreve à mão, então não deslocam nenhum índice de @@Tn@@.
# 31 diagramas (@@D29@@ e @@D30@@ são os da jornada 19, Conectar uma IA; antes eram 29: o 17a do gasto privado saiu no Bloco 9 e deslocou os seguintes um a menos: @@D23@@ e @@D24@@ são o titular e a conferência; @@D25@@ a @@D28@@, os da jornada 18): o 5c (captura e "A conferir", Bloco 3A) entrou como @@D9@@ e
# deslocou os de Cartões em diante (@@D10@@ a @@D14@@). Os dois do Bloco 4
# (@@D15@@, Plano e só leitura, e @@D16@@, Confiança) vêm depois do da Conta, o
# do Bloco 5 (@@D17@@, Previsão) e o do Bloco 6B (@@D18@@, Insights) vêm depois, e os três do
# Bloco 7A (@@D19@@, Trocar o papel, @@D20@@, O app do convidado, e @@D21@@, Limite por pessoa) e
# os três do Bloco 7B (@@D22@@, Lançar um gasto privado, @@D23@@, Titular do cartão, e @@D24@@,
# Conferir a fatura de um cartão com titular) e os quatro do Bloco 7C vêm por último (@@D25@@,
# Criar uma carteira, @@D26@@, Projeto, @@D27@@, Carteira de projeto, e @@D28@@, Dividir e acertar).
# O Bloco 8 partiu a jornada 11 em duas: a 11b (@@D16@@, Assinar, renovar e reembolsar) entrou logo
# depois da 11a (@@D15@@) e deslocou de Confiança em diante um a mais (@@D17@@ a @@D29@@).
# A reativação (jornada 10) entrou depois da Conta: @@D15@@ e @@T10@@ são dela, e os seguintes deslocaram um a mais.
assert len(diagrams) == 32 and len(tables) == 35, (len(diagrams), len(tables))
out = re.sub(r"@@D(\d+)@@", lambda m: diagram(diagrams[int(m.group(1))]), tpl)
out = re.sub(r"@@T(\d+)@@", lambda m: table(tables[int(m.group(1))]), out)
assert "@@" not in out
(ROOT / "docs/atlas/atlas-jornadas.html").write_text(out)
print("ok", len(out))
