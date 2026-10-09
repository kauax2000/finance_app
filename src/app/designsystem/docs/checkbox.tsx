"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const ITENS = ["Mercado", "Transporte", "Assinaturas"]

/** O cabeçalho que marca todos, como na tabela de transações e nas assinaturas. */
function SelecionarTodas() {
  const [marcados, setMarcados] = React.useState<Set<string>>(new Set(["Mercado"]))
  const todos = marcados.size === ITENS.length
  const alguns = marcados.size > 0 && !todos
  return (
    <div className="flex w-full max-w-sm flex-col rounded-surface border border-border">
      <Label className="flex min-h-11 items-center gap-3 border-b border-border px-3 font-medium">
        <Checkbox
          checked={todos ? true : alguns ? "indeterminate" : false}
          onCheckedChange={(v) => setMarcados(v === true ? new Set(ITENS) : new Set())}
        />
        <span className="text-sm">
          {marcados.size === 0 ? "Selecionar todas" : `${marcados.size} de ${ITENS.length} selecionadas`}
        </span>
      </Label>
      {ITENS.map((item) => (
        <Label key={item} className="flex min-h-11 items-center gap-3 px-3 font-normal">
          <Checkbox
            checked={marcados.has(item)}
            onCheckedChange={(v) =>
              setMarcados((atual) => {
                const novo = new Set(atual)
                if (v === true) novo.add(item)
                else novo.delete(item)
                return novo
              })
            }
          />
          <span className="text-sm">{item}</span>
        </Label>
      ))}
    </div>
  )
}

