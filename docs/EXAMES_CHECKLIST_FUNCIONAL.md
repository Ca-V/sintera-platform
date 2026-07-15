# Exames — BACKLOG OFICIAL do Domínio (Controle 1: Checklist Funcional)

> Fundadora (15/07): este é o **documento oficial e plano de execução** do domínio Exames (não apenas
> uma lista de conferência) — evita que backlog e checklist se desalinhem. Coexiste com o **Controle 2 —
> Matriz de Homologação** (`tests/homolog/COVERAGE.md`, 8 dimensões, só evolui com documentos reais).
>
> **Estado (Controle 1):** `Não iniciado` · `Em desenvolvimento` · `Implementado` · `Homologado`. Sem
> percentuais por funcionalidade.
> **Validação em 3 eixos (separar implementado de validado):** **Código** (existe e verificado) ·
> **Testes** (automação verde) · **Homologação** (validada com documento real — Controle 2).
> Um item só chega a `Homologado` quando os 3 eixos estiverem ✅.
>
> **Conclusão do domínio (objetiva):** todo o backlog em `Homologado` **+** Matriz aprovada **+**
> Certificação da Plataforma aprovada. Qualquer pendência → *em desenvolvimento*. Responsável de execução:
> Claude; responsável de homologação/aprovação: Fundadora.

## 🔒 ESCOPO CONGELADO — contrato de entrega (fundadora 15/07)
- **Nenhuma nova funcionalidade** entra no domínio Exames. Permitido apenas: **correção de NC · fechar
  eixo Testes · homologação · certificação.** Toda ideia/melhoria nova vai para o **backlog geral da
  plataforma** (`docs/BACKLOG_EVOLUCOES.md`) para um ciclo futuro — **não** amplia esta versão.
- **Backlog IMUTÁVEL:** itens só podem *mudar de estado*, *receber evidências* ou *receber vínculo de NC*.
  **Não** criar novos itens `F`, exceto quando uma NC revelar a ausência de uma funcionalidade que já
  fazia parte do escopo originalmente definido.
- **Encerramento do domínio (simultâneo):** todos os `F` em `Homologado` · todas as NCs encerradas ·
  Matriz de Homologação 100% aprovada · Certificação da Plataforma concluída. Depois → manutenção
  evolutiva (sai da fila principal).
- **Objetivo:** não "implementar funcionalidades", e sim **ENCERRAR CAPACIDADES**. Cada domínio encerrado =
  1 capacidade certificada. Ao encerrar Exames, o MESMO ciclo se repete no próximo domínio (mesmo processo).

**Roadmap por capacidade:** Exames 🔄 · Eventos Assistenciais ⬜ · Financeiro ⬜ · Medidas ⬜ · Sinais Vitais ⬜ · CARE-001 ⬜ · HIP-001 ⬜.

## Regras de governança do backlog (fundadora 15/07)
1. **Fonte ÚNICA da verdade.** Este documento é o oficial do domínio Exames. Nenhum item vive só em
   memória, conversa ou backlog paralelo. **Toda** nova funcionalidade, correção, melhoria ou NC entra
   AQUI **antes** de qualquer implementação.
2. **Evidências OBJETIVAS.** A coluna Evidências registra referências verificáveis — commit, teste
   automatizado, migration, documento de homologação/CRC, certificação. Nada de "implementado/corrigido".
3. **NC gera item de backlog.** Quando uma NC exige desenvolvimento, ela origina/vincula um item `F`.
   Fluxo: **NC → Item F → Implementação → Testes → Homologação → encerramento da NC**.
4. **Critério para ENCERRAR um item F (todos simultâneos):** Código implementado · Testes automatizados
   aprovados (quando aplicável) · Homologação aprovada (quando aplicável) · NCs relacionadas encerradas.
   Enquanto qualquer um pender, o item continua aberto.

**Ordem de execução atual (fundadora):** (1) fechar o eixo **Testes** dos itens implementados → (2)
continuar a auditoria funcional → (3) corrigir NCs de imediato → (4) só então homologar com documentos reais.

## Backlog / plano de execução

