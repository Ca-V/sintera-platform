# RI-001 — Homologação estruturada (Condições como Reference Implementation)

> Executa o **Gate RI-001** (CAP-002-REF §4) como homologação **verificável**, não subjetiva.
> **Objetivo (postura):** não é "mergear Condições" — é **certificar a primeira implementação de
> referência da plataforma** (uma referência reutilizável, não uma feature). Ao final, a decisão é
> objetiva: cenários obrigatórios aprovados, qualidade clínica dentro do escopo, sem regressões.
> Preencher no **preview** da branch `feat/condicoes-captura` (já com o hotfix v1.0.1).
>
> **Duas partes:** **RI-001A — Funcional** (o fluxo funciona) · **RI-001B — Qualidade da
> estruturação clínica** (a estruturação é confiável e honesta). A parte B é o que determina se a
> arquitetura está pronta para evoluir ao CEF.

**Ambiente:** preview `feat/condicoes-captura` · **Testador:** fundadora · **Data:** ____
**Legenda:** ✅ aprovado · ❌ reprovado (abrir correção) · ⚠️ aprovado com ressalva (registrar)

---

## 0. Fechamento de escopo da certificação (a APROVAR pela fundadora, 13/07/2026)

Decisão para destravar a execução: **certificar o RI-001 com o que está sólido; deferir imagem
estruturada, segmentação e captura de imagem ao ciclo de execução — explicitamente.** Coerente com a
Evidência Arquitetural (materializar > especificar) e com o Freeze.

**✅ ENTRA na certificação (IN — validado nesta sessão):**
- Captura **multipágina** do mesmo exame → **1 Document Bundle**.
- **Classificação** da categoria (laboratório · pedido/guia · não-laboratorial).
- **Nomenclatura fiel/determinística** — `document_title` = o documento; nunca um biomarcador.
- `document_type` × `document_scope`; **proveniência** ("Ver documento original").
- **Laboratório:** extração estruturada de biomarcadores (caminho maduro).
- **Laudo/narrativo (imagem):** `document_only` — registra + aponta o original (§4.0 do CEF).
- **Identidade imutável** (write-once) + **Reprodutibilidade** (representação certificada + fingerprint +
  teste que quebra o CI) + **selo honesto por completude**.
- Correções desta sessão: `exam_text` byte-swap · nome fiel de imagem · imagem → `document_only`.

**⏳ SAI da certificação (OUT — ciclo de execução, NÃO bloqueia; tudo já desenhado):**
- **Document Segmentation** (1 documento = N exames) — interino mitigado por *"um exame por vez"*.
- **Extração estruturada de imagem** (achados por grupo) — hoje `document_only` (extrator do CEF).
- **Identity Validator / Clinical Identity Registry** (identificação robusta por evidências).
- **Datas semânticas** profundas (CEF §5) e **captura de imagem** (laudo + imagens no Bundle).
- **Estados de identidade** (draft/validated) + **completude estrutural** (pilar 4).

**Nota:** exames **antigos** (Pentacam, US pélvico) foram certificados **antes** das correções desta
sessão e estão **travados no valor errado** — **não contam** contra a certificação; precisam **re-upload**.

**Critério de certificação (com este escopo):** o **fluxo IN** passa o RI-001A + as linhas invioláveis do
RI-001B (identificação · nome · honestidade · sem-invenção · proveniência). Imagem estruturada e
multi-exame **não bloqueiam** — são OUT.

> **Aprovação da fundadora:** ☐ Aprovo este fechamento de escopo → seguir para verificação + Relatório +
> certificação (merge). ☐ Ajustar (o quê): __________

---

## 1. RI-001A — Matriz funcional (cenários obrigatórios)

