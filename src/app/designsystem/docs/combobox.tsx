"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxActions,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxField,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxLoading,
  ComboboxSeparator,
  ComboboxTextField,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { ColorTile } from "@/components/ui/color-tile"
import { Label } from "@/components/ui/label"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const CATEGORIAS = [
  { value: "mercado", label: "Mercado", cor: TILE_PALETTE[7].hex, lancamentos: 23 },
  { value: "transporte", label: "Transporte", cor: TILE_PALETTE[1].hex, lancamentos: 14 },
  { value: "restaurantes", label: "Restaurantes", cor: TILE_PALETTE[5].hex, lancamentos: 9 },
  { value: "assinaturas", label: "Assinaturas", cor: TILE_PALETTE[3].hex, lancamentos: 6 },
  { value: "saude", label: "Saúde", cor: TILE_PALETTE[0].hex, lancamentos: 4 },
  { value: "educacao", label: "Educação", cor: TILE_PALETTE[2].hex, lancamentos: 2 },
  { value: "lazer", label: "Lazer", cor: TILE_PALETTE[4].hex, lancamentos: 7 },
  { value: "casa", label: "Casa", cor: TILE_PALETTE[6].hex, lancamentos: 5 },
]

const SEM_CATEGORIA = "__sem__"

const rotulo = (v: string) =>
  v === SEM_CATEGORIA ? "Sem categoria" : CATEGORIAS.find((c) => c.value === v)?.label
const corDe = (v: string) => CATEGORIAS.find((c) => c.value === v)?.cor

/** A lista inteira de categorias, como linhas — o miolo de quase toda demo. */
function LinhasCategorias({ comCor = false }: { comCor?: boolean }) {
  return (
    <ComboboxGroup>
      {CATEGORIAS.map((c) => (
        <ComboboxItem
          key={c.value}
          value={c.value}
          media={comCor ? <ColorTile size="xs" color={c.cor} /> : undefined}
        >
          {c.label}
        </ComboboxItem>
      ))}
    </ComboboxGroup>
  )
}

