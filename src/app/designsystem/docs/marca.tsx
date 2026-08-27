"use client"

import { AppLogo } from "@/components/layout/app-logo"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Separator } from "@/components/ui/separator"
import { Group, Spec, SpecimenPanel, Stack } from "../ds-kit"

/** Altura declarada, largura que sai do viewBox de 101/24. */
const ESCALA = [
  ["sm", "h-5", "20px", "84px", "faixa estreita — o cabeçalho do sheet no telefone"],
  ["md", "h-6", "24px", "101px", "o padrão: telas de auth, barra do catálogo"],
  ["lg", "h-8", "32px", "135px", "quando a marca é o assunto da superfície"],
  ["xl", "h-10 md:h-11", "40 → 44px", "168 → 185px", "a marca sozinha numa tela inteira — o splash"],
]

export default function MarcaDoc() {
  return (
    <>
      <Usage>
        Duas peças, e a escolha é pela forma do espaço: onde a marca tem uma
        linha para se apresentar, é o <strong>lockup</strong> (
        <code>AppWordmark</code>); onde ela tem só um quadrado, é o{" "}
        <strong>símbolo</strong> (<code>AppLogo</code>). Não existe uma terceira
        montagem — símbolo mais o nome escrito ao lado é o que o lockup já é.
      </Usage>

      <Group title="As duas peças" layout="grid">
        <Spec title="Lockup" meta="AppWordmark">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <AppWordmark size="lg" />
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Símbolo e nome no mesmo traçado — o &ldquo;f&rdquo; do símbolo{" "}
              <em>é</em> a inicial da palavra. Proporção 101/24, dimensionada por
              altura. Onde aparece: login, cadastro, recuperação de senha, o
              splash de carregamento e a barra deste catálogo.
            </p>
          </Stack>
        </Spec>

        <Spec title="Símbolo" meta="AppLogo">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <AppLogo size="md" />
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O mesmo &ldquo;f&rdquo;, sozinho, num quadrado de 32. É o que cabe
              onde não há linha: favicon, ícone de PWA, o badge de uma
              notificação, um avatar. Ele é sempre{" "}
              <code>aria-hidden</code> — decoração ao lado de um texto que já
              nomeia o produto.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Cor"
        description="O desenho não carrega cor: os dois ativos são fill=&quot;currentColor&quot;, e quem decide é a classe. Verde de marca no tema claro, branco no escuro — a mesma linha nas duas peças."
        code={`// Já embutido nos dois componentes:
"text-primary-accent dark:text-foreground"`}
        previewClassName="flex-col items-stretch gap-4 md:flex-row"
      >
        <SpecimenPanel surface="background" className="flex-1 items-start">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            sobre background
          </span>
          <AppWordmark size="lg" />
        </SpecimenPanel>
        <SpecimenPanel surface="card" className="flex-1 items-start">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            sobre card
          </span>
          <AppWordmark size="lg" />
        </SpecimenPanel>
      </DocSection>

      <DocNote title="É --primary-accent, e não --primary">
        <p>
          O verde da marca tem dois tokens, e o papel decide qual.{" "}
          <code>--primary</code> <strong>preenche</strong> — é medido contra o
          texto claro que fica em cima dele. A marca é <strong>traço</strong>:
          ela mesma precisa ser enxergada contra a página, que é o que{" "}
          <code>--primary-accent</code> garante no tema escuro. No claro os dois
          são a mesma cor; usar <code>--primary</code> aqui só quebraria à noite.
        </p>
      </DocNote>

      <DocSection
        title="Escala"
        description="A escala do lockup é por altura, e a largura vem sozinha do viewBox. w-auto está embutido justamente para um w-full herdado não esticar a marca."
        previewClassName="flex-col items-stretch gap-4"
      >
        <Stack className="gap-4">
          {ESCALA.map(([size, cls, altura, largura, uso]) => (
            <div key={size} className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {/* Caixa de largura fixa: sem ela cada degrau começa a coluna de
                  código num x diferente, e a tabela deixa de ler como tabela. */}
              <span className="flex w-52 shrink-0 items-center">
                <AppWordmark
                  size={size as "sm" | "md" | "lg" | "xl"}
                  aria-hidden
                />
              </span>
              <code className="w-24 shrink-0 font-mono text-2xs text-foreground">
                size=&quot;{size}&quot;
              </code>
              <code className="w-24 shrink-0 font-mono text-2xs text-muted-foreground">
                {cls}
              </code>
              <span className="nums w-24 shrink-0 text-2xs text-muted-foreground">
                {altura} · {largura}
              </span>
              <span className="text-xs text-muted-foreground">{uso}</span>
            </div>
          ))}
        </Stack>
      </DocSection>

      <DocSection
        title="Em uso"
        description="O lockup é o nome, então por padrão ele se anuncia: role=&quot;img&quot; com aria-label=&quot;Finance&quot;. Passe aria-hidden quando o nome já estiver dito ao lado — e aí o rótulo visível carrega a expansão em sr-only, porque uma sigla sozinha não diz nada em voz alta."
        code={`// A marca se apresentando sozinha — ela é o texto acessível
<AppWordmark />

// Assinatura de seção: marca, fio, sigla na serifa da marca
<Link href="/designsystem">
  <AppWordmark className="shrink-0" aria-hidden />
  <Separator orientation="vertical" />
  <span className="font-display text-lg leading-none">DS</span>
  <span className="sr-only">Design system</span>
</Link>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <SpecimenPanel surface="background">
          <AppWordmark />
        </SpecimenPanel>
        <SpecimenPanel surface="background">
          <span className="flex items-center gap-2.5">
            <AppWordmark className="shrink-0" aria-hidden />
            <Separator orientation="vertical" />
            <span className="font-display text-lg leading-none text-foreground">
              DS
            </span>
          </span>
        </SpecimenPanel>
      </DocSection>

      <DocNote title="A sigla vem na serifa, e é a terceira exceção">
        <p>
          A fundação de tipografia reserva a Ledger para o título de tela e o
          nome escrito, e pede <strong>nada abaixo de 24px</strong>. O
          &ldquo;DS&rdquo; do cabeçalho deste catálogo abre a exceção a 18px, e
          o motivo é o vizinho: em <code>font-heading</code> a sigla lia como
          legenda pregada na marca, e na mesma serifa do lockup as duas viram
          uma assinatura só. Duas maiúsculas também não são texto — não há
          descendente para se perder nem palavra para soletrar no corpo pequeno,
          que é do que a regra dos 24px protege.
        </p>
      </DocNote>

      <DocSection
        title="O nome como texto"
        description="Onde não cabe SVG — o assunto de um e-mail, um título de janela, um texto puro — o nome se escreve com .wordmark: Ledger, o mesmo corpo de display do título de tela. É a única forma escrita autorizada do nome, e ela existe justamente para ninguém improvisar Inter seminegrito ao lado da arte."
        code={`<span className="wordmark text-lg">Finance</span>`}
      >
        <span className="wordmark text-lg text-foreground">Finance</span>
      </DocSection>

      <DocNote title="O que não fazer">
        <p>
          Recolorir o lockup (a cor já responde ao tema; qualquer{" "}
          <code>text-*</code> por cima o desalinha do símbolo). Colar o{" "}
          <code>AppLogo</code>{" "}ao lado dele — seria escrever a inicial duas
          vezes. Escrever &ldquo;Finance&rdquo; em Inter ao lado da arte, que é a
          montagem que o lockup veio substituir. Declarar{" "}
          <code>width</code> junto de <code>height</code>: a proporção é do
          traçado, não da tela.
        </p>
      </DocNote>
    </>
  )
}
