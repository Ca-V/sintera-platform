# ROADMAP — Conclusão da Plataforma (por VERSÕES)

**Status:** ativo (fundadora 19/07/2026). Encerrada a fase de nav/taxonomia/comunicação. A partir daqui,
**cada ciclo = uma nova VERSÃO da SINTERA**, com uma transformação clara. Sob [[ADR-000]].

## Princípios da fase
1. **Arquitetura orientada pelo produto:** 1º domínios de negócio → 2º observar padrões → 3º só então consolidar infra.
2. **Sem abstração antecipada:** infra nova só com **≥ 2–3 casos reais** que a justifiquem.
3. **Priorização por VALOR PERCEBIDO + dependência técnica.** Não basta perguntar "o que depende do quê"; pergunta-se
   também **"qual entrega faz a SINTERA parecer muito mais completa para quem a usa?"** — e valor entregue ao usuário
   vem **antes** de refinamentos internos.
4. Cada versão só é considerada **concluída** (pelos critérios objetivos abaixo) antes de iniciar a próxima.

A curva de valor: a SINTERA já é forte em **organizar** informação → fortalecer a **geração automática** de informação
→ depois a **inteligência longitudinal** → depois a **colaboração** → por fim a **operação/comercial**.

---

## Versão 1 — Plataforma consolidada de organização da saúde
**Objetivo:** fechar tudo que já está próximo da conclusão, elevando imediatamente a qualidade percebida da organização.
**Entregas:**
- **Relatório #3** — expor "Histórico de Saúde" (eventos passados) e "Histórico de Exames" (evolução dos resultados)
  no relatório, com a distinção clara Exames×Histórico de Exames e Agenda×Histórico de Saúde (espelho da navegação).
- **Composição Corporal** — painel de acompanhamento de peso (GLP-1); bioimpedância (classificação + fiação de
  `body_metrics` com origem/rastreabilidade); resolver as métricas duplicadas.

**Critérios objetivos de conclusão:** relatório cobre 100% dos domínios da navegação; bioimpedância rastreável até o
laudo; TSC + suíte + build verdes; Gate de Conformidade.
**Impacto ao usuário:** a organização parece "inteira" — o relatório fica completo e fiel; a composição ganha
profundidade e origem.
**Dependência p/ a próxima:** a montagem do relatório e o `body_metrics` ficam prontos para serem alimentados/consumidos
nas versões seguintes.

## Versão 2 — Plataforma integrada com captura automática de dados
**Objetivo:** a SINTERA deixa de depender só do registro manual e passa a **construir automaticamente a jornada** — salto
enorme de valor percebido.
**Entregas:** **HIP-001** (connector layer vendor/domain-neutral — a única infra nova, justificada por ≥2 consumidores:
wearables agora, FHIR/RNDS/labs no roadmap); **WEA-001** (1º conector — wearables); **sincronização automática**;
**evolução do Monitoramento** (sinais vitais alimentados automaticamente → UCDA/`body_metrics`).
**Critérios objetivos de conclusão:** ≥1 conector real sincronizando dados para o Monitoramento com rastreabilidade de
origem (HIP-001→UCDA); usuário autoriza/revoga a fonte; verdes; Gate.
**Impacto ao usuário:** os dados entram sozinhos; a jornada se constrói sem esforço — "a plataforma trabalha por você".
**Dependência p/ a próxima:** o fluxo automático de dados alimenta a inteligência longitudinal.

## Versão 3 — Plataforma de acompanhamento longitudinal inteligente
**Objetivo:** antes de compartilhar, a plataforma deve ser **excelente em ajudar o próprio usuário a compreender sua
evolução**.
**Entregas:** indicadores; tendências; comparações temporais; acompanhamento contínuo; **alertas e insights baseados no
histórico** — sempre **factuais e não-diagnósticos** (RDC 657: organiza padrões, o usuário conclui). Reutiliza o
`body_metrics` + os dados automáticos da Versão 2.
**Critérios objetivos de conclusão:** o usuário vê tendências/comparações ao longo do tempo em ≥2 domínios (ex.:
biomarcadores + composição/sinais); insights rastreáveis à origem; **zero** framing de diagnóstico/tratamento; verdes; Gate.
**Impacto ao usuário:** compreende a própria evolução — a plataforma o ajuda a **enxergar padrões sem interpretar
clinicamente**.
**Dependência p/ a próxima:** a riqueza longitudinal torna o compartilhamento (V4) muito mais valioso.

