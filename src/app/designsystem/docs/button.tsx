"use client"

import { ArrowPathIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Code } from "@/components/ui/code"
import { FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TAMANHOS = [
  { size: "xs", px: 24 },
  { size: "sm", px: 28 },
  { size: "md", px: 32 },
  { size: "lg", px: 36 },
  { size: "xl", px: 40 },
] as const

const ICONES = ["icon-xs", "icon-sm", "icon-md", "icon-lg", "icon-xl"] as const

const PESOS = ["primary", "secondary", "tertiary", "outline", "destructive", "brand"] as const

export default function ButtonDoc() {
  return (
    <>
      <Usage>
        Toda ação clicável. Se navega, é um link dentro de <code>asChild</code>. Nunca um <code>&lt;div onClick&gt;</code>: ele não recebe foco, não responde ao Enter e não é anunciado como controle.
      </Usage>

      <DocSection
        title="Hierarquia"
        description="Três degraus que descem em peso: primary preenche de preto (branco no escuro), secondary de cinza, tertiary não preenche. Uma tela tem um primary só."
        code={`<Button>primary</Button>
<Button variant="secondary">secondary</Button>
<Button variant="tertiary">tertiary</Button>`}
      >
        <Button>primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="tertiary">tertiary</Button>
      </DocSection>

      <DocSection
        title="O primário acende a marca no cursor"
        description="Em repouso, a tecla preta (branca no escuro), chapada. No cursor e no toque, cinco paradas do arco-íris — teal, azul, violeta, magenta e coral — florescem do centro: nascem comprimidas e borradas no meio do botão e se abrem até as bordas, ganhando foco, na mola da casa. Ao sair, recolhem sem mola. É o Button Colorful da Kokonut UI, com a cor guardada para a interação. Enviando, a opacidade fica cheia, para salvando não ler como desabilitado."
        code={`<Button size="xl" className="w-64">continuar</Button>
<Button>salvar</Button>
<Button disabled>desabilitado</Button>
<FormSubmit pending pendingLabel="salvando">salvar</FormSubmit>`}
        previewClassName="flex-wrap"
      >
        <Button size="xl" className="w-64">
          continuar
        </Button>
        <Button>salvar</Button>
        <Button disabled>desabilitado</Button>
        <FormSubmit pending pendingLabel="salvando">
          salvar
        </FormSubmit>
      </DocSection>

      <DocSection
        title="Fora da escada"
        description="outline quando o controle precisa de contorno próprio e nenhum degrau serve, destructive para o que não tem volta, link para a ação que se comporta como texto — sem traço em repouso, ele entra pela esquerda no cursor."
        code={`<Button variant="outline">outline</Button>
<Button variant="destructive">destructive</Button>
<Button variant="link">link</Button>`}
      >
        <Button variant="outline">outline</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="link">link</Button>
      </DocSection>

      <DocSection
        title="A marca"
        description="brand é o CTA de marca: neutro em repouso, com a borda que acende em arco-íris conforme o ponteiro se aproxima — o brilho do Alert, do Card e do Badge. Passe o mouse perto. brandOutline é a tecla preta com o arco-íris deslizando na borda de baixo e brilhando embaixo dela — o Rainbow Button da Magic UI —, sempre aceso, para quando a marca não pode depender do ponteiro. Os dois: um por tela."
        code={`<Button variant="brand" size="xl">entrar</Button>
<Button variant="brandOutline" size="xl">começar</Button>`}
        previewClassName="gap-6 py-10"
      >
        <Button variant="brand" size="xl">
          entrar
        </Button>
        <Button variant="brandOutline" size="xl">
          começar
        </Button>
      </DocSection>

      <DocNote title="Cada peso responde ao cursor de um jeito">
        <code>primary</code>, <code>secondary</code>, <code>tertiary</code>, <code>outline</code> e <code>destructive</code> <strong>florescem do centro</strong> — a cor do hover nasce pequena e difusa no meio e se abre até as bordas, na mola da casa, e no toque também; no primário ela é o degradê da marca, nos outros a cor de hover do peso; <code>brand</code> acende o arco da borda e <strong>não troca o fundo</strong> — o anel pinta por cima dele, e a troca sumiria na fatia virada para o ponteiro; <code>brandOutline</code> escurece a tecla; e o <code>link</code> desenha o traço. A mecânica está comentada em <code>button.tsx</code> e nas utilities <code>button-bloom</code>, <code>button-colorful</code>, <code>brand-glow</code> e <code>link-sweep</code> de <code>globals.css</code>. No toque não há brilho: ele precisa de ponteiro fino, e ali o <code>brand</code> é o botão neutro.
      </DocNote>

      <DocNote title="Duas ações lado a lado: a segunda não preenche">
        A ação que a tela propõe é <code>primary</code>, e a que a acompanha é <code>tertiary</code>. Dois preenchimentos lado a lado disputam, e o olho tem de comparar as duas caixas para achar a principal. <code>secondary</code> continua certo sozinho, ou num par de duas ações do mesmo peso.
      </DocNote>

      <DocSection
        title="Tamanhos"
        description="De 24 a 40 em degraus de 4, a escada de controle do sistema. O padrão é md (32), o corpo da ação comum; xs é para dentro de outro controle."
        code={TAMANHOS.map((t) => `<Button size="${t.size}">${t.size}</Button>`).join("\n")}
        previewClassName="flex-wrap items-end gap-4"
      >
        {TAMANHOS.map((t) => (
          <div key={t.size} className="flex flex-col items-center gap-2">
            <Button size={t.size}>{t.size}</Button>
            <span className="nums text-2xs text-muted-foreground">{t.px}px</span>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Só ícone"
        description="icon-xs a icon-xl espelham a escada de texto degrau a degrau. Ao lado de um botão de texto, use o par (md com icon-md), e o aria-label é obrigatório."
        code={ICONES.map((s) => `<Button size="${s}" aria-label="Adicionar"><PlusIcon aria-hidden /></Button>`).join("\n")}
        previewClassName="flex-wrap items-end gap-4"
      >
        {ICONES.map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Button size={s} aria-label="Adicionar">
              <PlusIcon aria-hidden />
            </Button>
            <span className="nums text-2xs text-muted-foreground">{TAMANHOS[i].px}px</span>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A forma: pílula"
        description="shape=&quot;pill&quot; arredonda 100%, em todo peso e todo degrau; nos icon-* vira círculo. O recuo lateral sobe meio degrau, porque a curva come o canto e com o recuo do retângulo o rótulo fica espremido contra ela. O padrão continua rounded, o canto do sistema."
        code={`<Button shape="pill">continuar</Button>
<Button variant="secondary" shape="pill">secondary</Button>
<Button size="icon-md" shape="pill" aria-label="Adicionar"><PlusIcon aria-hidden /></Button>`}
        previewClassName="flex-col items-start gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Code variant="inline" className="w-16 text-2xs text-muted-foreground">
            rounded
          </Code>
          {PESOS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
          <Button size="icon-md" variant="secondary" aria-label="Adicionar">
            <PlusIcon aria-hidden />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Code variant="inline" className="w-16 text-2xs text-muted-foreground">
            pill
          </Code>
          {PESOS.map((v) => (
            <Button key={v} variant={v} shape="pill">
              {v}
            </Button>
          ))}
          <Button size="icon-md" variant="secondary" shape="pill" aria-label="Adicionar">
            <PlusIcon aria-hidden />
          </Button>
        </div>
      </DocSection>

      <DocSection
        title="Colado a um campo"
        description="Input, SelectTrigger, NativeSelect e ComboboxTrigger falam a mesma escada, então alinham sem declarar size."
        code={`<Input placeholder="Input · md" />
<Button>Button · md</Button>`}
      >
        <div className="flex w-full max-w-sm items-center gap-2">
          <Input placeholder="Input · md" aria-label="Exemplo de campo" />
          <Button>Button · md</Button>
        </div>
      </DocSection>

      <DocSection
        title="Com ícone e desabilitado"
        description="O ícone é micro (16/solid) e o componente dá o corpo e o respiro. Desabilitado cai a 50%; enviando (aria-busy, pelo FormSubmit) fica cheio, para salvando não ler como desabilitado."
        code={`<Button><PlusIcon aria-hidden />com ícone</Button>
<Button variant="destructive"><TrashIcon aria-hidden />excluir</Button>
<Button disabled>desabilitado</Button>`}
      >
        <Button>
          <PlusIcon aria-hidden />
          com ícone
        </Button>
        <Button variant="destructive">
          <TrashIcon aria-hidden />
          excluir
        </Button>
        <Button disabled>desabilitado</Button>
      </DocSection>

      <DocSection
        title="O ícone que gira"
        description="iconMotion=&quot;spin&quot; gira o ícone meia-volta no cursor e no toque, na mola da casa, e ele volta ao sair. É o do tentar novamente: o ArrowPathIcon é simétrico a 180°, e a meia-volta lê como uma volta inteira. Com movimento reduzido, não gira."
        code={`<Button iconMotion="spin"><ArrowPathIcon aria-hidden />tentar novamente</Button>`}
      >
        <Button iconMotion="spin">
          <ArrowPathIcon aria-hidden />
          tentar novamente
        </Button>
        <Button variant="tertiary" iconMotion="spin">
          <ArrowPathIcon aria-hidden />
          atualizar
        </Button>
      </DocSection>

      <DocNote title="A maiúscula inicial é do sistema">
        O botão embrulha texto cru num <code>span</code> com <code>::first-letter</code>: <code>salvar</code> sai <strong>Salvar</strong>. Para manter minúscula, passe um elemento — <code>&lt;Button&gt;&lt;span&gt;git push&lt;/span&gt;&lt;/Button&gt;</code> sai intacto. Com <code>asChild</code> o embrulho desce um nível e cobre o texto do <code>Link</code>.
      </DocNote>

      <DocNote title="Rodapé de diálogo: uma hierarquia só">
        Vale para todo <code>Dialog</code> e <code>AlertDialog</code>: cancelar vem antes e é <code>tertiary</code>; a ação é <code>primary</code>, ou <code>destructive</code> quando não tem volta.
      </DocNote>

      <DocNote title="type=&quot;submit&quot; é só da ação principal">
        Dentro de um <code>Form</code> o Enter aciona o submit. Cancelar, dispensar e alternar levam <code>type=&quot;button&quot;</code> — sem isso, cancelar vira o alvo do Enter e o formulário fecha em vez de salvar.
      </DocNote>

      <DocNote title="Não existe size=&quot;default&quot; nem variant=&quot;ghost&quot;">
        O nome dizia &ldquo;o padrão&rdquo; e apontava para 36, que deixou de ser o padrão. Use <code>lg</code> e <code>icon-lg</code>; nos variants, <code>default</code> virou <code>primary</code> e <code>ghost</code> virou <code>tertiary</code>, para o nome dizer o degrau. Os dois saíram do tipo, então o compilador acusa quem os escrever.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"primary" | "secondary" | "tertiary" | "outline" | "destructive" | "link" | "brand" | "brandOutline"',
            default: '"primary"',
            description: "O degrau da hierarquia; outline, destructive, link e os dois de marca ficam fora da escada.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl" | "icon-xs" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl"',
            default: '"md"',
            description: "Altura de 24 a 40; icon-* é quadrado.",
          },
          {
            prop: "shape",
            type: '"rounded" | "pill"',
            default: '"rounded"',
            description: "pill arredonda 100% e sobe meio degrau de recuo lateral; nos icon-* vira círculo.",
          },
          {
            prop: "iconMotion",
            type: '"none" | "spin"',
            default: '"none"',
            description: "spin: o ícone gira meia-volta no cursor e no toque — o do tentar novamente.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "Passa o estilo para o filho. Use com <Link>.",
          },
        ]}
      />
    </>
  )
}
