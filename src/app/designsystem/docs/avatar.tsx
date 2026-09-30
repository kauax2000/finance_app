"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Code } from "@/components/ui/code"
import { IDENTITY_TONES, identityToneFor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec } from "../ds-kit"

/** A escala de 8 em 8, com o corpo das iniciais que cada degrau declara. */
const SIZES = [
  { size: "xs", px: 24, texto: "text-2xs" },
  { size: "sm", px: 32, texto: "text-xs" },
  { size: "md", px: 40, texto: "text-sm" },
  { size: "lg", px: 48, texto: "text-base" },
  { size: "xl", px: 56, texto: "text-lg" },
] as const

/** As seis identidades, na ordem dos tokens — o nome é o do `globals.css`. */
const IDENTIDADES = [
  { nome: "ember", matiz: 58 },
  { nome: "gold", matiz: 100 },
  { nome: "grove", matiz: 175 },
  { nome: "ocean", matiz: 230 },
  { nome: "iris", matiz: 275 },
  { nome: "bloom", matiz: 318 },
]

/**
 * Pessoas de exemplo, passadas pelas mesmas funções que o app usa: a cor sai
 * de `identityToneFor` e as iniciais de `getInitials`. Duas têm a classe que o
 * trigger de cadastro grava; as outras caem no nome como semente.
 */
const PESSOAS = [
  { nome: "Ana Costa", gravado: "bg-red-500" },
  { nome: "Bruno Melo", gravado: "bg-sky-500" },
  { nome: "Karina Lopes", gravado: null },
  { nome: "Rafael Souza", gravado: null },
  { nome: "Tiago Farias", gravado: null },
  { nome: "Vitória", gravado: null },
]

