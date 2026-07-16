# COMPLIANCE-001 — Fase 0: Compliance & Platform Governance (trilha paralela oficial)

> **Decisão da fundadora (parecer de Adequação Regulatória + acréscimos, 15/07/2026):** a conformidade é
> **requisito ESTRUTURAL do produto**, não camada final. A Fase 0 é **trilha OFICIAL e PARALELA** da roadmap
> (roda ao lado de Exames, sem pausá-lo), com **backlog, critérios de aceite e entregáveis próprios**.
> Requisito da Fase 0 que impacte um desenvolvimento em andamento é **incorporado antes de concluí-lo**.
>
> Processo: `LIFECYCLE_DOMINIOS.md` · Segurança: `SEC-001_PROJETO_SHIELD.md` · Clínico: `GOVERNANCA.md` ·
> **Modelo canônico: `DATA-001`** · **Governança de APIs: `API-001`** · Conectores: `HIP-001` ·
> Painel: `DOMINIOS.md` (prefixo **`COMP`**).

## Postura de classificação (regra de ouro)
**Conservadora e baseada em EVIDÊNCIA.** Um requisito só é `✅` com **evidência técnica verificável** (teste,
migration, config, captura, ADR, PR) — nunca por intenção de projeto. Recurso oferecido pela infra ≠ requisito
concluído: depende de **como a aplicação está configurada e opera**. Sem evidência → no máximo `🟡 parcial`.

## Definition of Done + GATE EM DUAS PARTES
**Nenhuma funcionalidade é `Done` sem passar pelo Compliance Review.** Responsabilidade delimitada:
```
Implementação → Testes → REVIEW TÉCNICO (correção/engenharia/simplificação)
                              ↓
                         COMPLIANCE REVIEW (só conformidade — 8 eixos abaixo)
                              ↓
                            Merge / Homologação
```
**Compliance Review — MATRIZ de 9 eixos** (não um checklist "passou/não passou": cada eixo tem Status +
Evidência, produzindo histórico de conformidade). Cada funcionalidade preenche:

| Eixo | Status | Evidência (exemplo) |
|---|:--:|---|
| LGPD | ✅/🟡/⬜ | COMP-01 |
| Segurança | ✅/🟡/⬜ | SEC-001 |
| Auditoria | ✅/🟡/⬜ | AUD-### / `audit.spec.ts` |
| Regulação (fora de SaMD) | ✅/🟡/⬜ | COMP-06 / COMP-11 |
| Arquitetura | ✅/🟡/⬜ | ADR-### |
| Interoperabilidade | ✅/🟡/⬜ | DATA-001 / HIP-001 |
| Ecossistema externo | ✅/🟡/⬜ | COMP-13 |
| Privacidade | ✅/🟡/⬜ | COMP-01 |
| Rastreabilidade | ✅/🟡/⬜ | AUD-### / original acessível |

Eixo em ⬜/🟡 sem evidência → **NC** ou **Exceção registrada** (§Exceções) antes do `Done`. Nunca ✅ sem evidência.

**Interoperabilidade ≠ Integração:** **interoperabilidade** é requisito PERMANENTE da arquitetura (o modelo
canônico mapeia para FHIR/LOINC/UCUM/SNOMED desde já — ver `DATA-001`); **integrações** são implementações
específicas do roadmap (conectores — `HIP-001`). A plataforma é interoperável por arquitetura, não por possuir
conectores de fornecedores X ou Y. Governança de APIs dos conectores: `API-001`.

## Origem normativa (cada COMP aponta sua fonte — propaga mudança regulatória com menor esforço)
| COMP | Bloco | Origem normativa |
|---|---|---|
| COMP-01 | Governança de Dados (LGPD) | LGPD (Lei 13.709) Art. 37/46/48/18; ANPD; ISO/IEC 27701 |
| COMP-02 | Segurança da Informação | ISO/IEC 27001 A.8.24 (cripto)/A.8.13 (backup)/A.8.24; LGPD Art. 46; NIST SP 800-57 (chaves) |
| COMP-03 | Controle de Acesso | ISO/IEC 27001 A.5.15/A.8.2/A.8.3; LGPD Art. 46/50; RBAC |
| COMP-04 | Auditoria (trilha imutável) | LGPD Art. 37; Lei 13.787 (digitalização/guarda de prontuário); ISO 27001 A.8.15/A.8.16; ISO 27701 |
| COMP-05 | Compartilhamento Seguro | LGPD Art. 46/48; ISO 27001 A.5.14; CFM (sigilo/segredo médico) |
| COMP-06 | Arquitetura Clínica (não-SaMD) | RDC 657/2022 e RDC 751/2022 (ANVISA); IMDRF SaMD; CFM 2.314/2022; Lei 12.842 (ato médico) |
| COMP-07 | Interoperabilidade | HL7 FHIR R4/R5; LOINC (Regenstrief); SNOMED CT (licença); UCUM; RNDS (MS); openEHR |
| COMP-08 | Documentação Técnica | ISO/IEC 27001 (SGSI); LGPD (governança); ANPD (boas práticas) |
| COMP-09 | Secure SDLC | OWASP ASVS/SAMM; ISO/IEC 27001 A.8.25–A.8.28; LGPD Art. 46 (security by design) |
| COMP-10 | Infraestrutura | ISO/IEC 27001 A.8.14 (redundância)/A.8.13 (backup); NIST; LGPD Art. 46 |
| COMP-11 | Conformidade Regulatória (SaMD) | RDC 657/751 (ANVISA); IMDRF SaMD Framework; Lei 6.360 |
| COMP-12 | Critérios Arquiteturais (o Gate) | Transversal; LGPD Art. 46/50 (governança/boas práticas) |
| COMP-13 | Ecossistema e Interoperabilidade Externa | HL7 FHIR; LOINC; UCUM; SNOMED CT (licença); IEEE 11073 (dispositivos); OAuth 2.0; LGPD Art. 7/8/18 (consentimento/revogação) |

