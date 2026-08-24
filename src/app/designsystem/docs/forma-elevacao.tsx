"use client"

import { DocNote, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const RADII = [
  ["rounded-sm", "0,6 × raio", "chip, tag, badge quadrado"],
  ["rounded-md", "0,8 × raio", "botão pequeno, item de menu"],
  ["rounded-lg", "1 × raio", "o padrão: campo, botão, cartão"],
  ["rounded-xl", "1,4 × raio", "cartão de destaque, preview"],
  ["rounded-2xl", "1,8 × raio", "folha, diálogo"],
  ["rounded-3xl", "2,2 × raio", "superfície grande no telefone"],
  ["rounded-4xl", "2,6 × raio", "ilha de navegação"],
]

const SHADOWS = [
  ["shadow-xs", "quase nada: separa um campo do fundo"],
  ["shadow-sm", "cartão apoiado na página"],
  ["shadow-md", "menu, popover, dropdown"],
  ["shadow-lg", "diálogo, folha"],
  ["shadow-xl", "ilha flutuante sobre o conteúdo"],
]

export default function FormaElevacaoDoc() {
  return (
    <>
      <Usage>
        O raio de canto é uma escala derivada: <code>--radius</code>{" "}
        vale
        0,625rem e todos os degraus são múltiplos dele. Mudar a marca é mudar uma
        linha. A sombra é o outro eixo da elevação e não se acumula com a
        borda — uma superfície tem borda <em>ou</em> sombra, raramente as duas
        com força.
      </Usage>

      <Group title="Raio de canto" layout="grid">
        <Spec title="A escala" meta="--radius: 0.625rem">
          <Stack className="gap-3">
            {RADII.map(([cls, calc, use]) => (
              <div key={cls} className="flex items-center gap-3">
                <span
                  className={`size-12 shrink-0 border border-border bg-muted ${cls}`}
                />
                <div className="flex min-w-0 flex-col">
                  <code className="font-mono text-2xs text-foreground">{cls}</code>
                  <span className="text-2xs text-muted-foreground">{calc}</span>
                  <span className="text-xs text-muted-foreground">{use}</span>
                </div>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Elevação">
          <Stack className="gap-4">
            {SHADOWS.map(([cls, use]) => (
              <div key={cls} className="flex items-center gap-3">
                <span
                  className={`size-12 shrink-0 rounded-lg bg-card ${cls}`}
                />
                <div className="flex min-w-0 flex-col">
                  <code className="font-mono text-2xs text-foreground">{cls}</code>
                  <span className="text-xs text-muted-foreground">{use}</span>
                </div>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocNote title="A sombra troca de valor no tema escuro">
        Uma sombra preta a 8% sobre um fundo quase preto não existe. Os cinco
        degraus são declarados duas vezes, em <code>:root</code> e em{" "}
        <code>.dark</code>, com opacidades bem maiores no escuro. Como a
        utilidade do Tailwind aponta para a variável, nenhuma tela precisa saber
        disso.
      </DocNote>
    </>
  )
}
