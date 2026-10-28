# Lançamento inteligente — v2 da tela (pedido do dono, 2026-10-27)

O dono recusou a v1: "copiou tudo do command, mas a ideia não era essa". A
paleta com lista de exemplos, prévia ao vivo, sub-páginas e dock sai. Do
command fica só **a cara do campo** (a pílula bonita). O resto da lógica
(parser, IA, foto, `salvar()`, interruptor, compartilhar, regras do convidado,
estorno, ⌘K) continua como está.

## A tela

1. **Ao abrir, só o campo.** Uma pílula de texto grande (a cara da busca do
   `CommandDialog`, com o feixe se for possível sem mexer em `ui/`) com o
   placeholder "Ex.: 42 mercado nubank". **Ao lado dela, uma pílula redonda**
   (botão circular, ícone de câmera) para adicionar o recibo. Nada abaixo:
   sem exemplos, sem lista, sem dock.
2. **Enter no campo = lançar a frase.** O app interpreta (parser local; se o
   valor ou a descrição ficarem em dúvida, a IA lê uma vez, com "Lendo com
   IA…") e **abre uma seção abaixo do campo** com a revisão.
3. **A revisão mostra todos os campos**, identificados ou não, um por linha:
   Tipo (com o motivo, "por causa de “em 10x”"), Valor, Descrição, Categoria,
   Forma/Cartão, Data, Parcelas. O que não foi identificado aparece como
   "Não identificado"; o que está em dúvida leva o selo "Confira"; o que a IA
   leu, "IA".
4. **Cada linha se edita no lugar**: tocar na linha troca o valor pelo
   controle do design system do campo (Input money, Input, Combobox de
   categoria, Select de forma/cartão, DatePicker, Select de tipo, número de
   parcelas). Confirmar volta à linha. Edição à mão vence a frase.
5. **Rodapé da revisão**: "Aprovar" (primary, salva pelo `salvar()`; desabilitado
   com o motivo "Falta o valor"/"Falta o cartão") e "Formulário completo"
   (tertiary, a troca de casca de hoje). A revisão é um `Form` (regra do
   AGENTS.md); "Aprovar" é o único submit.
6. **Recibo**: tocar na pílula redonda abre a câmera/arquivos; colar (⌘V) e
   soltar imagem no campo continuam. Lida a foto, a revisão abre sozinha, com
   a miniatura do recibo no topo dela (× remove).
7. Reescrever a frase com a revisão aberta e dar Enter de novo reinterpreta,
   mantendo as edições à mão.

## Restrições

As mesmas do spec v1 (`2026-10-27-lancamento-inteligente-design.md`):
nenhum arquivo em `src/components/ui/` nem `globals.css`; tokens; Heroicons
pela régua de tamanho; `type` em todo `<button>` cru; banco de produção
nunca gravado. Telefone: a casca vira gaveta/topo como hoje, e a pílula
redonda tem alvo de 44.
