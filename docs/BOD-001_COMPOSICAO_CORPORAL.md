# BOD-001 — Composição Corporal (painel longitudinal) + Princípio Fato × Visualização

**Status:** ativo · **Versão:** 1.1 (17/07/2026 — spec de UX das 5 áreas + princípio de marcos) · **Responsável:** Fundadora (direção) · Claude (redação).
**Objetivo:** definir o domínio **Composição Corporal** e consolidar a **separação arquitetural de três domínios**
que a fundadora estabeleceu como princípio. **Dependências:** ADR-000, DATA-001, EVENTS-001, CEF/CPE (exames),
HIP-001 (wearables). **Relacionado:** Registros de Saúde (timeline), Histórico de Exames, FB-003 (bioimpedância→Exames).
Segue a estrutura de [[ARCH-000]] §4.

---

## PRINCÍPIO ARQUITETURAL — Fato × Conhecimento derivado (fundadora 17/07, permanente)
> **O Histórico guarda o FATO; os painéis apresentam CONHECIMENTO DERIVADO e evolução temporal.** Cada domínio
> tem um objetivo distinto e **não duplica responsabilidades**. Reutilizável em toda a plataforma.

**Os três domínios longitudinais (sem sobreposição):**
| Domínio | Objeto Principal (de Governança) | Papel |
|---|---|---|
| **Registros de Saúde** | Evento de Saúde | Linha do tempo da jornada da usuária (consulta·exame·procedimento·vacina·medicamento·suplemento·internação·cirurgia·outros). **Não é análise** — é a jornada. |
| **Histórico de Exames** | Exame / Biomarcador | **Fonte oficial** dos exames (documento original·extração·biomarcadores·laboratório·solicitante·data·valor·doc fiscal·rastreabilidade) e **evolução longitudinal dos resultados** (ex.: Ferritina 2022→28, 2023→41, 2024→52; HbA1c 5,9→5,7→5,5→5,3). |
| **Composição Corporal** | Indicador Corporal | Painel consolidado da **evolução corporal proveniente de múltiplas fontes** — não armazena exames. |

Regra de ouro: o dado entra e é preservado no **Histórico de Exames** (o fato); **Composição Corporal** e demais
painéis **leem** dele (+ outras fontes) e apresentam evolução — **nunca duplicam o armazenamento**.

> **Não-fonte-primária + rastreabilidade (fundadora 17/07):** a **Composição Corporal NÃO constitui uma fonte
> primária de dados.** Todos os indicadores apresentados devem possuir **rastreabilidade até sua origem** (exame,
> registro manual, wearable ou outra integração), **preservando a proveniência** das informações. Nenhum painel
> cria informação — apenas consolida e apresenta dados provenientes de fontes rastreáveis.

> **Comparação = confronto de snapshots, sem normalização (fundadora 17/07):** **A Comparação entre Avaliações
> deve confrontar snapshots independentes da composição corporal, preservando a origem de cada indicador e
> evidenciando indisponibilidades de medição sem inferências ou normalizações entre tecnologias distintas.** A
> plataforma NÃO tenta "corrigir" ou "equalizar" uma DEXA para parecer uma bioimpedância — apenas apresenta os
> dados medidos por cada método (RDC 657).

> **Consolidação multi-fonte + contextualização por marcos (fundadora 17/07 — amplia "painel derivado"):**
> **A Composição Corporal deve consolidar indicadores provenientes de múltiplas fontes e contextualizar sua
> evolução com eventos relevantes da jornada de saúde, preservando sempre a rastreabilidade até a fonte original
> e sem duplicação de dados.** A página deixa de mostrar apenas números e passa a **contar a evolução da
> composição corporal dentro do contexto da vida da usuária** — conectando dados corporais à jornada completa
> (Registros de Saúde). Os marcos são **lidos** de fatos já existentes (health_events/agenda); **nunca duplicados**.
> É o diferencial da SINTERA frente a apps tradicionais de peso/bioimpedância.

