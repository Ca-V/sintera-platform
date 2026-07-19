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

## 🔒 Princípio arquitetural permanente — TODA INTEGRAÇÃO É SUBSTITUÍVEL
Já constitucional no [[HIP-001_PLATAFORMA_INTEGRACOES]]: **o usuário interage com a SINTERA; a SINTERA conversa com os
conectores.** Nenhum wearable, laboratório ou provedor influencia a experiência. Todo conector é um **adaptador** que
traduz a fonte para a **representação canônica (UCDA)**; trocar/remover um provedor **não muda a experiência**. Preserva
a independência do produto no longo prazo.

## Priorização de integrações POR VALOR PERCEBIDO (não por facilidade técnica)
Classificação por: **frequência de uso · volume de dados · impacto na experiência · expectativa do usuário · potencial
de demonstrar o diferencial.**

| Integração | Freq. | Volume | Impacto exp. | Expectativa | Diferencial | Ordem |
|---|---|---|---|---|---|---|
| **Agregador de saúde** (Apple Health / Google Health Connect) | 🟢 alta | 🟢 alto | 🟢 alto | 🟢 alta | 🟢 alto | **1º** |
| **Balança/bioimpedância conectada** (peso/composição) | 🟡 média | 🟡 médio | 🟢 alto (alimenta a jornada de peso da V1) | 🟢 alta | 🟢 alto | **2º** |
| **CGM / pressão** (crônicos) | 🟢 alta (segmento) | 🟢 alto | 🟢 alto (segmento) | 🟡 média | 🟢 alto | 3º (segmento) |
| **Labs / FHIR / RNDS** (resultados) | 🟡 média | 🟢 alto | 🟢 alto | 🟢 alta | 🟢 alto | trilha própria (modalidade "resultado", não série contínua) |

**Estratégia:** começar pelo **AGREGADOR** — uma conexão libera muitos dados/dispositivos, maximizando o Aha com o
menor esforço (alta alavancagem). Depois a **balança**, que dá **continuidade direta à Composição/jornada de peso da V1**.

## Épicos (ordem ideal)
- **Épico 1 — Fundação de integrações (HIP-001):** registro de conectores + **autorização/revogação** pelo usuário +
  **mapeamento canônico → UCDA/`body_metrics`** + **log de sincronização** (fonte·quando·faixa·payload) + proveniência.
  É a **única infra nova** (justificada por ≥2 consumidores). Validada com **um** conector real antes de generalizar.
- **Épico 2 — Primeiro conector + Aha Moment:** fluxo de conexão do agregador + **1ª sincronização** + **feedback
  visível** do 1º dado, que **aparece no Monitoramento** e nas visões longitudinais. Experiência COMPLETA: conectar →
  ver dado.
- **Épico 3 — Sincronização contínua + "a história cresceu sozinha":** sync recorrente (on-open + webhooks onde houver),
  **indicador de atualização/última sincronização**, e o **2º conector (balança → Composição)**. Consolida o encantamento
  de retorno.

## Preparar a V3 (dados a COMEÇAR a capturar agora, mesmo sem exibir tudo)
Para a Inteligência Longitudinal (V3) ser poderosa, a V2 deve **armazenar desde já** (mesmo que a UI mostre só resumos):
1. **Séries temporais completas** (não só o último valor) — com **timestamp e origem** — base de tendências/comparações.
2. **Metadados de fonte/dispositivo/método/confiabilidade** — rastreabilidade + **não normalizar entre tecnologias**
   (como na Composição da V1).
3. **Cadência de amostragem** — para a V3 distinguir sinal de ruído.
4. **Eventos de sincronização** (quando/quanto) — base dos indicadores de sucesso e do "freshness".
Tudo na **UCDA/`body_metrics` canônica com proveniência**. Regra: *capturar amplo agora, exibir o essencial na V2.*

## Indicadores de SUCESSO do produto (existem desde o planejamento)
- **% de usuários que conectam um dispositivo sem ajuda.**
- **Tempo médio até a 1ª sincronização.**
- **Tempo até o 1º dado automático aparecer.**
- **Volume médio de dados sincronizados.**
- **Frequência de atualização automática.**
- (+ **retenção da conexão** — % que mantém a fonte após 7/30 dias — saúde da integração.)
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

## Decisão sua necessária antes de implementar
- Aprovar a **narrativa + Aha Moment + ordem de integrações** (agregador → balança → segmento/labs).
- Confirmar o **agregador inicial** (Apple Health, Google Health Connect, ou ambos por plataforma) — decisão de produto
  com impacto no alcance.
