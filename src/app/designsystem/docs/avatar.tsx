"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["xs", "sm", "default", "lg", "xl"] as const

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

      <DocNote title="A cor de fundo ainda não usa os tons de identidade">
        Os exemplos usam <code>bg-identity-N-surface</code>, que é o destino. <code>src/lib/avatar.ts</code> ainda devolve classes cruas do Tailwind — a troca precisa de migração de dados, e está em <strong>Cores</strong>.
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
