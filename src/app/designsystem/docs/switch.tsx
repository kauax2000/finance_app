"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SwitchDoc() {
  return (
    <>
      <Usage>
        Alternância que <strong>vale no instante em que é tocada</strong>: notificações, tema, um filtro. Se o valor só vale ao salvar, o componente é o <code>Checkbox</code>.
      </Usage>

      <DocSection
        title="Estados"
        code={`<Switch />
<Switch defaultChecked />
<Switch disabled />`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Switch id="ds-sw-1" />
          <Label htmlFor="ds-sw-1">Desligado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="ds-sw-2" defaultChecked />
          <Label htmlFor="ds-sw-2">Ligado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="ds-sw-3" defaultChecked disabled />
          <Label htmlFor="ds-sw-3">Desabilitado</Label>
        </div>
      </DocSection>

      <DocSection
        title="Numa linha de configuração"
        description="O rótulo e a explicação são o mesmo dado em duas linhas: sem gap entre eles. O gap fica entre o bloco de texto e o controle."
        code={`<div className="flex items-center justify-between gap-4">
  <div>
    <p className="text-sm font-medium">Avisar sobre faturas</p>
    <p className="text-xs text-muted-foreground">Três dias antes do vencimento.</p>
  </div>
  <Switch defaultChecked />
</div>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Avisar sobre faturas
            </p>
            <p className="text-xs text-muted-foreground">
              Três dias antes do vencimento.
            </p>
          </div>
          <Switch defaultChecked aria-label="Avisar sobre faturas" />
        </div>
      </DocSection>

      <DocNote title="Quando &ldquo;marcado&rdquo; não diz qual é qual">
        Um switch nu responde &ldquo;ligado ou não&rdquo;, o que não serve para escolher entre duas coisas igualmente válidas: num alternador de tema, &ldquo;marcado&rdquo; não diz se o escuro é o estado ou o destino. O <code>AppThemeToggle</code> desenha <strong>as duas faces</strong> no trilho e acende a que está valendo — é o controle no topo deste site.
      </DocNote>

      <DocNote title="O trilho desligado usa --input-fill">
        O switch em repouso é <code>bg-input-fill/80</code>. Ele não usa{" "}
        <code>--input</code>{" "}
        porque aquele token é a borda de campo, com 3:1
        medido — um trilho desligado nessa cor pareceria ligado.
      </DocNote>
    </>
  )
}
