# BOD-001 — Composição Corporal (painel longitudinal) + Princípio Fato × Visualização

**Status:** ativo · **Versão:** 1.0 (17/07/2026) · **Responsável:** Fundadora (direção) · Claude (redação).
**Objetivo:** definir o domínio **Composição Corporal** e consolidar a **separação arquitetural de três domínios**
que a fundadora estabeleceu como princípio. **Dependências:** ADR-000, DATA-001, EVENTS-001, CEF/CPE (exames),
HIP-001 (wearables). **Relacionado:** Registros de Saúde (timeline), Histórico de Exames, FB-003 (bioimpedância→Exames).
Segue a estrutura de [[ARCH-000]] §4.

---

## PRINCÍPIO ARQUITETURAL — Fato × Conhecimento derivado (fundadora 17/07, permanente)
> **O Histórico guarda o FATO; os painéis apresentam CONHECIMENTO DERIVADO e evolução temporal.** Cada domínio
> tem um objetivo distinto e **não duplica responsabilidades**. Reutilizável em toda a plataforma.

**Os três domínios longitudinais (sem sobreposição):**
| Domínio | Unidade | O que faz | Origem/Visualização |
|---|---|---|---|
| **Registros de Saúde** | o evento | Linha do tempo de TODOS os eventos (consulta·exame·procedimento·vacina·medicamento·suplemento·internação·cirurgia·outros), em ordem cronológica. **Não é análise** — é a jornada. | visualização de eventos |
| **Histórico de Exames** | o exame / biomarcador | Repositório oficial dos exames (documento original·extração·biomarcadores·laboratório·solicitante·data·valor·doc fiscal·rastreabilidade). Ao abrir um exame/biomarcador: **evolução dos resultados no tempo** (ex.: Ferritina 2022→28, 2023→41, 2024→52; HbA1c 5,9→5,7→5,5→5,3). | **fonte oficial** + evolução por exame |
| **Composição Corporal** | o indicador corporal | **NÃO armazena exames.** Consolida indicadores corporais de várias origens e mostra a **evolução do corpo**. | visualização derivada (multi-origem) |

Regra de ouro: dado entra e é preservado no **Histórico de Exames** (o fato); **Composição Corporal** e demais
painéis **leem** dele (+ outras fontes) e apresentam evolução — **nunca duplicam o armazenamento**.

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

## 5. Fluxos
1. **Entrada** (sempre pela FONTE): bioimpedância/DEXA → **Exames** (FB-003) → processa → grava `body_metrics`;
   peso manual → registro direto; wearable/balança → HIP-001 → `body_metrics`. 2. **Visualização:** Composição
   Corporal lê `body_metrics`, agrupa por indicador, mostra evolução + origem. 3. **GLP-1:** deriva peso inicial/
   atual/meta/perda acumulada/ritmo médio/evolução de gordura e massa muscular/**preservação de massa magra**.

## 6. APIs
Leitura de `body_metrics` (por usuário). Sem escrita própria de exame (a escrita vem das FONTES). Contrato de
indicadores: `{ metric, value, unit, measured_on, source }`.

## 7. Segurança
RLS por usuário em `body_metrics`. LGPD (dado sensível). Origem preservada = auditabilidade.

## 8. Governança
Precedência ADR-000 > SPAGS > BOD-001. **Invariante (princípio Fato×Visualização):** Composição Corporal
**não armazena** exames nem duplica dados; consolida por leitura, sempre com origem. Mudança = emenda SPAGS antes.

## 9. Auditoria
Cada indicador exibe a origem (exame/manual/wearable). Rastreável até o exame-fonte quando vier de laudo (FB-003).

## 10. Evolução
- **Feito:** rename Medidas→Composição Corporal; princípio dos três domínios registrado.
- **Próximo (incremental):** rótulo de origem por ponto; série por indicador (peso/IMC/%gordura/massa muscular/
  massa magra/massa óssea/água/gordura visceral/TMB/circunferências); painel **GLP-1** (inicial/atual/meta/perda/
  ritmo/preservação de massa magra); ingestão de **DEXA** como exame (FB-003 estende bioimpedância).
