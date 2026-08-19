# SEC-016 — Triagem de findings SAST/SCA/Secrets · v0.1 (baseline)

> **Natureza:** triagem/registro dos findings do gate `security-scan` (introduzido no S0-A). **Checks permanecem
> INFORMATIVOS** (não bloqueantes) — **nenhuma** mudança no CI neste lote; **nenhuma** ferramenta nova; **nenhum**
> upgrade de dependência (bumps de `next`/`expo` são material/fora de escopo). Fonte: `npm audit` no baseline
> `feat/fase-c-sql-source @ 1e77c79`.

## 1. Panorama (SCA — `npm audit`)
- **Total:** 26 pacotes vulneráveis · **críticos: 0** · **high: 15** · **moderate: 11**.
- **Diretos:** `expo` (high), `next` (high), `expo-dev-client` (moderate). Demais são **transitivos**.
- **SAST (CodeQL)** e **secret scan (TruffleHog):** executam no Actions (S0-A) — sem findings bloqueantes reportados; a triagem de alertas do CodeQL vive na aba *Security* (acompanhamento contínuo).

## 2. Classificação por natureza
### 2.1 Cadeia Expo/Metro (tooling de build **mobile**, dev-time) — **maioria**
`expo`, `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro`, `@expo/metro-config`,
`@expo/prebuild-config`, `expo-asset`, `expo-constants`, `expo-dev-client`, `expo-dev-launcher`, `expo-manifests`,
`metro`, `metro-config`, `metro-transform-worker`, `image-size`, `postcss`, `uuid`, `xcode`.
- **Natureza:** ferramentas de **build/dev** do app mobile; **não** compõem a superfície de runtime de produção da Web.
- **Exploitabilidade (verificável):** condicional a processar entrada maliciosa em **build** (ex.: `image-size` ICNS DoS, `postcss` XSS no stringify) — baixa exposição em runtime.
- **Fix:** upgrade major de `expo` (`fixAvailable: expo`). **Tratamento:** lote de manutenção **mobile** dedicado (material — fora deste lote). **Owner:** TBD (mobile).

### 2.2 Web/runtime — acompanhar
| Pacote | Sev | Nota | Fix | Tratamento |
|---|---|---|---|---|
| `next` (direto) | high | Middleware/Proxy bypass (App Router + Turbopack + single locale) | upgrade `next` | avaliar condição de aplicabilidade; bump é material (pode quebrar build) — Owner TBD (web) |
| `sharp` (via next) | high | CVEs libvips (processamento de imagem) | `fix: next` | idem bump `next` |
| `undici` | moderate | response desync via retry interceptor | fix | acompanhar; transitivo |
| `nanoid` | high | loop com size zero | fix | baixo risco (uso interno) |
| `fast-uri` | high | host confusion via backslash | fix | transitivo |
| `brace-expansion` | high | DoS (expansão ilimitada) | fix | transitivo (build) |
| `js-yaml` | high | consumo quadrático de CPU (CVE-2026-59870); fix não backportado | — | acompanhar; só relevante se parsear YAML não confiável |

## 3. Exceções justificadas (baseline)
- **Cadeia Expo/Metro:** aceita como **débito conhecido** de tooling mobile dev-time; risco de runtime de produção **baixo**; correção depende de upgrade major de `expo` → lote mobile próprio. **Não bloqueia** o CI.
- **Bumps de `next`/`expo`:** **fora do escopo** deste lote (poderiam quebrar build/Ciclo 1); registrados como follow-up material com owner TBD.

## 4. Política de bloqueio (proposta — NÃO aplicada agora)
- **Manter informativo** (`continue-on-error`) neste lote, como o lint.
- **Critério futuro para tornar bloqueante** (decisão sua, SEC-016 material): zero **críticos**; highs de **runtime** com fix aplicado ou exceção aprovada com owner/prazo; baseline de exceções versionado.

## 5. Estado
Findings triados e registrados. **CI permanece informativo.** Nenhum upgrade/mudança de ferramenta feito. Tornar o
gate bloqueante e aplicar upgrades são passos **materiais** — dependem da sua autorização.
