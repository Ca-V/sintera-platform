# HIP-007 — Arquitetura do Ecossistema Wearables (Fase 2 · Etapa 1 · documento de referência)

**Status:** ARQUITETURA para aprovação. **Documento de referência de TODA integração de dados automáticos.** Sob
[[ADR-000]] · [[HIP-001]] · [[ucda_universal_clinical_data_architecture]] · [[compliance_001_fase0_gate]].
**Fase 2 em 4 etapas:** **(1) esta — Ecossistema** → (2) Arquitetura do App Móvel → (3) Arquitetura de Sincronização →
(4) Implementação. **Nenhum código antes das 3 primeiras aprovadas.**

## 1. Princípios (herdados, não novos)
- **Convergência canônica:** toda fonte automática vira **Evento de Saúde** → projeções. Web/Mobile/Agregador são
  **adaptadores**; nenhum muda a arquitetura ([[hip_001_plataforma_integracoes]]).
- **Reúso antes de abstração** ([[principio_estabilidade_arquitetural]]): estende-se `CanonicalSample`/`propagateSamples`
  existentes; não se cria pipeline paralelo.
- **Modelo aberto** ([[principio_modelo_aberto]]): tipo/dispositivo desconhecido **degrada, não quebra**.
- **Factual, não-SaMD** ([[principio_nao_producao_conteudo_clinico]]) · **Privacidade/LGPD by design** · **datas
  determinísticas** ([[date_001_temporal_ssot]]).

## 2. Domínios funcionais (espelham a Sidebar — [[sidebar_ssot_taxonomia]])
Um **domínio** classifica o Evento de Saúde para projeção/UI/NOV-001. Aberto/extensível:

| Domínio | Exemplos de sinais | Superfície de consumo | Natureza temporal |
|---|---|---|---|
| **Monitoramento contínuo** | FC, FC repouso, **HRV**, **sono**, SpO₂, resp., temperatura | Monitoramento | série/pontual |
| **Atividade física** | treinos, passos, distância, calorias, FC de treino | Atividade Física (futuro) | **evento com duração** |
| **Composição corporal** | peso, gordura, massa magra/muscular/óssea, água | Composição Corporal | pontual (dia) |
| **Dispositivos médicos** | PA, glicemia (CGM), oximetria, ECG | Monitoramento/Exames | pontual/série |
| *(aberto)* | novos domínios entram sem redesenho | — | — |

> A classe do conector (fabricante/agregador/mobile) é **ortogonal** ao domínio: o mesmo domínio recebe dados de várias
> classes; a mesma classe entrega vários domínios.

## 3. Conceito central — **Evento de Saúde** (unidade do domínio longitudinal)
> **Toda medida automática é um Evento de Saúde: uma observação com valor, tempo, origem, dispositivo, confiabilidade e
> contexto.** Não modelamos "HRV", "sono", "peso", "glicemia" como entidades independentes — são todos Eventos de Saúde
> com metadados. (Sugestão da fundadora, 20/07 — adotada como espinha do modelo longitudinal.)

**Distinção essencial (evita taxonomia paralela):**
- **Evento Assistencial** ([[evento_assistencial_entidade_central]], tabela `health_events`) = nível de **ENCONTRO**
  (consulta, exame, procedimento) — clínico + administrativo + recorrência + timeline.
- **Evento de Saúde / Observação** (este documento) = nível de **OBSERVAÇÃO** (uma medida no tempo, de fonte automática).
- **UCDA** ([[ucda_universal_clinical_data_architecture]]) = a evidência clínica documental. O Evento de Saúde é a
  **forma longitudinal atômica** dessa mesma filosofia; converge para a UCDA na maturidade (V3), sem forçar agora
  ([[principio_convergencia_progressiva]]).
- Nomes concretos no código: mantém-se `CanonicalSample` como **forma de transporte** do Evento de Saúde; a
  persistência bruta (`wearable_readings`) é o **SSOT auditável**; `body_metrics`/vitais são **projeções de exibição**.

**Metadados do Evento de Saúde (contrato canônico — evolução de `CanonicalSample`):**
| Campo | Descrição |
|---|---|
| `domain` | domínio funcional (§2) |
| `metric` | tipo do sinal (aberto; ex.: `hrv`, `sono`, `peso`, `glicemia`) |
| `value` / `unit` | valor + unidade (nulo permitido → fica só no bruto) |
| **contexto temporal** | `recordedAt` (instante) **e** `interval` opcional (início/fim) para eventos com duração (atividade/sono) |
| **origem** | `source` (fabricante/app), `connectorClass` (web/mobile/aggregator), `connectorVersion` |
| **dispositivo** | `deviceId`/`deviceModel` quando houver (multi-dispositivo — Etapa 3) |
| **confiabilidade** | `reliability`/`confidence` (ex.: medido vs estimado; manual vs sensor) |
| **proveniência/idempotência** | `externalId`, chave de dedup determinística |
| **versionamento** | versão da leitura (correções/reprocessamento — detalhe na Etapa 3) |

