"use client"

import { DocNote, Usage } from "../ds-doc"
import { Group, Spec, TokenSwatch } from "../ds-kit"

/**
 * Cada amostra aparece nos dois temas de uma vez, e a pílula ao lado é a razão
 * de contraste medida no browser. Verde passa AA para texto (4.5:1), âmbar não.
 */
export default function CoresDoc() {
  return (
    <>
      <Usage>
        Nenhuma cor é escolhida na tela. Toda cor vem de um token semântico,
        escolhido pelo <strong>papel</strong>{" "}
        que ela cumpre e não pelo tom que
        ela tem. Um cinza de texto secundário é{" "}
        <code>text-muted-foreground</code>{" "}
        mesmo que o valor exato não bata:
        casar por aparência é o que produz telas que quebram no tema escuro.
      </Usage>

      <DocNote title="Como ler as amostras">
        Cada amostra aparece nos <strong>dois temas</strong> lado a lado: a
        metade esquerda é o claro, a direita é o escuro. As duas pílulas à
        direita são a razão de <strong>contraste</strong> daquele par, medida no
        navegador sobre a cor que ele realmente resolveu — não um número escrito
        à mão que envelhece quando o token muda. <code>✓</code> passa em AA para
        texto (4,5:1); <code>!</code> não passa.
      </DocNote>

      <Group
        title="Superfícies"
        description="Do fundo da página ao popover. A hierarquia é background → card → popover: cada degrau se apoia no anterior."
      >
        <Spec title="Base" meta="globals.css">
          <TokenSwatch name="Background" token="--background" onToken="--foreground" />
          <TokenSwatch name="Card" token="--card" onToken="--card-foreground" />
          <TokenSwatch name="Popover" token="--popover" onToken="--popover-foreground" />
          <TokenSwatch name="Muted" token="--muted" onToken="--muted-foreground" />
          <TokenSwatch name="Accent" token="--accent" onToken="--accent-foreground" />
          <TokenSwatch name="Secondary" token="--secondary" onToken="--secondary-foreground" />
        </Spec>

        <Spec title="Marca e foco">
          <TokenSwatch name="Primary" token="--primary" onToken="--primary-foreground" />
          <TokenSwatch name="Ring (foco)" token="--ring" />
          <TokenSwatch name="Border" token="--border" />
          <TokenSwatch name="Input (borda do campo)" token="--input" />
          <TokenSwatch name="Skeleton" token="--skeleton" />
          <TokenSwatch name="Overlay" token="--overlay" />
        </Spec>

        <Spec title="Sidebar">
          <TokenSwatch name="Sidebar" token="--sidebar" onToken="--sidebar-foreground" />
          <TokenSwatch
            name="Item ativo"
            token="--sidebar-primary"
            onToken="--sidebar-primary-foreground"
          />
          <TokenSwatch
            name="Item em hover"
            token="--sidebar-accent"
            onToken="--sidebar-accent-foreground"
          />
        </Spec>
      </Group>

      <DocNote title="Por que --input não é mais igual a --border">
        Os dois valiam o mesmo cinza, e como contorno de campo ele media{" "}
        <strong>1,29:1</strong>{" "}
        contra o fundo — muito abaixo dos 3:1 que a WCAG
        1.4.11 pede para o contorno de um controle. Mas o token acumulava dois
        papéis: também era o preenchimento em <code>bg-input/30</code>{" "}
        no tema
        escuro e nos campos desabilitados. Escurecer resolveria a borda e
        estragaria os fills. Hoje <code>--input</code>{" "}
        é só a borda, com 3:1
        medido, e <code>--input-fill</code> guarda o valor antigo intacto.
      </DocNote>

      <Group
        title="Status"
        description="Quatro estados, cada um com o par sólido (fundo colorido, texto claro) e o par tonal (fundo suave, texto escuro). O tonal é o que se usa em chip, badge e alerta; o sólido é para preenchimento e ícone."
      >
        <Spec title="Sólido" meta="fundo colorido">
          <TokenSwatch name="Success" token="--success" onToken="--success-foreground" />
          <TokenSwatch name="Warning" token="--warning" onToken="--warning-foreground" />
          <TokenSwatch name="Info" token="--info" onToken="--info-foreground" />
          <TokenSwatch
            name="Destructive"
            token="--destructive"
            onToken="--destructive-foreground"
          />
        </Spec>

        <Spec title="Tonal" meta="fundo suave">
          <TokenSwatch
            name="Success muted"
            token="--success-muted"
            onToken="--success-muted-foreground"
          />
          <TokenSwatch
            name="Warning muted"
            token="--warning-muted"
            onToken="--warning-muted-foreground"
          />
          <TokenSwatch
            name="Info muted"
            token="--info-muted"
            onToken="--info-muted-foreground"
          />
          <TokenSwatch
            name="Destructive muted"
            token="--destructive-muted"
            onToken="--destructive-muted-foreground"
          />
        </Spec>
      </Group>

      <DocNote title="Success e Info foram escurecidos">
        No valor anterior, <code>text-success</code> sobre um cartão branco dava{" "}
        <strong>3,44:1</strong> e <code>text-info</code> dava{" "}
        <strong>3,58:1</strong>{" "}
        — os dois abaixo de AA. E como o texto branco de
        um badge sólido enfrenta o mesmo problema pelo outro lado, escurecer
        corrigiu os dois de uma vez: hoje ambos medem 4,5:1 nas duas direções. O
        âmbar do warning não pode ser escurecido sem deixar de ser âmbar, então
        ele mantém o tom vivo para ícone e preenchimento e carrega uma cor de
        texto separada.
      </DocNote>

      <Group
        title="Dinheiro"
        description="Receita e despesa não são success e destructive. Compartilham o matiz, mas são mais saturadas de propósito: num extrato, verde e vermelho são o dado, não um aviso."
      >
        <Spec title="Receita e despesa">
          <TokenSwatch name="Income" token="--income" onToken="--income-foreground" />
          <TokenSwatch
            name="Income muted"
            token="--income-muted"
            onToken="--income-muted-foreground"
          />
          <TokenSwatch name="Expense" token="--expense" onToken="--expense-foreground" />
          <TokenSwatch
            name="Expense muted"
            token="--expense-muted"
            onToken="--expense-muted-foreground"
          />
        </Spec>
      </Group>

      <Group
        title="Gráficos"
        description="A rampa categórica: cinco matizes a cerca de 60° de distância, todos medidos em 3:1 ou mais contra a superfície do cartão. A claridade varia junto com o matiz para as séries não dependerem só de cor."
      >
        <Spec title="Rampa categórica">
          <TokenSwatch name="Chart 1" token="--chart-1" />
          <TokenSwatch name="Chart 2" token="--chart-2" />
          <TokenSwatch name="Chart 3" token="--chart-3" />
          <TokenSwatch name="Chart 4" token="--chart-4" />
          <TokenSwatch name="Chart 5" token="--chart-5" />
        </Spec>

        <Spec title="Séries com semântica" meta="fluxo de caixa">
          <TokenSwatch name="Chart income" token="--chart-income" />
          <TokenSwatch name="Chart expense" token="--chart-expense" />
        </Spec>
      </Group>

      <DocNote title="A rampa era as cores de status">
        <code>--chart-1</code> a <code>--chart-5</code> valiam literalmente{" "}
        <code>success</code>, <code>destructive</code>, <code>primary</code>,{" "}
        <code>info</code> e <code>warning</code>. Numa pizza de categorias de
        gasto, a fatia azul lia como &ldquo;informação&rdquo; e a vermelha como
        &ldquo;erro&rdquo;, sem nenhuma das duas significar isso. Agora a rampa é
        neutra quanto a estado, e quando verde e vermelho realmente significam
        entrada e saída a série usa <code>--chart-income</code> e{" "}
        <code>--chart-expense</code>.
      </DocNote>

      <Group
        title="Identidade"
        description="Distinguem uma pessoa da outra e nada mais. Seis matizes a 60° de distância, todos com croma 0,09 — abaixo do menor croma de status. Um avatar nunca é confundido com um estado."
      >
        <Spec title="Tons">
          <TokenSwatch name="Identity 1" token="--identity-1" />
          <TokenSwatch name="Identity 2" token="--identity-2" />
          <TokenSwatch name="Identity 3" token="--identity-3" />
          <TokenSwatch name="Identity 4" token="--identity-4" />
          <TokenSwatch name="Identity 5" token="--identity-5" />
          <TokenSwatch name="Identity 6" token="--identity-6" />
        </Spec>

        <Spec title="Superfícies opacas" meta="12% no claro, 18% no escuro">
          <TokenSwatch name="1" token="--identity-1-surface" onToken="--identity-1" />
          <TokenSwatch name="2" token="--identity-2-surface" onToken="--identity-2" />
          <TokenSwatch name="3" token="--identity-3-surface" onToken="--identity-3" />
          <TokenSwatch name="4" token="--identity-4-surface" onToken="--identity-4" />
          <TokenSwatch name="5" token="--identity-5-surface" onToken="--identity-5" />
          <TokenSwatch name="6" token="--identity-6-surface" onToken="--identity-6" />
        </Spec>
      </Group>

      <DocNote title="Por que a superfície é opaca e não um alpha">
        Alpha só funciona enquanto nada passa por baixo. Em avatares que se
        sobrepõem de propósito, cada disco translúcido mostra o de baixo através
        de si, e as iniciais de um leem por cima da cor do outro. A superfície é
        a mesma mistura, calculada com <code>color-mix(in srgb, …)</code> — em{" "}
        <code>srgb</code> e não em <code>oklab</code>{" "}
        porque é a mesma conta que
        o browser faria ao compor a cor sobre um fundo opaco, então o tom na tela
        não muda um passo sequer.
      </DocNote>

      <DocNote title="Estes tokens ainda não são os dos avatares">
        <code>src/lib/avatar.ts</code>{" "}
        continua com a paleta crua do Tailwind, e
        migrá-la não é só trocar classes: a cor escolhida por cada pessoa fica
        gravada em <code>profiles.avatar_color</code>{" "}
        como string de classe, e o
        banco tem <code>&apos;bg-sky-500&apos;</code>{" "}
        escrito como padrão dentro
        de <code>workspace_member_directory</code>. A troca precisa de migração
        de dados, então está no relatório de conformidade e não aqui.
      </DocNote>
    </>
  )
}
