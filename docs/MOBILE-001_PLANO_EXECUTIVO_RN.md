# MOBILE-001 — Plano Executivo do App React Native (Expo)

**Status:** **APROVADO** (fundadora, 2026-07-21, com 7 refinamentos incorporados) · Baseline da fase Mobile · **Consolida:** [[HIP-008]] (stack) · [[HIP-009]]
(sincronização) · [[HIP-010]] (ondas) · [[HIP-011]] (produto/UX) · [[ds002_architectural_freeze]] · [[estrategia_ssot_web_mobile]].
**Marco:** fase Web encerrada; a Web é a **implementação de referência** (funcional, arquitetural, visual). O RN passa a
ser a **2ª implementação do adaptador** sobre o DS-002 estabilizado — não instrumento de validação da arquitetura.

## 1. Arquitetura proposta (RN + Expo)
- **Stack:** React Native + **Expo** (dev client + **EAS Build/Update**), decidido no HIP-008. Scaffold já existe em
  `apps/mobile` (RN 0.79 · Expo ~53 · React 19).
- **Monorepo (mesma base da Web):** o app consome os pacotes compartilhados por caminhos já configurados
  (`apps/mobile/tsconfig`): `@sintera/design-system` (tokens/tema/recipes headless) · `@sintera/core` · `@sintera/types`
  · `@sintera/validation` · `@sintera/api-client` · `@sintera/utils` · `@sintera/config`.
- **Camadas do app** (pastas já criadas): `design-system` (adaptador DS→RN) · `presentation` (telas por domínio) ·
  `navigation` · `state` · `sync` · `infrastructure` (Supabase/secure store) · `integrations` (HealthKit/Health Connect).
- **Princípio-chave:** o RN **renderiza os mesmos `recipes` headless** do DS-002 (que retornam `VisualSpec` neutro de
  plataforma) via primitivos RN (`View`/`Text`). Identidade idêntica à Web **por construção** — foi exatamente o objetivo
  da consolidação do DS-002.
- **Builds nativos:** módulos de saúde exigem **development build** (não Expo Go) via `expo prebuild` + config plugins +
  **EAS** — padrão atual, não bloqueio (HIP-008).

## 2. Estratégia de reaproveitamento Web ⇄ Mobile
Fonte única de verdade = `packages/*`. Cada plataforma tem só um **adaptador fino** que traduz para o seu sistema de UI.

| Camada | Reúso |
|---|---|
| Tokens · tema (`getTheme`) · **recipes headless** (VisualSpec) | **100% compartilhado** (TS puro) |
| Modelos de domínio · validações · regras de negócio · infra de data | **100% compartilhado** |
| Cliente de API (`@sintera/api-client`) | **100% compartilhado** (API-first, ARCH-002) |
| Tradução para UI | **Adaptador por plataforma:** Web → CSS/React (`src/lib/ui/ds`); Mobile → RN (`apps/mobile/src/design-system`) |
| Já pronto no Mobile | Adaptadores DS→RN de **tipografia** (`toRNTextStyle`) e **elevação** (`toRNShadow`) — puros, com contratos |

Meta-prova (já garantida na Web): mudar identidade = editar **só** o DS; ambos os adaptadores consomem o mesmo token/recipe.

**Princípio de reúso (fundadora, governança permanente):** na dúvida entre **criar um componente específico do Mobile**
ou **evoluir um componente compartilhado do DS-002**, a preferência é SEMPRE **evoluir o compartilhado**. Web e Mobile
não iniciam divergência arquitetural. Componente Mobile-específico só quando for **inevitavelmente nativo** (ver §3) —
todo o restante é **compartilhável até prova em contrário**, e a prova precisa ser explícita (ADR/decisão registrada).

## 3. Componentes compartilhados × específicos
- **Compartilhados (packages):** tokens, tema, **recipes** (Card/Button/Badge/Chip/Divider/Icon/Avatar/Numeric + domínio
  LaboratoryTable/Banner/TimelineRow/BiomarkerCard/Indicator), modelos (Observação/Exame/Agenda/…), validações, API client.
- **Específicos Web:** adaptador CSS (`src/lib/ui/ds`), `globals.css`/artefato gerado, roteamento Next.js.
- **Específicos Mobile — INEVITAVELMENTE NATIVOS (lista explícita):**
  **câmera** · **compartilhamento** (share sheet) · **notificações** (push/APNs/FCM) · **biometria** (Face/Touch ID) ·
  **HealthKit** (iOS) · **Health Connect** (Android) · **armazenamento seguro** (SecureStore) · **permissões** (SO) ·
  **deep links**. Além destes, itens de plataforma pura: adaptador RN (primitivos `View`/`Text`), **navegação** (bottom
  tabs), **fila offline**, gestos/haptics.
