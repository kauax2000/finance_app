"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ThemeToggleDoc() {
  return (
    <>
      <Usage>
        O alternador entre tema <strong>claro e escuro</strong>. Vale no instante do toque, como um <code>Switch</code>, mas escolhe entre duas opções igualmente válidas, então desenha as duas faces. Existe <strong>um</strong> no app, no menu da conta; para ligar e desligar algo, use <code>Switch</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="A demonstração é o controle de verdade: tocar aqui troca o tema do catálogo inteiro."
        code={`<ThemeToggle />`}
      >
        <ThemeToggle />
      </DocSection>

      <DocSection
        title="Numa linha de menu"
        description="A forma do menu da conta: o rótulo à esquerda, o controle empurrado para a borda."
        code={`<div className="flex items-center justify-between gap-3">
  <span className="text-sm text-foreground">Tema</span>
  <ThemeToggle className="ml-auto shrink-0" />
</div>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-xs items-center justify-between gap-3">
          <span className="text-sm text-foreground">Tema</span>
          <ThemeToggle className="ml-auto shrink-0" />
        </div>
      </DocSection>

      <DocSection
        title="Vidro"
        description="O polegar vira a peça de vidro, como o marcador do Tabs; o trilho não muda."
        code={`<ThemeToggle glass />`}
      >
        <ThemeToggle glass />
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "glass",
            type: "boolean",
            description:
              "O polegar veste glass-round; o corpo mantém a cor do polegar chapado.",
          },
          {
            prop: "className",
            type: "string",
            description:
              "Classes para o trilho — e para o Skeleton que ocupa o lugar dele antes de montar.",
          },
        ]}
      />

      <DocNote title="Quem veste o vidro é o polegar, nunca o trilho">
        Bandeja de vidro perde contraste sobre a página e deixa de ler como bandeja. O polegar não é clicável nem carrega texto, e o aro mora na borda de 1px que ele já tinha, então a caixa não se move.
      </DocNote>

      <DocNote title="Duas faces, não um Switch nu">
        Num switch nu, &ldquo;marcado&rdquo; não diz se o escuro é o estado ou o destino. Aqui lua e sol ficam desenhados e o polegar desliza por baixo. A semântica segue a de switch: uma parada de tabulação, <code>role=&quot;switch&quot;</code>, Espaço para trocar.
      </DocNote>

      <DocNote title="Antes de montar, um Skeleton do mesmo tamanho">
        O servidor não sabe o tema, e um palpite faria o polegar saltar na hidratação. Até montar, o lugar é de um <code>Skeleton</code> de 32×72, a medida do trilho.
      </DocNote>

      <DocNote title="O deslize espera dois quadros">
        <code>disableTransitionOnChange</code> desliga as transições durante a troca de tema; a posição do polegar entra dois quadros depois, senão ele salta. O <code>aria-checked</code> acompanha o tema na hora.
      </DocNote>

      <DocNote title="Dois conjuntos de ícone, exceção nomeada">
        A face apagada é <code>24/outline</code> e a acesa <code>16/solid</code>, ambas a 16px. É a única exceção à régua de iconografia no auditor: não existe <code>16/outline</code>, e o contraste contorno × preenchido diz qual face vale.
      </DocNote>
    </>
  )
}
