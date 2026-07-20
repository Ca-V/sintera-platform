# V2 — Plano de Execução (Captura automática de dados)

**Status:** PLANEJAMENTO — aguardando aprovação. **Nenhum código antes da aprovação.** Mesmo nível de profundidade da
V1; começa pela **transformação ao usuário**, só depois a arquitetura. Sob [[ROADMAP_CONCLUSAO_PLATAFORMA]],
[[HIP-001_PLATAFORMA_INTEGRACOES]], [[WEA-001_WEARABLES_DOMAIN]].

## Narrativa da versão (a transformação, não a tecnologia)
> **A SINTERA passa a construir automaticamente a sua história de saúde.**

A plataforma deixa de depender apenas do registro manual: os dados começam a **entrar sozinhos** e a jornada se
constrói por conta própria. **Wearables, conectores e sincronização são MEIOS** para essa transformação — não o objetivo.

## As 4 perguntas da versão
1. **Problema do usuário:** hoje a história de saúde depende de registro manual — trabalhoso, fácil de esquecer, incompleto.
2. **Transformação:** a SINTERA passa a **construir a história sozinha** (dados automáticos).
3. **Como saber que concluiu:** critério de sucesso + Definition of Done abaixo.
4. **Por que antes da V3:** a Inteligência Longitudinal (V3) só é poderosa com **fluxo contínuo e rico de dados**. Sem
   captura automática, a V3 teria pouco a analisar.

## ⭐ Critério de SUCESSO da versão
> **Ao finalizar a V2, o usuário conecta uma fonte e vê a sua história de saúde crescer sozinha, sem registro manual —
> e reconhece isso como o motivo para usar a SINTERA.**

## ✨ Aha Moment (momento de encantamento — o planejamento inteiro o maximiza)
> **Conectar uma fonte e ver o primeiro dado surgir automaticamente no histórico** — e, **dias depois, abrir a
> plataforma e perceber que ela acompanhou a evolução sem nenhuma ação manual.**

Decisões que protegem esse momento: **conexão com o mínimo de atrito** · **feedback imediato e visível** do 1º dado ·
o dado **cai nas visões longitudinais que já existem** (Monitoramento / Composição / Histórico de Exames) para parecer
**integrado**, não um silo novo · **primeiro dado rápido** (não esperar dias). O sucesso da V2 se mede pela clareza
desse momento.

## 🔒 Princípios arquiteturais PERMANENTES das integrações
1. **Toda integração é SUBSTITUÍVEL** (já constitucional no [[HIP-001_PLATAFORMA_INTEGRACOES]]): o usuário interage com a
   SINTERA; a SINTERA conversa com os conectores. Nenhum wearable/lab/provedor influencia a experiência. Todo conector é
   um **adaptador** → **representação canônica (UCDA)**; trocar/remover um provedor **não muda a experiência**.
2. **Toda sincronização é IDEMPOTENTE** (fundadora 19/07): rodar 1×, 10× ou após falha → **resultado final idêntico**.
   Sem duplicações nem inconsistências. Chave de idempotência por (fonte · faixa temporal · item canônico); *upsert*, nunca
   *append* cego. Essencial ao integrar wearables + labs + prontuários ao mesmo tempo. (HIP-001 já prevê "idempotente por faixa".)
3. **Toda integração tem ESTADO VISÍVEL ao usuário** (fundadora 19/07): **Conectado · Última sincronização · Sincronizando
   · Atenção necessária · Erro de autenticação · Fonte dos dados.** O usuário **nunca** deve se perguntar se os dados estão
   atualizados — a confiança na automação depende dessa transparência. (Alimenta o Painel Operacional de Integrações do HIP-001.)

## Estratégia (fundadora 19/07): PROVAR A ARQUITETURA end-to-end antes de multiplicar conectores
O 1º épico não é "integrar um ecossistema" — é **provar que toda a arquitetura de sincronização funciona**, com **UM**
fluxo impecável: **conectar → autorizar → sincronizar → persistir → rastrear origem → atualizar a Timeline → atualizar os
indicadores → atualizar a Composição Corporal (quando aplicável) → mostrar ao usuário que tudo aconteceu automaticamente.**
Quando esse fluxo estiver impecável, **adicionar novos conectores vira quase repetição** (a força do HIP-001).

