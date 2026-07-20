# HIP-007 — Arquitetura de Aquisição de Dados Observacionais (Fase 2 · Etapa 1 · referência universal)

**Status:** ARQUITETURA para aprovação (rev. 2). **Documento de referência de TODA aquisição automática de dados
observacionais da SINTERA** — não apenas wearables. Sob [[ADR-000]] · [[HIP-001]] ·
[[ucda_universal_clinical_data_architecture]] · [[compliance_001_fase0_gate]].
**Fase 2 em 4 etapas:** **(1) esta — Aquisição Observacional** → (2) Arquitetura do App Móvel → (3) Arquitetura de
Sincronização → (4) Implementação. **Nenhum código antes das 3 primeiras aprovadas** (nem `/mobile/ingest`).

> **Escopo (ajuste 3):** este documento nasceu do ecossistema de wearables, mas descreve a **camada universal de
> aquisição de dados observacionais** — vale para **qualquer origem**: wearables, dispositivos médicos domiciliares,
> sensores contínuos (CGM, MAPA, Holter), apps de saúde, plataformas parceiras, integrações futuras via **FHIR**, e até
> observações extraídas automaticamente de documentos quando fizer sentido. Não é "a arquitetura dos wearables".

## 1. Princípios (herdados)
Convergência canônica · reúso antes de abstração ([[principio_estabilidade_arquitetural]]) · modelo aberto
([[principio_modelo_aberto]]) · factual/não-SaMD ([[principio_nao_producao_conteudo_clinico]]) · privacidade/LGPD by
design · datas determinísticas ([[date_001_temporal_ssot]]).

## 2. Nomenclatura — a camada é a **OBSERVAÇÃO** (ajuste 1)
Análise: "Evento de Saúde" colidiria com **Evento Assistencial**. O termo coerente com a linguagem da plataforma e com o
padrão FHIR (que a UCDA já referencia) é **Observação** — em FHIR, `Observation` é justamente medições/sinais. Quatro
camadas **distintas e não ambíguas**:

| Camada SINTERA | Granularidade | Análogo FHIR |
|---|---|---|
| **Evento Assistencial** ([[evento_assistencial_entidade_central]], `health_events`) | encontro (consulta/exame/procedimento) | Encounter |
| **Documento / Laudo** | artefato documental de origem | DocumentReference / DiagnosticReport |
| **Unidade de evidência clínica (UCDA)** | evidência clínica canônica | (abstração própria) |
| **Observação** ← *esta camada* | **medida no tempo**, de origem automática | **Observation** |

No código: **`CanonicalSample` permanece como a forma de transporte da Observação**; `wearable_readings` é o **SSOT
bruto**; `body_metrics`/vitais são **projeções**. (Renomeações de rótulos ocorrem na implementação; a arquitetura fixa
o conceito.)

## 3. A Observação (contrato canônico)
> **Toda medida automática é uma Observação: um fato pontual/temporal com valor, origem, dispositivo, confiabilidade,
> qualidade e contexto — nunca um indicador (§5).** Não modelamos "HRV/sono/peso/glicemia" como entidades separadas.

> **A Observação é uma ENTIDADE ESTRUTURAL da plataforma — não apenas um conceito das integrações.** Toda funcionalidade
> futura que consuma **dados objetivos** trabalha **sobre Observações**: wearables, dispositivos médicos, observações
> extraídas automaticamente de documentos, sensores contínuos e integrações futuras. É o substrato único do dado objetivo.

| Campo | Descrição |
|---|---|
| `domain` | domínio funcional (§6) |
| `metric` | tipo do sinal (aberto: `hrv`, `sono`, `peso`, `glicemia`…) |
| `value` / `unit` | valor + unidade (nulo → fica só no bruto) |
| **contexto temporal** | `recordedAt` (instante) **e** `interval` opcional (início/fim) p/ observações com duração |
| **origem** | `source`, `connectorClass` (web/mobile/aggregator/document), `connectorVersion` |
| **dispositivo** | `deviceId`/`deviceModel` quando houver (multi-dispositivo → Etapa 3) |
| **confiabilidade** | `reliability`/`confidence` — medido vs estimado (nível da MEDIÇÃO) |
| **qualidade / nível de evidência** | tier da ORIGEM (§4) |
| **proveniência/idempotência** | `externalId` + chave de dedup determinística |
| **versão** | versão da leitura (correção/reprocessamento → Etapa 3) |

Campos novos são **aditivos e opcionais** (modelo aberto): a infra atual continua válida; cada adaptador preenche o que
a fonte oferece.

## 4. Níveis de confiabilidade e QUALIDADE (ajuste 5)
Além da confiabilidade da medição, a Observação carrega o **nível de evidência da origem** — aberto, **sem regras agora**,
só espaço para a plataforma diferenciar no futuro:

