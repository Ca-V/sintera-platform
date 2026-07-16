# COMPLIANCE-001 — Fase 0: Compliance & Platform Governance (trilha paralela oficial)

> **Decisão da fundadora (parecer de Adequação Regulatória, 15/07/2026):** a conformidade é um
> **requisito ESTRUTURAL do produto**, não uma camada final nem documentação jurídica separada.
> A Fase 0 é uma **trilha OFICIAL e PARALELA** da roadmap: executada ao lado de Exames (sem pausá-lo),
> com **backlog próprio, critérios de aceite próprios e entregáveis próprios**. Requisito da Fase 0 que
> impacte um desenvolvimento em andamento é **incorporado antes da conclusão** daquela funcionalidade
> (não acumula dívida de compliance).
>
> Processo: `docs/LIFECYCLE_DOMINIOS.md` · Segurança: `docs/SEC-001_PROJETO_SHIELD.md` ·
> Princípios clínicos: `docs/GOVERNANCA.md` · Painel: `docs/DOMINIOS.md` (prefixo **`COMP`**).

## Regra constitucional — Definition of Done da plataforma
**Nenhuma funcionalidade é considerada `Done` sem aprovação no GATE DE CONFORMIDADE.** A conformidade
entra na definição de concluído de TODA a plataforma:
```
Implementação → Testes → Review → GATE DE CONFORMIDADE → Merge/Homologação
```
O Gate de Conformidade **absorve e amplia** o Gate Regulatório do Lifecycle (que já cobria RDC 657/LGPD/
rastreabilidade/auditabilidade/reprodutibilidade/original preservado) e acrescenta segurança, autorização,
auditoria e interoperabilidade.

## GATE DE CONFORMIDADE — checklist obrigatório (item 12: os 8 impactos)
Antes de aprovar qualquer funcionalidade nova, verificar e registrar:
- [ ] **LGPD / Privacidade** — dado pessoal/sensível tratado com base legal, minimização, retenção definida?
- [ ] **Segurança** — dados em repouso/trânsito protegidos; segredos fora do código; sem nova superfície de ataque?
- [ ] **Autorização** — a ação exige perfil explícito? Respeita o modelo formal de acesso (perfis)?
- [ ] **Auditoria** — operação relevante gera trilha imutável (quem·quando·o quê·dispositivo)?
- [ ] **Interoperabilidade** — o modelo interno evita decisões que dificultem FHIR/LOINC/SNOMED/UCUM?
- [ ] **Impacto regulatório** — permanece FORA de SaMD (não interpreta/diagnostica/prognostica/prescreve)?
- [ ] **Arquitetura** — desacoplamento/CPE/UCDA/Modelo Aberto/camadas preservados?
- [ ] **Rastreabilidade** — origem/autoria íntegras; documento original sempre acessível?

Falha em qualquer item → **NC** (Tipo: Regulatória/Segurança/Dados/…) → volta à implementação antes do `Done`.

## Backlog estrutural (os 12 blocos do parecer)
Estado: ✅ existente · 🟡 parcial · ⬜ pendente. Dependência: **A** autônomo (código/registro) ·
**F** decisão da fundadora · **I** infra/produção · **J** jurídico/externo.

