# HIP-006 — Roadmap Arquitetural de Integrações (monitoramento contínuo · 2 anos)

**Status:** ROADMAP para aprovação. Consolida HIP-003/004/005. Sob [[ADR-000]] · [[HIP-001]] · [[compliance_001_fase0_gate]].
**Escolha do 1º conector: SUSPENSA** até este roadmap ser aprovado (diretriz da fundadora, 20/07).

## 0. Redefinição da Fase 2
O objetivo da Fase 2 **não é integrar uma plataforma**, e sim **construir o ecossistema de monitoramento contínuo da
SINTERA**. **Filtro de decisão:** toda integração é avaliada pela **contribuição para esse ecossistema** — valor ao
usuário, cobertura de mercado, maturidade da API e sustentabilidade técnica — não pela facilidade nem pelo fornecedor.

## 1. Princípio invariante (a arquitetura não muda)
Toda categoria converge para o **mesmo contrato canônico**: `CanonicalSample` → `propagateSamples` (bruto +
projeção) → Monitoramento/Composição + **NOV-001**. Web, Mobile e Agregador são **apenas adaptadores** desse contrato.
**Nenhuma categoria — inclusive agregadores — substitui a arquitetura da SINTERA;** todas a alimentam. Isso garante o
objetivo permanente: **novos conectores entram sem mudança estrutural**.

## 2. Reclassificação por categoria estratégica

| Categoria | O que é | Plataformas | Papel no ecossistema | Acesso hoje |
|---|---|---|---|---|
| **1 · Conectores Web** | Nuvem OAuth, backend↔backend | **Strava, WHOOP, Oura, Withings** | Profundidade e independência por fonte | Direto do backend; barreiras próprias (device/termos) |
| **2 · Conectores Mobile** | Dependem de app nativo (dado on-device) | **Apple Health, Health Connect** | **Cobertura máxima** — agregam no celular Garmin/Oura/WHOOP/Fitbit | Requer **app móvel SINTERA** |
| **3 · Agregadores** | Uma integração → dezenas de fontes | **Terra, Rook** | **Acelerador de cobertura** (cauda longa, Garmin, streaming) — **não** substituto | Pago; SDK móvel p/ Cat. 2 |

**Garmin:** rebaixado de "1º conector obrigatório" para **item estratégico condicionado** — acesso direto é decisão
**comercial** (programa fechado), então entra **quando o cenário de acesso permitir** (via Cat. 3 ou parceria).

## 3. Q1 — Arquitetura que maximiza cobertura em 2 anos
Uma **arquitetura em camadas**, não uma aposta única:

1. **Espinha dorsal (Cat. 2 — Mobile):** app SINTERA lendo **Health Connect + Apple Health** cobre **a maioria** dos
   usuários com **duas** integrações, porque o celular já concentra os dados de quase todos os wearables. É o maior
   ganho de cobertura por esforço e a base do monitoramento contínuo (HR/HRV/sono).
2. **Profundidade e independência (Cat. 1 — Web):** poucos conectores diretos de alto valor, onde controle e ausência
   de intermediário importam (e onde o dado não depende do celular). Complementam a espinha dorsal.
3. **Acelerador de largura (Cat. 3 — Agregador):** aciona-se sob demanda para a **cauda longa** e o que não dá direto
   (Garmin, streaming), sem construir N integrações frágeis.

**Cobertura resultante:** Mobile alcança a base ampla; Web adiciona profundidade/independência; Agregador fecha lacunas.
Nenhuma camada bloqueia a outra — todas escrevem no mesmo canônico.

## 4. Q2 — Papel do app móvel (produto estratégico, NÃO um "bridge")
O app **nasce como produto de primeira classe da SINTERA**, não como mero túnel para Apple/Health Connect. A missão do
**MVP** é enxuta — **autenticar · conectar Apple Health · conectar Health Connect · sincronizar com a infra** — mas a
**arquitetura do app** já prevê evolução, para **evitar uma segunda reconstrução**:
- **Base compartilhada:** mesma identidade (Supabase Auth) e o **mesmo backend canônico**; o app é mais uma superfície
  dos pilares existentes, não um silo.
- **Arquitetura modular por capacidade:** o módulo *health-sync* é o primeiro, mas há "encaixes" previstos para
  **notificações push** ([[notif_001_infraestrutura_unica]]), **captura de dados/documentos** ([[hub_001_registration_hub]]),
  **acompanhamento longitudinal** ([[care_001_espaco_colaborativo]]) e acesso offline.
- **Consequência de roadmap:** decisões de stack/estrutura (navegação, storage offline, camada de dados, deep links,
  push) são tomadas **agora** pensando no produto completo — mesmo que só o health-sync seja construído no MVP.

## 5. Q3 — Quando Terra/Rook passam a gerar valor > custo/dependência
Não na primeira onda. Os **gatilhos** para adotar um agregador (todos, idealmente):
- **Cobertura:** demanda concreta por fontes que Mobile+Web não cobrem (cauda longa, **Garmin** com programa fechado,
  streaming em tempo real).
- **Economia de escala:** volume de usuárias ativas em que o custo por usuário do agregador **< custo de construir/manter
  N conectores diretos**.
