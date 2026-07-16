# DATA-002 — Data Governance (governança dos próprios dados)

> Referencia `ADR-000`. **Distinção:** `DATA-001` governa o **modelo** (schema canônico e sua evolução);
> **DATA-002 governa os DADOS** (qualidade, propriedade, ciclo de vida, catálogo). Ganha importância à medida
> que surgem exames, documentos, wearables, medicamentos, suplementos, imagens e ômicas.

## Dimensões
- **Qualidade** — completude, consistência, validade (unidade UCUM, faixas), duplicidade (dedup já ativo);
  atributo de qualidade por dado (medido/manual/sincronizado/estimado/corrigido — COMP-13 §7).
- **Lineage (linhagem)** — de onde o dado veio e por quais transformações passou (documento → extração →
  representação canônica); reconstruível por proveniência + versão (Rastreabilidade/Reprodutibilidade).
- **Ownership** — o **paciente é o titular** dos seus dados (LGPD); a organização (tenant) é responsável pelo tratamento.
- **Stewardship** — responsável técnico por cada domínio de dado (quem zela pela qualidade/regras daquele conjunto).
- **Retenção** — período de guarda por categoria (documento de saúde vs monitoramento) + base legal; descarte governado.
- **Classificação** — sensibilidade (dado sensível de saúde/PII) + **origem regulatória** (`DATA-001` §7).
- **Ciclo de vida** — criação → uso → arquivamento → descarte/anonimização, com evento de auditoria em cada transição.
- **Catálogo de dados** — inventário do que existe (tabelas/tipos canônicos/fontes) — base do Inventário de Dados (COMP-08).
- **Master data** — entidades de referência (catálogo de biomarcadores, materiais, unidades) versionadas e canônicas.
- **Metadata** — metadados técnicos e de governança preservados (proveniência, versão, confiança, classificação).

## Regras
- Todo dado estruturado nasce com **classificação + proveniência + qualidade** (senão não é estruturado).
- Retenção e descarte **nunca** apagam o documento original enquanto houver base para preservá-lo (Document-first).
- Mudança de política de dados → ADR + Compliance Gate (eixos LGPD · Privacidade · Rastreabilidade · Ecossistema).

## Estado
Fundação parcial (dedup, proveniência de extração, catálogo de biomarcadores/materiais, RLS por titular).
Formalizado aqui; evolui com os domínios. Entregável relacionado: **Modelo de Governança de Dados** (COMP-08).
