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
 * A cor é a superfície desta página, não um chip dentro de uma linha.
 *
 * Cada token é um ladrilho da altura de um cartão, cortado ao meio entre os dois
 * temas, com o texto de exemplo grande o bastante para se julgar. Nome, token e
 * medição descem para uma legenda quieta. Antes era uma tabela de 46 linhas com
 * quadrados de 40px, e numa página chamada Cores a cor ocupava um oitavo da
 * largura enquanto o resto era metadado.
 *
 * Dois grupos abrem com um espécime maior, porque a grade não consegue dizer o
 * que eles dizem: as superfícies aninhadas (a hierarquia é o desenho) e a rampa
 * encostada (o teste é a distinção entre as faixas, e o olho só compara o que
 * está junto).
 */
export default function CoresDoc() {
  return (
    <>
      <Usage>
        Nenhuma cor é escolhida na tela: toda cor vem de um token semântico,
        escolhido pelo <strong>papel</strong>{" "}
        que ela cumpre e não pelo tom que tem. Casar por aparência é o que quebra
        o tema escuro.
      </Usage>

      <DocNote title="Como ler esta página">
        A página mostra o tema que está selecionado no alternador do cabeçalho —
        troque nele para ver o outro. O hexadecimal e a razão de contraste na
        legenda são os daquele tema, os dois calculados no navegador sobre a cor
        que ele realmente resolveu, nunca escritos à mão.
      </DocNote>

      <DocNote title="O hex é para levar a cor embora, não para editar o token">
        Os tokens são escritos em <code>oklch</code>{" "}
        e é assim que se mexe neles, em{" "}
        <code>globals.css</code>. O hex existe porque ninguém digita{" "}
        <code>oklch(0.42 0.12 166)</code>{" "}
        no Figma, no seletor de cor do sistema ou na paleta de um gráfico
        exportado. Ele é uma <strong>projeção em sRGB</strong>: num monitor P3 a
        tela mostra mais cor do que o número descreve. Token translúcido vem com
        a cor de base e o alpha atrás — <code>#FFFFFF 10%</code>{" "}
        é o que se copia; o composto, que é o que a tela mostra, está no
        ladrilho acima.
      </DocNote>

      <DocNote title="O que cada número mede">
        Quem <strong>sustenta texto</strong> aparece com o <code>Aa</code>{" "}
        em cima e é medido contra esse texto: <code>✓</code>{" "}
        passa em AA (4,5:1). Quem é <strong>peça sobre a superfície</strong>{" "}
        — anel de foco, contorno de campo, série de gráfico — é medido contra o
        cartão, pelos 3:1 da WCAG 1.4.11. O resto vem em cinza, sem veredito:
        medir não é reprovar.
      </DocNote>

      <DocNote title="O outro tema só aparece quando reprova">
        A medição roda nos dois temas mesmo com um só na tela. Se o token passa
        no que você está vendo mas <strong>falha no outro</strong>, uma marca
        âmbar com o nome do tema aparece ao lado do número — que é o defeito que
        ninguém acharia sem trocar de tema e comparar de memória. Quando o outro
        passa, nada aparece.
      </DocNote>

      <DocNote title="Os cinzas do claro são mais escuros do que parece necessário">
        <code>--secondary</code>, <code>--muted</code>, <code>--accent</code>{" "}
        e <code>--sidebar-accent</code>{" "}
        são o chão que fica <em>sobre</em> uma superfície: item ativo de
        navegação, hover de botão, pastilha de badge. No claro eles moram em
        0,93–0,94, e não nos 0,955–0,97 que a paleta de origem traz.
        <br />
        <br />O motivo é aritmético. A razão da WCAG é{" "}
        <code>(L1+0,05)/(L2+0,05)</code>. Perto do preto aquele{" "}
        <code>+0,05</code>{" "}
        domina o denominador e uma diferença pequena rende muito; perto do
        branco ele é ruído e a mesma diferença rende quase nada.{" "}
        <strong>O tema claro precisa de degraus maiores para parecer igual.</strong>{" "}
        Com os valores de origem, a página ativa do menu do app media{" "}
        <strong>1,00</strong>{" "}
        contra a lateral — literalmente a mesma cor, e só o peso da fonte
        marcava o estado. Hoje mede 1,18, que é o que o escuro sempre teve.
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

      <DocNote title="Popover tem a cor do card — o que separa os dois é a elevação">
        <code>--popover</code> e <code>--card</code>{" "}
        valem o mesmo nos dois temas — o espécime acima mostra três caixas e duas
        cores. Um popover não se destaca por ser mais claro, e sim por flutuar:{" "}
        <code>PopoverContent</code> carrega <code>shadow-md</code>{" "}
        e um anel. Os tokens seguem separados para poder divergir depois.
      </DocNote>

      <DocNote title="Por que --input não é mais igual a --border">
        Como contorno de campo, o cinza compartilhado media{" "}
        <strong>1,29:1</strong>{" "}
        — muito abaixo dos 3:1 da WCAG 1.4.11. Mas o token também era o
        preenchimento em <code>bg-input/30</code>, e escurecer estragaria os
        fills. Hoje <code>--input</code> é só a borda e <code>--input-fill</code>{" "}
        guarda o valor antigo. Os números acima medem isso ao vivo.
      </DocNote>

      <Group
        layout="flow"
        title="Status"
        description="Cada estado tem o par sólido (fundo colorido, texto claro) e o par tonal (fundo suave, texto escuro). O tonal é o de chip, badge e alerta; o sólido é para preenchimento e ícone."
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

      <DocNote title="Success e Info foram escurecidos">
        Antes davam <strong>3,44:1</strong> e <strong>3,58:1</strong>{" "}
        sobre cartão branco, e o texto branco do badge sólido sofria pelo outro
        lado — escurecer corrigiu os dois de uma vez. O âmbar do warning não
        escurece sem deixar de ser âmbar, então carrega cor de texto própria.
      </DocNote>

      <Group
        layout="flow"
        title="Dinheiro"
        description="Receita e despesa não são success e destructive. Compartilham o matiz, mas são mais saturadas de propósito: num extrato, verde e vermelho são o dado, não um aviso."
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
        description="Cinco séries que só se identificam, todas medidas em 3:1 ou mais contra a superfície do cartão. O que as separa é matiz e claridade juntos — matiz sozinho não separava, e a rampa reprovava por isso."
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

      <DocNote title="A rampa era as cores de status">
        <code>--chart-1</code> a <code>--chart-5</code> valiam{" "}
        <code>success</code>, <code>destructive</code>, <code>primary</code>,{" "}
        <code>info</code> e <code>warning</code>. Numa pizza de gastos, a fatia
        azul lia como &ldquo;informação&rdquo; e a vermelha como
        &ldquo;erro&rdquo; sem significar isso.
      </DocNote>

      <DocNote title="E depois ela dizia &ldquo;~60°&rdquo; sem ser verdade">
        A régua acima só mede contraste contra o fundo, e a rampa passava nela
        com folga enquanto reprovava no que importa numa rosca:{" "}
        <strong>a distância entre duas séries</strong>. Medidos, os intervalos
        entre os matizes ordenados eram <strong>111 · 39 · 57 · 68 · 85</strong>{" "}
        — <code>--chart-1</code> e <code>--chart-2</code> estavam a 39°, e por
        um validador de paleta (ΔE em OKLab ×100, todos os pares) a separação
        para protanopia entre <code>--chart-4</code> e <code>--chart-1</code>{" "}
        era <strong>4,9</strong>, contra um piso de 8. Depois do re-passo:{" "}
        <strong>8,8</strong> protanopia e <strong>16,8</strong> para visão
        normal, sem nenhum dos cinco perder os 3:1. A história inteira está em{" "}
        <a href="/designsystem/graficos" className="underline underline-offset-2">
          Gráficos
        </a>
        .
      </DocNote>

      <Group
        layout="flow"
        title="Identidade"
        description="Distinguem uma pessoa da outra e nada mais. Seis matizes a 60° de distância, com croma abaixo do menor croma de status. O par é invertido entre os temas: no escuro a pastilha é escura tingida com a tinta clara; no claro ela é preenchida com a cor e a tinta é quase branca."
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

      <DocNote title="Por que a superfície é opaca e não um alpha">
        Alpha só funciona enquanto nada passa por baixo. Em avatares que se
        sobrepõem, cada disco translúcido mostra o de baixo e as iniciais leem
        por cima da cor do outro. A superfície é a mesma mistura em{" "}
        <code>color-mix(in srgb, …)</code> — <code>srgb</code>{" "}
        porque é a conta que o browser faria.
      </DocNote>

      <DocNote title="Agora estes tokens são os dos avatares">
        Esta nota dizia que a troca precisava de migração de dados. Não
        precisava: <code>profiles.avatar_color</code>{" "}
        é gravado <strong>uma vez, por trigger no signup</strong>, sorteando
        entre 17 classes conhecidas, e nenhuma tela do app o atualiza. Valor
        conhecido não migra — se lê.{" "}
        <code>identityToneFor</code>{" "}
        dobra as 17 nas seis identidades pela região do círculo de matiz, então
        quem era avermelhado segue avermelhado, e o que estava guardado continua
        decidindo quem é quem. Só o desenho passou a ser de token.
      </DocNote>
    </>
  )
}