| Tier (aberto) | Exemplo |
|---|---|
| `manual` | informado pelo usuário |
| `consumer_device` | wearable de consumo |
| `medical_device` | dispositivo médico certificado |
| `clinically_validated` | validado clinicamente |
| `derived` | calculado/derivado de outras observações |

Isso permitirá, adiante, priorizar/ponderar fontes e explicitar a procedência ao usuário — sem reescrever a arquitetura.

## 5. Observação × Indicador (ajuste 4)
> **Uma Observação NUNCA é um Indicador. Indicadores são SEMPRE derivados de Observações.**

| | Observação | Indicador |
|---|---|---|
| FC agora = 72 bpm | ✅ fato pontual | — |
| Média de FC em 7 dias | — | ✅ derivado |
| Variabilidade ao longo do tempo | — | ✅ derivado |
| Tendência | — | ✅ derivado |

Os indicadores vivem numa **camada de cálculo separada** (base da **inteligência longitudinal / V3**
[[visao_sistema_cognitivo_clinico]]), sempre **rastreável** às observações de origem, nunca gravada como se fosse
observação. Esta separação mantém o SSOT limpo e a inteligência auditável.

## 6. Domínios funcionais (espelham a Sidebar — [[sidebar_ssot_taxonomia]]; abertos)
Monitoramento contínuo (FC, HRV, sono, SpO₂, resp., temperatura) · Atividade física (treinos/passos, com duração) ·
Composição corporal (peso, gordura, massas, água) · Dispositivos médicos (PA/MAPA, glicemia/CGM, oximetria, Holter/ECG) ·
*(aberto)*. A **classe do conector é ortogonal ao domínio** (o mesmo domínio recebe de várias classes; a mesma classe
serve vários domínios).

## 7. Tipos de conectores (todos produzem Observações)
- **Web / Fabricante** (OAuth nuvem): pull incremental + webhook. Ex.: Withings (referência pronta).
- **Mobile / Plataforma** (Apple Health, Health Connect): dado on-device → o **app SINTERA** faz push. Pilar do
  monitoramento contínuo (agrega Garmin/Oura/WHOOP/Fitbit via celular).
- **Agregador** (Terra/Rook): batch/stream de muitas fontes; acelerador de largura, não substituto.
- **Documento** (futuro): observações extraídas automaticamente de laudos, quando fizer sentido — mesma Observação.
Adicionar classe/fonte = **novo adaptador, zero mudança no núcleo**.

## 8. Jornada completa do dado (ajuste 2)
```
Fonte (wearable · dispositivo médico · sensor contínuo · app · parceiro · FHIR · documento)
  │
  ▼ Conector (web pull/webhook · mobile push · agregador batch · extração de documento)
  │
  ▼ Normalização (adaptador isolado: unidades, tempo, dedup na fonte → Observação canônica)
  │
  ▼ Modelo Canônico (Observação = CanonicalSample++ → SSOT bruto wearable_readings)
  │
  ▼ Governança (idempotência, proveniência, confiabilidade/qualidade, versão, LGPD, validação entre camadas)
  │
  ▼ Projeções → Timeline / Monitoramento / Composição · NOV-001 (novidade)
  │
  ▼ Indicadores (camada de cálculo derivada — médias, variabilidade, tendências) [V3]
  │
  ▼ Funcionalidades SINTERA (acompanhamento, insights, Rede de Cuidado, relatórios…)
```
Este fluxo é a **referência** para toda futura integração.

## 9. Modelo canônico e projeções
Observação → **SSOT bruto** (`wearable_readings`) + **projeções de exibição** (`body_metrics`/vitais; futura projeção de
atividade com duração) + **NOV-001**. Convergência à **UCDA** na maturidade (V3), sem migração prematura
([[principio_convergencia_progressiva]]).

## 10. Visão de longo prazo (ajuste 6)
Esta arquitetura **não** existe para os conectores da Fase 2: é a **base permanente de toda aquisição automática de dados
observacionais da SINTERA** pelos próximos anos. Deve absorver novas origens, domínios, dispositivos, padrões (FHIR/RNDS)
e níveis de evidência **sem revisão estrutural** — só novos adaptadores e entradas abertas. Mudança estrutural aqui exige
revisão arquitetural formal.

## 11. Governança e relação com as próximas etapas
Documento de **referência**: todo conector adere (emite Observação, respeita domínios/proveniência/qualidade/projeções).
- **Etapa 2 (App Móvel):** stack (RN+Expo × RN puro × Flutter × nativo) sob lente **técnica + estratégica** (time,
  contratação, reúso de contratos/regras da web, manutenção 5 anos…) + app como **produto** (timeline, notificações,
  captura, upload de exames, agenda, lembretes, interação com a web), não coletor.
- **Etapa 3 (Sincronização):** iniciação, background, conflito, multi-dispositivo, duplicidade, versionamento, offline,
  idempotência — pré-requisito do `/mobile/ingest`.
- **Etapa 4 (Implementação):** só após as três aprovadas.