export default function AvatarDoc() {
  return (
    <>
      <Usage>
        Identifica uma pessoa numa lista, num menu, numa transação. Duas versões, e só duas: <strong>com foto</strong> e <strong>sem foto</strong> — as iniciais em tinta escura sobre a cor chapada de identidade da pessoa. Sempre com <code>AvatarFallback</code>: a imagem pode não carregar, e um círculo vazio lê como erro. Para categoria, conta ou workspace, é o <code>ColorTile</code>.
      </Usage>

      <DocSection
        title="Tamanhos"
        description="Cinco degraus de 8 em 8, e o corpo das iniciais sobe junto. O padrão é md; o app usa xs na barra de baixo, sm nos menus e na lista de membros, e lg no cabeçalho da conta."
        code={SIZES.map((s) => `<Avatar size="${s.size}"><AvatarFallback>KL</AvatarFallback></Avatar>`).join("\n")}
        previewClassName="flex-wrap items-end gap-6"
      >
        {SIZES.map((s) => (
          <div key={s.size} className="flex flex-col items-center gap-2">
            <Avatar size={s.size}>
              <AvatarFallback>KL</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center">
              <Code variant="inline">{s.size}</Code>
              <span className="nums text-2xs text-muted-foreground">
                {s.px}px · {s.texto}
              </span>
            </div>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Foto ou iniciais"
        description="AvatarImage entra por cima, num fade curto quando termina de carregar; o fallback aparece enquanto ela não chega e fica se ela falhar."
        code={`<Avatar>
  <AvatarImage src={fotoUrl} alt="" />
  <AvatarFallback className={cn(tone.surface, tone.ink)}>
    {getInitials(nome)}
  </AvatarFallback>
</Avatar>`}
        previewClassName="gap-4"
      >
        <Avatar size="lg">
          <AvatarImage src="/icons/icon-192.png" alt="" />
          <AvatarFallback>KL</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          {/* Sem `src`, o Radix marca erro sem pedir nada à rede. */}
          <AvatarImage src="" alt="" />
          <AvatarFallback className={cn(IDENTITY_TONES[2].surface, IDENTITY_TONES[2].ink)}>
            KL
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">
          A segunda foto falhou: fica o fallback.
        </span>
      </DocSection>

      <Group
        title="Seis identidades"
        description="Uma cor chapada por pessoa, uma família cada, com os matizes de 42° a 100° uns dos outros — é o que distingue seis pessoas num relance. Cada família tem duas versões: a viva (tint=&quot;vivid&quot;, o padrão), a cor cheia com a tinta escura, e a suave (tint=&quot;soft&quot;), quase branca com a letra no tom forte da mesma família. Um valor só nos dois temas."
        layout="flow"
      >
        <Spec title="As cores" meta="--identity-1…6 · -soft · -ink" className="mb-0">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {IDENTIDADES.map((id, i) => (
              <div key={id.nome} className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <Avatar size="xl">
                    <AvatarFallback
                      className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}
                    >
                      {id.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar size="xl">
                    <AvatarFallback
                      tint="soft"
                      className={cn(IDENTITY_TONES[i].surface, IDENTITY_TONES[i].ink)}
                    >
                      {id.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-foreground">{id.nome}</span>
                  <Code variant="inline" className="text-2xs text-muted-foreground">
                    identity-{i + 1}
                  </Code>
                  <span className="nums text-2xs text-muted-foreground">{id.matiz}°</span>
                </div>
              </div>
            ))}
          </div>
        </Spec>
      </Group>

      <DocSection
        title="De onde vem a cor"
        description="identityToneFor recebe o que o perfil tem gravado e uma semente. As 17 classes que o trigger de cadastro sorteia dobram nas seis identidades pela região do matiz — quem era avermelhado segue avermelhado —, sem migrar dado nenhum. Sem nada gravado, a semente decide, e a mesma pessoa tem a mesma cor em toda carga."
        code={`import { identityToneFor } from "@/lib/avatar"
import { getInitials } from "@/lib/utils"

const tone = identityToneFor(profile.avatar_color, email)

<AvatarFallback className={cn(tone.surface, tone.ink)}>
  {getInitials(nome)}
</AvatarFallback>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {PESSOAS.map((p) => {
          const tone = identityToneFor(p.gravado, p.nome)
          return (
            <div key={p.nome} className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback className={cn(tone.surface, tone.ink)}>
                  {getInitials(p.nome)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {p.nome}
              </span>
              <Code>{p.gravado ?? "nada gravado"}</Code>
              <span className="text-2xs text-muted-foreground">→</span>
              <Code>{tone.surface}</Code>
            </div>
          )
        })}
      </DocSection>

      <DocSection
        title="Com o nome ao lado"
        description="O caso mais comum: o avatar abre um par de identidade, nome sobre e-mail, sem gap entre os dois. O nome já está dito, então a foto leva alt vazio. Enquanto o perfil não chegou, o fallback pulsa sem iniciais, como no menu da conta."
        code={`<div className="flex items-center gap-3">
  <Avatar size="sm">
    <AvatarImage src={fotoUrl} alt="" />
    {perfilPronto ? (
      <AvatarFallback className={cn(tone.surface, tone.ink)}>
        {getInitials(nome)}
      </AvatarFallback>
    ) : (
      <AvatarFallback className="animate-pulse" aria-hidden />
    )}
  </Avatar>
  <div className="min-w-0">
    <p className="truncate text-sm font-medium">{nome}</p>
    <p className="truncate text-xs text-muted-foreground">{email}</p>
  </div>
</div>`}
        previewClassName="flex-col items-start gap-4"
      >
        {[
          { nome: "Karina Lopes", email: "karina@exemplo.com", pronto: true },
          { nome: "", email: "", pronto: false },
        ].map((u, i) => {
          const tone = identityToneFor(null, u.nome)
          return (
            <div key={i} className="flex items-center gap-3">
              <Avatar size="sm">
                {u.pronto ? (
                  <AvatarFallback className={cn(tone.surface, tone.ink)}>
                    {getInitials(u.nome)}
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="animate-pulse" aria-hidden />
                )}
              </Avatar>
              {u.pronto ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{u.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">carregando o perfil</span>
              )}
            </div>
          )
        })}
      </DocSection>

      <DocNote title="alt é obrigatório, e ao lado do nome ele é vazio">
        <code>AvatarImage</code> exige <code>alt</code> no tipo: um padrão silencioso deixava foto sem nome nenhum. Ao lado do nome, escreva <code>alt=&quot;&quot;</code> — descrever a foto faria o leitor de tela anunciar a mesma pessoa duas vezes. Sozinho, o avatar leva o nome da pessoa no <code>alt</code>.
      </DocNote>

      <DocNote title="Uma forma só, o círculo">
        Retrato é redondo. O canto arredondado é a família do <code>ColorTile</code> e da marca de workspace, que identificam <strong>coisa</strong> e não pessoa — o <code>shape=&quot;rounded&quot;</code> saiu na rodada 85 porque duas peças com o mesmo canto numa lista apagavam essa diferença.
      </DocNote>

      <DocNote title="A escala é de 8 em 8, não a escada de controle">
        A escada 24–40 existe para botão alinhar com campo, e um avatar não disputa essa linha: numa lista 40 é teto, não meio. Só <code>xs</code>, a 24, coincide com ela — o caso em que o avatar mora dentro de uma linha de controle.
      </DocNote>

      <DocNote title="delayMs evita o lampejo das iniciais">
        Com <code>delayMs</code> no <code>AvatarFallback</code>, as iniciais só entram depois do prazo, e uma foto rápida não é precedida por letras piscando. Vale em listas onde a maioria tem foto.
      </DocNote>

      <DocNote title="Já foi mais complicado, e ficou simples de propósito">
        O avatar teve um modo de vidro, um anel de arco-íris para a pessoa logada e, por três rodadas, um degradê radial com grão e ponto de luz no lugar da cor. Saíram todos a pedido: as cores de hoje são a parada do meio daquele degradê. As medições daquele tempo estão na rodada 87 do histórico, para quem quiser repor movimento aqui.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "Avatar · size",
            type: '"xs" | "sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "24, 32, 40, 48 e 56, com o corpo das iniciais junto.",
          },
          {
            prop: "AvatarImage · alt",
            type: "string",
            description: 'Obrigatório. "" ao lado do nome; o nome quando o avatar está sozinho.',
          },
          {
            prop: "AvatarFallback · className",
            type: "string",
            default: "identidade 1",
            description: "Recebe cn(tone.surface, tone.ink) de identityToneFor: a classe identity-N declara a família.",
          },
          {
            prop: "AvatarFallback · tint",
            type: '"vivid" | "soft"',
            default: '"vivid"',
            description: "vivid é a cor cheia com a tinta escura (7,44 a 8,95:1); soft é quase branca, com a letra no tom forte da família (6,50 a 7,68:1).",
          },
          {
            prop: "AvatarFallback · delayMs",
            type: "number",
            description: "Espera antes de mostrar as iniciais, para uma foto rápida não piscar letras.",
          },
        ]}
      />
    </>
  )
}
