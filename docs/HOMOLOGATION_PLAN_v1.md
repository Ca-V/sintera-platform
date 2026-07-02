# SINTERA — Plano de Homologação v1.0

**Objetivo:** validar toda a plataforma **antes** de iniciar o Scientific Catalog v2. Torna a estabilização **objetiva** (critérios, não impressão). Produzido durante o período de estabilização — **não** abre frente de arquitetura nem implementação estrutural.
**Legenda de status:** ✅ OK · ⚠️ Ressalva/triar · ⏳ Pendente (aguarda validação) · ⛔ Falha.
**Responsáveis:** PO = fundadora (valida UX/funcional em produção com login) · Dev = Claude (verifica técnico/arquitetural automatizável).
**Cada item:** Critério · Resultado esperado · Status · Responsável · Evidência.

---

## 1. Homologação Funcional
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Cadastro de usuário | `/onboarding` cria conta + perfil + consentimento; cai no dashboard | ⏳ | PO | depende do Supabase (branch `06dd0d0`) |
| Login | `/login` autentica; erros claros | ⏳ | PO | — |
| Adicionar exame (upload) | PDF/foto vira exame `pending`; opções na caixa única | ⏳ | PO | commit `00bf8d0` |
| OCR / Extração | biomarcadores extraídos; status `processed` | ⏳ | PO | — |
| Parser / Normalização | valores/unidades/datas coerentes | ⏳ | PO | — |
| Histórico (Linha do Tempo) | eventos ordenados; itens clicáveis → destino | ⏳ | PO | commit `ccf6b12` |
| Evolução | biomarcadores segmentados por material/painel; nome do catálogo | ⏳ | PO | commit `e157261` |
| Biomarcadores (detalhe/[slug]) | resultado uniforme; sem termo clínico; medições correto | ⏳ | PO | commits `ee64e2f`,`f727621` |
| Agenda | tipos corretos; formato/repetir; plano de saúde enxuto | ⏳ | PO | commits `bc53a3b`,`bf52220` |
| Produtos (Medicamentos/Supl./Disp.) | cadastro c/ especificação; projeta Agenda/Histórico/Gastos | ⏳ | PO | — |
| Ômicas | criar/importar painel; versionamento | ⏳ | PO | — |
| Documentos | anexos abrem; substituição preserva original | ⏳ | PO | — |

## 2. Homologação de UX
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Consistência do vocabulário | verbos oficiais (Adicionar/Fotografar/Escanear…) | ⚠️ | Dev/PO | `UI_LANGUAGE_STANDARD.md`; varredura parcial — telas restantes a revisar |
| Navegação | links levam ao destino certo; sem becos | ⏳ | PO | — |
| Responsividade | mobile/desktop sem quebra | ⏳ | PO | — |
| Estados vazios | convite/ação, não erro | ⏳ | PO | — |
| Mensagens de erro | claras, com saída | ⏳ | PO | — |
| Acessibilidade | contraste, foco, rótulos | ⏳ | PO | — |

## 3. Homologação Arquitetural
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Catálogo como SSOT | nomenclatura sempre do catálogo | ⚠️ | Dev | nome/segmentação OK; **séries ainda agrupam por nome** (dívida — `CATALOG_SSOT.md`) |
| Sem nomenclatura duplicada | UI não origina nomes | ⚠️ | Dev | `panels.ts` transicional (rótulos ainda fora do catálogo) |
| Conformidade com ADRs | nada contraria ADR aprovado | ✅ | Dev | `ARCHITECTURAL_DECISIONS.md` |
| Bounded Contexts | fronteiras respeitadas | ✅ | Dev | `BOUNDED_CONTEXTS.md` (referência) |
| Auditoria | operações críticas rastreadas | ⏳ | Dev/PO | a inventariar |
| Eventos | fluxos coerentes com `DOMAIN_EVENTS` | ⏳ | Dev | conceitual (não implementado como bus) |
| Invariantes | nenhuma violada | ⏳ | Dev | `DOMAIN_INVARIANTS.md` → virar testes |

