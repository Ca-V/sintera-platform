# DOC-001 — Repositório Único de Documentos (Backlog Arquitetural)

**Status:** 📋 **Backlog arquitetural** — decisão da fundadora (07/07/2026). **Registrado, NÃO implementar agora.** Surgiu durante a REL-001 e é considerada a decisão arquitetural mais importante dessa frente.
**Natureza:** 🟪 Infraestrutura (dados) — capacidade transversal.
**Relaciona:** [[REL-001]] (Camada de Comunicação) · `@/lib/provenance` (Camada de Proveniência) · KG v2 · SRL · Ingestão.

---

## 1. Princípio

**O documento original passa a ser um ativo de primeira classe da SINTERA.** Sempre que a plataforma **importar, receber, digitalizar ou cadastrar** qualquer informação proveniente de um documento externo, esse documento passa a fazer parte do **patrimônio de dados** da plataforma.

## 2. Problema (constatado na REL-001)

Hoje o documento é guardado como **`file_url` por tabela** — só `exams` e `health_resources` têm; `omics_panels` e `medications` não têm. Isso gera: duplicação de armazenamento, ausência de padrão, e módulos sem acesso ao documento (ômica, receitas de medicamentos). Criar `file_url` tabela por tabela é uma solução **específica e redundante**.

## 3. Decisão

Criar uma **entidade única** — `health_documents` (ou nomenclatura equivalente) — responsável por armazenar **todos** os documentos originais da plataforma. **Cada módulo apenas REFERENCIA** o documento (por `document_id`); nenhum módulo guarda o arquivo.

Modelo **indicativo** (a detalhar quando sair do backlog):
```
health_documents (
  id · user_id · kind · storage_path/url · mime · sha256 · size ·
  source_module · issuer · document_date · uploaded_at · metadata (JSONB)
)
```
Módulos referenciam: `exams.document_id`, `omics_panels.document_id`, `medications.document_id`, `health_resources.document_id`, `health_events.document_id` (procedimentos), etc. Migração dos `file_url` atuais → `health_documents`.

## 4. Abrangência

exame · exame de metabolômica/ômica · receita médica · prescrição de suplemento · prescrição de óculos/lentes · prescrição de dispositivos · laudo · relatório · encaminhamento · qualquer documento importado · **wearables (quando houver anexos)** · futuras integrações.

## 5. Impacto nas camadas transversais

- **Proveniência** (`@/lib/provenance`): passa a consumir a **entidade única** por **referência documental** — **nunca conhece onde o documento foi originado**. A estrutura atual já está pronta: `DocumentMeta` **é** a referência documental; os adaptadores apenas passam a lê-la de `health_documents` em vez de `file_url` por tabela. **Sem mudança de interface.**
- **Camada de Comunicação** (Relatório · PDF · compartilhamento · impressão · Timeline compartilhada · exportações · APIs): **inalterada** — continua consumindo a mesma camada de proveniência.

## 6. Benefícios

Sem duplicação de armazenamento · rastreabilidade documental completa · sem `file_url` por tabela · alinhamento natural com KG v2 e SRL · preparação para integrações e wearables.

## 7. Ativação (quando existir)

Ao existir, **todos os módulos passam a usufruir automaticamente** — inclusive ômica e medicamentos. O link **"Ver documento original"** aparece sozinho em **todos** os consumidores da Camada de Comunicação, sem mudança por módulo (regra definitiva da [[REL-001]] / Camada de Proveniência).

## 8. Posição no roadmap

Iniciativa de **infraestrutura de dados** — a priorizar em onda futura (candidata a andar junto do KG v2, por afinidade de proveniência/rastreabilidade). Substitui a alternativa de "abrir a ingestão pontualmente para ômica/medicamentos" — resolve o problema de forma **definitiva**, não tabela por tabela.
