# GOV-002 — Onboarding e Handover

> **Propósito:** ser o **primeiro documento** que um novo desenvolvedor/equipe lê ao assumir o projeto SINTERA.
> Materializa o princípio [[ADR-012]] (Continuidade Operacional). **Não duplica** conteúdo — é um **índice
> operacional** que aponta para os documentos canônicos (ADR-001/SSOT).
> **Status:** vivo · atualizado a cada grande fase (Web, Onda 0, Onda 1, …).

---

## 1. O que é o SINTERA (visão em 1 minuto)
Plataforma de **continuidade da saúde**, centrada na pessoa ao longo do tempo. **Factual**: organiza/transcreve o
que está nos documentos, **não interpreta clinicamente** (RDC 657/2022; LGPD Art. 11). Modelo **B2B2C**.
Mobile-first + API-first. Leitura fundacional: [[ADR-000]] (constituição — princípios e invariantes) e
[ARCH-000](./ARCH-000_DOCUMENT_ARCHITECTURE.md) (arquitetura documental e precedência).

## 2. Como o repositório se organiza
Monorepo **npm workspaces** (`package-lock.json` na raiz):
- **Web** (produto de referência): app **Next.js** na raiz (`src/app`, `src/lib`, `src/components`). Stack: React 19,
  TypeScript, Tailwind v4, **Supabase** (projeto `pxiglvrgxooawetboglb`).
- **`packages/*`** (núcleo compartilhado Web+Mobile): `@sintera/{core, api-client, types, validation, design-system,
  config, utils}`.
- **`apps/mobile`** (React Native + Expo ~53): app móvel; adaptador do DS em `apps/mobile/src/design-system`.
- **`docs/`** documentação; **`docs/adr/`** decisões arquiteturais; **`tests/`** testes (incl. `tests/contracts/*` ARCH).

## 3. Princípios de engenharia (canônicos — não duplicar aqui)
- [[ADR-000]] — constituição (14 princípios + invariantes). **Vence em conflito.**
- [[ADR-001]] — Projeção sem duplicação + **SSOT** (ponto único de edição/verdade).
- [[ADR-012]] — **Continuidade Operacional** (transferibilidade; conhecimento no repo, não na memória).
- **DS-002** ([DS-002_DESIGN_SYSTEM_UNIFICADO](./DS-002_DESIGN_SYSTEM_UNIFICADO.md), [FREEZE](./DS-002_FREEZE.md)) —
  Design System é a **única** fonte de identidade; Web e Mobile só **traduzem**. Congelado.
- [[ADR-011]] — recipes **headless** + adaptadores finos (componentes cross-platform).
- [ARCH-002](./ARCH-002_MOBILE_FIRST_API_FIRST.md) — Mobile-first · API-first.
- Governança mensurável: [[GOV-001]] (Governance Coverage Matrix) · [COMPLIANCE-001](./COMPLIANCE-001_GOVERNANCA.md).

## 4. Como rodar (Web) — ambiente local
**Versão oficial do Node.js: 22 LTS** — referência no [`.nvmrc`](../.nvmrc), decisão em [[ADR-013]]. Antes de tudo,
confirme a versão (mudanças de versão são deliberadas e documentadas, nunca "porque funcionou na minha máquina"):
```bash
node -v                # esperado: v22.x.x
```
```bash
npm install            # na RAIZ (workspaces instalam packages/* e apps/*)
npm run dev            # Next.js em http://localhost:3000
```
Variáveis de ambiente: ver o `.env`/`.env.local` da Web (chaves **públicas** do Supabase; **nunca** Service Role).

## 5. Como rodar (Mobile) — ver guia dedicado
Provisionamento completo e reproduzível: **[MOBILE-003](./MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md)** (Node 22, Android
Studio+SDK, AVD, EAS, dev client, `.env`, critérios de validação e checklist). Arquitetura do app: [[MOBILE-001]]
(plano por ondas) · [MOBILE-002](./MOBILE-002_ADAPTADOR_DS_RN.md) (adaptador DS→RN).