## Versão 4 — Plataforma colaborativa entre paciente e profissional
**Objetivo:** abrir o cuidado colaborativo — o profissional autorizado acessa uma plataforma **já rica em dados e
acompanhamento**.
**Entregas:** **CARE-001** (Espaço de Cuidado); **SHR-001** (compartilhamento estruturado); **permissões**; **governança
de acesso** (Rede de Cuidado — profissionais/familiares/auditoria/LGPD). Permissões construídas **uma vez** e reutilizadas
por SHR e CARE; SHR reutiliza a montagem do Relatório (V1).
**Critérios objetivos de conclusão:** profissional autorizado acessa um snapshot/estrutura do paciente com permissões
granulares e auditoria; paciente autoriza/revoga; conformidade LGPD; verdes; Gate.
**Impacto ao usuário:** leva o cuidado além do app — continuidade com quem cuida da pessoa.
**Dependência p/ a próxima:** base colaborativa madura habilita operação/comercialização.

## Versão 5 — Plataforma pronta para escala comercial
**Objetivo:** prontidão de produção e comercial.
**Entregas:** **NOTIF-001 provedor real** (notificações em produção); **BILLING-001** (assinaturas/entitlements);
integrações comerciais; funcionalidades de operação/observabilidade.
**Critérios objetivos de conclusão:** notificações reais por canal; billing/entitlements funcionando; operação observável;
verdes; Gate + Projeto Shield (segurança) + runbook OPS.
**Impacto ao usuário:** experiência confiável em escala, com planos/assinatura.
**Dependência p/ a próxima:** —

---

## Transversais / quando o contexto amadurecer (evitar abstração antecipada)
- **Planejamento** (domínio estratégico de ações futuras) — consolidar o guarda-chuva quando os subdomínios repetirem
  (contracepção + exames periódicos + consultas ≈ 2–3 casos → reavaliar após a V1/V3).
- **Exames — conclusão** (imagem, qualitativos, multi-exame, homologação) — interpolar conforme necessidade clínica.
- **Modalidades** (Pentacam etc.) — após a plataforma consolidada.

## Melhorias arquiteturais ADIÁVEIS (até os domínios estabilizarem)
Catálogo único de navegação (adiado); qualquer infra sem ≥2–3 consumidores; generalização do Planejamento; unificação de
eventos legado (`agenda_events`) × canônico (`health_events`).

## Processo (permanente, todas as versões)
**Planejar → Aprovar → Implementar → Validar → Encerrar → Próxima versão.** Uma **versão por vez**; nenhuma
funcionalidade de versão futura contamina a atual. Cada decisão de arquitetura é tomada **em função da versão que
estamos construindo**, priorizando valor ao usuário antes de refinamentos internos.

**Toda versão responde 4 PERGUNTAS:** (1) Qual problema do usuário resolvemos? (2) Qual transformação esta versão
entrega? (3) Como saberemos que foi concluída? (4) Por que precisa existir antes da próxima?

**Todo plano de versão tem 6 campos:** objetivo · entregas · dependências · riscos (téc + UX) · critérios objetivos de
conclusão · **CRITÉRIO DE SUCESSO** (o objetivo maior da versão — toda decisão se mede por "isso aproxima ou afasta
desse resultado?"). Entregar sempre **experiências completas** ao usuário, não meio-módulos.

Ao fim de cada versão: critério de sucesso + critérios objetivos atingidos · verificação verde (TSC+suíte+build) · Gate
de Conformidade · reavaliação de quais abstrações já se justificam. Plano detalhado da V1: [[V1_PLANO_EXECUCAO]].

**ENCERRAMENTO DE VERSÃO (padrão definitivo, fundadora 19/07).** Além da validação técnica contínua, toda versão
termina com:
1. **Validação de EXPERIÊNCIA** (olhar de produto, percorrendo como usuário): a transformação ficou evidente? há ponto
   inconsistente na jornada? alguma tela com linguagem destoante? oportunidade simples de simplificar? algum detalhe
   visual/UX que reduza a percepção de qualidade?
2. **Checklist de encerramento:** ☐ critério de sucesso atingido · ☐ nenhuma inconsistência de navegação · ☐ linguagem
   consistente · ☐ fluxos completos do ponto de vista do usuário · ☐ débitos técnicos documentados · ☐ melhorias
   deliberadamente adiadas registradas para a próxima versão.
3. **Changelog de PRODUTO** ("O que mudou para o usuário") — além do changelog técnico; legível por qualquer pessoa.
4. **CONGELAMENTO:** após a validação, a versão congela — **apenas correção de defeitos**; nenhuma nova funcionalidade,
   nenhuma melhoria oportunista, nenhuma refatoração sem necessidade. Evita a versão eterna "quase pronta".

Só então inicia-se a próxima versão — repetindo o ciclo completo de planejamento antes de qualquer código.