export default function CheckboxDoc() {
  return (
    <>
      <Usage>
        Escolha booleana que só vale quando o formulário é enviado. Se a mudança vale no instante do toque — uma preferência, um filtro que aplica sozinho — o componente é o <code>Switch</code>. Para uma opção entre várias, é o <code>RadioGroup</code>: rádio é ponto, caixa é tique.
      </Usage>

      <DocSection
        title="Estados"
        description="Desmarcada, marcada, parcial e desabilitada. A caixa desenhada tem 16px e o tique 14px."
        code={`<Checkbox />
<Checkbox defaultChecked />
<Checkbox checked="indeterminate" />
<Checkbox defaultChecked disabled />`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-1" />
          <Label htmlFor="ds-cb-1">Não marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-2" defaultChecked />
          <Label htmlFor="ds-cb-2">Marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-3" checked="indeterminate" />
          <Label htmlFor="ds-cb-3">Parcial</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-4" defaultChecked disabled />
          <Label htmlFor="ds-cb-4">Desabilitado</Label>
        </div>
      </DocSection>

      <DocSection
        title="Marcar floresce"
        description="O preenchimento não troca de cor: ele nasce pequeno e difuso no centro da caixa e se abre até as bordas, na mola da casa — a mesma flor do hover do Button. O tique entra crescendo de 50%, e como ele tem a cor do fundo desmarcado é a flor que o revela. Desmarcar recolhe sem mola. Marque e desmarque."
        code={`<Checkbox />`}
        previewClassName="gap-6"
      >
        {["Alimentação", "Moradia", "Lazer"].map((nome) => (
          <div key={nome} className="flex items-center gap-2">
            <Checkbox id={`ds-cb-flor-${nome}`} />
            <Label htmlFor={`ds-cb-flor-${nome}`}>{nome}</Label>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Selecionar todas"
        description="O cabeçalho de uma lista marca todos, e fica parcial quando só parte está marcada. É o padrão da tabela de transações e da lista de assinaturas, que decidem o valor assim: todos → true, alguns → indeterminate, nenhum → false."
        code={`<Checkbox
  aria-label="Selecionar todas nesta página"
  checked={todos ? true : alguns ? "indeterminate" : false}
  onCheckedChange={(v) => v === true ? marcarTodas() : limpar()}
/>`}
      >
        <SelecionarTodas />
      </DocSection>

      <DocNote title="O parcial é um terceiro estado, e não um marcado meio apagado">
        <code>checked=&quot;indeterminate&quot;</code> troca o tique por um traço, com o preenchimento do marcado. Ele só existe como valor de <code>checked</code>, então quem o usa é controlado — e ao clicar num parcial o Radix entrega <code>true</code>, que é o &ldquo;marcar todas&rdquo;.
      </DocNote>

      <DocSection
        title="Lista de seleção"
        description="Numa lista, o rótulo inteiro é o alvo do toque, com 44px de altura."
        code={`<Label className="flex min-h-11 items-center gap-3 rounded-row-lg border px-3">
  <Checkbox />
  <span>Mercado</span>
</Label>`}
        previewClassName="flex-col items-stretch gap-2"
      >
        {ITENS.map((cat) => (
          <Label
            key={cat}
            className="flex min-h-11 items-center gap-3 rounded-row-lg border border-border px-3 font-normal hover:bg-accent/60 active:bg-accent/60"
          >
            <Checkbox />
            <span className="text-sm">{cat}</span>
          </Label>
        ))}
      </DocSection>

      <DocNote title="A área de toque é 44px, e ela cresce por pseudo-elemento">
        A caixa desenhada tem 16px; um <code>::after</code> com <code>-inset-3.5</code> leva o alvo a 44 sem mexer no layout, como no <code>Switch</code>. Ele mora na base e não numa variante — o alvo não é assunto de aparência —, e soma ao rótulo clicável, não o substitui. É por ele estar ocupado que a flor mora no fundo da caixa e a marca não tem halo.
      </DocNote>

      <DocSection
        title="A versão de marca"
        description="A borda acende em arco-íris conforme o ponteiro se aproxima — o brilho do Alert, do Card, do Badge e do Button brand. Passe o mouse perto, marcada ou não. Longe do ponteiro, e no toque, ela é a caixa do sistema, pixel a pixel. Uma por tela."
        code={`<Checkbox variant="brand" />
<Checkbox variant="brand" defaultChecked />`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-brand-1" variant="brand" />
          <Label htmlFor="ds-cb-brand-1">Não marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-brand-2" variant="brand" defaultChecked />
          <Label htmlFor="ds-cb-brand-2">Marcado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="ds-cb-brand-3" variant="brand" checked="indeterminate" />
          <Label htmlFor="ds-cb-brand-3">Parcial</Label>
        </div>
      </DocSection>

      <DocNote title="O brilho só pinta a borda">
        O anel do brilho mora no <code>::before</code> e é recortado na máscara: o meio da caixa nunca é pintado, então o preenchimento marcado, a flor e o hover aparecem intactos sob o arco. O <code>::after</code> continua sendo o alvo de toque; o brilho não precisa dele. No toque não há brilho: ele precisa de ponteiro fino. E o tique continua <code>--primary-foreground</code> sobre <code>--primary</code> — arco-íris sob texto continua proibido.
      </DocNote>

      <DocNote title="Onde o app usa">
        Na seleção em massa da tabela de transações (o cabeçalho, cada mês e cada linha) e da lista de assinaturas, nos filtros de transação (carteiras, categorias e &ldquo;sem categoria&rdquo;) e nos lembretes e no &ldquo;ativa&rdquo; do formulário de conta a pagar. Todos na caixa do sistema; a versão de marca ainda não tem tela.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description:
              "A aparência. `brand` acende a borda em arco-íris conforme o ponteiro se aproxima.",
          },
          {
            prop: "checked",
            type: 'boolean | "indeterminate"',
            description: "O estado controlado; o parcial só entra por aqui.",
          },
          {
            prop: "defaultChecked",
            type: "boolean",
            default: "false",
            description: "O estado inicial, no modo não controlado. Não aceita o parcial.",
          },
          {
            prop: "onCheckedChange",
            type: '(checked: boolean | "indeterminate") => void',
            description: "Dispara na mudança, com o valor novo.",
          },
          {
            prop: "disabled",
            type: "boolean",
            default: "false",
            description: "Tira o controle do foco e do ponteiro, e baixa a opacidade.",
          },
          {
            prop: "required / name / value",
            type: "props de formulário",
            description:
              "Vão para o input espelho do Radix, que faz a caixa participar de um form nativo.",
          },
        ]}
      />
    </>
  )
}
