# AUD-001 — Auditoria Integral da Plataforma SINTERA

> Iniciativa **independente e exclusiva**, aprovada pela fundadora (2026-07-08). **Não** é
> continuação da REL-001 nem do CAP-001. Enquanto ativa, é a **única frente**. Não mistura
> implementação de funcionalidades. Herda o modelo de 3 camadas de [[AUDITORIA_COMPLETA_SINTERA]].

## Baseline congelada

| | |
|---|---|
| Versão | **SINTERA v1 — Baseline de Auditoria** |
| Tag git | `sintera-v1-baseline` → commit `464145f` |
| Produção | `sinteramais.com.br` (2026-07-08) |
| Regra | A `main`/produção **não recebe alterações** durante a AUD-001 (exceto bug crítico/regulatório). Todo trabalho da auditoria fica na branch `aud-001`. |

Esta é a **referência única** contra a qual toda recomendação é comparada — evita discutir
problemas que já não existem ou não reproduzir um comportamento observado.

## Objetivo — auditoria de PRODUTO (não de QA)

Não é encontrar bugs. É responder:

> **"Se lançássemos a SINTERA comercialmente hoje, o que impediria esta plataforma de ser
> percebida como um produto excelente?"**

## Filtro central (toda recomendação passa por aqui)

> **"Esta mudança aumenta a percepção de que a SINTERA é a melhor plataforma para organização,
> continuidade e compartilhamento das informações de saúde?"**

Se a resposta for **negativa**, a recomendação **não segue adiante**.

## Estrutura — por BLOCOS (transversal), não por módulos
Ver blocos revela **padrões transversais**, não problemas isolados de um módulo.

| Bloco | Foco | Superfícies |
|---|---|---|
| **1 · Primeira impressão** | O que a pessoa sente nos primeiros segundos | Home · Dashboard · Navegação · Onboarding |
| **2 · Cadastro de informações** | Registrar é fácil, rápido, sem trabalho manual? | Exames · Medicamentos · Recursos · Medidas · Sinais · Condições · Hábitos · Ciclo · Agenda |
| **3 · Consulta das informações** | Encontrar, acompanhar e compartilhar | Histórico · Timeline · Relatórios · Compartilhamento |
| **4 · Comunicação** | A plataforma "fala" bem? | Textos · títulos · microcopy · empty states · disclaimers |
| **5 · Produto** | Percepção de valor e permanência | Percepção de valor · retenção · diferenciais · posicionamento · coerência |

## Responsabilidades (3 camadas — [[AUDITORIA_COMPLETA_SINTERA]])
- **Camada 1 — técnica (Claude):** integrado ao código + QA automatizado; bugs, regressões, DS,
  responsividade, performance, acessibilidade, regulatório, arquitetura, componentes.
- **Camada 2 — produto (ChatGPT/fundadora):** UX, valor por tela, comunicação, posicionamento,
  percepção premium, retenção, carga cognitiva, coerência, simplificação.
- **Camada 3 — consolidação:** dedupe + **backlog único** priorizado por **criticidade × impacto ×
  esforço × prioridade no roadmap**; define o próximo lote.

## Regras de execução
- **Nenhuma melhoria é implementada durante a AUD-001** — exceto **bug crítico** ou **questão
  regulatória** (RDC 657). Todo o restante é **consolidado, priorizado e organizado** no backlog
  para implementação posterior.
- Cada bloco produz achados com: **descrição · evidência · impacto no filtro central · esforço estimado**.
- Achados iniciais da 1ª varredura ([[BACKLOG_AUDITORIA]]) entram na consolidação.