export default function ComboboxDoc() {
  return (
    <>
      <Usage>
        Um <code>Select</code> com busca, para quando a pessoa procura um nome
        — categoria, carteira —: digitar três letras vence rolar procurando.
        Número, mês ou periodicidade, mesmo com 31 opções, é <code>Select</code>;
        lista longa <em>e</em> painel com rodapé próprio,{" "}
        <code>FormPickerPopover</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O gatilho é um campo, não um botão: ao lado de um Select ele é indistinguível até abrir. A busca é a do projeto e ignora acento — saude acha Saúde —, e a linha deriva a palavra-chave do próprio rótulo, porque num combobox de verdade o value é a chave de máquina."
        code={`<Combobox value={value} onValueChange={setValue}>
  <ComboboxField>
    <ComboboxTrigger>
      <ComboboxValue placeholder="Escolher categoria">
        {rotulo(value)}
      </ComboboxValue>
    </ComboboxTrigger>
  </ComboboxField>
  <ComboboxContent>
    <ComboboxInput placeholder="Buscar categoria…" />
    <ComboboxList>
      <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
      <ComboboxGroup>
        {CATEGORIAS.map((c) => (
          <ComboboxItem key={c.value} value={c.value}>{c.label}</ComboboxItem>
        ))}
      </ComboboxGroup>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
        previewClassName="items-start gap-6 p-6"
      >
        <ComboboxPadrao />
      </DocSection>

      <DocSection
        title="Altura"
        description="A mesma escada do Input e do SelectTrigger, com os mesmos nomes: sm 28, md 32, lg 36, xl 40. Num apontador grosso os três degraus de baixo sobem ao piso de 40."
        code={`<ComboboxTrigger size="sm" />
<ComboboxTrigger size="md" />  {/* o padrão */}
<ComboboxTrigger size="lg" />
<ComboboxTrigger size="xl" />`}
        previewClassName="flex-col items-start gap-4 p-6"
      >
        <ComboboxDegrau />
      </DocSection>

      <DocSection
        title="Linha com mídia e descrição"
        description="media põe o ladrilho da categoria à esquerda — o ColorTile xs, o de dentro de uma linha — e description a linha de explicação embaixo, sem gap entre as duas. O mesmo ladrilho entra no gatilho pelo media do ComboboxValue, que é prop e não filho: dentro do texto que trunca, ele empilharia sobre o rótulo."
        code={`<ComboboxItem
  value={c.id}
  media={<ColorTile size="xs" color={c.color} />}
  description={\`\${c.lancamentos} lançamentos no mês\`}
>
  {c.name}
</ComboboxItem>`}
        previewClassName="items-start p-6"
      >
        <ComboboxComMidia />
      </DocSection>

      <DocSection
        title="Opção de ausência"
        description="variant=&quot;none&quot; é a escolha de não escolher — Sem categoria —, esmaecida na lista e no gatilho (ComboboxValue none), com o próprio separador. Em multiple ela é exclusiva: escolhê-la solta as outras, e escolher outra a solta."
        code={`<ComboboxItem value="__sem__" variant="none">Sem categoria</ComboboxItem>
<ComboboxSeparator />
…
<ComboboxValue none={value === "__sem__"}>{rotulo(value)}</ComboboxValue>`}
        previewClassName="items-start p-6"
      >
        <ComboboxAusencia />
      </DocSection>

      <DocSection
        title="Várias escolhas, com fichas e ações"
        description="Com multiple o valor é uma lista, o painel não fecha ao escolher e o tique fica aceso. ComboboxActions põe Selecionar tudo e Limpar no topo — e, com busca, selecionar os visíveis. ComboboxChips mostra as escolhas em fichas removíveis embaixo do campo, recolhendo em +N. É o filtro de categorias das transações."
        code={`<Combobox multiple value={values} onValueChange={setValues}>
  <ComboboxField>
    <ComboboxTrigger>
      <ComboboxValue placeholder="Todas as categorias" overflowCount={values.length - 1}>
        {rotulo(values[0])}
      </ComboboxValue>
    </ComboboxTrigger>
    <ComboboxClear />
  </ComboboxField>
  <ComboboxContent>
    <ComboboxInput />
    <ComboboxActions />
    <ComboboxList>…</ComboboxList>
  </ComboboxContent>
  <ComboboxChips labelFor={rotulo} className="mt-2" />
</Combobox>`}
        previewClassName="items-start p-6"
      >
        <ComboboxMultiplo />
      </DocSection>

      <DocSection
        title="Limpar"
        description="ComboboxClear é irmão do gatilho, não filho — button não aninha em button. Ele some quando não há o que limpar, e o campo recolhe o recuo junto."
        code={`<ComboboxField>
  <ComboboxTrigger>…</ComboboxTrigger>
  <ComboboxClear />
</ComboboxField>`}
        previewClassName="items-start p-6"
      >
        <ComboboxLimpavel />
      </DocSection>

      <DocSection
        title="Criar pela busca"
        description="ComboboxCreate: quando a busca não casa com nenhuma linha, a última vira Criar “Farmácia” — no lugar do vazio. Quem cria é quem chama: onCreate recebe o texto, grava e escolhe o novo valor. Digite um nome que não está na lista."
        code={`<ComboboxList>
  <ComboboxGroup>…</ComboboxGroup>
  <ComboboxCreate onCreate={(nome) => criarCategoria(nome)} />
</ComboboxList>`}
        previewClassName="items-start p-6"
      >
        <ComboboxCriar />
      </DocSection>

      <DocSection
        title="Recentes no topo"
        description="ComboboxGroup recent é o grupo das usadas há pouco, antes da lista inteira. Ele some ao digitar — buscando, a lista inteira já acha — e o mesmo item nos dois grupos não acende duas vezes."
        code={`<ComboboxGroup heading="Usadas recentemente" recent>
  <ComboboxItem value="mercado">Mercado</ComboboxItem>
</ComboboxGroup>
<ComboboxGroup heading="Todas">…</ComboboxGroup>`}
        previewClassName="items-start p-6"
      >
        <ComboboxRecentes />
      </DocSection>

      <DocSection
        title="Campo que digita"
        description="variant=&quot;input&quot; com ComboboxTextField: o próprio campo é a busca. Digitar abre a lista embaixo, as setas andam por ela, Enter escolhe e o campo passa a mostrar o escolhido; Esc fecha. Uma escolha só. A busca ignora acento — tente saude."
        code={`<Combobox variant="input" value={value} onValueChange={setValue}>
  <ComboboxField>
    <ComboboxTextField placeholder="Digite uma categoria" />
    <ComboboxClear />
  </ComboboxField>
  <ComboboxContent>
    <ComboboxList>…</ComboboxList>
  </ComboboxContent>
</Combobox>`}
        previewClassName="items-start p-6"
      >
        <ComboboxDigitavel />
      </DocSection>

      <DocSection
        title="Carregando"
        description="Para lista que vem do servidor. Com shouldFilter desligado, quem filtra é a consulta e não o cmdk."
        code={`<ComboboxContent commandProps={{ shouldFilter: false }}>
  <ComboboxInput placeholder="Buscar no servidor…" />
  <ComboboxList>
    {carregando ? (
      <ComboboxLoading>
        <Spinner /> Buscando…
      </ComboboxLoading>
    ) : (
      <ComboboxEmpty>Nada encontrado.</ComboboxEmpty>
    )}
  </ComboboxList>
</ComboboxContent>`}
        previewClassName="items-start p-6"
      >
        <ComboboxAssincrono />
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "value",
            type: "string | string[]",
            description:
              "O valor selecionado. Vira lista quando multiple está ligado.",
          },
          {
            prop: "onValueChange",
            type: "(v: string) => void | (v: string[]) => void",
            description: "Chamado ao escolher; fecha o popover, exceto em multiple.",
          },
          {
            prop: "multiple",
            type: "boolean",
            default: "false",
            description:
              "Várias escolhas. Precisa ser um literal para o tipo estreitar.",
          },
          {
            prop: "open / onOpenChange",
            type: "boolean / (open) => void",
            description: "Estado do popover, se precisar controlá-lo.",
          },
          {
            prop: "modal",
            type: "boolean",
            default: "no telefone",
            description: "Trava a rolagem de trás, para rolar a lista não arrastar a folha.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "No ComboboxTrigger e no ComboboxTextField. A escada do sistema.",
          },
          {
            prop: "variant",
            type: '"select" | "input"',
            default: '"select"',
            description: "input: o campo é a busca (ComboboxTextField), sem pílula no painel. Uma escolha só.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "ComboboxField",
            type: "div · PopoverAnchor",
            description: "A casca do campo; obrigatória com ComboboxClear, ancora a largura do painel.",
          },
          {
            prop: "ComboboxTrigger",
            type: "button",
            description: "O campo, com a régua de lib/field-classes do Input e do SelectTrigger.",
          },
          {
            prop: "ComboboxValue",
            type: "span",
            description:
              "Placeholder, truncagem e o resumo +N. O rótulo continua vindo de quem chama.",
          },
          {
            prop: "ComboboxClear",
            type: "Button",
            description: "O × que limpa. Some sozinho quando não há seleção.",
          },
          {
            prop: "ComboboxContent",
            type: "PopoverContent + Command",
            description:
              "O painel. commandProps chega à raiz do cmdk — shouldFilter, por exemplo.",
          },
          {
            prop: "ComboboxLoading",
            type: "Command.Loading",
            description: "Para lista assíncrona.",
          },
          {
            prop: "ComboboxItem",
            type: 'media · description · variant "none" · textValue',
            description:
              "O ladrilho à esquerda, a linha de explicação, a ausência (exclusiva em multiple) e o texto quando children não é texto.",
          },
          {
            prop: "ComboboxChips",
            type: "labelFor(value) · max",
            default: "max 6",
            description: "As escolhas de multiple em fichas removíveis, embaixo do campo, recolhendo em +N.",
          },
          {
            prop: "ComboboxActions",
            type: "div",
            description: "Selecionar tudo (ou os visíveis, com busca) e Limpar, no topo da lista de multiple.",
          },
          {
            prop: "ComboboxCreate",
            type: "onCreate(texto) · children(texto)",
            description: "A linha de criar, quando nada casa. Fecha o painel numa escolha só.",
          },
          {
            prop: "ComboboxGroup recent",
            type: "boolean",
            description: "O grupo das usadas há pouco; some ao digitar.",
          },
          {
            prop: "ComboboxTextField",
            type: "Command.Input",
            description: "O campo que é a busca, para variant=\"input\".",
          },
        ]}
      />

      <DocNote title="Quem chama fornece o rótulo">
        O conteúdo do popover só <strong>monta quando ele abre</strong>, então
        um item não pode registrar o próprio rótulo: um combobox nunca aberto
        não teria o que mostrar em <code>ComboboxValue</code>.
      </DocNote>

      <DocNote title="multiple precisa de um literal">
        <code>{"<Combobox multiple={umBooleano}>"}</code> não estreita a união
        discriminada. Escreva <code>multiple</code> ou{" "}
        <code>{"multiple={true}"}</code>, ou faça duas chamadas.
      </DocNote>

      <DocNote title="O tique não escreve aria-selected">
        O cmdk usa <code>aria-selected</code> para a linha <em>realçada</em> pela
        seta, não para a escolhida. Sobrescrevê-lo apagaria o cursor de teclado
        do leitor de tela; quem diz “escolhido” é um rótulo{" "}
        <code>sr-only</code> ao lado do ícone.
      </DocNote>

      <DocNote title="O Enter já está resolvido">
        A busca do cmdk toma o Enter para escolher, e mora num popover
        portalizado, fora do <code>{"<form>"}</code> no DOM: o navegador não a
        conta como campo do formulário, e o Enter fica com a lista.
      </DocNote>

      <DocNote title="Uma placa, com a busca dentro">
        Aberto, o <code>Combobox</code> é a placa do popover com a <strong>pílula</strong> de busca e a lista <strong>dentro</strong> dela — a forma do <code>SearchInput surface=&quot;plate&quot;</code> num popover, que a página do <code>SearchInput</code> demonstra, medida a medida: a pílula de 32 a 8px das bordas, linhas de 36 com o texto a 16px, 8px embaixo. A pílula é o próprio <code>SearchInput</code>, com o anel de foco e o × de limpar. O <code>Command</code> de dentro não pinta — placa em volta de placa seria a placa dupla que a régua proíbe. Até a rodada 197 ele foi a pilha da paleta (pílula e placa soltas); o dono quis a busca dentro. Ele continua ancorado ao gatilho, com a largura dele, e abre com o primeiro valor realçado, como um select.
      </DocNote>

      <DocNote title="Combobox, Select ou FormPickerPopover">
        <code>Select</code> quando a lista é curta ou se pula por digitação (os
        31 dias do cartão); <code>Combobox</code> quando a pessoa procura um
        nome; <code>FormPickerPopover</code> quando a lista é longa <em>e</em> o
        painel precisa de rodapé com ação. O <code>ComboboxCreate</code> cria
        pela busca, sem rodapé.
      </DocNote>

      <DocNote title="As fichas moram fora do campo">
        O gatilho é um <code>&lt;button&gt;</code>, e o × de cada ficha é outro
        — botão não aninha em botão. Por isso <code>ComboboxChips</code> fica
        embaixo, dentro do <code>Combobox</code> (ele lê as escolhas pelo
        contexto), e o rótulo de cada ficha vem de quem chama, como o do
        <code>ComboboxValue</code>.
      </DocNote>
    </>
  )
}

