"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["xs", "sm", "default", "lg", "xl"] as const

export default function AvatarDoc() {
  return (
    <>
      <Usage>
        Identifica uma pessoa numa lista, num menu, numa transação compartilhada.
        Sempre com <code>AvatarFallback</code>: a imagem pode não carregar, e um
        círculo vazio no lugar de alguém lê como erro.
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
        A foto de perfil ao lado do nome não acrescenta informação: descrevê-la
        faria o leitor de tela anunciar a mesma pessoa duas vezes.{" "}
        <code>AvatarImage</code> já traz <code>alt=&quot;&quot;</code>{" "}
        por
        padrão. Quando o avatar aparece <em>sem</em> o nome ao lado, aí o alt
        precisa dizer de quem é.
      </DocNote>

      <DocNote title="A cor de fundo ainda não usa os tons de identidade">
        Os exemplos acima usam <code>bg-identity-N-surface</code>, que é para
        onde isso vai. Mas <code>src/lib/avatar.ts</code>{" "}
        ainda devolve classes
        cruas do Tailwind, e a cor escolhida por cada pessoa está gravada em{" "}
        <code>profiles.avatar_color</code>{" "}
        como string de classe. A troca precisa
        de migração de dados.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"xs" | "sm" | "default" | "lg" | "xl"',
            default: '"default"',
            description: "De 24px a 56px.",
          },
        ]}
      />
    </>
  )
}
