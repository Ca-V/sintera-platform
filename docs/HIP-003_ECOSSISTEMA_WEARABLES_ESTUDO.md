# HIP-003 — Estudo do Ecossistema de Wearables (reorientação da Fase 2)

**Status:** ESTUDO para decisão — aguardando escolha do 1º conector real. Sob [[ADR-000]] · [[HIP-001]].
**Reorientação (fundadora, 20/07):** a prioridade da Fase 2 deixa de ser "Withings" e passa a ser a **capacidade de
monitoramento contínuo por wearables**. A Composição Corporal segue existindo, mas nesta etapa é alimentada
sobretudo por **registro manual + importação de laudos de bioimpedância** (fontes automáticas de composição = depois).
Objetivo permanente: **infraestrutura genérica, escalável e reutilizável de conectores** — novos wearables entram
sem redesenho ([[hip_001_plataforma_integracoes]]). O adaptador **Withings (HIP-002) fica como conector de referência
que já provou a arquitetura**, não como prioridade.

---

## 1. O eixo que decide tudo: onde o dado vive

Antes de comparar fornecedores, uma distinção arquitetural separa o mercado em **três classes** — e ela, não a
"facilidade", governa a estratégia:

| Classe | Exemplos | Como se acessa | SINTERA (web) alcança HOJE? |
|---|---|---|---|
| **A. Agregadores de SO (no aparelho)** | **Apple Health**, **Health Connect (Android)** | SÓ no dispositivo; exige **app móvel nativo** que lê on-device e envia ao backend. **Não há API de nuvem, nem OAuth, nem REST.** | **Não** — depende de app móvel nativo |
| **B. Nuvens de fabricante (server-to-server)** | **Oura**, **WHOOP**, **Withings**, Fitbit, Polar, (**Garmin** — ver ressalva) | OAuth2 + REST + webhooks, backend↔backend | **Sim** — direto do backend web |
| **C. Agregadores comerciais (SaaS)** | **Terra**, **Rook**, Junction(Vital), Spike, Metriport | UMA integração → dezenas de fontes das classes A e B (Apple/Health Connect via **SDK móvel** deles) | **Parcial** — nuvens já; Apple/Health Connect ainda exigem app móvel (SDK deles) |

**Consequência imediata:** Apple Health e Health Connect — os de **maior cobertura** — são exatamente os que a SINTERA
**não** consegue integrar hoje (é um app web). Começar por eles obrigaria a construir **antes** um app móvel nativo:
um desvio grande, que atrasa a capacidade de monitoramento contínuo. As nuvens de fabricante (classe B) entregam a
capacidade **agora**, do backend, reutilizando a infra já pronta.

---

## 2. Análise comparativa por plataforma

Notas de acesso e maturidade confirmadas na documentação oficial e em fontes de mercado (jul/2026 — ver §7 Fontes).

| Plataforma | Classe | Cobertura de usuários | Dados-chave | API/OAuth/Webhook | Maturidade | Custo/restrição comercial | Dependência |
|---|---|---|---|---|---|---|---|
| **Apple Health** | A | **Altíssima** (base iOS; concentra dezenas de apps/dispositivos) | HR, HRV, sono, atividade, SpO₂, temperatura, peso… (o que os apps escrevem) | **Sem** API de nuvem; só via app iOS nativo (HealthKit on-device) | Framework maduro, mas **device-side** | Grátis, mas exige app iOS + revisão da App Store | Apple + **app móvel próprio** |
| **Health Connect** | A | **Altíssima** (base Android; sucede o Google Fit, cuja REST API foi descontinuada) | idem Apple (agrega apps Android) | **Sem** API de nuvem; app Android nativo + permissões no app Health Connect | Em consolidação (pós-Google Fit) | Grátis, mas exige app Android nativo | Google + **app móvel próprio** |
| **Oura** | B | Média (anel premium; usuários engajados em saúde/sono) | **Sono (estágios), HRV (5min), HR + IBI bruto, prontidão, SpO₂, temperatura, atividade** | **OAuth2 + webhooks (HMAC)**; REST v2; ~5000 req/5min | **Alta** (docs excelentes) | API grátis; requer o anel | Oura |
| **WHOOP** | B | Média (público performance/recuperação) | **Recuperação (HRV, RHR), Strain, Sono, resp., temp. pele, SpO₂** | **OAuth2 + webhooks**; 100 req/min, 10k/dia (~60–80 usuários/app no padrão; ampliável sob pedido) | **Alta** | API grátis; requer assinatura WHOOP | WHOOP |
| **Withings** *(já construído)* | B | Média (balanças/relógios/PA — forte em **composição corporal** e PA) | Peso/composição, PA, FC, sono, temperatura | **OAuth2 + Notify (webhook)**; 60 req/min | Alta | App grátis; **produção pode exigir plano comercial** | Withings |
| **Garmin** | B | **Alta** (grande base esportiva) | Atividade, HR, HRV, sono, SpO₂, stress, Body Battery | Push (webhook); **OAuth 1.0a** (legado) | Alta, porém… | **Programa de desenvolvedores SUSPENSO** (sem novas contas); exige **parceria/pessoa jurídica**; algumas métricas com licença | Garmin (**bloqueado hoje**) |
| **Terra** (agregador) | C | **500+ fontes** numa integração (inclui A e B) | atividade, sono, HR, **HRV**, VO₂max, body, ciclo, CGM; streaming em tempo real | REST/GraphQL/streaming + **SDK móvel** (Apple/Health Connect) | Alta; HIPAA/GDPR/SOC2 | **~US$399/mês** (anual; 100k créditos) + uso | **Terceiro no caminho do dado** |
| **Rook** (agregador) | C | Semelhante ao Terra; **tração na América Latina** (relevante p/ Brasil) | idem classe C | REST + SDK móvel | Alta | Pago (usage) | Terceiro no caminho do dado |

