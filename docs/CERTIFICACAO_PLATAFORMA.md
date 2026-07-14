# Certificação da Plataforma (padrão de qualidade — GATE de toda capacidade)

> Fundadora (14/07/2026): a próxima fase deixa de ser "equivalência do laboratório" e passa a ser a
> **Certificação da Plataforma**. Deixamos de validar *"o novo pipeline produz o mesmo resultado do antigo"*
> e passamos a validar *"o pipeline atende aos princípios constitucionais da plataforma"*.
>
> **GATE PERMANENTE:** **toda nova capacidade** (cada modalidade — Mamografia, EEG, Ecocardiograma,
> Anatomopatológico…) **só é considerada CONCLUÍDA após passar por esta certificação.** Assim toda modalidade
> futura nasce com o mesmo padrão de qualidade do laboratório.
>
> Os exames reais deste ambiente (446 biomarcadores) são apenas o **corpus** de certificação — nunca a
> referência do modelo ([[principio_modelo_aberto]]).

## As 6 dimensões da certificação

### 1. Universalidade
O modelo representa **qualquer** exame da classe — não só os do corpus, mas **qualquer um que entre amanhã**
(analito/parâmetro/achado novo, nome diferente, fabricante/equipamento novo) **sem alteração estrutural**.
*Como certificar:* modelo aberto (classes, não listas) + teste com item arbitrário/inexistente que flui.

### 2. Fidelidade
Toda informação do documento original é **preservada**: sem perdas · sem invenções · sem reorganizações
incorretas. *Como certificar:* checagem de não-invenção (estruturado × texto-fonte) + Rastreabilidade
Documental (original sempre acessível) + Não-Produção de Conteúdo Clínico (transcreve, não interpreta).

### 3. Reprodutibilidade
O **mesmo documento** produz **exatamente a mesma representação**, sempre. *Como certificar:* fingerprint de
representação estável (mesmo doc + mesma versão de extrator → mesma assinatura); diferença = regressão.

### 4. Auditabilidade *(nova — 14/07)*
Para **qualquer elemento** representado, responder imediatamente: **de qual documento · de qual página · de
qual trecho · por qual versão do Engine · por qual versão do processador · quando** foi produzido. *Como
certificar:* proveniência por elemento (`page`, `excerpt`/`raw_text`, `engine_version`, `processor_version`
(`contract_version`), `produced_at` (`created_at`), `exam_id`) — fecha o ciclo de rastreabilidade.

### 5. Cobertura
Nenhuma representação certifica sem validar completude contra o esqueleto do modelo — nunca falsa completude
("rotula, não oculta"). *Como certificar:* Representation Validator (`certified` × `complete` separados).

### 6. Evolução
A representação é **suficiente** para alimentar corretamente: **Timeline · Evolução · Care Space · UCDA ·
compartilhamento · pesquisa futura.** *Como certificar:* a saída UCDA carrega valor numérico + tempo +
identidade + proveniência necessários para série longitudinal e leitura pelos consumidores.

## Como uma capacidade é certificada
Uma modalidade/capacidade está **CONCLUÍDA** quando, sobre o corpus real aplicável:
1. Universalidade ✅ · 2. Fidelidade ✅ · 3. Reprodutibilidade ✅ · 4. Auditabilidade ✅ · 5. Cobertura ✅ ·
6. Evolução ✅ — cada uma com teste/evidência registrados. Enquanto qualquer dimensão falhar, a capacidade
permanece **em andamento** (nunca "concluída").

**Relação com os painéis:** o painel de maturidade (`COBERTURA_CLINICA.md`) passa a refletir, por modalidade,
o estado destas 6 dimensões (não só os 5 níveis anteriores). O laboratório é a **modalidade de referência**
(corpus real disponível).

## Certificação da INFRAESTRUTURA (não do laboratório) — o objetivo real
O laboratório é apenas a **1ª evidência** de que a infra representa qualquer modalidade. A infra universal é
certificada por (todos verdes):
- **`CERT-laboratory`** — as 6 dimensões sobre o corpus laboratorial real (1ª modalidade certificada).
- **`CERT-pipeline`** — o pipeline universal (Ingestão→Análise Estrutural→Segmentação→Identity Validator)
  produz CDUs para documentos **heterogêneos** (laboratório · imagem · laudo narrativo · multipágina ·
  múltiplos exames · sem resultados estruturáveis), sem conhecer modalidade e degradando com elegância.
- **`CERT-persistence`** — a persistência canônica representa **qualquer** informação clínica (parâmetro ·
  biomarcador · achado · classificação · medida · anatomia · lateralidade · grupo · material · texto · tipo
  FUTURO) por um mapeador ÚNICO, sem adaptação por modalidade. *(Esta auditoria revelou e corrigiu a lacuna
  do `specimen` — migration 113.)*
- **`ARCH-layer-decoupling`** — Ingestão · Análise Estrutural · Segmentação · Identity Validator ·
  Persistência · UCDA **não conhecem modalidade**; só o CPE e os processadores conhecem. **Arquitetura
  universal atingida.**
