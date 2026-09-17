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
        Identifica uma pessoa numa lista, num menu, numa transação. Sempre com <code>AvatarFallback</code>: a imagem pode não carregar, e um círculo vazio lê como erro. Para categoria ou conta, use <code>ColorTile</code>.
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
        description="circle é o padrão, a convenção de retrato. rounded é o da lateral do usuário e da lista de membros, da mesma família da marca de workspace que costuma aparecer ao lado."
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
        8px em <code>xs</code> e <code>sm</code>, 10px em <code>md</code> e <code>lg</code>, 14px em <code>xl</code> — a progressão do <code>ColorTile</code>, para as duas peças de identidade baterem lado a lado.
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

      <DocNote title="A escala é de 8 em 8, não a escada de controle">
        24, 32, 40, 48 e 56. A escada 24–40 existe para botão alinhar com campo, e um avatar não disputa essa linha; só <code>xs</code>, a 24, coincide com ela.
      </DocNote>

      <DocNote title="delayMs evita o pisca das iniciais">
        Com <code>delayMs</code> no <code>AvatarFallback</code>, as iniciais só entram depois do prazo, e uma foto rápida não é precedida por um lampejo de letras. Vale em listas onde a maioria tem foto.
      </DocNote>

      <DocNote title="A cor de fundo vem dos tons de identidade">
        <code>identityToneFor</code> devolve o par superfície + tinta; não monte classe crua. A superfície é opaca: com alfa, avatares empilhados mostrariam o de baixo.
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

      <DocNote title="No vidro, a lâmina fica na raiz e o tom vem da identidade">
        Vidro na raiz some atrás do fallback opaco; vidro no fallback apaga a identidade. Por isso, no modo <code>glass</code>, o fallback deixa de pintar superfície — por contexto, já que um seletor <code>in-data-*</code> perderia para o fundo do próprio elemento. Sem <code>glass</code>, o avatar segue opaco.
      </DocNote>

      <DocNote title="Círculo usa glass-round">
        O aro linear do vidro acende nos cantos, e um círculo não tem cantos: ficaria uma borda cinza uniforme. Com <code>shape=&quot;circle&quot;</code> o avatar veste <code>glass-round</code>, com aro em <code>conic-gradient</code>; em <code>rounded</code> o linear continua certo.
      </DocNote>

      <DocNote title="O vidro lê pelo especular, não pelas nuvens">
        Num disco pequeno não há &ldquo;atrás&rdquo; para as nuvens de luz; o que lê como vidro é o reflexo em <code>--glass-sheen-image</code>, acima do tom. No claro o corpo abre menos, para as iniciais manterem 4,5:1.
      </DocNote>

      <DocNote title="No vidro, a foto encolhe 2px">
        O aro mora numa <code>border</code> transparente de 1px e a caixa é <code>border-box</code>, então o conteúdo perde 2px: num <code>sm</code> de 32px, são 30px de imagem.
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