Observações:
- **Google Fit** foi descontinuado (sem novas inscrições desde mai/2024; REST API encerrando) → não é opção; o caminho
  Android é o **Health Connect** (classe A).
- **Personal Access Tokens** da Oura foram descontinuados (dez/2025) → OAuth2 é obrigatório (o que já temos).
- Agregadores alternativos: **Junction (ex-Vital)** agregou pedidos de laboratório; **Metriport** é open-source;
  **Open Wearables** oferece modelo self-hosted. Todos cobrem Apple/Health Connect via **SDK móvel** (não resolvem a
  ausência de app móvel — apenas encapsulam o SDK).

---

## 3. Aderência ao posicionamento da SINTERA

- **Continuidade e história longitudinal** ([[posicionamento_marca]]): monitoramento contínuo (HRV, sono, FC, atividade)
  é exatamente o sinal longitudinal que diferencia a plataforma → favorece **Oura/WHOOP** (dados densos no tempo).
- **Neutralidade de fornecedor** ([[hip_001_plataforma_integracoes]]): a infra já converte tudo em `CanonicalSample`;
  qualquer classe entra pelo mesmo contrato. Um agregador é só **mais um adaptador** (não um novo pipeline).
- **Privacidade/LGPD** ([[compliance_001_fase0_gate]]): classe B mantém o dado **fabricante → SINTERA** (sem
  intermediário). Classe C coloca um **terceiro no caminho** (mitigável: HIPAA/SOC2, mas é um processador a mais no
  RIPD). Classe A é a mais privada (on-device), mas exige app próprio.
- **Não-SaMD, factual** ([[principio_nao_producao_conteudo_clinico]]): vale para todas — apresentamos/organizamos, não
  interpretamos.

---

## 4. Recomendação arquitetural

### Q1 — Quais integrações a SINTERA deve construir **diretamente**?
As **nuvens de fabricante (classe B) maduras e acessíveis do backend web**, de alto valor para monitoramento contínuo
e onde o controle direto e o custo importam: **Oura, WHOOP** (e **Withings**, já feito). São baratas sobre a infra já
provada (OAuth2 + webhook + `CanonicalSample`), sem dependência de terceiro nem de app móvel.

### Q2 — Quando usar um **agregador** (Terra/Rook)?
Quando o objetivo é **cobertura de mercado em largura**, não profundidade num fabricante — e sobretudo para alcançar o
que **não dá para fazer direto**: **Apple Health, Health Connect** (via SDK móvel deles), **Garmin** (programa suspenso)
e a cauda longa (Fitbit, Polar, Samsung…). Um agregador troca **N integrações frágeis** por **uma**, com manutenção
terceirizada — ao custo de mensalidade + um processador a mais (LGPD). Recomendado adotar **quando** (a) houver app
móvel (para destravar Apple/Health Connect) e/ou (b) a demanda por largura justificar o custo. Para o Brasil, **Rook**
merece avaliação (tração local).

