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
          <SelectTrigger className="w-56" aria-label="Categoria">
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
          <SelectTrigger size="sm" className="w-40" aria-label="Categoria (sm)">
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
          <SelectTrigger className="w-40" aria-label="Categoria (desabilitado)">
            <SelectValue placeholder="Desabilitado" />
          </SelectTrigger>
          <SelectContent />
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
        title="Opção destrutiva"
        description="Uma escolha que apaga alguma coisa fica em vermelho, com a mesma variant do DropdownMenu e do ContextMenu."
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
        description="Opção que existe mas está indisponível fica na lista, esmaecida e sem foco; some só o que não existe."
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
        description="Passando da altura disponível, o conteúdo ganha botões de rolagem. Acima de umas dez opções, use o Combobox, que tem busca."
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

      <DocNote title="A superfície flutuante é vidro de verdade">
        O dropdown tem conteúdo passando por baixo, então veste a <code>glass-surface</code>: 24px de borrão, <code>saturate(1.5)</code> e o guarda de <code>prefers-reduced-transparency</code>, com alfa de 60% no escuro e 85% no claro. Uma placa por superfície: quem hospeda pinta, e o <code>Command</code> hospedado num popover é transparente.
      </DocNote>

      <DocNote title="Abre abaixo do gatilho, com colisão">
        O padrão é <code>position=&quot;popper&quot;</code>. O <code>item-aligned</code> do Radix sobrepõe o gatilho e ignora <code>collisionPadding</code>, <code>side</code> e <code>sideOffset</code> — o painel sai da tela sem nada o impedir.
      </DocNote>

      <DocNote title="O Enter não é do formulário aqui">
        Sobre um gatilho de Select o Enter abre e escolhe, em vez de enviar. O <code>shouldDeferEnterToWidget</code> reconhece isso pelo <code>data-slot=&quot;select-trigger&quot;</code>.
      </DocNote>
    </>
  )
}
