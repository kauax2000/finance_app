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

export default function BrandDoc() {
  return (
    <>
      <Usage>
        Duas peças, escolhidas pela forma do espaço: numa linha, o <strong>lockup</strong> (<code>AppWordmark</code>); num quadrado, o <strong>símbolo</strong> (<code>AppLogo</code>). Não há terceira montagem — símbolo com o nome ao lado é o que o lockup já é.
      </Usage>

      <Group title="As duas peças" layout="grid">
        <Spec title="Lockup" meta="AppWordmark">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <AppWordmark size="lg" />
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Símbolo e nome no mesmo traçado, proporção 101/24, dimensionado por altura. Vai no login, no cadastro, na recuperação de senha, no splash e na barra deste catálogo.
            </p>
          </Stack>
        </Spec>

        <Spec title="Símbolo" meta="AppLogo">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <AppLogo size="md" />
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O mesmo &ldquo;f&rdquo;, sozinho, num quadrado de 32: favicon, ícone de PWA, badge de notificação, avatar. Sempre <code>aria-hidden</code>, ao lado de um texto que já nomeia o produto.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Cor"
        description="O desenho não carrega cor: os dois ativos são fill=&quot;currentColor&quot;, e a classe decide — verde de marca no claro, branco no escuro."
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
          <code>--primary</code> preenche e é medido contra o texto em cima dele; a marca é traço e precisa ser vista contra a página, que é o que <code>--primary-accent</code> garante no escuro. No claro são a mesma cor, então o erro só aparece à noite.
        </p>
      </DocNote>

      <DocSection
        title="Escala"
        description="A escala do lockup é por altura; a largura vem do viewBox, e o w-auto embutido impede um w-full herdado de esticar a marca."
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
        description="O lockup se anuncia: role=&quot;img&quot; com aria-label=&quot;Finance&quot;. Quando o nome já está dito ao lado, passe aria-hidden — e se o rótulo for uma sigla, ele leva a expansão em sr-only."
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

      <DocNote title="A sigla do catálogo usa a serifa abaixo de 24px">
        <p>
          A Ledger não desce abaixo de 24px, e o &ldquo;DS&rdquo; do cabeçalho deste catálogo abre exceção a 18px: na mesma serifa do lockup, sigla e marca leem como uma assinatura só. Duas maiúsculas não têm descendente nem palavra para se perder, que é o que a regra protege.
        </p>
      </DocNote>

      <DocSection
        title="O nome como texto"
        description="Onde não cabe SVG — assunto de e-mail, título de janela, texto puro — o nome se escreve com .wordmark: Ledger, no corpo de display. É a única forma escrita do nome; não improvise Inter ao lado da arte."
        code={`<span className="wordmark text-lg">Finance</span>`}
      >
        <span className="wordmark text-lg text-foreground">Finance</span>
      </DocSection>

      <DocSection
        title="O campo de marca"
        description="O verde ocupando uma região inteira, e não um controle. A @utility brand-field carrega o material — vinheta e grão — e inverte a paleta local, então quem entra nela chega com a tinta certa sem declarar cor nenhuma."
        code={`// A casca das telas de acesso
<aside className="brand-field flex flex-col px-10 py-12">
  <AppWordmark className="self-start text-primary-foreground" />
  {/* Item, MoneyDisplay, Muted e Caption não declaram cor:
      a utility redefine --foreground e --muted-foreground */}
</aside>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="brand-field flex min-h-40 flex-col justify-between rounded-xl p-6">
          <AppWordmark className="self-start text-primary-foreground" />
          <div>
            <p className="text-sm text-foreground">Carteira</p>
            <p className="text-sm text-muted-foreground">saldo deste mês</p>
          </div>
        </div>
      </DocSection>

      <DocNote title="Por que a utility redefine tokens em vez de pintar os filhos">
        <p>
          A superfície é <strong>invertida</strong>. Sem os quatro tokens locais,
          todo componente do sistema chega com a tinta do tema:{" "}
          <code>ItemDescription</code> é <code>Muted</code>, ou seja cinza, e{" "}
          <code>MoneyDisplay tone=&quot;default&quot;</code> é quase preto no tema
          claro. Os dois somem sobre o verde, e o conserto por fora seria um{" "}
          <code>text-primary-foreground</code> repetido em cada filho — a tela
          reimportando a paleta, uma classe por vez.
        </p>
        <p>
          O texto secundário é <code>--brand-field-muted-foreground</code>, um
          verde pálido, e não branco com alfa: sobre o <code>--primary</code> do
          tema escuro o <strong>branco puro</strong> só alcança 5,22:1, então
          qualquer alfa que devolva os 4,5:1 da norma fica em ~92% — e a 92% o
          secundário é indistinguível do título. A hierarquia morria para a norma
          sobreviver.
        </p>
      </DocNote>

      <DocNote title="Os números do grão são medidos">
        <p>
          <code>overlay</code> foi comparado com <code>soft-light</code>,{" "}
          <code>multiply</code> e com pintar o ruído direto: ele rende mais
          textura por unidade de desvio de cor. O <code>feComponentTransfer</code>{" "}
          com <code>slope</code> 0,6 existe porque <code>feTurbulence</code> em
          amplitude cheia, sob <code>overlay</code> numa base escura, clareava o
          painel em 10 unidades de luminância — exatamente a folga de contraste
          do tema escuro.
        </p>
        <p>
          O alfa é diferente por tema (60% no claro, 45% no escuro) porque a base
          é: 0,42 e 0,50. A amplitude foi medida na captura real, não em modelo,
          como desvio-padrão de luminância num retalho sem texto, com a versão
          antiga e a nova no mesmo retalho — os números e a fórmula estão no
          comentário do token, em <code>globals.css</code>. Eles moram só lá:{" "}
          <strong>σ sem método não compara</strong>, e duas casas para o mesmo
          número já tinham divergido uma vez.
        </p>
      </DocNote>

      <DocNote title="O que não fazer">
        <p>
          Recolorir o lockup: a cor já responde ao tema. Colar o <code>AppLogo</code> ao lado dele, escrevendo a inicial duas vezes. Escrever &ldquo;Finance&rdquo; em Inter ao lado da arte. Declarar <code>width</code> junto de <code>height</code>: a proporção é do traçado.
        </p>
      </DocNote>
    </>
  )
}
