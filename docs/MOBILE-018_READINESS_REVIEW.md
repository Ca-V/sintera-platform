# MOBILE-018 — Readiness Review (gate pré‑implementação de incremento)

> **Conceito (fundadora, 2026‑07‑27):** antes de iniciar a implementação de um incremento, ele passa por uma
> **Readiness Review** — a mesma disciplina que equipes de engenharia usam antes de "dar o start". A pergunta
> não é *"o planejamento está bom?"*, e sim: **"existe alguma surpresa que possa impedir começar a implementar?"**
> É um **gate formal**, como a [Matriz de Paridade](./PARIDADE_WEB_MOBILE.md) virou gate para evoluções da Web.
> Não exige emulador. Cada incremento ganha a sua: MOBILE‑018 (Inc 4), MOBILE‑0xx (Inc 5), etc.

## Template — as 6 verificações

Uma Readiness Review percorre seis frentes e produz o **quadro‑resumo** (§final). Para cada item: ✅ pronto ·
⚠️ decisão/ação pendente · ⛔ bloqueio.

1. **Cobertura do contrato** — cada campo do DTO tem: origem na tabela · tipo consistente (DB ↔ api‑client ↔ Mobile) · validação · estratégia para `null` · default. *Resultado esperado: nenhuma decisão pendente.*
2. **Cobertura do Design System** — desenhando a tela inteira, todo componente necessário existe? (Section Header · Field Row · Helper/Error Text · Divider · Loading · seletores). *O componente "que falta" só aparece quando se desenha a tela toda.*
3. **Cobertura do api‑client** — todas as operações previstas existem/são viáveis (assinaturas, tipos, erros, timeout, retry, cancelamento), seguindo a convenção do pacote.
4. **Cobertura dos estados da tela** — não só o caminho feliz: 1ª carga · inexistente · parcial · salvando · salvo · erro · offline · timeout.
5. **Dependências externas** — checklist: DS · api‑client · tabela · navegação · autenticação · permissões · CI · testes.
6. **Veredito** — "está pronto para começar?" e, se não, **exatamente o que falta** (vira ação pré‑implementação).

---

# Instância — Readiness Review do Incremento 4 (Perfil)

- **Data:** 2026‑07‑27 · **Base:** [MOBILE‑016](./MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md) (plano) · **Sem emulador.**
- **Método:** verificação contra o repo real e o banco (`profiles` via SQL), não contra o plano no papel.

## 1. Cobertura do contrato — ✅ com 1 decisão de produto

**Verificado contra o banco (`information_schema`, projeto `pxiglvrgxooawetboglb`):** o `ProfileDTO` §4.2 do
plano **bate 100%** com a tabela real — tipos, `nullable` e defaults de `id, name, phone, age_range, goals,
pref_daily_reminder, pref_phase_alerts, pref_email_insights, pref_whatsapp_reminder, avatar_url, updated_at`.
Campos de outros domínios (`cycle_*`, `height_cm`, `weight_goal_kg`, `last_seen_at`, `created_at`) corretamente
**fora** do DTO. **Sem drift.** Convenção do api‑client (leitura→`T|null`, escrita→`{error}`) confirmada no código.

- ⚠️ **DECISÃO PENDENTE (D1) — enum de `age_range` e `goals`.** No banco são `text`/`text[]` **livres** (não são
  enums de DB). **Não existe lista canônica** em lugar nenhum: `@sintera/validation` está vazio (`export {}`); a
  Web **não tem UI** que edite esses campos; só há pistas de leitura em `prevencao` (`"18-25"`, `"36-45"`, `"46+"`).
  → "reusar a lista da Web" (§4.2) **não tem o que reusar**. Os valores + validação precisam ser **definidos**
  (produto) antes de implementar a edição desses dois campos.

## 2. Cobertura do Design System — ⚠️ lacunas além de Switch/Avatar

Prontos: `Box · Text · Button · Input · Switch · Avatar` (Switch/Avatar entregues nesta sessão). Desenhando a
tela de Perfil inteira, aparecem componentes que o plano §3 **não** previu:

