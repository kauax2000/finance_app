"use client"

import { DocNote, Usage } from "../ds-doc"
import {
  Group,
  IdentityDiscs,
  Ramp,
  SurfaceNest,
  SpecimenPanel,
  TokenGrid,
  TokenTile,
} from "../ds-kit"

/**
 * A cor é a superfície desta página: cada token é um ladrilho, e nome, token e
 * medição descem para uma legenda quieta. Superfícies e rampa abrem com um
 * espécime maior, porque hierarquia e distinção só se julgam lado a lado.
 */
export default function ColorsDoc() {
  return (
    <>
      <Usage>
        Nenhuma cor é escolhida na tela: toda cor vem de um token semântico, escolhido pelo <strong>papel</strong> que cumpre e não pelo tom que tem. Casar por aparência é o que quebra o tema escuro.
      </Usage>

      <DocNote title="Como ler os ladrilhos">
        Hex e contraste são calculados no navegador, no tema do alternador. Quem sustenta texto (<code>Aa</code>) é medido contra ele — <code>✓</code> é AA, 4,5:1; peça sobre superfície (anel, contorno, série) vai contra o cartão, pelos 3:1 da 1.4.11. A marca âmbar avisa quando o token falha só no outro tema.
      </DocNote>

      <DocNote title="Edite em oklch; o hex é para levar a cor embora">
        Os tokens se editam em <code>oklch</code>, em <code>globals.css</code>. O hex é projeção em sRGB para ferramenta externa; token translúcido vem como base mais alpha (<code>#FFFFFF 10%</code>).
      </DocNote>

      <DocNote title="No claro, os chãos sobre superfície ficam em 0,93–0,94">
        <code>--secondary</code>, <code>--muted</code>, <code>--accent</code> e <code>--sidebar-accent</code> precisam de degraus maiores no claro: perto do branco a razão da WCAG rende pouco, e mais claro que isso o item ativo empata com a lateral.
      </DocNote>

      <Group
        layout="flow"
        title="Superfícies"
        description="Do fundo da página ao popover. Cada degrau se apoia no anterior."
      >
        <SpecimenPanel surface="background">
          <SurfaceNest
            layers={[
              { token: "--background", onToken: "--foreground" },
              { token: "--card", onToken: "--card-foreground" },
              {
                token: "--popover",
                onToken: "--popover-foreground",
                note: "mesma cor do card",
              },
            ]}
            fills={[
              { token: "--muted", onToken: "--muted-foreground" },
              { token: "--accent", onToken: "--accent-foreground" },
              { token: "--secondary", onToken: "--secondary-foreground" },
            ]}
          />
        </SpecimenPanel>

        <TokenGrid label="Base" meta="globals.css">
          <TokenTile name="Background" token="--background" onToken="--foreground" />
          <TokenTile name="Card" token="--card" onToken="--card-foreground" />
          <TokenTile name="Popover" token="--popover" onToken="--popover-foreground" />
          <TokenTile name="Muted" token="--muted" onToken="--muted-foreground" />
          <TokenTile name="Accent" token="--accent" onToken="--accent-foreground" />
          <TokenTile name="Secondary" token="--secondary" onToken="--secondary-foreground" />
        </TokenGrid>

        <TokenGrid label="Primário e foco">
          <TokenTile name="Primary" token="--primary" onToken="--primary-foreground" />
          {/* O realce e a aresta da tecla preta (branca no escuro). O hover é
              opaco e puxa na direção do rótulo nos dois temas. */}
          <TokenTile name="Primary (hover)" token="--primary-hover" onToken="--primary-foreground" />
          {/* Dois papéis. `--primary` preenche e por isso é medido contra o
              texto que fica em cima; `--primary-accent` é texto e por isso é
              medido contra o cartão que fica embaixo. Com a marca preta os
              dois coincidem com `--foreground`, mas o papel não se funde:
              dentro de uma tecla no escuro `text-primary` é branco sobre
              branco. A cor da marca é o arco-íris, em `/designsystem/brand`. */}
          <TokenTile name="Primary (texto)" token="--primary-accent" rule="text" />
          <TokenTile name="Ring (foco)" token="--ring" rule="ui" />
          {/* `--input` está **fora da 1.4.11 por decisão consciente**, e o
              ladrilho reprova de propósito para a decisão ficar visível. Ele
              passou um dia a `oklch(0.62)` (3,49:1) e o dono o devolveu ao fio
              quase invisível com a referência na mesa: no `border-beam` do 21st
              o fio contrasta 1,11:1 com o preenchimento e é o **fill** que
              identifica o campo, a 1,15 contra a página. Aqui: fill a `/50` a
              1,13 / 1,16 contra a página, fio a 1,16 / 1,12 contra o fill. A
              saída para os 3:1 está no token: 0,62 no claro, 0,55 no escuro. */}
          <TokenTile name="Border" token="--border" />
          <TokenTile name="Input (borda)" token="--input" rule="ui" />
          <TokenTile name="Skeleton" token="--skeleton" />
          <TokenTile name="Overlay" token="--overlay" />
        </TokenGrid>

        <TokenGrid label="Sidebar">
          <TokenTile name="Sidebar" token="--sidebar" onToken="--sidebar-foreground" />
          <TokenTile
            name="Item ativo e em hover"
            token="--sidebar-accent"
            onToken="--sidebar-accent-foreground"
          />
        </TokenGrid>
      </Group>

      <Group
        layout="flow"
        title="Marca"
        description="A marca é preta e branca, e a única cor dela é o arco-íris: oito paradas num degradê parado, a lava que é o movimento delas, e o grão que só o campo de marca veste. Nenhuma tela usa uma parada solta."
      >
        <SpecimenPanel className="gap-4">
          <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
            <div className="flex flex-col gap-1.5">
              <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                brand-lava · o movimento
              </span>
              <div className="brand-lava h-24 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                brand-field · com grão
              </span>
              <div className="brand-field h-24 rounded-lg" />
            </div>
          </div>
          <Ramp
            label="As paradas"
            tokens={[
              { token: "--brand-teal", name: "teal" },
              { token: "--brand-blue", name: "blue" },
              { token: "--brand-indigo", name: "indigo" },
              { token: "--brand-violet", name: "violet" },
              { token: "--brand-magenta", name: "magenta" },
              { token: "--brand-coral", name: "coral" },
              { token: "--brand-amber", name: "amber" },
              { token: "--brand-green", name: "green" },
            ]}
          />
        </SpecimenPanel>

        <TokenGrid label="Paradas" meta="lidas pelo degradê">
          <TokenTile name="Brand teal" token="--brand-teal" />
          <TokenTile name="Brand blue" token="--brand-blue" />
          <TokenTile name="Brand indigo" token="--brand-indigo" />
          <TokenTile name="Brand violet" token="--brand-violet" />
          <TokenTile name="Brand magenta" token="--brand-magenta" />
          <TokenTile name="Brand coral" token="--brand-coral" />
          <TokenTile name="Brand amber" token="--brand-amber" />
          <TokenTile name="Brand green" token="--brand-green" />
        </TokenGrid>
      </Group>

      <DocNote title="O arco-íris mora só na marca">
        <code>--brand-rainbow</code> é o degradê, <strong>parado</strong>, interpolado <code>in oklch shorter hue</code> — em sRGB o matiz corria 4× mais rápido na travessia magenta→coral, e era ela o fio que cortava o campo. O movimento é a <code>@utility brand-lava</code>, a faixa acima. Arco-íris <strong>sob texto</strong> é a invariante 3 com oito cores de uma vez: oito matizes não têm um contraste só. O <code>Button</code> e o <code>Badge variant=&quot;brand&quot;</code> escapam porque neles o degradê vive num contorno de 1px e num halo atrás, nunca sob o rótulo. E a lima <strong>não é o verde de estado</strong>: <code>success</code>, <code>income</code> e <code>chart-1</code> ficam em 152, ela em 130.
      </DocNote>

      <DocNote title="Popover tem a cor do card; o que os separa é a elevação">
        <code>--popover</code> e <code>--card</code> valem o mesmo nos dois temas: o popover se destaca pela sombra e pelo anel, não por ser mais claro. A placa flutuante chegou a vestir a tinta da barra (<code>--background</code>) para se separar do cartão, e na tela virou uma chapa escura sem vidro; ela voltou ao <code>--popover</code> a 85/60 (rodada 132).
      </DocNote>

      <DocNote title="--primary preenche; --primary-accent é marca sobre o fundo">
        Cor que carrega o rótulo por cima (botão, checkbox, switch) é <code>--primary</code>; cor que precisa ser vista contra a página (texto, ícone, traço fino ou com alfa) é <code>--primary-accent</code>. Hoje os dois coincidem com <code>--foreground</code>, e o papel não se funde por isso: <code>text-primary</code> segue proibido, porque dentro de uma tecla no escuro ele é branco sobre branco — use <code>text-primary-accent</code>.
      </DocNote>

      <DocNote title="O ladrilho --input reprova de propósito, pela segunda vez">
        O fio do campo quase não existe — 1,16:1 contra o fill no claro, 1,12 no escuro — e quem identifica o controle é o <strong>preenchimento</strong>, a <code>bg-input-fill/50</code>: 1,13 e 1,16 contra a página. É a conta da referência que o dono trouxe (o <code>border-beam</code> do 21st: 1,11 e 1,15). A 1.4.11 pede 3:1 e o conjunto não cumpre, por decisão. A saída está escrita no token (<code>oklch(0.62)</code> claro, <code>0.55</code> escuro), e quem a tomar mede contra <strong>três</strong> vizinhos — página, cartão e o próprio fill.
      </DocNote>

      <Group
        layout="flow"
        title="Status"
        description="Cada estado tem o par sólido (fundo colorido, texto claro), para preenchimento e ícone, e o tonal (fundo suave, texto escuro), para chip, badge e alerta."
      >
        <TokenGrid label="Sólido" meta="fundo colorido" columns={2}>
          <TokenTile
            name="Success"
            token="--success"
            onToken="--success-foreground"
            sample="Pago"
          />
          <TokenTile
            name="Warning"
            token="--warning"
            onToken="--warning-foreground"
            sample="Vence hoje"
          />
          <TokenTile name="Info" token="--info" onToken="--info-foreground" sample="Novo" />
          <TokenTile
            name="Destructive"
            token="--destructive"
            onToken="--destructive-foreground"
            sample="Atrasado"
          />
        </TokenGrid>

        <TokenGrid label="Tonal" meta="fundo suave" columns={2}>
          {/* A marca em tinta suave, neutra como o primário. Ela existe porque
              o `Badge tone="primary"` precisa de um par próprio, e não do
              `--info-muted` que ele chegou a renderizar. */}
          <TokenTile
            name="Primary muted"
            token="--primary-muted"
            onToken="--primary-muted-foreground"
            sample="2"
          />
          <TokenTile
            name="Success muted"
            token="--success-muted"
            onToken="--success-muted-foreground"
            sample="Pago"
          />
          <TokenTile
            name="Warning muted"
            token="--warning-muted"
            onToken="--warning-muted-foreground"
            sample="Vence hoje"
          />
          <TokenTile
            name="Info muted"
            token="--info-muted"
            onToken="--info-muted-foreground"
            sample="Novo"
          />
          <TokenTile
            name="Destructive muted"
            token="--destructive-muted"
            onToken="--destructive-muted-foreground"
            sample="Atrasado"
          />
        </TokenGrid>
      </Group>

      <Group
        layout="flow"
        title="Dinheiro"
        description="Receita e despesa não são success e destructive: compartilham o matiz, mas são mais saturadas. Num extrato, verde e vermelho são o dado, não um aviso — e é essa folga que impede o vermelho de falhou de passar o de saiu dinheiro."
      >
        <TokenGrid columns={2}>
          <TokenTile
            name="Income"
            token="--income"
            onToken="--income-foreground"
            sample="+ R$ 4.832,15"
          />
          <TokenTile
            name="Income muted"
            token="--income-muted"
            onToken="--income-muted-foreground"
            sample="+ R$ 4.832,15"
          />
          <TokenTile
            name="Expense"
            token="--expense"
            onToken="--expense-foreground"
            sample="− R$ 128,40"
          />
          <TokenTile
            name="Expense muted"
            token="--expense-muted"
            onToken="--expense-muted-foreground"
            sample="− R$ 128,40"
          />
        </TokenGrid>
      </Group>

      <Group
        layout="flow"
        title="Gráficos"
        description="--chart-1 a --chart-5 são neutras quanto a estado: só identificam séries, todas a 3:1 contra o cartão. Quando verde e vermelho significam entrada e saída, use --chart-income e --chart-expense."
      >
        <SpecimenPanel>
          <Ramp
            label="Rampa categórica"
            tokens={[
              { token: "--chart-1", name: "1" },
              { token: "--chart-2", name: "2" },
              { token: "--chart-3", name: "3" },
              { token: "--chart-4", name: "4" },
              { token: "--chart-5", name: "5" },
            ]}
          />
          <Ramp
            label="Séries com semântica"
            tokens={[
              { token: "--chart-income", name: "income" },
              { token: "--chart-expense", name: "expense" },
            ]}
          />
        </SpecimenPanel>

        <TokenGrid label="Rampa categórica">
          <TokenTile name="Chart 1" token="--chart-1" rule="ui" />
          <TokenTile name="Chart 2" token="--chart-2" rule="ui" />
          <TokenTile name="Chart 3" token="--chart-3" rule="ui" />
          <TokenTile name="Chart 4" token="--chart-4" rule="ui" />
          <TokenTile name="Chart 5" token="--chart-5" rule="ui" />
        </TokenGrid>

        <TokenGrid label="Séries com semântica" meta="fluxo de caixa">
          <TokenTile name="Chart income" token="--chart-income" rule="ui" />
          <TokenTile name="Chart expense" token="--chart-expense" rule="ui" />
        </TokenGrid>
      </Group>

      <DocNote title="A rampa não reusa cores de status — com uma exceção dita">
        Numa pizza, uma fatia azul leria como &ldquo;informação&rdquo; e uma vermelha como &ldquo;erro&rdquo;. As séries se separam por matiz e claridade juntos, medidos pela distância entre pares (ΔE, inclusive protanopia) e não só contra o fundo. A exceção é <code>--chart-1</code>, que divide o matiz 152 com <code>success</code> por decisão — em outra claridade, e mais longe da série 2 do que estava antes.
      </DocNote>

      <DocNote title="No escuro, a separação vence a faixa de claridade">
        Comprimir a claridade sobre fundo escuro tira o canal que separa magenta de ciano para quem não distingue vermelho de verde; a rampa escura fica acima da faixa, por decisão.
      </DocNote>

      <Group
        layout="flow"
        title="Identidade"
        description="Distinguem uma pessoa da outra e nada mais: seis cores chapadas, uma família cada, com as iniciais em tinta escura por cima. Uma receita só nos dois temas."
      >
        <SpecimenPanel>
          <IdentityDiscs
            label="O avatar"
            items={[
              { surface: "--identity-1", onToken: "--identity-foreground", initials: "AC" },
              { surface: "--identity-2", onToken: "--identity-foreground", initials: "BM" },
              { surface: "--identity-3", onToken: "--identity-foreground", initials: "KL" },
              { surface: "--identity-4", onToken: "--identity-foreground", initials: "RS" },
              { surface: "--identity-5", onToken: "--identity-foreground", initials: "TF" },
              { surface: "--identity-6", onToken: "--identity-foreground", initials: "VP" },
            ]}
          />
          {/* Sem grade de ladrilhos: `TokenTile` mede uma cor resolvida, e um
              degradê não é uma. O contraste das pontas está medido na página
              do avatar. */}
        </SpecimenPanel>
      </Group>

      <DocNote title="As seis cores">
        Ember, gold, grove, ocean, iris e bloom, em 0,84–0,88 de luminosidade e 0,10–0,12 de croma, com os matizes (58, 100, 175, 230, 275, 318) de 42° a 100° uns dos outros. <strong>Uma família por pessoa é uma inversão consciente</strong> da regra que dizia que ninguém é dono de uma cor. Como são cor chapada, entram no <code>@theme inline</code> e a tela escreve <code>bg-identity-N</code>. Contraste por <code>scripts/identity-contrast.mjs</code>, pior caso 10,17:1.
      </DocNote>

      <DocNote title="identityToneFor traduz a cor gravada">
        <code>identityToneFor</code> dobra as 17 classes de <code>profiles.avatar_color</code> nas seis identidades pela região do matiz, sem migração de dados.
      </DocNote>
    </>
  )
}
