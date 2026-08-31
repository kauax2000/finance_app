"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxField,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxLoading,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CATEGORIAS = [
  { value: "mercado", label: "Mercado" },
  { value: "transporte", label: "Transporte" },
  { value: "restaurantes", label: "Restaurantes" },
  { value: "assinaturas", label: "Assinaturas" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "lazer", label: "Lazer" },
  { value: "casa", label: "Casa" },
]

const rotulo = (v: string) => CATEGORIAS.find((c) => c.value === v)?.label

export default function ComboboxDoc() {
  return (
    <>
      <Usage>
        Um <code>Select</code> com busca. A partir de umas dez opções, rolar
        procurando um nome é pior que digitar três letras: categoria, cartão,
        membro. Abaixo disso é <code>Select</code>; quando a lista é longa{" "}
        <em>e</em> o painel precisa de rodapé próprio, é{" "}
        <code>FormPickerPopover</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O gatilho é o campo. Ao lado de um Select ele tem de ser indistinguível — até abrir."
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
        description="A mesma escada do Input e do SelectTrigger, com os mesmos nomes: sm 28, md 32, lg 36, xl 40."
        code={`<ComboboxTrigger size="sm" />
<ComboboxTrigger size="md" />  {/* o padrão */}
<ComboboxTrigger size="lg" />
<ComboboxTrigger size="xl" />`}
        previewClassName="flex-col items-stretch gap-3 p-6"
      >
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <ComboboxDegrau key={size} size={size} />
        ))}
      </DocSection>

      <DocSection
        title="Uma escolha e várias"
        description="Com multiple o valor é uma lista, o painel não fecha ao escolher e o tique fica aceso. ComboboxValue resume o excesso em vez de deixar a tela inventar o formato."
        code={`<Combobox multiple value={values} onValueChange={setValues}>
  <ComboboxField>
    <ComboboxTrigger>
      <ComboboxValue
        placeholder="Filtrar categorias"
        overflowCount={values.length - 1}
      >
        {rotulo(values[0])}
      </ComboboxValue>
    </ComboboxTrigger>
  </ComboboxField>
  …
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

      <DocSection
        title="Busca em português"
        description="Digite saude, educacao ou lazer sem acento: a lista acha assim mesmo. O padrão do cmdk casa por subsequência difusa e não conhece acento — cor traria Carousel antes de Cores."
        code={`// nada a declarar: o filtro do projeto já vem montado
<ComboboxContent>…</ComboboxContent>

// e a linha deriva keywords do próprio rótulo, porque num
// combobox de verdade o value é a chave de máquina
<ComboboxItem value="cat_7f3a">Mercado</ComboboxItem>`}
        previewClassName="items-start p-6"
      >
        <ComboboxAcentos />
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
            description:
              "Chamado ao escolher. Fecha o popover sozinho — exceto em multiple.",
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
            description:
              "Trava a rolagem de trás. Sem isso, rolar a lista arrasta a folha que a contém.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "No ComboboxTrigger. A escada do sistema.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "ComboboxField",
            type: "div · PopoverAnchor",
            description:
              "A casca do campo. Obrigatória quando há ComboboxClear — é ela que ancora a largura do painel.",
          },
          {
            prop: "ComboboxTrigger",
            type: "button",
            description:
              "O campo. Veste a régua de lib/field-classes, a mesma do Input e do SelectTrigger.",
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
        ]}
      />

      <DocNote title="O gatilho era um botão, e parecia um botão">
        Ele nascia de <code>{'Button variant="outline"'}</code> —{" "}
        <code>border-border</code> + <code>bg-background</code> no tema claro —,
        enquanto <code>Select</code> e <code>Input</code> são{" "}
        <code>border-input</code> + <code>bg-input-fill/30</code>. Os dois só
        convergiam sob <code>dark:</code>: no tema claro um combobox ao lado de
        um select eram duas superfícies visivelmente diferentes fazendo o mesmo
        trabalho. A comparação está viva na primeira demonstração desta página.
      </DocNote>

      <DocNote title="Por que o rótulo não se registra sozinho">
        Seria a API mais curta — cada <code>ComboboxItem</code> anunciando o
        próprio rótulo, e <code>ComboboxValue</code> lendo o do valor atual. Ela
        não funciona: o conteúdo do popover só <strong>monta quando ele abre</strong>,
        então um combobox que nunca foi aberto não teria rótulo nenhum para
        mostrar. Quem tem os dados antes de abrir é quem chama.
      </DocNote>

      <DocNote title="multiple precisa de um literal">
        <code>{"<Combobox multiple={umBooleano}>"}</code> não estreita o tipo — a
        união discriminada exige <code>multiple</code> ou{" "}
        <code>{"multiple={true}"}</code> escrito, ou duas chamadas. É o custo
        padrão do padrão, e a alternativa seria um <code>as</code> escondido
        dentro do componente.
      </DocNote>

      <DocNote title="O tique não escreve aria-selected">
        O cmdk usa <code>aria-selected</code> para a linha <em>realçada</em> pela
        seta, não para a escolhida. Sobrescrevê-lo apagaria o cursor de teclado
        do leitor de tela, então quem diz “este é o escolhido” é um rótulo{" "}
        <code>sr-only</code> ao lado do ícone.
      </DocNote>

      <DocNote title="O Enter já está resolvido">
        O campo de busca do cmdk renderiza <code>{'role="combobox"'}</code>, e o{" "}
        <code>shouldDeferEnterToWidget</code> do <code>CustomForm</code> já trata
        esse papel. Não é preciso somar uma regra nova — o caso do{" "}
        <code>FormPickerPopover</code> foi diferente porque a busca dele é um{" "}
        <code>input</code> cru.
      </DocNote>

      <DocNote title="Não confundir com FormPickerPopover">
        Aquele resolve <em>onde</em> o painel aparece; este resolve busca,
        teclado e a semântica de listbox. O gatilho daquele continua sendo{" "}
        <code>{'Button variant="outline"'}</code> por decisão registrada — são três
        gatilhos de campo em duas aparências, e a convergência é a próxima
        rodada, não esta.
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

function ComboboxDegrau({ size }: { size: "sm" | "md" | "lg" | "xl" }) {
  const [value, setValue] = React.useState("")

  return (
    <div className="flex items-center gap-3">
      <code className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
        {size}
      </code>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField className="max-w-56">
          <ComboboxTrigger size={size}>
            <ComboboxValue placeholder="Categoria">
              {rotulo(value)}
            </ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput />
          <ComboboxList>
            <ComboboxEmpty />
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

function ComboboxMultiplo() {
  const [values, setValues] = React.useState<string[]>(["mercado", "lazer"])

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-multi">Categorias do filtro</Label>
      <Combobox multiple value={values} onValueChange={setValues}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-multi">
            <ComboboxValue
              placeholder="Todas as categorias"
              overflowCount={Math.max(0, values.length - 1)}
            >
              {rotulo(values[0] ?? "")}
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

function ComboboxAcentos() {
  const [value, setValue] = React.useState("")

  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="ds-combobox-acentos">Categoria</Label>
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxField>
          <ComboboxTrigger id="ds-combobox-acentos">
            <ComboboxValue placeholder="Tente digitar saude">
              {rotulo(value)}
            </ComboboxValue>
          </ComboboxTrigger>
        </ComboboxField>
        <ComboboxContent>
          <ComboboxInput placeholder="saude, educacao, lazer…" />
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
