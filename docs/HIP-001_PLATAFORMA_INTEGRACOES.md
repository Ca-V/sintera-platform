# HIP-001 — Plataforma de Integrações em Saúde (pilar transversal)

> Fundadora (14/07/2026): a plataforma deve ter uma **Plataforma de Integrações em Saúde** baseada em
> **conectores independentes**, capaz de receber dados de QUALQUER fonte externa. Aberta, extensível e
> desacoplada. **Não** uma arquitetura para wearables específicos — uma infraestrutura universal de
> aquisição. **Registrar agora**, considerar na arquitetura desde já para evitar acoplamento e
> retrabalho; implementar na fase adequada (após consolidar módulos + capacidades transversais).

## Princípio arquitetural (constitucional — inegociável)
Como o CPE concentra o clínico, a UCDA o contrato de saída e o Billing o comercial, a **aquisição de
dados externos** é um pilar único e desacoplado:

- **A SINTERA NUNCA depende de um fabricante/fonte específica.** Nenhum módulo conhece Garmin, Fitbit,
  FHIR ou RNDS. O acoplamento a fabricante é proibido no núcleo.
- **Cada integração é um CONECTOR independente** (padrão Adapter — irmão do Laboratory Adapter e dos
  processadores do CPE). Um conector traduz o formato/protocolo da fonte para a plataforma.
- **Todo conector produz a MESMA representação canônica** já usada pela plataforma (UCDA — evidência
  clínica / medida / série temporal / documento). A arquitetura **nunca depende do formato original**.
- **Novos fabricantes entram SEM mudança estrutural** (Modelo Aberto): registrar um conector é adicionar
  uma implementação, não alterar tipos/tabelas/núcleo.
- **Sincronização rastreável, auditável e versionada** (mesma exigência da Certificação): cada ingestão
  registra fonte · quando · versão do conector · faixa temporal · payload de origem.
- **O usuário controla as autorizações** — concede/revoga acesso de cada integração a qualquer momento
  (consentimento explícito, LGPD Art. 11; revogação efetiva).

```
Fonte externa  ─►  Conector (adapter, por fonte)  ─►  Representação canônica (UCDA)  ─►  pipeline único
(wearable/API/    (traduz formato/protocolo;                                            (Timeline/Evolução/
 dispositivo/     nunca vaza o formato p/ o núcleo)                                       Sinais Vitais/Care)
 FHIR/RNDS…)      autorização + sync auditável/versionada
```

> **Cláusula de generalidade (fundadora 17/07/2026 — reforço constitucional):** embora a implementação
> inicial esteja focada em **wearables**, a Connector Layer deverá permanecer **totalmente genérica
> (vendor-neutral E domain-neutral)**, preparada para integrar **qualquer origem externa de dados** da
> plataforma — wearables · laboratórios · hospitais · clínicas · sistemas de Prontuário Eletrônico (PEP/EMR)
> · plataformas de telemedicina · farmácias · seguradoras · equipamentos médicos · APIs públicas —
> preservando o mesmo modelo arquitetural definido no HIP-001. É uma **infraestrutura corporativa de
> integração**, não uma camada de wearables. Nenhum tipo de domínio de origem é privilegiado no núcleo.

## Alvos de integração (preparar a arquitetura para acomodar; não implementar tudo já)
- **Wearables:** Apple Watch · Apple Health · Google Health Connect · Garmin · Fitbit · Polar · Suunto ·
  Coros · Amazfit · Huawei Health · Samsung Health · Oura Ring · Whoop.
- **Plataformas esportivas:** Strava · TrainingPeaks · Zwift · Wahoo · Runkeeper · Nike Run Club ·
  Adidas Running.
- **Dispositivos de monitorização:** monitores cardíacos · CGM (glicose contínua) · pressão arterial ·
  oxímetros · balanças inteligentes · bioimpedância · sensores de sono · sensores respiratórios · demais
  dispositivos médicos homologados.
- **Preparado para o futuro (sem implementar):** FHIR · HL7 · DICOM · RNDS · APIs hospitalares ·
  laboratórios · clínicas · operadoras · plataformas de telemedicina · novos fabricantes/dispositivos.

## Modelo (diretrizes de arquitetura — para não acoplar desde já)
1. **Registro de conectores** — cada conector declara: fonte, capacidades (que tipos de dado produz),
   modo de aquisição (OAuth/API/webhook/arquivo/BLE), versão. Núcleo itera sobre o registro, não conhece
   nomes de fabricantes.
2. **Contrato de saída = UCDA** — o conector emite `UcdaRepresentation`/itens (measure/parameter/finding/
   série temporal), com proveniência. O restante do pipeline (persistência, Sinais Vitais, Evolução, Care)
   consome UCDA — nunca o payload do fabricante.
3. **Autorização por usuário** — uma tabela de conexões autorizadas por usuário × fonte (consentimento,
   escopo, tokens fora do cliente), com concessão/revogação. *(Precursor existente: tabela
   `wearable_connections` — hoje RLS habilitada SEM política; reconciliar sob HIP-001, não ad hoc.)*
4. **Sincronização auditável/versionada** — cada sync é um evento rastreável (fonte, janela, versão do
   conector, resultado); reprocessável; idempotente por faixa. Herda Reprodutibilidade/Auditabilidade.
5. **Sinais Vitais como primeiro consumidor** — o backlog "Sinais Vitais automáticos" (Fase E1) passa a
   ser o **primeiro caso de uso** de HIP-001, não uma integração wearable isolada.
6. **Histórico e monitoramento operacional (fundadora 17/07)** — cada conector registra um **histórico
   completo de sincronizações** (origem · data/hora · status · nº de registros · erros · última sync
   bem-sucedida) e um **modelo de reconciliação + deduplicação** de dados de múltiplos provedores que
   **sempre preserva a proveniência**. Sobre isso, um **Painel Operacional de Integrações** por conector
   (status: OK / credenciais pendentes / aguardando homologação / erro · última sincronização · última
   atividade · nº de erros), servindo **suporte · debugging · auditoria · usuário · LGPD**. Genérico:
   vale para wearable, laboratório, hospital, EMR, farmácia etc. — não só dispositivos.

## Posição no roadmap
Pilar **transversal** (não uma modalidade), ao lado de: **Clinical Processing Engine · UCDA · CARE-001 ·
Billing/Assinaturas · Sistema de Notificações (NOTIF-001) · Eventos Assistenciais**. Sequência da
governança (fundadora): **(1) concluir integralmente os módulos existentes → (2) consolidar as capacidades
transversais → (3) concluir a infraestrutura universal → (4) só então ampliar modalidades e integrações.**
HIP-001 é considerado na arquitetura DESDE JÁ (evitar acoplamento), implementado na fase 3/4.

Relaciona: `ucda_universal_clinical_data_architecture` · `principio_modelo_aberto` ·
`principio_delegacao_modalidade_cpe` · `principio_convergencia_progressiva` · `principio_reprodutibilidade`
· `evento_assistencial_entidade_central` · `notif_001_infraestrutura_unica` · `billing_001_assinaturas`.