| # | Cenário | Resultado esperado | Status |
|---|---|---|---|
| 1 | **Receita médica** | Cria **Condição**; **não** cria Exame | ☐ |
| 2 | **Laudo laboratorial com um único exame** | Cria **Exame**; título = **nome do exame** (ex.: "Hemograma") | ☐ |
| 3 | **Painel laboratorial** (Hermes Pardini, Axial…) | Cria Exame; título = **"Exames laboratoriais"** | ✅ (Hermes Pardini) |
| 4 | **Sangue + urina no mesmo PDF** | `document_scope = mixed`; título = **"Exames laboratoriais"** | ✅ (`scope=mixed` confirmado no banco) |
| 5 | **Exame de imagem** | Título = **modalidade** (ex.: "Ressonância magnética") | ☐ |
| 6 | **Documento ilegível** | Solicita **revisão**; **não** cria registros incorretos | ☐ |
| 7 | **Documento duplicado** | Comportamento esperado **documentado** (até o DOC-001) | ☐ |
| 8 | **Documento original** | "Ver documento original" **funciona** | ☐ |
| 9 | **Timeline** | Exame e/ou Condição aparecem corretamente | ☐ |
| 10 | **Proveniência** | `origin`, `display_title`, `document_type`, `document_scope` **persistidos corretos** | ✅ (display_title/document_type/document_scope/issuer confirmados) |

---

## 2. Casos específicos (atenção redobrada — histórico do projeto)

| # | Caso | O que confirmar | Status |
|---|---|---|---|
| A | **Hermes Pardini** (painel sangue+urina) | O bug de nomenclatura **não regrediu** → "Exames laboratoriais", `scope=mixed` | ✅ + `issuer=Hermes Pardini` |
| B | **Axial** (se houver PDF representativo) | Mesmo padrão documental tratado igual (título por categoria+escopo) | ☐ |
| C | **PDF com diagnóstico + exames** | (a) Exame criado · (b) Condição criada **só** com diagnóstico explícito · (c) **vínculo** `source_exam_id` correto | ☐ |

---

## 1B. RI-001B — Qualidade da estruturação clínica (revisão cruzada, 13/07/2026)

Valida se a estruturação é **confiável e honesta**, não só se funciona. Avaliar **cada exame testado**
com as 6 perguntas → registrar a régua. Alimenta o CRC diretamente.

**As 6 perguntas**
1. **Identificação** — o documento foi identificado no tipo **específico** (Pentacam, EEG, Hemograma,
   Ecocardiograma), não apenas "imagem"/"laboratorial"?