| ID | Funcionalidade | Estado | Cód | Test | Homol | Dependências | Evidências | Observações |
|---|---|---|:--:|:--:|:--:|---|---|---|
| F1 | Identificação padronizada (nome) | Em desenvolvimento | ✅ | ✅ | ⬜ | E1/E2 | `deriveExamIdentity` + `FUNC-exam-identification` (lista+detalhe) | derivação extraída, testada e reutilizada |
| F2 | Nomenclatura (único × painel) | Em desenvolvimento | ✅ | ✅ | ⬜ | Identidade Documental | `ARCH-002` · `FUNC-nomenclature-consistency` | regra travada; homologação = doc real |
| F3 | Laboratório + médico solicitante | Em desenvolvimento | ✅ | ✅ | ⬜ | E1 · issuer/requesting_physician | `deriveExamIdentity` + `FUNC-exam-identification` | derivação lab testada (lista+detalhe) |
| F4 | Reorganização (Exames × Pedidos) | Em desenvolvimento | ✅ | ✅ | ⬜ | — | `isOrderDocumentType` · `FUNC-exam-classification` | classificação Exame×Pedido testada; abas UI = N/A unitário |
| F5 | Fluxo de pedidos (Pedido→Agend.→Realiz.→Result.) | Em desenvolvimento | 🔄 | ✅ | ⬜ | Eventos Assistenciais | `careFlow` + `FUNC-care-flow` · "Agendar" | falta vínculo duro + stepper (adiado) |
| F6 | Política binária de estruturação | Em desenvolvimento | ✅ | ✅ | ⬜ | `regra_estruturacao_binaria` | `binaryStructuringState` · `FUNC-exam-structuring` | decisão binária extraída/testada (nunca "parcial") |
| F7 | Experiência completa de upload | Em desenvolvimento | ✅ | N/A | ⬜ | Bundle→CDU | E6 · `useDocumentBundle` | hook React stateful — teste unitário N/A (validado na homologação/uso); `imagesToPdf` é lib à parte |
| F8 | Financeiro (valor + nota fiscal) | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` | E7 · `parseAmountToCents` (`agenda/money`) · `FUNC-money` | parsing financeiro testado; fiação UI = N/A unitário |
| F9 | Recorrência e agendamento | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` · `lib/recurrence` | E8 · `FUNC-recurrence` (serialize/parse/addToDate/occurrences) | mecanismo de recorrência testado; agendar UI = N/A unitário |
| F10 | Integração ao CPE | Em desenvolvimento | ✅ | ✅ | ⬜ | UCDA · CPE | `FUNC-clinical-processing-engine` · `FUNC-laboratory-adapter` | completude por modalidade = homologação |
| F11 | Detecção/confirmação de duplicado | Em desenvolvimento | ✅ | ✅ | ⬜ | fingerprint | `FUNC-exam-duplicates` | chip + "Ver original" |
| F12 | Evolução a partir do resultado | Em desenvolvimento | ✅ | 🔄 | ⬜ | grouping | `grouping.test` (série) | link do card sem teste |
| F13 | Varredura contínua do backlog | Em desenvolvimento | 🔄 | — | — | — | este documento | processo permanente |

**Leitura honesta:** todos os itens têm **Código** ✅ (exceto F5/F13 parciais), mas **Testes** cobre só F2,
F5(estados), F10, F11 (e F12 parcial) — os demais são UI/fiação **sem automação**. **Nenhum** item tem
**Homologação** (Controle 2 em 0/8). Portanto **nenhum item está `Homologado`**; o domínio segue *em
desenvolvimento*. Fechar os ⬜ de **Testes** (onde a lógica for extraível) é trabalho de execução corrente.

## Registro de Não-Conformidades (NC)

