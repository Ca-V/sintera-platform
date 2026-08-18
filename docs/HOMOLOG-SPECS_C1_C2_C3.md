# Specs C1 / C2 / C3 — capacidades novas (spec-first, sem improvisar regra de negócio)

Estas três frentes **exigem decisão/spec antes de implementar** (grupo C do checklist master). Aqui fica o modelo,
as opções e **o que depende de decisão da fundadora** — nenhuma regra de negócio é inventada em código.

---

## C1 — Documentos clínicos NÃO-exame (expande #118)

### Problema concreto (homologação)
No fluxo de captura, a categoria escolhida (ex.: **Atestado**) **some quando o arquivo é anexado** — tudo é
funilado para o caminho de Exame. Diagnóstico no código:
- `packages/core/src/domain/capture/intents.ts` — o intent `doc_clinico` (Atestado/relatório/encaminhamento) usa `mechanism: { type: 'capture' }` **sem `documentKind`**.
- `packages/core/src/domain/capture/types.ts` — o union `DocumentKind` **não tem** membro para documento clínico.
- `src/lib/capture/registry.ts` — `CAPTURE_PROCESSORS` só tem `exam`, `medication`, `eyeglass`.
- **Já corrigido (A13):** a `CaptureCenter` não sobrescreve mais a categoria **declarada** ao anexar o arquivo — mas, sem `DocumentKind` próprio e sem processor, ainda não há destino para "Atestado".

### Modelo proposto (a validar)
- Novo domínio **`clinical_document`** (paciente-escopo), **separado de `exams`** e **separado de `exam_documents`** (este é escopo-exame; documento clínico não-exame é do paciente, não de um exame).
- `DocumentKind` ganha `clinical_document`; um **processor** persiste em `clinical_documents` (não em `exams`).
- Subtipos: `atestado | relatorio | encaminhamento | outro` (catálogo aberto).
- Cada documento: `file_url`, `subtype`, `issuer`, `date`, `notes`, proveniência própria.
- **Apresentação:** categoria própria no Histórico (o `TimelineEntry.category` já suporta uma categoria nova sem quebrar o consumidor) e/ou uma área "Documentos".

### Decisões da fundadora
1. Documento clínico é **domínio próprio** ou subtipo de um domínio "documentos"?
2. Entra no Histórico como categoria (Atestado/Relatório/Encaminhamento) — confirmar taxonomia.
3. Continua **separado de `exam_documents`** (confirmado no pedido) — ok.

> Escopo: mantém #118. Não confundir com multi-documento **de exame** (B1/exam_documents).

---

## C2 — Receita como objeto/documento próprio (evolui o antigo "Receita médica"/D-13)

### Requisito (fundadora) — mais amplo que "receita de medicamento"
Uma **Receita** pode originar informação para **múltiplas** categorias:
Medicamento · Suplemento · Ciclo e contracepção · Composição corporal · Recursos de saúde · Hábitos · Monitoramento.
**Não** implementar um botão "Receita" dentro de Medicamento. Receita é um **tipo de documento/registro próprio**,
**associável** à categoria pertinente conforme o conteúdo.

### Diagnóstico no código
- Hub: `intents.ts` — `receita` declara `documentKind: 'medication_label'`; no **Mobile**, `goCapture` funila para `ExamUpload` (vira exame); no **Web**, com o guard A13, a categoria declarada é preservada e o `medicationProcessor` a leva a Medicamentos — **mas isso já assume "medicamento"**, o que contraria o requisito amplo.
- Não existe destino de captura de **Receita** próprio (nem no Web nem no Mobile) — é uma **capacidade nova**, não um reroute de 1 linha.

### Modelo proposto (a validar)
- **Receita = documento próprio** (parente de C1, papel `prescricao`), com **N associações** a registros-alvo (1 receita pode prescrever medicamento **e** suplemento; pode embasar ciclo, composição etc.).
- Vínculo espelha o padrão **pedido↔exame**: a receita é um objeto; o produto/registro é outro; a receita é **vinculada** (à compra do medicamento/suplemento, ao método do ciclo, etc.).
- **Roteamento:** Hub "Receita médica" abre a **captura de Receita** (não Exame). Após captura/extração, o usuário (ou a extração) associa os itens às categorias pertinentes.

### Decisões da fundadora (spec-first — nada implementado até definir)
1. Receita é **subtipo de documento clínico (C1)** ou domínio próprio?
2. **Modelo de associação:** 1 receita → N alvos (medicamento, suplemento, ciclo…); manual, assistido por extração, ou ambos?
3. **Destino de captura no Mobile** (hoje inexistente) — criar tela de Receita.
4. O que a extração deve propor (itens/posologia) vs. o que o usuário confirma.

> Até a decisão, **não** wire de destino de Receita (evita improviso que depois se refaz). O bug "Receita → Adicionar exame" no Mobile é **corrigido junto com esta capacidade**, não antes.

---

## C3 — Monitoramento × integração Redbus (auditoria estrutural ANTES de implementar)

### Contexto no código
- Já existe um **modelo de wearables**: `supabase/migrations/20260615161900_025_wearables_data_model.sql` + `..._127_..Withings_provider_and_status_view`, `..._128_..connection_status`, `..._133_..external_user_id`. Ou seja: **provider**, **status de conexão** e **id externo** já modelados.
- Contrato de sincronização (UI-independent, offline-first, idempotente): `packages/core/src/ports/sync.ts` (`SyncEngine`) — implementação futura.
- Monitoramento é a superfície que consome dados observacionais (arquitetura observacional HIP-009).

### Orientação (fundadora): auditar antes de acoplar
**Redbus** é um provedor/integração de dados. O princípio é o **mesmo do desacoplamento RNDS/FHIR**: o schema do provedor **não pode dirigir** o modelo interno. Antes de fechar a implementação:
1. Auditar o **modelo de observação/monitoramento** (tabelas de wearables, enum de provider, `wearable_connections`, unidades/canonicalização, idempotência por chave).
2. Verificar se Redbus mapeia no **provider/connection já existente** ou se exige uma tabela de integração genérica.
3. Definir a **fronteira do adaptador** (Redbus → modelo interno de observação), sem acoplar a **interface** a estrutura improvisada.

### Decisões / dados necessários
1. Domínios de dado do Redbus (passos, FC, sono, glicemia…), modelo de auth e cadência.
2. Redbus entra como mais um **provider** do modelo de wearables, ou é um **agregador** (vários provedores atrás de um)?
3. Unidades/tipos canônicos de destino (não adotar os do provedor).

> Entregável desta frente = **auditoria + fronteira de adaptador**; a UI de Monitoramento só evolui depois disso.

---

## Resumo de gates
- **C1/C2:** capacidade nova → **spec-first**; decisões acima antes de código. A13 (guard) já protege a categoria declarada no Web.
- **C3:** **auditoria estrutural** do modelo de Monitoramento antes de acoplar Redbus; adaptador desacoplado (princípio RNDS).
- Nada aqui toca banco, itens congelados, RNDS ou produção.
