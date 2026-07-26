# MOBILE-016 — Planejamento do Incremento 4 (Perfil)

- **Status:** **PLANEJAMENTO** — aguardando revisão/aprovação. **Nenhuma implementação.** (Gate: início só após homologação/aceite do Incremento 3 — [MOBILE-015](MOBILE-015_ROADMAP_INCREMENTOS.md).)
- **Onda:** 1 · **Incremento:** 4 (Perfil) · **branch de impl. (futura):** de `mobile-inc3-accepted`.
- **Relaciona-se com:** [MOBILE-015](MOBILE-015_ROADMAP_INCREMENTOS.md) (roadmap) · [ADR-018](adr/ADR-018_HOME_COMPOSICAO_DE_SLOTS.md) (composição) · [MOBILE-013](MOBILE-013_INCREMENTO2_ACEITE.md) (fronteira api-client) · Referência Web: `src/app/dashboard/configuracoes/page.tsx`, `src/app/api/profile/route.ts`, tabela `profiles`.

## 1. Objetivos funcionais

Permitir que o usuário **visualize e edite seus dados de conta/perfil e preferências** no app móvel. É o
próximo domínio **autocontido** do roadmap — fornece dados que vários módulos usarão e **não depende** de
exames/insights. Concretamente:
- **Ver** os dados do perfil (nome, telefone, faixa etária, objetivos, avatar) e as preferências de notificação.
- **Editar e salvar** esses dados.

## 2. Limites de escopo

### 2.1 Incluído
- Tela de **Perfil** (visualização + edição dos **campos centrais** de `profiles`).
- **Campos centrais** (identidade/conta/preferências): `name`, `phone`, `age_range`, `goals`, `avatar_url`
  (exibição; **edição/upload de avatar** = ver §2.2), e as preferências `pref_daily_reminder`,
  `pref_phase_alerts`, `pref_email_insights`, `pref_whatsapp_reminder`.
- **Extensão do `@sintera/api-client`** com uma capacidade de perfil (`getProfile`/`updateProfile`) — mantendo
  a fronteira: **nenhum acesso direto ao SDK Supabase em `apps/mobile`** (ponto único de cliente, Inc. 1).
- **Ponto de entrada** para a tela de Perfil (navegação — ver §5).

### 2.2 Excluído (cada um em incremento/domínio próprio)
- **Campos de OUTROS domínios** presentes em `profiles`, mas que pertencem a suas capacidades: `cycle_length`,
  `last_period`, `cycle_regularity` (**Ciclo**), `height_cm`, `weight_goal_kg` (**Composição Corporal**, Inc. 9).
  Não entram no Perfil — evita misturar domínios.
- **Upload de avatar** (Supabase Storage) — pode ficar como exibição-apenas no Inc. 4 e edição em incremento
  próprio, para não puxar escopo de storage. *(Decisão a confirmar.)*
- Exclusão/exportação de conta (`api/account`) — LGPD/conta, incremento próprio.

## 3. Componentes reutilizados do DS-002

- `Input` (recipe `input`, Inc. 1) — campos de texto (nome, telefone).
- `Button` (recipe `button`) — salvar.
- `Text`/`Box`, tokens de cor/tipografia/espaçamento — identidade DS-002.
- **Lacuna provável (DS evolui ANTES da tela):** as preferências são **toggles**; o DS **não tem** um
  primitivo Switch. Pelo princípio [[principio_ds_promovido_antes_da_aplicacao]], o **DS ganha um `switch`
  (recipe headless + adaptador RN)** e a tela o consome — a tela não improvisa o controle. Isso é uma
  **tarefa do incremento** (ver §9).

## 4. Contrato de dados (via `@sintera/api-client`, nunca Supabase direto)

Fonte da verdade: tabela **`profiles`** (`id` = id do usuário autenticado). O mobile lê/escreve **pelo
api-client**, que encapsula o Supabase (fronteira do Inc. 1).

| Operação | Assinatura (proposta) | Efeito |
|----------|----------------------|--------|
| Ler | `getProfile(): Promise<Profile \| null>` | `select` da linha do usuário em `profiles` (campos centrais §2.1) |
| Atualizar | `updateProfile(patch: Partial<Profile>): Promise<{ error }>` | `update` (ou `upsert`, se a linha não existir) dos campos centrais |

