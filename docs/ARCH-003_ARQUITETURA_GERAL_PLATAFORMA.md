# ARCH-003 — Arquitetura Geral da Plataforma (referência principal)

**Objetivo:** consolidar, num só lugar, a arquitetura da SINTERA — a **referência principal** de arquitetura.
**Escopo:** princípios, mobile-first/API-first, camada observacional, SSOT, sincronização, módulos, visão de longo prazo,
diretrizes permanentes.
**Status:** Approved · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20) — consolidação.
**Dependências:** [[ADR-000]] (raiz) · [[ARCH-002]] · [[HIP-007]] · [[HIP-009]]. **Impacto:** governa todos os módulos.

## 1. Princípios arquiteturais (raiz)
Sob [[ADR-000]] (constitucional, 14 princípios) e princípios do pipeline: Modelo Aberto, Convergência Progressiva,
Rastreabilidade, Validação entre Camadas, Reprodutibilidade, Não-produção de conteúdo clínico (RDC 657), Privacidade/
Segurança/Compliance by design ([[compliance_001_fase0_gate]]), datas determinísticas ([[date_001_temporal_ssot]]).

## 2. Mobile-First ([[ARCH-002]])
App móvel = **produto principal e experiência principal**; web = interface complementar (administrativo, revisão de
documentos, uso profissional). Toda função nasce no mobile. Fluxo **Mobile → API → Web**.

## 3. API-First ([[ARCH-002]])
**Nada existe só na web.** Toda capacidade = **serviço de backend (API)** versionado, consumido pelo app e pela web.
Backend **desacoplado da interface**; sem regra de negócio na tela; contratos únicos no monorepo (`@sintera/core`).

## 4. Arquitetura Observacional ([[HIP-007]])
Toda medida objetiva é uma **Observação** (entidade estrutural): valor + tempo + origem + dispositivo + confiabilidade +
qualidade + contexto. Distinta de Evento Assistencial (encontro), Documento/Laudo e UCDA (evidência). Domínios funcionais
espelham a Sidebar ([[sidebar_ssot_taxonomia]]). **Observação ≠ Indicador** (indicador é derivado).

## 5. SSOT e projeções
**SSOT bruto imutável + idempotente + versionado**; **reconciliação na projeção, nunca no bruto**; projeções recompõem
(self-healing). Domínio dono do fato; outros projetam/referenciam, nunca duplicam ([[adr_001_projecao_ssot]]).

## 6. Sincronização ([[HIP-009]])
Pull (web/fabricante), push (mobile/capacidades nativas), batch/stream (agregador) → mesma ingestão canônica. Idempotência
por chave determinística; cursores por (usuário×fonte×dispositivo); equivalência/precedência por confiabilidade;
rastreabilidade ponta a ponta; offline-first.

## 7. Módulos da plataforma
Ver [[CATALOGO_PLATAFORMA]] (catálogo completo). Núcleo: Timeline · Observações/Monitoramento · Exames/Documentos ·
Agenda · Medicamentos/Suplementos · Integrações · Indicadores · Compartilhamento · Perfil/Config. Pilares transversais:
NOV-001 (novidade), NOTIF-001 (notificações), HUB-001 (captura), CARE-001 (Rede de Cuidado), BILLING-001.

## 8. Visão de longo prazo
Sistema cognitivo clínico ([[visao_sistema_cognitivo_clinico]]): LLM = interface, não cérebro; inteligência longitudinal
(V3) sobre Observações; convergência à UCDA sem migração prematura. Expansão **sem revisão estrutural**.

## 9. Diretrizes permanentes
Mobile-first · API-first · Observacional universal · SSOT · rastreabilidade · compartilhamento web↔mobile · governança de
ações destrutivas (aprovação explícita pós-Preview — [[governanca_aprovacao_acao_destrutiva]]) · reúso antes de abstração
([[principio_estabilidade_arquitetural]]). Toda decisão futura deve **fortalecer** estas diretrizes.
