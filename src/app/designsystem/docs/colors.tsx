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
        A página mostra o tema do alternador; hex e contraste são calculados no navegador. Quem sustenta texto (<code>Aa</code>) é medido contra ele — <code>✓</code> é AA, 4,5:1; peça sobre superfície (anel, contorno, série) é medida contra o cartão pelos 3:1 da WCAG 1.4.11. Uma marca âmbar avisa quando o token falha só no outro tema.
      </DocNote>

      <DocNote title="Edite em oklch; o hex é para levar a cor embora">
        Os tokens se editam em <code>oklch</code>, em <code>globals.css</code>. O hex é projeção em sRGB para ferramentas externas; token translúcido vem como base mais alpha (<code>#FFFFFF 10%</code>).
      </DocNote>

      <DocNote title="No claro, os chãos sobre superfície ficam em 0,93–0,94">
        <code>--secondary</code>, <code>--muted</code>, <code>--accent</code> e <code>--sidebar-accent</code> (item ativo, hover, pastilha) precisam de degraus maiores no claro: perto do branco a razão da WCAG rende pouco, e com valores mais claros o item ativo empata com a lateral.
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

        <TokenGrid label="Marca e foco">
          <TokenTile name="Primary" token="--primary" onToken="--primary-foreground" />
          {/* O realce e a aresta da tecla. O hover é opaco e escurece nos dois
              temas — o rótulo em cima dele passa de 7,31 para 9,01 no claro. */}
          <TokenTile name="Primary (hover)" token="--primary-hover" onToken="--primary-foreground" />
          <TokenTile name="Primary (aresta)" token="--primary-edge" onToken="--primary-foreground" />
          {/* Dois papéis do mesmo verde. `--primary` preenche e por isso é
              medido contra o texto que fica em cima; `--primary-accent` é
              texto e por isso é medido contra o cartão que fica embaixo. No
              tema claro os dois são a mesma cor — a divisão só existe no
              escuro, onde nenhum valor único atende os dois. Até esta rodada a
              página só media o primeiro, e por isso não viu quando o segundo
              caiu para 2,8:1. */}
          <TokenTile name="Primary (texto)" token="--primary-accent" rule="text" />
          <TokenTile name="Ring (foco)" token="--ring" rule="ui" />
          {/* `--input` foi igualado a `--border` a pedido: o contorno do campo
              agora é o mesmo do cartão, e o campo ganhou preenchimento nos dois
              temas em vez de só no escuro.
              O ladrilho abaixo continua com `rule="ui"` de propósito, e por
              isso aparece em vermelho: a 1.4.11 pede 3:1 para o que identifica
              uma peça acionável, e 1,3:1 não cumpre. Silenciar a régua
              esconderia a decisão; deixá-la acesa a mantém à vista de quem
              abrir a página. Antes `--input` valia `oklch(0.66)` — 3,11:1, no
              piso da norma — porque no tema claro o campo era transparente e a
              borda identificava o controle sozinha. */}
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

      <DocNote title="Popover tem a cor do card; o que os separa é a elevação">
        <code>--popover</code> e <code>--card</code> valem o mesmo nos dois temas: o popover se destaca pela sombra e pelo anel, não por ser mais claro.
      </DocNote>

      <DocNote title="--primary preenche; --primary-accent é marca sobre o fundo">
        Cor que carrega texto claro por cima (botão, checkbox, switch) é <code>--primary</code>; cor que precisa ser vista contra a página (texto, ícone, traço fino ou com alfa) é <code>--primary-accent</code>. No escuro nenhum valor atende os dois, por isso <code>text-primary</code> é proibido — compila e some no escuro: use <code>text-primary-accent</code>.
      </DocNote>

      <DocNote title="O ladrilho --input reprova de propósito">
        <code>--input</code> vale o mesmo que <code>--border</code>, e o campo se identifica pelo preenchimento (<code>bg-input-fill/30</code>). O conjunto fica abaixo dos 3:1 da 1.4.11, e o ladrilho mantém a régua acesa para a decisão ficar visível.
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
          {/* A marca em tinta suave. Ela não existia, e a consequência era o
              `Badge variant="primary"` renderizar `--info-muted` — azul — num
              sistema onde `primary` é o verde em todo o resto. */}
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
        description="Receita e despesa não são success e destructive: compartilham o matiz, mas são mais saturadas. Num extrato, verde e vermelho são o dado, não um aviso."
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

      <DocNote title="A rampa não reusa cores de status">
        Numa pizza, uma fatia azul leria como &ldquo;informação&rdquo; e uma vermelha como &ldquo;erro&rdquo;. As séries se separam por matiz e claridade juntos, medidos pela distância entre pares (ΔE, inclusive protanopia) e não só contra o fundo.
      </DocNote>

      <DocNote title="No escuro, a separação vence a faixa de claridade">
        Comprimir a claridade sobre fundo escuro tira o canal que separa magenta de ciano para quem não distingue vermelho de verde; a rampa escura fica acima da faixa, por decisão.
      </DocNote>

      <Group
        layout="flow"
        title="Identidade"
        description="Distinguem uma pessoa da outra e nada mais: seis matizes, com croma abaixo do de status. O par inverte entre os temas — pastilha escura com tinta clara no escuro, pastilha na cor com tinta quase branca no claro."
      >
        <SpecimenPanel>
          <IdentityDiscs
            label="O avatar"
            items={[
              { surface: "--identity-1-surface", onToken: "--identity-1", initials: "AC" },
              { surface: "--identity-2-surface", onToken: "--identity-2", initials: "BM" },
              { surface: "--identity-3-surface", onToken: "--identity-3", initials: "KL" },
              { surface: "--identity-4-surface", onToken: "--identity-4", initials: "RS" },
              { surface: "--identity-5-surface", onToken: "--identity-5", initials: "TF" },
              { surface: "--identity-6-surface", onToken: "--identity-6", initials: "VP" },
            ]}
          />
          {/* Havia aqui uma rampa "Os matizes" apontando para `--identity-1..6`, e
              ela **deixou de ter significado** quando o par passou a inverter no
              tema claro: ali aquele token é a tinta quase branca, e a rampa saía
              como seis barras brancas.

              O custo está dito em vez de escondido: **não existe mais um token
              único que seja "o matiz" nos dois temas** — no escuro ele é
              `--identity-N`, no claro é `--identity-N-surface`. Um espécime que
              só funciona num tema é pior que espécime nenhum, e os discos acima
              já mostram as seis identidades como elas de fato renderizam. */}
        </SpecimenPanel>

        <TokenGrid label="Superfícies opacas" meta="a cor no claro, 18% dela no escuro">
          <TokenTile name="Identidade 1" token="--identity-1-surface" onToken="--identity-1" sample="AC" />
          <TokenTile name="Identidade 2" token="--identity-2-surface" onToken="--identity-2" sample="BM" />
          <TokenTile name="Identidade 3" token="--identity-3-surface" onToken="--identity-3" sample="KL" />
          <TokenTile name="Identidade 4" token="--identity-4-surface" onToken="--identity-4" sample="RS" />
          <TokenTile name="Identidade 5" token="--identity-5-surface" onToken="--identity-5" sample="TF" />
          <TokenTile name="Identidade 6" token="--identity-6-surface" onToken="--identity-6" sample="VP" />
        </TokenGrid>
      </Group>

      <DocNote title="A superfície de identidade é opaca">
        Avatares se sobrepõem, e um disco translúcido mostraria o de baixo sob as iniciais.
      </DocNote>

      <DocNote title="identityToneFor traduz a cor gravada">
        <code>identityToneFor</code> dobra as 17 classes de <code>profiles.avatar_color</code> nas seis identidades pela região do matiz, sem migração de dados.
      </DocNote>
    </>
  )
}
