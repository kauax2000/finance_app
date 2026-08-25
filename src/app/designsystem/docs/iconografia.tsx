"use client"

import { ArrowDownRightIcon, ArrowUpRightIcon, Cog6ToothIcon } from "@heroicons/react/16/solid"
// A demo mostra cada degrau no conjunto que lhe corresponde, e não a mesma
// arte reduzida — que é justamente o erro que esta página existe para evitar.
import { WalletIcon, WalletIcon as WalletMicroIcon } from "@heroicons/react/16/solid"
import { WalletIcon as WalletMiniIcon } from "@heroicons/react/20/solid"
import { WalletIcon as WalletOutlineIcon } from "@heroicons/react/24/outline"
import { BanknotesIcon, CalendarIcon, CreditCardIcon, ReceiptPercentIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const SIZES = [
  ["size-3", "12px", "dentro de Badge e de Button size=\"xs\""],
  ["size-3.5", "14px", "Button size=\"sm\""],
  ["size-4", "16px", "o padrão: botão, item de menu, campo"],
  ["size-5", "20px", "cabeçalho de cartão, item de lista"],
  ["size-6", "24px", "estado vazio, destaque"],
]

export default function IconografiaDoc() {
  return (
    <>
      <Usage>
        Ícone sozinho num botão <strong>precisa</strong> de <code>aria-label</code>: sem ele o leitor de tela anuncia &ldquo;botão&rdquo; e nada mais. Ícone ao lado de texto é decoração e leva <code>aria-hidden</code>.
      </Usage>

      <DocSection
        title="Tamanho"
        description="Os componentes já dimensionam o ícone que recebem, via [&_svg:not([class*='size-'])]. Só declare size-* quando o ícone estiver solto no layout."
        previewClassName="flex-col items-stretch gap-3"
      >
        <Stack className="gap-2">
          {SIZES.map(([cls, px_, use]) => (
            <div key={cls} className="flex items-center gap-3">
              {(() => {
                const px = Number(String(px_).replace("px", ""))
                const Glifo =
                  px >= 24 ? WalletOutlineIcon : px >= 20 ? WalletMiniIcon : WalletMicroIcon
                return <Glifo className={`${cls} shrink-0 text-foreground`} aria-hidden />
              })()}
              <code className="w-20 shrink-0 font-mono text-2xs text-foreground">
                {cls}
              </code>
              <span className="nums w-12 shrink-0 text-2xs text-muted-foreground">
                {px_}
              </span>
              <span className="text-xs text-muted-foreground">{use}</span>
            </div>
          ))}
        </Stack>
      </DocSection>

      <DocSection
        title="Em uso"
        code={`<Button>
  <WalletIcon aria-hidden />
  Nova carteira
</Button>

<Button size="icon" aria-label="Configurações">
  <Cog6ToothIcon aria-hidden />
</Button>`}
      >
        <Button>
          <WalletIcon aria-hidden />
          Nova carteira
        </Button>
        <Button variant="outline" size="icon" aria-label="Configurações">
          <Cog6ToothIcon aria-hidden />
        </Button>
        <span className="inline-flex items-center gap-1.5 text-sm text-income">
          <ArrowUpRightIcon className="size-4" aria-hidden />
          Entrada
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-expense">
          <ArrowDownRightIcon className="size-4" aria-hidden />
          Saída
        </span>
      </DocSection>

      <Group title="Vocabulário do domínio">
        <Spec title="Os ícones que significam algo aqui">
          <Stack className="gap-2">
            {[
              [WalletIcon, "Carteira / conta"],
              [CreditCardIcon, "Cartão de crédito"],
              [ReceiptPercentIcon, "Fatura / transação"],
              [BanknotesIcon, "Meta / reserva"],
              [CalendarIcon, "Data / vencimento"],
              [ArrowUpRightIcon, "Receita"],
              [ArrowDownRightIcon, "Despesa"],
            ].map(([Icon, label]) => {
              const Component = Icon as typeof WalletIcon
              return (
                <div key={label as string} className="flex items-center gap-2.5">
                  <Component className="size-4 text-muted-foreground" aria-hidden />
                  <span className="text-xs text-muted-foreground">
                    {label as string}
                  </span>
                </div>
              )
            })}
          </Stack>
        </Spec>
      </Group>

      <DocNote title="O conjunto muda com o tamanho, não a escala">
        Os conjuntos menores do Heroicons não são o de 24 reduzido: são{" "}
        <strong>redesenhos</strong>, e só existem em solid.{" "}
        <code>size-6</code> e acima usam <code>24/outline</code>;{" "}
        <code>size-5</code> usa o <strong>mini</strong> (<code>20/solid</code>);
        e de <code>size-4</code> para baixo é o <strong>micro</strong>{" "}
        (<code>16/solid</code>). Um ícone sem classe de tamanho também é micro —
        o componente que o contém aplica <code>size-4</code>.
      </DocNote>

      <DocNote title="Por que não dá para só encolher o outline">
        O traço do <code>24/outline</code>{" "}
        é 1,5 desenhado para 24px. A 16 ele vira 1px sobre detalhe que foi
        construído para caber em 24 — o desenho embola e o ícone fica lavado ao
        lado do texto. O micro tem menos detalhe e peso sólido justamente para
        sobreviver ali.
      </DocNote>

      <DocNote title="Ícone como valor fica no outline">
        Mapa de ícone e config de navegação — <code>CATEGORY_ICONS</code>,{" "}
        <code>WORKSPACE_ICON_MAP</code>, <code>NAVIGATION</code>{" "}
        — não sabem em que tamanho serão desenhados: quem renderiza decide. Esses
        ficam em <code>24/outline</code>, que é o único conjunto que se comporta
        bem em qualquer corpo.
      </DocNote>

      <DocNote title="Círculo puro não é ícone">
        O ponto do <code>RadioGroup</code>{" "}
        e o marcador de regra de senha eram um SVG de círculo. Heroicons não traz
        círculo puro — e nem deveria: <code>rounded-full</code>{" "}
        com cor de fundo desenha a mesma coisa sem uma requisição.
      </DocNote>

    </>
  )
}
