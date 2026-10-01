"use client"

import { HomeIcon } from "@heroicons/react/16/solid"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSwitcher,
  BreadcrumbSwitcherItem,
} from "@/components/ui/breadcrumb"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function BreadcrumbDoc() {
  return (
    <>
      <Usage>
        A trilha até onde a pessoa está, para telas abaixo do primeiro nível.
        Numa tela de primeiro nível, uma trilha de um item só é ruído. A barra
        do app a usa nas subpáginas (Minha conta › Sessões ativas, Cartões ›
        Detalhes do cartão).
      </Usage>

      <DocSection
        title="Padrão"
        description="A lista recebe só itens e põe os separadores. O último é BreadcrumbPage, não link: é a página atual."
        code={`<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/categories">Categorias</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbItem><BreadcrumbPage>Mercado</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}
        previewClassName="items-start"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Categorias</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Mercado</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="Com ícone"
        description="icon põe o ícone antes do rótulo. Sem rótulo, o degrau é só o ícone — a casa de “Início” — e o nome vai em aria-label."
        code={`<BreadcrumbLink href="/" icon={<HomeIcon />} aria-label="Início" />`}
        previewClassName="items-start"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" icon={<HomeIcon />} aria-label="Início" />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Categorias</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Mercado</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="Trilha longa"
        description="Passando de maxItems ficam a raiz e os dois últimos degraus, e o miolo vira um menu — o que dobrou continua alcançável."
        code={`<BreadcrumbList maxItems={4}>
  <BreadcrumbItem><BreadcrumbLink href="/">Início</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="/credit-cards">Cartões</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="/credit-cards/nubank">Nubank</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbLink href="…">Faturas</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbItem><BreadcrumbPage>Março de 2026</BreadcrumbPage></BreadcrumbItem>
</BreadcrumbList>`}
        previewClassName="items-start"
      >
        <Breadcrumb className="w-full">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cartões</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Nubank</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Faturas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Março de 2026</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="Rótulo longo"
        description="Para nome grande, os ancestrais truncam e a página atual é a última a ceder: cede o caminho, nunca o destino."
        code={`{/* a 240px de largura, com a trilha inteira dentro do limite */}`}
        previewClassName="items-start"
      >
        <div className="w-60 max-w-full rounded-lg border border-dashed border-border p-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Cartões de crédito</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Nubank Ultravioleta</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </DocSection>

      <DocSection
        title="Tamanho e separador"
        description="sm quando a trilha divide a linha com outra coisa: encolhe o texto, o chevron e as reticências juntos. separator escolhe o desenho por nome — chevron (o padrão), slash ou dot —, uma vez para a lista toda."
        code={`<BreadcrumbList size="sm" separator="slash">…</BreadcrumbList>`}
        previewClassName="flex-col items-start gap-3"
      >
        {([
          ["md", "chevron"],
          ["sm", "chevron"],
          ["md", "slash"],
          ["md", "dot"],
        ] as const).map(([tamanho, sep]) => (
          <div key={tamanho + sep} className="flex items-center gap-4">
            <Caption className="w-28 font-mono">
              {tamanho} · {sep}
            </Caption>
            <Breadcrumb>
              <BreadcrumbList size={tamanho} separator={sep}>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Assinaturas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Streaming</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Spotify</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Trocar de irmão"
        description="BreadcrumbSwitcher é a página atual com um menu dos irmãos: “Cartões › Nubank ▾” troca de cartão sem voltar à lista. O gatilho tem a tinta e o peso da página atual e aria-current; a escolhida leva o tique."
        code={`<BreadcrumbItem>
  <BreadcrumbSwitcher
    label="Trocar de cartão"
    items={cartoes.map((c) => (
      <BreadcrumbSwitcherItem key={c.id} asChild current={c.id === atual}>
        <Link href={\`/credit-cards/\${c.id}\`}>{c.nome}</Link>
      </BreadcrumbSwitcherItem>
    ))}
  >
    Nubank
  </BreadcrumbSwitcher>
</BreadcrumbItem>`}
        previewClassName="items-start"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cartões</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbSwitcher
                label="Trocar de cartão"
                items={["Nubank", "Inter", "C6 Bank"].map((nome) => (
                  <BreadcrumbSwitcherItem key={nome} asChild current={nome === "Nubank"}>
                    <a href="#">{nome}</a>
                  </BreadcrumbSwitcherItem>
                ))}
              >
                Nubank
              </BreadcrumbSwitcher>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocSection
        title="No telefone, voltar"
        description="collapse=&quot;back&quot;: abaixo de sm a trilha vira um só “‹ Pai” — o link do degrau de cima —, em vez de truncar; acima, a trilha inteira. A página atual já é o título logo abaixo. Estreite a janela para ver."
        code={`<BreadcrumbList collapse="back">…</BreadcrumbList>`}
        previewClassName="items-start"
      >
        <Breadcrumb>
          <BreadcrumbList collapse="back">
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Minha conta</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Segurança</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Sessões ativas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DocSection>

      <DocNote title="A lista é dona dos separadores">
        Não escreva <code>&lt;BreadcrumbSeparator /&gt;</code> à mão: é por pôr os separadores que a lista sabe quais filhos são degraus e consegue dobrar o miolo — e montar o voltar do telefone. Para trocar o glifo, passe <code>separator</code> uma vez, por nome ou como nó.
      </DocNote>

      <DocNote title="Ela nunca vira duas linhas">
        A lista é <code>flex-nowrap</code>, com duas defesas: <code>maxItems</code> para a trilha profunda e <code>truncate</code> para o rótulo longo. Trilha em duas linhas empurra o título para baixo.
      </DocNote>

      <DocNote title="A página atual não é um link">
        <code>BreadcrumbPage</code> é um <code>span</code> com <code>aria-current=&quot;page&quot;</code>. Papel de link num elemento que não navega faz o leitor anunciar um link e convidar à ativação.
      </DocNote>

      <DocNote title="O alvo de dedo cresce por pseudo-elemento">
        Crescer de verdade empurraria a linha do cabeçalho. Em ponteiro grosso o <code>::after</code> soma 12px na vertical e 4px na horizontal — metade do <code>gap</code>, para vizinhos encostarem sem se sobrepor.
      </DocNote>

      <DocNote title="Ele vai dentro do PageHeader, ou é o título da barra">
        <code>PageHeaderBreadcrumb</code> o põe acima do título, na largura inteira. Na barra do app ele é o próprio título das subpáginas: o último degrau é o <code>&lt;h1&gt;</code>, por <code>BreadcrumbPage asChild</code> — a barra escrevia link, chevron e <code>&lt;h1&gt;</code> à mão, com <code>max-w-[45%]</code> no lugar da regra de quem cede.
      </DocNote>

      <PropsTable
        title="Props de BreadcrumbList"
        rows={[
          {
            prop: "maxItems",
            type: "number",
            default: "4",
            description:
              "Degraus visíveis antes de o miolo virar menu; piso 3, e 0 desliga.",
          },
          {
            prop: "separator",
            type: '"chevron" | "slash" | "dot" | ReactNode',
            default: '"chevron"',
            description: "O glifo entre os degraus, por nome ou como nó, uma vez para a lista toda.",
          },
          {
            prop: "collapse",
            type: '"menu" | "back"',
            default: '"menu"',
            description: "back: abaixo de sm, a trilha vira “‹ Pai”.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "Corpo do texto, chevron e reticências, por contexto.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "Breadcrumb",
            type: "ComponentProps<'nav'>",
            description: "A moldura, com o rótulo de navegação.",
          },
          {
            prop: "BreadcrumbItem",
            type: "ComponentProps<'li'>",
            description:
              "Um degrau; o último é shrink-0.",
          },
          {
            prop: "BreadcrumbLink",
            type: "ComponentProps<'a'> & { asChild, icon }",
            description: "Ancestral navegável. asChild para o <Link> do Next; icon antes do rótulo, ou sozinho com aria-label.",
          },
          {
            prop: "BreadcrumbPage",
            type: "ComponentProps<'span'> & { asChild }",
            description: "A página atual. aria-current, sem papel de link; asChild para ser o <h1>.",
          },
          {
            prop: "BreadcrumbSwitcher",
            type: "{ children, items, label }",
            description: "A página atual com o menu dos irmãos; items são BreadcrumbSwitcherItem.",
          },
          {
            prop: "BreadcrumbSwitcherItem",
            type: "DropdownMenuItem & { current }",
            description: "Um irmão; current leva o tique e aria-current.",
          },
          {
            prop: "BreadcrumbMenu",
            type: "{ children, label }",
            description:
              "As reticências com o menu dos degraus dobrados; a lista o monta.",
          },
          {
            prop: "BreadcrumbEllipsis",
            type: "ComponentProps<'span'>",
            description:
              "O marcador estático, sem menu; aria-hidden.",
          },
        ]}
      />
    </>
  )
}
