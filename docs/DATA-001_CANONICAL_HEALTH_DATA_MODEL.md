# DATA-001 — Canonical Health Data Model (política de evolução do modelo canônico)

> **Decisão da fundadora (15/07/2026 — alta prioridade):** em uma plataforma que agrega laboratórios,
> documentos, wearables, dispositivos médicos e apps, o **modelo canônico é um ativo arquitetural central**.
> Defini-lo cedo reduz inconsistências, facilita novas integrações e evita acoplamento a formatos de fornecedor.
>
> Raiz constitucional: **`ADR-000`** (princípios permanentes — Canonical Data Model, Vendor Neutrality,
> Backward Compatibility, Evolution without Breaking Changes). **Relação com o UCDA** (`UCDA-001`): o UCDA é a **arquitetura/contrato** (a unidade permanente = EVIDÊNCIA
> clínica, representável por adaptadores). **DATA-001 é a POLÍTICA DE EVOLUÇÃO** desse modelo canônico —
> como ele é nomeado, versionado, estendido e depreciado ao longo do tempo. UCDA responde "qual é o contrato";
> DATA-001 responde "como o contrato muda sem quebrar nada". Governado pelo Gate de Conformidade (`COMPLIANCE-001`).

## 1. Princípio central
O dado é armazenado em um **modelo interno padronizado, independente da origem**. O banco **nunca** depende do
formato específico de um fabricante/app. Todo conector normaliza para o canônico ANTES de persistir
(`Fonte → Conector → Normalização → Modelo Canônico → Timeline/Exames/Indicadores`).

## 2. Convenções de nomenclatura
- Nomes canônicos de medida em `snake_case`, estáveis e independentes de fabricante
  (ex.: `heart_rate`, `blood_pressure_systolic`, `steps`, `vo2_max`, `blood_glucose`, `sleep_duration`,
  `spo2`, `body_temperature`, `body_weight`, `body_composition_fat_pct`).
- **Unidade sempre em UCUM** (ex.: `/min`, `mm[Hg]`, `mg/dL`, `Cel`, `kg`, `%`); nunca unidade "livre".
- **Código LOINC** associado quando existir (medida clínica); SNOMED CT quando aplicável e licenciado.
- Um conceito = um nome canônico. Sinônimos de fornecedor são mapeados no conector, não viram novos campos.

## 3. Versionamento do modelo
- O modelo canônico tem **versão semântica** (`MAJOR.MINOR.PATCH`), carimbada nos registros/representações.
- **MINOR/PATCH** = mudanças retrocompatíveis (campos novos opcionais, novos códigos). **MAJOR** = quebra
  (evitada ao máximo; exige migração + ADR + Gate).
- A versão do extrator/representação já é rastreada (Reprodutibilidade); DATA-001 estende isso ao schema canônico.

## 4. Compatibilidade retroativa (regra dura)
- Mudanças são **ADITIVAS por padrão**: adicionar campo opcional, novo tipo de medida, novo código.
- **NUNCA** reaproveitar o significado de um campo existente nem mudar sua unidade silenciosamente
  (fere Reprodutibilidade e Rastreabilidade). Correção de significado = campo novo + depreciação do antigo.
- Consumidores antigos continuam válidos após qualquer mudança MINOR/PATCH.

## 5. Depreciação de campos
- **Depreciar, não apagar**: campo depreciado é marcado (`deprecated_since`, motivo, substituto) e mantido
  legível durante um período de graça; migração documentada.
- Remoção só em versão MAJOR, com plano de migração + Exception Register se algum consumidor ainda depender.

## 6. Regras para inclusão de novo tipo de dado
Um novo tipo só entra no canônico quando declara: **nome canônico** · **unidade UCUM** · **código (LOINC/SNOMED)
quando houver** · **classificação de fonte + origem regulatória** (§7) · **proveniência** (COMP-13 §3) ·
**qualidade** (medido/manual/sincronizado/estimado/corrigido). Sem esses, não é persistido como dado estruturado
(cai em document_only/autorrelato, conforme o caso). Nunca "achatar" formato de fabricante direto no banco.

## 7. Classificação de fonte + ORIGEM REGULATÓRIA
Além da proveniência técnica, cada dado carrega uma **categoria regulatória** — fontes não têm a mesma
confiabilidade e não devem ser tratadas de forma equivalente em funcionalidades futuras:

| Fonte | Categoria regulatória |
|---|---|
| Laboratório clínico | Documento de saúde |
| Hospital | Documento de saúde |
| Wearable de bem-estar | Dado de monitoramento |
| Dispositivo médico certificado | Dispositivo médico |
| Autorrelato | Informação declarada pelo usuário |
| IA externa | Conteúdo derivado |

Regra: a categoria regulatória acompanha o dado (não é inferida na exibição) e **nunca** é elevada
automaticamente (um dado de wearable não vira "documento de saúde"). Preserva a estratégia não-SaMD.

## 8. Interoperabilidade (permanente, ≠ integração)
O modelo canônico é desenhado para **mapear** para HL7 FHIR / LOINC / UCUM / SNOMED CT desde já — mesmo antes
de qualquer conector existir. **Interoperabilidade** é requisito permanente da arquitetura; **integrações** são
implementações específicas do roadmap (ver `COMPLIANCE-001` §COMP-13 e `HIP-001`).

## 9. Governança
Mudança no modelo canônico → **ADR** + passa pelo **Compliance Gate** (eixos Arquitetura · Interoperabilidade ·
Ecossistema · Rastreabilidade). DATA-001 é referência obrigatória de qualquer conector (`HIP-001`) e de qualquer
funcionalidade que crie novo tipo de dado. Estado: **fundação em UCDA/Modelo Aberto já existente; política aqui
formalizada — evolui de forma aditiva.**