- **Regra:** **tudo o que não estiver na lista acima é considerado COMPARTILHÁVEL até prova em contrário** (§2). Nenhum
  componente de domínio é reescrito — o recipe é reusado; só o adaptador muda.

## 4. Autenticação · Navegação · Sincronização
- **Autenticação:** Supabase Auth (mesmo backend/RLS da Web). Mobile: `@supabase/supabase-js` + **`expo-secure-store`**
  para persistir a sessão + **deep links** para o callback OAuth (Google). Sem lógica de auth duplicada — mesma API.
- **Navegação:** **bottom tab bar** (HIP-011): **Início · Minha Saúde · ＋Registrar · Agenda · Perfil**. Rótulos vindos da
  taxonomia da Sidebar (SSOT). Stack nativo por domínio dentro de cada tab.
- **Sincronização:** arquitetura **HIP-009** — SSOT bruto imutável + **idempotência** + cursores por dispositivo +
  reconciliação **na projeção** (equivalência/precedência/rastreabilidade). **Offline-first:** leitura em cache; captura
  enfileirada e enviada quando houver rede. Ingestão nativa (HealthKit/Health Connect) → `CanonicalSample` → endpoint
  **`/ingest`** (backend reusa `propagateSamples`). Push via **Expo Notifications** (APNs/FCM), reusando a Central de
  Notificações e o worker de despacho já existentes.

## 5. Cronograma macro (ondas — cada uma = produto instalável, HIP-010)
| Onda | Entrega | Aceite (o que o usuário passa a conseguir) |
|---|---|---|
| **0 — Setup** | Completar o adaptador DS→RN (primitivos `View`/`Text` dos recipes; fontes via `@expo-google-fonts`; gradientes via `expo-linear-gradient`; reconciliar o gradiente do botão na recipe) + EAS/dev build configurado | (interno) base de UI verificável e build rodando |
| **1 — Fundação (MVP navegável)** | **MVP definido por funcionalidades OBSERVÁVEIS** (ver abaixo) | ao final, dá para usar o app num **fluxo real, ainda que incompleto** |
| **2 — Experiência principal** | Timeline · Exames/Documentos (ver original) · Perfil · Agenda · offline-first de leitura | a usuária navega a própria história no app, sem depender da Web |
| **3 — Aquisição observacional** | Health Connect + HealthKit (capacidades nativas) · sync (HIP-009) · `/ingest` · Observações + NOV-001 | o dado do celular chega sozinho e aparece na timeline/monitoramento |
| **4 — Integrações adicionais** | Conectores externos (Withings pronto) · atividade física (após sign-off jurídico) · dispositivos médicos | fontes além do celular ampliam a cobertura sem mudança estrutural |

**MVP da Onda 1 — funcionalidades observáveis (critério de aceite da 1ª versão navegável, fundadora):**
1. **Autenticação** (login/logout, sessão persistente, deep links).
2. **Navegação completa** (bottom tabs operando entre todos os domínios).
3. **Home** (Painel Inicial).
4. **Perfil** (conta/preferências).
5. **Visualização do Histórico de Exames** (ler a própria história de exames).
6. **Upload de documentos** (enviar um exame/documento).
7. **Registro Manual** (criar um registro pela captura manual).
> Aceite: a fundadora consegue **usar o app num fluxo real** (logar → navegar → ver histórico → enviar documento →
> registrar manualmente), ainda que incompleto. Nenhuma dessas telas reescreve componente de domínio — reusa os recipes.

**Contas Apple Developer / Google Play + integrações nativas:** configuradas **após a 1ª versão navegável** (fim da Onda 1),
conforme diretriz da fundadora — o cadastro pode iniciar em paralelo à Onda 1 (prazos de aprovação).