## Backlog estrutural + estado
Estado: ✅ evidenciado · 🟡 parcial · ⬜ pendente. Dep.: **A** autônomo · **F** fundadora · **I** infra/produção · **J** jurídico.

| ID | Estado | Dep. | Nota (com ressalva conservadora) |
|---|:--:|:--:|---|
| COMP-01 | 🟡 | A+J | RLS + dado sensível protegido; falta inventário/ROPA/retenção/anonimização/export-exclusão/consentimentos/DPIA |
| COMP-02 | 🟡 | I+F | **parcialmente atendido** — infra Supabase/Vercel oferece AES-256 em repouso e TLS, mas SEM evidência de: (a) todos os dados relevantes efetivamente cifrados no nível da app, (b) versões/config seguras de TLS auditadas, (c) gestão/rotação de chaves. Ver Exceção EXC-02 |
| COMP-03 | ⬜ | F+A | RLS é base; modelo formal de 6 perfis = design de produto+arquitetura |
| COMP-04 | ⬜ | A+I | trilha append-only de ações do usuário = novo (autônomo); imutabilidade forte pode exigir infra |
| COMP-05 | 🟡 | A | REL-001 compartilha por token; falta expiração/revogação/log de acesso/senha |
| COMP-06 | ✅ | A | não interpreta/diagnostica (RDC 657, `GOVERNANCA.md`) + original sempre acessível (Rastreabilidade Documental). Evidência: princípio constitucional + Gate Regulatório |
| COMP-07 | 🟡 | A+J | UCDA + Modelo Aberto miram LOINC/SNOMED; mapeamento FHIR futuro; SNOMED = licença → Exceção EXC-07 |
| COMP-08 | ⬜ | A+J | técnicas rascunháveis por mim; jurídicas (privacidade) = J |
| COMP-09 | 🟡 | A | review + TSC/ESLint + suíte existem; falta SAST, `npm audit` no CI, testes de autorização formais |
| COMP-10 | 🟡 | I | HA/redundância/backup parciais (Supabase/Vercel); monitoramento/alertas/geo-backup/observabilidade plena = infra |
| COMP-11 | 🟡 | A+F | estratégia não-SaMD é constitucional; falta o PROCESSO formal de revisão prévia = embutido no Compliance Review |
| COMP-12 | ✅ | A | = o Gate em duas partes (Definition of Done). Evidência: este documento + wiring no Lifecycle |
| COMP-13 | 🟡 | A+F | **requisito ARQUITETURAL agora** (não só quando integrar): UCDA + Modelo Aberto já dão a base canônica e o pilar `HIP-001` está registrado; falta a camada de conectores, proveniência de dispositivo, consentimento granular, classificação de fonte e qualidade do dado. Prontidão = autônoma (9º eixo do Gate); conectores concretos = futuro (HIP-001) |

## Matriz de Rastreabilidade (Requisito → Fonte → Implementação → Teste → Evidência)
Preenchida à medida que cada COMP é executado; `—` = ainda não implementado.

| Requisito | Origem | Implementação | Teste | Evidência | Estado |
|---|---|---|---|---|---|
| COMP-04 | LGPD/Lei 13.787/ISO 27001 A.8.15 | AUD-### (a criar) | `audit.spec.ts` (a criar) | migration + ADR | ⬜ |
| COMP-05 | LGPD/ISO 27001 A.5.14 | REL-001 (parcial) → SHARE-### | `share.spec.ts` (a criar) | migration + captura UI | 🟡 |
| COMP-06 | RDC 657 | `GOVERNANCA.md` + Gate Regulatório | `ARCH-*`/`FUNC-*` (não-produção clínica) | doc constitucional | ✅ |
| COMP-09 | OWASP/ISO 27001 A.8.28 | CI (SAST + `npm audit`) a adicionar | pipeline | log do CI | 🟡 |
| COMP-12 | Governança | Gate no Lifecycle | — | `COMPLIANCE-001` + `LIFECYCLE_DOMINIOS.md` | ✅ |

