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
        Identifica uma pessoa numa lista, num menu, numa transação. Duas versões, e só duas: <strong>com foto</strong> (a foto) e <strong>sem foto</strong> (as iniciais em tinta escura sobre um degradê pastel de marca, com grão). Sempre com <code>AvatarFallback</code>: a imagem pode não carregar, e um círculo vazio lê como erro. Para categoria ou conta, use <code>ColorTile</code>.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="Cinco degraus de 8 em 8: 24, 32, 40, 48 e 56."
        code={SIZES.map((s) => `<Avatar size="${s}"><AvatarFallback>KL</AvatarFallback></Avatar>`).join("\n")}
      >
        {SIZES.map((size) => (
          <Avatar key={size} size={size}>
            <AvatarFallback>KL</AvatarFallback>
          </Avatar>
        ))}
      </DocSection>

      <DocSection
        title="Forma"
        description="circle é o retrato; rounded é o quadrado de canto arredondado, a mesma família da marca de workspace ao lado dele."
        code={`<Avatar shape="circle"><AvatarFallback>KL</AvatarFallback></Avatar>
<Avatar shape="rounded"><AvatarFallback>KL</AvatarFallback></Avatar>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {(["circle", "rounded"] as const).map((shape) => (
          <div key={shape} className="flex items-center gap-3">
            {SIZES.map((size) => (
              <Avatar key={size} size={size} shape={shape}>
                <AvatarFallback>KL</AvatarFallback>
              </Avatar>
            ))}
            <Muted className="text-xs">{shape}</Muted>
          </div>
        ))}
      </DocSection>

      <DocNote title="O canto do rounded cresce com a caixa">
        8px em <code>xs</code> e <code>sm</code>, 10px em <code>md</code> e <code>lg</code>, 14px em <code>xl</code> — a progressão do <code>ColorTile</code>, para as duas peças de identidade baterem lado a lado.
      </DocNote>

      <DocSection
        title="Foto ou iniciais"
        description="AvatarImage entra por cima; o fallback aparece enquanto ela carrega e fica se ela falhar. Sem foto, as iniciais ficam em tinta escura sobre o degradê pastel da identidade, com grão fino por cima."
        code={`<Avatar>
  <AvatarImage src="/foto.jpg" alt="" />
  <AvatarFallback>KL</AvatarFallback>
</Avatar>

// A cor da pessoa vem de identityToneFor
const tone = identityToneFor(profile.avatar_color, email)
<Avatar>
  <AvatarFallback className={cn(tone.surface, tone.ink)}>KL</AvatarFallback>
</Avatar>`}
      >
        <Avatar>
          <AvatarImage src="/icons/icon-192.png" alt="" />
          <AvatarFallback>KL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback className={cn(IDENTITY_TONES[2].surface, IDENTITY_TONES[2].ink)}>
            KL
          </AvatarFallback>
        </Avatar>
      </DocSection>

      <DocSection
        title="Seis misturas"
        description="Cada identidade mistura três ou quatro cores do arco-íris num ângulo próprio — as mesmas cores, em ordens diferentes. Passe o cursor: o degradê desliza por baixo das letras."
        code={`{PESSOAS.map((iniciais, i) => (
  <Avatar key={iniciais}>
    <AvatarFallback className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}>
      {iniciais}
    </AvatarFallback>
  </Avatar>
))}`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {(["circle", "rounded"] as const).map((shape) => (
          <div key={shape} className="flex items-center gap-3">
            {PESSOAS.map((iniciais, i) => (
              <Avatar key={iniciais} size="lg" shape={shape}>
                <AvatarFallback
                  className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}
                >
                  {iniciais}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ))}
      </DocSection>

      <DocNote title="A cor vem de identityToneFor, e o degradê é a marca">
        <code>identityToneFor</code> devolve o par superfície + tinta; não monte classe crua. Os seis são misturas de marca — azul→violeta→magenta, magenta→coral→âmbar, violeta→magenta→coral→âmbar, âmbar→coral→magenta→índigo, azul→índigo→magenta→coral, coral→magenta→violeta→azul, cada uma no seu ângulo —, com as paradas em 0,82 de luminosidade e 0,11 de croma nos dois temas, grão fino em <code>overlay</code> e tinta escura. A primeira versão era saturada com letra branca, e foi devolvida na tela; a referência é um chip pastel difuso com texto escuro, sobre preto — por isso um valor só nos dois temas. Interpolação em <code>oklch</code>: no sRGB o meio do caminho entre dois matizes distantes é cinza. Sem par invertido entre temas: um degradê é opaco por natureza e lê igual nos dois. Sem tom, o fallback veste a primeira identidade — nunca há iniciais sobre cinza.
      </DocNote>

      <DocNote title="O degradê se move no cursor e no toque">
        Ele é pintado a 160% da caixa e ancorado no canto de cima; no <code>hover:</code> e no <code>active:</code> a âncora vai para o canto oposto, e a transição de <code>background-position</code> em <code>--duration-slow</code> o faz deslizar por baixo das letras. É um deslocamento, não uma troca de cor: a identidade continua a mesma. Com movimento reduzido o bloco global encurta a transição e o degradê só troca de lugar.
      </DocNote>

      <DocNote title="alt vazio é proposital">
        A foto ao lado do nome não acrescenta informação: descrevê-la faria o leitor de tela anunciar a mesma pessoa duas vezes. <code>AvatarImage</code> já traz <code>alt=&quot;&quot;</code>. Sem o nome ao lado, aí o alt precisa dizer de quem é.
      </DocNote>

      <DocNote title="A escala é de 8 em 8, não a escada de controle">
        24, 32, 40, 48 e 56. A escada 24–40 existe para botão alinhar com campo, e um avatar não disputa essa linha; só <code>xs</code>, a 24, coincide com ela.
      </DocNote>

      <DocNote title="delayMs evita o pisca das iniciais">
        Com <code>delayMs</code> no <code>AvatarFallback</code>, as iniciais só entram depois do prazo, e uma foto rápida não é precedida por um lampejo de letras. Vale em listas onde a maioria tem foto.
      </DocNote>

      <DocNote title="O que saiu, e por quê">
        O avatar já teve um modo de vidro e um anel de arco-íris para a pessoa logada. Os dois saíram: com o degradê já sendo a marca, eram três maneiras de dizer a mesma coisa. Duas versões — foto, ou iniciais sobre degradê — são o suficiente.
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
        ]}
      />
    </>
  )
}
