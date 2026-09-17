"use client"

import { SplitShell } from "@/components/ui/split-shell"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** Um campo de exemplo. No app, quem entra neste slot é o `AuthBrandPanel`. */
function CampoDeExemplo() {
  return (
    <aside className="brand-field flex flex-col justify-between px-6 py-6">
      <p className="text-sm font-medium text-foreground">Marca</p>
      <p className="text-sm text-muted-foreground">
        O que você tem a mostrar antes de pedir alguma coisa.
      </p>
    </aside>
  )
}

export default function SplitShellDoc() {
  return (
    <>
      <Usage>
        O casco de uma tela que existe <strong>fora</strong> da casca do app —
        acesso, convite, qualquer página sem lateral e sem topo. Um campo de um
        lado, uma coluna de conteúdo do outro. Dentro do app, o topo de tela é o{" "}
        <code>PageHeader</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O campo entra por slot e ocupa ~45% a partir de lg. Abaixo disso as duas partes empilham: o campo vira faixa no topo e a coluna ocupa o resto."
        code={`<SplitShell
  aside={<AuthBrandPanel />}
  title="Entrar"
  description="Uma conta, todas as suas carteiras."
>
  <LoginForm />
</SplitShell>`}
        previewClassName="items-stretch p-0"
      >
        <div className="h-96 overflow-hidden rounded-xl border border-border [&_[data-slot=split-shell]]:min-h-full">
          <SplitShell
            aside={<CampoDeExemplo />}
            title="Entrar"
            description="Uma conta, todas as suas carteiras."
          >
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              O formulário
            </div>
          </SplitShell>
        </div>
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "aside",
            type: "ReactNode",
            description:
              "O campo. Obrigatório, e é slot de propósito: o que ele mostra é conteúdo de produto, e conteúdo de produto não mora em ui/.",
          },
          {
            prop: "title",
            type: "string",
            description: "O H1 da coluna, em .page-title.",
          },
          {
            prop: "description",
            type: "ReactNode",
            description:
              "Uma linha sob o título. Par de identidade: sem gap entre os dois.",
          },
        ]}
      />

      <DocNote title="Não há cartão, e é a decisão que ele carrega">
        <p>
          O cartão centrado existe para dar moldura a um formulário solto no meio
          de um fundo cinza. Com o campo segurando metade da tela a moldura já
          está dada, e um retângulo com borda dentro dela é uma segunda fronteira
          para o mesmo limite — a mesma conta que tirou o fio das tiras do{" "}
          <code>Card</code>. A coluna <strong>é</strong> a superfície.
        </p>
      </DocNote>

      <DocNote title="No telefone o conteúdo encosta no topo">
        <p>
          Centrado na vertical, ele flutuava a 223px da faixa — medido a 375×812
          — e a faixa deixava de ancorar coisa nenhuma. A sobra que fica embaixo
          é onde o teclado sobe. A partir de <code>lg</code> a coluna tem altura
          inteira, e aí centrar é o certo.
        </p>
      </DocNote>

      <DocNote title="5fr 6fr, e não grid-cols-2">
        <p>
          O campo fica em ~45%. A coluna do conteúdo é a mais larga porque é ela
          que tem trabalho a fazer — o campo mostra, a coluna recebe.
        </p>
      </DocNote>
    </>
  )
}
