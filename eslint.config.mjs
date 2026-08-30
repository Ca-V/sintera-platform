import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Arquivos de configuração CommonJS (Metro/Babel) usam `require()` por design — é o formato
  // oficial do Expo (ver ADR-014). A regra genérica no-require-imports não se aplica a eles.
  {
    files: ["**/metro.config.js", "**/babel.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // O SUBLINHADO MARCA O DESCARTE INTENCIONAL — e sem esta configuração ele era só decoração.
  //
  // Por que isto importa mais do que parece: em 30/08, "símbolo declarado e nunca referenciado" revelou
  // quatro defeitos reais numa tarde — um "Editar" escrito e nunca ligado, dois campos que a pessoa
  // preenchia e a plataforma descartava, e uma capacidade que existia só numa das pontas. O aviso é um bom
  // detector de defeito.
  //
  // Um detector só serve enquanto todo alerta significa alguma coisa. Misturado com descartes legítimos —
  // um parâmetro que a assinatura exige e o corpo não usa — ele vira ruído, e ruído a gente aprende a
  // ignorar. Aqui o sublinhado passa a dizer "é de propósito", e o que sobra volta a merecer investigação.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
    },
  },
]);

export default eslintConfig;
