# SINTERA — Protocolo e Diretrizes de Interoperabilidade em Saúde
### FHIR R4 · RNDS · OpenCare · LGPD · Governança de Dados Clínicos
**Versão 1.0 — 19 de agosto de 2026 · Documento de orientação técnica, regulatória e arquitetural**

> **Padrão/protocolo interno da SINTERA (fonte governante).** Transcrição fiel do documento fornecido pela fundadora.
> Os artefatos `INTEROPERABILITY-COMPLIANCE-MATRIX.md` e `SINTERA-FHIR-CANONICAL-MODEL.md` **operacionalizam/detalham**
> este Protocolo; em divergência, **prevalece este documento**. **Gate:** nenhuma implementação sem aprovação.

## 1. Objetivo e ressalva jurídica
Estabelecer o padrão de arquitetura, semântica, interoperabilidade, segurança e governança para a SINTERA, com foco em histórico longitudinal de saúde e futura interoperabilidade nacional e privada.

Este protocolo **não é, isoladamente, certificação de conformidade**. Requisitos jurídicos ou regulatórios devem ser validados contra a norma, perfil, Guia de Implementação, contrato ou regra vigente aplicável ao caso concreto. Onde a pesquisa não demonstrou obrigação específica, o item é tratado como **diretriz ou gap de validação**, não como obrigação legal.

## 2. Princípios obrigatórios da arquitetura
- Separar semanticamente **pedido/solicitação, execução, resultado e documento-fonte**.
- Usar **HL7 FHIR R4** como modelo canônico de interoperabilidade quando aplicável.
- **Pedido de exame = `ServiceRequest`**; resultado diagnóstico = `DiagnosticReport`; resultado atômico = `Observation`; documento original = `DocumentReference`; estudo de imagem = `ImagingStudy` quando aplicável.
- Preservar o **arquivo original**, sua proveniência e integridade.
- Armazenar **código + sistema terminológico + versão + display**; não depender de texto livre como identificador semântico.
- Separar **identificadores nacionais/institucionais** de nomes de exibição.
- Manter **auditoria, controle de acesso, rastreabilidade e histórico**.
- **Não presumir** que todo dado da SINTERA seja transmissível à RNDS; o transporte depende do modelo/perfil/serviço vigente.
- **RNDS e OpenCare devem ser adaptadores desacoplados** do domínio clínico canônico.

## 3. Evidências verificadas
- **RNDS:** plataforma oficial de interoperabilidade do Ministério da Saúde; integração baseada em FHIR e regras próprias. — https://www.gov.br/saude/pt-br/composicao/seidigi/rnds/rnds
- **Guia RNDS:** credenciamento em homologação e produção, certificado digital, integrador, evidências e autorização de produção. — https://rnds-guia.saude.gov.br/docs/passo-a-passo/
- **Ambientes RNDS:** homologação nacional; produção com serviços por estado; autenticação por certificado digital. — https://rnds-guia.saude.gov.br/docs/rnds/ambientes/
- **REL:** Portaria GM/MS 8.276/2025 institui o Modelo de Informação de Resultado de Exame Laboratorial; o modelo usa **CPF/CNS** e **LOINC** para nome do exame laboratorial. — https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt8276_01_10_2025.html
- **RAC:** Modelo de Registro de Atendimento Clínico contempla identificação, profissionais, atendimento, exames e procedimentos. — https://rnds-guia.saude.gov.br/docs/rac/mi-rac/
- **FHIR `ServiceRequest`:** recurso para solicitação de procedimento/investigação diagnóstica; pode resultar em `Procedure`, `DiagnosticReport`, `ImagingStudy` etc. — https://www.hl7.org/fhir/R4/servicerequest.html
- **FHIR `DiagnosticReport`:** relatório de investigação diagnóstica; pode referenciar `Observation`, imagens/`ImagingStudy` e o pedido via `basedOn`. — https://hl7.org/fhir/R4/diagnosticreport.html
- **FHIR `Observation`:** resultado atômico, inclusive laboratório e imagem. — https://hl7.org/fhir/R4/observation.html
- **FHIR `DocumentReference`:** índice e metadados de documentos clínicos e objetos binários. — https://hl7.org/fhir/R4/documentreference.html
- **LGPD:** dados de saúde são dados pessoais sensíveis; segurança e governança são requisitos legais. — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- **Lei 13.787/2018:** disciplina digitalização/guarda de prontuário; integridade, autenticidade, confidencialidade e regras de guarda. — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm
- **OpenCare Interop:** iniciativa InovaHC/HCFMUSP + B3/PDtec; materiais públicos descrevem FHIR, tokenização, governança, consentimento e integração pretendida com RNDS. **Não é norma federal.** — https://www.b3.com.br/pt_br/noticias/inovahc-e-b3-anunciam-parceria-para-interoperabilidade-de-dados-no-setor-de-saude.htm

