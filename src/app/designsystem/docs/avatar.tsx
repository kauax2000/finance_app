"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

      <DocNote title="Uma forma só, o círculo">
        O <code>shape=&quot;rounded&quot;</code> existiu para o quadrado de canto arredondado que o produto desenhava, e saiu a pedido: retrato é redondo. O canto arredondado é a família do <code>ColorTile</code> e da marca de workspace, que identificam <strong>coisa</strong> e não pessoa — duas peças com o mesmo canto numa lista era exatamente o que apagava a diferença.
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
        title="Seis cores"
        description="Uma cor chapada por pessoa, com as iniciais em tinta escura. Os matizes ficam de 42° a 100° uns dos outros, que é o que distingue seis pessoas num relance."
        code={`{PESSOAS.map((iniciais, i) => (
  <Avatar key={iniciais}>
    <AvatarFallback className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}>
      {iniciais}
    </AvatarFallback>
  </Avatar>
))}`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex items-center gap-3">
          {PESSOAS.map((iniciais, i) => (
            <Avatar key={iniciais} size="lg">
              <AvatarFallback
                className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}
              >
                {iniciais}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </DocSection>

      <DocNote title="A cor vem de identityToneFor">
        <code>identityToneFor</code> devolve o par superfície + tinta; não monte classe crua. As seis são cores chapadas, uma família cada: ember, gold, grove, ocean, iris e bloom, em 0,84–0,88 de luminosidade e 0,10–0,12 de croma. <strong>Uma família por pessoa é uma inversão consciente</strong>: até a rodada 86 cada identidade misturava quatro matizes a ~90° de distância, justamente para ninguém ser dono de uma cor. Um valor só nos dois temas. Sem tom, o fallback veste a primeira identidade — nunca há iniciais sobre cinza.
      </DocNote>

      <DocNote title="Isto já foi um degradê">
        Por três rodadas a superfície foi uma mancha radial num <code>::before</code>, com grão, com um ponto de luz e, por um tempo, com movimento no cursor. O degradê foi apagado a pedido, e as cores de hoje são a <strong>parada do meio</strong> daquela mancha — a que ela mostrava em maior área, e a luminosidade que já carregava a tinta escura. Saíram o pseudo-elemento, o <code>variant</code>, os tokens de grão e de ponto de luz, e a indireção por <code>--identity-surface</code>, que existia só porque um degradê não cabe no <code>@theme inline</code>. As medições daquele tempo estão na rodada 87 do histórico, caso alguma delas volte.
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
        ]}
      />
    </>
  )
}
