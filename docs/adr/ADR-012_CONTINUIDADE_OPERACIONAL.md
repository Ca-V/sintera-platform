# ADR-012 — Continuidade Operacional (transferibilidade como princípio)

**Status:** Accepted · **Architectural Baseline** · 2026-07-22 · **Ref:** [[ADR-000]] (constituição) · [[ADR-001]] (SSOT) · [[GOV-001]] (coverage matrix) · GOV-002 (onboarding/handover)

## Contexto
O projeto SINTERA foi construído, até aqui, priorizando **qualidade técnica**. Está definido que, em breve, ele
será **transferido para outra equipe de desenvolvimento**. A partir deste momento, além da qualidade, o projeto
precisa garantir **transferibilidade**: um novo profissional deve conseguir compreender, executar e evoluir o
sistema **sem depender de conhecimento implícito, contexto pessoal ou memória do desenvolvedor atual** (inclui a
memória privada de assistentes como o Claude — que é contexto do dev atual, não artefato do projeto).

## Decisão
**Continuidade Operacional** passa a ser um **princípio de governança permanente**, com a **mesma prioridade** dos
demais princípios estruturais ([[ADR-000]], DS-002, API-First/[[ADR-003]], SSOT/[[ADR-001]], rastreabilidade,
governança). Toda decisão técnica, arquitetural e de implementação deve considerá-lo.

**Regra-mãe:** conhecimento estrutural mora no **repositório** (documentos, testes, config versionada), nunca apenas
na memória de quem implementou. Se uma decisão só existe "na cabeça" de alguém ou na memória de uma ferramenta, ela
**não está concluída**.

## Diretrizes
Toda entrega deve permitir que um novo dev assuma sem explicações adicionais. Para isso:
- toda **decisão arquitetural** relevante documentada (ADR/doc de domínio) com o **motivo**, não só a alteração;
- todo **ambiente** com documentação completa e reproduzível de provisionamento (ex.: [[MOBILE-003]]);
- toda **dependência externa** identificada; toda **configuração** reproduzível (nada de passo manual sem registro);
- todo **contrato compartilhado** com documentação **e** testes (ex.: contratos ARCH `tests/contracts/*`);
- toda **evolução** registra a **razão da decisão**, alinhada a [[ADR-001]] (SSOT — ponto único de edição/verdade).

## Evitar (anti-padrões)
Conhecimento só em memória · decisões não documentadas · config manual sem registro · scripts executados sem doc ·
dependências pessoais do ambiente do dev · "funciona só na minha máquina".

## Entregáveis por etapa (além do código)
Documentação atualizada · critérios de validação · checklist operacional · instruções de recuperação · evidências de
testes e auditorias. **Ao final de cada grande fase** (Web, Onda 0, Onda 1, …) deve existir documentação suficiente
para uma nova equipe assumir no menor tempo possível.

## Consequências
- O **README** da raiz passa a ser uma **porta de entrada real** (não boilerplate), apontando para **GOV-002 —
  Onboarding e Handover**, que consolida como entender, rodar, testar e evoluir o projeto.
- A verificação de conformidade deste princípio entra no escopo do [[GOV-001]] (Governance Coverage Matrix).
- Este princípio **não** cria duplicação: GOV-002 e os demais docs **referenciam** os documentos canônicos
  (ADR-000, DS-002, ARCH-000, etc.), nunca os copiam (ADR-001).
- Aplica-se retroativamente como **critério de aceite** de cada fase daqui em diante — começando pela conclusão do
  provisionamento Mobile e por toda a Onda 1 ([[MOBILE-001]]).