| NC | Descrição | Origem | Sev. | Item F | Evidência (verificável) | Estado |
|---|---|---|---|---|---|---|
| NC-01 | Detalhe do exame não exibia laboratório nem solicitante | Revisão funcional (Fundadora) | média | F3 (F1) | commit `a2f80e8` · `deriveExamIdentity` · `FUNC-exam-identification` | ✅ encerrada |
| NC-02 | Aba Pedidos mostrava caixa/explicação de upload de *resultados* (copy + ômica) | Auditoria / UX | baixa | F4 | commit `8355009` | ✅ encerrada |
| NC-03 | Falha de upload exibia mensagem TÉCNICA crua ao usuário (`[insert] 23505…`) | Auditoria funcional | baixa | F7 | commit `95f3d3f` · msg amigável + `console.error` | ✅ encerrada |

_Origens possíveis: Revisão funcional · Revisão de UX · Homologação · Certificação · Documento CRC · Teste
automatizado · Feedback de usuário._

## Auditoria Funcional por JORNADAS (fundadora 15/07)
A auditoria é por **jornadas completas do usuário** (início→fim), não por telas/componentes. Estados:
`Não auditada` · `Em auditoria` · `Auditada` · `Homologada`. **Encerra** quando: todas `Auditada` · nenhuma
NC aberta **crítica/alta** · NCs média/baixa tratadas ou justificadas. Só então → homologação com docs reais.

| # | Jornada | Estado | NCs | Evidência / observações |
|---|---|---|---|---|
| J1 | Upload de exame | Auditada | NC-03 (encerrada) | auto-análise em `pending` ok; erro amigável; limite 50MB/MIME |
| J2 | Upload de pedido/solicitação | Auditada | NC-02 (encerrada) | caixa/copy por aba; classificação `isOrderDocumentType` |
| J3 | Documento com um único exame | Auditada | — | render de biomarcadores agrupados; nome = exame único |
| J4 | Documento com múltiplos exames (segmentação) | Auditada | — | irmãos criados `pending` rotulados "— parte X/N"; auto-análise por CDU |
| J5 | Exames laboratoriais | Auditada | — | lista de biomarcadores agrupada por material/painel; referência/interpretação |
| J6 | Exames de imagem | Auditada | — | `document_only` → "Documento disponível" + Ver original (sem estado quebrado) |
| J7 | Exames qualitativos | Auditada | — | `value_text` renderizado; nunca vira dado numérico; document_only tratado |
| J8 | Duplicidade de exames | Auditada | — | detecção testada; caso mesmo `createdAt` = 1 marcado (estável, sem falha) |
| J9 | Financeiro do exame | Auditada | — | "Registrar custo/NF"; data obrigatória (save bloqueado); NF visível |
| J10 | Agendamento e recorrência | Auditada | — | AgendarModal (recorrência testada; save bloqueado sem data) |
| J11 | Evolução longitudinal | Auditada | — | link numérico→`/saude/[slug]`; série filtra numéricos |
| J12 | Notificações relacionadas ao exame | Auditada | — | evento do exame notifica por categoria (NOTIF-001); push adiado |
| J13 | Exclusão e restauração | Auditada | — | exclusão via API + erro amigável; **restauração N/A** (exclusão definitiva por design) |

**Nota de honestidade:** `Auditada` = caminho funcional **verificado por leitura de código** (jornada tracejada
início→fim, sem estado quebrado). `Homologada` = validada com **documento real** (Controle 2). Nenhuma jornada
está `Homologada` ainda.

**Severidade das NCs:** `crítica` (bloqueia uso / perda de dado) · `alta` (fluxo quebrado) · `média` (UX
confusa, sem bloquear) · `baixa` (cosmético). Encerrar auditoria exige zero crítica/alta aberta.
**Auditoria funcional (código): todas as 13 jornadas `Auditada`, 1 NC (NC-03, baixa) encerrada, 0 aberta.**
Próximo passo do domínio: **homologação com documentos reais** (matriz 0/8).

## Processo de AUDITORIA CONTÍNUA
Achou lacuna → **(1)** registra a NC (com Origem) → **(2)** corrige de imediato quando possível → **(3)**
atualiza este backlog → **(4)** retoma a fila. Não abrir novas frentes arquiteturais; o ganho vem de fechar
cada domínio até os 3 critérios.

## Adiados (não retornam à fila antes de encerrar Exames)
stepper visual do fluxo · Care Space · push notifications · demais funcionalidades de fases posteriores.