- **Caso de negócio:** um plano pago/parceria B2B2C que **financie** a mensalidade (~US$399+/mês).
Revisitar **após** o Mobile MVP + 1–2 conectores Web estarem no ar e os dados de uso mostrarem as lacunas. Para o
Brasil, **Rook** merece preferência de avaliação (tração local); Terra para amplitude/streaming.

## 6. Q4 — As TRÊS integrações da primeira onda de monitoramento
Avaliadas por valor + cobertura + maturidade + sustentabilidade (não facilidade):
1. **Health Connect (Android · Cat. 2)** — espinha dorsal de cobertura em Android; HR/HRV/sono de qualquer dispositivo.
2. **Apple HealthKit (iOS · Cat. 2)** — espinha dorsal em iOS; idem. *(1 e 2 = o app móvel MVP.)*
3. **Um conector Web (Cat. 1) para validar a categoria e dar dado real imediato.** Recomendação: **Withings** — o
   adaptador **já está construído e testado** (HIP-002), é web puro (sem app), entrega **vitais reais** (PA, FC, peso)
   sem barreira de posse de dispositivo exótico nem gate jurídico. Alternativa de atividade: **Strava** (após o gate de
   termos, §8) — mas é atividade, não monitoramento contínuo.

> Por que não Oura/WHOOP na 1ª onda: exigem **possuir o dispositivo** para desenvolver/homologar (fricção real). Entram
> na 2ª onda, conforme aquisição de device. Por que não Garmin: programa **fechado** (§2).

## 7. Roadmap em ondas (horizonte ~2 anos)
- **Onda 0 — Fundação canônica de ingestão (agora; backend; sem dependências externas):** endpoint
  `POST /api/connectors/mobile/ingest` (reusa `propagateSamples`) + **vocabulário de vitais contínuos** (HRV, sono, FC
  de repouso…) + fluxo NOV-001 `monitoramento`. **Habilita Mobile E Web ao mesmo tempo.** É o passo que destrava tudo.
- **Onda 1 — Primeira onda de monitoramento:** **App MVP (Health Connect + Apple HealthKit)** + **1 conector Web**
  (Withings pronto, ou o escolhido). Entrega monitoramento contínuo real, do celular, no Monitoramento/NOV-001.
- **Onda 2 — Profundidade Web + atividade:** Oura/WHOOP (conforme device) + **Strava** como **Atividade Física** (após
  gate jurídico) + evolução do app (notificações/captura).
- **Onda 3 — Largura via Agregador:** Terra/Rook para cauda longa + **Garmin** (se o cenário de acesso permitir) +
  streaming. Acionado pelos gatilhos da §5.
- **Contínuo — Mobile como produto:** notificações, captura de documentos, longitudinal, offline (pilares existentes).

Cada onda **fortalece a infra** (auth/limites/webhooks/push distintos) e **amplia cobertura sem redesenho**.

## 8. Análise dos Termos de Uso do Strava (gate jurídico — pesquisa)
API Agreement do Strava (vigente desde nov/2024, revisões 2026):
- ✅ **Exibir ao próprio usuário:** dados de um usuário só podem ser exibidos **a ele mesmo** — compatível com a SINTERA
  (plataforma pessoal; mostramos ao dono).
- ⚠️ **Proibição de IA/ML:** é **proibido** usar dados do Strava em modelos de IA/ML ou similares. Conflita com a
  **inteligência longitudinal (V3)** se aplicada a esses dados. A SINTERA é factual ([[principio_nao_producao_conteudo_clinico]]),
  mas qualquer análise/insight futuro sobre dados do Strava violaria — **limita o Strava a "espelho de atividade"**.
- ⚠️ **Uso de saúde/médico + armazenamento:** restrições e **auditorias** de conformidade; exige **confirmação jurídica**
  do caso de uso da SINTERA antes de liberar.
- ⚠️ **Design "complementar ao Strava"** e proibição de replicar funções — restringe a apresentação.
- **Conclusão:** Strava é utilizável como **espelho de atividade do próprio usuário**, mas é **frágil como pilar** de uma
  plataforma de saúde com ambição de inteligência longitudinal. Recomendação: só após **sign-off jurídico**, e ciente de
  que aqueles dados ficam **fora** de recursos de IA/insights.

## 9. Decisões da fundadora (após aprovar este roadmap)
- **D-ROADMAP:** aprovar o roadmap em ondas (§7) e as três integrações da 1ª onda (§6).
- **D-STACK / D-PLAT:** React Native+Expo (recomendado) vs Flutter; Android/Health Connect ou iOS primeiro.
- **Contas:** Apple Developer + Google Play Console + dispositivos de teste.
- **1º conector:** definido **só depois** deste roadmap (a escolha segue suspensa).
- **Strava:** condicionado ao sign-off jurídico (§8).

## 10. O que posso iniciar sem novas dependências (sob aprovação)
A **Onda 0** (endpoint `/ingest` + vocabulário de vitais + fluxo NOV-001 `monitoramento`) é **puro backend**, reusa a
infra existente e **não depende** de app, contas de loja ou escolha de fornecedor — adianta a espinha dorsal para Mobile
e Web simultaneamente.