## 4. Homologação Técnica
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| TypeScript | `tsc --noEmit` sem erros | ✅ | Dev | **exit 0** (02/07) |
| ESLint | sem erros nem avisos | ✅ | Dev | **0 erros · 0 avisos** (02/07; era 22+9) — commits `3e72f25` + limpeza de avisos |
| Testes automatizados | suíte verde | ✅ | Dev | **153 passed** · 126 todo |
| Performance | tempos aceitáveis (OCR/Timeline/API) | ⏳ | Dev | metas em `NON_FUNCTIONAL_REQUIREMENTS` (a criar) |
| Logs | erros logados; cobertura de catálogo | ⚠️ | Dev | fallback `catalogId ?? ''` sem log (dívida) |
| Tratamento de exceções | sem tela quebrada; mensagens | ⏳ | Dev/PO | — |

## 5. Homologação Regulatória (Governança Científica / RDC 657)
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Sem linguagem interpretativa | nenhum termo proibido (estável/normal/…) | ⚠️ | Dev/PO | "estável" removido; varrer restante c/ `UI_LANGUAGE_STANDARD` |
| Sem recomendação clínica | nada de "inicie/deve/risco" | ⏳ | PO | — |
| Governança Científica | organiza/contextualiza, não conclui | ✅ | Dev | princípio `PLANO_MATURIDADE §0` |
| Rastreabilidade | dados com proveniência | ⏳ | Dev | referência do laudo OK; ciência (SRL) = futuro |

## 5.1 Smoke test mínimo (~15 min) — GATE para iniciar o Scientific Catalog v2
Cobertura automatizada é **só unitária/domínio** (não cobre OCR/Supabase/upload/auth). A PO executa em produção (`sinteramais.com.br`). Três grupos:

### Grupo A — Gate de Liberação (OBRIGATÓRIOS — precisam passar)
1. [ ] Criar usuário *(requer cadastro publicado — Supabase)*
2. [ ] Fazer login
3. [ ] Enviar exame em **PDF**
4. [ ] Enviar exame em **imagem** (foto)
5. [ ] OCR/extração processa
6. [ ] Parser: valores/unidades coerentes
7. [ ] Exame aparece na lista
8. [ ] **Timeline (Histórico)** atualiza
9. [ ] **Evolução** atualiza (biomarcadores)
10. [ ] **Dashboard** atualiza
11. [ ] Abrir **detalhes do exame** (resultado/segmentação/nome do catálogo)
12. [ ] Logout · 13. [ ] Novo login · 14. [ ] Dados permanecem íntegros

### Grupo B — Critérios de Validação da Nova Arquitetura (NÃO bloqueiam)
Não são apenas "testes": são os **critérios que a nova arquitetura deverá satisfazer**. Validam capacidades previstas para a PRÓXIMA arquitetura; **não são bugs**, e sim limitações conhecidas da implementação vigente (que **ainda não atende** ao domínio aprovado). Não são critério de aprovação da plataforma atual.
15. [ ] Excluir um exame → Timeline/Dashboard atualizam ✅. *Hoje a exclusão apaga o `ai_processing_log` (`api/exams/[id]/route.ts:60`) — a trilha de auditoria é perdida. A implementação atual **ainda não atende** ao domínio aprovado (Event Store + auditoria permanente). → **CAT-022**.*
16. [ ] Reenviar o mesmo exame → *Hoje faz nova ingestão (sem deduplicação — DOMAIN_BEHAVIORS B5). Previsto para a próxima arquitetura. → **CAT-021**.*

### Grupo C — Testes Futuros (executados APÓS o Catalog v2)
Replay completo · event sourcing · auditoria imutável · reprojeções · SRL · IA Contextual.

**GATE de bloqueio = Grupo A (1–14) + cutover + cadastro.** O Grupo B **não** bloqueia: dedup e auditoria permanente **dependem** da própria arquitetura orientada a eventos que o Catalog v2 introduz — não podem ser pré-condição para iniciá-la. Risco a mitigar: problema **estrutural** no fluxo do Grupo A.

## 6. Critérios de Aceite (regra)
A **homologação v1.0 é aprovada** quando: (a) todos os itens **Funcionais** e **Regulatórios** = ✅; (b) itens **Técnicos** sem ⛔ (ressalvas ⚠️ com dívida registrada são aceitáveis); (c) ressalvas arquiteturais (SSOT/séries por catalog_id) **registradas como pós-estabilização**, não bloqueiam v1.0. Cada ✅ exige **evidência** (screenshot/log/commit). O que ficar ⏳ é responsabilidade da PO validar em produção.

---
**Uso:** a estabilização (~30 dias) percorre esta lista até zerar ⏳ e resolver/registrar os ⚠️. Só então inicia o Catalog v2 (ver `POST_STABILIZATION_BACKLOG.md`).