## ⚠️ DECISÃO DE ARQUITETURA — agregadores (Health Connect / Apple Health) são ON-DEVICE (mobile)
Ponto crítico a validar com a fundadora: **Health Connect (Android) e Apple Health (iOS) são APIs on-device de apps
NATIVOS — não têm API web.** A SINTERA é uma **plataforma web** (Next.js); um app web **não lê** o Health Connect nem o
HealthKit diretamente. Portanto, começar por Health Connect implica **antes** ter o **app mobile companheiro** (MOB-001,
hoje "a criar/futuro"). Duas rotas:

- **Rota A (recomendada) — provar o end-to-end AGORA, no web, com um conector CLOUD:** um provedor com **API de nuvem
  (OAuth servidor-a-servidor)** — ex.: **Withings** (balança/composição + atividade → continuidade direta com a jornada de
  peso da V1), Oura, Fitbit, Garmin. Prova **todo** o fluxo (consentimento OAuth → sync → UCDA → Timeline/indicadores/
  Composição → estado visível → idempotência) **sem depender de mobile**. Health Connect/Apple Health entram **depois**,
  como **camada agregadora**, quando o MOB-001 existir — reaproveitando exatamente a mesma arquitetura HIP-001.
- **Rota B — Health Connect primeiro:** exige **construir o MOB-001 (app mobile) como pré-requisito da V2** — escopo
  grande, adia o Aha e mistura duas transformações (mobile + captura automática) numa versão só.

**Recomendação:** **Rota A.** Ela atende MELHOR ao seu objetivo #2 (provar a arquitetura end-to-end rapidamente e com
baixo risco), mantém a neutralidade/substituição do HIP-001, e entrega o Aha **na plataforma que já existe hoje**. O
Health Connect (sua escolha) continua sendo o **agregador certo** — só chega junto do app mobile, como evolução natural.

## Priorização por VALOR PERCEBIDO (após a arquitetura provada)
frequência · volume · impacto na experiência · expectativa · potencial de diferencial:
1. **1º conector cloud** (provar o end-to-end) — recomendo **Withings** (peso/composição = continuidade com a V1 + atividade).
2. **Agregadores** (Health Connect → depois Apple Health) — quando existir o **MOB-001**; máxima alavancagem (muitas fontes).
3. **CGM / pressão** (crônicos) — segmento de alto valor.
4. **Labs / FHIR / RNDS** — trilha própria (modalidade "resultado", não série contínua).

## Épicos (ordem — provar antes de multiplicar)
- **Épico 1 — Fundação HIP-001 (sem interface complexa):** registro de conectores + **autorização/revogação** +
  **mapeamento → UCDA/`body_metrics`** + **log de sincronização idempotente** (chave fonte·faixa·item) + proveniência.
  Única infra nova (≥2 consumidores). Validada com **um** conector real.
- **Épico 2 — PRIMEIRA SINCRONIZAÇÃO END-TO-END (1º conector cloud):** o fluxo completo acima, impecável — consentimento →
  dado automático **visível** na Timeline/Monitoramento/Composição, com **estado da integração** (Conectado/Última sync/
  Sincronizando/Atenção/Erro/Fonte) e **idempotência** comprovada (rodar 2×/10× = mesmo resultado). Experiência COMPLETA.
- **Épico 3 — Validação do Aha + sincronização contínua:** sync recorrente (on-open + webhooks onde houver); validar o
  **tempo até o 1º benefício percebido**; "a história cresceu sozinha" no retorno.
- **Depois (V2.2+):** Apple Health / Health Connect **com o MOB-001**; balanças/CGM/labs — repetição da arquitetura.

