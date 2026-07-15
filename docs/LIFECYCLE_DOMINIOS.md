# LIFECYCLE_DOMINIOS — Ciclo de Vida OBRIGATÓRIO de qualquer domínio da SINTERA

> Fundadora (15/07/2026): processo ÚNICO da plataforma. Vale para TODO domínio — Exames, Eventos
> Assistenciais, Financeiro, Medicamentos, Vacinas, Medidas, Sinais Vitais, Notificações, Billing,
> HIP-001, CARE-001, modalidades clínicas… Cada domínio segue EXATAMENTE este ciclo; a governança não é
> redefinida a cada implementação. Este documento define o PROCESSO; o estado de cada domínio vive no seu
> próprio doc (ex.: `docs/EXAMES_CHECKLIST_FUNCIONAL.md`).

## Sequência oficial (6 passos)
```
1. Implementação
      ↓
2. Auditoria estática (código)
      ↓
3. Auditoria funcional (execução)
      ↓
   Existem NCs?
      ├── Sim → Corrigir (volta à Implementação) → Auditoria funcional novamente
      └── Não
             ↓
4. Homologação com documentos reais
             ↓
   Todos os critérios aprovados?
      ├── Não → Corrigir → Homologação novamente
      └── Sim
             ↓
5. Certificação da Plataforma
             ↓
6. Encerramento do domínio (→ manutenção evolutiva)
```

## O que cada passo significa (não confundir objetivos)
| Passo | Objetivo | Como | Sai quando |
|---|---|---|---|
| **1. Implementação** | Construir a funcionalidade | Código + backlog oficial (fonte única) | funcionalidade `Implementado` no checklist |
| **2. Auditoria estática (código)** | Inspecionar a implementação | Leitura de código; jornadas tracejadas início→fim | sem estado quebrado/inconsistência evidente |
| **3. Auditoria funcional (execução)** | **PROCURAR DEFEITOS** | Percorrer as jornadas no app REAL (interações reais) | não encontra mais NC relevante (0 crítica/alta) |
| **4. Homologação (docs reais)** | **CONFIRMAR o aceite** | Validar comportamento + documentos reais | todos os critérios aprovados |
| **5. Certificação** | Validar princípios | Conferir princípios constitucionais/regulatórios | 6 dimensões aprovadas |
| **6. Encerramento** | Domínio = capacidade certificada | — | sai da fila principal → manutenção |

**Distinção crítica 3 × 4:** a **auditoria funcional CAÇA bugs** (o objetivo é achar problemas; toda NC volta
para implementação). A **homologação é ACEITE** (confirma que o comportamento está como esperado) e **só
começa quando a auditoria funcional já não acha problemas relevantes**. Não misturar caça-a-bug com aceite.

## Homologação × Certificação — perguntas diferentes
**Homologação responde** (a plataforma fez o que deveria, com documentos reais?):
- A plataforma fez o que deveria? · O usuário consegue executar toda a jornada? · O comportamento está correto?
  · Os documentos reais foram tratados corretamente?

**Certificação responde** (os princípios continuam válidos?):
- O Modelo Aberto foi preservado? · Não houve invenção de conteúdo (RDC 657)? · A rastreabilidade continua
  íntegra? · A auditabilidade continua íntegra? · A representação continua universal? · Os princípios
  constitucionais continuam válidos? *(6 dimensões — ver `docs/CERTIFICACAO_PLATAFORMA.md`.)*

## Dois CONTROLES obrigatórios por domínio (coexistem)
1. **Backlog Funcional oficial** (fonte ÚNICA da verdade): itens `F` com ID · descrição · estado · dependências
   · responsável · **evidências verificáveis** (commit/teste/migration/homologação/CRC/certificação) ·
   observações. Estados do item: `Não iniciado` · `Em desenvolvimento` · `Implementado` · `Homologado`.
   Validação em 3 eixos: **Código × Testes × Homologação** (testes automatizados **quando aplicável**;
   cobertura NÃO é objetivo — testes em manutenção, só por NC/feature nova/bug de homologação).
2. **Auditoria por JORNADAS** do usuário (completas, início→fim). Estado por jornada (5):
   `Não iniciada` → `Auditoria estática (código)` → `Auditoria funcional (execução)` → `Homologada` → `Certificada`.

## Não-Conformidades (NC)
Fluxo: **NC → item F → Implementação → Testes → Homologação → encerramento da NC.** Cada NC registra
**Origem da descoberta** (Revisão funcional · UX · Homologação · Certificação · CRC · Teste · Feedback) e
**Severidade** (`crítica` bloqueia/perde dado · `alta` fluxo quebrado · `média` UX confusa · `baixa` cosmético).

## Critérios de encerramento
- **Encerrar um item F:** Código · Testes (quando aplicável) · Homologação (quando aplicável) · NCs relacionadas
  encerradas — todos simultâneos.
- **Encerrar a Auditoria Funcional:** todas as jornadas em `Auditoria funcional (execução)` concluída · 0 NC
  crítica/alta aberta · média/baixa tratadas ou justificadas.
- **Encerrar o DOMÍNIO (simultâneo):** todo o backlog `Homologado` · todas as NCs encerradas · Matriz de
  Homologação 100% aprovada · Certificação da Plataforma aprovada.

## Escopo congelado durante o ciclo
A partir da Auditoria, o escopo do domínio é CONGELADO: só **correções (NC) · auditoria · homologação ·
certificação**. Ideias novas → backlog geral da plataforma (`docs/BACKLOG_EVOLUCOES.md`), ciclo futuro. Nova
infra só quando inevitável para uma capacidade (Estabilidade Arquitetural). **Objetivo = ENCERRAR
CAPACIDADES**, não implementar features; cada domínio encerrado = 1 capacidade certificada.

## Roadmap por capacidade (aplicando este ciclo, um domínio por vez)
Exames 🔄 · Eventos Assistenciais ⬜ · Financeiro ⬜ · Medidas ⬜ · Sinais Vitais ⬜ · Billing ⬜ · HIP-001 ⬜ · CARE-001 ⬜.
