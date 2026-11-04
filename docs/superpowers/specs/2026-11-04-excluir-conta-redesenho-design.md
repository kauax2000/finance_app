# Excluir conta: redesenho — design

Data: 2026-11-04. Pedido do dono: "Melhore o design, layout e usabilidade dessa modal/drawer de excluir conta." Escolhido nos mockups: **C · dois passos enxutos + "exporte antes"**.

## Por quê
Hoje o passo 1 grita e cansa: alerta vermelho grande, título vermelho, cinco caixas com borda que parecem botões, carteiras compartilhadas em vermelho, e a tela rola. O passo 2 pede e-mail **e** senha, e o e-mail não prova nada que a senha já não prove. Uma ação sem volta pede uma pausa clara, não um mural de vermelho, e o arrependimento mais comum (perder o histórico) se evita oferecendo uma cópia antes.

## O que muda (`src/components/security/DeleteAccountDialog.tsx`, no `Dialog surface="auto"`: diálogo no desktop, gaveta no celular)

### Passo 1 · Aviso
- Cabeçalho: o poço do ícone (lixeira) no tom de perigo, título **"Excluir conta"** na cor normal, descrição **"Passo 1 de 2 · Não dá para desfazer."** O indicador de passos de hoje (`DialogSteps`) fica.
- **Sai** o `Alert` vermelho "Atenção".
- **O que será apagado**: um rótulo curto ("O que será apagado") e **um** cartão de linhas (`Card padding="none"` + `ItemGroup variant="divided"`), com ícone em cada uma, no lugar das cinco caixas:
  - "Todos os lançamentos"
  - "Carteiras e categorias"
  - "Perfil e preferências"
- **Carteiras compartilhadas** criadas pela pessoa (a busca de hoje, sem mudar): um `Alert tone="warning"` (amarelo, não vermelho) com uma linha por carteira — "**<Nome>** some para N outros membros · M lançamentos"; enquanto conta, "Contando…". Sem carteira compartilhada, não aparece.
- **Guardar uma cópia**: um cartão com "Quer guardar uma cópia antes?" e o botão **"Exportar meus dados"**, que baixa o mesmo `.zip` do Cofre aberto (`exportarTudo` com as carteiras da pessoa). Enquanto exporta, o botão mostra a espera (`pending`); com erro, "Não foi possível exportar agora. Tente novamente." no próprio cartão.
- Rodapé: **Cancelar** (`tertiary`) e **Continuar** (`primary`), como hoje.

### Passo 2 · Confirmação
- Título **"Confirme com sua senha"**, descrição "Passo 2 de 2 · Sua conta e os dados acima serão apagados."
- **Só a senha** (o campo de e-mail sai). O botão **"Excluir conta"** (`destructive`) fica desabilitado sem senha; **Voltar** à esquerda.
- O erro da Edge (senha errada etc.) continua no `Alert` do passo.

### Sucesso
- Como hoje.

### Do construtor
- A exportação vira uma função só, `baixarExportacao(carteiras)` em `src/lib/cofre/baixar.ts` (o corpo que hoje está em `cofre-aberto-wireframe.tsx`: o `Blob`, o link anexado, o `revokeObjectURL` depois de 60s), usada pelo Cofre e pelo diálogo.
- Ícones das linhas: `BanknotesIcon` (lançamentos), `WalletIcon` (carteiras e categorias), `UserCircleIcon` (perfil), `20/solid`, `size-5`, cor `muted-foreground`.
- "Exportar meus dados" é `Button variant="secondary"` (sozinho no corpo: a regra do par vale para o rodapé).

## Anti-objetivos
- Vermelho em tudo: o vermelho fica no poço do ícone e no botão final.
- Linhas que parecem clicáveis sem ser.
- Exportar que fecha o diálogo ou leva para outra tela.
- Excluir com um toque só (a pausa do passo 2 fica).

## Restrições
- Design system do `AGENTS.md` (composição; nada novo em `ui/`); rodapé de diálogo pela tabela do `AGENTS.md`.
- O banco de dev é o de produção: **nunca** confirmar a exclusão na verificação; exportar só baixa (só leitura), pode ser testado.
- Abre de dois lugares (Editar perfil › Segurança e Cofre aberto): os dois seguem funcionando.
- Mudança de jornada (passo 2 muda o que pede): `docs/JORNADAS.md` (Minha conta e Cofre), template, `build.py`, republicar.
