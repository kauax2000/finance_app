"use client";

import * as React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Code } from "@/components/ui/code";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DocNote, DocSection, Usage } from "../ds-doc";
import { Group, Spec } from "../ds-kit";
import iphoneClay from "../assets/iphone-17-pro-clay.png"
import iphoneClayAro from "../assets/iphone-17-pro-clay-aro.png"

/** O degradê do aparelho, as paradas da marca descendo do coral ao teal. */
const tintaClayClassName =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--brand-coral),var(--brand-magenta)_35%,var(--brand-violet)_60%,var(--brand-blue)_82%,var(--brand-teal))] mix-blend-multiply";

/**
 * A tela dentro da moldura, em porcentagem da imagem: a caixa da camada
 * "MASK SCREEN" do PSD (1634 × 3549 num aparelho de 1773 × 3666). As faixas
 * seguras são porcentagem da tela, na proporção do iPhone 17 Pro: 62 e 34
 * pontos de 874. A de cima cobre a Dynamic Island, que termina em 5,6%.
 */
const TELA = {
  left: 3.95,
  top: 1.58,
  width: 92.16,
  height: 96.81,
  safeTop: 7.1,
  safeBottom: 3.9,
  // O canto da tela, medido no mesmo PSD: o círculo que passa pelo ponto a 45°
  // da máscara (259 px), em porcentagem de cada eixo. Sem ele o retângulo
  // escapa pela curva externa do aparelho.
  radiusX: 15.9,
  radiusY: 7.3,
};

/**
 * As três alturas de alvo, da solta à de mouse. Os consumidores são os que
 * declaram a classe hoje — contados, não desejados.
 */
const ALVOS = [
  {
    px: 44,
    cls: "min-h-11",
    titulo: "O alvo solto",
    use: "sem linha nem trilha em volta: o dedo só tem ele para acertar",
    who: [
      "item de menu",
      "Item",
      "Pagination",
      "Tabs sem stretch",
      "NavigationMenu",
    ],
  },
  {
    px: 40,
    cls: "pointer-coarse:h-10",
    titulo: "O controle em linha",
    use: "a escada de campo colapsa aqui no dedo; a linha em volta completa o alvo",
    who: [
      "Input",
      "Textarea",
      "Select",
      "NativeSelect",
      "Combobox",
      "DatePicker",
      "FormPickerPopover",
      "InputGroup",
      "Toolbar",
      "Tabs",
    ],
  },
  {
    px: 28,
    cls: "h-7 … h-9",
    titulo: "Só com mouse",
    use: "sm 28 · md 32 · lg 36 — a hierarquia de altura existe onde o ponteiro é fino",
    who: ["Button", "Toggle"],
  },
];

/** O alvo invisível: o `::after` de cada átomo, desenhado aqui como tracejado. */
const INVISIVEIS = [
  {
    nome: "Checkbox",
    desenho: "16 × 16",
    alvo: "44 × 44",
    classe: "after:-inset-3.5",
    area: "-inset-3.5",
    controle: <Checkbox aria-label="Exemplo" defaultChecked />,
  },
  {
    nome: "Switch",
    desenho: "32 × 18",
    alvo: "56 × 34",
    classe: "after:-inset-x-3 after:-inset-y-2",
    area: "-inset-x-3 -inset-y-2",
    controle: <Switch aria-label="Exemplo" defaultChecked />,
  },
];

const SAFE_AREA = [
  {
    token: "--mobile-header-offset",
    valor: "3rem + env(safe-area-inset-top)",
    use: "quanto o conteúdo desce sob a TopBar fixa",
    who: ["TopBar", "a casca do app", "a faixa de offline"],
  },
  {
    token: "--bottom-bar-margin",
    valor: "1rem",
    use: "a folga da ilha até a borda, em cima e embaixo",
    who: ["BottomBar"],
  },
  {
    token: "--bottom-bar-pad",
    valor: "3.5rem + 2 × margem + env(safe-area-inset-bottom)",
    use: "quanto o conteúdo reserva embaixo para a ilha não cobrir a última linha",
    who: ["BottomBar", "a casca do app"],
  },
  {
    token: "env(safe-area-inset-*)",
    valor: "direto, só no vertical",
    use: "a peça que encosta numa borda soma a área segura dela",
    who: ["Sheet", "Drawer", "Toaster", "TopBar fixa", "BottomBar"],
  },
];