## 1. Objetivo
Painel de **acompanhamento longitudinal da composição corporal**, útil para nutrição/endocrinologia e especialmente
para usuárias em terapia **GLP-1** — foco não só no peso, mas na **evolução da composição** (gordura × massa magra).

## 2. Escopo
**Dentro:** consolidação/visualização de indicadores corporais de múltiplas origens; painel GLP-1.
**Fora:** armazenamento de exames/laudos (isso é do **Histórico de Exames**); qualquer laudo entra por Exames.

## 3. Modelo de Dados
- Fonte primária: `body_metrics` (peso/altura/circunferências/gordura/massa magra/etc.) — hoje a base da página.
- Alimentação futura: resultados de **bioimpedância/DEXA processados como EXAME** (FB-003) gravam `body_metrics`
  automaticamente; **wearables** (HIP-001) e **balanças** também. Cada ponto guarda a **origem** (`source`:
  bioimpedancia·dexa·manual·balanca·wearable).
- **Sem tabela nova de "composição"** — é projeção/visão sobre `body_metrics` (+ derivações), preservando origem.

## 4. Componentes
- Página `/dashboard/medidas` (rótulo **Composição Corporal**). Consome `body_metrics`. Por vir: seletor de
  indicador, série temporal por indicador com **rótulo de origem**, painel GLP-1 (metas/ritmo/preservação de massa magra).

## 4.1 Experiência (UX) — 5 ÁREAS (spec da fundadora 17/07)
A página se organiza em cinco áreas. Todas são **derivadas** (leem fontes rastreáveis; não criam fato; RDC 657 —
factual, sem juízo clínico).

**① Resumo atual.** Só o **estado mais recente** de cada indicador — Peso · IMC · % de gordura · Massa muscular ·
Massa magra · Água corporal · Gordura visceral · Metabolismo basal · Massa óssea (circunferências quando houver).
Cada indicador exibe **valor + unidade · data da última atualização · origem · confiabilidade (§4.2) · tendência
vs. a medição anterior** (↑/↓/– com a variação). *(Rótulo de origem já implementado — FB-003 subitem d.)*

**② Evolução longitudinal.** Três níveis: **(a) seletor horizontal** de indicadores (Peso·Gordura·Massa
Muscular·Massa Magra·Água·Visceral·IMC·TMB — um clique troca o painel); **(b) gráfico principal** grande com
**filtros de período** (30d·90d·6m·1a·tudo) e **marcadores distintos por origem** (● bioimpedância · ■ manual ·
▲ DEXA · ◆ balança); **(c) tabela cronológica** (Data·Valor·Origem·Avaliação). Cada **ponto é clicável** →
detalhe com valor·origem·data e ação de rastreabilidade: **Abrir exame** (veio de laudo) ou **Editar** (registro
manual) — nenhum ponto fica "solto". *(Implementado: `lib/body/evolution.ts` + `EvolutionChart` + seção na página;
IMC derivado de peso+altura; edição de medida manual — form em modo update + botão editar no histórico.)*

