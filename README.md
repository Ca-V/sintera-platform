# SINTERA

Plataforma de **continuidade da saúde**, centrada na pessoa ao longo do tempo. **Factual**: organiza e transcreve o
que está nos documentos, **sem interpretação clínica** (RDC 657/2022; LGPD Art. 11). Mobile-first · API-first · B2B2C.

Monorepo (npm workspaces): **Web** (Next.js, na raiz) + **`packages/*`** (núcleo compartilhado `@sintera/*`) +
**`apps/mobile`** (React Native + Expo).

## 👉 Comece por aqui

**[docs/GOV-002 — Onboarding e Handover](docs/GOV-002_ONBOARDING_HANDOVER.md)** é o primeiro documento a ler: visão,
organização do repositório, como rodar (Web e Mobile), portões de validação, fluxo de desenvolvimento, critérios de
aceite, estratégia de testes/documentação, handover e checklist de onboarding.

Fundação obrigatória: **[docs/ADR-000 — Princípios Arquiteturais](docs/ADR-000_ARCHITECTURAL_PRINCIPLES.md)**
(constituição) · **[docs/ARCH-000 — Arquitetura Documental](docs/ARCH-000_DOCUMENT_ARCHITECTURE.md)** (índice e
precedência) · **[docs/adr/ADR-012 — Continuidade Operacional](docs/adr/ADR-012_CONTINUIDADE_OPERACIONAL.md)**
(transferibilidade).

## Rodar a Web (resumo)

**Versão oficial do Node.js: 22 LTS** (pinada em [`.nvmrc`](.nvmrc); decisão em
[ADR-013](docs/adr/ADR-013_PADRAO_VERSAO_NODE.md)). Antes de rodar, confirme:

```bash
node -v        # esperado: v22.x.x
```

```bash
npm install    # na raiz (workspaces)
npm run dev    # http://localhost:3000
```

Validação: `npx tsc --noEmit` · `npx vitest run` · `npx next build` (todos devem passar).

## Rodar o Mobile

Ver **[docs/MOBILE-003 — Provisionamento do Ambiente Expo/EAS](docs/MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md)**.

---

> Conhecimento estrutural vive **no repositório**, não na memória de quem implementou (ADR-012). Ao mudar algo
> relevante, atualize a documentação **junto** com o código.
