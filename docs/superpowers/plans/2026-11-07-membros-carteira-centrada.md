# Membros no telefone: a carteira centrada com "Convidar pessoa", e a lupa de volta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** No telefone, a barra de Membros volta a ter a lupa (que abre a paleta), e o topo da tela vira a carteira centrada (opção 1 de `public/_mockups/membros-carteira.html`), com o "Convidar pessoa" dentro dela.

**Spec:** pedido do dono em 07/11/2026: "não gostei do botão adicionar lá em cima. Volte o botão de busca que abre o command e adicione a versão D com o adicionar convidado dentro da carteira. A carteira não pode ficar menor do que a parte de pessoas … Não mexa na parte de pessoas, só na de carteira e os botões." Escolheu a **opção 1** (sem cartão, centrada).

## Global Constraints

- **Desfazer a ação na barra** do commit `8756cb47`: a rota `/members` volta a ter a lupa à direita para todos (a mesma de antes, que abre a paleta). Tirar o que ficou sem uso (`mobileHeaderActionFor`, a publicação da ação pela página, os testes dela). Conferir com `git show 8756cb47 --stat` o que entrou e reverter só a parte da barra.
- **Topo da tela no telefone (abaixo do `md`), sem cartão, centrado:** o ladrilho da carteira (o mesmo `ColorTile` de hoje, no maior degrau, `2xl`), o **nome da carteira** em destaque (tipografia do design system, maior que os títulos de seção — p.ex. `H3`/`text-xl font-semibold` pela escala que existir), abaixo os avatares empilhados (`AvatarGroup`) + `{n} pessoas` / `1 pessoa` (o `rotuloDePessoas` de hoje), e abaixo **"Convidar pessoa"**: `Button variant="secondary"` com o ícone `UserPlusIcon`, tamanho padrão, abre o mesmo diálogo de convite. **Só o dono** vê o botão; os outros veem o bloco sem botão. Espaço: a carteira deve ter mais peso visual que a seção Pessoas (respiro em volta, nome grande).
- **Pessoas e Limites não mudam.** Desktop não muda (o `PageHeader` com "Convidar pessoa" segue).
- Design system do `AGENTS.md`; nada novo em `src/components/ui/` nem `globals.css`. Se o maior `ColorTile` ficar pequeno demais para o peso pedido, não crie degrau: reporte.
- Jornada: o convite no telefone sai da barra e vai para o bloco da carteira — atualizar `docs/JORNADAS.md` e `docs/atlas/template.html` e rodar `python3 docs/atlas/build.py`.
- Banco de dev = produção: não convidar (abrir o diálogo e fechar). Não trocar a carteira ativa.
- Commit só dos arquivos da tarefa; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; sem `git stash`; `graph.json` fora.

## Review Focus

1. `/members` no telefone: a lupa à direita (abre a paleta), nenhum botão de convite na barra, para dono e membro. Teste + navegador.
2. Dono vê "Convidar pessoa" no bloco da carteira; membro não. Teste.
3. Nada de `mobileHeaderActionFor` sobrando. `grep`.
4. A seção Pessoas sem diff. `git diff` de `pessoas-secao.tsx` vazio.
5. Desktop igual. Navegador.
