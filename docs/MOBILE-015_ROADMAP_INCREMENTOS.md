# MOBILE-015 — Roadmap oficial dos Incrementos Mobile (Onda 1)

- **Status:** **OFICIALIZADO** (fundadora, 2026-07-24). **Refina/supersede a ordem de incrementos do
  [MOBILE-001](MOBILE-001_PLANO_EXECUTIVO_RN.md)** para refletir a evolução do produto (mobile como interface
  principal; a Home como **composição** preparada para receber capacidades independentes — [ADR-018](adr/ADR-018_HOME_COMPOSICAO_DE_SLOTS.md)).
- **Natureza:** documento de planejamento. **Nenhuma implementação.** Governança da Onda 1 preservada.

## Lógica arquitetural da ordem

A sequência segue quatro fases, do estável para o dependente:

1. **Infraestrutura** — navegação e Home (a casca sobre a qual tudo é composto).
2. **Domínios fundamentais** — Perfil e o pilar de Exames (visualizar → adicionar → registrar).
3. **Orquestração** — o RegistrationHub, que passa a encaminhar para **funcionalidades reais** (não placeholders).
4. **Features dependentes de dados** — Composição Corporal, Agenda e Insights, que só entregam valor com uma
   base de saúde já existente.

## Roadmap

| # | Incremento | Status | Justificativa (fundadora) |
|---|------------|--------|---------------------------|
| 1 | **Autenticação** | ✅ ACCEPTED ([MOBILE-008](MOBILE-008_INCREMENTO1_ACEITE.md)) | Base da experiência autenticada. |
| 2 | **Navegação** | ✅ ACCEPTED ([MOBILE-013](MOBILE-013_INCREMENTO2_ACEITE.md)) | Infraestrutura de navegação (Bottom Tabs + stacks; projeção do SSOT). |
| 3 | **Home Shell** | ⏳ implementado; homologação pós-16 GB ([MOBILE-014](MOBILE-014_PLANEJAMENTO_INCREMENTO3_HOME.md)) | Casca da Home como composição de slots (ADR-018). |
| 4 | **Perfil** | ⬜ próximo | Domínio autocontido; fornece dados que vários módulos usarão; não depende de exames/insights; completa a base autenticada. |
| 5 | **Histórico de Exames** | ⬜ | Pilar da proposta de valor da SINTERA; base para diversos recursos posteriores. |
| 6 | **Upload de Exames** | ⬜ | Complementa o histórico (visualizar → adicionar); sequência intuitiva para o usuário. |
| 7 | **Registro Manual** | ⬜ | Outra forma de alimentar o mesmo domínio de dados. |
| 8 | **RegistrationHub** | ⬜ | Orquestração — só faz sentido quando já houver **destinos úteis reais** (não placeholders). HUB-001. |
| 9 | **Composição Corporal** | ⬜ | Depende de base de saúde existente. |
| 10 | **Agenda** | ⬜ | Depende de base existente. |
| 11 | **Insights** | ⬜ | Consome informações de **múltiplos domínios** — precisa da consolidação dos dados. |

## Notas de sequenciamento

- **RegistrationHub adiado para o #8 (e não agora):** embora central para a experiência, hoje ele apontaria
  para capacidades ainda inexistentes no mobile — viraria uma camada de navegação para telas incompletas. É
  mais consistente introduzi-lo quando já houver destinos úteis (Perfil + domínio de Exames prontos).
- **Insights por último (#11):** por depender da consolidação de dados de vários domínios.
- Cada domínio futuro **preenche um slot** da Home Shell (ADR-018) **sem redesenhá-la** — a Home já está pronta
  para isso (Summary/Timeline/Insights reservados).

## Governança (Onda 1)

- **Nenhum incremento funcional novo começa antes da homologação/aceite do anterior.** O Incremento 4 (Perfil)
  só inicia após o aceite do Incremento 3.
- Cada incremento aceito = **marco verificável (tag)**, base do seguinte (nasce do tag do anterior).
- Integração ao ramo principal permanece condicionada ao **encerramento da Onda 1** + critérios de integração.
- Reordenações futuras deste roadmap são decisão de produto da fundadora (documentar a mudança).
