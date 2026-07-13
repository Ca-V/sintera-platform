# Clinical Reference Corpus (CRC) — índice

> **Ativos de engenharia** (fundadora, 12/07/2026). O **CRC** é o acervo de documentos REAIS que
> valida toda evolução do **Capture Hub (CAP-002)** e do **Clinical Extraction Framework
> (CEF-001)**. Este arquivo é o **ÍNDICE**; cada caso vive numa pasta própria em `docs/QA/CRC/`:
>
> ```
> CRC/
> ├── GS-003/
> │   ├── documento.pdf     (a exportar do storage)
> │   ├── expected.json     (asserção de regressão — FEITO)
> │   ├── notes.md          (FEITO)
> │   └── screenshots/
> └── GS-004/  …
> ```
>
> **Uso automatizado:** `Extractor → caso GS → comparar com expected.json → passou? → confiança →
> aprovado`. Sem julgamento humano a cada vez. Princípio invertido: **reunir casos difíceis →
> definir o protocolo → implementar**. **Regra:** NÃO alterar/mesclar estes registros manualmente
> — provam se a solução sistemática resolve. Sem juízo clínico (RDC 657).

---

## 1. Matriz Gold Standard (alvo — a completar com documentos reais)

| Caso | Categoria | Objetivo de validação |
|---|---|---|
| **GS-001** | Hemograma | Biomarcadores (resultado laboratorial simples) |
| **GS-002** | Painel sangue + urina | `document_scope = mixed`; nome "Exames laboratoriais" |
| **GS-003** | **EEG multipágina** | **Document Bundle** + **data de realização correta** + resultado = *achados* (não biomarcadores) |
| **GS-004** | **Pentacam** | **Parâmetros tomográficos** (K1/K2/Kmax/BAD-D/elevações) — não biomarcadores |
| **GS-005** | Anatomopatológico | Achados textuais (macro/micro + conclusão) |
| **GS-006** | Ressonância | Achados radiológicos (localização, estruturas, impressão) |
| **GS-007** | Ecocardiograma | Medidas cardíacas |
| **GS-008** | Espirometria | Curvas e parâmetros funcionais |
| **GS-009** | Eletrocardiograma | Medidas eletrofisiológicas |

---

## 2. Casos reais já capturados (base de regressão viva)

Registros REAIS na base (conta da fundadora, preview/prod). Mostram exatamente onde um extrator
laboratorial deixa de funcionar. **Não alterar** — servem de regressão.

### GS-003 — EEG (mesmo exame dividido em 2 imagens/páginas)
| Registro | id | `exam_date` atual | Problema |
|---|---|---|---|
| "EEG Digital e Mapeamento Cerebral" | `ac3f4673-434b-4250-82eb-20cf8ef8442f` | 2026-02-27 | classificado como `laboratory` com 12 "biomarcadores" |
| "Eletroencefalograma" | `89bf7e4b-ddad-4bbc-9c9f-69086f017d54` | **2002-07-27 (ERRADA)** | mesma data real (27/02/2026); pegou protocolo/nascimento; 19 "biomarcadores" |

**Esperado com o CEF:** os dois são **1 documento (Bundle), N páginas** → 1 registro
`neurophysiology`; resultado = **achados** (ritmo de base, descargas…); **data de realização
correta**; nenhum "biomarcador".

### GS-004 — Pentacam / córnea (mesmo exame dividido em 2 imagens)
| Registro | id | `exam_date` atual | Problema |
|---|---|---|---|
| "OCULUS - PANTACAM Mostrar 2 Exames" | `cc4d2445-3d61-4d75-afe6-dfc0ab332a12` | **2025-01-26 (ERRADA)** | data real 18/03/2026; 8 "biomarcadores" |
| "Endothelial cells" | `4835afc8-d0a2-4052-aef8-4b4e2c027758` | 2026-03-18 | classificado como `laboratory` com 18 "biomarcadores" |

**Esperado com o CEF:** **1 documento (Bundle)** → 1 registro `ophthalmology`; resultado =
**parâmetros tomográficos** (K1/K2/Kmax/espessura mínima/BAD-D/elevações); data correta.

---

## 2.1 PRINCÍPIO — Ciclo Bug → Corpus (permanente, fundadora)

Sempre que um **bug real for encontrado em produção**:
1. **Corrigir** o bug.
2. **Adicionar o documento ao CRC** (nova pasta `GS-XXX/`).
3. **Criar o `expected.json`** (resultado esperado).
4. **Escrever o teste de regressão** (compara extração × `expected.json`).
5. **Nunca mais** permitir que o bug retorne.

**Meta operacional (CRC como ativo VIVO, fundadora 13/07/2026):** todo **bug de produção relevante
gera um novo caso no CRC em até 48h**; **nenhuma correção é considerada concluída sem seu caso de
regressão**.

Cada problema encontrado por usuários vira **aumento permanente de robustez**. O efeito
acumulativo (centenas de documentos reais anotados, versionados, com resultado esperado,
cobrindo várias especialidades) torna o CRC um dos **ativos mais valiosos do projeto** —
permite comparar versões de prompts, modelos e extratores de forma **objetiva**.

## 3. Como usar

- **Regressão:** após implementar cada leitor do CEF, reprocessar o caso GS e comparar com o
  "Esperado". Nenhum deve regredir a "biomarcadores".
- **Reprodutibilidade obrigatória (Princípio da Reprodutibilidade — GOVERNANCA):** para todo caso GS,
  extrair, **reextrair várias vezes** com a **mesma versão do extrator** e verificar que o resultado
  permanece **idêntico** (nome documental + classificação + resultados). A garantia é por
  **congelamento** da representação certificada — não por determinismo do LLM. Trava determinística
  (todo PR): `tests/capture-hub/func/FUNC-reproducibility.test.ts` (estabilidade da assinatura +
  imutabilidade do exame certificado). Homologação (IA real): medir a *variância* do extrator entre
  execuções, para vigiar drift. Qualquer diferença numa reextração de mesma versão = **regressão**.
- **Mínimo estrutural (Completude estrutural — CEF §4.1):** além de "não muda", validar que a
  representação atende ao **esqueleto esperado** do tipo (ex.: GS-004 Pentacam → dois olhos ·
  parâmetros por olho · imagens · data · fabricante · modalidade). **Importa a estrutura, não os
  valores.** Um exame pode ser `reproducible=true` **e** `complete=false` (reprodutivelmente
  incompleto) — estado explícito. Depende do Modelo Clínico por tipo (ciclo do CEF).
- **Orientação de design:** o protocolo de leitura de cada tipo (CEF §7) nasce olhando o
  documento real do caso GS correspondente.
- **Expansão:** adicionar GS-005..GS-009 com documentos reais quando disponíveis.

Ver `docs/CEF-001_CLINICAL_EXTRACTION_FRAMEWORK.md`, `docs/CAP-002_CAPTURE_HUB.md` (Document Bundle).
