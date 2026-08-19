# EXDOC-008 — D-1: Especificação da validação em Preview/Staging (dados sintéticos)

> **Fase D-1 — ESPECIFICAÇÃO, não execução.** Define COMO validar a estrutura C-2 (migração 138) com **dados
> exclusivamente sintéticos**, antes de qualquer próxima migração estrutural. **NÃO** executa nada, **NÃO** faz
> merge do PR #137, **NÃO** faz backfill, **NÃO** faz wiring de app/UI, **NÃO** cria vínculo automático, **NÃO**
> implementa a camada FHIR, **NÃO** toca RNDS. **Data:** 2026-08-19 · **Gate D-1: FECHADO** (execução D-2 só após aprovação).
> **Fontes governantes:** Protocolo SINTERA v1.0 → `SINTERA-FHIR-CANONICAL-MODEL.md` → `INTEROPERABILITY-COMPLIANCE-MATRIX.md`.

## 1. Objetivo
Provar, em ambiente de Preview/Staging isolado e com **dados sintéticos**, que a estrutura da 138 (`service_requests`,
`service_request_results`) sustenta corretamente os cenários clínicos-alvo **e permanece coerente** com o modelo
canônico FHIR e o Protocolo v1.0 — **sem** implementar a projeção FHIR nem qualquer integração.

## 2. Não-objetivos (limites explícitos)
- Não `merge` do PR #137; não aplicar em produção.
- Não **backfill** de dados existentes; nenhum dado real é usado.
- Não **wiring** de aplicação/UI; nenhuma tela alterada.
- Não **vínculo automático** pedido↔resultado; toda sugestão exige confirmação explícita.
- Não **inventar** `code`/`system`/`display`/`bodySite`/terminologia/identificador clínico — `coding` permanece **NULL** até curadoria.
- Não implementar `ServiceRequest`/`DiagnosticReport`/`Observation`/`DocumentReference` como recursos FHIR — a projeção é **conceitual** (mapa), não código.

## 3. Ambiente e regras de dados sintéticos
- **Ambiente:** Preview/Staging isolado. Opções: (a) **branch Supabase de preview** (se disponível — atenção: branching exigiu plano Pro, `[NC-infra]` a confirmar); (b) **PostgreSQL isolado** com o **subconjunto real de schema** necessário (exams + as FKs) + a 138, como no C-2, porém com dataset mais amplo. A escolha do ambiente é decisão de gate (D-2).
- **Dados 100% sintéticos:** usuários fictícios (UUIDs de teste), sem PII, sem CPF/CNS/CNES/CRM reais; textos de procedimento genéricos. **Proibido** dado de paciente real.
- **Isolamento:** RLS por `auth.uid()`; nenhum dado sintético cruza para produção.
- **Descarte:** ambiente efêmero/reversível; ao fim, drop/rollback.

## 4. Dataset sintético mínimo
| Entidade | Registros sintéticos |
|---|---|
| Usuários | **U_A** (`aaaa…`) e **U_B** (`bbbb…`) — para RLS |
| `exams` (legado, NÃO tocar) | **E_LEG** processed (marcador de preservação) |
| `exams` documento-pedido (medical_order) | **PED_BI** (pedido bilateral) e **PED_MP** (pedido multi-procedimento) — do U_A |
| `exams` resultado | **RES_ESQ**, **RES_DIR** (resultados por lado); **RES_MP** (resultado de outro procedimento) |
| `service_requests` | **SR_ESQ**, **SR_DIR** (bilateral, `requisition_id=REQ_1`); **SR_P1**, **SR_P2** (multi-proc, `requisition_id=REQ_2`) |
| `service_request_results` | vínculos conforme cenários §5 |
| Documento original | referência ao `file_url` de **PED_BI** (para projeção conceitual `DocumentReference`) |

## 5. Matriz de cenários (o que fazer × esperado × requisito)
| # | Cenário | Ação (dados sintéticos) | Resultado esperado | Requisito |
|---|---|---|---|---|
| D-01 | **Pedido bilateral** | criar PED_BI; SR_ESQ + SR_DIR com `requisition_id=REQ_1`, mesmo `code_text`, `laterality` esquerdo/direito | 2 `service_requests` no mesmo `requisition_id`; lateralidade distinta; `coding` NULL | Modelo §4.1 |
| D-02 | **Mesmo `requisition_id`** | consultar por REQ_1 | exatamente 2 SR agrupados | Modelo §4.1 |
| D-03 | **Lateralidade esq/dir** | inspecionar `laterality` | um `esquerdo`, um `direito` | Modelo §4.1 |
| D-04 | **Pedido com múltiplos procedimentos** | criar PED_MP; SR_P1 + SR_P2 (`code_text` distintos) `requisition_id=REQ_2` | 2 SR, procedimentos diferentes, mesmo requisition | Protocolo §5/§6 |
| D-05 | **Resultado só do lado esquerdo** | vincular RES_ESQ → SR_ESQ, `link_method='user_confirmed'`, `confirmed=true` + `confirmed_by/at` | esquerdo cumprido; direito **pendente** (sem vínculo) | Protocolo §6 (parcial) |
| D-06 | **Resultado posterior do lado direito** | vincular RES_DIR → SR_DIR (confirmado) | ambos cumpridos; ordem temporal preservada (`linked_at`) | Protocolo §6 (parcial→completo) |
| D-07 | **Tentativa de vínculo ambíguo** | RES ambíguo com 2 candidatos (SR_P1, SR_P2): inserir **2 sugestões** `auto_suggested`, `confirmed=false`, com `match_confidence` e `evidence` | nenhuma vira efetiva; **lista de candidatos** representada; sem vínculo silencioso | Protocolo §6 |
| D-08 | **Sugestão sem confirmação** | manter D-07 sem confirmar | `confirmed=false`; não conta como cumprimento | Protocolo §6 |
| D-09 | **Confirmação explícita** | confirmar 1 candidato: `confirmed=true` + `confirmed_by`+`confirmed_at`; descartar o outro | apenas o confirmado vale; `chk_confirmation_provenance` garante quem/quando | Protocolo §6 |
| D-10 | **Registro de proveniência** | inspecionar vínculos | todos têm `linked_by`/`linked_at`/`link_method`; confirmados têm `confirmed_by`/`at` | Protocolo §6/§10 |
| D-11 | **Isolamento RLS** | U_B consulta | U_B vê 0 linhas de U_A (dois sentidos: U_A vê as suas) | Protocolo §10 |
| D-12 | **Histórico legado** | após tudo + rollback | E_LEG inalterado; 138 removível sem perda | EXDOC-005/007 |