| Necessidade da tela | Existe no DS? | Observação |
|---|---|---|
| **Campo com rótulo + texto de erro/ajuda** (Field Row) | ❌ | O `Input` do mobile renderiza **só a caixa** (aceita `error:boolean`, mas **não** desenha label, helper nem mensagem de erro). O critério §6.1 exige mensagens de erro claras → falta um padrão de **campo rotulado + erro**. |
| **Seletor de `age_range`** (seleção única) | ❌ | Não é campo de texto; é escolha entre opções. Há recipe `chip` (com estado *selected*), mas **sem primitivo RN**. |
| **Seletor de `goals`** (multi‑seleção `text[]`) | ❌ | Idem — multi‑chip. **Só necessário se D1 mantiver a edição desses campos.** |
| **Indicador de carga inicial** (spinner) | ⚠️ | `Button` tem estado *loading* (Inc 1); a leitura inicial (§6.1) precisa de um indicador de tela — `ActivityIndicator` do RN tematizado resolve, mas é decisão. |
| Section Header · Divider | ✅/➖ | `heading`/`text` + `Text` cobrem o header; `divider` tem recipe (primitivo RN opcional, só se o layout usar). |

→ **A maior lacuna depende de D1.** Se `age_range`/`goals` continuarem **editáveis**, o DS precisa ganhar
**um primitivo de seleção (chip/picker)** *antes* da tela ([[principio_ds_promovido_antes_da_aplicacao]]).

## 3. Cobertura do api‑client — ✅ base / 🔧 a construir no Inc 4 / ⚠️ 1 decisão

- ✅ Fronteira intacta: `createApiClient` é o **único** `createClient()`; o cliente Supabase fica encapsulado; hoje expõe `{ auth }`.
- 🔧 `getProfile`/`updateProfile` + tipo `ProfileDTO` + expandir `ApiClient` de `{auth}` para `{auth, profile}` = **trabalho do Inc 4** (esperado, não é bloqueio). Segue a convenção do pacote.
- ⚠️ **DECISÃO PENDENTE (D2) — timeout/retry/cancelamento.** **Não existe** camada de rede própria; as ops são
  chamadas diretas ao `supabase-js` (defaults do `fetch`, **sem timeout**). O critério "timeout → erro" (§6.1)
  **não é determinístico** sem um timeout explícito (uma requisição pendurada nunca "excede o limite"). Opções:
  (a) aceitar os defaults; (b) envolver as ops de perfil num timeout simples (`AbortController`/`Promise.race`).
  Baixo esforço; decisão de contrato do api‑client.

## 4. Cobertura dos estados da tela — ✅ boa

O plano §6.1 cobre **1ª carga (loading) · inexistente (defaults+upsert) · salvando (pessimista) · salvo
(confirma no backend) · erro (mensagem clara) · offline (erro, sem fila) · timeout (como erro) · conflito
(last‑write‑wins)**. Mapeia bem a lista de referência. Ressalvas: o "parcialmente preenchido" está implícito
(campos nullable → "—"); o timeout depende de D2 para ser determinístico.

## 5. Dependências externas

| Dependência | Status | Observação |
|---|---|---|
| Banco (`profiles`) | ✅ | Schema verificado; RLS reusada; **sem migration** prevista. |
| Navegação | ✅ | Aba "Mais" + stacks existem (Inc 2); adicionar o ponto de entrada é trabalho do Inc 4. |
| Autenticação | ✅ | Inc 1 (aceito). |
| Permissões | ✅ | RLS reusada; avatar é exibição‑apenas → **sem** permissões de SO. |
| CI | ✅ | Pipeline pronto. |
| Testes | ✅ | Estratégia definida (§7): estáticos + unitários do api‑client + contrato do DS + homologação. |
| **Design System** | ⚠️ | Ver §2 (Field Row/erro; seletor se D1 mantiver `age_range`/`goals`). |
| **api‑client** | ⚠️ | Ops a construir (ok) + decisão D2 (timeout). |

## 6. Achado transversal (arquitetura/paridade) — ⚠️ DECISÃO D3

O plano coloca os **4 toggles `profiles.pref_*`** na tela de Perfil. Porém:
- Na Web, a página de Perfil edita **só o nome**; `pref_whatsapp_reminder` é gravado **apenas como efeito
  derivado** de ter telefone (`pref_whatsapp_reminder: !!full` em `configuracoes`), e as **preferências reais de
  notificação** vivem na **Central** (tabela `notification_preferences`, categoria×canal), não nos `profiles.pref_*`.
- **NOTIF‑001** define a Central como **autoridade única** de preferências de notificação e trata `profiles.pref_*`
  como **legado transitório**. *"Nenhum módulo pode manter configurações próprias de canal ou opt‑in."*

