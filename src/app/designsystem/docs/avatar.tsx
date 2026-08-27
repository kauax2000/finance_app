"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const

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
