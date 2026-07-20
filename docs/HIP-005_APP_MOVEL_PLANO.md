# HIP-005 — App Móvel SINTERA (espinha dorsal de cobertura · plano de planejamento)

**Status:** PLANO DE PLANEJAMENTO — para decisão estratégica (é um investimento grande, stack novo). Sob [[ADR-000]] ·
[[HIP-001]]. Decisão da fundadora (HIP-003): construir o app móvel para destravar as integrações de wearables.
**Processo:** Planejamento → **Aprovação** → Implementação → Validação → Homologação → Encerramento.

> **Por que o app é a peça central:** **Apple Health** e **Health Connect** não têm API de nuvem — só existem no
> aparelho. Mas eles **já agregam** HR, HRV, sono, atividade, SpO₂, temperatura de **qualquer** dispositivo que o
> usuário sincroniza no celular — **inclusive Garmin, Oura, WHOOP, Fitbit**. Um app que lê essas duas fontes **cobre a
> maioria dos wearables com UMA integração**, contornando APIs fechadas (Garmin) e a exigência de possuir cada
> dispositivo (Oura/WHOOP). É o caminho de maior cobertura por esforço.

## 1. Objetivo e escopo
Um app móvel que: (1) autentica o usuário (mesma conta SINTERA); (2) pede consentimento e **lê Health Connect (Android)
/ Apple HealthKit (iOS)**; (3) **envia** as amostras normalizadas ao backend da SINTERA, que as ingere pela **mesma
arquitetura canônica** (`CanonicalSample` → Monitoramento/Composição, NOV-001). O app é, na prática, **mais um conector**
— só que o dado é **empurrado do dispositivo** em vez de puxado de uma nuvem.

## 2. Arquitetura (reúso máximo do que já existe)
- **Ingestão como "conector de push":** novo endpoint `POST /api/connectors/mobile/ingest` (autenticado como o usuário)
  recebe um lote de leituras → chama `propagateSamples` (a MESMA função da V2: bruto em `wearable_readings` + projeção
  `body_metrics` + dedup/idempotência). **Zero pipeline novo** no core; o app vira `source='mobile_health'` (ou por
  origem: `apple_health`/`health_connect`) preservando proveniência.
- **Contrato canônico:** o app mapeia os tipos nativos (HKQuantityType / Health Connect Records) → `CanonicalSample`
  (metric, value, unit, recordedAt, provenance). Mesmas chaves canônicas (`frequencia_cardiaca`, `saturacao`,
  `peso`, …) + novas de vitais contínuos (HRV, sono) — ampliação de vocabulário, não de arquitetura.
- **Autenticação:** Supabase Auth tem SDK móvel → o app reusa a mesma identidade; o upload vai autenticado (RLS).
- **NOV-001 / Monitoramento / Composição:** acendem automaticamente com o dado real (a infra já projeta e reconhece).
- **Sincronização:** leitura em background (HealthKit background delivery / Health Connect periodic) + upload
  incremental por marca d'água (mesma ideia de janela da V2).

## 3. Stack recomendado
- **React Native + Expo** (recomendado) — alinhado ao time JS/TS/Next.js (menor troca de contexto); libs maduras:
  `react-native-health` (HealthKit) e `react-native-health-connect` (Health Connect), Supabase JS SDK. Alternativa:
  **Flutter** (`health` package) — bom, porém novo stack (Dart) para o time.
- **Decisão D-STACK:** React Native/Expo (recomendado) vs Flutter.

## 4. MVP (fatia mínima que entrega valor e valida a arquitetura)
1. Login (conta SINTERA) + tela de permissões de saúde.
2. Leitura de **um conjunto inicial** (ex.: FC, FC de repouso, HRV, sono, passos, SpO₂, peso) de **uma plataforma**.
3. Upload ao `/ingest` → aparece no **Monitoramento** com **NOV-001** ("sua história cresceu").
4. Sync em background + reconexão/permissão revogada.
- **Decisão D-PLAT:** MVP primeiro em **Android/Health Connect** ou **iOS/Apple HealthKit**? (Sugestão: escolher pela
  base de usuárias-alvo do beta.)

## 5. Privacidade / LGPD (é o caminho MAIS privado — [[compliance_001_fase0_gate]])
Dado sai **direto do aparelho para a SINTERA**, sem terceiro no caminho (melhor que agregador). Consentimento on-device
granular, minimização (só os tipos necessários), transporte cifrado, RLS. Gate de Conformidade antes do `Done`.

## 6. Dependências (da fundadora / conta)
- **Apple Developer Program** (US$99/ano) + **Google Play Console** (US$25 única vez) — contas de publicação.
- Dispositivos de teste (1 Android + 1 iOS) e uma conta com dados de saúde no celular.
- **Nota:** o app é um **repositório/stack novo** — esforço de **semanas**, não dias; é um projeto à parte do web.

## 7. Riscos
- **Esforço/stack novo:** maior que um conector web; requer build nativo, revisão nas lojas (App Store/Play).
- **Background sync tem limites** de SO (iOS/Android restringem execução em segundo plano) → definir cadência realista.
- **Revisão das lojas** (HealthKit exige justificativa de uso de dados de saúde; políticas de privacidade).
- **Duas plataformas = ~2× manutenção** (por isso o MVP começa por uma).

## 8. Sequência proposta
1. **Decisões** D-STACK + D-PLAT.
2. **Endpoint `/ingest`** no web (reusa `propagateSamples`) + vocabulário de vitais contínuos — *pode começar já, é
   backend e independe do app*.
3. **App MVP** (uma plataforma) → validação no dispositivo → Monitoramento/NOV-001 com dado real.
4. Segunda plataforma; depois, opcionalmente, **agregador** (Terra/Rook) para a cauda longa/streaming.

## 9. Relação com o Strava ([[HIP-004]])
Independentes e complementares: o **app** entrega **sinais contínuos** (HRV/sono/FC) — o núcleo do posicionamento; o
**Strava** entrega **atividade** (treinos) e é um ganho web rápido, mas com 2 gates (jurídico + nova representação).
Recomendação: **priorizar o app** (maior valor/cobertura) e tratar o Strava como complemento quando os gates forem
resolvidos. Ambos alimentam a MESMA arquitetura canônica.
