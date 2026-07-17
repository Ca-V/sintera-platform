# BOD-001 — Composição Corporal (painel longitudinal) + Princípio Fato × Visualização

**Status:** ativo · **Versão:** 1.1 (17/07/2026 — spec de UX das 5 áreas + princípio de marcos) · **Responsável:** Fundadora (direção) · Claude (redação).
**Objetivo:** definir o domínio **Composição Corporal** e consolidar a **separação arquitetural de três domínios**
que a fundadora estabeleceu como princípio. **Dependências:** ADR-000, DATA-001, EVENTS-001, CEF/CPE (exames),
HIP-001 (wearables). **Relacionado:** Registros de Saúde (timeline), Histórico de Exames, FB-003 (bioimpedância→Exames).
Segue a estrutura de [[ARCH-000]] §4.

---

## PRINCÍPIO ARQUITETURAL — Fato × Conhecimento derivado (fundadora 17/07, permanente)
> **O Histórico guarda o FATO; os painéis apresentam CONHECIMENTO DERIVADO e evolução temporal.** Cada domínio
> tem um objetivo distinto e **não duplica responsabilidades**. Reutilizável em toda a plataforma.

**Os três domínios longitudinais (sem sobreposição):**
| Domínio | Objeto Principal (de Governança) | Papel |
|---|---|---|
| **Registros de Saúde** | Evento de Saúde | Linha do tempo da jornada da usuária (consulta·exame·procedimento·vacina·medicamento·suplemento·internação·cirurgia·outros). **Não é análise** — é a jornada. |
| **Histórico de Exames** | Exame / Biomarcador | **Fonte oficial** dos exames (documento original·extração·biomarcadores·laboratório·solicitante·data·valor·doc fiscal·rastreabilidade) e **evolução longitudinal dos resultados** (ex.: Ferritina 2022→28, 2023→41, 2024→52; HbA1c 5,9→5,7→5,5→5,3). |
| **Composição Corporal** | Indicador Corporal | Painel consolidado da **evolução corporal proveniente de múltiplas fontes** — não armazena exames. |

Regra de ouro: o dado entra e é preservado no **Histórico de Exames** (o fato); **Composição Corporal** e demais
painéis **leem** dele (+ outras fontes) e apresentam evolução — **nunca duplicam o armazenamento**.

> **Não-fonte-primária + rastreabilidade (fundadora 17/07):** a **Composição Corporal NÃO constitui uma fonte
> primária de dados.** Todos os indicadores apresentados devem possuir **rastreabilidade até sua origem** (exame,
> registro manual, wearable ou outra integração), **preservando a proveniência** das informações. Nenhum painel
> cria informação — apenas consolida e apresenta dados provenientes de fontes rastreáveis.

> **Consolidação multi-fonte + contextualização por marcos (fundadora 17/07 — amplia "painel derivado"):**
> **A Composição Corporal deve consolidar indicadores provenientes de múltiplas fontes e contextualizar sua
> evolução com eventos relevantes da jornada de saúde, preservando sempre a rastreabilidade até a fonte original
> e sem duplicação de dados.** A página deixa de mostrar apenas números e passa a **contar a evolução da
> composição corporal dentro do contexto da vida da usuária** — conectando dados corporais à jornada completa
> (Registros de Saúde). Os marcos são **lidos** de fatos já existentes (health_events/agenda); **nunca duplicados**.
> É o diferencial da SINTERA frente a apps tradicionais de peso/bioimpedância.

## 1. Objetivo
Painel de **acompanhamento longitudinal da composição corporal**, útil para nutrição/endocrinologia e especialmente
para usuárias em terapia **GLP-1** — foco não só no peso, mas na **evolução da composição** (gordura × massa magra).

## 2. Escopo
**Dentro:** consolidação/visualização de indicadores corporais de múltiplas origens; painel GLP-1.
**Fora:** armazenamento de exames/laudos (isso é do **Histórico de Exames**); qualquer laudo entra por Exames.

## 3. Modelo de Dados
- Fonte primária: `body_metrics` (peso/altura/circunferências/gordura/massa magra/etc.) — hoje a base da página.
- Alimentação futura: resultados de **bioimpedância/DEXA processados como EXAME** (FB-003) gravam `body_metrics`
  automaticamente; **wearables** (HIP-001) e **balanças** também. Cada ponto guarda a **origem** (`source`:
  bioimpedancia·dexa·manual·balanca·wearable).
- **Sem tabela nova de "composição"** — é projeção/visão sobre `body_metrics` (+ derivações), preservando origem.

## 4. Componentes
- Página `/dashboard/medidas` (rótulo **Composição Corporal**). Consome `body_metrics`. Por vir: seletor de
  indicador, série temporal por indicador com **rótulo de origem**, painel GLP-1 (metas/ritmo/preservação de massa magra).

## 4.1 Experiência (UX) — 5 ÁREAS (spec da fundadora 17/07)
A página se organiza em cinco áreas. Todas são **derivadas** (leem fontes rastreáveis; não criam fato; RDC 657 —
factual, sem juízo clínico).

