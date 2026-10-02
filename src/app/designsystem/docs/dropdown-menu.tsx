"use client"

import * as React from "react"
import {
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DropdownMenuDoc() {
  return (
    <>
      <Usage>
        Ações sobre um item. Se as opções <em>selecionam</em> um valor em vez de agir, use <code>Select</code> ou <code>Combobox</code>: um menu não guarda o que foi escolhido.
      </Usage>

      <DocSection
        title="Menu de item"
        description={
          <>
            <code>DropdownMenuHeader title description</code> diz sobre o que o
            menu age, e o título o nomeia. Na linha, <code>shortcut</code>{" "}
            desenha a tecla com o <code>Kbd</code> (a dica de um atalho que já
            existe na tela), <code>description</code> é a segunda linha, e{" "}
            <code>confirm</code> faz a destrutiva pedir um segundo toque — para
            o que se desfaz fácil; o que não tem volta continua no{" "}
            <code>AlertDialog</code>.
          </>
        }
        code={`<DropdownMenuContent
  align="end"
  size="xl"
  header={<DropdownMenuHeader title="Mercado" description="12 set · −R$ 42,90" />}
>
  <DropdownMenuItem shortcut="mod+e"><PencilSquareIcon />Editar</DropdownMenuItem>
  <DropdownMenuItem disabled description="A fatura deste cartão já fechou">…</DropdownMenuItem>
  <DropdownMenuItem variant="destructive" confirm="toque de novo para excluir" onSelect={excluir}>
    <TrashIcon />Excluir
  </DropdownMenuItem>
</DropdownMenuContent>`}
      >
        <MenuDeItemDemo />
      </DocSection>

      <DocSection
        title="Com estado"
        description="Checkbox para várias opções independentes, radio para uma escolha entre alternativas. Marcar uma caixa não fecha o menu (closeOnSelect volta ao padrão do Radix, que fecha); escolher um rádio fecha."
        code={`<DropdownMenuCheckboxItem checked>Mostrar canceladas</DropdownMenuCheckboxItem>
<DropdownMenuRadioGroup value="data">
  <DropdownMenuRadioItem value="data">Data</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Exibição</Button>
          </DropdownMenuTrigger>
          <ComEstadoMenu />
        </DropdownMenu>
      </DocSection>

      <DocSection
        title="Busca, linha que carrega e a tecla que abre"
        description={
          <>
            <code>search</code> põe um campo em cima que filtra as linhas pelo
            nome — o foco nasce nele, e a seta para baixo desce à lista. Um{" "}
            <code>onSelect</code> que devolve <code>Promise</code> faz a linha
            carregar e o menu esperar. <code>shortcut</code> na raiz abre o
            menu pela tecla: o da linha que tem o foco, ou o da tela quando
            nada tem foco.
          </>
        }
        code={`<DropdownMenuContent search="Mover para…">…</DropdownMenuContent>
<DropdownMenuItem onSelect={async () => await gerarLink()}>Copiar link</DropdownMenuItem>
<DropdownMenu shortcut=".">…</DropdownMenu>`}
        previewClassName="flex-col items-start gap-4"
      >
        <BuscaECarregaDemo />
      </DocSection>

      <DocSection
        title="No telefone, a folha de ações"
        description={
          <>
            <code>mobile=&quot;sheet&quot;</code>: abaixo de 768px o mesmo menu
            abre como a folha de ações do <code>Drawer</code> — o cabeçalho do
            alvo, linhas de 52px, o Cancelar embaixo —, sem a tela reescrever
            nada. Caixas e rádios viram linhas com a marca; o submenu, um grupo
            com rótulo. No desktop, nada muda.
          </>
        }
        code={`<DropdownMenu mobile="sheet">…</DropdownMenu>`}
      >
        <FolhaDemo />
      </DocSection>

      <DocSection
        title="Larguras"
        code={`<DropdownMenuContent size="sm" />   // 176 — o mais usado do app
<DropdownMenuContent size="md" />   // 192
<DropdownMenuContent size="lg" />   // 208
<DropdownMenuContent size="xl" />   // 224
<DropdownMenuContent />             // auto, o padrão`}
        previewClassName="flex-col items-start gap-3"
      >
        <LargurasDemo />
      </DocSection>

      <DocSection
        title="Painel"
        code={`<DropdownMenuContent
  variant="panel"
  size="xl"
  header={<DropdownMenuHeader>…avatar, nome e contexto…</DropdownMenuHeader>}
>
  <DropdownMenuSection>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
  </DropdownMenuSection>
</DropdownMenuContent>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Conta</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            variant="panel"
            size="xl"
            align="start"
            header={
              <DropdownMenuHeader>
                <Avatar>
                  <AvatarFallback>KL</AvatarFallback>
                </Avatar>
                {/* Nome sobre contexto é par de identidade: sem `gap`. */}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">Kauã Leandro</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Carteira pessoal
                  </span>
                </div>
              </DropdownMenuHeader>
            }
          >
            <DropdownMenuSection>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem>Membros</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
            </DropdownMenuSection>
          </DropdownMenuContent>
        </DropdownMenu>
      </DocSection>

      <DocNote title="A linha acende como o link do catálogo">
        A cor de fundo da linha em foco esmaece em 300ms de <code>--ease-emphasized</code>, na entrada e na saída, que é o ritmo medido na navegação lateral deste catálogo. Vale nos três menus, no <code>Select</code>, no <code>Command</code> e no painel do <code>NavigationMenu</code>, por <code>menuItemFadeClassName</code>.
      </DocNote>

      <DocNote title="size nomeia as larguras que o app repete">
        <code>sm</code> 176, <code>md</code> 192, <code>lg</code> 208,{" "}
        <code>xl</code> 224. Use o degrau em vez de <code>w-*</code> solto;{" "}
        <code>auto</code> continua o padrão.
      </DocNote>

      <DocNote title="O painel tem faixas, e não é quem chama que as desenha">
        <code>DropdownMenuHeader</code> sangra até a borda;{" "}
        <code>DropdownMenuSection</code> devolve o <code>p-1</code> onde há
        comandos, o mesmo que o <code>-mx-1</code> do{" "}
        <code>DropdownMenuSeparator</code> sangra. Sem ela, os fios do cabeçalho
        e do meio saem com larguras diferentes.
      </DocNote>

      <DocNote title="O fio entre a identidade e os comandos é do slot, não da faixa">
        A identidade é um bloco de outra natureza sobre a lista, então leva o
        mesmo fio que separa grupos. Ele mora no slot <code>header</code>, e
        não em <code>DropdownMenuHeader</code>, porque o <code>UserMenu</code>{" "}
        passa um <code>DropdownMenuLabel</code> ali; regra na peça deixaria o app
        de fora.
      </DocNote>

      <DocNote title="Painel não é lista de comandos">
        <code>variant=&quot;panel&quot;</code> é para cabeçalho de conta, avatar
        e blocos, como no <code>UserMenu</code> e no{" "}
        <code>WorkspaceSwitcher</code>. A casca cede o recuo para o conteúdo
        sangrar, como o <code>Card</code> com{" "}
        <code>padding=&quot;none&quot;</code>.
      </DocNote>

      <DocNote title="O gatilho de três pontos precisa de rótulo">
        <code>aria-label=&quot;Ações da transação&quot;</code>, não
        &ldquo;Menu&rdquo;: vinte botões chamados &ldquo;Menu&rdquo; são
        indistinguíveis para quem navega por lista de controles.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"auto" | "sm" | "md" | "lg" | "xl"',
            default: '"auto"',
            description: "A largura do painel: auto, 176, 192, 208, 224.",
          },
          {
            prop: "variant",
            type: '"menu" | "panel"',
            default: '"menu"',
            description:
              "menu é a lista de comandos; panel cede o recuo e arredonda mais, para conteúdo que não é comando.",
          },
          {
            prop: "DropdownMenu mobile",
            type: '"menu" | "sheet"',
            default: '"menu"',
            description: "sheet: no telefone, a folha de ações do Drawer.",
          },
          {
            prop: "DropdownMenu shortcut",
            type: "string",
            description:
              "A tecla que abre o menu: o da linha focada, ou o da tela sem foco. O gatilho anuncia (aria-keyshortcuts).",
          },
          {
            prop: "DropdownMenuContent search",
            type: "boolean | string",
            description: "Um campo que filtra as linhas pelo nome; o texto é o placeholder.",
          },
          {
            prop: "DropdownMenuHeader",
            type: 'ComponentProps<"div"> · title · description',
            description:
              "Com title: o alvo, e o título nomeia o menu. Sem: a faixa de identidade do painel, que sangra até a borda. O fio embaixo é do slot header, e não dela.",
          },
          {
            prop: "DropdownMenuItem shortcut / description",
            type: "string / ReactNode",
            description: "A tecla com o Kbd (só a dica) e a segunda linha.",
          },
          {
            prop: "DropdownMenuItem confirm",
            type: "boolean | string",
            description: "A linha pede um segundo toque, em 3 segundos. A ação da tela (onSelect ou onClick) espera.",
          },
          {
            prop: "DropdownMenuItem onSelect → Promise / pending",
            type: "(e) => Promise / boolean",
            description: "A linha mostra o Spinner e o menu fecha quando a ação termina.",
          },
          {
            prop: "DropdownMenuCheckboxItem closeOnSelect",
            type: "boolean",
            default: "false",
            description: "Marcar não fecha o menu; true volta ao padrão do Radix.",
          },
          {
            prop: "DropdownMenuSection",
            type: 'ComponentProps<"div">',
            description: "A região de comandos dentro de um painel; devolve o recuo.",
          },
          {
            prop: "DropdownMenuItem variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description: "Traz a tinta, o realce de foco e o par escuro juntos.",
          },
        ]}
      />
    </>
  )
}

function MenuDeItemDemo() {
  const [feito, setFeito] = React.useState("")
  return (
    <div className="flex flex-col items-start gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="tertiary" size="icon-lg" aria-label="Ações da transação">
            <EllipsisHorizontalIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          size="xl"
          header={
            <DropdownMenuHeader title="Mercado" description="12 set · −R$ 42,90" />
          }
        >
          <DropdownMenuItem shortcut="mod+e" onSelect={() => setFeito("Editar")}>
            <PencilSquareIcon aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setFeito("Duplicar")}>
            <DocumentDuplicateIcon aria-hidden />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem disabled description="A fatura deste cartão já fechou">
            <LinkIcon aria-hidden />
            Mover para a próxima fatura
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Conta corrente</DropdownMenuItem>
              <DropdownMenuItem>Poupança</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            confirm="toque de novo para excluir"
            onSelect={() => setFeito("Excluir")}
          >
            <TrashIcon aria-hidden />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {feito ? `Escolhido: ${feito}` : ""}
      </p>
    </div>
  )
}

function ComEstadoMenu() {
  const [canceladas, setCanceladas] = React.useState(true)
  const [futuras, setFuturas] = React.useState(false)
  const [ordem, setOrdem] = React.useState("data")
  return (
    <DropdownMenuContent size="xl">
      <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
      <DropdownMenuCheckboxItem checked={canceladas} onCheckedChange={setCanceladas}>
        Transações canceladas
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={futuras} onCheckedChange={setFuturas}>
        Parcelas futuras
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={ordem} onValueChange={setOrdem}>
        <DropdownMenuRadioItem value="data">Data</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="valor">Valor</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  )
}

const CARTEIRAS = ["Conta corrente", "Poupança", "Viagem", "Reserva", "Casa", "Carro", "Investimentos", "Presentes"]

function BuscaECarregaDemo() {
  const [aviso, setAviso] = React.useState("")
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">mover para…</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent size="xl" search="Buscar carteira">
            {CARTEIRAS.map((c) => (
              <DropdownMenuItem key={c} onSelect={() => setAviso(`Movido para ${c}`)}>
                {c}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">compartilhar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent size="lg">
            <DropdownMenuItem
              onSelect={() =>
                new Promise<void>((pronto) =>
                  window.setTimeout(() => {
                    setAviso("Link copiado")
                    pronto()
                  }, 1500)
                )
              }
            >
              <LinkIcon aria-hidden />
              Copiar link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ItemGroup className="w-full max-w-md">
        {["Mercado", "Farmácia"].map((nome) => (
          <Item key={nome} variant="outline" size="sm">
            <ItemContent>
              <ItemTitle>{nome}</ItemTitle>
              <ItemDescription>Foque o botão e tecle “.”</ItemDescription>
            </ItemContent>
            <ItemActions>
              <DropdownMenu shortcut=".">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="tertiary" size="icon-md" aria-label={`Ações de ${nome}`}>
                        <EllipsisHorizontalIcon aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent shortcut=".">Ações</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" size="sm">
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {aviso}
      </p>
    </>
  )
}

function FolhaDemo() {
  const [canceladas, setCanceladas] = React.useState(true)
  return (
    <DropdownMenu mobile="sheet">
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" size="icon-lg" aria-label="Ações da transação">
          <EllipsisHorizontalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        size="xl"
        header={
          <DropdownMenuHeader title="Mercado" description="12 set · −R$ 42,90" />
        }
      >
        <DropdownMenuItem>
          <PencilSquareIcon aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DocumentDuplicateIcon aria-hidden />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={canceladas} onCheckedChange={setCanceladas}>
          Mostrar canceladas
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" confirm="toque de novo para excluir">
          <TrashIcon aria-hidden />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LargurasDemo() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg" | "xl">("sm")
  return (
    <>
      <ToggleGroup
        type="single"
        variant="segmented"
        size="sm"
        value={size}
        onValueChange={(v) => v && setSize(v as typeof size)}
        aria-label="Largura"
      >
        {(["sm", "md", "lg", "xl"] as const).map((t) => (
          <ToggleGroupItem key={t} value={t} className="font-mono">
            {t}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            abrir
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent size={size}>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Duplicar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