## 6. Validação — os portões que TODA entrega precisa passar
```bash
npx tsc --noEmit                 # tipos (Web) — verde
npx vitest run                   # suíte de testes + contratos ARCH — verde
npx next build                   # build de produção da Web — verde
# Mobile (no ambiente Expo):
cd apps/mobile && npm run typecheck   # tsc do RN — verde
```
Os **contratos ARCH** (`tests/contracts/*.ARCH.test.ts`) garantem invariantes (ex.: paridade de identidade Web↔Mobile
no DS). Um contrato quebrado = build vermelho.

## 7. Fluxo de desenvolvimento (o ciclo que sustentou a Web e guia o Mobile)
1. **Implementar** um incremento funcional pequeno e observável.
2. **Executar** (Web no navegador; Mobile no emulador/dispositivo).
3. **Validar** — build verde · testes verdes · auditoria arquitetural · validação funcional.
4. **Corrigir** o que a validação apontar.
5. **Relatório executivo** ao final do incremento: funcionalidade · contratos evoluídos · impactos Web · impactos
   Mobile · evidências de validação · riscos/pendências. (Sem detalhe de arquivos/commits, salvo decisão arquitetural.)
6. **Commit + push** verificáveis por subitem.

## 8. Critérios de aceite
Nada é "concluído" sem: tipos verdes · testes verdes · build verde · auditoria arquitetural · validação funcional em
ambiente executável · documentação atualizada. Mudança que afete **arquitetura/identidade/modelo de dados/estratégia de
produto** exige **decisão explícita** (emenda ao doc superior ANTES do código — ver ARCH-000/precedência).

## 9. Estratégia de testes
- **Unidade/domínio + contratos ARCH** via **vitest** (`tests/`, `tests/contracts/`).
- Contratos ARCH protegem invariantes cross-platform e do DS; adicione um novo contrato ao criar/alterar um invariante.
- Build de produção (`next build`) como teste de integração da Web.

## 10. Estratégia de documentação
- Toda decisão relevante vira/atualiza um doc em `docs/` (ADR para decisões arquiteturais; XXX-NNN por domínio/área).
- **Referenciar, não copiar** (ADR-001/SSOT). Índices: [ARCH-000](./ARCH-000_DOCUMENT_ARCHITECTURE.md) e
  [MASTER_DOCUMENT_INDEX](./MASTER_DOCUMENT_INDEX.md).
- Registrar o **motivo** da decisão, não só a mudança.

## 11. Estado atual do projeto (atualizar a cada fase)
- **Web:** encerrada e estabilizada como implementação de **referência** (auditoria positiva).
- **DS-002:** congelado (SSOT de identidade). **Onda 0 (Mobile):** concluída (adaptador DS→RN + contratos de paridade).
- **Mobile:** em **provisionamento do ambiente** (MOBILE-003). Próximo marco = 1º Development Build rodando →
  inicia **Onda 1 — Autenticação** ([[MOBILE-001]]).
- Registro de solicitações/decisões da fundadora: [SOLICITACOES_FUNDADORA](./SOLICITACOES_FUNDADORA.md).

## 12. Processo de Handover (transferência para nova equipe)
Ao transferir, garantir que o novo time tenha:
1. **Este GOV-002** + [[ADR-000]] + [ARCH-000](./ARCH-000_DOCUMENT_ARCHITECTURE.md) lidos.
2. Ambientes reproduzíveis: Web (§4) e Mobile ([[MOBILE-003]]) rodando localmente.
3. Acessos: repositório, **Supabase** (`pxiglvrgxooawetboglb`), **Expo/EAS** (owner `sintera-health-tech`), contas de
   loja (Apple/Google) quando aplicável. **Segredos nunca no repo** — transferidos por canal seguro.
4. Portões de validação (§6) verdes na máquina do novo time.
5. Backlog e roadmap atuais: [[MOBILE-001]] · docs de backlog em `docs/`.

## 13. Checklist de onboarding de um novo desenvolvedor
- [ ] Ler §1–§3 (visão + organização + princípios) e [[ADR-000]].
- [ ] Node 22 LTS instalado.
- [ ] `npm install` na raiz sem erro.
- [ ] Web: `npm run dev` abre em `localhost:3000`.
- [ ] `npx tsc --noEmit`, `npx vitest run`, `npx next build` — todos verdes.
- [ ] Mobile: seguir [[MOBILE-003]] até o app abrir no emulador/dispositivo.
- [ ] Entender o ciclo de trabalho (§7) e os critérios de aceite (§8).
- [ ] Saber onde documentar decisões (§10) e como funciona a precedência (ARCH-000).

