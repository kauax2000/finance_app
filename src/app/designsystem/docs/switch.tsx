"use client"

import * as React from "react"

import { Field, FieldContent, FieldControl, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const TAMANHOS = ["sm", "md", "lg"] as const

/** Um interruptor que salva de mentira: 1,2s de `pending` a cada troca. */
function DemoSalvando() {
  const [ligado, setLigado] = React.useState(true)
  const [salvando, setSalvando] = React.useState(false)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{ligado ? "Ativa" : "Pausada"}</span>
      <Switch
        aria-label={ligado ? "Pausar assinatura" : "Ativar assinatura"}
        checked={ligado}
        pending={salvando}
        onCheckedChange={(v) => {
          setSalvando(true)
          window.setTimeout(() => {
            setLigado(v)
            setSalvando(false)
          }, 1200)
        }}
      />
    </div>
  )
}

export default function SwitchDoc() {
  return (
    <>
      <Usage>
        Alternância que <strong>vale no instante em que é tocada</strong>: uma notificação, uma assinatura pausada, um filtro. Se o valor só vale ao salvar o formulário, o componente é o <code>Checkbox</code>. Para escolher entre coisas igualmente válidas, não é um switch: &ldquo;ligado&rdquo; não diz qual é qual.
      </Usage>

      <DocSection
        title="Tamanhos e estados"
        description="size mede o trilho: sm 14×24, md 18×32 (o padrão) e lg 24×44. O polegar é a altura menos a borda, e anda na mola da casa. Desabilitado apaga a peça inteira — e o Label ao lado, pelo peer."
        code={`<Switch size="sm" />
<Switch defaultChecked />
<Switch size="lg" defaultChecked />
<Switch disabled defaultChecked />`}
        previewClassName="flex-col items-start gap-5"
      >
        <div className="flex items-end gap-6">
          {TAMANHOS.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <Switch size={s} defaultChecked aria-label={`Exemplo ${s}`} />
              <Caption>{s}</Caption>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch id="ds-sw-off" />
            <Label htmlFor="ds-sw-off">Desligado</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="ds-sw-dis" defaultChecked disabled />
            <Label htmlFor="ds-sw-dis">Desabilitado</Label>
          </div>
        </div>
      </DocSection>

      <DocSection
        title="Numa linha de configuração"
        description="É um Field horizontal: o rótulo fica ligado ao interruptor e a descrição é anunciada com ele. Rótulo e descrição são o mesmo dado em duas linhas, sem gap; o gap é entre o texto e o controle."
        code={`<Field orientation="horizontal" className="justify-between">
  <FieldContent>
    <FieldLabel>Avisar sobre faturas</FieldLabel>
    <FieldDescription>Três dias antes do vencimento.</FieldDescription>
  </FieldContent>
  <FieldControl>
    <Switch defaultChecked />
  </FieldControl>
</Field>`}
        previewClassName="flex-col items-stretch"
      >
        <Field orientation="horizontal" className="justify-between gap-5">
          <FieldContent className="min-w-0 gap-0.5">
            <FieldLabel>Avisar sobre faturas</FieldLabel>
            <FieldDescription>Três dias antes do vencimento.</FieldDescription>
          </FieldContent>
          <FieldControl>
            <Switch defaultChecked />
          </FieldControl>
        </Field>
      </DocSection>

      <DocSection
        title="Salvando"
        description="pending põe o Spinner dentro do polegar enquanto o valor vai ao servidor: o controle trava, mas não apaga, e marca aria-busy. O texto ao lado continua dizendo o estado — a roda não o substitui. Troque e veja."
        code={`<Switch checked={ativa} pending={salvando} onCheckedChange={salvar} />`}
      >
        <DemoSalvando />
      </DocSection>

      <DocSection
        title="Ícones no polegar"
        description="icons põe um tique no ligado e um × no desligado. O estado deixa de depender só da cor do trilho e da posição do polegar — útil onde a peça aparece sozinha, sem texto que diga o estado."
        code={`<Switch icons defaultChecked />`}
        previewClassName="items-end gap-6"
      >
        {TAMANHOS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className="flex gap-3">
              <Switch size={s} icons aria-label={`Desligado ${s}`} />
              <Switch size={s} icons defaultChecked aria-label={`Ligado ${s}`} />
            </div>
            <Caption>{s}</Caption>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="variant=&quot;brand&quot; é o brilho da família do Checkbox e do Radio: a borda acende em arco-íris conforme o ponteiro se aproxima, ligada ou não, e só a borda. Longe do ponteiro, e no toque, é o Switch de sempre. Uma por tela."
        code={`<Switch variant="brand" defaultChecked />`}
        previewClassName="items-center gap-6"
      >
        <Switch variant="brand" aria-label="Marca desligado" />
        <Switch variant="brand" defaultChecked aria-label="Marca ligado" />
        <Switch variant="brand" size="lg" defaultChecked icons aria-label="Marca grande" />
      </DocSection>

      <DocNote title="O alvo é 44px de altura">
        O desenho tem 18px de altura no <code>md</code>, e o <code>::after</code> leva o alvo a 44, centrado, e a 54 de largura (11px a mais de cada lado da caixa). Até a rodada 178 ele crescia <code>-inset-y-2</code>: 34px no <code>md</code> e 30 no <code>sm</code>, abaixo do que o <code>Checkbox</code> e o <code>Radio</code> já davam.
      </DocNote>

      <DocNote title="O trilho desligado é --input-fill">
        Desligado, o trilho é <code>--input-fill</code> (a 80% no escuro), e não <code>--input</code>, a cor do fio de campo. Os dois estão perto um do outro e fora da 1.4.11 por decisão registrada (o contorno de campo); quem identifica o desligado é o polegar branco sobre o trilho, e o ligado é a tecla <code>--primary</code>. (A versão anterior desta página dizia que <code>--input</code> tinha voltado à norma, e ele não voltou.)
      </DocNote>

      <DocNote title="Onde o app usa">
        Dois interruptores: as preferências de notificação, numa linha de <code>Field</code>, e a folha de uma assinatura, que pausa ou ativa. Na assinatura, um <code>Spinner</code> <strong>substituía</strong> o texto &ldquo;Ativa&rdquo; enquanto salvava; desde a rodada 179 é <code>pending</code>, e o texto fica. Nas preferências saiu um <code>shrink-0</code> que a base já tem.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "checked · defaultChecked", type: "boolean", description: "Controlado ou não. onCheckedChange recebe o novo valor." },
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "O trilho: 14×24, 18×32 e 24×44." },
          { prop: "pending", type: "boolean", default: "false", description: "Spinner no polegar, controle travado sem apagar, aria-busy." },
          { prop: "icons", type: "boolean", default: "false", description: "Tique no ligado, × no desligado." },
          { prop: "variant", type: '"default" | "brand"', default: '"default"', description: "brand é o brilho de arco-íris na borda. Uma por tela." },
          { prop: "disabled", type: "boolean", default: "false", description: "Apaga a peça e o Label irmão (peer)." },
        ]}
      />
    </>
  )
}