## 4. Modelo semântico canônico
| Conceito | FHIR R4 | Regra SINTERA |
|---|---|---|
| Pedido de exame | `ServiceRequest` | Nunca tratar como resultado. |
| Resultado | `DiagnosticReport` | Referenciar pedido em `basedOn` quando houver. |
| Resultado atômico | `Observation` | Não substituir o relatório. |
| Estudo de imagem | `ImagingStudy` | Usar quando houver dados de imagem aplicáveis. |
| Documento original | `DocumentReference` | Preservar arquivo e proveniência. |
| Paciente | `Patient` | Identificadores estruturados. |
| Profissional | `Practitioner` / `PractitionerRole` | Não reduzir a texto livre. |
| Organização | `Organization` | Identificador institucional quando disponível. |
| Execução | `Procedure` | Separada do pedido. |

## 5. Requisitos mínimos para Pedido de Exame
- `ServiceRequest` com `status` e `intent` estruturados.
- `identifier` próprio do pedido.
- `subject` → `Patient`.
- `code` → `CodeableConcept` do serviço solicitado; quando houver terminologia aplicável, usar `system`/`code`/`display`.
- `authoredOn` quando conhecida.
- `requester` e `performer` quando conhecidos.
- `reasonCode`/`reasonReference` e `supportingInfo` quando disponíveis.
- `bodySite` quando houver local anatômico, como membro inferior esquerdo/direito.
- `DocumentReference` para o arquivo original.
- `Provenance`/auditoria para origem e alterações.

## 6. Pedido ↔ Resultado
Quando um resultado for inserido e houver pedido compatível, a SINTERA deve **sugerir o vínculo de forma explícita e confirmável**. No modelo FHIR, o resultado pode referenciar o pedido por `DiagnosticReport.basedOn → ServiceRequest`.
- **Não** criar vínculo silencioso quando houver ambiguidade.
- Usar paciente, código/tipo, lateralidade, data, estabelecimento, profissional e identificadores como sinais de correspondência.
- Se houver múltiplos candidatos, **apresentar a lista**.
- **Registrar a confirmação e a origem** do vínculo.
- Manter pedido e resultado como **entidades distintas**.

## 7. Terminologias e identificadores
- **LOINC** para exames laboratoriais quando exigido pelo perfil/modelo aplicável; o REL vigente pesquisado utiliza LOINC.
- **CID-10, ValueSets oficiais** e demais terminologias somente quando exigidos pelo perfil aplicável.
- **UCUM** para unidades de medida quando aplicável.
- Para imagem/procedimentos, **não inventar códigos**: confirmar o ValueSet/Profile vigente antes da implementação.
- Suportar **CPF/CNS** para identificação nacional quando exigidos; **CNES** e identificadores profissionais/institucionais conforme perfil e caso de uso.

## 8. RNDS: integração, homologação e produção
- FHIR **não** equivale a integração RNDS.
- Identificar o estabelecimento/ente responsável pelo envio e seu **CNES** quando aplicável.
- Seguir o fluxo oficial: acesso à **homologação** → desenvolvimento/conector → evidências → solicitação de produção → autorização → **produção**.
- Usar **certificado digital** e mecanismos de autenticação exigidos pela RNDS.
- Separar configuração de homologação e produção.
- Registrar requisições, respostas, códigos de retorno, identificadores RNDS e evidências de homologação.
- Enviar somente recursos/casos de uso **oficialmente suportados e autorizados**.

