# MOBILE-035 — Smoke Test (15–20 min) · Gate de aptidão para a homologação v1.0

Roteiro **enxuto** para confirmar rapidamente que o APK está **apto** para a homologação completa (MOBILE‑033).
**Não substitui** o checklist — é um portão **GO / NO‑GO** antes de investir ~4h. Se qualquer item **crítico**
falhar, **PARE**: registre o defeito (MOBILE‑034), provavelmente é correção + nova build **antes** da homologação
completa.

**Build:** `c5104a24-b8b8-472b-be9e-e6e5c8d41635` · perfil `preview` · Branch `feat/mobile-inc4-perfil` · HEAD `13811d2`
**Device:** ______________ · **Data:** ____/____/____

| # | Fluvo crítico | Passo rápido | Esperado | OK? | Bloqueia? |
|---|---|---|---|:---:|:---:|
| S1 | Instalar & abrir | Instalar o APK e abrir | App abre sem crash na 1ª tela | ☐ | **NO‑GO** |
| S2 | Login (conexão) | Entrar com usuário real | Autentica e chega na Home (prova Supabase/env) | ☐ | **NO‑GO** |
| S3 | Navegação | Tocar nas 5 abas (Início/Acompanhamento/Documentos/Minha Saúde/Mais) | Cada aba abre sem travar | ☐ | **NO‑GO** |
| S4 | Ler exame | Documentos → Exames → abrir 1 exame | Lista carrega; detalhe abre com dados | ☐ | NO‑GO |
| S5 | Upload + análise | "Adicionar exame" → enviar 1 PDF pequeno | Cria e **abre o detalhe**; análise inicia (prova upload + ponte /analyze) | ☐ | NO‑GO |
| S6 | Escrita + regra | Agenda → "Novo evento" → salvar → **Concluir** | Aparece em Próximos; ao concluir vai para o Histórico | ☐ | NO‑GO |
| S7 | Projeção Histórico | Acompanhamento → Histórico de Saúde | O evento concluído aparece; planejado NÃO aparece | ☐ | GO‑com‑ressalva |
| S8 | Relatório + share | Mais → Relatórios → "Compartilhar" | Compila com dados; abre o compartilhamento nativo | ☐ | GO‑com‑ressalva |
| S9 | Ponte ômica | Exames → "Exames de ômica →" | A lista carrega (prova a ponte /api/omics via Bearer) | ☐ | GO‑com‑ressalva |
| S10 | Sessão/estabilidade | Force‑stop e reabrir | Reabre logado, sem crash | ☐ | NO‑GO |

## Veredito
- **Todos os NO‑GO = OK** → **GO**: o APK está apto → executar a homologação completa (MOBILE‑033).
- **Qualquer NO‑GO falhou** → **NO‑GO**: registrar o defeito, corrigir no ciclo e **rebuild** antes da homologação completa (não gastar ~4h com um build inapto).
- **GO‑com‑ressalva falhou** → seguir para a homologação completa, mas **anotar** — provavelmente é P1/P2 já esperado do backlog, a confirmar no MOBILE‑033.

> Objetivo do smoke test: **descobrir cedo** um problema que invalide o build (não abre, não loga, não conecta),
> economizando as ~4h da homologação completa. ~15–20 min.
