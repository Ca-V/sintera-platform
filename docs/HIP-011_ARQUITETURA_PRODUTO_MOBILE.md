# HIP-011 — Arquitetura do Produto Mobile (referência Produto · UX · Engenharia)

**Status:** Approved · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20) criação. Referência conjunta (Produto/UX/
Engenharia). Sob [[ADR-000]] · [[ARCH-002]] (mobile-first). Descreve a **experiência**, não só engenharia.

## 1. Experiência principal
O app é o **companheiro diário de saúde** da usuária: **"sua história de saúde, viva, sem trabalho"**. Ele mostra o que
a SINTERA organizou por ela (Observações que chegam sozinhas — [[HIP-007]]), permite registrar com fricção mínima
([[hub_001_registration_hub]]) e mantém a continuidade da história. **Factual, nunca interpretativo** (RDC 657 —
[[principio_nao_producao_conteudo_clinico]]): apresenta e organiza, não conclui.

## 2. Navegação (espelha a taxonomia da Sidebar — [[sidebar_ssot_taxonomia]])
**Bottom tab bar** (padrão móvel), mapeando os domínios de 1º nível já definidos:
| Tab | Papel |
|---|---|
| **Início** | resumo do dia + timeline recente + avisos de novidade (NOV-001) |
| **Minha Saúde** | Observações/Monitoramento · Composição · Medicamentos · Exames/Documentos |
| **＋ Registrar** | captura central (documento/foto/manual) — ação primária destacada |
| **Agenda** | consultas, lembretes, próximas ações |
| **Perfil** | conta, conexões/dispositivos, notificações, config |
Sem taxonomia paralela: os rótulos vêm da Sidebar. **Rede de Cuidado** entra sob Perfil/Início quando ativa.

## 3. Jornada diária
- **Manhã:** sync noturno já trouxe sono/HRV/FC → **Início** mostra "sua história cresceu" (NOV-001, reconhecimento
  natural ao ver). Sem trabalho da usuária.
- **Ao longo do dia:** notificações contextuais (lembrete de medicamento, exame a agendar) — factuais, por categoria.
- **Registrar:** foto de um exame/documento em segundos (fila offline → sincroniza depois).
- **Semana:** indicadores longitudinais (derivados das Observações — nunca a própria observação) aparecem quando há
  base suficiente.

## 4. Hierarquia de funcionalidades
- **Primárias (diárias):** Início/timeline · Monitoramento (Observações) · Registrar.
- **Secundárias (frequentes):** Exames/Documentos · Agenda · Medicamentos/Suplementos.
- **Terciárias (eventuais):** Perfil/config · Conexões · Compartilhamento (Rede de Cuidado) · Relatórios.
A hierarquia guia densidade visual, posição na navegação e o que ganha push.

## 5. Princípios de UX
1. **Sem trabalho:** o valor chega sozinho; a usuária reconhece, não opera (NOV-001, sem botão artificial de dispensar).
2. **Factual e rastreável:** todo dado tem origem/dispositivo/versão visíveis sob demanda ([[principio_ui_rastreavel]]).
3. **Calmo e pessoal:** paleta Van Gogh/Almond Blossom ([[branding_paleta_v3_vangogh]]); sem alarmismo clínico.
4. **Fricção mínima na captura** ([[hub_001_registration_hub]]): intenção antes do mecanismo.
5. **Acessibilidade** desde o início ([[tema_g_acessibilidade]]): contraste, labels, foco, toque.
6. **Consistência web↔app:** mesmos conceitos/nomes (contratos compartilhados — [[ARCH-002]]).

## 6. Estados offline (offline-first)
- **Leitura:** o que já sincronizou fica disponível offline (cache local).
- **Captura/registro:** enfileirado localmente; envia quando houver rede (idempotente — [[HIP-009]]).
- **Indicador de sincronização** discreto (última sync, pendências) sem ansiedade.
- **Degradação graciosa:** nunca bloquear a leitura por falta de rede; nunca perder um registro feito offline.

## 7. Comportamento das notificações
- **Fonte de novidade:** NOV-001 (o que chegou e ainda não foi visto) → some naturalmente ao ver.
- **Canais e categorias:** NOTIF-001 ([[notif_001_infraestrutura_unica]]) — usuária escolhe por **categoria** (domínios
  da Sidebar) o canal (push/email/WhatsApp/nenhum). Push é 1º cidadão no mobile.
- **Contextual, não intrusivo:** lembretes factuais (medicamento, exame a agendar); **nunca** interpretação clínica.
- **Silenciável por categoria**; respeita horários.

## 8. Evolução do MVP ao produto completo
| Fase | Entrega |
|---|---|
| **MVP** | auth · Apple Health/Health Connect (capacidades nativas) · sincronização · Início/timeline mínima |
| **Experiência principal** | Timeline completa · Exames/Documentos · Perfil · Agenda |
| **Aquisição ampliada** | conectores externos · atividade física · dispositivos médicos |
| **Inteligência** | indicadores longitudinais · notificações inteligentes · IA contextual ([[visao_sistema_cognitivo_clinico]]) |
Cada fase adiciona módulos sobre a **mesma base** (monorepo, Observação, API-first) — **sem reconstrução**.

## 9. Relação com engenharia
Deriva de [[HIP-008]] (stack/arquitetura do app) e [[HIP-009]] (sincronização); consome [[HIP-007]] (Observação). O
**Plano Executivo da Etapa 4** ([[HIP-010]]) organiza a construção por ondas de valor coerentes com esta experiência.
