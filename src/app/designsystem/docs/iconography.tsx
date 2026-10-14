"use client"

// A demo mostra cada degrau no conjunto que lhe corresponde, e não a mesma
// arte reduzida — que é justamente o erro que esta página existe para evitar.
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
  CheckIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  ReceiptPercentIcon,
  TrashIcon,
  WalletIcon,
  WalletIcon as WalletMicroIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"
import { WalletIcon as WalletMiniIcon } from "@heroicons/react/20/solid"
import { WalletIcon as WalletOutlineIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Code } from "@/components/ui/code"
import {
  MAIN_NAVIGATION,
  MEMBERS_NAV_ITEM,
  SETTINGS_NAV_ITEM,
} from "@/config/navigation"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

/** A escada: o corpo decide o conjunto, e cada degrau desenha o seu. */
const SIZES = [
  { cls: "size-3", px: 12, set: "16/solid", nome: "micro", use: 'dentro de Badge e de Button size="xs"', Glifo: WalletMicroIcon },
  { cls: "size-3.5", px: 14, set: "16/solid", nome: "micro", use: 'Button size="sm"', Glifo: WalletMicroIcon },
  { cls: "size-4", px: 16, set: "16/solid", nome: "micro", use: "o padrão: botão, item de menu, campo", Glifo: WalletMicroIcon },
  { cls: "size-5", px: 20, set: "20/solid", nome: "mini", use: "cabeçalho de cartão, item de lista", Glifo: WalletMiniIcon },
  { cls: "size-6", px: 24, set: "24/outline", nome: "outline", use: "estado vazio, destaque, navegação", Glifo: WalletOutlineIcon },
]

/** Um ícone por ação, em todo o app — os mais usados, contados no código. */
const ACOES = [
  [PlusIcon, "criar"],
  [PencilIcon, "editar"],
  [TrashIcon, "excluir"],
  [XMarkIcon, "fechar, limpar"],
  [CheckIcon, "confirmar, escolhido"],
  [EllipsisHorizontalIcon, "mais ações"],
  [ArrowPathIcon, "tentar de novo"],
  [MagnifyingGlassIcon, "buscar"],
] as const

const DOMINIO = [
  [WalletIcon, "carteira, conta"],
  [CreditCardIcon, "cartão de crédito"],
  [ReceiptPercentIcon, "fatura, transação"],
  [BanknotesIcon, "meta, reserva"],
  [CalendarIcon, "data, vencimento"],
  [ArrowTrendingUpIcon, "subiu em relação ao anterior"],
  [ArrowTrendingDownIcon, "caiu em relação ao anterior"],
] as const

const NAVEGACAO = [...MAIN_NAVIGATION, MEMBERS_NAV_ITEM, SETTINGS_NAV_ITEM]

