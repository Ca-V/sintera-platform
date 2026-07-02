# SINTERA — Invariantes do Domínio (DOMAIN_INVARIANTS)

**Status:** Etapa 4 do fechamento do Domain Model (fundadora, 02/07/2026). Regras que **nunca** podem ser violadas — em qualquer contexto, tela, API ou versão. Base para validação, testes e revisão de PRs.
**Referencia:** `SCIENTIFIC_DOMAIN_MODEL.md`, `DOMAIN_BEHAVIORS.md`, `DOMAIN_EVENTS.md`, `CATALOG_SINGLE_SOURCE_OF_TRUTH.md`.

---

## Identidade e Catálogo (SSOT)
- **Sempre:** um Biomarcador pertence a exatamente um Catálogo (`catalog_id` único).
- **Sempre:** toda nomenclatura (nome, painel, material, aliases, unidade, ordenação, ícone) vem do Catálogo.
- **Nunca:** uma tela, API ou a IA define nome/painel/material/aliases próprios.
- **Sempre:** séries longitudinais e agrupamentos usam `catalog_id` — **nunca** o nome (não fragmentar por "Glicose/Glicemia/Glicose sérica").

## Medição e Exame
- **Sempre:** uma Medição pertence a exatamente um Biomarcador e um Exame.
- **Sempre:** o dado bruto do laudo (valor/unidade/data/referência) é **imutável**; curadoria/catálogo **reprojetam**, nunca reescrevem.
- **Sempre:** comparabilidade só entre Medições de unidade/método coerentes; caso contrário, "série não comparável" é declarado (não escondido).
- **Sempre:** a Referência é factual e com proveniência (laudo/documental/ausente).

## Evento e Timeline
- **Sempre:** um Exame é um Evento; um Evento pertence a uma Timeline (uma por paciente).
- **Sempre:** projeções (Evolução/Dashboards/Índice/Comparações) são **deriváveis** de Medições + Catálogo e **recomputáveis** — nunca a fonte da verdade.

## Documentos e IA
- **Sempre:** todo Documento possui trilha de auditoria.
- **Sempre:** a IA **nunca altera o documento original** (substituição = nova versão; original preservado).
- **Nunca:** a IA produz conclusão clínica, diagnóstico, recomendação de tratamento ou classificação de risco.
- **Sempre:** documento duplicado é detectado e **não** gera Exame/Medições novos.

## Governança Científica (produto)
- **Nunca:** a plataforma usa termos de juízo clínico (estável/normal/alterado/melhor/pior/saudável/risco/sugere…). Ver `UI_LANGUAGE_STANDARD.md`.
- **Sempre:** diretrizes/protocolos/evidências são **referenciados/organizados**, nunca aplicados como decisão.
- **Sempre:** avisos da IA proativa são factuais ("exame novo", "diferença em relação ao anterior", "diretriz atualizada") — nunca prescritivos.

## Auditoria e Consistência
- **Sempre:** operações críticas terminam em `AuditRecorded` (autor/data/versão/ação).
- **Sempre:** ausência de `catalog_id` em biomarcador catalogável é **registrada/logada** (pendência de cobertura), **nunca** tratada com fallback silencioso.
- **Sempre:** mudança estrutural tem ADR correspondente (`ARCHITECTURAL_DECISIONS.md`).

---
**Uso:** estas invariantes viram **critérios de teste e de revisão de PR**. Violação = bug de domínio, não escolha de estilo. Nova invariante entra aqui antes de virar código.
