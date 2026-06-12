# CI — Migrações automáticas no merge para o `main`

O workflow `.github/workflows/migrations.yml` aplica as migrações de
`supabase/migrations/` ao projeto de produção sempre que um PR com mudanças de
migração é mergeado no `main`. Depois de configurado, **você nunca mais precisa
colar SQL no SQL Editor** — basta mergear.

## Configuração (uma vez) — 2 segredos no GitHub

No GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
Crie os dois:

| Nome do segredo | Onde obter |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens → **Generate new token** |
| `SUPABASE_DB_PASSWORD` | Supabase → Project Settings → **Database** → senha do banco (a que você definiu ao criar o projeto; pode redefinir ali) |

O `project ref` (`pxiglvrgxooawetboglb`) já está no workflow — não é segredo.

## Como funciona

- Gatilho: `push` no `main` que toque em `supabase/migrations/**` (ex.: merge de PR).
- `supabase db push` aplica só as migrações **ainda não registradas** no projeto;
  as já aplicadas (001–022b) são puladas automaticamente.
- Também pode ser rodado à mão em **Actions → Aplicar migrações Supabase → Run workflow**.

## Importante — migrações idempotentes

Como algumas migrações novas (023/024) podem já ter sido aplicadas manualmente
sem registro no histórico, elas foram escritas de forma **idempotente**
(`if not exists`, `drop policy if exists`), para que o `db push` possa
re-aplicá-las sem erro. Mantenha esse padrão nas próximas.

## Primeiro uso

1. Cadastre os 2 segredos acima.
2. No próximo merge que inclua migração, o Action roda sozinho.
3. Acompanhe em **Actions**. Se a primeira execução reclamar de histórico
   divergente, me avise o log — pode ser necessário um `supabase migration repair`
   pontual.

## Segurança

- O token e a senha ficam como **segredos do GitHub** (não aparecem no código nem
  nos logs).
- O Action só roda a partir do `main` (após revisão/merge), não de branches
  arbitrárias.
