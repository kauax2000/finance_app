#!/usr/bin/env python3
"""
Desenha as três telas do caminho do Apple Pay que a captura não mostra sem
cadastrar um cartão: a lista "Nova Automação" (passo 3), a "Transação" com o
cartão e o modo de executar (passos 4 e 5) e a escolha do atalho "Lançar
gasto" (passo 6).

As medidas saem da captura real do app Atalhos no iOS 27 (modo escuro,
1320×2868, 09:41): cartões #1C1C1E com raio de ~58px, linhas de 156px, fio
de 3px a partir do rótulo, texto SF de 51px, título grande de 102px. A barra
de status e o botão de voltar são recortados da própria captura. Os ícones são
ladrilhos coloridos com um glifo branco desenhado aqui: nenhum logo da Apple
nem fonte de símbolos.

    python3 scripts/atalho/cenas-apple-pay.py <biblioteca.png> <automacao.png> <saida-dir>

Grava `gatilhos.png`, `transacao.png` e `escolher.png` (1320×2868) em
<saida-dir>; `moldura.py` as põe no iPhone 17 Pro prata. Precisa do Pillow.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONTE = "/System/Library/Fonts/SFNS.ttf"
W, H = 1320, 2868

PRETO = (0, 0, 0)
CARTAO = (28, 28, 30)
FIO = (56, 56, 59)
BRANCO = (255, 255, 255)
CINZA = (142, 142, 147)
CHEVRON = (90, 90, 94)
AZUL = (0, 145, 255)
VERDE = (48, 209, 88)

# A geometria medida na captura da Biblioteca.
CX0, CX1 = 58, W - 58  # o cartão
RAIO = 58
LINHA = 156
ROTULO_X = 222  # o rótulo com ladrilho (e o começo do fio)
TEXTO_X = 106  # o rótulo sem ícone
CHEVRON_X = 1188
TITULO_BASE = 462  # a linha de base do título grande (o topo da maiúscula em ~390)

# O topo da captura até antes dos botões: a barra de status das 09:41.
BARRA = (0, 0, W, 176)
# O botão de voltar de vidro, na captura da Automação.
VOLTAR = (52, 178, 200, 326)


def fonte(tamanho: int, peso: int = 400) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONTE, tamanho)
    # Eixos do SF: largura, tamanho óptico, GRAD e peso; o tamanho óptico segue o corpo em pt (a tela é @3x).
    f.set_variation_by_axes([100, max(17, min(96, tamanho / 3)), 400, peso])
    return f


def tela(biblioteca: Image.Image) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    t = Image.new("RGB", (W, H), PRETO)
    t.paste(biblioteca.crop(BARRA), (0, 0))
    return t, ImageDraw.Draw(t)


def titulo(d: ImageDraw.ImageDraw, texto: str) -> None:
    d.text((62, TITULO_BASE), texto, font=fonte(102, 700), fill=BRANCO, anchor="ls")


def cartao(d: ImageDraw.ImageDraw, y: int, linhas: int, fio_x: int) -> None:
    d.rounded_rectangle((CX0, y, CX1, y + linhas * LINHA), radius=RAIO, fill=CARTAO)
    for i in range(1, linhas):
        yy = y + i * LINHA - 2
        d.rectangle((fio_x, yy, 1202, yy + 2), fill=FIO)


def chevron(d: ImageDraw.ImageDraw, cy: int) -> None:
    d.line([(CHEVRON_X - 8, cy - 16), (CHEVRON_X + 8, cy), (CHEVRON_X - 8, cy + 16)], fill=CHEVRON, width=6, joint="curve")


def rotulo(d: ImageDraw.ImageDraw, x: int, cy: int, texto: str, cor=BRANCO, peso: int = 400) -> None:
    d.text((x, cy), texto, font=fonte(51, peso), fill=cor, anchor="lm")


def valor(d: ImageDraw.ImageDraw, x1: int, cy: int, texto: str, cor=CINZA) -> None:
    d.text((x1, cy), texto, font=fonte(51), fill=cor, anchor="rm")


def capsula(d: ImageDraw.ImageDraw, caixa, texto: str, cor=BRANCO, peso: int = 500) -> None:
    """O botão de vidro do topo (como o Editar da captura)."""
    x0, y0, x1, y1 = caixa
    d.rounded_rectangle(caixa, radius=(y1 - y0) // 2, fill=(32, 32, 33), outline=(64, 64, 66), width=2)
    d.text(((x0 + x1) / 2, (y0 + y1) / 2), texto, font=fonte(51, peso), fill=cor, anchor="mm")


# Os glifos brancos dos ladrilhos, desenhados numa caixa de 90px centrada em (cx, cy).
def g_relogio(d, cx, cy):
    d.ellipse((cx - 27, cy - 27, cx + 27, cy + 27), outline=BRANCO, width=6)
    d.line([(cx, cy - 16), (cx, cy), (cx + 12, cy + 8)], fill=BRANCO, width=6, joint="curve")


def g_alarme(d, cx, cy):
    g_relogio(d, cx, cy + 4)
    for s in (-1, 1):
        d.pieslice((cx + s * 26 - 12, cy - 34, cx + s * 26 + 12, cy - 10), 180, 360, fill=BRANCO)


def g_lua(d, cx, cy, fundo):
    d.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=BRANCO)
    d.ellipse((cx - 10, cy - 38, cx + 34, cy + 6), fill=fundo)


def g_pino(d, cx, cy, fundo):
    d.ellipse((cx - 20, cy - 30, cx + 20, cy + 10), fill=BRANCO)
    d.polygon([(cx - 17, cy - 2), (cx + 17, cy - 2), (cx, cy + 30)], fill=BRANCO)
    d.ellipse((cx - 8, cy - 18, cx + 8, cy - 2), fill=fundo)


def g_seta(d, cx, cy, fundo):
    d.polygon([(cx + 26, cy - 26), (cx - 28, cy - 2), (cx - 2, cy + 2), (cx + 2, cy + 28)], fill=BRANCO)


def g_envelope(d, cx, cy):
    d.rounded_rectangle((cx - 30, cy - 21, cx + 30, cy + 21), radius=6, outline=BRANCO, width=5)
    d.line([(cx - 27, cy - 17), (cx, cy + 4), (cx + 27, cy - 17)], fill=BRANCO, width=5, joint="curve")


def g_balao(d, cx, cy):
    d.ellipse((cx - 30, cy - 24, cx + 30, cy + 18), fill=BRANCO)
    d.polygon([(cx - 22, cy + 6), (cx - 30, cy + 26), (cx - 6, cy + 14)], fill=BRANCO)


def g_carteira(d, cx, cy, fundo):
    # A carteira genérica: um corpo com a aba e o fecho, sem as listras do ícone da Apple.
    d.rounded_rectangle((cx - 30, cy - 22, cx + 30, cy + 24), radius=9, fill=BRANCO)
    d.rounded_rectangle((cx - 24, cy - 30, cx + 22, cy - 14), radius=5, fill=BRANCO)
    d.line([(cx - 30, cy - 14), (cx + 30, cy - 14)], fill=fundo, width=4)
    d.rounded_rectangle((cx + 6, cy - 2, cx + 34, cy + 14), radius=8, fill=fundo)
    d.ellipse((cx + 13, cy + 2, cx + 21, cy + 10), fill=BRANCO)


def g_nfc(d, cx, cy):
    for r in (12, 24, 36):
        d.arc((cx - 24 - r, cy - r, cx - 24 + r, cy + r), -50, 50, fill=BRANCO, width=6)
    d.ellipse((cx - 30, cy - 6, cx - 18, cy + 6), fill=BRANCO)


def g_app(d, cx, cy):
    for dx in (-15, 15):
        for dy in (-15, 15):
            d.rounded_rectangle((cx + dx - 11, cy + dy - 11, cx + dx + 11, cy + dy + 11), radius=5, fill=BRANCO)


def g_mais(d, cx, cy):
    d.line([(cx - 22, cy), (cx + 22, cy)], fill=BRANCO, width=7)
    d.line([(cx, cy - 22), (cx, cy + 22)], fill=BRANCO, width=7)


def ladrilho(d, cx, cy, cor, glifo, borda=None):
    d.rounded_rectangle((cx - 45, cy - 45, cx + 45, cy + 45), radius=21, fill=cor, outline=borda, width=2 if borda else 0)
    try:
        glifo(d, cx, cy, cor)
    except TypeError:
        glifo(d, cx, cy)


GATILHOS = [
    ("Hora do Dia", (0, 122, 255), g_relogio, None),
    ("Alarme", (255, 149, 0), g_alarme, None),
    ("Sono", (94, 92, 230), g_lua, None),
    ("Chegar", (52, 199, 89), g_pino, None),
    ("Sair", (255, 59, 48), g_seta, None),
    ("E-mail", (10, 132, 255), g_envelope, None),
    ("Mensagem", (52, 199, 89), g_balao, None),
    ("Transação", (0, 0, 0), g_carteira, (72, 72, 74)),
    ("NFC", (99, 99, 102), g_nfc, None),
    ("App", (191, 90, 242), g_app, None),
]
GATILHOS_Y = 694


def gatilhos(biblioteca: Image.Image) -> Image.Image:
    t, d = tela(biblioteca)
    capsula(d, (60, 186, 340, 318), "Cancelar")
    titulo(d, "Nova Automação")
    # O campo de busca, em cápsula.
    d.rounded_rectangle((CX0, 530, CX1, 644), radius=57, fill=(36, 36, 38))
    d.ellipse((106, 566, 138, 598), outline=CINZA, width=6)
    d.line([(134, 594), (150, 610)], fill=CINZA, width=7)
    d.text((170, 587), "Buscar", font=fonte(51), fill=CINZA, anchor="lm")
    cartao(d, GATILHOS_Y, len(GATILHOS), ROTULO_X)
    for i, (nome, cor, glifo, borda) in enumerate(GATILHOS):
        cy = GATILHOS_Y + i * LINHA + LINHA // 2
        ladrilho(d, 141, cy, cor, glifo, borda)
        rotulo(d, ROTULO_X, cy, nome)
        chevron(d, cy)
    return t


TRANSACAO_Y1 = 610
TRANSACAO_Y2 = 1130


def tique(d, cx, cy, cor=AZUL):
    d.line([(cx - 20, cy), (cx - 6, cy + 15), (cx + 20, cy - 17)], fill=cor, width=7, joint="curve")


def interruptor(d, x1, cy, ligado=True):
    w, h = 192, 84
    d.rounded_rectangle((x1 - w, cy - h // 2, x1, cy + h // 2), radius=h // 2, fill=VERDE if ligado else (57, 57, 61))
    kx = x1 - 6 - 112 if ligado else x1 - w + 6
    d.rounded_rectangle((kx, cy - 36, kx + 112, cy + 36), radius=36, fill=BRANCO)


def transacao(biblioteca: Image.Image) -> Image.Image:
    t, d = tela(biblioteca)
    capsula(d, (60, 186, 340, 318), "Cancelar")
    capsula(d, (960, 186, 1260, 318), "Seguinte", cor=AZUL, peso=600)
    titulo(d, "Transação")
    d.text((TEXTO_X, TRANSACAO_Y1 - 28), "Quando eu tocar em", font=fonte(45), fill=CINZA, anchor="ls")
    cartao(d, TRANSACAO_Y1, 3, TEXTO_X)
    linhas = [("Cartão", "Escolher", AZUL), ("Categoria", "Qualquer Categoria", CINZA), ("Comerciante", "Qualquer Comerciante", CINZA)]
    for i, (nome, v, cor) in enumerate(linhas):
        cy = TRANSACAO_Y1 + i * LINHA + LINHA // 2
        rotulo(d, TEXTO_X, cy, nome)
        if cor == AZUL:
            valor(d, 1202, cy, v, cor)
        else:
            valor(d, CHEVRON_X - 34, cy, v, cor)
            chevron(d, cy)
    cartao(d, TRANSACAO_Y2, 3, TEXTO_X)
    for i, nome in enumerate(["Executar Após Confirmação", "Executar Imediatamente", "Notificar ao Executar"]):
        cy = TRANSACAO_Y2 + i * LINHA + LINHA // 2
        rotulo(d, TEXTO_X, cy, nome)
        if i == 1:
            tique(d, 1180, cy)
        if i == 2:
            interruptor(d, 1210, cy)
    return t


ESCOLHER_Y = 556
ATALHOS_Y = 940
TILE_H = 330


def varinha(d, x, y):
    """A varinha mágica: o cabo na diagonal e três brilhos de quatro pontas."""
    d.line([(x, y + 62), (x + 50, y + 12)], fill=BRANCO, width=11)
    d.line([(x + 42, y + 20), (x + 56, y + 6)], fill=BRANCO, width=17)

    def brilho(cx, cy, r):
        d.polygon([(cx, cy - r), (cx + r * 0.28, cy - r * 0.28), (cx + r, cy), (cx + r * 0.28, cy + r * 0.28),
                   (cx, cy + r), (cx - r * 0.28, cy + r * 0.28), (cx - r, cy), (cx - r * 0.28, cy - r * 0.28)], fill=BRANCO)

    brilho(x + 70, y + 2, 16)
    brilho(x + 82, y + 40, 10)
    brilho(x + 22, y - 6, 9)


def g_cronometro(d, x, y):
    d.ellipse((x + 4, y + 8, x + 64, y + 68), outline=BRANCO, width=8)
    d.line([(x + 34, y + 38), (x + 34, y + 20)], fill=BRANCO, width=8)
    d.rectangle((x + 24, y - 4, x + 44, y + 4), fill=BRANCO)


def tile(base: Image.Image, caixa, de, ate, nome, glifo):
    x0, y0, x1, y1 = caixa
    g = Image.new("RGB", (x1 - x0, y1 - y0))
    gd = ImageDraw.Draw(g)
    for yy in range(y1 - y0):
        f = yy / (y1 - y0 - 1)
        gd.line([(0, yy), (x1 - x0, yy)], fill=tuple(round(de[k] + (ate[k] - de[k]) * f) for k in range(3)))
    m = Image.new("L", g.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, x1 - x0 - 1, y1 - y0 - 1), radius=60, fill=255)
    base.paste(g, (x0, y0), m)
    d = ImageDraw.Draw(base, "RGBA")
    glifo(d, x0 + 44, y0 + 50)
    # O botão de reticências no canto, como nos cartões do app.
    d.ellipse((x1 - 112, y0 + 36, x1 - 36, y0 + 112), fill=(255, 255, 255, 64))
    for k in (-18, 0, 18):
        d.ellipse((x1 - 74 + k - 5, y0 + 69, x1 - 74 + k + 5, y0 + 79), fill=BRANCO)
    d.text((x0 + 44, y1 - 46), nome, font=fonte(52, 600), fill=BRANCO, anchor="ls")


def escolher(biblioteca: Image.Image, automacao: Image.Image) -> Image.Image:
    t, d = tela(biblioteca)
    t.paste(automacao.crop(VOLTAR), VOLTAR[:2])
    titulo(d, "Transação")
    cartao(d, ESCOLHER_Y, 1, ROTULO_X)
    cy = ESCOLHER_Y + LINHA // 2
    ladrilho(d, 141, cy, (99, 99, 102), g_mais)
    rotulo(d, ROTULO_X, cy, "Nova Automação em Branco")
    chevron(d, cy)
    d.text((120, ATALHOS_Y - 40), "Meus Atalhos", font=fonte(68, 700), fill=BRANCO, anchor="ls")
    meio = W // 2
    tile(t, (CX0, ATALHOS_Y, meio - 18, ATALHOS_Y + TILE_H), (255, 105, 97), (226, 46, 52), "Lançar gasto", varinha)
    tile(t, (meio + 18, ATALHOS_Y, CX1, ATALHOS_Y + TILE_H), (110, 110, 115), (72, 72, 76), "Timer de foco", g_cronometro)
    return t


def main() -> None:
    biblioteca = Image.open(sys.argv[1]).convert("RGB")
    automacao = Image.open(sys.argv[2]).convert("RGB")
    assert biblioteca.size == (W, H) and automacao.size == (W, H), "capturas de 1320×2868"
    saida = Path(sys.argv[3])
    saida.mkdir(parents=True, exist_ok=True)
    gatilhos(biblioteca).save(saida / "gatilhos.png")
    transacao(biblioteca).save(saida / "transacao.png")
    escolher(biblioteca, automacao).save(saida / "escolher.png")


if __name__ == "__main__":
    main()
