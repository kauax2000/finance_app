// Bibliotecas de ícone que não são a deste projeto — a lista é uma só, e dois
// guardas a leem: o `no-restricted-imports` do `eslint.config.mjs` (o porteiro)
// e a regra G do `ds:audit` (o relatório).
//
// Nenhuma delas está no `package.json` — e é justamente por isso que a regra
// existe: o custo de instalar uma é um `npm i`, e o de conviver com duas é
// permanente. Dois conjuntos não empilham: eles têm espessura de traço, grade e
// cantos diferentes, e uma barra com um ícone de cada lê como um erro de
// renderização, não como uma escolha.
//
// A grafia é a do `group` do ESLint: `pacote/*` cobre os subcaminhos.
export const FORBIDDEN_ICON_PACKAGES = [
  "lucide-react",
  "react-icons",
  "react-icons/*",
  "@radix-ui/react-icons",
  "@tabler/icons-react",
  "phosphor-react",
  "@phosphor-icons/react",
  "@phosphor-icons/react/*",
  "react-feather",
  "feather-icons",
  "@fortawesome/*",
  "@mui/icons-material",
  "@mui/icons-material/*",
  "boxicons",
  "ionicons",
]
