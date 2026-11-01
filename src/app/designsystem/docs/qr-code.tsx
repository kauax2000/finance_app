"use client"

import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { QrCode, QrCodeCopy, QrCodeSkeleton } from "@/components/ui/qr-code"
import { Caption } from "@/components/ui/typography"
import { Controles, DocNote, DocSection, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

/** O link que a tela de Configurações leva ao outro aparelho. */
const LINK = "https://app.finance.com.br/settings#no-celular"

function DemoNaTela() {
  const [copiar, setCopiar] = React.useState(true)
  const [esqueleto, setEsqueleto] = React.useState(false)

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        fim={
          <Interruptores>
            <Interruptor id="qr-copiar" rotulo="Copiar link" valor={copiar} onChange={setCopiar} />
            <Interruptor id="qr-esqueleto" rotulo="Esqueleto" valor={esqueleto} onChange={setEsqueleto} />
          </Interruptores>
        }
      />
      <div className="flex flex-col items-start gap-4">
        {esqueleto ? <QrCodeSkeleton /> : <QrCode value={LINK} label="Abrir o Finance no celular" />}
        {copiar ? <QrCodeCopy value={LINK} /> : null}
      </div>
      <Caption>No cursor o link do código não recebe clique: a placa só cresce. Passe o cursor para ver.</Caption>
    </div>
  )
}

/** O toque num telefone de verdade abre o link; aqui o clique é interceptado para a moldura não navegar. */
function NoTelefone() {
  const [aberto, setAberto] = React.useState(false)

  return (
    <IphoneFrame title="O QR Code num iPhone">
      <div className="flex h-full flex-col justify-center gap-4 px-4">
        {/* O clique sobe do link real (que o teclado também aciona); o `Card` só o escuta. */}
        <Card
          padding="sm"
          onClick={(e) => {
            // `instanceof` falha atravessando o iframe do catálogo: `closest` é duck typing.
            const link = (e.target as Element).closest?.("a[data-slot=qr-code-link]")
            if (!link) return
            e.preventDefault()
            setAberto(true)
          }}
        >
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium">No celular</p>
            <QrCode value={LINK} label="Abrir o Finance no celular" />
            <Caption>{aberto ? "Tocar abriu o link." : "Toque no código para abrir o link."}</Caption>
          </CardContent>
        </Card>
      </div>
    </IphoneFrame>
  )
}

export default function QrCodeDoc() {
  return (
    <>
      <Usage>
        O código que leva de uma tela a outro aparelho: o desktop mostra o QR e a câmera do celular abre o link. Use-o quando a pessoa precisa continuar a jornada em <strong>outro</strong> aparelho. Não o use para um link que abre na mesma tela — isso é um <code>Link</code>. Quem vai usar: Configurações, uma tela (a seção “No celular”); hoje nenhuma tela do app o monta. A placa tem 128px e não tem escada de tamanho; a margem de silêncio ocupa 12px de cada lado.
      </Usage>

      <DocSection
        title="Na tela"
        description="O código desenhado em SVG com tokens, e o botão que copia o link para quem não pode apontar a câmera. Sem value, ou com um que não cabe no maior QR, a peça mostra o esqueleto."
        code={`<QrCode value={link} label="Abrir o Finance no celular" />
<QrCodeCopy value={link} />`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A placa é clara nos dois temas">
        A placa pinta <code>bg-background</code> no tema claro e <code>bg-foreground</code> no escuro, com a tinta do módulo no par oposto (<code>text-foreground</code> e <code>dark:text-background</code>, lida por <code>currentColor</code>). É decisão do dono, e é a polaridade do padrão do código: módulos escuros sobre fundo claro. Medido no navegador, no tema escuro: placa <code>lab(98.26 0 0)</code> e módulos <code>lab(2.75 0 0)</code>, e o <code>BarcodeDetector</code> do Chromium decodificou o link do código nas duas polaridades. A leitura pela câmera de um telefone não foi medida. O anel é <code>ring-foreground/10</code>, para a placa não sumir contra o cartão.
      </DocNote>

      <DocNote title="A margem de silêncio é 12px">
        O <code>p-3</code> da placa é a margem de silêncio que a leitura exige, e o código é gerado com <code>border: 0</code> justamente para ela ser da placa. Os 104px de dentro, com o link desta página (33 módulos por lado, correção <code>M</code>), dão 3,15px por módulo. Não reduza o recuo para caber numa linha apertada.
      </DocNote>

      <DocNote title="No cursor o link não abre; no toque abre">
        O <code>&lt;a&gt;</code> tem <code>pointer-events-none</code> e só recebe o clique com <code>pointer-coarse:</code> — que vale com o dedo e abaixo de 48rem. No desktop o link não recebe clique do cursor; <code>Tab</code> e Enter continuam alcançando-o. Quem está no telefone toca no código e o link abre. O <code>label</code> é obrigatório: nomeia o link para o leitor de tela, que não lê o desenho.
      </DocNote>

      <DocSection
        title="No telefone"
        description="Na moldura, o toque chega ao link: tocar no código muda a legenda. A página só intercepta o clique para a moldura não navegar; no aparelho o link abre."
      >
        <NoTelefone />
      </DocSection>

      <DocNote title="A placa cresce com o cursor e com o toque">
        <code>hover:scale-110</code> com o par <code>active:scale-110</code>, em <code>--duration-fast</code> na curva <code>--ease-out</code>. É o único movimento da peça; não há laço.
      </DocNote>

      <DocSection
        title="Esqueleto"
        description="O osso na caixa de 128 da peça real. QrCode cai nele sozinho quando value está vazio ou não cabe no maior QR; group={false} dentro de um esqueleto de página."
        code={`<QrCodeSkeleton />
<QrCodeSkeleton group={false} />`}
      >
        <QrCodeSkeleton />
        <QrCode value="" label="Abrir o Finance no celular" />
      </DocSection>

      <PropsTable
        title="Props de QrCode"
        rows={[
          { prop: "value", type: "string", description: "O que o código leva, em geral um link. Vazio, ou além da capacidade do maior QR, mostra o QrCodeSkeleton. Correção M, sem borda." },
          { prop: "label", type: "string", description: "Para onde o código leva, lido pelo leitor de tela como o nome do link. Obrigatório." },
          { prop: "className", type: "string", description: "Posição e margem de quem monta; nunca cor nem tamanho do código." },
        ]}
      />

      <PropsTable
        title="Props de QrCodeCopy"
        rows={[
          { prop: "value", type: "string", description: "O texto copiado. Vazio desabilita o botão." },
          { prop: "className", type: "string", description: "Posição de quem monta, aplicada ao contêiner do botão." },
        ]}
      />

      <PropsTable
        title="Props de QrCodeSkeleton"
        rows={[
          { prop: "group", type: "boolean", default: "true", description: "Embrulha o osso num SkeletonGroup com o rótulo “Preparando o código”. false é para quem já está dentro de um." },
          { prop: "className", type: "string", description: "Posição de quem monta." },
        ]}
      />
    </>
  )
}
