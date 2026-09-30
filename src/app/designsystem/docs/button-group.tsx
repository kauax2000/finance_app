"use client"

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ButtonGroupDoc() {
  return (
    <>
      <Usage>
        Botões que agem sobre a <strong>mesma coisa</strong> e por isso ficam colados: uma ação com seu menu, um par de navegação, um campo com a sua ação. Ações independentes ficam separadas por <code>gap</code>.
      </Usage>

      <DocSection
        title="Ação com menu, e a emenda de cada peso"
        description="O primário emenda por um vão transparente de 1px; o secondary também, de cima a baixo, mostrando a superfície de trás; o outline emenda pela própria borda; o destructive, que é cheio e não tem vão, ganha um filete de currentColor a 20%."
        code={`<ButtonGroup>
  <Button>Nova transação</Button>
  <Button size="icon-md" aria-label="Mais opções">
    <ChevronDownIcon aria-hidden />
  </Button>
</ButtonGroup>`}
        previewClassName="flex-wrap gap-4"
      >
        {(["primary", "secondary", "outline", "destructive"] as const).map((v) => (
          <ButtonGroup key={v}>
            <Button variant={v}>{v === "destructive" ? "excluir" : "nova transação"}</Button>
            <Button variant={v} size="icon-md" aria-label={`Mais opções (${v})`}>
              <ChevronDownIcon aria-hidden />
            </Button>
          </ButtonGroup>
        ))}
      </DocSection>

      <DocSection
        title="O degrau é do grupo"
        description="size desce a todos os botões pelo contexto — a escada de texto (xs a xl) ou a de ícone (icon-xs a icon-xl). Um size no próprio botão vence. Sem ele, cada botão repetia o mesmo degrau, e bastava um esquecido para a emenda sair em degrau."
        code={`<ButtonGroup size="sm">
  <Button variant="secondary">Anterior</Button>
  <Button variant="secondary">Hoje</Button>
  <Button variant="secondary">Próximo</Button>
</ButtonGroup>`}
        previewClassName="flex-col items-start gap-4"
      >
        {(["sm", "md", "lg"] as const).map((s) => (
          <div key={s} className="flex items-center gap-3">
            <ButtonGroup size={s}>
              <Button variant="secondary">anterior</Button>
              <Button variant="secondary">hoje</Button>
              <Button variant="secondary">próximo</Button>
            </ButtonGroup>
            <Caption>{s}</Caption>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Texto no grupo"
        description="ButtonGroupText é o segmento que não se clica — o “2 de 5” entre as setas, um rótulo antes do seletor. Fundo muted e borda própria, que é o que diz “isto não é botão” ao lado de um contorno. A altura é a da fileira, então ele segue o degrau sem saber qual é."
        code={`<ButtonGroup size="icon-md">
  <Button variant="outline" aria-label="Página anterior"><ChevronLeftIcon aria-hidden /></Button>
  <ButtonGroupText>Página 2 / 5</ButtonGroupText>
  <Button variant="outline" aria-label="Próxima página"><ChevronRightIcon aria-hidden /></Button>
</ButtonGroup>`}
      >
        <ButtonGroup size="icon-md">
          <Button variant="outline" aria-label="Página anterior">
            <ChevronLeftIcon aria-hidden />
          </Button>
          <ButtonGroupText>
            Página <span className="font-medium text-foreground">2</span> /{" "}
            <span className="font-medium text-foreground">5</span>
          </ButtonGroupText>
          <Button variant="outline" aria-label="Próxima página">
            <ChevronRightIcon aria-hidden />
          </Button>
        </ButtonGroup>
      </DocSection>

      <DocSection
        title="Campo no grupo"
        description="Um Input colado à sua ação. O campo ocupa a sobra e o grupo passa a ter a largura de quem o contém; o anel de foco do campo sobe acima do vizinho. No dedo o campo sobe a 40 pela régua de campo, e o grupo leva os botões junto."
        code={`<ButtonGroup>
  <Input placeholder="Buscar transação" aria-label="Buscar transação" />
  <Button variant="outline">Buscar</Button>
</ButtonGroup>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <ButtonGroup className="max-w-sm">
          <Input placeholder="Buscar transação" aria-label="Buscar transação" />
          <Button variant="outline">buscar</Button>
        </ButtonGroup>
        <ButtonGroup className="max-w-sm">
          <Input type="email" placeholder="email@exemplo.com" aria-label="E-mail do convite" />
          <Button>convidar</Button>
        </ButtonGroup>
      </DocSection>

      <DocSection
        title="Vertical"
        description="orientation=&quot;vertical&quot; empilha: os cantos de cima e de baixo achatam, a emenda deita, e os botões ocupam a largura do mais largo. Para ações empilhadas num painel estreito, ou um controle de zoom."
        code={`<ButtonGroup orientation="vertical" size="icon-md">
  <Button variant="outline" aria-label="Aproximar"><PlusIcon aria-hidden /></Button>
  <Button variant="outline" aria-label="Afastar"><MinusIcon aria-hidden /></Button>
</ButtonGroup>`}
        previewClassName="items-start gap-6"
      >
        <ButtonGroup orientation="vertical" size="icon-md">
          <Button variant="outline" aria-label="Aproximar">
            <PlusIcon aria-hidden />
          </Button>
          <Button variant="outline" aria-label="Afastar">
            <MinusIcon aria-hidden />
          </Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical">
          <Button variant="secondary">duplicar</Button>
          <Button variant="secondary">mover para…</Button>
          <Button variant="secondary">arquivar</Button>
        </ButtonGroup>
      </DocSection>

      <DocNote title="O grupo manda no raio e na emenda">
        Os cantos internos são achatados e as bordas vizinhas se sobrepõem em 1px, para a emenda ser um fio só. Não arredonde os filhos por fora. Quem recebe hover ou foco sobe de camada, senão o vizinho recorta o anel. O vão do primário é a sobreposição, sem o <code>ml-px</code> do <code>secondary</code>: o fundo dele é recortado no <code>padding-box</code>, e com a margem a emenda somava 3px.
      </DocNote>

      <DocNote title="Não é um seletor">
        ButtonGroup agrupa <em>ações</em>. Opção que fica marcada é <code>ToggleGroup</code>, com estado pressionado e semântica de rádio. Abas não entram aqui: um <code>role=&quot;group&quot;</code> entre <code>tablist</code> e abas quebra o &ldquo;aba 1 de 3&rdquo; do leitor de tela.
      </DocNote>

      <DocNote title="Onde o app usa">
        Uma: o botão de nova transação, com o menu dos tipos de lançamento (a seta deixou de escrever <code>w-8 px-0</code> e virou <code>icon-md</code>; a altura continua sendo a da barra, <code>--toolbar-control</code>, 40 no telefone). A paginação da tabela de transações foi um <code>ButtonGroup</code> com <code>ButtonGroupText</code> na rodada 188 e, desde a 196, é o <code>Pagination</code>, que passou a aceitar troca por estado.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "size", type: "a escada do Button", description: "O degrau de todos os botões do grupo; o do próprio botão vence." },
          { prop: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "vertical empilha e deita a emenda." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "ButtonGroupText", type: "div", description: "O segmento que não se clica: rótulo ou contador, na altura da fileira." },
        ]}
      />
    </>
  )
}