→ Editar `pref_*` no Perfil do Mobile **divergiria da Web** e arriscaria reintroduzir o anti‑padrão que NOTIF‑001
proíbe. Conecta‑se ao gate do **FB‑011** (Notificações **não** está no roadmap do Mobile). **Decisão D3:** manter
os toggles no Perfil (legado, simples) **ou** deferir as preferências de notificação para uma futura tela
"Central" no Mobile, espelhando a Web.

---

## Quadro‑resumo

| Área | Status | Observação |
|---|---|---|
| Contrato (DTO ↔ DB) | ✅ | Bate 100% com o banco; sem drift |
| Enum `age_range`/`goals` | ⚠️ **D1** | Sem lista canônica no repo — definir valores/validação ou descopar p/ exibição |
| Design System | ⚠️ | Falta Field Row+erro; seletor (chip/picker) se D1 mantiver edição; loading a decidir |
| api‑client (ops) | 🔧 | Construir `getProfile`/`updateProfile` (esperado) |
| api‑client (rede) | ⚠️ **D2** | Sem timeout/retry/cancel — decidir contrato |
| Estados da tela | ✅ | Cobertos (timeout depende de D2) |
| Navegação/Auth/Permissões/CI/Testes | ✅ | Sem bloqueios |
| Toggles de notificação no Perfil | ⚠️ **D3** | Diverge da Web/NOTIF‑001 — decidir escopo |

## Decisões da fundadora (2026‑07‑27) — escopo do Inc 4 travado

- **D1 = descopar.** `age_range` e `goals` entram como **exibição‑apenas** (como o avatar). Sem definir enum
  nem criar seletor no DS agora; a edição vira incremento próprio quando houver decisão de produto.
- **D3 = deferir.** As preferências de notificação **saem do Inc 4** e espelham a Web (futura "Central" no
  Mobile, tabela `notification_preferences`). Preserva NOTIF‑001 (autoridade única) e a paridade.
- **D2** (timeout do api‑client): em aberto; **recomendação** = envolver as ops de perfil num timeout simples
  (`AbortController`) no momento da implementação — decidir junto com a construção das ops.

**Escopo resultante do Inc 4:** **nome + telefone (edição)** + `age_range`/`goals`/`avatar` (exibição) +
identificação da sessão. Preferências de notificação: fora. Alinhado à Web atual (que também edita só o nome).

**Ações pré‑implementação restantes (todas Prioridade A, sem emulador):**
1. **DS:** promover o **Field Row** (rótulo + `Input` + texto de erro/ajuda) — única lacuna de DS do escopo enxuto.
2. **api‑client:** construir `getProfile`/`updateProfile` + `ProfileDTO` (campos centrais) seguindo a convenção; aplicar D2.
3. Nenhuma outra pendência: contrato, banco, navegação, auth, CI e testes já ✅.

## Veredito (original, pré‑decisões)

**O Inc 4 NÃO está pronto para começar "como planejado" — mas está perto, e o que falta são DECISÕES, não
infraestrutura ausente.** A fundação (contrato verificado, banco, navegação, auth, CI, testes) é sólida.

**Antes de implementar, resolver:**
- **D1 (produto):** definir enum + validação de `age_range`/`goals`, **ou** descopá‑los para exibição‑apenas
  (como o avatar). Descopar torna o Inc 4 quase imediatamente pronto.
- **D3 (arquitetura/paridade):** toggles de notificação no Perfil **ou** deferir para uma Central no Mobile.
- **D2 (contrato api‑client):** timeout — aceitar defaults ou envolver as ops (baixo esforço).
- **Depois de D1/D3:** promover ao DS o **Field Row + texto de erro** e, se aplicável, o **seletor** — *antes* da tela.

**Caminho de menor risco (recomendação):** se D1 e D3 forem **descopar** (`age_range`/`goals` exibição‑apenas;
notificação fica para uma Central no Mobile), o Inc 4 vira **nome + telefone (edição) + demais campos (exibição)**
— escopo enxuto, alinhado à Web atual (que também edita só o nome), e pronto a começar logo após a homologação do
Inc 3, precisando apenas do Field Row+erro no DS e das ops do api‑client.

---
*Referências: MOBILE‑016 (plano) · MOBILE‑015 (roadmap) · NOTIF‑001 (Central) · PARIDADE_WEB_MOBILE (gate) · ADR‑001/011/018.*
