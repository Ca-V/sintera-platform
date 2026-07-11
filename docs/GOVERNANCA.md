# SINTERA — Sistema de Documentação de Governança

Conjunto formal de documentos que governam a plataforma, com **códigos estáveis**. Sistema criado 10/07/2026 (sugestão da fundadora) para uma documentação **organizada e escalável**.

## Camada de Governança (nível constituição)
Documentos que definem *por quê / o quê / como se governa* a SINTERA.

| Código | Documento | Arquivo | Status |
|---|---|---|---|
| **CON-001** | Constituição Estratégica | `docs/estrategia/SINTERA_ESTRATEGIA_MASTER.md` | ✅ vigente (v2.2) |
| **BRD-001** | Branding | `docs/branding/SINTERA_BRANDING.md` | ✅ vigente (v2.0 — paleta teal) |
| **ARC-001** | Arquitetura | — | ⏳ a consolidar (hoje disperso: modelo canônico, horizontalidade, ContentClassifier) |
| **SEC-001** | Projeto Shield — Segurança, Governança e Continuidade | `docs/SEC-001_PROJETO_SHIELD.md` | ✅ vigente (charter) |
| **PRD-001** | Princípios de Produto | — | ⏳ a consolidar (hoje em CON-001 §13/§14: princípios invioláveis + critério de features) |
| **OPS-001** | Operação e Continuidade | — | ⏳ a extrair (runbooks de deploy/backup/DR; parte hoje em SEC-001) |
| **REG-001** | Compliance Regulatório | — | ⏳ a consolidar (RDC 657/2022 + LGPD; hoje disperso em CON-001/BRD-001/SEC-001) |

## Camada de Execução (spec / implementação)
Documentos que especificam *o que existe e como se apresenta/opera* — distintos da camada de governança.

| Código | Documento |
|---|---|
| **DS-001** | Design System (componentes, tokens, paleta) |
| **UX-001** | Navegação e organização funcional |
| **AUD-001** | Diagnóstico de acessibilidade (TEMA G) |
| **REL-001** | Relatório (estrutura = domínio) |
| **QA-001** | Processo de homologação (harness) |
| **CAP-001** | Captura documental (5 meios de entrada) |

## Regras
- **Código estável:** uma vez atribuído, não muda; a versão vive no cabeçalho do doc.
- **Cadências:** governança muda raramente (por evidência); execução evolui contínua.
- **Fonte de verdade:** o `.md` no repo. PDFs na Área de Trabalho são derivados.
- Docs "⏳ a consolidar" existem hoje **dispersos** em CON-001/BRD-001/SEC-001; serão extraídos quando o conteúdo justificar um documento próprio (não criar casca vazia).
