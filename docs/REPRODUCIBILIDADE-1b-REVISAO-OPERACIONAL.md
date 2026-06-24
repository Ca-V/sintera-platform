# Subfase 1b — Revisão Operacional Final da Migration 066

**Status:** Revisão pré-aplicação. NADA executado em produção. Base: schema/dados reais (pxiglvrgxooawetboglb).

## 1. Revisão linha a linha (4 perspectivas)

### Idempotência
- **Passo 1 (insert v1):** `WHERE current_extraction_version_id is null AND exists(biomarkers)` + `ON CONFLICT (exam_id, version_number) DO NOTHING`. Re-execução: exames já com canônica são excluídos pelo `WHERE`; se existir v1 sem canônica (run parcial impossível por ser transacional, mas defensivo), o `ON CONFLICT` impede duplicata.
- **Passo 2 (link):** `WHERE b.extraction_version_id is null` → só vincula o não-vinculado.
- **Passo 3 (canônica):** `WHERE e.current_extraction_version_id is null` → só seta o não-setado.
- **Conclusão:** 2ª execução = **no-op completo**.

### Rollback — ⚠️ ACHADO CRÍTICO (ordem é segurança-crítica)
- `biomarkers.extraction_version_id` é **`ON DELETE CASCADE`**. Portanto, **deletar uma versão APAGA os biomarcadores vinculados a ela**.
- O rollback evita isso **anulando as FKs ANTES de deletar as versões** — esta ordem é **obrigatória**:
  1. `update exams set current_extraction_version_id = null …`
  2. `update biomarkers set extraction_version_id = null …`  ← **tem de vir antes do delete**
  3. `delete from extraction_versions where reason='backfill_legacy'`
- **Recomendação:** executar o rollback como **transação única**. Nunca rodar o `delete` antes dos `update`. (`exams.current_…` é `SET NULL`, então o passo 1 é redundante por segurança; o crítico é o passo 2.)

### Integridade referencial
- Na aplicação: `v1.exam_id`/`user_id` válidos (do exame elegível); `ai_log_id` de log existente ou null; `biomarkers.FK` → v1 recém-criada; `exams.current` → v1. **Nenhuma violação possível; nenhum órfão.**

### Comportamento em reexecução parcial / rollback-then-reapply
- `apply_migration` é **transacional** → **atômico**: ou tudo commita ou nada (sem estado parcial commitado). Falha = rollback automático → re-run a partir de estado limpo.
- **Rollback depois reaplicação:** recria v1 com **novos UUIDs** (`gen_random_uuid`), mesma estrutura lógica (mesmos exames/biomarcadores vinculados, canônica setada). `created_at = exams.created_at` (determinístico); `model_version`/`ai_log_id` do último log `success` (determinístico se logs não mudam). → **resultado logicamente idêntico**, diferindo só nos UUIDs de superfície (nada externo referencia os antigos após rollback). **Sem divergência funcional, sem órfãos.**

## 2. Simulação completa (números atuais — dry-run via SELECT)

| Métrica | Previsão |
|---|---|
| Exames elegíveis (recebem v1) | **6** |
| Biomarcadores elegíveis (vinculados) | **54** |
| Versões a criar | **6** |
| Exames fora — sem biomarcador | **2** |
| Exames fora — já canônicos | **0** |
| `omics_results` fora (adiados) | **35** |
| Versões existentes antes | **0** |
| Biomarcadores total (antes = depois) | **54** |

**Previsão de invariantes (pós-execução):** I1=0 · I2=0 · I3=0 · I4=0 · I5 (54=54) · I6=0.
**Previsão de auditoria:** processados=6 · versões_criadas=6 · vinculados=54 · sem_biomarcador=2 · já_canônicos_ignorados=0 · órfãos=0 · biomarkers_depois=54 · versões_depois=6.

> A execução real deve **bater exatamente** com esta previsão.

## 3. Riscos residuais (após a 1b)

| Categoria | Nível | Detalhe / mitigação |
|---|---|---|
| **Dados** | Baixo | Só preenche FKs/ponteiros; não cria/apaga biomarcador. Metadados legados incompletos (sha256/prompt/extractor null) — aceitável (legado). Sem risco de perda. |
| **Operacionais** | Baixo | Comportamento do usuário **ZERO** (nada lê/escreve a FK antes da 1c/1d). Aplicação instantânea (6 versões, 54 updates). |
| **Rollback** | Médio-baixo | O `CASCADE` em `biomarkers.extraction_version_id` torna a **ordem** do rollback crítica. Mitigação: rollback em transação única, ordem fixa (anular → deletar). |
| **Performance** | Nenhum relevante | Escala minúscula; índices adequados; views só na 1c. |
| **Governança** | Baixo | Drift de tracking (066 adiciona registro enquanto 025–063 seguem fora) → reconciliação já tem auditoria aberta. Ômica fora do escopo, convergência planejada (sem coexistência permanente). |

## 4. Plano de execução definitivo

**Passo a passo da aplicação**
1. **Baseline:** registrar `biomarkers_total=54`, `versoes_total=0` (antes).
2. **Aplicar** a 066 via MCP (transacional, atômica).
3. **Pós:** rodar o bloco de **INVARIANTES (I1–I6)** + o **RELATÓRIO DE AUDITORIA** da migration.
4. **Comparar** com a previsão da seção 2.

**Verificações durante a execução**
- `apply_migration` retorna `success: true`. Atômica — não há estado intermediário (falha = rollback automático).

**Validações pós-execução**
- I1=0 · I2=0 · I3=0 · I4=0 · I5(54=54) · I6=0; auditoria == previsão.

**Critérios objetivos de APROVAÇÃO (1b concluída)**
- **TODOS** os invariantes verdes **E** auditoria == previsão (6/6/54/2/0/0; 54=54; 0→6). → 1b formalmente concluída → libera a 1c.

**Critérios objetivos de ROLLBACK**
- **QUALQUER** invariante de contagem ≠ 0 (I1,I2,I3,I4,I6) **OU** I5 divergente **OU** auditoria ≠ previsão **OU** órfãos > 0 → executar o rollback (transação única, ordem documentada) → investigar **antes** de reaplicar.

---

**Conclusão:** sem bloqueios. Único ponto de atenção: a **ordem do rollback** (anular FKs antes de deletar versões), já documentada e mitigável com transação única. A 1b está pronta para aplicação mediante aprovação operacional explícita.
