# IDENT-001 — Identidade, representação e o esqueleto estrutural da plataforma

**Status:** PROPOSTA ARQUITETURAL — decisão da fundadora pendente. Nada aplicado.
**Origem (fundadora, 24/08/2026):**
- *"cada pessoa precisa ter a sua conta. Pode até ser vinculada uma conta à outra."*
- *"quero que toda a base estrutural, o esqueleto da plataforma, esteja estruturada agora."*
- *"acomodar antes de criar precisa ser analisado com critério: muitas vezes uma coisa estrutural precisa ser
  criada para ser base de outras derivadas."*
- *"cada conta ligada a um CPF; haverá protocolo de validação de identidade; adequado às regras da RNDS e
  seguindo o protocolo FHIR."*

**Consome:** ADR-000 · ADR-001 (domínio dono do fato, os outros PROJETAM) · ADR-012 · ADR-023 (dono único) ·
CARE-002 · JOR-001 · FHIR-001 · RNDS-001/002 · BILLING-002

---

## 1. Os dois achados

### 1.1 Identidade e autenticação estão fundidas

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key, ...
)
```

`profiles.id` **é** o `auth.users.id`. Medido em 24/08:

| | |
|---|---|
| tabelas no repositório | 37 |
| colunas `user_id` | 46 |
| **`auth.uid()` em políticas RLS** | **162** |

**Uma pessoa não pode existir na SINTERA sem login.** A criança e a pessoa com demência — os dois sujeitos que o
CARE-002 nomeia — não têm como existir. O modelo multi-sujeito do JOR-001 está bloqueado por schema.

### 1.2 O modelo FHIR de identidade já foi desenhado — e nunca foi aplicado

A migration `139_identity_fhir` cria exatamente o que a fundadora pediu: `patients` (FHIR Patient),
`practitioners`, `organizations` e `party_identifiers` (FHIR Identifier 0..*), com enum
`identifier_kind = cpf | cns | cnes | cnpj | crm | local | outro`, campo `system` para a URI oficial, `use`, e
`verification_status ∈ (unverified, verified)`.

**Verificado no banco de produção em 24/08:**

```
patients            NÃO existe
practitioners       NÃO existe
organizations       NÃO existe
party_identifiers   NÃO existe
exam_documents      NÃO existe          (migration 137)
service_requests    NÃO existe          (migration 138)

ledger: 215 migrations · última version 20260824150100
        entre 107 e 144 não há registro de 137/138/139
