# DOC-002 — Documentos clínicos: especificação da frente

**Status:** ESPECIFICAÇÃO — abre a frente registrada em `BACKLOG-DOC-001`.
**Código não começa antes da homologação da RC1** (feature freeze). Este documento é o passo que o próprio
`BACKLOG-DOC-001` §5 exige: *"quando a frente abrir — começar por SPEC, não por código"*.

**Consome (decisões já travadas, não reabertas):** `DOC-001_IMPL_DOCUMENTOS_OPCAO_B` · `BACKLOG-DOC-001` ·
`DOC-001_REPOSITORIO_DOCUMENTOS` · `ADR-EXDOC-001` · HUB-001 · ADR-001 (SSOT) · ADR-023 (dono único)

---

## 1. O pedido

Duas frases da fundadora, que são **o mesmo problema**:

> "o local correto para adicionar a opção de atestado, relatório e encaminhamento. E também receita médica."

> "garantir que ao adicionar registro, onde tem as opções de receita e de atestado, relatório e encaminhamento,
> ele direcione para a página em que eles estão posicionados, assim como acontecem com outras categorias."

Não são dois pedidos. O segundo não tem como ser atendido enquanto o primeiro não for: **não se navega para uma
página que não existe.**

---

## 2. Estado medido (24/08/2026)

Nenhuma inferência. Cada linha foi verificada no repositório.

| Peça | Estado |
|---|---|
| `src/lib/documents/patientDocuments.ts` — domínio, subtipos, associações, invariante | **existe** |
| `tests/documents/FUNC-patient-documents.test.ts` | **existe** |
| `packages/core/src/domain/capture/attachmentPolicy.ts` — ANEXO-001 | **existe** |
| Alguém que **chame** `createPatientDocument` / `associateDocument` | **zero referências** |
| Migration criando `patient_documents` / `patient_document_links` | **nenhuma** |
| Página `/dashboard/documentos` | **não existe** |
| `DocumentKind` com um valor para atestado/relatório/encaminhamento | **não tem** |
| `RegistrationDestination` com um destino documental | **não tem** |
| `exam_documents` (migration 137) | **existe e aplicada** |
| `health_documents` (repositório universal) | **não existe — backlog declarado** |

O domínio foi especificado, escrito e testado — e **nunca ligado a nada**. É a mesma forma do achado do ADR-023
(0 de 11 fundações existentes em `main`): a decisão foi tomada, o código foi escrito, a ligação não aconteceu.

---

## 3. Causa-raiz da quebra de jornada

`BACKLOG-DOC-001` §1 descreve o sintoma: a categoria some no meio do caminho. A causa é mecânica.

```
packages/core/src/domain/capture/types.ts
  DocumentKind = 'exam' | 'medication_label' | 'eyeglass_prescription' | 'omics' | 'other' | 'unknown'
                                                                                     ↑
                       não existe um kind para atestado / relatório / encaminhamento
```

```
packages/core/src/domain/capture/intents.ts
  { key: 'doc_clinico', label: 'Atestado, relatório ou encaminhamento',
    mechanism: { type: 'capture' } }          ← sem documentKind: "deixa classificar"
```

A intenção manda classificar. A classificação só oferece os `kind` que existem. Nenhum deles é o que a pessoa
escolheu. **A categoria não é perdida por bug — ela nunca teve para onde ir.**

Compare com uma categoria que funciona:

```
  { key: 'omica', mechanism: { type: 'page', destination: 'omics' } }   → tem destino, tem página, funciona
  { key: 'doc_clinico', mechanism: { type: 'capture' } }                → não tem destino, não tem página
```

É exatamente a diferença que a fundadora descreveu como *"assim como acontecem com outras categorias"*.

---

## 4. A decisão que precisa da fundadora

`exam_documents` é a infraestrutura documental candidata a reuso. O schema decide a questão sozinho:

```sql
create table public.exam_documents (
  exam_id  uuid NOT NULL references public.exams(id) on delete cascade,
  ...
)
```

`exam_id` é **NOT NULL**. Um atestado não é de um exame. Para caber ali seria preciso ou tornar `exam_id`
nulável — o que destrói o significado da tabela e o índice "no máximo 1 primário por exame" — ou criar um exame
falso, que a invariante travada proíbe explicitamente:

> criar/associar um Documento **nunca** cria um exame nem muta o registro-alvo

**Conclusão: `patient_documents` é tabela própria.** Isto não é preferência — é o que o schema e a invariante já
determinam. Não é a decisão em aberto.

### A decisão em aberto é outra

Existem **dois documentos DOC-001, com entidades diferentes e o mesmo número**:

| Doc | Entidade | Escopo | Status |
|---|---|---|---|
| `DOC-001_REPOSITORIO_DOCUMENTOS` | `health_documents` | **o arquivo** — ativo universal, todos os módulos referenciam | backlog, "não implementar agora" |
| `DOC-001_IMPL_DOCUMENTOS_OPCAO_B` | `patient_documents` | **o documento clínico** — subtipo, emissor, associações | domínio escrito, não ligado |

