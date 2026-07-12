# SINTERA — Sistema de Documentação de Governança

Conjunto formal de documentos que governam a plataforma, com **códigos estáveis**.
Sistema criado 10/07/2026. Objetivo: documentação **organizada, escalável e com peso
explícito** — cada documento tem um **nível** que comunica sua estabilidade.

---

## Classificação da documentação (4 níveis)

O nível indica **quão raramente o documento muda** e **quanto peso ele carrega**.

### Nível 1 — Constituição *(muda muito raramente; define princípios e arquitetura estrutural)*
| Código | Documento |
|---|---|
| **CON-001** | Constituição Estratégica (`docs/estrategia/SINTERA_ESTRATEGIA_MASTER.md`, v2.2) |
| **BRD-001** | Branding (identidade visual **v3.0 "Van Gogh"** — azul-turquesa/terracota/preto-marrom) |
| **UX-001** | Arquitetura funcional / navegação |
| **REL-001** | Camada de Comunicação (Relatório = 1º consumidor) |
| **DS-001** | Design System (tokens, componentes, paleta) |
| **CAP-002** | **Capture Hub** — domínio transversal de ingestão (🧊 congelado v1.0) |
| **KG v2** | Knowledge Graph (modelo científico) |
| **SRL** | Scientific Retrieval Layer |
| **SEC-001** | Projeto Shield — Segurança/Governança/Continuidade |
| — | Princípio da Rastreabilidade Documental; ADRs estruturantes |
| **ARC-001·PRD-001·OPS-001·REG-001** | ⏳ a consolidar (hoje dispersos em CON/BRD/SEC) |

### Nível 2 — Referências *(como implementar a Constituição na prática)*
| Código | Documento |
|---|---|
| **CAP-002-REF** | Reference Implementation do Capture Hub (Condições → mapa CAP-002→código) |
| **QA-001** | Processo de homologação (harness, tripé técnica/estrutural/visual) |
| — | Exemplos, fluxos, implementações de referência |

### Nível 3 — Especificações *(funcionalidades específicas)*
| Código | Documento |
|---|---|
| **CAP-001** | Captura documental (5 meios de entrada) |
| **DOC-001** | Repositório único de documentos (spec) |
| — | Condições · Medicamentos · Inbox · Exames · Recursos · etc. |
| **AUD-001** | Diagnóstico de acessibilidade (TEMA G) |

### Nível 4 — Execução *(operação do dia a dia)*
Backlog · issues · sprints · PRs · tarefas · roadmap por ondas (posicionamento).

---

## Architecture Review Gate (ARG)

**Toda nova funcionalidade responde a este checklist ANTES de entrar em desenvolvimento.**
Leva poucos minutos e evita a erosão arquitetural que ocorre à medida que o produto cresce.

1. A funcionalidade **reutiliza um domínio existente**?
2. Ela **introduz uma nova origem de dados**? Se sim, **usa o Capture Hub** (CAP-002)?
3. Respeita os **princípios constitucionais** (CON/BRD/UX/REL/CAP/SEC…)?
4. Existe **componente reutilizável** antes de criar um novo?
5. Ela **aumenta ou reduz** a complexidade arquitetural?
6. Há impacto em **proveniência, auditoria ou LGPD**?
7. Precisa de **ADR** ou **atualização documental**?
8. Há **cobertura de testes** para o fluxo arquitetural afetado?
9. Ela **cria alguma exceção** à arquitetura? Se sim, a **justificativa está documentada**?

> Regra de ouro (CAP-002 §princípio 10): **toda entrada de informação externa é um
> adaptador do Capture Hub** — vedado fluxo paralelo de ingestão.

**Toda revisão ARG termina em EXATAMENTE um resultado** (registrado no ADL):
1. **Aprovado** — pode seguir para implementação.
2. **Aprovado com ressalvas** — segue, mas há pendências registradas.
3. **Requer revisão arquitetural** — precisa de ajustes antes do desenvolvimento.
4. **Requer ADR** — altera princípios ou decisões estruturantes → ADR antes de qualquer código.

O resultado + a decisão entram no **`docs/ADL_ARCHITECTURE_DECISION_LOG.md`** (linha do
tempo cronológica de TODAS as decisões arquiteturais, mesmo as sem ADR próprio).

---

## Congelamento e evolução (formulação de governança)

Não se diz "a arquitetura não será mais discutida". A formulação correta:

> **Os princípios arquiteturais estão congelados. A arquitetura continua evoluindo por
> refinamentos COMPATÍVEIS com esses princípios. Alterações que VIOLEM os princípios
> exigem uma revisão arquitetural formal (ARG + ADR).**

Nenhuma arquitetura é definitiva; o que se congela é o conjunto de princípios e o
**processo** para mudanças estruturais. Refinamento compatível → segue. Violação →
revisão formal antes de qualquer código.

---

## Fase atual — Consolidação Arquitetural (a partir de 10/07/2026)

A fase de **definição** da arquitetura está encerrada (arquitetura + governança + roadmap
maduros). Objetivo agora: **NÃO produzir novos documentos constitucionais**, e sim
**comprovar que os existentes são aplicáveis** via implementações reutilizáveis. A
qualidade da arquitetura passa a ser medida pela **facilidade com que novas
funcionalidades reutilizam componentes** — não pela quantidade de documentos.

**Painel de marcos** (o progresso é medido por marcos de consolidação, não por commits/
docs). Ao concluir um marco: atualiza o **ADL** + registra o **resultado do ARG** +
altera o status aqui.

| Marco | Descrição | Status |
|---|---|---|
| **RI-001** | Condições validada e promovida a Reference Implementation (Gate RI-001, CAP-002-REF §4) | ⏳ em teste |
| **HUB-001** | 1º componente reutilizável extraído para o backbone do Capture Hub | ⏳ |
| **DOC-001** | Repositório documental único operacional | ⏳ |
| **MAIL-001** | 1º adaptador assíncrono (e-mail exclusivo) ponta a ponta | ⏳ |
| **AUTO-001** | 1ª ingestão totalmente automática concluída com sucesso | ⏳ |

Legenda: ⏳ pendente · 🔧 em andamento · ✅ concluído.

## Regras gerais

- **Código estável:** uma vez atribuído, não muda; a versão vive no cabeçalho do doc.
- **Cadências:** Nível 1 muda raramente (por evidência/revisão formal); Níveis 3–4 evoluem contínuo.
- **Fonte de verdade:** o `.md` no repo. PDFs na Área de Trabalho são derivados.
- Docs "⏳ a consolidar" existem hoje **dispersos**; extrair quando o conteúdo justificar
  documento próprio (não criar casca vazia).