function ComboboxPadrao() {
  const [value, setValue] = React.useState("")

  return (
    <>
      <div className="flex w-56 flex-col gap-1.5">
        <Label htmlFor="ds-combobox">Categoria</Label>
        <Combobox value={value} onValueChange={setValue}>
          <ComboboxField>
            <ComboboxTrigger id="ds-combobox">
              <ComboboxValue placeholder="Escolher categoria">
                {rotulo(value)}
              </ComboboxValue>
            </ComboboxTrigger>
          </ComboboxField>
          <ComboboxContent>
            <ComboboxInput placeholder="Buscar categoria…" />
            <ComboboxList>
              <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
              <ComboboxGroup>
                {CATEGORIAS.map((c) => (
                  <ComboboxItem key={c.value} value={c.value}>
                    {c.label}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* O vizinho que prova a régua: os dois campos têm de ser a mesma
          superfície, no mesmo tema. */}
      <div className="flex w-56 flex-col gap-1.5">
        <Label htmlFor="ds-combobox-select">Um Select ao lado</Label>
        <Select>
          <SelectTrigger id="ds-combobox-select" className="w-full">
            <SelectValue placeholder="Escolher conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="corrente">Conta corrente</SelectItem>
            <SelectItem value="poupanca">Poupança</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function ComboboxDegrau() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg" | "xl">("md")
  const [value, setValue] = React.useState("")

  return (
    <>
      <Controles
        inicio={<Eixo rotulo="size" valores={["sm", "md", "lg", "xl"] as const} valor={size} onChange={setSize} />}
      />
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField className="max-w-56">
          <ComboboxTrigger size={size} aria-label="Categoria">
            <ComboboxValue placeholder="Categoria">{rotulo(value)}</ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput />
          <ComboboxList>
            <ComboboxEmpty />
            <LinhasCategorias />
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  )
}

function ComboboxComMidia() {
  const [value, setValue] = React.useState("mercado")
  const cor = corDe(value)

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-midia">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-midia">
            <ComboboxValue
              placeholder="Escolher categoria"
              media={cor ? <ColorTile size="xs" color={cor} /> : undefined}
            >
              {rotulo(value)}
            </ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoria…" />
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <ComboboxGroup>
              {CATEGORIAS.map((c) => (
                <ComboboxItem
                  key={c.value}
                  value={c.value}
                  media={<ColorTile size="xs" color={c.cor} />}
                  description={`${c.lancamentos} lançamentos no mês`}
                >
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function ComboboxAusencia() {
  const [value, setValue] = React.useState(SEM_CATEGORIA)

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-ausencia">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-ausencia">
            <ComboboxValue placeholder="Escolher categoria" none={value === SEM_CATEGORIA}>
              {rotulo(value)}
            </ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoria…" />
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxItem value={SEM_CATEGORIA} variant="none">
                Sem categoria
              </ComboboxItem>
            </ComboboxGroup>
            <ComboboxSeparator />
            <LinhasCategorias comCor />
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function ComboboxMultiplo() {
  const [values, setValues] = React.useState<string[]>(["mercado", "lazer", "casa"])

  return (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-multi">Categorias do filtro</Label>
      <Combobox multiple value={values} onValueChange={setValues}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-multi">
            <ComboboxValue
              placeholder="Todas as categorias"
              none={values[0] === SEM_CATEGORIA}
              overflowCount={Math.max(0, values.length - 1)}
            >
              {rotulo(values[0] ?? "")}
            </ComboboxValue>
          </ComboboxTrigger>
          <ComboboxClear />
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoria…" />
          <ComboboxActions />
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxItem value={SEM_CATEGORIA} variant="none">
                Sem categoria
              </ComboboxItem>
            </ComboboxGroup>
            <ComboboxSeparator />
            <LinhasCategorias comCor />
          </ComboboxList>
        </ComboboxContent>
        <ComboboxChips
          labelFor={(v) => rotulo(v) ?? v}
          mediaFor={(v) => (corDe(v) ? <ColorTile size="xs" color={corDe(v)} className="size-3.5" /> : null)}
          max={3}
          className="mt-1"
        />
      </Combobox>
    </div>
  )
}

function ComboboxCriar() {
  const [lista, setLista] = React.useState(CATEGORIAS.map((c) => ({ value: c.value, label: c.label })))
  const [value, setValue] = React.useState("")
  const nome = lista.find((c) => c.value === value)?.label

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-criar">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-criar">
            <ComboboxValue placeholder="Escolher ou criar">{nome}</ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar ou criar…" />
          <ComboboxList>
            <ComboboxGroup>
              {lista.map((c) => (
                <ComboboxItem key={c.value} value={c.value}>
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxCreate
              onCreate={(texto) => {
                const novo = { value: `nova-${lista.length}`, label: texto }
                setLista((atual) => [...atual, novo])
                setValue(novo.value)
              }}
            />
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

const RECENTES = ["mercado", "restaurantes", "transporte"]

function ComboboxRecentes() {
  const [value, setValue] = React.useState("")

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-recentes">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-recentes">
            <ComboboxValue placeholder="Escolher categoria">{rotulo(value)}</ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoria…" />
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <ComboboxGroup heading="Usadas recentemente" recent>
              {RECENTES.map((v) => (
                <ComboboxItem key={v} value={v} media={<ColorTile size="xs" color={corDe(v)} />}>
                  {rotulo(v)}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxGroup heading="Todas">
              {CATEGORIAS.map((c) => (
                <ComboboxItem key={c.value} value={c.value} media={<ColorTile size="xs" color={c.cor} />}>
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function ComboboxDigitavel() {
  const [value, setValue] = React.useState("")

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-digita">Categoria</Label>
      <Combobox variant="input" value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTextField id="ds-combobox-digita" placeholder="Digite uma categoria" />
          <ComboboxClear />
        </ComboboxField>
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <LinhasCategorias comCor />
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function ComboboxLimpavel() {
  const [value, setValue] = React.useState("restaurantes")

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-clear">Categoria (opcional)</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-clear">
            <ComboboxValue placeholder="Sem categoria">
              {rotulo(value)}
            </ComboboxValue>
          </ComboboxTrigger>
          <ComboboxClear />
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoria…" />
          <ComboboxList>
            <ComboboxEmpty>Nenhuma categoria com esse nome.</ComboboxEmpty>
            <ComboboxGroup>
              {CATEGORIAS.map((c) => (
                <ComboboxItem key={c.value} value={c.value}>
                  {c.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

function ComboboxAssincrono() {
  const [value, setValue] = React.useState("")
  const [busca, setBusca] = React.useState("")
  const [carregando, setCarregando] = React.useState(false)

  React.useEffect(() => {
    if (!busca) {
      setCarregando(false)
      return
    }
    setCarregando(true)
    const id = setTimeout(() => setCarregando(false), 600)
    return () => clearTimeout(id)
  }, [busca])

  const resultados = busca
    ? CATEGORIAS.filter((c) =>
        c.label.toLowerCase().includes(busca.toLowerCase())
      )
    : CATEGORIAS

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-async">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-async">
            <ComboboxValue placeholder="Buscar no servidor">
              {rotulo(value)}
            </ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent commandProps={{ shouldFilter: false }}>
          <ComboboxInput
            value={busca}
            onValueChange={setBusca}
            placeholder="Digite para buscar…"
          />
          <ComboboxList>
            {carregando ? (
              <ComboboxLoading>
                <Spinner className="size-4" />
                Buscando…
              </ComboboxLoading>
            ) : resultados.length === 0 ? (
              <ComboboxEmpty>Nada encontrado no servidor.</ComboboxEmpty>
            ) : (
              <ComboboxGroup>
                {resultados.map((c) => (
                  <ComboboxItem key={c.value} value={c.value}>
                    {c.label}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
