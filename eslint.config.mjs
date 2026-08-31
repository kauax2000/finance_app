import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler advisory rules — warn so CI passes; fix incrementally.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    // Um conjunto de ícones é uma tipografia: o que faz a interface ler como
    // sistema é todos virem do mesmo desenho. Dois conjuntos não empilham —
    // eles têm espessura de traço, grade e cantos diferentes, e uma barra com
    // um ícone de cada lê como falha de renderização, não como escolha.
    //
    // Isto é o **porteiro**, e ele nasce verde: nenhuma destas bibliotecas está
    // no `package.json` hoje. Ele existe para o dia em que um `npm i` a
    // trouxer — aí o lint reprova antes de o primeiro ícone entrar. O que já
    // está dentro (`<svg>` colado à mão, conjunto errado para o tamanho) é
    // trabalho do auditor: `npm run ds:audit -- --rule G`.
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
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
              ],
              message:
                "Este projeto usa Heroicons, e só. size-6+ vem de @heroicons/react/24/outline, size-5 do 20/solid, size-4 e abaixo do 16/solid — eles são redesenhos, não escalas. Ver a seção Ícones em AGENTS.md.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    // Ferramental de agente, não código da aplicação: skills instaladas trazem
    // seus próprios scripts e afogariam o sinal do lint do produto.
    ".claude/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
  ]),
]);

export default eslintConfig;