## 9. Limite confirmado da pesquisa sobre RNDS
A pesquisa encontrou **evidência oficial clara para REL e RAC** e para a arquitetura FHIR da RNDS. **Não** encontrou evidência oficial suficiente para afirmar que exista hoje um **fluxo federal universal para transmissão de todo resultado de imagem, incluindo Doppler**, nem que **todo pedido de exame privado** deva ser transmitido à RNDS. Portanto, isso permanece **NÃO CONFIRMADO** até validação do perfil/serviço federal específico.

**Diretriz:** construir compatibilidade FHIR **independentemente** do transporte RNDS; ativar o adaptador RNDS somente quando o caso de uso, perfil, ambiente e credenciamento estiverem confirmados.

## 10. Segurança, LGPD e governança
- Classificar dados de saúde como **dados pessoais sensíveis**.
- Definir **finalidade, base legal, papéis de controlador/operador** e regras de compartilhamento por fluxo.
- Controle de acesso por função e **menor privilégio**.
- **Criptografia** em trânsito e repouso.
- Gestão segura de certificados, tokens e segredos; **nunca no aplicativo**.
- **Auditoria** de acesso, criação, alteração, vínculo e transmissão.
- **Proveniência** de dados estruturados e transformações.
- Processo de **incidentes** e comunicação conforme LGPD e regulamentação aplicável.
- Políticas de **retenção/descarte** formalizadas; para prontuário abrangido pela Lei 13.787/2018, observar as regras legais aplicáveis.
- **Consentimento não deve ser presumido** como única base legal para todo tratamento.

## 11. OpenCare: posição da SINTERA
O OpenCare Interop é uma iniciativa real e recente liderada pelo InovaHC/HCFMUSP com B3/PDtec. As fontes públicas consultadas descrevem FHIR, tokenização, governança, consentimento, auditoria e integração pretendida com a RNDS. Deve ser tratado como **ecossistema/adaptador de interoperabilidade, não como substituto da RNDS, FHIR ou legislação**.
**Não acoplar** o domínio clínico da SINTERA a APIs ou regras do OpenCare sem especificação técnica/contrato aplicável.

## 12. Arquitetura-alvo
- **Camada 1 — Fonte:** arquivo original, metadados, integridade e proveniência.
- **Camada 2 — Domínio clínico interno:** entidades semânticas SINTERA.
- **Camada 3 — Canonical FHIR R4:** `Patient`, `Practitioner`, `Organization`, `ServiceRequest`, `DiagnosticReport`, `Observation`, `ImagingStudy`, `DocumentReference`, `Procedure` e `Provenance` conforme aplicabilidade.
- **Camada 4 — Terminology Service.**
- **Camada 5 — Adaptadores de interoperabilidade:** RNDS, OpenCare e parceiros.
- **Camada 6 — IAM, auditoria, consentimento** quando aplicável, criptografia e governança.

## 13. Ordem de implementação
- **P0 — congelar semântica:** Pedido = `ServiceRequest`; resultado = `DiagnosticReport`/`Observation`; documento = `DocumentReference`; execução = `Procedure`.
- **P0 — reconciliar schema:** tipos, estados, identificadores e vínculos explícitos; enum/FK onde semanticamente necessários.
- **P0 — vínculo pedido/resultado:** persistir relacionamento interoperável equivalente a `DiagnosticReport.basedOn → ServiceRequest`.
- **P0 — identidade:** `Patient`/`Practitioner`/`Organization` e identificadores nacionais/institucionais estruturados.
- **P1 — terminologia:** serviço de terminologia; LOINC para laboratório quando aplicável; demais ValueSets somente após confirmação.
- **P1 — FHIR R4:** projetores/serializadores e validação contra StructureDefinitions.
- **P1 — documentos:** `DocumentReference`/proveniência e preservação do original.
- **P1 — segurança:** auditoria, acesso, criptografia e gestão de segredos.
- **P2 — RNDS:** somente após confirmação do perfil/serviço, credenciamento e homologação.
- **P2 — OpenCare:** somente após especificação/contrato; adaptador independente.