## Preparar a V3 (dados a COMEÇAR a capturar agora, mesmo sem exibir tudo)
Para a Inteligência Longitudinal (V3) ser poderosa, a V2 deve **armazenar desde já** (mesmo que a UI mostre só resumos):
1. **Séries temporais completas** (não só o último valor) — com **timestamp e origem** — base de tendências/comparações.
2. **Metadados de fonte/dispositivo/método/confiabilidade** — rastreabilidade + **não normalizar entre tecnologias**
   (como na Composição da V1).
3. **Cadência de amostragem** — para a V3 distinguir sinal de ruído.
4. **Eventos de sincronização** (quando/quanto) — base dos indicadores de sucesso e do "freshness".
Tudo na **UCDA/`body_metrics` canônica com proveniência**. Regra: *capturar amplo agora, exibir o essencial na V2.*

## Indicadores de SUCESSO do produto (existem desde o planejamento)
- ⭐ **TEMPO ATÉ O 1º BENEFÍCIO PERCEBIDO** (fundadora 19/07 — provavelmente o mais importante): quanto tempo entre
  **conectar** e o usuário **perceber claramente que a plataforma ficou mais útil**. Se for longo, perde-se o encantamento.
  O planejamento inteiro minimiza esse tempo.
- **% de usuários que conectam um dispositivo sem ajuda.**
- **Tempo médio até a 1ª sincronização.**
- **Tempo até o 1º dado automático aparecer.**
- **Volume médio de dados sincronizados.**
- **Frequência de atualização automática.**
- **Retenção da conexão** — % que mantém a fonte após 7/30 dias — saúde da integração.
Ainda não medidos em produção, mas **definidos e instrumentáveis** desde já (onde entram os hooks de telemetria).

## Riscos (téc + UX)
- **Téc:** OAuth/permissões de saúde; rate limits; **deduplicação**; unidades/fusos (reusar [[DATE-001]] + UCDA);
  sincronização em web sem background nativo → **sync on-open + webhooks**; idempotência por faixa (já prevista no HIP-001).
- **UX:** atrito/receio nas permissões de dados de saúde (LGPD; transparência); tornar o **1º dado visível rápido**;
  não afogar o usuário em dados brutos; **queda de provedor não pode quebrar a experiência** (princípio da substituição).

## Definition of Done da V2
- ≥1 conector real (agregador) conectando, sincronizando e com **1º dado visível** nas visões longitudinais, com
  **origem rastreável**; usuário **autoriza/revoga**; sincronização contínua com indicador de atualização.
- Séries + proveniência + eventos de sync **armazenados** (preparando a V3).
- TSC + suíte + build verdes · Gate de Conformidade · LGPD (dado sensível) · **zero** framing de diagnóstico/tratamento.

## Simplificações propostas (antes de implementar)
1. **Começar por um agregador** (não N APIs de fabricantes) — um conector, muitos dados.
2. **Sync on-open + webhooks** em vez de jobs de background nativos (web) — menos complexidade.
3. **Reusar Monitoramento/Composição/`body_metrics`/UCDA** como destino — nada novo de exibição na V2.

## Decisões (estado)
- **Narrativa + Aha Moment:** ✅ aprovados.
- **1º conector (ARQUITETURA + produto):** ✅ **ROTA A — Withings (cloud) primeiro** (fundadora 20/07). Prova o
  end-to-end **hoje, no web** (OAuth servidor-a-servidor), sem depender de app mobile; traz **peso/composição** →
  continuidade direta com a jornada de peso da V1. **Health Connect / Apple Health** ficam para depois, junto do
  **MOB-001** (app mobile), reaproveitando a mesma fundação HIP-001. Rota B (Health Connect primeiro, exigindo o
  MOB-001 como pré-requisito) foi **descartada** para a V2 por adiar o Aha e misturar duas transformações.
- **Withings como 1º provedor:** ✅ confirmado (vs. Oura/Fitbit/Garmin) pela continuidade com a Composição da V1.

## Próximo passo
Decompor o **Épico 1 — Fundação HIP-001** em subitens verificáveis (cada um TSC + suíte + build verdes + commit) e
iniciar a implementação.