## 6. Riscos técnicos e mitigações
| Risco | Mitigação |
|---|---|
| Ambiente de build RN indisponível no sandbox atual (Windows, sem toolchain) | Implementação em ambiente com Expo/**EAS (build na nuvem)**; aqui só a base **pura TS** é verificável (tsc/testes) — a fundação já segue esse padrão |
| Módulos nativos de saúde exigem dev build (não Expo Go) | `expo prebuild` + config plugins + **EAS dev build** (padrão HIP-008; não bloqueio) |
| Recipe do **botão** descreve primário sólido; a Web usa o **gradiente** de ação | Reconciliar na Onda 0: adicionar `backgroundGradient` ao `BoxSpec` (referenciando `gradient.action`) → Web e RN derivam do mesmo token (evolução já registrada na auditoria DS-002) |
| Tipografia (Fraunces/Hanken/IBM Plex Mono) no RN | `@expo-google-fonts` + `expo-font`, mesmos pesos; o adaptador `toRNTextStyle` já mapeia família por peso |
| Complexidade de sync/offline | Seguir **HIP-009** (idempotência, cursores); entregar **leitura offline** (Onda 2) antes da **ingestão** (Onda 3) |
| Divergência de identidade Web↔Mobile ao longo do tempo | Contratos **ARCH** para o adaptador RN (como os já existentes de tipografia/elevação), criados conforme os primitivos nascem |
| Custo/tempo de aprovação nas lojas | Cadastro Apple/Google iniciado cedo (paralelo à Onda 1); EAS Submit para publicação |

## 7. Offline — requisito arquitetural do app INTEIRO (não só da sync)
Offline é transversal: **toda funcionalidade** declara seu comportamento nos 4 estados. Isso é parte do contrato de cada
tela desde a Onda 1 (evita retrabalho nas ondas seguintes).

| Estado | Comportamento esperado (padrão) |
|---|---|
| **Com conexão** | Operação normal; leitura do cache com revalidação; escrita direta + confirmação |
| **Sem conexão** | **Leitura** do cache local (nunca bloquear a leitura); **escrita/captura** enfileirada localmente com indicação clara ("será enviado quando houver rede") |
| **Sincronização pendente** | Indicador discreto (o que falta enviar); item marcado como "pendente"; sem ansiedade |
| **Conflito** | Reconciliação **na projeção** (HIP-009: equivalência/precedência/rastreabilidade); SSOT bruto imutável e idempotente — nunca perder o registro feito offline |

**Requisito de projeto:** cada tela/feature entregue documenta explicitamente esses 4 comportamentos no seu aceite.

## 8. Performance — metas desde o início
Metas orçadas desde a Onda 1 (medidas em dispositivo de referência de gama média; "projetar agora custa menos que corrigir depois"):

| Métrica | Meta inicial |
|---|---|
| **Abertura do app** (cold start até interativo) | ≤ 2,5 s |
| **Abertura de tela** (navegação entre telas) | ≤ 300 ms |
| **Consumo de memória** (uso típico) | sem crescimento contínuo (sem vazamentos); baseline monitorado |
| **Listas grandes** (timeline/exames/biomarcadores) | listas **virtualizadas** (`FlashList`/`FlatList`), sem recomputar por item; janelas + `getItemLayout` |
| **Estratégia de cache** | cache local (leitura offline) + revalidação; imagens/anexos com cache e placeholders; invalidação por chave |

Cada onda reporta as métricas relevantes; regressão de performance é **débito técnico bloqueante** (§10).

## 9. Observabilidade — previsto na arquitetura desde o início
Mesmo que alguns itens sejam implementados em ondas futuras, a arquitetura os acomoda desde a Onda 1 (pontos de
instrumentação e camada de abstração, sem acoplar a um fornecedor):

- **Crash reporting** (relato de falhas com stack/contexto).
- **Logs estruturados** (níveis, correlação por sessão/dispositivo; sem PII/dado de saúde sensível — LGPD).
- **Analytics de uso** (eventos de produto anônimos/consentidos; reusa o padrão `usage_events` já existente).
- **Monitoramento de performance** (as métricas do §8 em produção).
- **Feature flags** (habilitar/desabilitar recursos por ambiente/onda — inclui o gating de demo já existente).

Privacidade por design: telemetria **nunca** carrega dado de saúde identificável; consentimento respeitado.

## 10. Critério objetivo de encerramento de ONDA (governança Mobile)
Mesma disciplina da Web. Uma onda **só é concluída** com **TODOS**:
1. **Build verde** (dev build / EAS).
2. **Testes verdes** (unidade/contratos; e, quando aplicável, validação em dispositivo real).
3. **Auditoria arquitetural** (aderência: Mobile-First · API-First · Observacional · SSOT · rastreabilidade · **sem
   divergência de identidade** web↔mobile · reúso preferido ao específico).
4. **Validação funcional** (a fundadora usa o fluxo real da onda — não "compilou", e sim "funciona").
5. **Ausência de débito técnico conhecido** que impeça a próxima onda (regressão de performance/offline conta como bloqueante).

## Modelo de governança (fase Mobile)
Igual ao da Web: implementação **incremental** · **validações frequentes** · **auditorias objetivas** · **decisões
arquiteturais documentadas** (ADR) · **evolução controlada sem desvio da arquitetura consolidada**. Interromper só para
decisão de identidade/arquitetura/modelo de dados/produto.

## Próximo passo
Aprovado o plano, a implementação inicia pela **Onda 0** (completar o adaptador DS→RN e o build) no ambiente com Expo/EAS,
mantendo o protocolo de entrega por incrementos verificáveis e a Web como referência. No sandbox atual (Windows, sem
toolchain RN), avança-se apenas a **base compartilhada pura (TS)** verificável por tsc/testes; os primitivos RN, fontes,
gradientes nativos e o build ocorrem no ambiente Expo/EAS.