- `Profile` (tipo) expõe **apenas os campos centrais** (§2.1); campos de outros domínios ficam de fora do tipo
  do Perfil (não vazam para cá).
- **RLS**: reusa as políticas já existentes da Web (mesmo backend). Sem novas migrations previstas (a tabela
  já existe) — **confirmar** se falta apenas garantir `upsert` para usuário sem linha.

## 5. Navegação e fluxos de usuário

**Fluxo:** usuário autenticado → abre **Perfil** → vê os dados → edita → **Salvar** → confirmação → volta.

**Onde vive o Perfil (decisão estrutural a confirmar):**
- **Opção A (recomendada):** um **stack screen** acessível pela aba **"Mais"** (que projeta o grupo
  *Configurações* do SSOT) — alinhado à Web (Perfil sob Configurações). Não toca a Home.
- **Opção B:** acessível ao tocar no nome/avatar do **WelcomeSlot** da Home (só navegação — permitido por
  ADR-018). Mais direto, mas adiciona um ponto de entrada na Home.

Ambas são **só navegação** (sem regra de negócio). Recomendo **A** por consistência com a Web; **B** pode
coexistir depois.

## 6. Critérios de aceite

1. Tela de Perfil **exibe** os campos centrais (dados de `profiles` via api-client) + identificação da sessão.
2. **Edição + Salvar** persiste em `profiles` (via `updateProfile`); recarregar reflete o salvo.
3. Preferências (toggles) editáveis via o **novo primitivo Switch do DS** (não improvisado na tela).
4. **Fronteira:** zero acesso direto ao SDK Supabase em `apps/mobile` (auditoria) — tudo via api-client.
5. **Sem campos de outros domínios** (ciclo/composição) na tela nem no tipo `Profile` (auditoria de escopo).
6. **Identidade DS-002** preservada; **sem regressão** de auth/navegação/Home (Inc. 1–3).
7. **Build** nativo verde · **tsc** verde · **testes** verdes · **CI** verde.
8. **Relatório executivo**.

## 7. Estratégia de testes

- **Estáticos (CI, sem emulador):** o Perfil não importa Supabase/`createClient` direto (guarda como
  `home-is-composition`); o tipo `Profile` não inclui campos de outros domínios.
- **Unitários (api-client):** `getProfile`/`updateProfile` com cliente Supabase **mockado** (mapeiam campos
  corretos; `upsert` quando não há linha).
- **DS:** contrato do novo recipe `switch` (estados on/off/disabled, AA, alvo ≥44 — como o `input` do Inc. 1).
- **Homologação (emulador, com a fundadora):** abrir Perfil → editar → salvar → reabrir e ver persistido;
  sem regressão do fluxo autenticado.

## 8. Riscos técnicos

- **R1 — DS sem Switch.** As preferências exigem um primitivo novo; o DS **evolui antes** da tela (custo real, mas correto). Se subestimado, a tela improvisaria o controle (anti-padrão).
- **R2 — Linha `profiles` inexistente** para um usuário novo → `getProfile` retorna null e `updateProfile` precisa de **upsert**. Definir o comportamento de "perfil vazio".
- **R3 — Scope creep** para campos de outros domínios (ciclo/altura/peso presentes na mesma tabela). Mitigado por §2.2 + auditoria (critério 5).
- **R4 — Avatar/Storage.** Se a edição de avatar entrar, puxa escopo de upload/Storage. Recomendo **exibição-apenas** no Inc. 4.
- **R5 — Regressão** de auth/navegação ao adicionar uma tela/stack. Revalidar o fluxo homologado nos Inc. 2/3.

## 9. Dependências entre tarefas (ordem sugerida de implementação, pós-aprovação)

1. **DS:** recipe `switch` (headless) + adaptador RN + contrato de teste. *(Bloqueia a edição de preferências.)*
2. **api-client:** `getProfile`/`updateProfile` + tipo `Profile` (campos centrais) + testes unitários. *(Bloqueia a tela.)*
3. **Mobile:** tela de Perfil (form: Input + Switch), consumindo o api-client. *(Depende de 1 e 2.)*
4. **Navegação:** ponto de entrada (§5, opção confirmada). *(Depende de 3.)*
5. **Validação:** CI verde + homologação autenticada com a fundadora.

Cada etapa isolada e reversível (mesma disciplina do Inc. 2/3): `tsc` + testes + commit por etapa.
