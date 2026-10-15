"use client"

import {
  BanknotesIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "@heroicons/react/16/solid"

import { ColorTile } from "@/components/ui/color-tile"
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
import { Caption } from "@/components/ui/typography"
import { TILE_COLORS } from "@/lib/tile-palette"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** As periodicidades da assinatura, como o formulário as escreve. */
const PERIODICIDADES = [
  ["monthly", "Mensal"],
  ["bimonthly", "Bimestral"],
  ["yearly", "Anual"],
  ["weekly", "Semanal"],
] as const

/** As formas de pagamento de `lib/payment-methods`, com uma linha de explicação. */
const FORMAS = [
  ["pix", "PIX", "Cai na hora."],
  ["ted", "TED / débito em conta", "Sai direto da conta."],
  ["debit_card", "Cartão de débito", "Sai da conta na compra."],
  ["credit_card", "Cartão de crédito", "Entra na fatura do cartão."],
  ["cash", "Dinheiro", "Fora de qualquer conta."],
] as const

const CATEGORIAS = ["Alimentação", "Moradia", "Transporte", "Assinaturas", "Lazer"]

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1))

export default function SelectDoc() {
  return (
    <>
      <Usage>
        Escolher um valor de uma lista conhecida, sem digitar. São dois motores com a mesma cara: o <code>Select</code> desenha a lista (ícone, cor, grupos, descrição, opção de ausência) e o <code>NativeSelect</code> entrega o <code>&lt;select&gt;</code> do sistema, com a roda do iOS e sem JavaScript. Quando a pessoa precisa <strong>procurar</strong> um nome, o componente é o <code>Combobox</code>; quando a lista longa ainda pede um rodapé com ação (&ldquo;nova categoria&rdquo;), é o <code>FormPickerPopover</code>.
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
        title="Tamanhos e estados"
        description="A escada de campo — sm 28, md 32, lg 36 (o padrão), xl 40, os nomes e os números do Input e do Button; no toque, sm, md e lg sobem ao piso de 40. Embaixo, os três estados do gatilho: vazio mostra o placeholder, aria-invalid pinta borda e anel de destructive (num Field quem o escreve é o FieldControl), e desabilitado ganha o preenchimento do Input desabilitado."
        code={`<SelectTrigger size="sm">…</SelectTrigger>
<SelectTrigger aria-invalid>…</SelectTrigger>
<Select disabled>…</Select>`}
        previewClassName="flex-col items-start gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
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
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(
            [
              ["Vazio", "Nada escolhido ainda", false, false],
              ["Com erro", "Escolha uma categoria", true, false],
              ["Desabilitado", "Indisponível", false, true],
            ] as const
          ).map(([rotulo, placeholder, erro, off]) => (
            <Select key={rotulo} disabled={off}>
              <SelectTrigger className="w-52" aria-label={rotulo} aria-invalid={erro || undefined}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Alimentação</SelectItem>
              </SelectContent>
            </Select>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Categoria: a cor e a ausência"
        description="Categoria tem cor, e o ColorTile xs (24px) entra antes do nome, na lista e no gatilho. E a opção de não escolher nada é variant=&quot;none&quot;: esmaecida na lista e no gatilho, sem travessões, com o próprio separador. Escolha “Sem categoria” e veja o gatilho."
        code={`<SelectContent>
  <SelectItem value="__none__" variant="none">Sem categoria</SelectItem>
  {categorias.map((c) => (
    <SelectItem key={c.id} value={c.id}>
      <ColorTile size="xs" color={c.color} />
      {c.name}
    </SelectItem>
  ))}
</SelectContent>`}
      >
        <Select defaultValue="Alimentação">
          <SelectTrigger className="w-60" aria-label="Categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" variant="none">
              Sem categoria
            </SelectItem>
            {CATEGORIAS.map((c, i) => (
              <SelectItem key={c} value={c}>
                <ColorTile size="xs" color={TILE_COLORS[i]!} />
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DocSection>

      <DocNote title="A ausência é uma opção, e não o placeholder">
        Use <code>variant=&quot;none&quot;</code> quando <strong>não escolher</strong> é uma resposta válida que a pessoa pode dar de volta — &ldquo;Sem categoria&rdquo;, &ldquo;Não informado&rdquo;, &ldquo;Qualquer plano&rdquo; num filtro. Quando o campo é obrigatório e ainda está vazio, é o <code>placeholder</code> do <code>SelectValue</code>, com o valor vazio: foi o caso do pagamento de conta, que escrevia &ldquo;— Escolha —&rdquo; como uma opção que depois reprovava. O Radix não aceita item de valor vazio, então a ausência continua um sentinela da tela (<code>&quot;__none__&quot;</code>).
      </DocNote>

      <DocSection
        title="Opção com descrição"
        description="description põe uma linha de explicação embaixo do nome. Ela aparece na lista e fica fora do gatilho, que mostra só o nome — é o que a separa de escrever as duas linhas como filho."
        code={`<SelectItem value="pix" description="Cai na hora.">PIX</SelectItem>`}
      >
        <Select defaultValue="pix">
          <SelectTrigger className="w-64" aria-label="Forma de pagamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAS.map(([v, l, d]) => (
              <SelectItem key={v} value={v} description={d}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Grupos, ícones e as opções que avisam"
        description="Grupos com rótulo quando as opções vêm de origens diferentes, com o ícone antes do nome quando ele identifica de relance. Ao lado, a opção que existe mas não vale agora — na lista, esmaecida, dizendo por quê — e a escolha sem volta, em vermelho, a variant do DropdownMenu. Escolha, e não ação: um menu de ações é o DropdownMenu."
        code={`<SelectGroup>
  <SelectLabel>Despesa</SelectLabel>
  <SelectItem value="mercado"><ShoppingCartIcon aria-hidden />Mercado</SelectItem>
</SelectGroup>
<SelectItem value="credit_card" disabled>Cartão de crédito — cadastre um cartão</SelectItem>
<SelectItem value="apagar" variant="destructive">Apagar junto</SelectItem>`}
        previewClassName="flex-wrap items-center gap-3"
      >
        <Select defaultValue="mercado">
          <SelectTrigger className="w-52" aria-label="Categoria com ícone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Despesa</SelectLabel>
              <SelectItem value="mercado">
                <ShoppingCartIcon aria-hidden />
                Mercado
              </SelectItem>
              <SelectItem value="transporte">
                <TruckIcon aria-hidden />
                Transporte
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Receita</SelectLabel>
              <SelectItem value="salario">
                <BanknotesIcon aria-hidden />
                Salário
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select defaultValue="pix">
          <SelectTrigger className="w-72" aria-label="Forma de pagamento, com uma indisponível">
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
        description="Os 31 dias do fechamento do cartão: a lista para em 288px, umas nove linhas — o teto de todo dropdown —, dissolve nas pontas, como a dos menus, com a seta de “tem mais” sobre a borda, e o dia escolhido reabre fora da zona do fade. Digitar com a lista aberta salta para a opção — “2”, “5” leva ao 25. O tamanho da lista não é o critério; o critério é a pessoa saber o que procura sem ler."
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
        description="O select do navegador na mesma régua de campo: superfície, anel, escada e chevron iguais aos do gatilho — o primeiro é Select, o segundo NativeSelect. A lista aberta é a do sistema (a roda no iPhone, o menu no Mac), e por isso não leva ícone, cor, descrição nem opção destrutiva; optgroup é o grupo dela."
        code={`<NativeSelect defaultValue="5">
  <NativeSelectOption value="5">Dia 5</NativeSelectOption>
</NativeSelect>
<NativeSelectOptGroup label="À vista">…</NativeSelectOptGroup>`}
        previewClassName="flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Caption>Select</Caption>
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
        </div>
        <div className="flex flex-col gap-1.5">
          <Caption>NativeSelect</Caption>
          <NativeSelect aria-label="Dia do vencimento (NativeSelect)" className="w-36" defaultValue="5">
            {[1, 5, 10, 15, 20, 25].map((d) => (
              <NativeSelectOption key={d} value={String(d)}>
                Dia {d}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Caption>com optgroup</Caption>
          <NativeSelect aria-label="Forma de pagamento (NativeSelect)" className="w-60" defaultValue="pix">
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
        </div>
      </DocSection>

      <DocNote title="No NativeSelect, className veste a casca">
        O componente é um <code>&lt;div&gt;</code> com o <code>&lt;select&gt;</code> e o chevron dentro, e o <code>className</code> vai para o <code>&lt;div&gt;</code>: largura e margem se dão por ele. Todo o resto — <code>id</code>, <code>value</code>, <code>aria-*</code>, <code>disabled</code> — vai para o <code>&lt;select&gt;</code>. As opções vestem <code>Canvas</code>/<code>CanvasText</code>, que seguem o <code>color-scheme</code> do tema.
      </DocNote>

      <DocNote title="A opção é do componente, e a lista também">
        A opção tem <code>py-1</code>, recuo de 8 e 32 à direita para o tique, e sobe a 44px no toque; o painel tem 4px de respiro no viewport e a largura mínima do gatilho. <strong>Nada disso se reescreve na chamada</strong>: doze opções do app escreviam <code>py-2 pl-2 pr-8</code> e perdiam o piso de toque, e oito listas repetiam <code>p-1</code> (que somava 4px ao respiro) e <code>min-w-[var(--radix-select-trigger-width)]</code>. Saíram na rodada 173; o que fica numa chamada é o teto de altura (<code>max-h-*</code>) e o que é do conteúdo (<code>capitalize</code> nos meses, <code>nums</code> nos anos).
      </DocNote>

      <DocNote title="A lista dissolve, e a seta diz para onde">
        O viewport veste a dissolução do sistema: a zona cresce conforme cada ponta tem o que esconder, e a folga de rolagem conta a zona inteira, então nem o item reaberto nem o da navegação por seta caem no degradê. Sobre a borda pousa a seta de todos os dropdowns (<code>ScrollFadeArrows</code>), sem ocupar altura nem pegar clique. O painel veste a tinta flutuante de vidro, e abre em <code>position=&quot;popper&quot;</code>, abaixo do gatilho, com colisão — o <code>item-aligned</code> do Radix sobrepõe o gatilho, ignora a folga e nenhuma tela o usa.
      </DocNote>

      <DocNote title="O Enter não é do formulário aqui">
        Nos dois, o Enter escolhe em vez de enviar: o gatilho do Radix toma o Enter para abrir a lista, e o <code>&lt;select&gt;</code> nativo segue o navegador.
      </DocNote>

      <DocNote title="Onde o app usa">
        <code>Select</code>: 18 gatilhos em 7 arquivos — os formulários de conta, assinatura e cartão (os 31 dias de fechamento e de vencimento), o pagamento de conta, os filtros de transação, a bandeira do cartão e o mês e ano do orçamento. Desde a rodada 173 as sete opções de ausência são <code>variant=&quot;none&quot;</code> (&ldquo;Sem categoria&rdquo;, &ldquo;Não informado&rdquo; nas três formas de pagamento, &ldquo;Qualquer plano&rdquo;, &ldquo;Qualquer assinatura&rdquo;, &ldquo;Nenhuma&rdquo; bandeira), os dois seletores de categoria de conta mostram a cor, e o pagamento de conta perdeu o fundo e a sombra pintados por cima do campo. <code>NativeSelect</code>: nenhuma tela; só os controles da página da <code>Sidebar</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "SelectTrigger size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"lg"',
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
            type: '"default" | "destructive" | "none"',
            default: '"default"',
            description: "destructive para a escolha sem volta; none para a ausência, esmaecida e com o próprio separador.",
          },
          {
            prop: "SelectItem description",
            type: "ReactNode",
            description: "Uma linha embaixo do nome, só na lista; o gatilho mostra só o nome.",
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
            default: '"lg"',
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