export default function TouchSafeAreaDoc() {
  // O aparelho tem a altura do cartão de tokens ao lado. A largura sai da
  // proporção da imagem, então CSS não fecha a conta (a coluna precisaria da
  // altura da linha, que depende da coluna): mede-se o cartão. Empilhado,
  // abaixo de `md`, volta à largura fixa.
  const tokensRef = React.useRef<HTMLDivElement>(null);
  const [altura, setAltura] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = tokensRef.current;
    if (!el) return;
    const lado = window.matchMedia("(min-width: 48rem)");
    const medir = () => setAltura(lado.matches ? el.offsetHeight : null);
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    lado.addEventListener("change", medir);
    return () => {
      ro.disconnect();
      lado.removeEventListener("change", medir);
    };
  }, []);

  return (
    <>
      <Usage>
        Toda tela deste app é vista num telefone. Metade das regras abaixo se
        decide escrevendo a versão de desktop, e refazer depois custa mais que
        ler antes.
      </Usage>

      <Group
        title="O alvo de toque"
        description="Três alturas, e quem decide qual vale é o apontador. O dedo acerta 44px soltos; dentro de uma linha ou trilha, 40 bastam."
        layout="flow"
      >
        <Spec
          title="Da solta à de mouse"
          meta="pointer-coarse"
          className="mb-0"
          bodyClassName="p-0"
        >
          {ALVOS.map((a) => (
            <section
              key={a.px}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 border-b border-border px-4 py-4 last:border-b-0"
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  aria-hidden
                  className={cn(
                    "w-full rounded-md border border-dashed border-foreground/30 bg-muted",
                    a.px === 44 ? "h-11" : a.px === 40 ? "h-10" : "h-7",
                  )}
                />
                <span className="nums text-sm font-medium text-foreground">
                  {a.px}
                </span>
              </div>
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-foreground">
                    {a.titulo}
                  </span>
                  <Code variant="inline">{a.cls}</Code>
                </div>
                <span className="text-xs text-muted-foreground">{a.use}</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {a.who.map((w) => (
                    <Code key={w}>{w}</Code>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </Spec>
      </Group>

      <DocSection
        title="O alvo é maior que o desenho"
        description="Controle pequeno ganha a área de toque num ::after transparente, e o desenho não muda. O tracejado mostra onde o toque conta."
        code={`// no próprio átomo — quem usa não escreve nada
"relative after:absolute after:-inset-3.5 after:content-['']"`}
        previewClassName="flex-wrap items-start gap-12 py-10"
      >
        {INVISIVEIS.map((c) => (
          <div key={c.nome} className="flex flex-col items-center gap-5">
            <span className="relative inline-flex">
              {c.controle}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute rounded-sm border border-dashed border-foreground/40",
                  c.area,
                )}
              />
            </span>
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-foreground">
                {c.nome}
              </span>
              <span className="nums text-2xs text-muted-foreground">
                {c.desenho} → {c.alvo}
              </span>
              <Code variant="inline" className="text-2xs text-muted-foreground">
                {c.classe}
              </Code>
            </div>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A pergunta é o apontador, não a largura"
        description="pointer-coarse: e hover: respondem ao dispositivo. Um telefone deitado continua sendo dedo; uma janela estreita no laptop continua sendo mouse. Largura decide layout, nunca tamanho de alvo."
        code={`{/* certo: cresce com o dedo, em qualquer largura */}
<li className="min-h-7 pointer-coarse:min-h-11">…</li>

{/* errado: a janela estreita do laptop ganha alvo de dedo, o tablet não */}
<li className="min-h-11 md:min-h-7">…</li>`}
        previewClassName="flex-wrap items-center gap-3"
      >
        <Button variant="outline" size="sm" className="pointer-coarse:min-h-11">
          editar
        </Button>
        <span className="text-xs text-muted-foreground">
          28px no mouse; 44 com a emulação de toque ligada.
        </span>
      </DocSection>

      <DocSection
        title="hover: não existe no toque"
        description="Utilitários hover:, dark:hover: e group-hover: compilam para @media (hover: hover). Num telefone, que responde hover: none, eles não valem — a superfície tocável soma active: para o dedo ter a mesma resposta."
        code={`{/* errado: no telefone nada acontece ao tocar */}
<div className="group hover:bg-accent">…</div>

{/* certo: o toque recebe a mesma resposta */}
<div className="group hover:bg-accent active:bg-accent group-active:bg-accent">…</div>`}
      >
        <Button variant="outline" className="hover:bg-accent active:bg-accent">
          toque ou passe o cursor
        </Button>
      </DocSection>

      <DocNote title="Não remova hover: do código para “otimizar para mobile”">
        A decisão é manter a variante <code>hover</code> padrão do Tailwind v4,
        para o iPad com trackpad continuar tendo hover. O que falta em
        superfície tocável é <strong>somar</strong> <code>active:</code>, não
        subtrair o hover. <code>tailwind-hover-policy.test.ts</code> falha se
        alguém redefinir a variante, e o auditor acusa o <code>active:</code>{" "}
        ausente como regra <strong>H</strong>.
      </DocNote>

      <Group
        title="Área segura"
        description="O entalhe em cima e o indicador de home embaixo comem pixels que o navegador ainda desenha. Toda peça que encosta numa dessas bordas soma a área segura dela."
        layout="flow"
      >
        <div className="grid items-start gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          {/* O aparelho é o iPhone 17 Pro Clay da Asylab
              (asylab.com/resources/freebies): só a moldura, com a tela vazada,
              extraída do PSD de frente. A tela é HTML por baixo dela, na caixa
              medida na camada "MASK SCREEN", e a Dynamic Island da moldura
              pousa sobre a faixa de cima. As faixas são esquema, não medida —
              a medida de verdade é a `PhoneFrame`, nas páginas das barras. */}
          <div
            aria-hidden
            className={cn("relative isolate mx-auto", altura === null && "w-48")}
            style={
              altura === null
                ? undefined
                : {
                    height: altura,
                    aspectRatio: `${iphoneClay.width} / ${iphoneClay.height}`,
                  }
            }
          >
            <div
              className="absolute flex flex-col overflow-hidden bg-background"
              style={{
                borderRadius: `${TELA.radiusX}% / ${TELA.radiusY}%`,
                left: `${TELA.left}%`,
                top: `${TELA.top}%`,
                width: `${TELA.width}%`,
                height: `${TELA.height}%`,
              }}
            >
              <div
                className="shrink-0 bg-warning-muted"
                style={{ height: `${TELA.safeTop}%` }}
              />
              <div className="flex h-6 shrink-0 items-center border-b border-border px-3 text-2xs font-medium text-foreground">
                TopBar
              </div>
              <div className="flex flex-1 flex-col gap-1.5 px-3 py-2">
                <span className="h-2 w-2/3 rounded-sm bg-muted" />
                <span className="h-2 w-1/2 rounded-sm bg-muted" />
                <span className="h-10 w-full rounded-md bg-muted" />
                <span className="h-2 w-3/5 rounded-sm bg-muted" />
              </div>
              <div className="shrink-0 px-2.5 pb-1.5">
                <div className="flex h-8 items-center justify-center rounded-full bg-card text-2xs font-medium text-foreground shadow-md ring-1 ring-border">
                  BottomBar
                </div>
              </div>
              <div
                className="flex shrink-0 items-center justify-center bg-warning-muted"
                style={{ height: `${TELA.safeBottom}%` }}
              >
                <span className="h-1 w-16 rounded-full bg-foreground/80" />
              </div>
            </div>
            <Image
              src={iphoneClay}
              alt=""
              sizes="16rem"
              className="pointer-events-none relative h-auto w-full select-none"
            />
            {/* A tinta do aparelho, em duas camadas, as duas em `multiply`
                sobre o Clay branco — o branco vira a cor e o sombreado do
                molde continua. A face leva o degradê a meia força, suave como
                o vidro da referência; o aro, os botões e a Dynamic Island
                levam o degradê cheio, que é o que desenha o contorno. Cada
                camada é mascarada pela própria peça, então a tela e a página
                em volta não se tingem. As paradas descem do coral ao teal. */}
            <div
              className={cn(tintaClayClassName, "opacity-55")}
              style={{ maskImage: `url(${iphoneClay.src})`, maskSize: "100% 100%" }}
            />
            <div
              className={tintaClayClassName}
              style={{ maskImage: `url(${iphoneClayAro.src})`, maskSize: "100% 100%" }}
            />
          </div>

          <div ref={tokensRef} className="min-w-0">
            <Spec
              title="Os tokens"
              meta="globals.css"
              className="mb-0"
              bodyClassName="flex flex-col gap-4"
            >
              {SAFE_AREA.map((s) => (
                <div key={s.token} className="flex min-w-0 flex-col">
                  <Code variant="inline">{s.token}</Code>
                  <Code
                    variant="inline"
                    className="text-2xs text-muted-foreground"
                  >
                    {s.valor}
                  </Code>
                  <span className="text-xs text-muted-foreground">{s.use}</span>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {s.who.map((w) => (
                      <Code key={w}>{w}</Code>
                    ))}
                  </div>
                </div>
              ))}
              <p className="flex items-center gap-2 text-2xs text-muted-foreground">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-xs bg-warning-muted"
                />
                No esquema, a faixa tingida é a área segura.
              </p>
            </Spec>
          </div>
        </div>
      </Group>

      <DocNote title="Sem viewport-fit=cover, env() vale zero">
        É o <code>viewportFit: &quot;cover&quot;</code> em{" "}
        <code>app/layout.tsx</code> que deixa a página desenhar atrás do entalhe
        — e só então <code>env(safe-area-inset-*)</code> tem valor. Sem ele o
        navegador reserva a faixa sozinho, com a cor dele, e todo token acima dá
        zero.
      </DocNote>

      <DocNote title="A horizontal fica de fora, de propósito">
        <code>env(safe-area-inset-left/right)</code> não aparece no repositório.
        Com o telefone deitado, o entalhe cobre a lateral; o dono dessa lacuna é
        a casca do app, e não cada folha.
      </DocNote>

      <DocNote title="Campo com menos de 16px dá zoom no iOS">
        O Safari aproxima a tela quando um campo com fonte menor que 16px ganha
        foco, e muitas vezes não volta. Abaixo de 768px o{" "}
        <code>globals.css</code> leva todo <code>input</code>,{" "}
        <code>textarea</code> e <code>select</code> a <code>1rem</code>; é por
        isso que o campo é <code>text-base md:text-sm</code>.
      </DocNote>

      <DocNote title="Confira com a emulação de dispositivo ligada">
        Sem ela o navegador responde <code>pointer: fine</code> e{" "}
        <code>hover: hover</code>, e metade destas regras não vale. Estreitar a
        janela do desktop não é a mesma coisa que emular um telefone.
      </DocNote>
    </>
  );
}
