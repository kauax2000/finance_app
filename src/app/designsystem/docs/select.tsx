"use client"

import {
  BanknotesIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "@heroicons/react/16/solid"

import { Field, FieldControl, FieldLabel } from "@/components/ui/field"
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** As periodicidades da assinatura, como o formulário as escreve. */
const PERIODICIDADES = [
  ["monthly", "Mensal"],
  ["bimonthly", "Bimestral"],
  ["yearly", "Anual"],
  ["weekly", "Semanal"],
] as const

/** As formas de pagamento de `lib/payment-methods`. */
const FORMAS = [
  ["pix", "PIX"],
  ["ted", "TED / débito em conta"],
  ["debit_card", "Cartão de débito"],
  ["credit_card", "Cartão de crédito"],
  ["cash", "Dinheiro"],
] as const

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1))

export default function SelectDoc() {
  return (
    <>
      <Usage>
        Escolher um valor de uma lista conhecida, sem digitar. São dois motores com a mesma cara: o <code>Select</code> desenha a lista (ícone, grupos, opção destrutiva) e o <code>NativeSelect</code> entrega o <code>&lt;select&gt;</code> do sistema, com a roda do iOS e sem JavaScript. Quando a pessoa precisa <strong>procurar</strong> um nome, o componente é o <code>Combobox</code>; quando a lista longa ainda pede um rodapé com ação (&ldquo;nova categoria&rdquo;), é o <code>FormPickerPopover</code>.
      </Usage>

      <DocSection
        title="Num campo"
        description="A forma do app: Field com FieldLabel, e o FieldControl ligando o rótulo ao gatilho. O gatilho ocupa a largura da coluna."
        code={`<Field>
  <FieldLabel>Periodicidade</FieldLabel>
  <Select defaultValue="monthly">
    <FieldControl>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
    </FieldControl>
    <SelectContent>
      <SelectItem value="monthly">Mensal</SelectItem>
    </SelectContent>
  </Select>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field className="max-w-xs">
          <FieldLabel>Periodicidade</FieldLabel>
          <Select defaultValue="monthly">
            <FieldControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FieldControl>
            <SelectContent>
              {PERIODICIDADES.map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="A escada de campo: sm 28, md 32 (o padrão), lg 36, xl 40 — os nomes e os números do Input e do Button, então um gatilho ao lado de um botão alinha sem declarar size. No toque, sm, md e lg sobem ao piso de 40."
        code={`<SelectTrigger size="sm">…</SelectTrigger>
<SelectTrigger>…</SelectTrigger>
<SelectTrigger size="lg">…</SelectTrigger>
<SelectTrigger size="xl">…</SelectTrigger>`}
        previewClassName="items-center"
      >
        {(["sm", "md", "lg", "xl"] as const).map((s) => (
          <Select key={s}>
            <SelectTrigger size={s} className="w-32" aria-label={`Periodicidade (${s})`}>
              <SelectValue placeholder={s} />
            </SelectTrigger>
            <SelectContent>
              {PERIODICIDADES.map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </DocSection>

      <DocSection
        title="Grupos"
        description="Grupos com rótulo servem quando as opções vêm de origens diferentes — despesa e receita, por exemplo. O rótulo é o Caption da tipografia, e o separador sangra até a borda do painel."
        code={`<SelectGroup>
  <SelectLabel>Despesa</SelectLabel>
  <SelectItem value="mercado">Mercado</SelectItem>
</SelectGroup>
<SelectSeparator />`}
      >
        <Select>
          <SelectTrigger className="w-56" aria-label="Categoria">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Despesa</SelectLabel>
              <SelectItem value="mercado">Mercado</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Receita</SelectLabel>
              <SelectItem value="salario">Salário</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Com ícone na opção"
        description="O ícone entra no SelectItem, antes do texto, e sobe junto para o gatilho quando a opção é escolhida. Use só se ele identifica de relance o que o texto não diz."
        code={`<SelectItem value="mercado">
  <ShoppingCartIcon aria-hidden />
  Mercado
</SelectItem>`}
      >
        <Select defaultValue="mercado">
          <SelectTrigger className="w-56" aria-label="Categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mercado">
              <ShoppingCartIcon aria-hidden />
              Mercado
            </SelectItem>
            <SelectItem value="transporte">
              <TruckIcon aria-hidden />
              Transporte
            </SelectItem>
            <SelectItem value="salario">
              <BanknotesIcon aria-hidden />
              Salário
            </SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Estados"
        description="O gatilho segue os estados do campo: vazio mostra o placeholder em cinza, aria-invalid pinta a borda e o anel de destructive (dentro de um Field quem o escreve é o FieldControl), e desabilitado ganha o preenchimento do Input desabilitado."
        code={`<SelectTrigger aria-invalid>…</SelectTrigger>
<Select disabled>…</Select>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Select>
          <SelectTrigger className="w-56" aria-label="Vazio">
            <SelectValue placeholder="Nada escolhido ainda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Alimentação</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-56" aria-invalid aria-label="Com erro">
            <SelectValue placeholder="Escolha uma categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Alimentação</SelectItem>
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger className="w-56" aria-label="Desabilitado">
            <SelectValue placeholder="Indisponível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Alimentação</SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Opção desabilitada"
        description="A opção que existe mas não vale agora fica na lista, esmaecida e sem foco, e diz por quê; some só o que não existe. Aqui, sem cartão cadastrado, não há como pagar no crédito."
        code={`<SelectItem value="credit_card" disabled>
  Cartão de crédito — cadastre um cartão
</SelectItem>`}
      >
        <Select defaultValue="pix">
          <SelectTrigger className="w-72" aria-label="Forma de pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAS.map(([v, l]) =>
              v === "credit_card" ? (
                <SelectItem key={v} value={v} disabled>
                  {l} — cadastre um cartão
                </SelectItem>
              ) : (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Opção destrutiva"
        description="Quando escolher um valor tem consequência sem volta, a opção fica em vermelho — a mesma variant do DropdownMenu e do ContextMenu. É escolha, não ação: um menu de ações é o DropdownMenu."
        code={`<SelectItem value="apagar" variant="destructive">
  Apagar junto
</SelectItem>`}
      >
        <Select defaultValue="sem-categoria">
          <SelectTrigger className="w-64" aria-label="As transações da categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sem-categoria">Ficam sem categoria</SelectItem>
            <SelectItem value="mover">Vão para outra categoria</SelectItem>
            <SelectSeparator />
            <SelectItem value="apagar" variant="destructive">
              Apagar junto
            </SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Lista longa, mas ordenada"
        description="Os 31 dias do fechamento do cartão: passando da altura disponível, a lista dissolve nas pontas, como a dos menus, com a seta de “tem mais” sobre a borda, e o dia escolhido reabre fora da zona do fade. Digitar com a lista aberta salta para a opção — “2”, “5” leva ao 25. O tamanho da lista não é o critério; o critério é a pessoa saber o que procura sem ler."
        code={`<SelectContent>
  {dias.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
</SelectContent>`}
      >
        <Select defaultValue="10">
          <SelectTrigger className="w-32" aria-label="Dia de fechamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIAS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DocSection>

      <DocNote title="Combobox quando a pessoa procura, não quando a lista cresce">
        A regra antiga dizia &ldquo;passando de umas dez opções, Combobox&rdquo;, e o próprio app a contradizia com razão: o dia do cartão tem 31 e o mês do orçamento tem 12, e ninguém busca &ldquo;25&rdquo; num campo de texto. Um número, um mês, uma periodicidade: <code>Select</code>. Um nome que a pessoa lembra pela metade — categoria, carteira, assinatura —: <code>Combobox</code>.
      </DocNote>

      <DocSection
        title="O do sistema: NativeSelect"
        description="O <select> do navegador na mesma régua de campo: superfície, anel, escada e chevron iguais aos do gatilho acima. A lista aberta é a do sistema — a roda no iPhone, o menu do sistema no Mac —, e por isso não leva ícone, opção destrutiva nem painel de vidro."
        code={`<NativeSelect defaultValue="5">
  <NativeSelectOption value="5">Dia 5</NativeSelectOption>
</NativeSelect>`}
        previewClassName="items-center"
      >
        <Select defaultValue="5">
          <SelectTrigger className="w-36" aria-label="Dia do vencimento (Select)">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 5, 10, 15, 20, 25].map((d) => (
              <SelectItem key={d} value={String(d)}>
                Dia {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NativeSelect
          aria-label="Dia do vencimento (NativeSelect)"
          className="w-36"
          defaultValue="5"
        >
          {[1, 5, 10, 15, 20, 25].map((d) => (
            <NativeSelectOption key={d} value={String(d)}>
              Dia {d}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </DocSection>

      <DocSection
        title="NativeSelect com grupos"
        description="<optgroup> é o grupo do sistema. As opções vestem as cores de sistema (Canvas e CanvasText), que seguem o color-scheme que o tema escreve na página: a lista aberta acompanha o escuro onde o navegador desenha as opções."
        code={`<NativeSelectOptGroup label="À vista">
  <NativeSelectOption value="pix">PIX</NativeSelectOption>
</NativeSelectOptGroup>`}
      >
        <NativeSelect aria-label="Forma de pagamento" className="w-64" defaultValue="pix">
          <NativeSelectOptGroup label="À vista">
            <NativeSelectOption value="pix">PIX</NativeSelectOption>
            <NativeSelectOption value="ted">TED / débito em conta</NativeSelectOption>
            <NativeSelectOption value="cash">Dinheiro</NativeSelectOption>
          </NativeSelectOptGroup>
          <NativeSelectOptGroup label="Cartão">
            <NativeSelectOption value="debit_card">Cartão de débito</NativeSelectOption>
            <NativeSelectOption value="credit_card">Cartão de crédito</NativeSelectOption>
          </NativeSelectOptGroup>
        </NativeSelect>
      </DocSection>

      <DocNote title="No NativeSelect, className veste a casca">
        O componente é um <code>&lt;div&gt;</code> com o <code>&lt;select&gt;</code> e o chevron dentro, e o <code>className</code> vai para o <code>&lt;div&gt;</code>: largura e margem se dão por ele, e o <code>&lt;select&gt;</code> ocupa a casca inteira. Todo o resto — <code>id</code>, <code>value</code>, <code>aria-*</code>, <code>disabled</code> — vai para o <code>&lt;select&gt;</code>.
      </DocNote>

      <DocNote title="A superfície flutuante é vidro de verdade">
        O painel do <code>Select</code> tem conteúdo passando por baixo, então veste a tinta flutuante: <code>--popover</code> a 85%, abrindo a 60% no escuro onde o borrão existe, com a <code>glass-surface</code> (24px de borrão e <code>saturate(1.5)</code>) e o guarda de <code>prefers-reduced-transparency</code>.
      </DocNote>

      <DocNote title="Abre abaixo do gatilho, com colisão">
        O padrão é <code>position=&quot;popper&quot;</code>. O <code>item-aligned</code> do Radix sobrepõe o gatilho e ignora <code>collisionPadding</code>, <code>side</code> e <code>sideOffset</code> — o painel sai da tela sem nada o impedir —, e abre com o item escolhido dentro do fade, porque escreve a rolagem à mão. Nenhuma tela o usa.
      </DocNote>

      <DocNote title="A lista dissolve, e a seta diz para onde">
        O viewport veste a dissolução do sistema (<code>scroll-fade-y</code> e <code>useScrollFade</code>): a zona cresce conforme cada ponta tem o que esconder, e a folga de rolagem conta a zona inteira, então nem o item reaberto nem o da navegação por seta caem no degradê. Sobre a borda que dissolve pousa uma seta (<code>ScrollFadeArrows</code>, rodada 172), a mesma de todos os dropdowns: para baixo enquanto há mais embaixo, para cima quando já se rolou. Não são as faixas de rolagem do Radix, que saíram na rodada 166: a seta não ocupa altura, não rola ao pousar e não pega o clique.
      </DocNote>

      <DocNote title="O Enter não é do formulário aqui">
        Nos dois, o Enter escolhe em vez de enviar. O <code>shouldDeferEnterToWidget</code> do <code>Form</code> reconhece o gatilho pelo <code>data-slot=&quot;select-trigger&quot;</code> e o <code>&lt;select&gt;</code> nativo pela tag.
      </DocNote>

      <DocNote title="Onde o app usa">
        <code>Select</code>: 18 gatilhos em 7 arquivos — os formulários de conta, assinatura e cartão (os 31 dias de fechamento e de vencimento), o pagamento de conta, os filtros de transação, a bandeira do cartão e o mês e ano do orçamento. <code>NativeSelect</code>: nenhuma tela; só os controles da página da <code>Sidebar</code> no catálogo. Três desvios ficam registrados: doze opções reescrevem a geometria por <code>className</code> (<code>py-2 pl-2 pr-8</code> em dez, <code>py-2.5 pl-3 pr-9</code> no mês do orçamento), contra o <code>py-1</code> e o piso de toque do componente; o pagamento de conta pinta o gatilho com <code>bg-background shadow-xs</code> por cima da superfície de campo; e ali o &ldquo;— Escolha —&rdquo; é uma opção com valor, não o <code>placeholder</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "SelectTrigger size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "O degrau da escada de campo: 28, 32, 36, 40.",
          },
          {
            prop: "SelectContent position",
            type: '"popper" | "item-aligned"',
            default: '"popper"',
            description: "Abaixo do gatilho, com colisão. item-aligned sobrepõe o gatilho e ignora a folga.",
          },
          {
            prop: "SelectItem variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description: "destructive para a escolha sem volta.",
          },
          {
            prop: "SelectItem disabled",
            type: "boolean",
            default: "false",
            description: "A opção fica na lista, esmaecida e fora do foco.",
          },
          {
            prop: "NativeSelect size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "A mesma escada do SelectTrigger.",
          },
          {
            prop: "NativeSelect className",
            type: "string",
            description: "Vai para a casca (o div), não para o elemento select. As outras props vão para o select.",
          },
        ]}
      />
    </>
  )
}
