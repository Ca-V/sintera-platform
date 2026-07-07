# QA-001 — Auditoria de Experiência da Plataforma (Metodologia Permanente)

**Status:** 📄 Metodologia oficial (aprovada 07/07/2026). Passa a ser a **metodologia permanente de auditoria e homologação** da SINTERA.
**Natureza:** 🟪 Infraestrutura (QA) — desenvolvida em **paralelo**, **não bloqueia** a evolução funcional (Onda 0.5 / REL-001 seguem prioritárias).
**Integração:** a auditoria automatizada passa a integrar o **Definition of Done** de todas as ondas — toda homologação futura executa o harness **antes de publicar**.
**Herda:** [[UX-001]] · [[DS-001]] · [[REL-001]] · Roadmap por Ondas ([[roadmap_ondas_core]]) · RDC 657.

---

## 1. Princípio

A qualidade da plataforma deixa de depender de **observações pontuais** e passa a seguir um **roteiro fixo e reprodutível**. Uma auditoria não produz "uma lista de bugs" — produz uma **leitura completa de produto** (problemas + oportunidades), priorizada dentro do Roadmap por Ondas.

## 2. Fonte oficial de evidências — harness Playwright único

Um **único harness** (agente-neutro) é a fonte oficial das evidências. Ele roda **uma vez** por auditoria e produz artefatos padronizados que **todos os revisores consomem** (Claude Code · ChatGPT · fundadora) — garantindo pareceres **comparáveis** sobre a mesma base factual.

**Não** se deve dar login de produção a múltiplos agentes. Coleta única → revisão múltipla.

### 2.1 Verificações automáticas (determinísticas — falham o build)
Por rota, em **desktop (1280)** e **mobile (375)**:
- Scroll horizontal (`scrollWidth > clientWidth`), overflow, texto estourando o container.
- Erros de **console** e requisições de rede falhas.
- Elemento-âncora ausente / página que não montou.
- **Screenshot** full-page (desktop + mobile) de cada página.

*(Esta camada teria detectado sozinha o bug do cabeçalho do exame.)*

### 2.2 Artefatos
`audit-artifacts/` → `screenshots/<rota>.<viewport>.png` · `console-errors.log` · `overflow-report.json` · `report.md` (legível).

## 3. Análise por página (5 dimensões — revisão humana + IA sobre os artefatos)

| Dimensão | O que avaliar |
|---|---|
| **Produto** | propósito da tela · valor entregue · clareza da proposta · utilidade real |
| **UX** | facilidade de entendimento · nº de cliques · carga cognitiva · organização · hierarquia visual |
| **Design** | consistência visual · uso correto do DS-001 · equilíbrio de espaços · contraste · legibilidade |
| **Arquitetura** | aderência ao UX-001 · coerência entre módulos · organização do menu · navegação |
| **Regulatório** | aderência ao posicionamento oficial e à RDC 657 (organiza, não interpreta/diagnostica) |

## 4. Auditoria específica da Home (posicionamento de produto)

A Home recebe auditoria própria. Ela deve **responder imediatamente**:
- Por que usar a SINTERA?
- Qual problema resolve?
- Qual benefício entrega?
- Por que continuar usando **diariamente**?

Entregável: **proposta completa de evolução da Home** — não apenas melhorias visuais, mas **revisão de posicionamento de produto**.

## 5. Documento-resultado (não é lista de bugs)

Um documento único com seis eixos:
1. Problemas encontrados
2. Oportunidades de melhoria
3. Oportunidades de simplificação
4. Oportunidades de aumento de **valor percebido**
5. Oportunidades de evolução da **arquitetura**
6. Oportunidades de evolução do **produto**

**Cada item carrega:** `criticidade · impacto · esforço estimado · dependências · prioridade dentro do Roadmap por Ondas (onda-alvo)`.

## 6. Três pareceres → consolidação

Sobre os **mesmos** artefatos: **Parecer Claude Code** + **Parecer ChatGPT** + **Parecer da fundadora** → consolidação numa lista única priorizada. Itens aprovados **entram no roadmap oficial**, posicionados em suas ondas e respeitando os gates (regra "nenhuma exceção ao roadmap").

## 7. Sequência de execução (permanente)

1. Continuar a implementação da **REL-001** (prioridade da Onda 0.5).
2. Desenvolver o **harness** em paralelo (infra QA, não bloqueia).
3. Executar a **primeira auditoria completa**.
4. Consolidar os **três pareceres**.
5. Gerar/atualizar este **QA-001** com os achados.
6. Incorporar as melhorias aprovadas ao **roadmap oficial**.

A partir da conclusão do harness, **toda homologação futura o executa automaticamente antes da publicação** (parte do DoD).

## 8. Setup para acesso automático (uma vez)

- **Usuário de teste** com alguns registros por módulo (telas não vazias).
- Credenciais em **variável de ambiente** (`AUDIT_EMAIL` / `AUDIT_PASSWORD`) — o script lê de `process.env`; a senha **nunca** aparece em texto no chat nem é digitada manualmente.
- **Alvo:** preview (recomendado — não toca dados reais) ou produção.
- Harness em `tests/audit/` (Playwright), executável via `npx playwright test`.

## 9. Governança

QA-001 é **tooling de engenharia/qualidade**, não funcionalidade de produto — cabe sem tocar no congelamento da arquitetura. Desenvolvido em paralelo à Onda 0.5. Torna-se **mecanismo permanente** para elevar a qualidade das próximas ondas.