2. **Nome** — o título ficou correto (ex.: "Exames laboratoriais • Hermes Pardini", "Pentacam", "EEG
   Digital com Mapeamento Cerebral") e **nunca** um biomarcador interno ("IgE látex")?
3. **Estruturação** — os dados estruturados representam o documento? `representa bem / parcialmente / mal`.
4. **Organização** — alguma informação importante ficou de fora? (ex.: Pentacam só K1/K2 → **gera caso GS**).
5. **Sem-invenção** — existe informação **inventada**? A plataforma pode **deixar de extrair**; **nunca
   inferir**. *(Verificação AUTOMÁTICA — ver §3B.)*
6. **Honestidade** — quando não estruturou, deixa isso **claro** (sem falsa sensação de completude)?

**Régua por exame** (repetir por documento testado):

| Exame | Identificação | Nome | Estruturação | Organização | Honestidade | → CRC? |
|---|---|---|---|---|---|---|
| _(ex.: Pentacam)_ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

**Portão de merge (ressalva do Claude — protege o escopo congelado):** o RI-001 tem `IN=funcional` e
`OUT=extração EEG/Pentacam/RM` (escopo fixado pela fundadora). Portanto:
- **BLOQUEIAM (P0):** **Identificação · Nome · Honestidade · Sem-invenção · Proveniência**. Um ❌ aqui
  impede a certificação.
- **NÃO bloqueiam (diagnóstico → viram caso GS):** **Estruturação** e **Organização** profundas
  (estruturar todos os grupos de um Pentacam é trabalho do **CEF**, deliberadamente adiado). Um ⚠️
  aqui **não** impede o merge — vira caso no CRC.

> Racional: bloquear o RI-001 por "o Pentacam não trouxe todos os grupos" seria bloquear pelo trabalho
> que adiamos ao CEF. A régua **mede** tudo; o **portão** exige apenas o que é escopo do RI-001 +
> as duas linhas invioláveis (honestidade e não-invenção).

---

## 3. Verificação de proveniência (SQL de conferência)

Após os cenários, conferir os registros criados no preview:

```sql
SELECT type, display_title, document_type, document_scope, status, created_at
FROM exams ORDER BY created_at DESC LIMIT 10;

SELECT name, kind, source, source_exam_id, file_url IS NOT NULL AS tem_documento
FROM health_conditions ORDER BY created_at DESC LIMIT 10;
```

Esperado: nenhum exame nomeado por biomarcador; `document_type`/`document_scope` coerentes
com o documento; condições com diagnóstico afirmado têm `source_exam_id` quando há laudo.

---

## 3B. Verificação AUTOMÁTICA da qualidade (RI-001B — o que o Claude roda no banco)

Pré-preenche objetivamente as colunas automatizáveis da régua, antes da conferência clínica humana:

- **Identificação + Nome + Honestidade** (leitura direta): por exame testado, listar
  `display_title · document_type · document_scope · extraction_completeness`. Sinaliza:
  título por biomarcador (❌ Nome), `document_type='laboratory'/'unknown'` em exame claramente
  não-lab (⚠️ Identificação), `completeness` incoerente com o que a tela mostra (⚠️ Honestidade).
- **Sem-invenção (não-alucinação) — a checagem que substitui o olho humano na pergunta 5:** para
  cada biomarcador/resultado estruturado, confirmar que **nome e valor são rastreáveis ao TEXTO do
  documento** (campo de texto extraído do exame). Todo item estruturado **sem correspondência** no
  texto de origem é **sinalizado como suspeita de invenção (P0)**. A plataforma pode deixar de
  extrair; nunca produzir o que não está no documento.

```sql
-- Identificação/Nome/Honestidade (por exame recente do preview)
SELECT id, display_title, document_type, document_scope,
       extraction_completeness, structural_confidence, status
FROM exams ORDER BY created_at DESC LIMIT 15;

-- Base da checagem de não-invenção: itens estruturados vs. existência de texto de origem
SELECT e.id, e.display_title,
       count(b.*)                              AS itens_estruturados,
       (e.exam_text IS NOT NULL)               AS tem_texto_origem,
       e.text_truncated
FROM exams e LEFT JOIN biomarkers b ON b.exam_id = e.id
GROUP BY e.id, e.display_title, e.exam_text, e.text_truncated
ORDER BY e.id DESC LIMIT 15;
-- Cruzamento nome/valor × exam_text é feito no relatório; item sem match = suspeita P0.
-- (text_truncated=true → ausência de match pode ser truncamento, não invenção: reprocessar antes.)
```

> Casos já no CRC (**GS-003 EEG**, **GS-004 Pentacam**) têm `expected.json` → a comparação
> estruturado × esperado é **automática** (regressão), sem julgamento humano a cada vez.

---

## 4. Critério de aprovação do RI-001

Marcar **Certificado** somente quando:

**RI-001A (funcional):**
- [ ] **Todos** os cenários obrigatórios (1–10) aprovados.
- [ ] Casos específicos A–C aprovados.
- [ ] Sem regressões relevantes.
- [ ] Verificação de proveniência (§3) coerente.

**RI-001B (qualidade clínica) — apenas as linhas invioláveis + escopo do RI-001 bloqueiam:**
- [ ] **Identificação** correta do tipo em todos os exames testados.
- [ ] **Nome** correto (nenhum título por biomarcador).
- [ ] **Honestidade** — nenhuma falsa sensação de completude.
- [ ] **Sem-invenção** — checagem automática (§3B) sem suspeita P0.
- [ ] **Estruturação/Organização** avaliadas (⚠️ **não** bloqueia → vira caso GS no CRC).

**Resultado do ARG:** ☐ Certificado · ☐ Certificado com ressalvas · ☐ Requer revisão · ☐ Requer ADR

Ao certificar → **merge de `feat/condicoes-captura`** (= **certificação da 1ª implementação de
referência**) + marcar **RI-001 = ✅** (GOVERNANCA) + ADL + relatório §6 arquivado.
Só **depois** disso inicia o **HUB-001** (contrato `CapturedDocument` extraído da ref. impl.
já validada em produção — não de hipótese arquitetural).

---

## 6. Relatório RI-001 (modelo — o Claude preenche ao final)

Primeira **evidência objetiva** de que a arquitetura saiu do papel. Arquivar após a certificação.

```
RI-001 — RESULTADO
Exames testados:            __
Certificados integralmente: __
Certificados com ressalva:  __   (Estruturação/Organização ⚠️ → CRC)
Bloqueios (P0):             __   (Identificação/Nome/Honestidade/Sem-invenção/Proveniência)

Principais lacunas → casos GS gerados:
 • ____________
 • ____________

Checagem de não-invenção (§3B): ☐ sem suspeitas · ☐ N itens sinalizados
Regressões (CRC GS-003/GS-004):  ☐ nenhuma · ☐ ____
Novos casos registrados no CRC:  __

Pronto para certificar (merge): ☐ SIM · ☐ NÃO — motivo: ____
```

---

## 5. Ressalvas / achados durante a homologação

_(P0 bloqueia o merge; P1 corrige/homologa/segue; P2 vai ao backlog)_

| # | Cenário | Observado | Prioridade | Encaminhamento |
|---|---|---|---|---|
| F1 | Painel Hermes Pardini (captura em Condições) | A captura exibia o nome do documento por **um biomarcador** ("IGE específico para látex") — classificador leve (`vision/condition`) contornava o Content Classifier | P1 | **Corrigido + verificado** ✅: nome final salvo = "Exames laboratoriais • Hermes Pardini" (banco). |
| F2 | Mesmo documento (IgE látex **negativo**) | Pré-preencheu a condição **"Alergia a látex"** a partir de um exame **negativo** (inferência indevida; viola RDC 657 e "condição só com diagnóstico afirmado") | P1 | **Corrigido + verificado** ✅: nenhuma condição criada (banco). |
| F3 | Mesmo documento | Mensagem "Não consegui ler a condição" (vermelha) tratava ausência de condição como erro e empurrava a inventar uma | P2 | **Corrigido + verificado** ✅ (fundadora): nota informativa neutra. |
| F4 | Enriquecimento (sugestão fundadora) | Incluir o **nome do laboratório emissor** no título | — | **Feito + verificado** ✅: `issuer` extraído e exibido ("• Hermes Pardini"). |
| F5 | **Verificação automática de não-invenção (§3B)** — baseline nos exames do banco | `exam_text` de PDFs gravado **corrompido** (UTF-16 com bytes trocados: `C`=0x0043→`䌀`=0x4300); os 2 exames grandes deram "100% suspeito". **Decodificado → não é invenção** (texto contém "CARINA SOARES", "GLICOSE: NEGATIVO"…, batendo com os itens). Causa: `analyze` grava o texto do Path A mesmo corrompido; a extração de dados usou a via de visão (correta). | P1 | **Corrigido** ✅: `repairByteSwappedText` no extractor (reparo antes do `assessQuality` → recupera texto limpo, reabilita Path A) + teste FUNC. **Exames antigos** precisam **reprocessar** para regravar `exam_text` limpo (via `extractor_version`). |
| F6 | Pentacam (exame antigo no banco) | `document_type = laboratory` (Identificação errada — deveria ser oftalmológico). Sem `exam_text` salvo → não auto-verificável. | P1 | **Área CEF** (classificação de categoria não-lab + extrator do tipo, GS-004). Registrar; corrigir no ciclo do CEF, não bloqueia o RI-001 (escopo). |
| F7 | Hermes — **Densidade** (urina) | Valor `1.028` com faixa `1.015–1.025` no documento; texto corrompido não deixa cravar 018 vs 028 | P2 | **Conferência humana** no documento (acurácia de extração, não invenção). |
