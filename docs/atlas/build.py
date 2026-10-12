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
# 14 tabelas: a da legenda, dez de "Regras técnicas", a de lacunas abertas e as
# duas de lacunas fechadas. As últimas ficam no fim do
# arquivo, então não deslocou nenhum índice de @@Tn@@.
assert len(diagrams) == 14 and len(tables) == 14, (len(diagrams), len(tables))
out = re.sub(r"@@D(\d+)@@", lambda m: diagram(diagrams[int(m.group(1))]), tpl)
out = re.sub(r"@@T(\d+)@@", lambda m: table(tables[int(m.group(1))]), out)
assert "@@" not in out
(ROOT / "docs/atlas/atlas-jornadas.html").write_text(out)
print("ok", len(out))
