# Specs pós-decisão — Documentos (C1+C2), Anexos transversal, Pedido/REG-001, Monitoramento/Redbus (C3)

Decisões da fundadora já travadas (não reabrir — ver matriz única):
- **Q3 = domínio único "Documentos"**: Receita **e** documentos clínicos não-exame são **subtipos** de um mesmo domínio de **Documentos do paciente**, **separado de `exams` e de `exam_documents`**.
- **Q2/#10 = manter REG-001** (document_type derivado pela extração); qualquer mudança para o pedido "aparecer na hora" é **especificada primeiro**, não implementada.
- **Q4/#7 = política transversal de anexos** (Word + limite único + HEIC + métodos consistentes), com o **valor do limite definido tecnicamente** e válido em **todos** os pontos.

Nada aqui é implementado até o design ser aprovado. Spec-first.

---

## DOC-001 — Domínio "Documentos do paciente" (C1 + C2 unificados)

### Princípio
Um documento é um **artefato** do paciente (arquivo + proveniência), com um **papel** (subtipo) e **associações**
opcionais a registros de outros domínios. **Não é um exame** e **não é `exam_documents`** (este é escopo‑exame).

```
DOCUMENTO (patient_documents, 1 arquivo + proveniência)
  ├── subtype: receita | atestado | relatorio | encaminhamento | outro
  ├── issuer, doc_date, notes, file_url, source, uploaded_at
  └── N associações → registro-alvo (domínio + id)
        medicamento · suplemento · ciclo/contracepção · composição · recurso · hábito · monitoramento · exame
```

### C1 — Documentos clínicos não-exame (Atestado/Relatório/Encaminhamento)
- Subtipos `atestado | relatorio | encaminhamento | outro`.
- **Não** entram em `exams` nem em `exam_documents`. Categoria escolhida **permanece** por todo o fluxo (o guard A13 já protege a categoria declarada na captura).
- Apresentação: categoria própria no Histórico (o `TimelineEntry.category` já aceita categoria nova) e/ou área "Documentos".

### C2 — Receita como subtipo com associação
- Subtipo `receita`. Uma receita pode **originar/associar** informação para: Medicamento, Suplemento, Ciclo/Contracepção, Composição corporal, Recursos de saúde, Hábitos, Monitoramento.
- Vínculo espelha **pedido↔exame**: a receita é um objeto; o registro-alvo é outro; a associação é **N alvos** por receita (1 receita pode prescrever medicamento **e** suplemento).
- **Roteamento:** Hub "Receita médica" abre a **captura de Documento (subtype=receita)** — **não** Exame. Mobile ganha essa tela (hoje inexistente) — por isso não foi feito reroute provisório.

### Modelo de dados (proposto — a validar; entra como Fase própria, aditiva)
- `patient_documents(id, user_id, subtype, issuer, doc_date, notes, file_url, document_sha256, source, uploaded_at, current_extraction_version_id?)`.
- `patient_document_links(id, document_id, target_domain, target_id)` — associação N→N com registros-alvo.
- RLS por `user_id`. **Não** toca `exams`/`exam_documents`.

### Decisões que restam (menores; não bloqueiam o design)
1. A extração deve **propor** itens/associações (ex.: ler a receita e sugerir o medicamento) ou associação é **manual** no MVP? (sugestão: manual no MVP, extração assistida depois.)
2. Catálogo de subtypes aberto? (sim — `outro` cobre.)

---

## ANEXO-001 — Política transversal de anexos (Q4/#7)

**Regra de produto:** onde a plataforma permite adicionar documentos, o comportamento é **consistente** e **não**
restringe pelo 1º formato. No mesmo exame: **N documentos → 1 exame/evento**.

### Política única (fonte única a criar no core; consumida por Web e Mobile)
| Eixo | Regra |
|---|---|
| **Formatos** | PDF · JPG/JPEG · PNG · **HEIC** · **Word (.doc/.docx)** — allowlist ÚNICA |
| **Limite de tamanho** | **um único valor** em toda a plataforma (Web = Mobile), **definido tecnicamente** (hoje 200MB×20MB) considerando upload, storage e processamento. Proposta a validar: alinhar por baixo (ex.: 25–50MB) e mover arquivos grandes para pipeline assíncrono |
| **Métodos de entrada** | seleção de arquivo · câmera/foto · múltiplas imagens · múltiplos arquivos · drag‑and‑drop (Web) · voz (onde aplicável) — consistentes em todos os pontos |
| **Cardinalidade** | 1 e **N**; formatos mistos; **inclusão posterior**; sem "PDF encerra o fluxo" |
| **Associação** | N documentos → **1 registro** (exame/evento/documento), nunca criar registro novo por arquivo adicional |

### Implicações de pipeline (não é só allowlist)
- **Word**: modelos de visão não leem `.docx` direto → precisa de conversão (docx→pdf/texto) **ou** armazenar como documento não‑extraído (fonte da verdade). Definir por subtipo.
- **HEIC**: precisa de decode/normalização (→ JPEG) no cliente/servidor.
- **Limite único**: rever caps divergentes (Web 200MB, Mobile 20MB, Ômica 6/8MB) e o pipeline de upload.

### Rollout
- **Já feito (bugs, Ciclo 2 · PR #123):** Recursos aceita PDF; Hábitos com allowlist.
- **Estrutural (com B1/Fase 0):** unificar o protocolo de captura (CAP‑001/D‑14), N→1 exame, fim do "PDF encerra o fluxo", limite único, allowlist única (Word/HEIC) nos **todos** os pontos.

---

## PEDIDO-001 — "Pedido aparece e some" (REG-001, especificação da mudança)

### Causa (confirmada)
`document_type` é **derivado pela extração** (REG-001: `packages/api-client/src/exams/write.ts:24`). Na criação o
pedido nasce `document_type=null` → cai na aba **Exames**; só quando o classificador assíncrono grava
`medical_order` ele **migra** para **Pedidos** ("aparece e some"). Se a classificação falha, fica mal rotulado.

### Decisão (fundadora): **manter REG-001**; especificar a alteração antes de mudar.
Opções (a decidir numa etapa própria — **não** implementar agora):
- **(a) Estado transitório explícito:** enquanto `document_type=null`, o item aparece numa faixa "Em classificação" (não na aba Exames), migrando quando classificado. Não viola REG-001. **Recomendada.**
- **(b) Declaração explícita na criação:** quando o usuário escolhe "Pedido de exame", gravar `document_type='medical_order'` no insert. **Revisa REG-001** (deixa de ser 100% derivado) — só com decisão específica.

> Já entregue (Ciclo 1): o roteamento não abre mais "Adicionar exame" e sim "Adicionar pedido de exame".

---

## C3 — Monitoramento × integração Redbus (auditoria antes de acoplar)
Mantida da versão anterior: auditar o **modelo de wearables** (migrações 025/127‑133; provider Withings, conexão,
`external_user_id`) e o port `SyncEngine` **antes** de acoplar; adaptador **desacoplado** (princípio RNDS — o schema do
provedor não dirige o modelo interno). Decisões: domínios/auth do Redbus; provider único vs. agregador; unidades canônicas.

---

## Gates
- **Documentos (C1+C2):** design acima → aprovar → entra como **Fase aditiva própria** (não é `exam_documents`).
- **Anexos:** política única + implicações de pipeline (Word/HEIC/limite) → estrutural, junto de B1/Fase 0.
- **Pedido:** manter REG-001; escolher (a)/(b) numa etapa própria.
- **C3:** auditoria antes de implementar. Nada toca banco/produção/congelados/RNDS agora.
