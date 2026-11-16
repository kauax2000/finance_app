/**
 * O movimento do Importar extrato, num lugar só.
 *
 * A primeira versão vestia a `dialog-step` (o `menu-content-in`: desfoque de 10px em 500ms) em
 * tudo, e o número trocava encolhendo a 40%; o dono achou "brusco, violento". Aqui cada peça
 * sobe 4px de um desfoque leve (4px), na curva de saída, uma depois da outra a 40ms — o
 * conteúdo assenta em vez de piscar. As classes vão por extenso: o Tailwind lê o texto.
 */

/** Os filhos diretos chegam em escada (o corpo de um passo). */
export const ESCADA =
    "[--stagger-base:0s] [--stagger-step:calc(var(--duration-instant)*0.4)] [--stagger-cap:6] [&>*]:animate-in [&>*]:fade-in-0 [&>*]:blur-in-xs [&>*]:slide-in-from-bottom-1 [&>*]:fill-mode-backwards [&>*]:duration-(--duration-spring) [&>*]:ease-(--ease-out) [&>*]:[animation-delay:var(--stagger-base)] [&>*]:stagger-ladder motion-reduce:[&>*]:animate-none"

/**
 * A lista que chega enquanto a caixa ainda cresce: a escada espera a vista velha esmaecer
 * (`--duration-base`), e o teto é 8 linhas.
 */
export const ESCADA_DA_LISTA =
    "[--stagger-base:var(--duration-base)] [--stagger-step:calc(var(--duration-instant)*0.4)] [--stagger-cap:8] [&>*]:animate-in [&>*]:fade-in-0 [&>*]:blur-in-xs [&>*]:slide-in-from-bottom-1 [&>*]:fill-mode-backwards [&>*]:duration-(--duration-spring) [&>*]:ease-(--ease-out) [&>*]:[animation-delay:var(--stagger-base)] [&>*]:stagger-ladder motion-reduce:[&>*]:animate-none"

/**
 * A tabela de "Ver todos": as linhas e a barra da busca chegam como a lista; a moldura e o
 * cabeçalho já estão lá, porque crescem com a caixa. No telefone quem chega são as linhas do gêmeo.
 */
export const ESCADA_DA_TABELA =
    "[--stagger-base:var(--duration-base)] [--stagger-step:calc(var(--duration-instant)*0.4)] [--stagger-cap:8] [&_tbody>tr]:animate-in [&_tbody>tr]:fade-in-0 [&_tbody>tr]:blur-in-xs [&_tbody>tr]:slide-in-from-bottom-1 [&_tbody>tr]:fill-mode-backwards [&_tbody>tr]:duration-(--duration-spring) [&_tbody>tr]:ease-(--ease-out) [&_tbody>tr]:[animation-delay:var(--stagger-base)] [&_tbody>tr]:stagger-ladder [&_[data-slot=table-panel-group]>*:not([data-slot=table-panel])]:animate-in [&_[data-slot=table-panel-group]>*:not([data-slot=table-panel])]:fade-in-0 [&_[data-slot=table-panel-group]>*:not([data-slot=table-panel])]:fill-mode-backwards [&_[data-slot=table-panel-group]>*:not([data-slot=table-panel])]:[animation-delay:var(--duration-base)] [&_[data-slot=table-panel-group]>*:not([data-slot=table-panel])]:duration-(--duration-spring) [&_[data-slot=data-table-mobile]>*]:animate-in [&_[data-slot=data-table-mobile]>*]:fade-in-0 [&_[data-slot=data-table-mobile]>*]:blur-in-xs [&_[data-slot=data-table-mobile]>*]:slide-in-from-bottom-1 [&_[data-slot=data-table-mobile]>*]:fill-mode-backwards [&_[data-slot=data-table-mobile]>*]:duration-(--duration-spring) [&_[data-slot=data-table-mobile]>*]:ease-(--ease-out) [&_[data-slot=data-table-mobile]>*]:[animation-delay:var(--stagger-base)] [&_[data-slot=data-table-mobile]>*]:stagger-ladder motion-reduce:[&_tbody>tr]:animate-none motion-reduce:[&_[data-slot=table-panel-group]>*]:animate-none motion-reduce:[&_[data-slot=data-table-mobile]>*]:animate-none"

/** A conferência inteira só esmaece ao chegar: a lista de dentro já tem a própria escada. */
export const ESMAECE_AO_CHEGAR =
    "animate-in fade-in-0 fill-mode-backwards duration-(--duration-slow) ease-(--ease-out) motion-reduce:animate-none"

/** A vista que sai no Ver todos e no Recolher: esmaece sem pressa, em `--duration-base`. */
export const VISTA_QUE_SAI = "transition-opacity duration-(--duration-base) ease-(--ease-out)"
/** Os 200ms de `--duration-base`, para a reserva do fim da transição. */
export const VISTA_QUE_SAI_MS = 200

/**
 * Os passos do cabeçalho: somem no Ver todos. Esmaecem com a conferência (`data-saindo` na raiz
 * dela) e, ao voltar no Recolher, chegam esmaecendo, em vez de saltar.
 */
export const PASSOS_ACOMPANHAM =
    "transition-opacity duration-(--duration-base) ease-(--ease-out) group-has-[[data-saindo]]/dialog-content:opacity-0 animate-in fade-in-0 fill-mode-backwards motion-reduce:animate-none"
