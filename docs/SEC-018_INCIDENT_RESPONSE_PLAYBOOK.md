# SEC-018 — Incident Response (IR) Playbook · v0.1 (rascunho para revisão)

> **Estado:** E1 → E2 (documento). Playbook de resposta a incidentes de segurança/privacidade da SINTERA.
> **Escopo do Lote S0-A:** documentação. **Não** substitui exercício (tabletop) nem define infraestrutura de
> detecção (SIEM = SEC-010, gate S3). Owners marcados **TBD** dependem de definição organizacional.
> **Gate de origem:** S3 (assurance). Este rascunho antecipa o artefato documental de forma autônoma.

## 1. Objetivo e princípios
Responder a incidentes de segurança e de dados pessoais (LGPD) de forma rápida, proporcional e auditável,
minimizando impacto ao titular e cumprindo obrigações regulatórias. Princípios: contenção antes de erradicação;
preservar evidência; comunicar cedo; decidir por severidade; registrar tudo.

## 2. Papéis (RACI — TBD nominal)
| Papel | Responsabilidade | Owner |
|---|---|---|
| Incident Commander (IC) | coordena a resposta, decide severidade e comunicação | TBD |
| Tech Lead | investigação técnica, contenção, erradicação | TBD |
| DPO/Privacidade | avaliação LGPD, notificação ANPD/titular | TBD |
| Comms | comunicação interna/externa | TBD |
| Scribe | linha do tempo e evidências | TBD |

## 3. Severidade
| Nível | Critério | Alvo de resposta |
|---|---|---|
| **SEV-1** | dado clínico/pessoal exposto ou exfiltrado; indisponibilidade total | IC imediato; contenção < 1h |
| **SEV-2** | acesso indevido contido; risco elevado sem exposição confirmada | < 4h |
| **SEV-3** | vulnerabilidade explorável sem incidente ativo | < 1 dia útil |
| **SEV-4** | evento informativo/near-miss | backlog priorizado |

## 4. Fluxo (detecção → contenção → erradicação → recuperação → lições)
1. **Detecção/triagem:** origem (alerta, relato, CI/secret-scan, cliente). Abrir registro (data/hora, quem, o quê).
2. **Classificação:** severidade + se há dado pessoal envolvido (aciona §6 LGPD).
3. **Contenção:** revogar credenciais/sessões afetadas; isolar componente; desativar chave/segredo comprometido
   (rotação — SEC-007); bloquear egress suspeito (SEC-008). **Preservar evidência antes de destruir estado.**
4. **Erradicação:** remover causa-raiz (patch, correção de config, revisão de acesso).
5. **Recuperação:** restaurar de backup verificado (SEC-019); validar integridade; monitorar reincidência.
6. **Pós-incidente:** post-mortem sem culpa em ≤ 5 dias úteis; ações corretivas com owner e prazo; atualizar este
   playbook e o RISK_REGISTER.

## 5. Preservação de evidência
Linha do tempo imutável; cópias de logs relevantes (quando SEC-009/010 existirem); hashes; quem acessou o quê.
Não alterar sistemas afetados antes de coletar evidência, salvo para conter dano ativo.

## 6. Vertente LGPD (dado pessoal/sensível de saúde)
- Avaliar se houve incidente com dado pessoal que possa acarretar risco/dano ao titular.
- **DPO decide** sobre comunicação à **ANPD** e aos **titulares** em prazo razoável (referência ANPD), com:
  natureza dos dados, titulares afetados, medidas técnicas, riscos e medidas mitigadoras.
- Registrar a decisão e a justificativa (mesmo quando a conclusão for "não notificável").

## 7. Comunicação
Interno: canal dedicado de incidente. Externo: só via Comms/DPO. Uma fonte de verdade (o registro do incidente).

## 8. Tabletop (pendente — S3)
Exercício simulado mínimo 1×/ano (cenários: vazamento de chave service_role; IDOR; exfiltração via egress de IA).
**Ainda não executado** — agendar no gate S3. Registrar resultado como evidência E3→E4.

## 9. Limitações / residual
- Detecção automatizada (SIEM/alertas) = **SEC-010**, gate S3.
- Contatos/owners **TBD** (decisão organizacional).
- Tabletop não executado (E-doc apenas).
