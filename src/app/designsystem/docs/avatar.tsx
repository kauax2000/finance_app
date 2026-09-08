"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Muted } from "@/components/ui/typography"
import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const

const PESSOAS = ["AC", "BM", "KL", "RS", "TF", "VP"]

export default function AvatarDoc() {
  return (
    <>
      <Usage>
        Identifica uma pessoa numa lista, num menu, numa transação. Sempre com <code>AvatarFallback</code>: a imagem pode não carregar, e um círculo vazio lê como erro.
      </Usage>

      <DocSection
        title="Tamanhos"
        code={`<Avatar size="sm"><AvatarFallback>KL</AvatarFallback></Avatar>`}
      >
        {SIZES.map((size) => (
          <Avatar key={size} size={size}>
            <AvatarFallback>KL</AvatarFallback>
          </Avatar>
        ))}
      </DocSection>

      <DocSection
        title="Forma"
        description="circle é o padrão e é a convenção de retrato. rounded é o que o produto desenha hoje na lateral do usuário e na lista de membros — mesma família da marca de workspace, que costuma aparecer ao lado. O prop existe porque as duas formas conviviam sem estar ditas: o catálogo mostrava círculo e o app entregava canto arredondado."
        code={`<Avatar shape="rounded">
  <AvatarFallback>KL</AvatarFallback>
</Avatar>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex items-center gap-3">
          <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
            circle
          </code>
          {SIZES.map((size) => (
            <Avatar key={size} size={size}>
              <AvatarFallback>KL</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <code className="w-16 shrink-0 font-mono text-2xs text-muted-foreground">
            rounded
          </code>
          {SIZES.map((size) => (
            <Avatar key={size} size={size} shape="rounded">
              <AvatarFallback>KL</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </DocSection>

      <DocNote title="O canto do rounded cresce com a caixa">
        8px em <code>xs</code> e <code>sm</code>, 10px em <code>md</code> e{" "}
        <code>lg</code>, 14px em <code>xl</code>{" "}
        — a mesma progressão do <code>ColorTile</code>. Cravado num raio só, um
        avatar de 24px ficava quase redondo e um de 56px quase reto; e a 32px
        ele desenhava 10px contra os 8px do ladrilho de categoria, duas peças de
        identidade lado a lado com cantos diferentes.
      </DocNote>

      <DocSection
        title="Com imagem e com iniciais"
        description="AvatarImage entra por cima; o fallback aparece enquanto ela carrega e fica se ela falhar."
        code={`<Avatar>
  <AvatarImage src="/foto.jpg" alt="" />
  <AvatarFallback>KL</AvatarFallback>
</Avatar>`}
      >
        <Avatar>
          <AvatarImage src="/icons/icon-192.png" alt="" />
          <AvatarFallback>KL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className="bg-identity-3-surface text-identity-3">
            MR
          </AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className="bg-identity-5-surface text-identity-5">
            JS
          </AvatarFallback>
        </Avatar>
      </DocSection>

      <DocNote title="alt vazio é proposital">
        A foto ao lado do nome não acrescenta informação: descrevê-la faria o leitor de tela anunciar a mesma pessoa duas vezes. <code>AvatarImage</code> já traz <code>alt=&quot;&quot;</code>. Sem o nome ao lado, aí o alt precisa dizer de quem é.
      </DocNote>

      <DocNote title="A escala é de 8 em 8, e não é a escada de controle">
        24, 32, 40, 48 e 56. A escada do projeto — 24, 28, 32, 36, 40 — existe
        para botão alinhar com campo numa linha de formulário, e um avatar nunca
        disputa essa linha: ali 40px é teto, não meio. O único degrau que os dois
        vocabulários dividem, <code>xs</code>{" "}
        a 24, vale o mesmo nos dois — que é o caso em que um avatar de fato mora
        dentro de uma linha de controle.
      </DocNote>

      <DocNote title="delayMs evita o pisca das iniciais">
        <code>AvatarFallback</code> aceita <code>delayMs</code>{" "}
        do Radix: com ele as iniciais só entram depois do prazo, e uma foto que
        chega rápido deixa de ser precedida por um lampejo de letras. Numa lista
        onde a maioria tem foto, vale.
      </DocNote>

      <DocNote title="A cor de fundo vem dos tons de identidade">
        <code>identityToneFor</code>{" "}
        devolve o par superfície + tinta, e o app inteiro passou a usá-lo — sete
        telas que antes montavam classe crua do Tailwind com texto branco por
        cima. A superfície é opaca e não alpha: avatares empilhados mostrariam o
        de baixo através do de cima.
      </DocNote>

      <DocSection
        title="Em vidro"
        description="A identidade da pessoa vira o tom da lâmina, e o fallback deixa de pintar superfície própria."
        code={`<Avatar glass identity={2}>
  <AvatarFallback>KL</AvatarFallback>
</Avatar>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {PESSOAS.map((iniciais, i) => (
            <Avatar key={iniciais} glass identity={i}>
              <AvatarFallback>{iniciais}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Ao lado do avatar opaco"
        description="O de cima é superfície opaca; o de baixo é lâmina. A diferença de material aparece na aresta."
        code={`<Avatar><AvatarFallback className={cn(tom.surface, tom.ink)}>KL</AvatarFallback></Avatar>
<Avatar glass identity={2}><AvatarFallback>KL</AvatarFallback></Avatar>`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {PESSOAS.map((iniciais, i) => (
              <Avatar key={iniciais}>
                <AvatarFallback
                  className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}
                >
                  {iniciais}
                </AvatarFallback>
              </Avatar>
            ))}
            <Muted className="text-2xs">opaco</Muted>
          </div>
          <div className="flex items-center gap-3">
            {PESSOAS.map((iniciais, i) => (
              <Avatar key={iniciais} glass identity={i}>
                <AvatarFallback>{iniciais}</AvatarFallback>
              </Avatar>
            ))}
            <Muted className="text-2xs">vidro</Muted>
          </div>
        </div>
      </DocSection>

      <DocNote title="O vidro não tinha onde morar, e os dois caminhos óbvios falham">
        Medido: a raiz do <code>Avatar</code>{" "}
        <strong>não pinta fundo nenhum</strong>, e o{" "}
        <code>AvatarFallback</code> é <code>h-full w-full</code>{" "}
        com superfície <strong>opaca</strong>.
        <br />
        <br />
        Vidro na <strong>raiz</strong> fica escondido atrás do fallback. Vidro
        no <strong>fallback</strong> apaga a identidade. E o terceiro caminho —
        tornar <code>--identity-N-surface</code> translúcido — está{" "}
        <strong>rejeitado por escrito</strong>{" "}
        no sistema: avatares empilhados mostrariam o de baixo.
        <br />
        <br />
        A saída é a tradução: a lâmina fica na raiz, o tom vem da identidade, e
        o fallback deixa de escrever superfície. E a objeção do empilhamento não
        se aplica, porque <strong>é um modo</strong>{" "}
        — quem escreve <code>glass</code>{" "}
        aceita a translucidez, e o avatar sem ele segue opaco.
      </DocNote>

      <DocNote title="O fallback não anula nada — ele deixa de escrever">
        A superfície opaca mora no <code>AvatarFallback</code>, não na raiz, e
        desligá-la por seletor não funcionaria: um{" "}
        <code>in-data-glass:bg-transparent</code> compila com{" "}
        <code>:where()</code>, que{" "}
        <strong>não soma especificidade</strong>, e perderia para o{" "}
        <code>bg-muted</code>{" "}
        declarado no próprio elemento. Quem desce o modo é{" "}
        <strong>contexto</strong>{" "}
        — o mecanismo do <code>Field</code>, e ele sai de graça porque o{" "}
        <code>Avatar</code> já é módulo cliente.
      </DocNote>

      <DocNote title="O aro nunca acendeu num círculo, e a causa é geométrica">
        O aro do vidro é um gradiente <strong>linear</strong>, calibrado numa
        placa de 240×424. Numa caixa de 40×40 o eixo dele mede{" "}
        <strong>49px</strong>: as duas pontas — onde moram o pico e o extremo
        aceso — caem nos <strong>cantos</strong> do quadrado, e num círculo os
        cantos não existem.
        <br />
        <br />
        Medido, amostrando 720 pontos do perímetro: <strong>0%</strong> via o
        pico de 34%, <strong>0%</strong> via o extremo aceso, e{" "}
        <strong>57,5%</strong> via só o vale de 10%. O avatar de vidro tinha uma
        borda cinza quase uniforme, e era isso que o fazia ler como disco
        chapado.
        <br />
        <br />
        Com <code>shape=&quot;circle&quot;</code> ele veste{" "}
        <code>glass-round</code>, que troca o aro por um{" "}
        <code>conic-gradient</code> — cada ponto do perímetro mapeia para um
        ângulo, então não há canto a perder. Depois: <strong>14%</strong> no pico
        e 8,5% no vale. Em <code>shape=&quot;rounded&quot;</code> os cantos
        existem, e ali o linear continua certo.
      </DocNote>

      <DocNote title="Quatro das seis camadas não pintavam nada">
        O tom é a camada de cima, e ele era <strong>opaco</strong>: a lâmina e as
        duas nuvens ficavam por baixo dele e não chegavam à tela. Sobrava um
        disco de cor sólida mais um fio.
        <br />
        <br />
        As nuvens simulam luz <em>atrás</em> de uma placa; num disco de 40px não
        há atrás, e o que faz ler como vidro é reflexo <strong>na</strong>{" "}
        superfície. Por isso o conserto não foi trazê-las de volta — foi acender
        um especular em <code>--glass-sheen-image</code>, a única camada acima do
        tom.
        <br />
        <br />O corpo abre <strong>8%</strong> no escuro e <strong>2%</strong> no
        claro, e a diferença saiu do contraste: ali a lâmina é branca e clareia o
        corpo, então a 92% dois tons caíam abaixo dos 4,5:1. Onde a letra de fato
        encontra o especular, os seis medem <strong>5,93 a 6,34</strong> no
        escuro e <strong>4,61 a 5,14</strong> no claro.
      </DocNote>

      <DocNote title="A foto encolhe 2px, e o preço é a aresta">
        O vidro traz <code>border: 1px solid transparent</code>, que é onde o
        aro mora. Com <code>box-sizing: border-box</code>{" "}
        a caixa externa não cresce — <strong>o conteúdo encolhe 2px</strong>.
        Num avatar <code>sm</code> de 32px, são 30px de imagem. Numa peça
        circular com foto isso é visível, e por isso está dito em vez de
        descoberto depois.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "24, 32, 40, 48 e 56.",
          },
          {
            prop: "shape",
            type: '"circle" | "rounded"',
            default: '"circle"',
            description: "Retrato redondo ou quadrado de canto arredondado.",
          },
          {
            prop: "glass",
            type: "boolean",
            default: "false",
            description:
              "A lâmina de vidro. A identidade vira o tom, e o fallback deixa de pintar superfície.",
          },
          {
            prop: "identity",
            type: "number",
            default: "0",
            description:
              "Qual das seis identidades, no modo de vidro — o índice de IDENTITY_TONES, não a semente de identityToneFor.",
          },
        ]}
      />
    </>
  )
}