# BACKLOG-DOC-001 — Documentos clínicos não-exame (Atestado / Relatório / Encaminhamento)

**Status:** BACKLOG FUNCIONAL FORMAL — **não implementar agora**. Registro para não se perder. **Não é bloqueador** do ciclo atual.
**Não confundir com `exam_documents`** (EXDOC-002): aquilo é multi-documento **de um exame** + projeção FHIR. Isto é **outra categoria documental do produto** — pode compartilhar infraestrutura documental depois, mas tem modelo funcional próprio.

## 1. Achado (inconsistência de jornada)

Na jornada **Adicionar registro**, a categoria disponível na entrada **desaparece** na etapa de anexação:
- **Entrada** (`src/components/ui/CreateRecordMenu.tsx` + `packages/core/src/domain/capture/intents.ts`) oferece, entre outras: Exame/Laudo · Pedido de exame · Receita médica · **Atestado, relatório ou encaminhamento** · Exame ômico · Medicamento · Suplemento · Recurso de saúde.
- **Após** selecionar **"Atestado, relatório ou encaminhamento"** e anexar o arquivo, a etapa seguinte oferece apenas: **Medicamento · Exame · Recurso de saúde**.

→ Quebra de continuidade da classificação: uma categoria da entrada não tem destino próprio no fluxo de anexação/classificação.

## 2. Requisito (arquitetura funcional mínima — quando a frente abrir)

A categoria deve permanecer disponível **durante toda a jornada**:
```
Adicionar registro → Atestado/Relatório/Encaminhamento → anexar documento → classificar → salvar
```
E deve permitir, no mínimo, distinguir:
- Atestado
- Relatório médico
- Encaminhamento
- Outros documentos clínicos

## 3. Regras de escopo (registradas)

- **Não implementar agora.** **Não** criar regra/solução provisória que depois precise ser descartada. Apenas registrar como requisito.
- **Não misturar com `exam_documents`.** São categorias distintas; infraestrutura documental comum é possível **depois**, não como premissa.
- **Não reabrir** itens congelados (H-09/H-10, `ab5b5816`, `0f5ec205`, etc.).

## 4. Sequência (prioridade subsequente)

```
AGORA
 → homologação final das plataformas (founder)
 → implementação já aprovada (estabilização dos itens corrigidos)
 → exam_documents MVP (EXDOC-002 / Fase 0)
 → arquitetura/projeção FHIR da SINTERA
 → testes/homologação técnica
DEPOIS
 → Documentos clínicos não-exame  ← ESTA frente
     → Atestado · Relatório · Encaminhamento · Outros
     → respectiva arquitetura, implementação e homologação
```

## 5. Checklist da especificação (quando a frente abrir — começar por SPEC, não por código)

- **Categorias** (Atestado / Relatório médico / Encaminhamento / Outros) — taxonomia mínima e extensível.
- **Jornada de inclusão** (entrada → anexar → classificar → salvar), preservando a categoria de ponta a ponta.
- **Metadados** (emissor, profissional, data, especialidade/destino no caso de encaminhamento…).
- **Nomenclatura** (nome de exibição derivado da evidência, sem concatenar metadados — mesmo princípio de exames).
- **Relacionamento com paciente/episódio**, quando aplicável (sem forçar vínculo a exame).
- **Extração de conteúdo** (o que a DUE deve ler; sem inventar).
- **Proveniência** (evidência → extração → registro; reaproveita `src/lib/provenance`).
- **Visualização** (onde aparece; distinto de exames/pedidos).
- **Possibilidade futura de múltiplos arquivos** (avaliar reuso de infraestrutura documental do `exam_documents`, sem acoplar agora).
- **Mapeamento FHIR aplicável** (ex.: `DocumentReference`/`Composition` de atestado/encaminhamento — a confirmar contra o perfil aplicável; provavelmente **fora do escopo RNDS** atual).

## 6. Prioridade

Não é bloqueador. Frente funcional **subsequente**, documentada **agora** para não ser perdida, sem desviar o ciclo atual.
