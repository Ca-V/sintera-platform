# MOBILE-027 — Readiness Review do Incremento 6 (Upload de Exames)

- **Natureza:** planejamento (Readiness). **Nenhuma implementação.** Permitido antes do aceite do Inc.5
  (MOBILE-022: "planejar ≠ iniciar"). O **gate de implementação** do Inc.6 continua sendo o **aceite do Inc.5**.
- **Objetivo:** responder "existe surpresa?" antes de codar — dependências, contratos, riscos, impacto arquitetural.

## 1. Escopo funcional
No detalhe/lista de Exames, permitir ao usuário **adicionar um exame** (documento) — complementa o Inc.5
(visualizar → adicionar). Fronteira REG-001 mantida: sobe/organiza o **documento**, não interpreta resultado.

## 2. Achados da Readiness (o que o Inc.6 exige)

| Dependência | Situação hoje | Consequência |
|---|---|---|
| **Contrato de escrita** (`createExam` / upload) | Exames é **read-only** (`listExams`/`getExam`) — não há criação | Precisa **definir contrato novo** (tipos + regra de negócio: campos mínimos, doc fiscal opcional, fronteira REG-001) |
| **Upload de arquivo (Storage)** | `storage/adapter.ts` é **key/value** (token/prefs), **não** serve para blob/arquivo | Precisa de **caminho novo** (Supabase Storage) + política de bucket/RLS |
| **Seletor nativo** (documento/imagem/câmera) | **Nenhum** instalado (`expo-document-picker`/`image-picker` ausentes) | **Nova dependência nativa** na Onda 1 (recurso de dispositivo — exceção legítima a "nenhuma função exclusiva do Mobile") |

## 3. Pontos que são ESCALONAMENTO (decisão da fundadora — mandato)
1. **Contrato público novo** (`exams.createExam` + upload): "Contrato Primeiro" — definir contrato → validar regra
   de negócio → `API_CONTRACTS` → implementar. A **regra de negócio** (o que é um upload válido; doc fiscal;
   fronteira) é decisão de produto/negócio.
2. **Dependência nativa nova** (seletor de arquivo/câmera): a Onda 1 opera com stack estável; adicionar módulo
   nativo é **decisão de arquitetura** (impacto no build EAS/config plugins). *Recurso de dispositivo → é a
   exceção esperada, mas a escolha da lib e a inclusão precisam do seu aval.*
3. **Ordem de produto:** o roadmap oficial (MOBILE-015) põe **Upload = Inc.6**. Vale confirmar se essa continua a
   prioridade, ou se algum domínio **de leitura** (ex.: visão estruturada / evolução de biomarcadores) vem antes
   — reordenar roadmap é decisão de produto sua (MOBILE-015 §Notas).

## 4. Recomendação (para quando o Inc.5 for aceito)
- **Aplicar o recipe** (MOBILE-015): `uploadMachine (reducer puro)` → `boundary` → `hooks (via apiClient)` →
  `screen` → `navigator` → `tests`.
- **Antecipável com segurança** (exceção MOBILE-015 §Governança — UI-indep, nav-indep, 100% testável): o
  **`uploadMachine`** (reducer puro: `idle→selecting→uploading→success|error`, `RETRY`/`RESET`) e os **tipos de
  contrato** de escrita — mas **só depois** de você fixar a regra de negócio (§3.1), para não criar abstração
  prematura (princípio Estabilidade Arquitetural).
- **Não antecipável** (travado até o aceite do Inc.5 + suas decisões): dep nativa, upload real ao Storage, tela.

## 5. Decisões que aguardam a fundadora (não bloqueiam o Inc.5)
- **D-INC6-1:** confirmar Upload como Inc.6 (ou reordenar).
- **D-INC6-2:** aprovar adicionar a dep nativa de seleção de arquivo/câmera (e qual — recomendação:
  `expo-document-picker` + `expo-image-picker`, alinhadas ao SDK 54).
- **D-INC6-3:** validar a regra de negócio do upload (campos mínimos + doc fiscal opcional + fronteira REG-001)
  para eu fixar o contrato `exams.createExam`.

> Enquanto essas decisões não vierem, **não há implementação do Inc.6** — nem pelo gate (aceite do Inc.5) nem
> pelas dependências acima. Este doc deixa o caminho pronto para execução rápida assim que forem tomadas.
