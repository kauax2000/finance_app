# Aviso de nova versão no telefone — design curto

Data: 21/11/2026 · Aprovado pelo dono na conversa.

## Por quê

O aviso "Nova versão disponível · Atualizar" (`toastPersistentAction`, em
`src/app/sw-register.tsx`) é um toast pequeno no topo. O dono quer que ele fique
**mais claro e visível** no telefone.

## Abordagens consideradas

- **A · Pílula acima da barra de baixo** (no `accessory` da `BottomBar`, como o
  `OfflinePill`): perto do polegar, não cobre conteúdo; exigiria decidir a
  prioridade com o offline.
- **B · Toast maior e explicado** — **escolhida pelo dono**: título, frase e
  botão largo, no mesmo lugar de hoje. Menor mudança.
- **C · Gaveta de baixo**: a mais visível, mas interrompe; só para atualização
  obrigatória.

Mockups: https://claude.ai/artifact/1qrtRFtAsewdiCErigxXF4

## O que muda

- Título: "Nova versão do app".
- Descrição (telefone e desktop): "Atualize para ver as novidades. O que você já
  salvou continua aqui." (não prometer que "nada se perde": o recarregar apaga o
  que estiver sendo digitado).
- Rótulo do botão: "Atualizar agora".
- **No telefone (abaixo de 768px)**: forma empilhada do toast — texto em cima,
  botão de ação largo embaixo, alvo de 44px. No desktop, a ação fica ao lado,
  como hoje.
- Lugar, persistência (`Infinity`) e o recarregar ao sair da aba não mudam.

## Restrições

- A forma empilhada é mudança de design system em `src/components/ui/sonner.tsx`
  (autorizada pelo dono nesta conversa): opt-in só para quem pede, entra na
  página `/designsystem/sonner` e no `sonner-versions.test.ts`; tokens, sem
  literais.
- `src/lib/toast.ts` continua `.ts`; nenhuma tela importa o `toast` do sonner.
- `sw-register.test.ts` acompanha.

## Fora do escopo

Mostrar o que mudou na versão, mudar o momento em que o aviso aparece, a pílula
da `BottomBar`.

## Deixado ao builder

Como a forma empilhada é ligada (classe no toast, como `toast-pill`, ou opção de
`toastPersistentAction`), seguindo o padrão que o `sonner.tsx` já usa.