## Critérios OBJETIVOS de aceite (verificáveis; evitar "implementado")
Regra: **todo COMP exige ≥ 1 EVIDÊNCIA** (teste automatizado · captura de UI · migration · documentação · PR · ADR).
Critérios completos são definidos quando o COMP entra em execução; abaixo, os dois próximos autônomos já especificados:

**COMP-04 — Auditoria.** ✓ toda operação relevante gera evento · ✓ evento imutável (append-only; sem UPDATE/DELETE
por RLS/trigger) · ✓ usuário identificado · ✓ timestamp em UTC · ✓ IP registrado · ✓ request id registrado ·
✓ teste automatizado · ✓ cobertura da trilha ≥ meta. **Evidência:** migration + `audit.spec.ts` + ADR.

**COMP-05 — Compartilhamento Seguro.** ✓ link temporável com expiração configurável · ✓ revogação imediata
(invalida acessos subsequentes) · ✓ todo acesso registrado (data/hora/dispositivo/IP) · ✓ senha opcional ·
✓ token não adivinhável (entropia adequada) · ✓ teste automatizado. **Evidência:** `share.spec.ts` + migration + captura UI.

## COMP-13 — Ecossistema e Interoperabilidade Externa (requisito ARQUITETURAL da Fase 0)
**Objetivo:** toda a arquitetura preparada para integração segura com dispositivos/apps de saúde e sistemas
clínicos, preservando privacidade, rastreabilidade e governança — decidido **agora**, para que escolhas atuais
não bloqueiem integrações futuras (Apple Health, Google Health Connect, Garmin, Oura, Fitbit, Whoop, Polar,
Samsung Health, Dexcom, FreeStyle Libre, Omron, APIs de laboratório, plataformas FHIR). Implementação concreta =
pilar **`HIP-001_PLATAFORMA_INTEGRACOES.md`** (futuro); aqui ficam os invariantes arquiteturais.

Invariantes (verificados pelo 9º eixo do Gate):
1. **Camada de conectores** — toda integração passa por conectores próprios: `Fonte externa → Conector →
   Normalização → Modelo Canônico SINTERA → Timeline/Exames/Indicadores`. **Nenhum fornecedor grava direto no banco.**
2. **Modelo canônico** — dado interno padronizado, independente do fabricante (FC, PA, passos, VO₂máx, glicemia,
   sono, SpO₂, temperatura, peso, composição corporal…). O banco nunca depende do formato de um fabricante.
3. **Proveniência** — cada dado registra: dispositivo · fabricante · modelo · app de origem · versão da API ·
   horário de coleta · horário de importação · método de sincronização · identificador externo.
4. **Consentimento granular** — o usuário autoriza cada integração separadamente e escolhe quais categorias compartilhar.
5. **Revogação** — interrompe novas sincronizações · mantém o histórico já importado (salvo pedido de exclusão) ·
   gera evento de auditoria.
6. **Classificação da fonte + origem regulatória** — laboratório · wearable · autorrelato · profissional ·
   documento importado · dispositivo médico certificado (não tratar tudo com a mesma confiabilidade). A
   **categoria regulatória** de cada fonte (Documento de saúde / Dado de monitoramento / Dispositivo médico /
   Informação declarada / Conteúdo derivado) é definida em **`DATA-001` §7** e acompanha o dado (nunca elevada automaticamente).
7. **Qualidade do dado** — medido automaticamente · informado manualmente · sincronizado · estimado · corrigido.
8. **Interoperabilidade** — compatível com HL7 FHIR · LOINC · UCUM · SNOMED CT (quando licenciado) · IEEE 11073 (dispositivos).
9. **Segurança** — OAuth 2.0 (ou equivalente do fornecedor) · cripto em trânsito · armazenamento seguro de tokens ·
   rotação/revogação de credenciais · menor privilégio.
10. **Auditoria** — 1ª autorização · renovação · sincronizações · falhas · revogações · alterações de permissão.
11. **Limites arquiteturais (não-SaMD, = COMP-06)** — mesmo com dados de wearable: não interpreta p/ diagnóstico ·
    não diagnostica · não recomenda tratamento · não substitui avaliação profissional. Dados = histórico/acompanhamento.
