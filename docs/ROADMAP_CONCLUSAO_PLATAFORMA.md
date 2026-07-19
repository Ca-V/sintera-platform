# ROADMAP — Conclusão da Plataforma (sequenciamento por ciclos)

**Status:** ativo (fundadora 19/07/2026). Encerrada a fase de refinamento de **navegação/taxonomia/comunicação**
(bom nível de maturidade). A partir daqui: **concluir os grandes domínios funcionais** previstos na arquitetura,
**um por vez**, em ciclos. Sob [[ADR-000]].

## Princípio da fase — ARQUITETURA ORIENTADA PELO PRODUTO
1. Primeiro **implementar os domínios de negócio**; depois **observar padrões recorrentes**; só então
   **consolidar** novas infraestruturas compartilhadas.
2. **Sem abstração antecipada:** só criar infra nova quando houver **≥ 2–3 casos reais de uso** que a justifiquem
   (vale para o catálogo de navegação e qualquer generalização). Produz arquitetura mais simples, estável e com
   menos retrabalho.

## Inventário — grandes domínios pendentes
| # | Domínio | Estado | Doc |
|---|---|---|---|
| A | **Relatório #3** — Histórico de Saúde + Histórico de Exames no relatório | dado já existe; falta expor/renderizar | REL-001 |
| B | **Composição Corporal — evolução** — painel de acompanhamento de peso (GLP-1) · bioimpedância (classificação + fiação `body_metrics` com origem) · limpeza de métricas duplicadas | parcial | BACKLOG_EVOLUCOES, BOD-001 |
| C | **HIP-001** — Plataforma de Integrações (connector layer, vendor/domain-neutral) | a construir | HIP-001 |
| D | **WEA-001** — Wearables (1º conector do HIP-001) → alimenta **Monitoramento** | a construir | WEA-001, FASE-2-WEARABLES |
| E | **Rede de Cuidado** — governança de permissões (profissionais/familiares/auditoria/LGPD) | a construir | rede_de_cuidado |
| F | **SHR-001** — Compartilhamento estruturado paciente→profissional (evolui o `/r/[token]`) | a construir | SHR-001 |
| G | **CARE-001** — Espaço de Cuidado (profissional acompanha; snapshot; preparação de consulta; colaboração) | a construir | CARE-001 |
| H | **NOTIF-001** — provedor real de notificações (produção) | infra existe; falta provedor | NOTIF-001 |
| I | **Planejamento** — domínio estratégico (ações futuras de saúde) | direção registrada | CTC-001 §7 |
| J | **BILLING-001** — Assinaturas (gate comercial) | a construir | BILLING-001 |
| K | **Exames — conclusão** (imagem, qualitativos, multi-exame, homologação) | parcial | EXAMES_CONCLUSAO |
| L | **Modalidades** (Pentacam etc.) | após consolidação | CEF-001/UCDA-001 |

## Dependências (o que exige o quê)
- **D (Wearables) → C (HIP-001)** e → Monitoramento (já existe).
- **F (SHR) → E (Rede de Cuidado / permissões)** e reutiliza a **montagem do Relatório (A)**.
- **G (CARE) → F (SHR) + E (permissões)**.
- **H (NOTIF provedor)** beneficia D/G/I (lembretes reais); **depende da fundadora** (config de produção).
- **J (BILLING)** independente — gate antes do lançamento comercial.
- **I (Planejamento)** consome Agenda/eventos (já existem).

## Ordem recomendada — por CICLOS (um domínio por vez)
Critérios: maximizar reúso, minimizar retrabalho, entregar **valor perceptível cedo**.

**Ciclo 1 — Consolidação longitudinal** *(fecha o quase-pronto; valor imediato; risco baixo; sem infra nova)*
→ **A (Relatório #3)** + **B (Composição Corporal)**. Conclui a camada longitudinal; dado já existe; valor visível.

**Ciclo 2 — Integrações + Wearables** *(entrada AUTOMÁTICA de dados = tese do produto; alto valor percebido)*
→ **C (HIP-001)** + **D (Wearables)**. HIP-001 é a **única infra nova** aceita nesta fase — justificada por
**≥2 consumidores reais** (wearables agora; FHIR/RNDS/labs no roadmap). Validar HIP-001 com um conector real
**antes** de generalizar (product-driven).

**Ciclo 3 — Rede de Cuidado + Compartilhamento estruturado** *(base do cuidado colaborativo)*
→ **E (permissões/governança)** construída UMA vez + **F (SHR-001)** reutilizando a montagem do Relatório.
SHR entrega valor sozinho (compartilhar estruturado) **e** é pré-requisito do CARE; as permissões reusadas no
CARE evitam retrabalho.

**Ciclo 4 — CARE-001 Espaço de Cuidado** *(pilar de continuidade)*
→ **G (CARE)**: profissional autorizado acompanha; snapshot imutável; preparação de consulta; colaboração
bidirecional. Depende do Ciclo 3.

**Ciclo 5 — Prontidão de produção + comercial**
→ **H (NOTIF provedor real)** — pode **antecipar** se D/G exigirem lembretes reais (depende da fundadora) — e
**J (BILLING)** (gate comercial).

**Paralelo / quando o contexto amadurecer** (evitar abstração antecipada):
- **I (Planejamento)** — consolidar o guarda-chuva quando os subdomínios de "ações futuras" repetirem (contracepção
  + exames periódicos + consultas já apontam 2–3 casos → reavaliar após o Ciclo 1/3).
- **K (Exames — conclusão)** — interpolar conforme necessidade clínica.
- **L (Modalidades)** — após a plataforma consolidada.

## Valor perceptível cedo
Ciclos **1** (relatório completo + composição) e **2** (dados automáticos de wearables) entregam valor visível já
nas primeiras etapas — antes de investir no cuidado colaborativo (3–4) e no comercial (5).

## Melhorias arquiteturais ADIÁVEIS (até os domínios estabilizarem)
- **Catálogo único de navegação** (adiado por decisão — o SSOT de descrições já resolve o essencial).
- Qualquer **infra/abstração compartilhada** sem ≥2–3 consumidores reais.
- **Generalização do Planejamento** (guarda-chuva) — só quando os subdomínios repetirem.
- **Unificação de eventos** legado (`agenda_events`) × canônico (`health_events`) — quando houver pressão real.

## Processo
Trabalhar **um domínio por ciclo** até a versão completa da SINTERA. Ao fim de cada ciclo: verificação verde
(TSC + suíte + build), Gate de Conformidade quando aplicável, e reavaliação de quais abstrações já se justificam.
