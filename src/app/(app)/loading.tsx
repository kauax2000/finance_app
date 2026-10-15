/**
 * A fronteira de carregamento de toda rota do app que não declara a sua
 * (ajustes, planos, membros). Sem nenhum `loading.tsx` acima dela, uma rota
 * dinâmica não é pré-carregada e o clique espera a resposta do servidor antes
 * de trocar de tela; com ela, a navegação acontece na hora e a página mostra o
 * próprio esqueleto enquanto os dados chegam. Vazia de propósito: um esqueleto
 * genérico piscaria antes do esqueleto certo da página.
 */
export default function Loading() {
    return null
}
