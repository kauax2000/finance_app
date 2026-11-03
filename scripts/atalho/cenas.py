#!/usr/bin/env python3
"""
Monta as duas telas do guia que o simulador não mostra: a Siri perguntando o
gasto (passo 6) e a notificação do Finance depois do Apple Pay (passo 7).

A base é a tela de início real do iOS 27, capturada no simulador às 09:41; por
cima entram a borda acesa da Siri, a pergunta e a resposta, ou a notificação
com o ícone do Finance recortado da própria captura. Nenhum logo da Apple: a
Siri aparece pela borda, não pelo símbolo (marca registrada).

    python3 scripts/atalho/cenas.py <inicio.png> <saida-siri.png> <saida-notificacao.png> <mask-screen.png>

As saídas são telas cruas (1320×2868); `moldura.py` as põe no iPhone 17 Pro prata.
Precisa do Pillow.
"""

import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTE = "/System/Library/Fonts/SFNS.ttf"
# O ícone do Finance na captura de 1320×2868 (quarta coluna, segunda linha).
ICONE = (1010, 608, 1212, 810)


def fonte(tamanho: int, peso: int = 400) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONTE, tamanho)
    # Eixos do SF: largura, tamanho óptico, GRAD e peso; o tamanho óptico segue o corpo em pt (a tela é @3x).
    f.set_variation_by_axes([100, max(17, min(96, tamanho / 3)), 400, peso])
    return f


def placa(base: Image.Image, caixa: tuple[int, int, int, int], raio: int, alfa: int = 200) -> None:
    """Uma placa de vidro: o fundo borrado embaixo, escurecido."""
    x0, y0, x1, y1 = caixa
    recorte = base.crop(caixa).filter(ImageFilter.GaussianBlur(40))
    escuro = Image.new("RGBA", recorte.size, (28, 28, 30, alfa))
    recorte = Image.alpha_composite(recorte.convert("RGBA"), escuro)
    mascara = Image.new("L", recorte.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, x1 - x0, y1 - y0), radius=raio, fill=255)
    base.paste(recorte, (x0, y0), mascara)


MASCARA_DA_TELA = None  # o caminho da máscara da tela do PSD (`mask-screen.png`), passado por argumento


def borda_da_siri(w: int, h: int) -> Image.Image:
    import math

    from PIL import ImageChops

    mascara = Image.open(MASCARA_DA_TELA).getchannel("A").resize((w, h), Image.LANCZOS)
    # O miolo é a máscara encolhida: borrar e cortar alto encolhe mantendo a curva dos cantos.
    miolo = mascara.filter(ImageFilter.GaussianBlur(16)).point(lambda a: 255 if a > 250 else 0)
    anel = ImageChops.subtract(mascara, miolo).filter(ImageFilter.GaussianBlur(22))
    anel = ImageChops.multiply(anel, mascara)  # nada vaza para fora da tela
    # As cores pelo ângulo em volta do centro, numa imagem pequena (o anel é borrado mesmo).
    cores = [(255, 149, 0), (255, 45, 146), (175, 82, 222), (10, 132, 255), (90, 200, 250), (255, 149, 0)]
    pw, ph = w // 8, h // 8
    campo = Image.new("RGB", (pw, ph))
    px = []
    for y in range(ph):
        for x in range(pw):
            t = (math.atan2(y - ph / 2, x - pw / 2) / (2 * math.pi) + 0.5) % 1
            a = t * (len(cores) - 1)
            c0, c1 = cores[int(a)], cores[min(int(a) + 1, len(cores) - 1)]
            f = a - int(a)
            px.append(tuple(round(c0[k] + (c1[k] - c0[k]) * f) for k in range(3)))
    campo.putdata(px)
    campo = campo.resize((w, h), Image.BILINEAR).convert("RGBA")
    campo.putalpha(anel.point(lambda a: int(a * 0.95)))
    return campo


def siri(inicio: Image.Image) -> Image.Image:
    w, h = inicio.size
    tela = inicio.convert("RGBA").filter(ImageFilter.GaussianBlur(18))
    tela = Image.alpha_composite(tela, Image.new("RGBA", tela.size, (0, 0, 0, 90)))
    # A borda acesa da Siri: um anel por dentro da tela, na curva dos cantos do aparelho (a
    # máscara da tela do PSD), com as cores correndo em volta. Desenhada reta, ela era cortada
    # nos cantos pela moldura.
    tela = Image.alpha_composite(tela, borda_da_siri(w, h))

    d = ImageDraw.Draw(tela)
    # A pergunta do atalho, no topo, como a Siri responde.
    placa(tela, (90, 330, w - 90, 620), raio=64, alfa=170)
    d = ImageDraw.Draw(tela)
    d.text((150, 380), "Lançar gasto", font=fonte(44, 600), fill=(235, 235, 245, 160))
    d.text((150, 450), "Qual foi o gasto?", font=fonte(78, 600), fill=(255, 255, 255, 255))
    # O que a pessoa disse, embaixo, como a transcrição da Siri.
    texto = "“42 mercado nubank”"
    f = fonte(84, 500)
    largura = d.textlength(texto, font=f)
    d.text(((w - largura) / 2, h - 560), texto, font=f, fill=(255, 255, 255, 255))
    return tela.convert("RGB")


def notificacao(inicio: Image.Image) -> Image.Image:
    w, _ = inicio.size
    tela = inicio.convert("RGBA")
    caixa = (54, 190, w - 54, 470)
    placa(tela, caixa, raio=72, alfa=185)
    icone = inicio.crop(ICONE).resize((132, 132), Image.LANCZOS)
    mascara = Image.new("L", icone.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, 131, 131), radius=30, fill=255)
    tela.paste(icone, (102, 264), mascara)
    d = ImageDraw.Draw(tela)
    d.text((270, 262), "Finance", font=fonte(52, 600), fill=(255, 255, 255, 255))
    agora = "agora"
    fa = fonte(44)
    d.text((w - 110 - d.textlength(agora, font=fa), 268), agora, font=fa, fill=(235, 235, 245, 150))
    d.text((270, 334), "Gasto lançado: R$ 42,90", font=fonte(50, 500), fill=(255, 255, 255, 255))
    d.text((270, 396), "Mercado · Nubank", font=fonte(48), fill=(235, 235, 245, 200))
    return tela.convert("RGB")


def main() -> None:
    global MASCARA_DA_TELA
    MASCARA_DA_TELA = sys.argv[4]
    inicio = Image.open(sys.argv[1])
    siri(inicio).save(sys.argv[2])
    notificacao(inicio).save(sys.argv[3])


if __name__ == "__main__":
    main()

