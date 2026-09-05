"use client"

import {
  BanknotesIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "@heroicons/react/16/solid"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SelectDoc() {
  return (
    <>
      <Usage>
        Poucas opções conhecidas, sem busca. Passando de umas dez, o componente é o <code>Combobox</code>.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Select>
  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="mercado">Mercado</SelectItem>
  </SelectContent>
</Select>`}
      >
        <Select>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mercado">Mercado</SelectItem>
            <SelectItem value="transporte">Transporte</SelectItem>
            <SelectItem value="lazer">Lazer</SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Tamanhos e grupos"
        description="Os tamanhos batem com os do Input e do Button. Grupos com rótulo servem quando as opções vêm de origens diferentes — despesa e receita, por exemplo."
        code={`<SelectTrigger size="sm">…</SelectTrigger>
<SelectGroup>
  <SelectLabel>Despesa</SelectLabel>
  <SelectItem value="mercado">Mercado</SelectItem>
</SelectGroup>`}
      >
        <Select>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="sm" />
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
        <Select disabled>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Desabilitado" />
          </SelectTrigger>
          <SelectContent />
        </Select>
      </DocSection>

      <DocSection
        title="Com ícone na opção"
        description="O ícone entra dentro do SelectItem, antes do texto, e sobe junto para o gatilho quando a opção é escolhida — o Radix leva o conteúdo inteiro do item para o valor. Ícone aqui identifica a categoria de relance; se ele não diz nada que o texto já não diga, é ruído."
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
        title="Opção destrutiva"
        description="Uma escolha que apaga alguma coisa fica em vermelho na lista, como no DropdownMenu e no ContextMenu. É a mesma variant nos três, para escolher uma opção se comportar igual em qualquer um deles."
        code={`<SelectItem value="excluir" variant="destructive">
  Excluir categoria
</SelectItem>`}
      >
        <Select>
          <SelectTrigger className="w-56" aria-label="Ação da categoria">
            <SelectValue placeholder="Escolha uma ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="renomear">Renomear</SelectItem>
            <SelectItem value="arquivar">Arquivar</SelectItem>
            <SelectSeparator />
            <SelectItem value="excluir" variant="destructive">
              Excluir categoria
            </SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Estados"
        description="O gatilho segue os estados do campo: vazio mostra o placeholder em cinza, aria-invalid pinta a borda e o anel de destructive, e desabilitado ganha o mesmo preenchimento do Input desabilitado."
        code={`<SelectTrigger aria-invalid>…</SelectTrigger>
<SelectTrigger disabled>…</SelectTrigger>`}
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
        description="Uma opção que existe mas não pode ser escolhida agora fica na lista, esmaecida e sem foco. Some da lista só o que não existe — o que existe e está indisponível ensina mais ficando visível."
        code={`<SelectItem value="anual" disabled>
  Anual — só no plano pago
</SelectItem>`}
      >
        <Select>
          <SelectTrigger className="w-64" aria-label="Periodicidade">
            <SelectValue placeholder="Escolha a periodicidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="anual" disabled>
              Anual — só no plano pago
            </SelectItem>
          </SelectContent>
        </Select>
      </DocSection>

      <DocSection
        title="Lista longa rola sozinha"
        description="Passando da altura disponível, o conteúdo ganha os botões de rolagem no topo e no rodapé. Mas lista longa é sinal: acima de umas dez opções quem resolve é o Combobox, que tem busca."
        code={`<SelectContent>
  {meses.map((m) => (
    <SelectItem key={m} value={m}>{m}</SelectItem>
  ))}
</SelectContent>`}
      >
        <Select>
          <SelectTrigger className="w-56" aria-label="Mês de referência">
            <SelectValue placeholder="Mês de referência" />
          </SelectTrigger>
          <SelectContent>
            {[
              "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
              "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
            ].map((m) => (
              <SelectItem key={m} value={m.toLowerCase()}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DocSection>

      <DocNote title="Ele abre abaixo do gatilho, e antes ignorava a borda da tela">
        O padrão do Radix é <code>position=&quot;item-aligned&quot;</code>: o
        painel sobrepõe o gatilho, alinhando o item já escolhido sobre ele. É
        bonito e <strong>não faz colisão nenhuma</strong> — naquele modo{" "}
        <code>collisionPadding</code>, <code>avoidCollisions</code>,{" "}
        <code>side</code> e <code>sideOffset</code> simplesmente não existem, e o
        painel sai da tela sem nada o impedir.
        <br />
        O app já tinha votado contra: <strong>9 das 36</strong> chamadas de{" "}
        <code>SelectContent</code> escreviam <code>position=&quot;popper&quot;</code>{" "}
        à mão — e eram <em>as mesmas nove</em> que cravavam um{" "}
        <code>collisionPadding</code> próprio. Duas props escritas duas vezes,
        nove vezes, para conseguir o que o padrão devia dar. Hoje{" "}
        <code>popper</code> é o padrão e as dezoito linhas saíram.
      </DocNote>

      <DocNote title="A altura do viewport era a altura do gatilho">
        O modo <code>popper</code> trazia do shadcn uma classe que declarava como
        altura do viewport a medida do <strong>gatilho</strong> — a família do
        &quot;envelope que declara como altura a medida que ele próprio
        produz&quot;, que o <code>AccordionContent</code> já pagou. Ela nunca
        aparecia porque o padrão era o outro modo; com a troca, ela passaria a
        valer em toda tela.
        <br />
        Medido antes de sair: o painel abria com <strong>36px</strong> — a caixa
        do gatilho —, com <code>scrollHeight</code> 36. Depois:{" "}
        <strong>92px</strong> para três opções.
      </DocNote>

      <DocNote title="O Enter não é do formulário aqui">
        Sobre um gatilho de Select o Enter abre e escolhe, em vez de enviar. O <code>shouldDeferEnterToWidget</code> reconhece isso pelo <code>data-slot=&quot;select-trigger&quot;</code>.
      </DocNote>
    </>
  )
}
