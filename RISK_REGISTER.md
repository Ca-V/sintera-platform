# RISK_REGISTER — Registro de Riscos (SINTERA)

Documento **permanente** (fundadora, 2026-07-31). Consolida riscos conhecidos por **categoria**, tirando-os da
dispersão do backlog. Estados: **Aberto** (sem mitigação ativa) · **Monitorado** (aceito/vigiado) · **Mitigado**
(controle em vigor) · **Fechado**. Atualizar a cada incremento e na **baseline** ([BASELINE_PROJETO.md](BASELINE_PROJETO.md)).

Categorias: Arquitetura · Mobile · Infraestrutura · Segurança · Regulatório · Dependências externas · Distribuição.

| ID | Categoria | Risco | Estado | Mitigação / Referência |
|----|-----------|-------|--------|------------------------|
| R-001 | Distribuição / Segurança | Reputação do APK (AVG/Avast `APK:CloudRep [Susp]`) — falso positivo em sideload | **Aberto** | Tratar antes de distribuição ampla: VirusTotal · confirmar assinatura release · pedir revisão AVG/Avast. [BACKLOG_MOBILE §Distribuição](docs/BACKLOG_MOBILE.md) · [MOBILE-021 §2](docs/MOBILE-021_INCREMENTO3_ACEITE.md) |
| R-002 | Infraestrutura / Distribuição | Dependência do **EAS Build** (fila grátis ~1h40; cota mensal) para homologação | **Monitorado** | Validar **por incremento** (lote), não por commit; editar/typecheck/testar são locais e ilimitados. [MOBILE-015 §Política de Validação](docs/MOBILE-015_ROADMAP_INCREMENTOS.md) |
| R-003 | Infraestrutura | Build de **release em monorepo** (REL-001) — falha do `assembleRelease` no Windows local | **Monitorado** | Não afeta nuvem-first (EAS Linux builda); resolver antes de distribuição às lojas. [REL-001](docs/REL-001_RELEASE_BUNDLE_MONOREPO.md) |
| R-004 | Arquitetura | **Duas versões de React** (Web 19.2.x × Mobile 19.1.0) — alias temporário no Metro (ADR-016) | **Monitorado** | Guarda de instância única; reavaliar/remover na convergência de versões. [ADR-016] |
| R-005 | Dependências externas | **CMake/toolchain** (bug de MAX_PATH do ninja no Windows) — pin condicional + remoção ativa | **Mitigado** | Pin só no Windows; Linux/EAS usa CMake padrão. [MOBILE-010 §3.3](docs/MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md) |
| R-006 | Regulatório | Exibir "resultado interpretado"/diagnóstico/risco (violaria RDC 657 / REG-001) | **Mitigado** | Fronteira factual: só lista/organiza/documento original; testes de fronteira estáticos por tela (`profile-boundary`, futuro `exams-boundary`). [REG-001] |
| R-007 | Segurança / Regulatório | Segredos/credenciais (chave Supabase, keystore, `.env`) | **Mitigado** | `.env` gitignored; anon key pública (RLS); keystore gerenciada na nuvem (EAS); `EXPO_PUBLIC_*` via `eas env:set`; `.env.example` versionado sem valores. [MOBILE-003 §3.1] |
| R-008 | Arquitetura / Mobile | **Divergência Web↔Mobile** (paridade) — a Web ainda não consome o `@sintera/api-client` | **Monitorado** | Reutilizar contratos/validações/regras via `@sintera/*` ([PARIDADE_WEB_MOBILE](docs/PARIDADE_WEB_MOBILE.md)). **Critério de encerramento:** Web **e** Mobile usando a MESMA camada compartilhada (`@sintera/api-client`) para **todos os domínios da Onda 1**, **sem duplicação** de lógica de acesso à API. |

> Novos riscos: adicionar linha com ID sequencial, categoria, estado e mitigação/referência. Riscos Fechados
> permanecem no registro (histórico auditável), marcados como **Fechado** com a data.