export default function IconographyDoc() {
  return (
    <>
      <Usage>
        Heroicons, e só. Um conjunto de ícones é uma tipografia: o que faz a interface ler como sistema é todos virem do mesmo desenho. Ícone sozinho num botão <strong>precisa</strong> de <code>aria-label</code>; ícone ao lado de texto é decoração e leva <code>aria-hidden</code>.
      </Usage>

      <Group
        title="A escada"
        description="O corpo decide o conjunto. Os três conjuntos do Heroicons são redesenhos, não escalas: o micro tem menos detalhe e traço mais grosso, para sobreviver a 16px."
        layout="flow"
      >
        <Spec title="Tamanho → conjunto" meta="@heroicons/react" className="mb-0">
          <div className="flex flex-col gap-3">
            {SIZES.map(({ cls, px, set, nome, use, Glifo }) => (
              <div
                key={cls}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3"
              >
                <span className="flex justify-center">
                  <Glifo className={`${cls} text-foreground`} aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Code variant="inline">{cls}</Code>
                    <span className="nums text-2xs text-muted-foreground">{px}px</span>
                    <Code>
                      {set} · {nome}
                    </Code>
                  </div>
                  <span className="text-xs text-muted-foreground">{use}</span>
                </div>
              </div>
            ))}
          </div>
        </Spec>
      </Group>

      <DocSection
        title="Por que o conjunto muda"
        description="O mesmo ícone a 16px nos três desenhos, ampliado em cima e no corpo real embaixo. O outline encolhido embola o traço e fica lavado ao lado do texto; o micro foi desenhado para esse corpo."
        previewClassName="flex-wrap gap-8"
      >
        {[
          { Glifo: WalletMicroIcon, rotulo: "16/solid", certo: true },
          { Glifo: WalletMiniIcon, rotulo: "20/solid encolhido", certo: false },
          { Glifo: WalletOutlineIcon, rotulo: "24/outline encolhido", certo: false },
        ].map(({ Glifo, rotulo, certo }) => (
          <div key={rotulo} className="flex flex-col items-center gap-2">
            {/* A lupa: o mesmo desenho de 16px ampliado 3×, para o traço
                ralo do outline aparecer sem precisar chegar perto da tela. */}
            <span className="flex size-16 items-center justify-center rounded-surface bg-muted/60">
              <Glifo className="size-4 scale-300 text-foreground" aria-hidden />
            </span>
            <span className="flex items-center gap-1.5 text-sm text-foreground">
              <Glifo className="size-4" aria-hidden />
              Carteira
            </span>
            <span
              className={
                certo
                  ? "text-2xs font-medium text-foreground"
                  : "text-2xs text-muted-foreground"
              }
            >
              {certo ? "✓ " : "✕ "}
              {rotulo}
            </span>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Em uso"
        description="Os componentes já dimensionam o ícone que recebem, via [&_svg:not([class*='size-'])]. Só declare size-* quando o ícone estiver solto no layout."
        code={`<Button>
  <WalletIcon aria-hidden />
  Nova carteira
</Button>

<Button variant="outline" size="icon-md" aria-label="Configurações">
  <Cog6ToothIcon aria-hidden />
</Button>`}
      >
        <Button>
          <WalletIcon aria-hidden />
          nova carteira
        </Button>
        <Button variant="outline" size="icon-md" aria-label="Configurações">
          <Cog6ToothIcon aria-hidden />
        </Button>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowTrendingUpIcon className="size-4" aria-hidden />
          12% acima da fatura anterior
        </span>
      </DocSection>

      <Group
        title="Vocabulário"
        description="O mesmo significado usa sempre o mesmo ícone. Dois ícones para excluir fazem a pessoa se perguntar se as duas ações são a mesma."
        layout="grid"
      >
        <Spec title="Ações" meta="16/solid" className="mb-0">
          <Stack className="gap-2">
            {ACOES.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="size-4 text-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="O domínio" meta="16/solid" className="mb-0">
          <Stack className="gap-2">
            {DOMINIO.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="size-4 text-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="A navegação" meta="config/navigation.ts" className="mb-0">
          <Stack className="gap-2">
            {NAVEGACAO.map(({ name, icon: Icon }) => (
              <div key={name} className="flex items-center gap-2.5">
                <Icon className="size-6 text-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Ícone como valor fica no outline, até saber onde mora">
        Config de navegação — <code>NAVIGATION</code> — não sabe em que tamanho
        será desenhada, e fica em <code>24/outline</code>, o único conjunto que se
        comporta bem em qualquer corpo. Os ícones de categoria e de carteira
        sabem: moram num <code>ColorTile</code>, que os desenha a 14 ou 16, e num
        seletor que os mostra a 20. Por isso vêm em dois conjuntos sólidos — micro
        (<code>16/solid</code>) para o ladrilho, mini (<code>20/solid</code>) para
        o seletor —, como <code>WORKSPACE_ICON_MAP</code> e{" "}
        <code>WORKSPACE_ICON_MAP_MINI</code>. Quando a tabela e o{" "}
        <code>.map()</code> moram no mesmo arquivo e o corpo está cravado ali,
        quem declara é quem desenha, e vale a escada.
      </DocNote>

      <DocNote title="Dois guardas, e dois furos que cada um pega">
        O ESLint reprova o import de outra biblioteca (<code>lucide-react</code>, <code>react-icons</code>, <code>@radix-ui/react-icons</code> e companhia). O auditor (<code>npm run ds:audit -- --rule G</code>) pega o que dependência nenhuma denuncia: <code>&lt;svg&gt;</code> colado à mão e conjunto errado para o tamanho.
      </DocNote>

      <DocNote title="A exceção é o que não é ícone">
        Marca — o logo, o wordmark, as bandeiras de cartão — e primitivo desenhado, como a roda do <code>Spinner</code>, cuja geometria é o comportamento. A lista é <code>DRAWN_SVG_FILES</code>, no auditor, e a pergunta para entrar nela é se o arquivo desenha uma marca ou um movimento. Ícone bonito de outro lugar não entra.
      </DocNote>

      <DocNote title="Círculo puro não é ícone">
        Para ponto ou marcador, <code>rounded-full</code> com cor de fundo
        desenha o mesmo sem SVG — como o ponto do rádio e o{" "}
        <code>BadgeDot</code>.
      </DocNote>
    </>
  )
}