Campos novos (interval, deviceId, connectorClass, reliability, versão) são **aditivos e opcionais** — a infra atual
continua válida; adaptadores preenchem o que a fonte oferece (modelo aberto).

## 4. Tipos de conectores (como cada um produz Eventos de Saúde)
- **Cat. 1 — Web / Fabricante** (OAuth nuvem, backend↔backend): **pull** com janela incremental + webhook. Ex.: Withings
  (pronto, referência). Produz Eventos diretamente no backend.
- **Cat. 2 — Mobile / Plataforma** (Apple Health, Health Connect): dado **on-device**; o **app SINTERA** lê e **push**
  para o backend. **Pilar do monitoramento contínuo** (agrega Garmin/Oura/WHOOP/Fitbit via celular).
- **Cat. 3 — Agregador** (Terra/Rook): **batch/stream** de muitas fontes por uma integração; **acelerador de largura**,
  não substituto. Entra por gatilho ([[HIP-006]] §5).
Todos emitem o **mesmo** Evento de Saúde → `propagateSamples`. Adicionar classe/fonte = novo adaptador, **zero** mudança
no núcleo.

## 5. Fluxos de sincronização (visão; detalhe na Etapa 3)
- **Pull (Web):** on-open/agendado, throttle, marca d'água (maior `recordedAt`), webhook para tempo quase real.
- **Push (Mobile):** o app inicia (foreground + background), envia lotes idempotentes; **quem inicia, background,
  conflito, multi-dispositivo, duplicidade, versionamento, offline, idempotência = ETAPA 3.**
- **Batch/Stream (Agregador):** webhook/stream do agregador → mesmo ingest canônico.
Invariantes já garantidos hoje: idempotência por `(user, provider, metric, recorded_at)`; projeção por dia preservando
`created_at` (base do NOV-001).

## 6. Modelo canônico e projeções
`Evento de Saúde (CanonicalSample++)` →
- **SSOT bruto:** `wearable_readings` (série + proveniência + idempotência) — nunca sobrescreve a fonte.
- **Projeções de exibição:** `body_metrics` (composição/vitais pontuais) + futura projeção de **atividade** (eventos com
  duração) + **NOV-001** (`monitoramento`, `activity`, …).
- **Convergência (V3+):** consolidação longitudinal e, quando fizer sentido, adaptação à UCDA — sem migração prematura.

## 7. Evolução prevista (2 anos)
1. **Vocabulário de vitais contínuos** (HRV, sono, FC repouso…) + domínio Monitoramento consolidado.
2. **Mobile como pilar** (Apple/Health Connect) → cobertura ampla; depois **atividade física** (domínio + Strava, pós
  gate jurídico) e **dispositivos médicos** (CGM/PA).
3. **Agregador** para cauda longa/streaming/Garmin (por gatilho).
4. **Inteligência longitudinal (V3):** tendências/adesão/lacunas sobre Eventos de Saúde — **não** sobre dados sob termos
  proibitivos de IA (ex.: Strava). Convergência à UCDA.
5. **Confiabilidade e multi-dispositivo** como cidadãos de 1ª classe (reconciliação entre fontes preservando origem).

## 8. Governança
Este documento é a **referência** de toda futura integração: qualquer conector (fabricante, agregador, mobile) **adere**
a ele — emite Evento de Saúde, respeita domínios, proveniência e projeções. Alterações estruturais aqui exigem revisão
arquitetural. As Etapas 2 (app) e 3 (sincronização) **derivam** deste modelo.

## 9. O que esta etapa NÃO decide (fica para as próximas)
- **Etapa 2:** stack do app (RN+Expo × RN puro × Flutter × nativo) + arquitetura do app como **produto** (timeline,
  notificações, captura, upload de exames, agenda, lembretes, interação com a web) — nascendo além de "coletor".
- **Etapa 3:** estratégia completa de sincronização (iniciação, background, conflito, multi-dispositivo, duplicidade,
  versionamento, offline, idempotência) — pré-requisito do `/mobile/ingest`.
- **Etapa 4:** implementação e ordem, só após as três aprovadas.
