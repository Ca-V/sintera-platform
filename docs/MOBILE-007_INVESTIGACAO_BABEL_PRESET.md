# MOBILE-007 — Investigação: `Cannot find module 'babel-preset-expo'` (SDK 54)

> **Natureza:** log de investigação (diagnóstico por evidência). **Modo diagnóstico — nenhuma correção aplicada.**
> **Independente** — não assumir "mesmo aninhamento do npm" como fato (é hipótese explicativa). Continuidade ([[ADR-012]]).
> **Contexto:** [[UPG-001]] (migração SDK 54) — build nativo OK, mas o bundle JS falha na transformação babel/Metro.

## Sintoma
```
Android Bundling failed — Cannot find module 'babel-preset-expo'
Require stack: node_modules/@babel/core/... ← node_modules/expo/node_modules/@expo/metro-config/...
```

## Respostas (com evidência)
1. **Existe fisicamente?** **SIM.**
2. **Versão?** **`54.0.12`** (`~54.0.12`, alinhada ao SDK 54).
3. **Onde?** `node_modules/expo/node_modules/babel-preset-expo` — **ANINHADO** em `expo`. *(No snapshot SDK 53, git prova que estava **HOISTED na raiz** — `node_modules/babel-preset-expo`.)*
4. **Quem depende?** **Apenas `expo@54.0.36`.** **Não** é dep direta do app (`apps/mobile/package.json` não o declara).
5. **`babel.config.js` conforme a doc oficial?** **SIM, exatamente** — a [doc oficial](https://docs.expo.dev/versions/latest/config/babel/) recomenda `api.cache(true)` + `presets: ['babel-preset-expo']`, idêntico ao nosso. **O config NÃO é a causa.**
6. **A doc oficial exige `babel-preset-expo` como devDependency direta?** A página de babel **não afirma explicitamente**. Porém, projetos do **`create-expo-app` incluem `babel-preset-expo` como `devDependency`** por padrão — logo, o **template oficial o traz como dep direta do app**, e o nosso app **desvia** (depende dele só como transitivo do `expo`).
7. **Bug conhecido / issue no GitHub do Expo para este erro exato (SDK 54 monorepo)?** **Não encontrado** repro idêntico. Há discussões relacionadas de resolução de módulos em monorepo (pacotes não hoistados), mas **não idênticas**. → **fortemente compatível, não idêntico.**
8. **Causa provável?** **Configuração / resolução de módulos** — **não** cache, **não** bug do SDK. Mecânica (com evidência): a versão 54 do `babel-preset-expo` **peer-depende de `expo`** (`{expo:"*", @babel/runtime, react-refresh}`); o npm **aninha** o pacote sob `expo` (peer circular); o `@babel/core` (na raiz) **não resolve** o preset aninhado; e o app **não o declara** como dep direta (que é o que o template oficial faz). No SDK 53 o preset **não** peer-dependia de `expo` → ficava hoisted → resolvia. O upgrade expôs a **lacuna de configuração** (dep direta ausente).

## Distinção fato × hipótese (conforme solicitado)
- **FATO:** o preset está aninhado; era hoisted no SDK 53; peer-depende de `expo` no 54; não é dep direta do app; o `babel.config.js` está correto.
- **HIPÓTESE (forte, não provada):** o aninhamento é a **mesma família** do ARCH-001 (peer-circular). Mesmo que seja, a **solução** aqui é distinta da do autolinking (que o SDK 54 resolveu): é **conformidade com o template oficial** — declarar `babel-preset-expo` como `devDependency` direta do app.

## Correção recomendada (aguardando autorização — NÃO aplicada)
Alinhar ao template oficial do Expo: **declarar `babel-preset-expo@~54.0.12` como `devDependency` direta** em `apps/mobile/package.json` (torna-o resolvível/hoistado, como o `create-expo-app`). Coerente com a política [[ARCH-001]] ("conformidade com o ecossistema oficial"). Validar depois via os itens 4–8 de UPG-001.