## 6. Projeção conceitual para FHIR (MAPA — não implementar)
Verificar que os dados sintéticos **podem** ser projetados (mapeamento determinístico), sem construir o projetor:
| Dado C-2 | Recurso/elemento FHIR | Verificação conceitual |
|---|---|---|
| `service_requests` (linha) | `ServiceRequest` | 1:1; `code`=CodeableConcept(text; coding NULL) |
| `requisition_id` | `ServiceRequest.requisition` | REQ_1 agrupa SR_ESQ+SR_DIR |
| `laterality`/`body_site_*` | `ServiceRequest.bodySite` | lado representável (coding [NC-artefato]) |
| `service_request_results` (confirmado) | `DiagnosticReport.basedOn → ServiceRequest` | vínculo por lado; parciais representáveis |
| `result_exam_id` | `DiagnosticReport` (evento) + `Observation` (átomos) | resultado ≠ pedido |
| `source_exam_id` (`file_url`) | `DocumentReference` | documento original preservado |
| U_A/U_B (subject) | `Patient` (interim id local) | identificadores nacionais **diferidos** ([NC]) |

**Regra:** a projeção é **conceitual/declarativa** nesta fase; nenhuma serialização FHIR, nenhum Bundle, nenhum validator, nenhum RNDS.

## 7. Verificação de coerência (checklist obrigatório)
- **Modelo canônico:** pedido→`ServiceRequest` (nunca resultado); resultado→`DiagnosticReport`/`Observation`; vínculo→`basedOn`; documento→`DocumentReference`; execução→`Procedure` (diferido, não confundido). Bilateral = 2 SR + `requisition`.
- **Protocolo v1.0:** display ≠ semântica; sem inventar código; proveniência obrigatória; sem vínculo silencioso; FHIR-first / não RNDS-dependent; nenhuma exigência RNDS não confirmada virou requisito.
- **Matriz de conformidade:** itens P0 (semântica/persistência/identidade estrutura) representáveis; `[NC]` (LOINC/SNOMED/perfil RNDS/imagem) permanecem `[NC]`, não preenchidos.

## 8. Critérios de aceite do D-2 (a executar só após aprovação)
- Todos os cenários D-01..D-12 com resultado esperado (evidência por asserção, exit 0).
- **Zero** `coding`/identificador clínico inventado; `coding` NULL preservado.
- **Zero** vínculo confirmado sem `confirmed_by`/`confirmed_at`.
- RLS isola nos dois sentidos; legado intacto após rollback.
- Projeção conceitual (§6) coerente para todos os dados sintéticos.
- Coerência (§7) confirmada; nenhum desvio do modelo canônico/Protocolo.
- Nenhum toque em produção, backfill, wiring/UI ou merge.

## 9. Riscos, `[NC]` e dependências
- **`[NC-infra]`** disponibilidade de branch Supabase de preview (branching exigiu Pro) — se indisponível, D-2 roda em PostgreSQL isolado com subconjunto de schema real.
- **`[NC-artefato]`** ValueSets/coding (LOINC/SNOMED/`bodySite`) — não populados; permanecem `[NC]`.
- **`[NC]`** perfil/fluxo federal RNDS (imagem/pedido) — fora do escopo; não vira requisito por hipótese.
- **Dependência:** a 138 (PR #137) permanece **não mesclada**; D-2 aplica a 138 no ambiente de validação, não em produção.

## 10. Entregável do D-2 (formato do próximo gate)
Ao executar (após aprovação): dataset sintético aplicado; resultado das asserções D-01..D-12; evidência de RLS (dois sentidos); evidência de legado intacto; tabela de projeção conceitual preenchida; checklist de coerência §7; e confirmação dos limites (sem merge/backfill/wiring/auto-link/códigos inventados).

## 11. Ordem dos gates
```
C-2 implementação → APROVADO
   ↓
D-1 especificação da validação (este documento) → AGORA (aguarda aprovação)
   ↓ aprovação
D-2 execução com dados sintéticos → evidências
   ↓ gate de aprovação
próxima evolução estrutural: #117 ajustada · identidade · terminologia · demais P0/P1 (conforme a matriz)
```
**Arquitetura vigente:** FHIR-first → BR-Core-aligned → RNDS-ready → **não RNDS-dependent**. Nenhuma exigência RNDS não confirmada vira requisito por hipótese.

> **Gate D-1 FECHADO.** Especificação, não execução. Só após sua aprovação executa-se o D-2 (dados sintéticos), sem merge do #137 e sem tocar produção/baseline do Ciclo 1.
