# Reprodutibilidade — Estratégia de Implantação (Fases 1a → 1e)

**Modelo: gates explícitos. SEM avanço automático entre fases.** Cada fase é um PR próprio + ponto de validação obrigatório + aprovação explícita da fundadora antes da seguinte. Cada fase é aditiva/reversível.

## Ordem exata e gates

### 1a — Migrations aditivas (estrutura)
- **Objetivo:** criar `extraction_versions`, `modalities`, colunas e índices. Estruturas vazias.
- **Rollback:** bloco no fim da migration (drop reverso). Sem perda de dado.
- **Gate obrigatório:** schema aplicado; `tsc`/build verde; **comportamento ZERO alterado** (smoke test: app idêntico ao anterior).
- **Métricas de não-regressão:** nenhuma funcional esperada (estrutura inerte); runtime logs sem novos erros.

### 1b — Backfill (vincular o legado)
- **Objetivo:** criar `v1` para cada exame com resultado; vincular resultados; setar ponteiro canônico; reconciliar `omics_versions`.
- **Rollback:** `null` nos ponteiros + nos `extraction_version_id` + apagar as versões legadas criadas. Dado original intacto.
- **Gate obrigatório (invariantes verificáveis):** todo exame-com-resultado tem `current_extraction_version_id`; todo resultado tem `extraction_version_id`; **contagens batem (antes = depois)**; **0 órfãos**.
- **Métricas:** `count(biomarkers)` constante; `count(exames com resultado e sem canônica) = 0`; `count(resultados sem version_id) = 0`.

### 1c — Views canônicas + migração das leituras
- **Objetivo:** criar `current_biomarkers` (+ análogas) e apontar **todos** os consumidores para elas (detalhe-exame, histórico, indicadores, contadores, insights, export LGPD, ômica).
- **Rollback:** reverter as leituras para as tabelas-base (mudança concentrada/feature-flag).
- **Gate obrigatório (PARIDADE):** cada tela/relatório/contador exibe **exatamente o mesmo conjunto** de antes (golden tests / comparação de saída por exame).
- **Métricas:** diff de resultados por exame = **0**; contadores idênticos; latência de leitura estável; sem novos erros nos runtime logs.

### 1d — Caminho de escrita (aposentar `replace_biomarkers`)
- **Objetivo:** nova extração grava **por versão** + seta canônica; reanálise cria versão **sem** sobrescrever. `replace_biomarkers` destrutivo é retirado.
- **Rollback:** **feature-flag** volta ao caminho antigo (transição com **dual-write** garante reversibilidade a qualquer momento).
- **Gate obrigatório:** paridade do novo caminho com o antigo validada **antes** de cortar o destrutivo; reprocessar comprovadamente **não** muda a canônica.
- **Métricas:** toda extração nova tem `version` + canônica; reprocessar não altera `current_extraction_version_id`; **0 perda de dado**; taxa de erro de persistência estável.

### 1e — `document_sha256` + `source_text` obrigatórios + reuso idempotente
- **Objetivo:** calcular hash no upload; persistir `source_text` em **todos** os caminhos (incl. imagem); habilitar reuso por chave completa; enforce de obrigatoriedade para novas versões.
- **Rollback:** remover o enforce (voltar nullable) / desligar o reuso por flag.
- **Gate obrigatório:** 100% dos novos documentos com `sha256`; 100% das novas versões com `source_text`; reuso comprovado (mesmo arquivo → mesma versão reusada, **sem** chamar o modelo).
- **Métricas:** % novos docs com `sha256` = 100%; % novas versões com `source_text` = 100%; taxa de reuso em reuploads idênticos; **objetivo central:** mesmo documento → **mesmo resultado exibido**.

## Métricas globais de não-regressão (todas as fases)

- **Funcional:** contadores (exames, biomarcadores) estáveis; telas com o mesmo conjunto.
- **Dados:** 0 órfãos, 0 perda, contagens consistentes.
- **Operacional:** runtime logs sem novos erros; latência de leitura estável.
- **Reprodutibilidade (alvo):** reprocessar não muda a canônica; reupload idêntico reusa.

## Regra de governança da implantação

1. **Um PR por fase.** Nada de juntar fases.
2. **Gate explícito** antes de avançar — a fundadora aprova a passagem de fase com base nas métricas acima.
3. **Sem auto-avanço.** Nenhuma fase dispara a seguinte automaticamente.
4. **Reversível por etapa.** Cada fase tem rollback documentado e (1c/1d) feature-flag.
5. **Aplicação só após revisão do SQL/diff** de cada fase.
