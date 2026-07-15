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

## Backlog / plano de execução

| ID | Funcionalidade | Estado | Cód | Test | Homol | Dependências | Evidências | Observações |
|---|---|---|:--:|:--:|:--:|---|---|---|
| F1 | Identificação padronizada (nome) | Em desenvolvimento | ✅ | ⬜ | ⬜ | E1/E2 | card lista + detalhe | falta teste da derivação do nome |
| F2 | Nomenclatura (único × painel) | Em desenvolvimento | ✅ | ✅ | ⬜ | Identidade Documental | `ARCH-002` · `FUNC-nomenclature-consistency` | regra travada; homologação = doc real |
| F3 | Laboratório + médico solicitante | Em desenvolvimento | ✅ | ⬜ | ⬜ | E1 · issuer/requesting_physician | lista + detalhe | derivação lab/solicitante sem teste |
| F4 | Reorganização (Exames × Pedidos) | Em desenvolvimento | ✅ | ⬜ | ⬜ | — | abas + ação contextual + caixa por aba | UI sem teste automatizado |
| F5 | Fluxo de pedidos (Pedido→Agend.→Realiz.→Result.) | Em desenvolvimento | 🔄 | ✅ | ⬜ | Eventos Assistenciais | `careFlow` + `FUNC-care-flow` · "Agendar" | falta vínculo duro + stepper (adiado) |
| F6 | Política binária de estruturação | Em desenvolvimento | ✅ | ⬜ | ⬜ | `regra_estruturacao_binaria` | E3 (selo/badge binários) | falta teste do selo binário |
| F7 | Experiência completa de upload | Em desenvolvimento | ✅ | ⬜ | ⬜ | Bundle→CDU | E6 · `useDocumentBundle` | primitivo sem teste unitário |
| F8 | Financeiro (valor + nota fiscal) | Em desenvolvimento | ✅ | ⬜ | ⬜ | `health_events` | E7 ("Registrar custo / NF") | fiação sem teste |
| F9 | Recorrência e agendamento | Em desenvolvimento | ✅ | ⬜ | ⬜ | `health_events` | E8 (AgendarModal) | fiação sem teste |
| F10 | Integração ao CPE | Em desenvolvimento | ✅ | ✅ | ⬜ | UCDA · CPE | `FUNC-clinical-processing-engine` · `FUNC-laboratory-adapter` | completude por modalidade = homologação |
| F11 | Detecção/confirmação de duplicado | Em desenvolvimento | ✅ | ✅ | ⬜ | fingerprint | `FUNC-exam-duplicates` | chip + "Ver original" |
| F12 | Evolução a partir do resultado | Em desenvolvimento | ✅ | 🔄 | ⬜ | grouping | `grouping.test` (série) | link do card sem teste |
| F13 | Varredura contínua do backlog | Em desenvolvimento | 🔄 | — | — | — | este documento | processo permanente |

**Leitura honesta:** todos os itens têm **Código** ✅ (exceto F5/F13 parciais), mas **Testes** cobre só F2,
F5(estados), F10, F11 (e F12 parcial) — os demais são UI/fiação **sem automação**. **Nenhum** item tem
**Homologação** (Controle 2 em 0/8). Portanto **nenhum item está `Homologado`**; o domínio segue *em
desenvolvimento*. Fechar os ⬜ de **Testes** (onde a lógica for extraível) é trabalho de execução corrente.

## Registro de Não-Conformidades (NC)

| NC | Descrição | Origem da descoberta | Ação | Estado |
|---|---|---|---|---|
| NC-01 | Detalhe do exame não exibia laboratório nem solicitante | Revisão funcional (Fundadora) | Query + exibição padronizada no detalhe | ✅ corrigida |
| NC-02 | Aba Pedidos mostrava caixa/explicação de upload de *resultados* (copy + ômica) | Auditoria contínua / Revisão de UX | Copy e explicação contextuais por aba | ✅ corrigida |

_Origens possíveis: Revisão funcional · Revisão de UX · Homologação · Certificação · Documento CRC · Teste
automatizado · Feedback de usuário._

## Processo de AUDITORIA CONTÍNUA
Achou lacuna → **(1)** registra a NC (com Origem) → **(2)** corrige de imediato quando possível → **(3)**
atualiza este backlog → **(4)** retoma a fila. Não abrir novas frentes arquiteturais; o ganho vem de fechar
cada domínio até os 3 critérios.

## Adiados (não retornam à fila antes de encerrar Exames)
stepper visual do fluxo · Care Space · push notifications · demais funcionalidades de fases posteriores.