Não são concorrentes — são camadas distintas (arquivo × entidade clínica). Mas **isso nunca foi escrito**, e a
colisão de número torna provável que quem receber o projeto leia como alternativas. Para uma plataforma que será
transferida (ADR-012), ambiguidade de nomenclatura é dívida cara.

E há uma tensão real: criar `patient_documents` agora com `file_url` próprio **acrescenta mais um `file_url` por
tabela** — exatamente o problema que `DOC-001_REPOSITORIO` §2 aponta.

**Proposta:** `patient_documents` nasce com `file_url` + `document_sha256` **idênticos em nome e semântica aos de
`exam_documents`**. Não resolve a duplicação, mas garante que quando `health_documents` chegar, as duas tabelas
migrem pelo **mesmo padrão**, com uma migration só — em vez de inventar um terceiro formato. É
"acomodar-antes-de-criar": não melhora o futuro, mas não o piora.

**Decisão pedida:** aceitar essa proposta e renumerar `DOC-001_REPOSITORIO` → `DOC-003` para desfazer a colisão.

---

## 5. Escopo da implementação (após a RC1)

Quatro passos. Cada um é verificável isoladamente.

### Passo 1 — a categoria sobrevive à jornada
`packages/core` — `DocumentKind` ganha `clinical_document`. A intenção `doc_clinico` passa a declarar
`{ type: 'capture', documentKind: 'clinical_document' }`. O subtipo (atestado/relatório/encaminhamento/outro) é
perguntado **depois** do anexo, usando `DOCUMENT_SUBTYPES` que já existe.

*Verificável:* escolher "Atestado, relatório ou encaminhamento" e chegar ao fim do fluxo com a categoria intacta.

### Passo 2 — o documento tem onde existir
Migration aditiva: `patient_documents` + `patient_document_links`, RLS por `user_id`, colunas espelhando
`exam_documents`. Wiring de `createPatientDocument` / `associateDocument` ao `SupabaseClient` + upload.

*Verificável:* o documento aparece no banco; `exams` e `exam_documents` permanecem intocados (a invariante já
tem teste).

### Passo 3 — o documento tem onde aparecer
`/dashboard/documentos` — lista por subtipo, com emissor e data, e o link para o documento original. Tela
equivalente no Mobile (paridade visual + funcional, não "mesmas regras").

*Verificável:* lado a lado Web × Mobile — "parecem o mesmo produto?"

### Passo 4 — o Hub direciona, como nas outras categorias
`RegistrationDestination` ganha `documents`. Receita e documento clínico passam a levar à página, igual a
`omics`. É o pedido literal da fundadora.

*Verificável:* adicionar registro → receita → concluir → **cair na página de documentos**.

### Movimentação obrigatória
`patientDocuments.ts` está em `src/lib/` — **Web-only**. O Mobile não alcança. Precisa ir para
`packages/core/src/domain/documents/`, senão o Passo 3 nasce com dois donos do mesmo conceito, que é o defeito
que o ADR-023 nomeia e que já custou uma correção no telefone (PR #164/#168/#169).

---

## 6. Receita: fica onde está?

`medications.prescription_url` guarda a receita hoje, como anexo do medicamento.

A decisão travada diz que Receita é **subtipo de documento**, associável a 1..N contextos — os 7
(`RECEITA_TARGET_DOMAINS`). Uma receita que prescreve medicamento **e** suplemento hoje não tem como ser as duas
coisas: ela é um `prescription_url` de uma linha de `medications`.

**Proposta:** `patient_documents` passa a ser o dono; `medications` referencia por link. `prescription_url`
permanece lendo durante a transição — **sem migração de dado no mesmo passo**. Dono único primeiro, limpeza
depois, cada uma verificável por si.

---

## 7. O que esta frente NÃO faz

- Não implementa `health_documents` (backlog, onda futura com KG v2).
- Não toca `exam_documents` nem a projeção FHIR (EXDOC-002).
- Não interpreta conteúdo clínico. Transcreve fatos documentais — emissor, data, tipo — com origem e autoria.
  ADR-000 e RDC 657: a SINTERA **organiza, integra e contextualiza**; não interpreta.
- Não cria categoria genérica "Evento" para acomodar estes documentos (proibição travada).

---

## 8. Sequência

```
RC1 homologada
  └─ Passo 1  categoria sobrevive          core + intents
     Passo 2  schema + wiring              migration aditiva (GATE C: aplicar em produção)
     Passo 3  páginas Web + Mobile         paridade lado a lado
     Passo 4  Hub direciona                fecha o pedido literal
```

Passo 2 escreve em produção → **gate explícito da fundadora antes de aplicar**, conforme o protocolo permanente.
