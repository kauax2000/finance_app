import sys
from PIL import Image, ImageDraw
# Coordenadas do PSD "01 - iPhone 17 Pro - Front": o aparelho, a tela e a ilha.
FONE=(3363,1171,5137,4837); TELA=(3435,1231,5066,4777); ILHA=(3995,1287,4506,1437)
S=sys.argv[1]; base=Image.open(sys.argv[2]).convert("RGBA")
k=base.width/(FONE[2]-FONE[0])
def caixa(b): return (round((b[0]-FONE[0])*k),round((b[1]-FONE[1])*k),round((b[2]-FONE[0])*k),round((b[3]-FONE[1])*k))
t=caixa(TELA); tw,th=t[2]-t[0],t[3]-t[1]
mask=Image.open(f"{S}/mask-screen.png").getchannel("A").resize((tw,th),Image.LANCZOS)
ilha=Image.open(f"{S}/island.png").convert("RGBA"); i=caixa(ILHA); ilha=ilha.resize((i[2]-i[0],i[3]-i[1]),Image.LANCZOS)
for src,dst in zip(sys.argv[3::2],sys.argv[4::2]):
    out=base.copy()
    tela=Image.open(src).convert("RGBA").resize((tw,th),Image.LANCZOS)
    out.paste(tela,(t[0],t[1]),mask)
    ImageDraw.Draw(out).rounded_rectangle(i,radius=(i[3]-i[1])//2,fill=(0,0,0,255))
    out.alpha_composite(ilha,(i[0],i[1]))
    out.save(dst,"WEBP",quality=86,method=6); print(dst,out.size)
