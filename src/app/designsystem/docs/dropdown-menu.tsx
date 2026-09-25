"use client"

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
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
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Kbd } from "@/components/ui/kbd"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DropdownMenuDoc() {
  return (
    <>
      <Usage>
        Ações sobre um item. Se as opções <em>selecionam</em> um valor em vez de agir, use <code>Select</code> ou <code>Combobox</code>: um menu não guarda o que foi escolhido.
      </Usage>

      <DocSection
        title="Menu de item"
        code={`<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="tertiary" size="icon-lg" aria-label="Ações da transação">
      <EllipsisHorizontalIcon aria-hidden />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" size="icon-lg" aria-label="Ações da transação">
              <EllipsisHorizontalIcon aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Transação</DropdownMenuLabel>
            <DropdownMenuItem>
              Editar
              <DropdownMenuShortcut>
                <Kbd keys="mod+e" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Conta corrente</DropdownMenuItem>
                <DropdownMenuItem>Poupança</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DocSection>

      <DocSection
        title="Com estado"
        description="Checkbox para várias opções independentes, radio para uma escolha entre alternativas. O menu fica aberto ao marcar um checkbox e fecha ao escolher um radio."
        code={`<DropdownMenuCheckboxItem checked>Mostrar canceladas</DropdownMenuCheckboxItem>
<DropdownMenuRadioGroup value="data">
  <DropdownMenuRadioItem value="data">Data</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Exibição</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked>
              Transações canceladas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Parcelas futuras</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuRadioGroup value="data">
              <DropdownMenuRadioItem value="data">Data</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="valor">Valor</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </DocSection>

      <DocSection
        title="Larguras"
        code={`<DropdownMenuContent size="sm" />   // 176 — o mais usado do app
<DropdownMenuContent size="md" />   // 192
<DropdownMenuContent size="lg" />   // 208
<DropdownMenuContent size="xl" />   // 224
<DropdownMenuContent />             // auto, o padrão`}
      >
        <div className="flex flex-wrap items-start gap-2">
          {(["sm", "md", "lg", "xl"] as const).map((t) => (
            <DropdownMenu key={t}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {/* Um `<span>` porque isto é o **valor** do prop, e ele é
                      minúsculo. A maiúscula inicial do `Button` é do sistema, e
                      esta é a saída que o AGENTS.md documenta para o rótulo
                      raro que precisa mesmo ficar como está. */}
                  <span>{t}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent size={t}>
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem>Duplicar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
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
            prop: "DropdownMenuHeader",
            type: 'ComponentProps<"div">',
            description:
              "A faixa de identidade do painel: sangra até a borda e traz o fio embaixo.",
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
