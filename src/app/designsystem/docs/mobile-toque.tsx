"use client"

import { Button } from "@/components/ui/button"
import { DocNote, DocSection, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

const SAFE_AREA = [
  ["--mobile-header-offset", "3,5rem + safe-area topo", "quanto o conteúdo desce sob o cabeçalho fixo"],
  ["--mobile-nav-island-height", "3,5rem", "a altura da ilha de navegação"],
  ["--mobile-nav-island-margin", "1rem", "a folga entre a ilha e a borda"],
  ["--mobile-bottom-pad", "ilha + folga + safe-area", "quanto o conteúdo precisa reservar embaixo"],
]

export default function MobileToqueDoc() {
  return (
    <>
      <Usage>
        Toda tela deste app é vista num telefone. Metade das regras abaixo se decide escrevendo a versão de desktop, e refazer depois custa mais que ler antes.
      </Usage>

      <Group title="As duas portas do alvo de toque" layout="grid">
        <Spec title="A regra">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              Um alvo confortável precisa das <strong>duas</strong> condições:{" "}
              <code>pointer-coarse:</code> <em>e</em> a largura.
            </p>
            <p>
              Só a primeira deixa a janela estreita no laptop com alvos de mouse.
              Só a segunda deixa o tablet com toque na mesma situação.
            </p>
            <p>
              O mínimo confortável é <strong>44px</strong>. Um{" "}
              <code>Button size=&quot;sm&quot;</code>{" "}
              tem 28px, então numa lista
              tocável a área clicável é a linha, não o botão.
            </p>
          </Stack>
        </Spec>

        <Spec title="Alvo pequeno e alvo confortável">
          <Stack>
            <div>
              <p className="mb-1.5 text-2xs text-muted-foreground uppercase">
                28px — só com mouse
              </p>
              <Button size="sm" variant="outline">
                Editar
              </Button>
            </div>
            <div>
              <p className="mb-1.5 text-2xs text-muted-foreground uppercase">
                44px — alvo de dedo
              </p>
              <Button variant="outline" className="min-h-11">
                Editar
              </Button>
            </div>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="hover: não existe no toque"
        description="Utilitários hover:, dark:hover: e group-hover: compilam para @media (hover: hover). Num telefone, que responde hover: none, eles simplesmente não valem."
        code={`{/* errado: no telefone nada acontece ao tocar */}
<div className="group hover:bg-accent">…</div>

{/* certo: o toque recebe a mesma resposta */}
<div className="group hover:bg-accent active:bg-accent group-active:bg-accent">…</div>`}
      >
        <Button variant="outline" className="hover:bg-accent active:bg-accent">
          Toque ou passe o cursor
        </Button>
      </DocSection>

      <DocNote title="Não remova hover: do código para “otimizar para mobile”">
        A decisão é manter a variante <code>hover</code> padrão do Tailwind v4, para o iPad com trackpad continuar tendo hover. O que falta em superfície tocável é <strong>somar</strong> <code>active:</code>, não subtrair o hover. <code>tailwind-hover-policy.test.ts</code> falha se alguém redefinir a variante.
      </DocNote>

      <Group title="Área segura">
        <Spec title="Os tokens" meta="globals.css">
          <Stack className="gap-2">
            {SAFE_AREA.map(([token, valor, uso]) => (
              <div key={token} className="flex flex-col">
                <code className="font-mono text-2xs text-foreground">{token}</code>
                <span className="text-2xs text-muted-foreground">{valor}</span>
                <span className="text-xs text-muted-foreground">{uso}</span>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocNote title="Tabela vira cartão por CSS, nunca por hook">
        Dois gêmeos e <code>hidden</code>. Um <code>useIsMobile</code> devolve <code>false</code> no servidor e no primeiro quadro, então a tela pisca. O hook só entra quando a troca é de <em>primitiva</em> — um Dialog que vira Sheet.
      </DocNote>

      <DocNote title="Confira com a emulação de dispositivo ligada">
        Sem ela o navegador responde <code>pointer: fine</code>{" "}
        e metade destas
        regras não vale. Estreitar a janela do desktop não é a mesma coisa que
        emular um telefone.
      </DocNote>
    </>
  )
}
