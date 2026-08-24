"use client"

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CreditCardIcon,
  PiggyBankIcon,
  ReceiptIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react"

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
        Um ícone sozinho num botão <strong>precisa</strong> de{" "}
        <code>aria-label</code>: sem ele o leitor de tela anuncia
        &ldquo;botão&rdquo; e nada mais. Um ícone ao lado de texto é decoração e
        leva <code>aria-hidden</code>, senão o rótulo é lido duas vezes.
      </Usage>

      <DocSection
        title="Tamanho"
        description="Os componentes já dimensionam o ícone que recebem, via [&_svg:not([class*='size-'])]. Só declare size-* quando o ícone estiver solto no layout."
        previewClassName="flex-col items-stretch gap-3"
      >
        <Stack className="gap-2">
          {SIZES.map(([cls, px, use]) => (
            <div key={cls} className="flex items-center gap-3">
              <WalletIcon className={`${cls} shrink-0 text-foreground`} aria-hidden />
              <code className="w-20 shrink-0 font-mono text-2xs text-foreground">
                {cls}
              </code>
              <span className="nums w-12 shrink-0 text-2xs text-muted-foreground">
                {px}
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
  <SettingsIcon aria-hidden />
</Button>`}
      >
        <Button>
          <WalletIcon aria-hidden />
          Nova carteira
        </Button>
        <Button variant="outline" size="icon" aria-label="Configurações">
          <SettingsIcon aria-hidden />
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
              [ReceiptIcon, "Fatura / transação"],
              [PiggyBankIcon, "Meta / reserva"],
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

      <DocNote title="O projeto usa duas bibliotecas de ícones">
        <code>components.json</code> declara <code>lucide</code>, e é o que os
        componentes do registry trazem. Mas Heroicons aparece em 88 arquivos
        contra 40 do Lucide — inclusive dentro de <code>components/ui/</code>, em{" "}
        <code>page-header.tsx</code>. As duas famílias têm gramática diferente
        (traço, cantos, grade), e misturá-las na mesma tela se nota. Unificar é
        uma migração grande e está no relatório de conformidade; até lá, a regra
        é <strong>não misturar dentro de uma mesma tela</strong>.
      </DocNote>
    </>
  )
}