## 14. Regras de Continuidade Operacional (diretriz de engenharia — OBRIGATÓRIA)
Detalha o [[ADR-012]]. Todo componente entregue deve satisfazer o **critério orientador**:
> *"Se um novo dev receber acesso ao repositório, à documentação e às credenciais autorizadas, deve conseguir
> instalar, compreender, executar, manter e evoluir o sistema sem depender de explicações do dev original."*

1. **Código-fonte** — tudo versionado no Git; nada importante fora do repo; sem dependência do ambiente pessoal.
2. **Documentação contínua** — cada funcionalidade acompanha doc: finalidade · arquitetura · fluxo de execução ·
   arquivos principais · dependências · impacto em outros módulos · decisões relevantes.
3. **Decisões arquiteturais** — registrar problema · alternativas · justificativa · consequências (ADR ou doc de domínio).
4. **Banco de dados** — alteração estrutural **só por migration versionada** (`supabase/migrations/`); nada manual
   irreprodutível no painel.
5. **Ambiente reproduzível** — recriável por: clone → instalar deps → configurar env → rodar migrations → comandos documentados.
6. **Variáveis de ambiente** — documentadas (nome · finalidade · obrigatoriedade · serviço); **nunca** credenciais no código.
7. **Serviços externos** — cada integração: finalidade · fluxo de auth · dependências · configuração · procedimento de substituição.
8. **Organização do código** — estrutura consistente; evitar arquivos gigantes · duplicação · funções multi-responsabilidade · dependências circulares.
9. **Comentários** — explicam **decisões**, não o óbvio; priorizar código legível.
10. **Logs e erros** — tratamento consistente; logs úteis para diagnóstico **sem** expor dados sensíveis.
11. **Deploy** — reproduzível; sem etapa manual não documentada.
12. **Registro de mudanças** — commits descritivos; mudança estrutural reflete na documentação correspondente.
13. **Independência do dev** — nenhuma funcionalidade depende de conhecimento exclusivo de quem a implementou.

### Documentação mínima do projeto (rastreio de cobertura)
| Tema | Documento | Status |
|---|---|---|
| Arquitetura geral | [ARCH-003](./ARCH-003_ARQUITETURA_GERAL_PLATAFORMA.md) · [ARCH-000](./ARCH-000_DOCUMENT_ARCHITECTURE.md) | ✅ |
| Estrutura de pastas | GOV-002 §2 | ✅ |
| Fluxo de autenticação | — | ⬜ a documentar (Onda 1 — Auth) |
| Fluxo de upload | [CAP-001](./CAP-001_CAPTURA_DOCUMENTAL.md) · [CAP-002](./CAP-002_CAPTURE_HUB.md) | ✅ |
| Processamento de documentos | [CEF-001](./CEF-001_CLINICAL_EXTRACTION_FRAMEWORK.md) · [UCDA-001](./UCDA-001_UNIVERSAL_CLINICAL_DATA_ARCHITECTURE.md) | ✅ |
| Fluxo da IA | [AI-001](./AI-001_AI_GOVERNANCE.md) | ✅ |
| Banco de dados | [DATA-001](./DATA-001_CANONICAL_HEALTH_DATA_MODEL.md) · [DATA-002](./DATA-002_DATA_GOVERNANCE.md) · `supabase/migrations/` | ✅ |
| Serviços externos | [HIP-001](./HIP-001_PLATAFORMA_INTEGRACOES.md) · [ARCH-004](./ARCH-004_ARQUITETURA_INTEGRACOES.md) | ✅ |
| Deploy · Backup · Restauração | [OPS-002](./OPS-002_RELEASE_BACKUP_RUNBOOK.md) | ✅ |
| Convenções de desenvolvimento | GOV-002 §7–§9 + esta §14 | ✅ |

Lacunas marcadas `⬜` viram entregável da fase que as tocar (ex.: fluxo de autenticação = parte do aceite da Onda 1).

---

**Manutenção:** este documento é atualizado ao final de cada grande fase. Se algo aqui divergir da realidade do
código, **corrija aqui primeiro** — a porta de entrada precisa estar sempre correta (ADR-012).