### Q3 — **Três plataformas** para a primeira fase (por valor + cobertura + sustentabilidade, não facilidade)
1. **Oura (direto)** — dado longitudinal de maior densidade (sono, HRV, prontidão, SpO₂, temperatura), API madura com
   webhooks. Entrega a **capacidade de monitoramento contínuo agora**, do backend web. *Valor + sustentabilidade.*
2. **WHOOP (direto)** — recuperação/strain/HRV; modelo de dados **diferente** (ciclos) e **rate limits** apertados →
   força a infra genérica a amadurecer (backoff, paginação, limites). *Endurece a arquitetura.*
3. **Agregador — Terra (ou Rook p/ Brasil)** — o motor de **cobertura**: destrava Apple Health + Health Connect (com app
   móvel) + Garmin + cauda longa por **uma** integração. *Cobertura de mercado e escala sem redesenho.*

> Withings (classe B, já pronto) permanece disponível como 4º, forte em **composição corporal + PA** — útil, mas não é o
> foco de "monitoramento contínuo".

### Q4 — **Sequência** que maximiza valor e fortalece a arquitetura
1. **Oura direto** — 2º conector real sobre a infra atual; adiciona o *stream* de sinais vitais/monitoramento (fluxo
   NOV-001 `vital_signs`). Prova a genericidade além do Withings, entrega a capacidade.
2. **WHOOP direto** — 3º conector; o modelo por ciclos + limites exercita e consolida as **capacidades genéricas**
   (rate-limit/backoff, paginação, janelas), deixando a infra robusta.
3. **Agregador (Terra/Rook)** como **novo *tipo* de adaptador** atrás do mesmo `CanonicalSample` — multiplica a
   cobertura (inclui A e Garmin) **sem** redesenho.
4. **App móvel (trilha separada)** — destrava os agregadores de SO (Apple Health/Health Connect), a cobertura máxima.

Cada passo direto **fortalece a infra** (auth, modelo de dados, limites, webhooks distintos); o agregador então
**multiplica cobertura** sem tocar a arquitetura — exatamente o objetivo de "incorporar novos wearables sem redesenho".

### Decisão pedida: **começar por agregadores de SO (Apple/Health Connect) ou por fabricantes?**
**Por fabricantes (nuvens diretas), começando pela Oura** — justificativa técnica e estratégica:
- **Técnica:** Apple Health/Health Connect **não têm API de nuvem**; exigem **app móvel nativo** que a SINTERA ainda
  não possui. Começar por eles obrigaria a construir um app antes de entregar qualquer capacidade — desvio caro. As
  nuvens diretas entregam **agora**, do backend, sobre a infra já pronta.
- **Estratégica:** monitoramento contínuo de alto valor (HRV/sono/prontidão) chega primeiro pela Oura/WHOOP; a
  **cobertura ampla** (Apple/Health Connect/Garmin) vem depois via **agregador** — sem N integrações frágeis. Assim
  ganhamos valor cedo e preservamos a rota para a cobertura máxima, sem hipotecar a arquitetura.

---

## 5. Riscos e decisões em aberto
- **R1 — App móvel é pré-requisito de cobertura máxima:** Apple/Health Connect dependem dele. Decidir *quando* entra a
  trilha mobile (impacta o "quando" do agregador de SO).
- **R2 — Custo do agregador:** ~US$399+/mês. Justifica-se com largura/tração; avaliar Rook (Brasil) vs Terra.
- **R3 — Garmin bloqueado:** programa de desenvolvedores suspenso → só via agregador/parceria por ora.
- **R4 — LGPD com agregador:** processador extra no caminho do dado (RIPD/DPA). Classe B evita isso.
- **R5 — Hardware pago (Oura/WHOOP):** base menor que Apple/Android; é profundidade, não largura (por isso o agregador
  cobre a largura).

## 6. Decisões que a fundadora precisa tomar
- **D-A:** confirmar **Oura como 1º conector real** (recomendado) — ou WHOOP.
- **D-B:** quando iniciar a trilha do **app móvel** (destrava Apple/Health Connect).
- **D-C:** agregador — **Terra ou Rook**, e em que fase adotá-lo.

## 8. Adendo — aprofundamento de ACESSO (20/07, revisão após ressalva da fundadora)

Aprofundamento sobre "quem consegue se cadastrar e em que condições" — corrige/qualifica a §2:

