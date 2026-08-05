# MOBILE-031 — Paridade Mobile↔Web: status de cobertura, decisões abertas e propostas

Documento vivo (continuidade ADR-012 / GOV-002). Consolida o estado da execução da paridade total Mobile↔Web
após a entrega de Composição Corporal, Relatório e Monitoramento, e registra as decisões pendentes e as
propostas de melhoria (diretriz: *questionar a própria Web e propor melhorias que beneficiem ambos antes de
implementar*).

## 1. Cobertura por domínio (itens top-level da Sidebar = referência de produto)

Todos os itens **top-level da Sidebar** estão à paridade funcional no Mobile:

| Grupo | Item (Sidebar) | Rota Web | Tela Mobile |
|---|---|---|---|
| Acompanhamento | Agenda | /dashboard/agenda | AgendaScreen |
| Acompanhamento | Histórico de Saúde | /dashboard/timeline | TimelineScreen |
| Acompanhamento | Histórico de Exames | /dashboard/saude | HistoricoExamesScreen |
| Acompanhamento | Composição Corporal | /dashboard/medidas | ComposicaoScreen |
| Acompanhamento | Monitoramento | /dashboard/sinais-vitais | MonitoramentoScreen |
| Documentos | Exames | /dashboard/exams | ExamsList/Detail/Upload |
| Minha Saúde | Condições · Medicamentos · Suplementos · Recursos · Hábitos · Ciclo | … | Conditions/Medications/Resources/Habits/Ciclo |
| Organização | Despesas · Relatórios | /dashboard/gastos · /relatorio | Despesas/Relatorio |
| — | Configurações | /dashboard/configuracoes | Configuracoes |

