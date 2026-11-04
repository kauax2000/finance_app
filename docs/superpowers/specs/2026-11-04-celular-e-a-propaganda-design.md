# Configurações: o lançamento mora no celular — design

Data: 2026-11-04. Pedido do dono: "A parte de lançar gastos pelo iPhone só faz sentido aparecer, e tudo que tem dentro dela, [...] no celular. [...] melhore a propaganda para baixar o app que aparece no Configurações, trazendo as funcionalidades novas [...]. E faça com que a sessão lançar gastos pelo iPhone apareça só no mobile celular. No app PWA baixado."

## Intenção

O computador é para **enxergar e organizar**; o dia a dia, **o lançamento na rua**, é no celular. Configurações deve dizer isso em cada aparelho:

- **No computador**, a propaganda vende o celular: as vantagens de instalar o app e configurá-lo, com as funcionalidades novas.
- **No celular pelo navegador**, o convite é pôr o app na tela de início ("salvar o app na tela de início, para ser usado como app"), sem a palavra PWA. Enquanto não há app nativo, é assim que o Finance vira app, e o navegador perde o que o app instalado tem.
- **No iPhone com o app instalado**, a seção "Lançar gastos pelo iPhone" aparece, com tudo o que tem dentro (aparelhos, guia do atalho, Lançar ao pagar).

As vantagens, nas palavras do dono: **lançar pela Siri, lançar pelos botões, o formulário, usar o Apple Pay**.

## Decisões do dono

1. "Lançar gastos pelo iPhone" (`AtalhoSecao`, com o `ApplePayConvite` dentro) só aparece **no celular, com o app instalado**.
2. A propaganda de Configurações no computador (`NoCelularCartao`, seção "No celular" do `ThemeSettings`) passa a trazer as funcionalidades novas como vantagens de instalar.
3. No celular pelo navegador, no lugar da seção, um convite para instalar.
4. **Android**: o Chrome instala o app, mas Siri, Atalhos e a automação do Apple Pay são do iPhone. A seção nunca aparece no Android; o convite para instalar aparece nos dois sistemas; as vantagens do iPhone só aparecem a quem está no iPhone, e no computador a propaganda diz que são do iPhone.

## O que muda

### Quem vê o quê (a regra)

| Aparelho | "Lançar gastos pelo iPhone" | Convite para instalar | Propaganda "No celular" |
| --- | --- | --- | --- |
| Computador (`md` para cima) | não | não | sim, a nova |
| Celular no navegador, iPhone | não | sim, com as vantagens do iPhone e "Como instalar" | não |
| Celular no navegador, Android | não | sim, sem as vantagens do iPhone, com o caminho pelo menu do navegador | não |
| iPhone com o app instalado | **sim**, como hoje | não | não |
| Android com o app instalado | não | não | não |

"Instalado" é o `useDisplayMode().isStandalone`; "iPhone" é o aparelho iPhone pelo `userAgent` (`/iphone/i`), e não a largura: um iPhone instalado deitado (768px ou mais) continua vendo a seção. *(Do construtor: o iPad fica de fora, por isso não serve o `useIsIos()`, que inclui o iPad; a Carteira do iPad não tem a automação do Apple Pay.)* A troca entre computador e celular no navegador segue o `useIsMobile()` (abaixo de 768px), a régua que o `ThemeSettings` já usa.

**Sem piscar** *(do construtor)*: no servidor os três hooks respondem `false`, que é o estado "computador". Os blocos desta regra não desenham nada até o cliente saber o aparelho (um `useSyncExternalStore` com o servidor devolvendo "ainda não sei"); o vão dura um quadro.

**Android instalado** não vê nada no lugar da seção (nem convite, nem propaganda), como diz a tabela.

**Âncora**: nenhum link, notificação ou `next` aponta para a seção (procurado em `src` e `supabase/functions`); o QR leva a `/me#no-celular`, que não muda.

"IAs conectadas" e "Notificações" continuam em todos os aparelhos. *(Palpite do construtor, não contestado.)*