- **Oura — permite terceiros SIM**, ao contrário do receio inicial: registra-se um app OAuth2 (Client ID/Secret) e
  "qualquer pessoa pode compartilhar seus dados Oura com um serviço de terceiros". **Porém:** limite de **10 usuários**
  até aprovação, e para **desenvolver/homologar é preciso ter dados** — ou seja, **possuir um anel** (ou um usuário
  com anel). Então: integra empresas, mas há a barreira prática de **possuir o dispositivo para construir**.
- **WHOOP — confirmada a barreira:** para desenvolver, o **próprio desenvolvedor precisa ter assinatura + dispositivo
  WHOOP**. Limite de 10 membros no dev; aprovação mensal para produção. Barreira de dispositivo **mais forte** que a Oura.
- **Garmin — FECHADO a novos inscritos:** o Garmin Connect Developer Program (que cobre **tanto a Health API quanto a
  Activity API**) está **pausado** — o formulário de novos parceiros foi removido, sem data de reabertura. Integrações
  existentes seguem, mas **não é possível obter acesso novo hoje**. ⇒ Garmin direto **não é viável agora** (só via
  agregador ou parceria); **não é questão de app móvel**.
- **Strava — viável, self-serve, SEM dispositivo e SEM app móvel:** OAuth2 + webhooks server-side; conta grátis basta.
  **Base enorme** e funciona como **agregador de atividade** (usuários sincronizam Garmin/Wahoo/Apple no Strava). **MAS:**
  (a) é **atividade** (corridas/pedaladas/GPS/FC de treino) — **não** monitoramento contínuo (sem HRV/sono/SpO₂);
  (b) **termos de API restritivos** para uso de saúde/médico e armazenamento (endurecidos em 2024) → **exige revisão
  jurídica** antes de usar numa plataforma de saúde; (c) rate limit 200/15min, 2000/dia.

**Releitura estratégica (importante):** **Apple Health e Health Connect já AGREGAM, no celular, os dados de Garmin,
Oura, WHOOP, Fitbit** que o usuário sincroniza. Logo, o **caminho prático para "dados do Garmin" hoje** — com o
programa dele fechado — é **via celular (Health Connect/HealthKit)** ou **via agregador**, não a API direta do Garmin.
Isso reforça o **app móvel** como a peça de maior alavancagem de cobertura. Decisão da fundadora: **adicionar ao
planejamento a construção do app móvel da SINTERA** (destrava Apple/Health Connect → e, por tabela, Garmin/Oura/WHOOP).

### Sugestão revisada de sequência
1. **Strava (direto, web, agora)** — 1º conector real self-serve, sem dispositivo/app; valida a infra com um terceiro
   real e traz **atividade** (inclui Garmin exportado ao Strava). **Condição:** revisão dos termos de uso p/ saúde.
2. **App móvel SINTERA + Health Connect (Android) + Apple Health (iOS)** — **espinha dorsal de cobertura**; captura
   Garmin/Oura/WHOOP/Fitbit via celular sem depender de APIs fechadas.
3. **Agregador (Terra/Rook)** — alternativa/aceleração para Garmin/Oura/WHOOP como fontes de nuvem sem esperar o app;
   **única via de Garmin direto** hoje.

## 7. Fontes
- Apple HealthKit (sem API de nuvem; on-device): developer.apple.com/documentation/healthkit · openwearables.io
- Health Connect / fim do Google Fit: developer.android.com/health-and-fitness/health-connect · spikeapi.com
- Oura API v2 (OAuth2/webhooks/dados): api.ouraring.com/v2/docs · support.ouraring.com · openwearables.io
- WHOOP (OAuth2/webhooks/limites): developer.whoop.com
- Garmin (programa suspenso; OAuth1.0a; parceria): developer.garmin.com/gc-developer-program/health-api · openwearables.io
- Terra (agregador/pricing/SDK): tryterra.co · tryterra.co/pricing · healthapiguy.substack.com
- Rook / Junction(Vital) / Metriport (alternativas): tryrook.io · openwearables.io/compare
- Oura (terceiros permitidos; limite 10 + aprovação; portal 2025): partnersupport.ouraring.com · cloud.ouraring.com/docs
- WHOOP (dev exige assinatura+dispositivo; aprovação mensal): developer.whoop.com/docs/developing/getting-started
- Garmin (programa PAUSADO a novos; Health+Activity API): developer.garmin.com/gc-developer-program · themomentum.ai
- Strava (OAuth2/webhooks server-side; termos; limites): developers.strava.com · openwearables.io/blog