**③ Comparação entre avaliações (SNAPSHOTS).** Modelada como **snapshots**: cada avaliação (bioimpedância, DEXA,
InBody, ou um lote manual de uma data) é um **retrato** da composição num momento. A usuária compara **dois
snapshots** — *Comparar [A ▼] com [B ▼]* — **de qualquer tipo** (bio×bio, DEXA×DEXA, **bio×DEXA**), desde que o
indicador exista. Tabela **Indicador · Avaliação A · Avaliação B · Δ · Status**: a coluna **Status** evidencia
**indisponibilidade** ("Não disponível") quando um método não mede aquele indicador — sem parecer erro. Acima de
cada coluna, a **origem** (tipo · data · Abrir exame). Um **resumo** acima da tabela sintetiza os deltas ("houve:
Peso −4,4 kg; Gordura −6 p.p.; …"). Cada valor é **clicável** (rastreabilidade → Abrir exame / Registro manual).
**Não é diagnóstico**; **sem inferências nem normalização entre tecnologias** (não "corrige" DEXA para parecer
bioimpedância — apresenta o que cada método mediu). *(Implementado: `lib/body/snapshots.ts` + seção na página.)*

**④ Jornada de Tratamento (GENÉRICA).** Painel **reutilizável para diferentes linhas de cuidado** — GLP-1,
acompanhamento nutricional, bariátrica, ganho de massa muscular, reabilitação e futuros protocolos. **GLP-1 é
apenas um contexto.** Nesta 1ª versão o objetivo é o **peso**, mas a estrutura é genérica (preparada para outros
objetivos terapêuticos). Apresenta: **data de início do acompanhamento · peso inicial · peso atual · meta · % da
meta atingido · perda acumulada · ritmo médio · tempo de acompanhamento · próxima meta (quanto falta)**. Inclui o
indicador **"Última avaliação corporal"** (ex.: *Última bioimpedância: 15/07/2026* · *Última DEXA: 02/06/2026*) —
mostra a **atualidade** dos dados. *(Implementado: `weight-journey.ts` + `lastAssessment` + painel "Jornada de
Tratamento" com os 9 campos + última avaliação; a preservação de massa magra também é exibida.)*

**⑤ Marcos da evolução (DIFERENCIAL).** Sobre os gráficos, **linhas verticais** marcam eventos importantes da
jornada; a usuária **correlaciona visualmente** quedas de gordura / ganhos de massa com fatos já registrados.
**INVARIANTE — projeção sem tabela própria:** os marcos são **derivados automaticamente** de domínios existentes,
preservando rastreabilidade ao registro original; **NÃO** há tabela de marcos nem nova fonte de dados. **Fontes
(v1):** (a) **Medicamentos** — início (`started_on`) e suspensão (`until_date`), GLP-1 destacado mas **sem
tratamento especial** na arquitetura; (b) **Suplementos** — idem (categoria própria); (c) **Avaliações corporais**
— bioimpedância/DEXA/InBody (dos snapshots, rastreável ao exame); (d) **Consultas** de acompanhamento corporal
(nutricionista/fisioterapeuta). **Controle da usuária:** mostrar/ocultar marcos **por categoria** (medicamentos ·
suplementos · avaliações · consultas) **sem alterar os dados**. *(Implementado: `lib/body/milestones.ts` +
anotações no `EvolutionChart` + toggles + lista rastreável na seção Evolução.)*
**Limitações v1 + direção de evolução (fundadora 17/07):**
- **Consultas — evoluir de PROFISSÃO para PROPÓSITO (linha de cuidado).** A identificação **não** deve depender da
  especialidade. Futuramente o marco de consulta deriva do **propósito/classificação do atendimento** (linha de
  cuidado — ex.: *acompanhamento de obesidade*), de modo que um **endocrinologista** que acompanha obesidade
  apareça como marco **sem** depender de uma especialidade específica. (v1 usa nutricionista/fisioterapeuta como
  aproximação até existir a classificação por linha de cuidado.)
- **Marcos de Agenda — só FATOS CONSUMADOS.** Quando incorporados, devem representar **apenas eventos efetivamente
  ocorridos**, nunca planejados/futuros. O gráfico reflete fatos consumados.
- **Alteração de dose — automática a partir do histórico.** Não implementar enquanto não existir **histórico de
  doses**; quando existir, o marco é gerado **automaticamente** a partir dele, **sem lançamento manual**.

## 4.2 Qualidade do Dado — origem + confiabilidade (fundadora 17/07)
Cada indicador informa **de onde veio** (origem) **e o nível de confiabilidade associado àquela FONTE/método** —
reforçando rastreabilidade e governança. É um atributo de **proveniência do dado** (qualidade da medição), **não**
um juízo clínico (RDC 657). Níveis (do método, não do resultado):
- **Alta** — DEXA (referência de composição corporal), exames laboratoriais.
- **Média** — bioimpedância, balança inteligente, wearable (varia por aparelho/condição).
- **Informado** — registro **manual** (valor informado pela usuária).

A confiabilidade é **derivada da origem** (`source`), num mapa aberto no código (`lib/body/summary.ts`), e exibida
de forma discreta junto ao indicador. Fonte desconhecida → confiabilidade não afirmada (nunca inventa).

## 5. Fluxos
1. **Entrada** (sempre pela FONTE): bioimpedância/DEXA → **Exames** (FB-003) → processa → grava `body_metrics`;
   peso manual → registro direto; wearable/balança → HIP-001 → `body_metrics`. 2. **Resumo atual (①):** último
   valor por indicador + origem. 3. **Evolução (②):** série por indicador escolhido. 4. **Comparação (③):** duas
   avaliações → tabela de variação. 5. **GLP-1 (④):** deriva peso inicial/atual/meta/perda acumulada/ritmo médio/
   % da meta/evolução de gordura e massa muscular/**preservação de massa magra**. 6. **Marcos (⑤):** lê eventos-
   marco de `health_events`/`agenda_events` e os projeta como anotações sobre os gráficos (sem duplicar).

## 6. APIs
Leitura de `body_metrics` (por usuário). Sem escrita própria de exame (a escrita vem das FONTES). Contrato de
indicadores: `{ metric, value, unit, measured_on, source }`.

## 7. Segurança
RLS por usuário em `body_metrics`. LGPD (dado sensível). Origem preservada = auditabilidade.

## 8. Governança
Precedência ADR-000 > SPAGS > BOD-001. **Invariantes:** (i) Composição Corporal **não armazena** exames nem
duplica dados; consolida por leitura, sempre com **origem**; (ii) **não é fonte primária** — todo indicador é
rastreável à fonte; (iii) **marcos são lidos** de Registros de Saúde (`health_events`/`agenda_events`), **nunca
duplicados** — a página apenas contextualiza. Mudança nesses invariantes = emenda ao SPAGS antes do código.

## 9. Auditoria
Cada indicador exibe a origem (exame/manual/wearable). Rastreável até o exame-fonte quando vier de laudo (FB-003).

## 10. Evolução (por área da §4.1)
- **Feito:** rename Medidas→Composição Corporal; princípio dos três domínios; **① rótulo de origem** por indicador
  (FB-003 d); **② séries por indicador** (base via Sparkline); **④ núcleo GLP-1** (`weight-journey.ts` + painel).
- **Ordem de entrega (fundadora 17/07):**
  1. **① Resumo atual** dedicado — cada indicador com **valor·unidade·data·origem·confiabilidade·tendência** vs.
     medição anterior (cartões no topo).
  2. **④ Jornada de Tratamento** (genérica; GLP-1 = contexto) — 9 campos + **Última avaliação corporal**; preparada
     para futuros objetivos (ganho de massa, reabilitação). ✅ **feito**.
  3. **② Evolução** — seletor horizontal + gráfico com período + tabela cronológica + pontos clicáveis
     (rastreabilidade) + marcadores por origem. ✅ **feito** (falta só "editar" ponto manual).
  4. **③ Comparação entre avaliações** (snapshots A×B, Status de disponibilidade, sem normalização). ✅ **feito**.
  5. **⑤ Marcos da evolução** (principal diferencial) — projeções de medicamentos/suplementos/avaliações/consultas
     anotadas no gráfico, com toggle por categoria e rastreabilidade. ✅ **feito**.
  6. Ingestão de **DEXA** como exame (FB-003 estende bioimpedância) alimentando os mesmos indicadores. *(pendente)*

**As 5 áreas da §4.1 estão implementadas.** A Composição Corporal deixou de ser uma tela de indicadores e passou
a ser uma **narrativa longitudinal** da jornada, rastreável até cada fato. Follow-ups: **DEXA como exame** (FB-003);
**consultas por linha de cuidado** (não por profissão); **marcos de Agenda** (só fatos consumados) e **alteração de
dose** (auto, quando houver histórico de doses). *(Editar ponto manual — ✅ feito.)*
- **Sem nova tabela**; tudo por leitura/derivação preservando origem (invariantes §8).
