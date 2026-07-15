# LIFECYCLE_DOMINIOS — Ciclo de Vida OBRIGATÓRIO de qualquer domínio da SINTERA

> Fundadora (15/07/2026): processo ÚNICO da plataforma. Vale para TODO domínio — Exames, Eventos
> Assistenciais, Financeiro, Medicamentos, Vacinas, Medidas, Sinais Vitais, Notificações, Billing,
> HIP-001, CARE-001, modalidades clínicas… Cada domínio segue EXATAMENTE este ciclo; a governança não é
> redefinida a cada implementação. Este documento define o PROCESSO; o estado de cada domínio vive no seu
> próprio doc (ex.: `docs/EXAMES_CHECKLIST_FUNCIONAL.md`).

## Sequência oficial (8 passos)
```
1. Implementação
      ↓
2. Auditoria estática (código)
      ↓
3. GATE ARQUITETURAL  ── engenharia  (falha → NC Arquitetural → volta à Implementação)
      ↓
4. GATE REGULATÓRIO   ── conformidade (falha → NC Regulatória → volta à Implementação)
      ↓
5. Auditoria funcional (execução)   ── CAÇA defeitos
      │   Existem NCs? ── Sim → Corrigir → Auditoria funcional novamente
      └── Não
             ↓
6. Homologação com documentos reais ── ACEITE
      │   Critérios aprovados? ── Não → Corrigir → Homologação novamente
      └── Sim
             ↓
7. Certificação da Plataforma
             ↓
8. Encerramento do domínio (→ manutenção evolutiva)
```

### Gate Arquitetural (passo 3) — ENGENHARIA (falha → NC Arquitetural)
- [ ] **Desacoplamento** (módulos não conhecem PDF/OCR/modalidade/gateway)?
- [ ] Respeita o **CPE** (só `processClinical`/CertifiedCDU; nenhum processador conhece matéria-prima)?
- [ ] Produz/consome **UCDA** (contrato canônico)?
- [ ] **Modelo Aberto** (representa CLASSES; extensível sem mudança estrutural)?
- [ ] **Sem listas fechadas** (biomarcadores/modalidades/fabricantes)?
- [ ] **Sem acoplamento de modalidade** fora do CPE/processadores?
- [ ] **Reutilização** (não recriar o que já existe) · **arquitetura em camadas** preservada?
*(Automatizado em parte por `ARCH-*`: `ARCH-processor-decoupling`, `ARCH-layer-decoupling`,
`ARCH-single-notification-infra`, `ARCH-billing-decoupling`, `exam-categories.arch`…)*

### Gate Regulatório (passo 4) — CONFORMIDADE (falha → NC Regulatória)
- [ ] **NÃO interpreta clinicamente** nem **gera conteúdo clínico** (RDC 657)?
- [ ] **Rastreabilidade** íntegra (origem/autoria; documento de origem é a fonte)?
- [ ] **Auditabilidade** íntegra (por elemento: documento·página·trecho·versão·quando)?
- [ ] **Reprodutibilidade** (mesmo doc+versão → mesma representação)?
- [ ] **Documento original preservado** e sempre acessível?
- [ ] **LGPD** (dado sensível de saúde/PII protegido) · **consentimentos** (quando aplicável)?
*(Separar de arquitetura evita passar na engenharia e introduzir risco regulatório.)*

## O que cada passo significa (não confundir objetivos)
| Passo | Objetivo | Como | Sai quando |
|---|---|---|---|
| **1. Implementação** | Construir a funcionalidade | Código + backlog oficial (fonte única) | funcionalidade `Implementado` no checklist |
| **2. Auditoria estática (código)** | Inspecionar a implementação | Leitura de código; jornadas tracejadas início→fim | sem estado quebrado/inconsistência evidente |
| **3. Gate Arquitetural** | Barrar regressão de ENGENHARIA | Checklist arquitetural (+ testes `ARCH-*`) | todas "sim" (senão NC Arquitetural) |
| **4. Gate Regulatório** | Barrar risco de CONFORMIDADE | Checklist regulatório (RDC 657/LGPD/rastreabilidade) | todas "sim" (senão NC Regulatória) |
| **5. Auditoria funcional (execução)** | **PROCURAR DEFEITOS** | Percorrer as jornadas num AMBIENTE EXECUTÁVEL fiel (preview/staging/homologação — **NÃO** exige produção) com interações reais | não encontra mais NC relevante (0 crítica/alta) |
| **6. Homologação (docs reais)** | **CONFIRMAR o aceite** | Validar comportamento + documentos reais | todos os critérios aprovados |
| **7. Certificação** | Validar princípios | Conferir princípios constitucionais/regulatórios | 6 dimensões aprovadas |
| **8. Encerramento** | Domínio = capacidade certificada | — | sai da fila principal → manutenção |

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

## Identificação GLOBAL (toda a plataforma)
- **Funcionalidades:** `<DOMÍNIO>-F###` — ex.: `EXA-F001` (Exames) · `MED-F001` (Medicamentos) · `VAC-F001`
  (Vacinas) · `PROC-F001` · `BILL-F001` (Billing) · `NOTIF-F001` · `CARE-F001` · `HIP-F001`. Sem ambiguidade
  entre domínios; uma NC aponta exatamente para uma funcionalidade da plataforma inteira.
- **NCs:** sequência GLOBAL `NC-0001`, `NC-0002`, … (contínua entre domínios — praticamente um sistema de
  qualidade). Campos obrigatórios: **Data · Responsável · Origem · Domínio · Funcionalidade · Tipo ·
  Severidade · Estado · Evidência**.

## Não-Conformidades (NC)
Fluxo: **NC → item F → Implementação → Testes → Homologação → encerramento da NC.**
- **Origem:** Revisão funcional · UX · Gate Arquitetural · Gate Regulatório · Homologação · Certificação · CRC ·
  Teste automatizado · Feedback de usuário.
- **Severidade:** `crítica` (bloqueia/perde dado) · `alta` (fluxo quebrado) · `média` (UX confusa) · `baixa` (cosmético).
- **Tipo:** `Funcional` · `UX` · `Arquitetural` · `Regulatória` · `Performance` · `Segurança` · `Dados`.

*Tipo + Severidade respondem rápido: "quantas NCs arquiteturais/regulatórias abertas?".*

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