Infra compartilhada como fonte única em `@sintera/core` + `@sintera/api-client` (period, omics/domains, body/*,
report/assemble; api-client body/report). Ver [[mobile_paridade_execucao_estado]].

## 2. Rotas Web NÃO surgidas na Sidebar / com trava de governança

- **/dashboard/omics (Exames de ômica)** — ✅ **ENTREGUE** (decisão: bridge). Ver §3.
- **/dashboard/conexoes** — HIP-001 (captura automática / wearables) = **Fase 2**. Governança: nenhum código de
  Fase 2 antes das etapas do ecossistema aprovadas → **não construir** agora. O banner "Conexões" do
  Monitoramento foi omitido no Mobile (sem destino); substituído por aviso "captura por dispositivo em breve".
- **/dashboard/prevencao** ("PRÉVIA INTERNA — acompanhamentos por fase da vida") e **/dashboard/insights** —
  **não** estão na Sidebar nem linkadas na UI de produção. Não são paridade de produto no momento (rotas
  internas/preview). Reavaliar se/quando forem promovidas ao produto.

## 3. Exames de ômica (omics) — RESOLVIDO: bridge (ADR-020) ✅

Decisão da fundadora (2026-08-05): **Opção 1 — bridge**. Entregue: rotas `/api/omics/*` autenticam por Cookie OU
Bearer (`omicsAuth` → `getAuthedSupabase`), o Mobile reusa a lógica de servidor; módulo `@sintera/api-client/omics`
(leituras via ponte; escritas diretas RLS); telas `OmicsListScreen` + `OmicsPanelScreen` (N1–N4 + entrada manual
com resolução de catálogo + exclusão), ligadas ao DocumentosStack e a partir de Exames. A **ingestão por IA do
laudo** (upload PDF/foto/CSV/JSON → transcrição) permanece captura de device + edge (exceção de plataforma) — no
Mobile, cria-se o painel e adicionam-se resultados manualmente (ou importa-se na Web). Registro histórico das
opções abaixo.

### (histórico) Opções avaliadas

O domínio ômica é o único item user-facing ainda sem paridade. Ele é substancialmente diferente dos demais:

- **Leituras via rotas de servidor** `/api/omics/panels`, `/api/omics/panels/[id]`, categorias, features por
  categoria, histórico por feature — que encapsulam joins + resolução de identidade de catálogo. Reproduzir
  direto-na-tabela no api-client **duplicaria lógica de servidor** (contra a diretriz de não-duplicação).
- **Ingestão por IA/edge** (upload de PDF/foto/CSV/JSON → transcrição) — captura de device + função edge; toca
  restrições de conteúdo clínico (RDC 657) e é, em parte, exceção de plataforma.
- **Detalhe N1→N4** (resumo · categorias · features · histórico temporal) + **entrada manual com resolução de
  identidade** — o mais complexo do produto.

**Opções (decisão de arquitetura/infra compartilhada — fundadora decide):**

1. **Bridge (ADR-020) para as rotas `/api/omics/*`** — o Mobile consome as MESMAS rotas do servidor via Bearer
   (como já se fez em `/api/account` e `/analyze`). Reusa 100% da lógica de servidor, zero duplicação; exige
   adaptar as rotas para aceitar Bearer (hoje provavelmente cookie-only). Melhor p/ não-duplicação; detalhe
   completo N1–N4.
2. **Convergir as leituras de ômica para o `@sintera/api-client`** (direto-na-tabela + resolução no core) —
   beneficia Web+Mobile (Web passaria a consumir o mesmo caminho), mas é refactor maior da Web e reimplementa a
   resolução de catálogo no pacote compartilhado. É a melhoria arquitetural "de fundo".
3. **Escopo mínimo agora**: lista + criar painel vazio + visão somente-leitura (N1/N2/N3), deixando ingest-IA e
   entrada manual como incremento posterior. (Atenção: fere "sem simplificações" — só se aprovado como recorte
   deliberado.)
4. **Adiar** ômica até depois dos demais ajustes/estabilização (é sub-área de Exames, não bloqueia o núcleo).

Recomendação: **Opção 1 (bridge)** para entregar o detalhe completo sem duplicar a lógica de servidor, com a
Opção 2 como convergência de fundo posterior. Aguardando decisão.

## 4. Propostas de melhoria (beneficiam Web + Mobile) — documentar-e-propor antes de implementar

1. **Editar altura no Perfil (Mobile).** O IMC (Composição) depende de `profiles.height_cm`, mas o contrato
   Perfil do Mobile (MOBILE-019) só edita name/phone → usuário só-Mobile nunca calcula IMC. Proposta: incluir
   `height_cm` (e afins de composição) no `ProfileEditable`, ou expor a edição de altura no contexto de
   Composição. Impacto: contrato Perfil (compartilhado) — decisão de infra.
2. **Relatório: resumo executivo + índice + síntese de biomarcadores organizados.** A Web mostra contagens por
   seção, "última atualização", índice navegável e a síntese "N organizados em M categorias · K fora da faixa"
   (via `assembleOrganizedBiomarkers`). Hoje é enriquecimento só-Web. Proposta: mover `assembleOrganizedBiomarkers`
   (ou uma versão pura) para o core e gerar esses blocos no `assembleReport` (fonte única) → Web e Mobile ganham.
3. **Convergir o render do Relatório da Web para o `assembleReport` do core** (hoje a Web mantém JSX inline). As
   REGRAS já são fonte única no core; a convergência do arranjo elimina a duplicação de apresentação — fazer por
   blocos reversíveis (proibido rewrite de 1093 linhas de uma vez).
4. **Proveniência por item no Relatório** (link ao documento de origem por exame/medida) — hoje textual; on-device
   exigiria navegação cross-tab a partir de uma tela de compilação. Avaliar valor vs. ruído.
5. **Enriquecer a Home Shell (slots Summary/Timeline/Insights).** O dashboard Web mostra estatísticas (exames,
   pendentes, biomarcadores), jornada (próximo/último evento) e exames recentes. Hoje esses slots do Mobile são
   reservados (Home Shell aceita no Inc3). **Restrição arquitetural:** `INV-HOME-001` (tests/mobile/
   home-is-composition.test.ts) PROÍBE qualquer import de `@sintera/api-client`/Supabase dentro de
   `apps/mobile/src/presentation/home/` — a Home é composição pura. Portanto, preencher os slots exige um
   **padrão de injeção** (um container acima da Home lê os dados via api-client e injeta nos slots por props, ou
   os slots recebem render-props dos módulos de domínio) definido em ADR-018/MOBILE-014. É um **incremento de
   arquitetura próprio** (não um "fill" rápido) — proposto para decisão, sem implementação unilateral. Alinha com
   o roadmap ("cada domínio preenche um slot da Home") e melhora a UX de entrada do app.

## 5. Estado do APK

APK consolidado (perfil `preview`) refeito a partir do HEAD com Composição + Relatório + Monitoramento + correções
de auditoria. O 1º build consolidado foi CANCELADO ainda na fila para incluir as correções da auditoria de paridade
(homologação deve VALIDAR, não descobrir lacuna).