### A propaganda no computador (`NoCelularCartao`)

- O título diz que o dia a dia é no celular (ex.: "O dia a dia é no celular"), e uma linha curta diz que o computador é para ver e organizar.
- A lista de vantagens troca as duas de hoje ("Lance digitando uma frase", "Tenha o app na tela inicial") por:
  - Lance falando com a Siri, ou com um toque: Botão de Ação, Tela Bloqueada, ícone. *(iPhone)*
  - Um formulário rápido quando não dá para falar. *(iPhone)*
  - Pague com Apple Pay e o gasto entra sozinho. *(iPhone)*
  - Lance digitando uma frase, com o app na tela de início.
- As três do iPhone carregam "no iPhone" (um rótulo ou um sufixo), para quem tem Android não esperar por elas.
- O QR, o "Copiar link", o aparelho que vaza da borda e o comportamento abaixo de 36rem continuam. O cartão pode crescer de altura para caber a lista.
- O `alcance` da seção "No celular" acompanha (hoje: "Lance por frase e instale o app no telefone.").

O texto final é do construtor, dentro dessas ideias. Ícones Heroicons, 16/solid (a regra do tamanho).

### O convite no celular pelo navegador (novo, em `src/components/settings/`)

- Mora em Configurações no lugar de "Lançar gastos pelo iPhone", com o mesmo título de seção na forma do `SettingsSection` (ex.: "Use como app").
- Um `Card` com a `JanelaDoAparelho` (a tela da notificação, `TELA_DA_NOTIFICACAO`, como o vazio de hoje), um título ("Ponha o Finance na tela de início"), uma frase sobre usar como app (abre direto, tela cheia, avisos) e, **no iPhone**, a lista das vantagens do iPhone.
- **iPhone**: botão "Como instalar", que abre o `InstallPwaSheet` que já existe (o mesmo do `NesteCelularGrupo`).
- **Android**: sem botão; a frase diz o caminho, "No menu do navegador, toque em Instalar app". *(Do construtor: o `beforeinstallprompt` fica fora deste escopo.)*
- Só peças do design system (`Card`, `EmptyState` ou `Item`, `Button`, `JanelaDoAparelho`); nada em `src/components/ui/`.

### Lançar gastos pelo iPhone

- Sem mudança por dentro. Só a condição de aparecer.
- Consequência aceita: no computador não se gerencia mais os aparelhos (desconectar, baixar de novo); isso se faz no iPhone.

## Fora

- App nativo, `beforeinstallprompt` no Android, lançamento rápido no Android.
- Mudar o "Instalar o app" de Você › Neste celular.
- Mudar "IAs conectadas" e "Notificações".

## Anti-objetivos

- A seção do iPhone aparecer num Android ou no computador.
- Prometer Siri ou Apple Pay a quem está num Android.
- A palavra "PWA" (ou "standalone") num texto de tela.
- Um piscar na carga: a seção aparecer e sumir porque a detecção de modo chega depois (o `useSyncExternalStore` do `useDisplayMode` responde `false` no servidor; o lado que depende de "instalado" não pode desenhar antes de saber).

## Restrições

- Design system do `AGENTS.md`: tokens, Heroicons, `Card`, `SettingsSection`/`SettingsRow`, nada em `src/components/ui/` nem `globals.css` sem ok.
- Mudança de jornada: tirar a seção do computador muda de onde se abre o `GuiaDoAtalho` e o Lançar ao pagar. Atualizar `docs/JORNADAS.md`, `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e republicar o Atlas no mesmo URL.
- Testes de fonte (vitest, `lerFonte`/`semComentarios`) no padrão de `src/components/settings/settings-page.test.ts`.
- Não rodar prettier nos arquivos de `src/components/account/`.
- O banco de desenvolvimento é o de produção: verificação no navegador só lendo.

## Do construtor

- Nome dos componentes e dos testes, o texto final dentro das ideias acima, o desenho exato do convite e se a regra de quem vê o quê vira um hook pequeno.