```

As migrations 137–143 (trilha FHIR) existem como **arquivo** e nunca foram aplicadas.

> **Correção:** o documento `DOC-002` §2 afirma "`exam_documents` (migration 137) — existe e aplicada". Está
> **errado** — foi inferido da existência do arquivo, não verificado no banco. `DOC-002` §4 continua válido
> (o argumento se apoia no `exam_id NOT NULL` declarado no DDL), mas a tabela não está em produção.

**Consequência boa:** como nada foi aplicado, dá para corrigir o desenho antes de aplicar, de graça.

### 1.3 É a quarta ocorrência do mesmo padrão

| frente | especificado | código/DDL | em produção | consumidores |
|---|---|---|---|---|
| ADR-023 | sim | — | — | 0 de 11 fundações |
| DOC-001 | sim | escrito e testado | não | 0 |
| BILLING-001 | sim | escrito | **sim** (5 tabelas) | 0 |
| **FHIR 137–143** | sim | **DDL escrito** | **não** | 0 |

---

## 2. O princípio: identidade ≠ autenticação

| conceito | o que é | obrigatório? |
|---|---|---|
| **Pessoa** | fronteira dos dados e da titularidade | sempre |
| **Credencial** | o meio de entrar | **opcional** |
| **Representação** | vínculo com base legal, consentimento e prazo | quando não há credencial, ou por tutela |

Aos 18 anos: adiciona-se credencial, revoga-se a representação. **Nenhum dado se move.**

O modelo de conta-família não entrega isso: nele a maioridade obriga a **migrar** histórico clínico — quebra de
continuidade, reconsentimento e churn no pior momento. Para uma plataforma cuja tese é continuidade ao longo da
vida, é disqualificante.

---

## 3. Criar a Pessoa — por que criar, e não acomodar

O princípio de acomodar-antes-de-criar defende contra **abstração prematura**. Aplicá-lo a uma entidade que é
**base de outras** inverte-o: passa-se a simular a entidade fundamental pendurando colunas em algo que não é ela.

`profiles` hoje mistura três conceitos:

```
name · age_range · avatar_url                           → a PESSOA
cycle_length · last_period · height_cm · weight_goal_kg → dados clínicos DA pessoa
pref_* · whatsapp_number · last_seen_at · goals         → preferências de QUEM LOGA
```

Acomodar a Pessoa ali criaria linhas onde metade das colunas não significa nada — uma criança representada não
tem `last_seen_at` nem `pref_daily_reminder` — e faria `profiles` dono de dois conceitos, contra o ADR-023.

**O teste:** a coisa tem derivados? Pessoa é referenciada por **46 colunas em 37 tabelas**. É a entidade mais
fundamental da plataforma e hoje **não existe como entidade**. É o caso em que criar é o correto.

```sql
-- A PESSOA — domínio dono do fato (ADR-001). Existe com ou sem credencial.
create table public.subjects (
  id          uuid primary key,
  name        text,
  birth_date  date,          -- base da maioridade e da expiração de tutela
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Semeia com os ids ATUAIS: nenhuma das 46 colunas user_id muda de valor, nenhuma FK quebra.
insert into public.subjects (id, name, avatar_url)
  select id, name, avatar_url from public.profiles;

-- profiles passa a ser o que sempre foi de fato: preferências de quem LOGA.
alter table public.profiles add column subject_id   uuid unique references public.subjects(id);
update      public.profiles set subject_id = id;
alter table public.profiles add column auth_user_id uuid unique references auth.users(id) on delete set null;
update      public.profiles set auth_user_id = id;
alter table public.profiles drop constraint profiles_id_fkey;
```

- quem loga → tem `subjects` **e** `profiles`
- quem é representado → tem `subjects` e **não tem** `profiles`

As colunas clínicas hoje em `profiles` são fatos **da pessoa** (uma criança representada tem altura). Movê-las é
correto, fica registrado, e **não entra neste passo** — é dado clínico e merece passo próprio e verificável.

---

## 4. CPF, RNDS e FHIR — reusar o que já está desenhado

Aqui o princípio se aplica na direção oposta: `party_identifiers` **já é** o modelo certo, conforme FHIR. Criar
uma coluna `cpf` em `subjects` seria o erro simétrico — fecharia um modelo que o FHIR define como aberto (0..*).

**A alteração é uma linha de FK.** Como 139 nunca foi aplicada, não há migração:

```sql
-- em vez de patients.user_id (identidade local do dono do registro):
create table public.patients (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  ...
);
```

`patients` é a **projeção FHIR** da Pessoa — é o que o próprio comentário da migration diz ("camada de
identidade projetável"). Isso respeita o ADR-001: o domínio (`subjects`) é dono do fato; a camada FHIR projeta.

**O que já está correto e não se toca:**

| requisito da fundadora | onde já está resolvido |
|---|---|
| conta ligada a CPF | `party_identifiers.kind = 'cpf'` |
| adequação à RNDS | `party_identifiers.system` = URI oficial; `kind` é classificação interna |
| protocolo FHIR | `patients`/`practitioners`/`organizations` + Identifier 0..* |
| protocolo de validação de identidade | `verification_status ∈ (unverified, verified)` |
| CNS além do CPF | mesmo enum, sem mudança estrutural |
| estrangeiro sem CPF, recém-nascido | `kind = 'outro'` — modelo aberto degrada, não quebra |

**Só o CPF é único; CPF não é a identidade.** A identidade local (`subjects.id`) nunca é substituída por CPF ou
CNS — regra que a migration 139 já declara e que deve ser preservada. Acrescentar:

```sql
create unique index uq_party_identifiers_cpf
  on public.party_identifiers (value) where kind = 'cpf' and period_end is null;
```

**Validação do CPF** (dígitos verificadores) é pura e determinística → `packages/core`, alcançável pelo Mobile.
**Verificação de identidade** (provar que o CPF é daquela pessoa) é serviço externo (gov.br/Serpro) e entra
depois — o modelo já a acomoda via `verification_status`, sem mudança de schema.

---

## 5. A representação

```sql
create table public.subject_representations (
  id                uuid primary key default gen_random_uuid(),
  subject_id        uuid not null references public.subjects(id) on delete cascade,
  representative_id uuid not null references public.subjects(id) on delete cascade,
  relation          text not null,   -- responsavel_legal | tutor | cuidador | familiar (ABERTO)
  legal_basis       text not null,   -- LGPD: base legal do tratamento
  scope             jsonb not null default '{}'::jsonb,
  consent_at        timestamptz,
  expires_at        timestamptz,     -- maioridade, prazo de tutela, compartilhamento temporário
  revoked_at        timestamptz,
  created_at        timestamptz not null default now(),
  check (subject_id <> representative_id)
);
```

Projeta para FHIR `RelatedPerson` quando a trilha FHIR for aplicada.

---

## 6. A função de acesso e a propriedade que torna isto seguro

```sql
create or replace function public.can_access_subject(subject uuid)
returns boolean language sql stable security definer as $$
  select
    -- caminho 1: os próprios dados — comportamento de HOJE, inalterado
    exists (select 1 from public.profiles p
             where p.subject_id = subject and p.auth_user_id = auth.uid())
    -- caminho 2: representação vigente
    or exists (
      select 1 from public.subject_representations r
        join public.profiles rep on rep.subject_id = r.representative_id
       where r.subject_id = subject
         and rep.auth_user_id = auth.uid()
         and r.revoked_at is null
         and (r.expires_at is null or r.expires_at > now()));
$$;
```

```sql
-- 162 políticas, mecanicamente:
using (auth.uid() = user_id)   →   using (public.can_access_subject(user_id))
```

**A propriedade:** enquanto `subject_representations` estiver vazia, `can_access_subject(x)` é **logicamente
idêntica** a `auth.uid() = x`. O caminho 2 avalia sobre tabela vazia e retorna falso; o caminho 1 reproduz a
regra atual.

- comportamento em produção **idêntico** no dia seguinte
- **verificável antes** de existir qualquer dado novo
- **reversível** — reverter as políticas restaura o estado anterior sem perda

Não é reescrita arriscada de segurança: é uma indireção que só passa a fazer algo quando a primeira
representação existir. **Exige teste que prove a equivalência antes de ir a produção. Sem essa prova, não se
aplica.**

---

## 7. O que isso faz com a cobrança

Cada pessoa com conta → cobrar por conta **já é** cobrar por pessoa. A escolha entre os modelos deixa de
existir. Sobra: **quem paga?**

```sql
alter table public.subscriptions add column payer_subject_id uuid references public.subjects(id);
-- null = a própria titular paga
```

`subscriptions.user_id` como chave primária **continua correto** — uma assinatura por pessoa. O modelo família
teria exigido `quantity` e faturas com item por sujeito; este não exige nada disso. **O modelo escolhido pela
fundadora é mais simples no schema do que a alternativa.**

Atende o B2B2C sem peça adicional: a empresa paga (`payer_subject_id`) e os dados do funcionário ficam na conta
dele — o empregador paga e **não** vê. No modelo família isso seria arquitetonicamente errado.

Escada de preço (1ª conta cheia, adicionais com desconto) é regra do pagador — não pede schema além desta
coluna. Decisão comercial em aberto, não bloqueia.

---

## 8. O esqueleto — ordem de dependência

```
1  IDENTIDADE   subjects · profiles vira conta · subject_representations · can_access_subject · RLS
                ↓ responde "de quem é este dado" — tudo depende disto

2  FHIR/RNDS    aplicar 137–143 com subject_id · party_identifiers · unicidade de CPF
                ↓ projeta a identidade; CPF e validação moram aqui

3  BILLING      payer_subject_id · mover para packages/core · ligar consumidores · telas

4  DOCUMENTOS   patient_documents · DocumentKind clinical_document · página · destino do Hub

5  COLOCAÇÃO    todo domínio em packages/core — transversal; Mobile não alcança src/lib
```

---

## 9. Custos que a fundadora assume

1. **Representação vira infraestrutura obrigatória** — base legal, consentimento, expiração, auditoria.
2. **Mais contas** — mais onboarding e mais fluxos de consentimento.
3. **O vínculo entre contas passa a ser o produto.** Se a costura for ruim, a pessoa sente que tem quatro apps
   em vez de uma plataforma. O CARE-002 deixa de ser visão e vira caminho crítico. **É o item a vigiar.**
4. **162 políticas reescritas** — mecânico, mas é a maior mudança estrutural desta fase.

---

## 10. Por que agora

Hoje: poucas contas, uma pessoa por conta, nenhuma representação, nenhum dado de terceiro, e as tabelas FHIR
**ainda não aplicadas**.

Depois de v1.0: usuários reais, dados clínicos de terceiros já criados sob o modelo errado, e a mesma mudança
passa a exigir migração de dado vivo + reconsentimento.

A janela para fazer isto barato é agora.

---

## 11. Gates

- Escrever migrations e testes de equivalência: **autônomo**.
- **Aplicar em produção: GATE C** — autorização explícita, com a prova de equivalência do §6 apresentada antes.
- Código começa **após a homologação da RC1** (feature freeze vigente).

---

## 12. Decisões pendentes

1. **Aprovar** identidade ≠ autenticação (§2), a criação de `subjects` (§3) e a reescrita das 162 políticas (§6).
2. **Aplicar as migrations 137–143** (trilha FHIR) corrigidas para `subject_id` — ou mantê-las fora por ora?
   Sem elas não há CPF nem RNDS.
3. **Escada de preço** para contas adicionais — construir agora ou registrar em aberto (não bloqueia).
