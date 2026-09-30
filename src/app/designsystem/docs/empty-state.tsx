"use client"

import {
  CreditCardIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline"
import { ArrowPathIcon, CreditCardIcon as CreditCardMicroIcon, PlusIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateCode,
  EmptyStateDescription,
  EmptyStateGhost,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/ui/empty-state"
import { Skeleton, SkeletonText } from "@/components/ui/skeleton"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function EmptyStateDoc() {
  return (
    <>
      <Usage>
          O que a tela diz quando não há nada nela, e <strong>a forma diz a situação</strong>: <strong>nunca teve</strong> mostra a lista que vai existir (fantasmas), <strong>o filtro não achou</strong> abre um leque, <strong>não encontrado</strong> e <strong>deu erro</strong> ocupam a página com o numeral da marca. Enquanto o dado chega é <code>Skeleton</code>, não vazio.
      </Usage>

      <DocSection
        title="Nunca teve"
        description="O primeiro uso é um convite: os fantasmas mostram a lista que vai aparecer ali. A ação primária vai junto."
        code={`<EmptyState variant="plain" size="lg">
  <EmptyStateGhost leading="tile" trailing="amount" />
  <EmptyStateTitle>Comece a registrar suas movimentações</EmptyStateTitle>
  <EmptyStateDescription>…</EmptyStateDescription>
  <EmptyStateActions><Button>Nova transação</Button></EmptyStateActions>
</EmptyState>`}
        previewClassName="items-stretch"
      >
        <EmptyState variant="plain" size="lg" className="w-full">
          <EmptyStateGhost leading="tile" trailing="amount" />
          <EmptyStateTitle>Comece a registrar suas movimentações</EmptyStateTitle>
          <EmptyStateDescription>
              Lance a primeira e o extrato, os totais do mês e os orçamentos
              começam a se preencher sozinhos.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button>
              <PlusIcon aria-hidden />
              Nova transação
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Os fantasmas mudam de forma"
        description="As props são de forma, não de domínio: leading é o que abre a linha (ladrilho, cartão, avatar) e trailing o que a fecha (valor, data, nada)."
        code={`<EmptyStateGhost leading="card" trailing="amount" />
<EmptyStateGhost leading="tile" trailing="date" />`}
        previewClassName="items-stretch gap-6 sm:flex-row"
      >
        <EmptyState variant="plain" size="lg" className="w-full">
          <EmptyStateGhost leading="card" trailing="amount" />
          <EmptyStateTitle>Cadastre seus cartões de crédito</EmptyStateTitle>
        </EmptyState>
        <EmptyState variant="plain" size="lg" className="w-full">
          <EmptyStateGhost leading="tile" trailing="date" />
          <EmptyStateTitle>Cadastre suas assinaturas</EmptyStateTitle>
        </EmptyState>
      </DocSection>

      <DocSection
        title="O filtro não achou"
        description="Três ladrilhos em leque, que se abrem sob o cursor na mola da casa. A ação é remover o que causou o vazio: quem filtrou não quer cadastrar, quer ver o que sumiu."
        code={`<EmptyStateIcon variant="stack">
  <MagnifyingGlassIcon />
  <ReceiptPercentIcon />
  <FunnelIcon />
</EmptyStateIcon>`}
        previewClassName="items-stretch"
      >
        <EmptyState variant="plain" size="lg" className="w-full">
          <EmptyStateIcon variant="stack">
            <MagnifyingGlassIcon aria-hidden />
            <ReceiptPercentIcon aria-hidden />
            <FunnelIcon aria-hidden />
          </EmptyStateIcon>
          <EmptyStateTitle>Nenhuma transação com esses filtros</EmptyStateTitle>
          <EmptyStateDescription>
              Nenhuma transação entre 1 e 7 de março na categoria Mercado.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="outline">Limpar filtros</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Não encontrado"
        description="A página inteira, com o numeral da marca: a serifa do wordmark preenchida com o arco-íris, dissolvendo para baixo até o título pousar na base. O numeral é aria-hidden; quem diz o que houve é o título."
        code={`<EmptyState variant="plain" size="page">
  <EmptyStateCode>404</EmptyStateCode>
  <EmptyStateTitle>Página não encontrada</EmptyStateTitle>
  …
</EmptyState>`}
        previewClassName="items-stretch"
      >
        <EmptyState variant="plain" size="page" className="w-full">
          <EmptyStateCode>404</EmptyStateCode>
          <EmptyStateTitle asChild>
            <h2>Página não encontrada</h2>
          </EmptyStateTitle>
          <EmptyStateDescription>
              O endereço pode ter mudado, ou a página foi removida.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button>Ir para o painel</Button>
            <Button variant="tertiary">Página inicial</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Deu erro"
        description="A mesma composição do 404, com a palavra no lugar do numeral: o Ops! na serifa da marca, dissolvendo até o título pousar na base."
        code={`<EmptyState variant="plain" size="page">
  <EmptyStateCode>Ops!</EmptyStateCode>
  …
</EmptyState>`}
        previewClassName="items-stretch overflow-hidden"
      >
        <EmptyState variant="plain" size="page" className="w-full">
          <EmptyStateCode>Ops!</EmptyStateCode>
          <EmptyStateTitle asChild>
            <h2>Algo deu errado</h2>
          </EmptyStateTitle>
          <EmptyStateDescription>
              Não foi possível carregar esta tela. Tente de novo em alguns
              instantes.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button iconMotion="spin">
              <ArrowPathIcon aria-hidden />
              Tentar novamente
            </Button>
            <Button variant="tertiary">Ir para o painel</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Tudo em dia"
        description="O vazio que é boa notícia — nenhuma sessão aberta, nenhuma parcela terminando — não usa o leque de um filtro sem resultado. variant=&quot;done&quot; nasce na mola e o tique se desenha da esquerda para a direita, no tom success; sem filho, o tique é o padrão."
        code={`<EmptyState variant="plain">
  <EmptyStateIcon variant="done" />
  <EmptyStateTitle>Todas as sessões foram encerradas</EmptyStateTitle>
</EmptyState>`}
        previewClassName="items-stretch"
      >
        <EmptyState variant="plain" className="w-full">
          <EmptyStateIcon variant="done" />
          <EmptyStateTitle>Todas as sessões foram encerradas</EmptyStateTitle>
          <EmptyStateDescription>
              Você só verá esta sessão ativa neste dispositivo.
          </EmptyStateDescription>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Em linha"
        description="layout=&quot;inline&quot; é o vazio pequeno, dentro de um formulário: o ícone à esquerda e o texto e a ação à direita, alinhados à esquerda. É o aviso de cartão das telas de transação e de assinatura, cuja ação era um link estilizado à mão no meio da frase."
        code={`<EmptyState size="sm" layout="inline">
  <EmptyStateIcon><CreditCardIcon aria-hidden /></EmptyStateIcon>
  <EmptyStateDescription>Nenhum cartão cadastrado para vincular esta despesa.</EmptyStateDescription>
  <EmptyStateActions>
    <Button variant="link" asChild><Link href="/credit-cards">Cadastrar cartão</Link></Button>
  </EmptyStateActions>
</EmptyState>`}
        previewClassName="items-stretch"
      >
        <EmptyState size="sm" layout="inline" className="w-full max-w-md">
          <EmptyStateIcon>
            <CreditCardMicroIcon aria-hidden />
          </EmptyStateIcon>
          <EmptyStateDescription>
            Nenhum cartão cadastrado para vincular esta despesa.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="link">cadastrar cartão</Button>
          </EmptyStateActions>
        </EmptyState>
      </DocSection>

      <DocSection
        title="Os quatro estados, na ordem"
        description="Toda tela tem quatro estados: carregando, erro, vazio e com conteúdo. Desenhar só o último deixa a tela incompleta; carregando vem antes de vazio, com esqueleto na forma do conteúdo."
        code={`if (isLoading) return <ListaSkeleton />
if (error) return <ErroComTentarDeNovo />
if (!itens.length) return <EmptyState … />
return <Lista itens={itens} />`}
        previewClassName="items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton shape="circle" size="md" />
              <SkeletonText lines={2} className="min-w-0 flex-1" />
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Molduras"
        description="dashed é o padrão; card é o bloco com superfície; plain não desenha moldura, para dentro de um Card — que é o caso de quase todas as telas do app."
        code={`<EmptyState size="sm">…</EmptyState>
<EmptyState variant="card" size="sm">…</EmptyState>
<Card><EmptyState variant="plain">…</EmptyState></Card>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {(["dashed", "card"] as const).map((v) => (
            <EmptyState key={v} variant={v} size="sm">
              <EmptyStateTitle>{v}</EmptyStateTitle>
              <EmptyStateDescription>Nenhuma compra nesta fatura.</EmptyStateDescription>
            </EmptyState>
          ))}
        </div>
        <Card padding="none" className="w-full">
          <CardToolbar>Fatura de março</CardToolbar>
          <CardContent className="p-0">
            <EmptyState variant="plain" size="md">
              <EmptyStateIcon variant="stack">
                <CreditCardIcon aria-hidden />
                <ReceiptPercentIcon aria-hidden />
                <MagnifyingGlassIcon aria-hidden />
              </EmptyStateIcon>
              <EmptyStateTitle>Nenhuma compra nesta fatura</EmptyStateTitle>
              <EmptyStateDescription>
                  O ciclo fecha em 28 de março.
              </EmptyStateDescription>
            </EmptyState>
          </CardContent>
        </Card>
      </DocSection>

      <DocNote title="O arco-íris mora só no numeral">
          No primeiro uso não há arco-íris: quatro versões dele — atrás dos fantasmas e no contorno deles — foram recusadas na tela. No numeral das páginas de erro ele <em>é</em> o glifo, como no wordmark, e é <code>aria-hidden</code>, porque não carrega o que houve.
      </DocNote>

      <DocNote title="O que se move, e o que não">
          Os fantasmas sobem num laço lento e o numeral do erro desliza a cor. O leque só se move quando a pessoa aponta. Com movimento reduzido, tudo para no primeiro quadro.
      </DocNote>

      <DocNote title="O degrau dos botões é do bloco">
          <code>EmptyStateActions</code> passa o degrau aos botões pelo mesmo contexto do <code>ButtonGroup</code>: <code>sm</code> e <code>md</code> dão <code>sm</code> (o vazio de um cartão do painel), <code>lg</code> e <code>page</code> dão <code>xl</code> (a tela inteira). Sete telas escreviam <code>size=&quot;xl&quot;</code> e o tamanho do ícone à mão, e a de cartões escrevia <code>size=&quot;sm&quot; h-8 text-xs</code>. Um <code>size</code> no botão vence. O numeral de <code>EmptyStateCode</code> também acompanha o bloco, com o recuo que faz o título pousar nele.
      </DocNote>

      <DocNote title="O respiro é do pai, e não dos filhos">
          O <code>gap</code> é do <code>EmptyState</code> e nenhuma peça declara margem. Com margem nos filhos, tirar a descrição mudaria sozinho o respiro entre ícone e título.
      </DocNote>

      <DocNote title="O título é um p; asChild quando precisa ser cabeçalho">
          Um <code>h2</code> fixo entraria na página a cada bloco vazio, inclusive dentro de uma seção que já tem o seu. Quem precisa de cabeçalho usa <code>asChild</code> com o nível certo. Em <code>size=&quot;page&quot;</code> ele já nasce <code>&lt;h1&gt;</code>, no <code>H1</code> do sistema: um server component que passasse o <code>h1</code> por <code>asChild</code> o entregaria ao <code>Slot</code> como referência preguiçosa, e o título sumiria.
      </DocNote>

      <DocNote title="Vazio não é carregando">
          Enquanto o dado está a caminho, é <code>Skeleton</code>. Mostrar o vazio e trocar meio segundo depois faz a pessoa ler &ldquo;você não tem nada&rdquo; sobre uma conta que tem.
      </DocNote>

      <DocNote title="Este é o componente do projeto, não o do registry">
          Não instale o <code>empty</code> do registry: duas respostas para a mesma pergunta fazem o design system deixar de descrever o produto.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"dashed" | "card" | "plain"',
            default: '"dashed"',
            description:
              "plain não desenha moldura — é o de dentro de um Card, que já tem a sua.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "page"',
            default: '"md"',
            description:
              "Respiro, recuo, a medida do ícone, o degrau dos botões e o corpo do numeral juntos. sm é a célula; lg a seção inteira; page a página de erro, com o título na serifa.",
          },
          {
            prop: "layout",
            type: '"stack" | "inline"',
            default: '"stack"',
            description: "inline põe o ícone à esquerda e o texto e a ação à direita.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "EmptyStateIcon",
            type: 'variant: "circle" | "stack" | "done"; tone: "default" | "info" | "success" | "warning" | "destructive"',
            default: '"circle", "default"',
            description:
              "stack põe até três filhos em ladrilhos, em leque; done é o tique que se desenha, em success. A medida vem do size do bloco.",
          },
          {
            prop: "EmptyStateGhost",
            type: 'leading: "tile" | "card" | "avatar"; trailing: "amount" | "date" | "none"',
            default: '"tile", "amount"',
            description:
              "As linhas da lista que ainda não existe, em laço. aria-hidden.",
          },
          {
            prop: "EmptyStateCode",
            type: "ComponentProps<'span'>",
            description:
              "O numeral ou a palavra da página de erro, preenchido com o arco-íris. aria-hidden.",
          },
          {
            prop: "EmptyStateTitle",
            type: "ComponentProps<'p'> & { asChild }",
            description: "Um <p> por padrão. asChild quando ele precisa ser cabeçalho.",
          },
          {
            prop: "EmptyStateDescription",
            type: "ComponentProps<'p'>",
            description: "Teto de medida em max-w-sm, para a linha não esticar.",
          },
          {
            prop: "EmptyStateActions",
            type: "ComponentProps<'div'>",
            description:
              "Folga a mais que o gap, para o botão não ler como parte do parágrafo.",
          },
        ]}
      />
    </>
  )
}
