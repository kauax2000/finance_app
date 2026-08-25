"use client"

import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function NativeSelectDoc() {
  return (
    <>
      <Usage>
        O <code>&lt;select&gt;</code> do sistema. Vale quando a lista é curta e previsível e o seletor nativo do telefone ganha de qualquer coisa desenhada — mês, ano, dia do vencimento.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<NativeSelect>
  <NativeSelectOption value="1">Dia 1</NativeSelectOption>
</NativeSelect>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-xs flex-col gap-1.5">
          <Label htmlFor="ds-native-select">Dia do vencimento</Label>
          <NativeSelect id="ds-native-select" defaultValue="5">
            {[1, 5, 10, 15, 20, 25].map((d) => (
              <NativeSelectOption key={d} value={String(d)}>
                Dia {d}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </DocSection>

      <DocSection
        title="Com grupos"
        code={`<NativeSelectOptGroup label="Crédito">
  <NativeSelectOption value="nubank">Nubank</NativeSelectOption>
</NativeSelectOptGroup>`}
        previewClassName="flex-col items-stretch"
      >
        <NativeSelect
          aria-label="Forma de pagamento"
          className="max-w-xs"
          defaultValue="pix"
        >
          <NativeSelectOptGroup label="Débito">
            <NativeSelectOption value="pix">Pix</NativeSelectOption>
            <NativeSelectOption value="dinheiro">Dinheiro</NativeSelectOption>
          </NativeSelectOptGroup>
          <NativeSelectOptGroup label="Crédito">
            <NativeSelectOption value="cartao">Cartão</NativeSelectOption>
          </NativeSelectOptGroup>
        </NativeSelect>
      </DocSection>

      <DocNote title="Enter dentro dele quebra a regra do formulário">
        Ali a tecla pertence ao controle do sistema, e sequestrá-la impediria a escolha pelo teclado.
      </DocNote>
    </>
  )
}
