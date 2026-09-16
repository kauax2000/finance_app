"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ThemeToggleDoc() {
  return (
    <>
      <Usage>
        O alternador entre o tema <strong>claro e o escuro</strong>. Ele vale
        no instante em que é tocado, como um <code>Switch</code>, mas escolhe
        entre duas coisas igualmente válidas — por isso desenha as duas faces e
        acende a que está valendo. Existe <strong>um</strong> no app: no menu da
        conta, e no topo deste catálogo.
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
        description="O polegar vira a peça de vidro, como o marcador do Tabs. O corpo é o mesmo — o que entra é o aro —, e o realce chega no cursor e no toque."
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
              "O polegar veste a superfície de vidro (glass-round, porque é redondo). O corpo não muda: --glass-tone é --background opaco, a mesma cor que o polegar chapado pinta.",
          },
          {
            prop: "className",
            type: "string",
            description:
              "Classes para o trilho — e para o Skeleton que ocupa o lugar dele antes de montar.",
          },
        ]}
      />

      <DocNote title="Quem veste o vidro é o polegar, e não o trilho">
        Uma bandeja de vidro já foi medida e reprovada no <code>Menubar</code>:
        a 60% ela cai de 38 para 27 sobre a página e deixa de ler como bandeja.
        O polegar é o encaixe — ele não é clicável (o clique é da raiz), não
        carrega texto por cima, e a borda de 1px em que o aro mora já estava
        lá, então a caixa não anda um pixel.
      </DocNote>

      <DocNote title="Duas faces, e não um Switch nu">
        Num switch nu, &ldquo;marcado&rdquo; não diz se o escuro é o estado ou
        o destino. Aqui a lua e o sol ficam os dois desenhados, e o polegar
        desliza por baixo deles: o controle responde &ldquo;qual dos
        dois&rdquo;, e não &ldquo;ligado ou não&rdquo;. A semântica continua a
        de um switch — uma parada de tabulação, <code>role=&quot;switch&quot;</code>,
        Espaço para trocar.
      </DocNote>

      <DocNote title="Antes de montar, um Skeleton do mesmo tamanho">
        O servidor não sabe o tema de quem abre a página, e desenhar um palpite
        faria o polegar saltar na hidratação. Até montar, o lugar é de um{" "}
        <code>Skeleton</code> de 32×72, a medida exata do trilho.
      </DocNote>

      <DocNote title="O deslize espera dois quadros">
        O <code>next-themes</code> roda com{" "}
        <code>disableTransitionOnChange</code>, que desliga toda transição
        enquanto troca a classe do tema. A posição do polegar é aplicada dois
        quadros depois, já sem esse estilo — senão ele saltaria de um lado ao
        outro. Só a aparência é adiada: o <code>aria-checked</code> acompanha o
        tema real na hora.
      </DocNote>

      <DocNote title="Dois conjuntos de ícone no mesmo corpo">
        A face apagada é <code>24/outline</code> e a acesa é{" "}
        <code>16/solid</code>, as duas a 16px, trocando por opacidade. É contra
        a régua de iconografia, e é a única exceção nomeada no auditor: o
        Heroicons não tem <code>16/outline</code>, e o contraste entre contorno
        e preenchido é o que diz qual face vale.
      </DocNote>
    </>
  )
}
