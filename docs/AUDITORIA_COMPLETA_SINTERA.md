# Auditoria Completa da SINTERA — Plano da Iniciativa

> Frente **dedicada**, aberta **somente após o encerramento da REL-001**. Escopo próprio,
> sem misturar com entregas de desenvolvimento. Aprovado pela fundadora (2026-07-08).
> Não é "auditoria só técnica/funcional" — é **auditoria completa de produto**.

## Modelo em 3 camadas (responsabilidades separadas)

### Camada 1 — Auditoria técnica (**Claude**)
Vantagem: integrado ao código + testes automatizados. Cobre:
bugs · regressões · consistência técnica e entre componentes · **Design System** · fluxo de
navegação · responsividade (desktop/mobile) · performance · **acessibilidade** · **regulatório
(RDC 657)** · código · arquitetura · componentes · QA automatizado (harness QA-001).

### Camada 2 — Auditoria de produto (**ChatGPT / fundadora**)
Foco: **não** é achar bugs. É responder continuamente:
> *"Se eu fosse um usuário usando a SINTERA pela 1ª vez, esta tela comunica valor?"*
> *"Esta decisão aproxima ou afasta a SINTERA de ser a melhor plataforma de organização e
> continuidade das informações de saúde?"*

Cobre: cada tela · fluxo · texto · botão · decisão de UX · coerência da plataforma · clareza ·
proposta de valor · percepção premium · retenção · facilidade de uso · redução de carga cognitiva ·
arquitetura de informação · posicionamento · oportunidades de simplificação · funcionalidades
desnecessárias/redundantes/mal posicionadas · visão estratégica de produto.

### Camada 3 — Consolidação (única)
Depois das duas auditorias: **eliminar duplicidades** · consolidar todos os achados num **backlog
único** · classificar cada item por **criticidade × impacto × esforço × prioridade no roadmap** ·
definir o que entra no **próximo lote**.

## Escopo completo (ampliado)
arquitetura · código · UX · UI · Design System · consistência entre módulos · regulatório ·
performance · acessibilidade · microcopy · **proposta de valor de cada tela** · posicionamento do
produto · percepção de qualidade · simplicidade · **continuidade do cuidado** · **compartilhamento
das informações** · retenção de usuários · coerência da plataforma como um todo.

*Diferencial da SINTERA não é só ter poucos bugs — é transmitir imediatamente que organiza toda a
vida de saúde, reduz trabalho manual, facilita consultas, melhora a continuidade do cuidado e torna
o compartilhamento simples. Isso se constrói por dezenas de pequenas decisões de UX/posicionamento.*

## Execução
- **Pré-requisito:** REL-001 encerrada (merge + estabilização em produção).
- Iniciativa própria, **organizada por lotes** (como o CAP-001).
- Ponto de partida: os 3 achados já registrados em [[BACKLOG_AUDITORIA]] entram na consolidação.
- Não implementar achados fora do lote corrente (disciplina de escopo — ver [[PROCESSO_HOMOLOGACAO]]).