**① Resumo atual.** Só o **estado mais recente** de cada indicador — Peso · IMC · % de gordura · Massa muscular ·
Massa magra · Água corporal · Gordura visceral · Metabolismo basal · Massa óssea (circunferências quando houver).
Cada indicador exibe sua **origem** (Bioimpedância · DEXA · Manual · Balança inteligente · Wearable). *(Rótulo de
origem já implementado — FB-003 subitem d.)*

**② Evolução longitudinal.** Cada indicador tem seu **gráfico temporal** próprio; a usuária **escolhe** qual
acompanhar (peso, gordura, massa muscular, água, gordura visceral, …). Série derivada de `body_metrics` por métrica.

**③ Comparação entre avaliações.** A usuária escolhe **dois** exames/avaliações (ex.: duas bioimpedâncias) e a
plataforma mostra uma tabela **Indicador · Avaliação 1 · Avaliação 2 · Variação** (ex.: Peso 82,4→76,8 = −5,6 kg;
Gordura 35%→29% = −6 p.p.; Massa muscular 29,8→30,5 = +0,7 kg). **Não é diagnóstico** — comparação objetiva entre
medições. Fonte: pontos de `body_metrics` de cada avaliação (agrupados por `exam_id`/data/origem).

**④ Jornada de tratamento (GLP-1).** Painel de acompanhamento: **peso inicial · peso atual · meta · perda
acumulada · ritmo médio · % da meta atingido · data de início do acompanhamento**. *(Já implementado o núcleo —
`weight-journey.ts` + painel "Acompanhamento de peso"; falta a "data de início do acompanhamento" explícita.)*

**⑤ Marcos da evolução (DIFERENCIAL).** Sobre os gráficos, exibir **eventos importantes da jornada** — ex.: início
do GLP-1 · mudança de dose · início da musculação · consulta com nutricionista · nova bioimpedância. Assim, ao ver
uma queda de gordura ou aumento de massa muscular, a usuária **correlaciona visualmente** com fatos já registrados
em **Registros de Saúde**. **Integração entre domínios sem duplicação:** os marcos são **lidos** de
`health_events`/`agenda_events` (a fonte é o Registro de Saúde), apenas **projetados** como anotações no gráfico.
Definir os **tipos de evento** que contam como marco (medicamento/GLP-1, dose, atividade/musculação, consulta de
nutrição, exame de bioimpedância/DEXA) — critério aberto e governado, sem nova tabela.

## 5. Fluxos
1. **Entrada** (sempre pela FONTE): bioimpedância/DEXA → **Exames** (FB-003) → processa → grava `body_metrics`;
   peso manual → registro direto; wearable/balança → HIP-001 → `body_metrics`. 2. **Resumo atual (①):** último
   valor por indicador + origem. 3. **Evolução (②):** série por indicador escolhido. 4. **Comparação (③):** duas
   avaliações → tabela de variação. 5. **GLP-1 (④):** deriva peso inicial/atual/meta/perda acumulada/ritmo médio/
   % da meta/evolução de gordura e massa muscular/**preservação de massa magra**. 6. **Marcos (⑤):** lê eventos-
   marco de `health_events`/`agenda_events` e os projeta como anotações sobre os gráficos (sem duplicar).

## 6. APIs
Leitura de `body_metrics` (por usuário). Sem escrita própria de exame (a escrita vem das FONTES). Contrato de
indicadores: `{ metric, value, unit, measured_on, source }`.

## 7. Segurança
RLS por usuário em `body_metrics`. LGPD (dado sensível). Origem preservada = auditabilidade.

## 8. Governança
Precedência ADR-000 > SPAGS > BOD-001. **Invariantes:** (i) Composição Corporal **não armazena** exames nem
duplica dados; consolida por leitura, sempre com **origem**; (ii) **não é fonte primária** — todo indicador é
rastreável à fonte; (iii) **marcos são lidos** de Registros de Saúde (`health_events`/`agenda_events`), **nunca
duplicados** — a página apenas contextualiza. Mudança nesses invariantes = emenda ao SPAGS antes do código.

## 9. Auditoria
Cada indicador exibe a origem (exame/manual/wearable). Rastreável até o exame-fonte quando vier de laudo (FB-003).

## 10. Evolução (por área da §4.1)
- **Feito:** rename Medidas→Composição Corporal; princípio dos três domínios; **① rótulo de origem** por indicador
  (FB-003 d); **② séries por indicador** (base via Sparkline); **④ núcleo GLP-1** (`weight-journey.ts` + painel).
- **Próximo (incremental, nesta ordem sugerida):**
  1. **① Resumo atual** dedicado (cartões do último valor por indicador + origem, no topo).
  2. **② Evolução** com **seletor de indicador** + gráfico temporal maior (hoje é sparkline por grupo).
  3. **④ GLP-1**: acrescentar **data de início do acompanhamento** + **% da meta** no painel.
  4. **③ Comparação entre avaliações** (escolher 2 → tabela de variação; agrupar por `exam_id`/data/origem).
  5. **⑤ Marcos da evolução**: ler eventos-marco de Registros de Saúde e anotá-los sobre os gráficos.
  6. Ingestão de **DEXA** como exame (FB-003 estende bioimpedância) alimentando os mesmos indicadores.
- **Sem nova tabela**; tudo por leitura/derivação preservando origem (invariantes §8).