| ID | Bloco | Estado | Dep. | Nota de estado |
|---|---|:--:|:--:|---|
| COMP-01 | **Governança de Dados (LGPD)** — classificação, sensíveis, ROPA, retenção/descarte, anonimização, export/exclusão, consentimentos, DPIA | 🟡 | A+J | RLS + dado sensível protegido existem; falta inventário/ROPA/retenção formal; export/exclusão do usuário = código (A); ROPA/DPIA/consentimentos = J |
| COMP-02 | **Segurança da Informação** — AES-256, TLS 1.3, cripto de backup, rotação de chaves, segregação de ambientes, segredos, restauração de backup, DR, RPO/RTO | 🟡 | I+F | AES-256 em repouso + TLS já providos (Supabase/Vercel); rotação/DR/RPO-RTO/segregação/segredos = infra/produção |
| COMP-03 | **Controle de Acesso** — modelo formal de autorização; perfis: paciente·profissional·admin·suporte·laboratório·auditor; ação com autorização explícita | ⬜ | F+A | RLS é a base; modelo de 6 perfis = design de produto+arquitetura (F), depois implementação (A) |
| COMP-04 | **Auditoria** — trilha IMUTÁVEL de login/logout/visualização/download/compartilhamento/revogação/upload/alteração cadastral/permissões; logs não editáveis | ⬜ | A+I | Logs técnicos parciais existem (`ai_processing_log`, telemetria); trilha de ações do usuário append-only = novo (A); imutabilidade forte = infra (I) |
| COMP-05 | **Compartilhamento Seguro** — links temporários, expiração, revogação imediata, log de acessos, senha opcional, data/hora/dispositivo | 🟡 | A | REL-001 já compartilha por token; falta expiração/revogação/log de acesso/senha — majoritariamente código |
| COMP-06 | **Arquitetura Clínica** — não interpreta/diagnostica/prognostica/prescreve; só armazena·organiza·indexa·correlaciona·disponibiliza·compartilha; original sempre acessível | ✅ | A | Já constitucional (`GOVERNANCA.md`, RDC 657); formalizar como invariante do Gate |
| COMP-07 | **Interoperabilidade** — prontidão FHIR/LOINC/SNOMED/UCUM; modelos internos não bloqueiam evolução | 🟡 | A+J | UCDA + Modelo Aberto já miram códigos abertos (LOINC/SNOMED); mapeamento FHIR = futuro; SNOMED = licença (J) |
| COMP-08 | **Documentação Técnica** — Política de Seg./Privacidade/Compartilhamento/Backup, Plano de Resposta a Incidentes, Continuidade, Inventário de Dados, Matriz de Permissões, Modelo de Governança | ⬜ | A+J | Técnicas (backup/incidente/inventário/matriz) = rascunháveis por mim (A); jurídicas (privacidade) = J |
| COMP-09 | **Secure SDLC** — review obrigatório, SAST, dependências vulneráveis, testes de autz/autn/acesso, evidências | 🟡 | A | Review (esta auditoria) + TSC/ESLint + suíte existem; falta SAST, `npm audit` no CI, testes de autorização formais |
| COMP-10 | **Infraestrutura** — segregação, monitoramento, alertas, alta disponibilidade, redundância, backup geo-separado, observabilidade | 🟡 | I | Vercel/Supabase dão HA/redundância/backup parciais; monitoramento/alertas/geo-separação/observabilidade plena = infra |
| COMP-11 | **Conformidade Regulatória (processo SaMD)** — revisão prévia de toda funcionalidade quanto ao enquadramento; manter fora de SaMD (estratégia atual) ou abrir projeto de adequação | 🟡 | A+F | Estratégia não-SaMD já é constitucional; falta o PROCESSO formal de revisão prévia = embutido no Gate (A) |
| COMP-12 | **Critérios Arquiteturais Obrigatórios** — os 8 impactos avaliados antes de aprovar qualquer funcionalidade | ✅ | A | = o **Gate de Conformidade** acima; passa a ser Definition of Done |

## Entregáveis da Fase 0 (item 8) — checklist
⬜ Política de Segurança da Informação · ⬜ Política de Privacidade (J) · ⬜ Política de Compartilhamento ·
⬜ Política de Backup · ⬜ Plano de Resposta a Incidentes · ⬜ Plano de Continuidade de Negócios ·
⬜ Inventário de Dados · ⬜ Matriz de Permissões · ⬜ Modelo de Governança de Dados.

## Critério de encerramento da Fase 0
Fase 0 **não bloqueia** Exames, mas só é `Encerrada` quando: COMP-01…12 em ✅ ou 🟡-justificado com plano,
os entregáveis do item 8 emitidos, e o Gate de Conformidade operante como Definition of Done em todo domínio.

## Estado global
**Em andamento (trilha paralela recém-aberta).** Gate de Conformidade **ativo a partir de agora** como
Definition of Done. Próximos passos autônomos (sem depender da fundadora): COMP-05 (expiração/revogação/log
de compartilhamento), COMP-04 (trilha de auditoria append-only), COMP-01 (export/exclusão + inventário),
COMP-09 (SAST/`npm audit`/testes de autorização), COMP-08 (rascunhos técnicos). Itens **I/F/J** aguardam
decisão/recurso/jurídico e ficam sinalizados.