## 14. Critérios de aceite
- Pedido de exame pode ser projetado para `ServiceRequest` **sem depender do nome do arquivo**.
- Resultado pode ser projetado para `DiagnosticReport` e, quando estruturado, `Observation`.
- Pedido e resultado permanecem **entidades distintas e vinculáveis**.
- Documento original possui referência, proveniência e integridade verificáveis.
- Código, sistema e display são armazenados **separadamente**.
- Identificadores nacionais/institucionais são **estruturados**.
- **FHIR validator** e perfis aplicáveis entram na suíte de testes.
- **Nenhum dado é enviado à RNDS** sem confirmação de caso de uso, perfil, ambiente e credenciamento.
- OpenCare **não** é tratado como norma.
- Trilha de auditoria permite identificar acessos, alterações, vínculos e transmissões.

## 15. Gaps que permanecem abertos
- Perfil federal vigente específico para **resultado de imagem/Doppler** na RNDS.
- Perfil federal vigente específico para **`ServiceRequest`/pedido** no caso de uso privado pretendido.
- **ValueSets oficiais** para procedimentos de imagem, inclusive Doppler.
- Regras completas de **credenciamento** aplicáveis ao papel jurídico da SINTERA/estabelecimento transmissor.
- Especificações técnicas contratuais do **OpenCare Interop** para terceiros.
- **Definição jurídica dos papéis** da SINTERA em cada fluxo de tratamento/compartilhamento.
- Eventual **enquadramento ANVISA** de funcionalidades futuras que ultrapassem armazenamento, visualização e interoperabilidade.

## 16. Fontes principais
- Ministério da Saúde — RNDS — https://www.gov.br/saude/pt-br/composicao/seidigi/rnds/rnds
- Guia RNDS — Introdução — https://rnds-guia.saude.gov.br/docs/introducao/
- Guia RNDS — Passo a passo — https://rnds-guia.saude.gov.br/docs/passo-a-passo/
- Guia RNDS — Ambientes — https://rnds-guia.saude.gov.br/docs/rnds/ambientes/
- Guia RNDS — Homologação — https://rnds-guia.saude.gov.br/docs/publico-alvo/ti/homologar/
- Guia RNDS — RAC — https://rnds-guia.saude.gov.br/docs/rac/mi-rac/
- Guia RNDS — REL — https://rnds-guia.saude.gov.br/docs/rel/mi-rel/
- Portaria GM/MS 8.276/2025 — https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt8276_01_10_2025.html
- HL7 FHIR R4 — ServiceRequest — https://www.hl7.org/fhir/R4/servicerequest.html
- HL7 FHIR R4 — DiagnosticReport — https://hl7.org/fhir/R4/diagnosticreport.html
- HL7 FHIR R4 — Observation — https://hl7.org/fhir/R4/observation.html
- HL7 FHIR R4 — DocumentReference — https://hl7.org/fhir/R4/documentreference.html
- Planalto — LGPD — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- Planalto — Lei 13.787/2018 — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm
- B3/InovaHC — OpenCare Interop — https://www.b3.com.br/pt_br/noticias/inovahc-e-b3-anunciam-parceria-para-interoperabilidade-de-dados-no-setor-de-saude.htm
- InovaHC — Relatório 2025 — https://inovahc.com.br/wp-content/uploads/2026/05/Report_InovaHC_2025_v1.pdf

## 17. Regra de mudança para o desenvolvimento
Antes de **qualquer merge** relacionado à interoperabilidade, registrar: **requisito normativo/técnico** que fundamenta a mudança; **recurso FHIR** afetado; **terminologia/ValueSet**; **impacto no banco**; **impacto em proveniência/auditoria**; **teste de validação**; e **evidência de que o baseline homologado da interface (Ciclo 1) não foi alterado**.

---
*Transcrição fiel da v1.0 (19/08/2026). As URLs são fontes citadas; a verificação direta dos hosts oficiais (RNDS/HL7/Planalto) depende de ambiente com egresso liberado — os itens `[NC]` do §15 seguem pendentes de validação contra o artefato bruto (StructureDefinition/perfil vigente).*
