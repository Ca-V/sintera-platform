# Matriz de Paridade Web × Mobile

**Estado:** Build 2 (homologação) gerada · branch `feat/mobile-inc4-perfil` · **sem merge para `main`**.
**Última atualização:** 2026-08-09 (encerramento da consolidação arquitetural).
**Relaciona-se com:** [[principio_paridade_total_web_mobile]] · ADR-011 (componentes cross-platform) · ADR-021 (consolidação) · ADR-022 (entrada de datas) · governança de merge (abaixo).

## Princípio
Web = referência funcional; Mobile reproduz **integralmente** comportamento/regras/informação — só o **layout** adapta. O núcleo de domínio (`@sintera/core`) e o acesso a dados (`@sintera/api-client`) são **fonte única**, consumidos pelas duas plataformas.

## Matriz por domínio

| Domínio | Web | Mobile | Paridade | Observações |
|---|:--:|:--:|:--:|---|
| Home | ✅ | ✅ | ✅ | ordem unificada UX-002; diferenças menores = P2 |
| Agenda | ✅ | ✅ | ✅ | Disclaimer RDC adicionado |
| Histórico de Saúde (Timeline) | ✅ | ✅ | ✅ | Disclaimer RDC adicionado; ações inline = P2 |
| Perfil | ✅ | ✅ | ✅ | título + link Configurações; estatísticas = P2 (escopo congelado MOBILE-016/019) |
| Exames — lista | ✅ | ✅ | ✅ | selo binário · "Ver original" · período de/até; gestão de estado dos Pedidos = P2 |
| Exame — detalhe | ✅ | ✅ | ✅ | regras via core; export CSV/PDF = P2 |
| Exame — upload | ✅ | ✅ | ✅ | bundle multipágina = P2 |
| Histórico de Exames | ✅ | ✅ | ✅ | **arquitetura B** (índice → página do indicador); detalhe longitudinal na página do indicador |
| Indicador (longitudinal) | ✅ | ✅ | ✅ | consome `seriesForName` do core; faixa de ref. no gráfico = P2 |
| Medicamentos / Suplementos | ✅ | ✅ | ✅ | captura assistida aplicada; Disclaimer RDC |
| Composição Corporal | ✅ | ✅ | ✅ | captura assistida (bioimpedância) via revisão em lote |
| Monitoramento (sinais vitais) | ✅ | ✅ | ✅ | — |
| Condições de Saúde | ✅ | ✅ | ✅ | captura assistida aplicada; salvamento-duplo = P2 |
| Hábitos | ✅ | ✅ | ✅ | Disclaimer RDC adicionado |
| Recursos de Saúde | ✅ | ✅ | ✅ | captura assistida (grau dos óculos); Disclaimer RDC |
| Ciclo e Contracepção | ✅ | ✅ | ✅ | Disclaimer RDC adicionado |
| Ômica | ✅ | ✅ | ✅ | ingestão/versões = P2 |
| Relatório / Rede de Cuidado | ✅ | ✅ | ✅ | Web=PDF/impressão · Mobile=Share nativo (decisão); resumo/índice = P2 |
| Despesas | ✅ | ✅ | ✅ | projeção única de fatos com valor |
| Configurações | ✅ | ✅ | ✅ | Central agrupada por seção da Sidebar (FB-017) |

## Componentes compartilhados (SSOT)

| Componente | Contrato | Web | Mobile |
|---|---|:--:|:--:|
| **Select** (PS-1) | gatilho compacto + popover c/ busca + grupos | `components/ui/Select` | primitivo `Select` (D-16) |
| **DatePicker** (ADR-022) | contrato único ISO; nativo por plataforma | `input type=date` | `@react-native-community/datetimepicker` |
| **AttachmentLink** (R-ATTACH) | abrir documento (pill/inline) | `components/ui/AttachmentLink` | primitivo `AttachmentLink` |
| **Disclaimer / copy RDC** (PS-3) | `DISCLAIMERS`/`COPY` no core | `<Disclaimer variant>` | primitivo `<Disclaimer variant>` |
| **Captura assistida** (T1) | `apiClient.vision.*` + `useAssistedCapture` + `AssistedBatchReview` | rotas `/api/vision/*`, `/medications/scan` | consumida por Condições/Recursos/Medicamentos/Composição |

**Regra de plataforma (captura assistida):** a IA **propõe** o preenchimento; o usuário **revisa e confirma** antes de qualquer persistência. A IA nunca grava diretamente.

## Backlog P2 (pós-merge — evolução funcional)

| Item | Motivo | Categoria |
|---|---|---|
| Voz na captura (T1b) | Escopo | Evolução funcional |
| Gestão de estado dos Pedidos (Exames) | Escopo | Evolução funcional |
| Resumo executivo + índice (Relatório) | Escopo | Evolução funcional |
| Estatísticas + bloco de conta (Perfil) | Escopo congelado (MOBILE-016/019) | Evolução funcional |
| Salvamento-duplo em Condições (documento que é exame) | Escopo | Evolução funcional |
| Lote de vários medicamentos (scan) | Refinamento | Evolução funcional |
| Bundle multipágina no upload (Mobile) | Escopo | Evolução funcional |
| Export CSV/PDF no detalhe do exame (Mobile) | Escopo | Evolução funcional |
| Faixa de referência no gráfico do indicador (Mobile) | Fidelidade | Evolução funcional |
| Aviso "nome divergente" na lista de Exames | Baixo retorno (exige DTO extra) | Dívida técnica |
| Adoção do wrapper DatePicker nos 23 `input date` Web | Baixo retorno (Web já nativo) | Dívida técnica |
| Ingestão/versionamento de ômica no Mobile | Escopo | Evolução funcional |
| Convergência dos 2 classificadores de modalidade (D-11/12) | Arquitetura | Pesquisa futura |

## Governança de merge
Fluxo: **Implementação → Revisão funcional → Build 2 → Homologação 2 → Aprovação → Merge**. O merge para `main` é condicionado à **aprovação da Homologação 2**. Durante a homologação, apontamentos são tratados **exclusivamente como ajuste** (sem novas funcionalidades, alterações arquiteturais ou expansão de escopo).

### Critério de aceite da Homologação 2
A arquitetura é aprovada quando: **(1)** sem bloqueadores P0 · **(2)** sem divergências arquiteturais Web↔Mobile · **(3)** componentes compartilhados conforme especificado · **(4)** captura assistida com comportamento consistente · **(5)** fluxos principais sem regressões. Atendidos → **congelamento oficial da arquitetura de navegação + merge para `main`** → início da evolução funcional.

### Observações da revisão funcional (baixa severidade, não bloqueantes)
1. Condições — salvamento-duplo (documento que é exame → criar registro em Exames) não reproduzido no Mobile → P2.
2. Medicamentos — forma por OCR já validada no servidor (`/medications/scan`) contra o vocabulário → não-issue.