12. **Roadmap de conectores** — Apple Health · Google Health Connect · Garmin · Fitbit · Oura · Whoop · Polar ·
    Samsung Health · Dexcom · FreeStyle Libre · Omron · APIs de laboratório · plataformas hospitalares FHIR.

**Aceite objetivo (quando implementar):** ✓ nenhum fornecedor escreve no banco fora da camada de conector ·
✓ todo dado externo tem proveniência completa (§3) · ✓ consentimento por integração E por categoria · ✓ revogação
para sincronização e audita · ✓ fonte + qualidade classificadas · ✓ token seguro (OAuth/rotação) · ✓ teste
automatizado. **Evidência:** ADR da camada de conectores + migration (proveniência/consentimento) + `connectors.spec.ts`.

**Connector Capability Matrix** — cada conector DECLARA formalmente suas capacidades (facilita manutenção/testes):
| Conector | leitura | escrita | sync incremental | webhook | histórico completo | OAuth2 | revogação |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| _(ex.) Apple Health_ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| _(preencher por conector ao implementar — HIP-001)_ | | | | | | | |

## Registro de Exceções (Exception Register — evita exceções implícitas)
Requisito que não cumpre 100% agora entra AQUI (com mitigação e prazo), nunca fica em silêncio.

| ID | COMP | Motivo | Mitigação | Prazo | Responsável | Revisão |
|---|---|---|---|---|---|---|
| EXC-02 | COMP-02 | Cripto/TLS dependem de config da app + gestão de chaves; sem evidência auditada | Manter infra provida (AES-256 repouso/TLS); NÃO classificar como concluído; auditar config | a definir | Fundadora/Infra | — |
| EXC-07 | COMP-07 | Licença SNOMED CT pendente | Usar **apenas LOINC/UCUM**; modelar aberto p/ acomodar SNOMED depois | a definir | Fundadora | — |

## Impact Assessment (controle de mudanças — checklist de TODA alteração)
Toda alteração informa: afeta **LGPD?** · afeta **auditoria?** · afeta **interoperabilidade?** · afeta
**arquitetura?** · afeta **segurança?** · afeta **compartilhamento?** · afeta **retenção?** · afeta **RDC?**
"Sim" em qualquer eixo → passa pelo Compliance Review correspondente antes do `Done`.

## Entregáveis da Fase 0 (item 8)
⬜ Política de Segurança da Informação · ⬜ Política de Privacidade (J) · ⬜ Política de Compartilhamento ·
⬜ Política de Backup · ⬜ Plano de Resposta a Incidentes · ⬜ Plano de Continuidade · ⬜ Inventário de Dados ·
⬜ Matriz de Permissões · ⬜ Modelo de Governança de Dados.

## Mapeamento para certificações futuras (organizar controles agora, certificar depois)
Não é objetivo imediato implementar certificações — mas os controles são estruturados para **mapear** a
referenciais reconhecidos, reduzindo esforço quando/se forem buscados:
| Referencial | Escopo | COMP relacionados |
|---|---|---|
| **ISO/IEC 27001** | SGSI / segurança da informação | COMP-02, 03, 04, 09, 10, 12 |
| **ISO/IEC 27701** | Privacidade (extensão da 27001) | COMP-01, 04, 05 |
| **SOC 2 Type II** | Trust Services (segurança/disponibilidade/confidencialidade/privacidade) | COMP-02, 04, 05, 09, 10 |
| **HITRUST** | Saúde (se houver expansão internacional) | COMP-01…04, 09, 10 |
| **GDPR** | Usuários na União Europeia (se aplicável) | COMP-01, 04, 05, 11 |
Cada COMP já registra **origem normativa** e **evidência**, o que serve de base para o mapeamento a esses frameworks.

## Critério de encerramento da Fase 0
COMP-01…12 em ✅ ou 🟡-com-exceção-registrada · entregáveis do item 8 emitidos · Matriz de Rastreabilidade
completa · Gate em duas partes operante como Definition of Done em todo domínio. **Não bloqueia Exames.**

## Estado global
**Em andamento (trilha paralela).** Compliance Review **ativo** como Definition of Done. Nível de maturidade
(auto-avaliação conservadora): Governança/Arquitetura **alta**; Compliance **boa base, em evolução**; Segurança
**boa base, requer validação contínua**; LGPD **estrutura definida, implementação em andamento**; Auditoria **em
implantação**; Interoperabilidade **preparada**; Regulação **estratégia consistente, revisável por funcionalidade**.
Estado COMP: **2 ✅ · 8 🟡 · 3 ⬜** (13 blocos). Próximos autônomos: COMP-05, COMP-04, COMP-01, COMP-09, COMP-08,
e o **9º eixo do Gate (COMP-13) já ativo** para barrar vendor lock-in em qualquer feature. Itens I/F/J aguardam decisão/recurso/jurídico.
